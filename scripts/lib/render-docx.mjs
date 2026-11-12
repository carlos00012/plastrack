/**
 * render-docx.mjs — Renderiza el modelo de contenido a un archivo .docx.
 * Usa la biblioteca docx (OOXML) y mantiene una tipografía académica.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  AlignmentType, BorderStyle, Document, Footer, Header, ImageRun,
  PageBreak, PageNumber, Packer, Paragraph, ShadingType, Table,
  TableCell, TableRow, TextRun, WidthType, VerticalAlign, SectionType,
} from 'docx';

const FONT = 'Times New Roman';
const SANS = 'Arial';
const INK = '172A31';
const HEAD = '0B3B45';
const MUTED = '5D7D88';
const ACCENT = '0F7A58';

const BASE_SIZE = 21; // 10,5 pt (half-points)

const pngSize = (buffer) => ({
  width: buffer.readUInt32BE(16),
  height: buffer.readUInt32BE(20),
});

const parseInline = (text, { size = BASE_SIZE, color = INK, bold = false } = {}) => {
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return new TextRun({ text: part.slice(2, -2), bold: true, font: FONT, size, color });
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return new TextRun({ text: part.slice(1, -1), font: 'Consolas', size: size - 2, color, bold });
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return new TextRun({ text: part.slice(1, -1), italics: true, font: FONT, size, color, bold });
    }
    return new TextRun({ text: part, font: FONT, size, color, bold });
  });
};

const noBorders = {
  top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL },
  left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL },
  insideHorizontal: { style: BorderStyle.NIL }, insideVertical: { style: BorderStyle.NIL },
};

const paragraph = (text, options = {}) => new Paragraph({
  children: parseInline(text, options),
  alignment: options.alignment ?? AlignmentType.JUSTIFIED,
  spacing: { line: options.line ?? 336, after: options.after ?? 110, before: options.before ?? 0 },
  ...(options.keepNext ? { keepNext: true } : {}),
  ...(options.indent ? { indent: options.indent } : {}),
});

/* ─────────────────────────── Tablas ─────────────────────────── */

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: 'C9DADE' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C9DADE' },
  left: { style: BorderStyle.SINGLE, size: 4, color: 'C9DADE' },
  right: { style: BorderStyle.SINGLE, size: 4, color: 'C9DADE' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'C9DADE' },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'C9DADE' },
};

const alignValue = (align) => {
  if (align === 'center') return AlignmentType.CENTER;
  if (align === 'right') return AlignmentType.RIGHT;
  return AlignmentType.LEFT;
};

const buildTable = (block) => {
  const size = Math.round((block.fontSize ?? 8.4) * 2);
  const widths = block.widths ?? block.head.map(() => 100 / block.head.length);

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: block.head.map((cell, index) => new TableCell({
      width: { size: widths[index], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: 'E8F3F1', color: 'auto' },
      margins: { top: 70, bottom: 70, left: 80, right: 80 },
      verticalAlign: VerticalAlign.CENTER,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 10, color: HEAD },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: HEAD },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'C9DADE' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'C9DADE' },
      },
      children: [new Paragraph({
        alignment: alignValue(block.align?.[index]),
        spacing: { line: 240, after: 0 },
        children: parseInline(cell, { size, color: HEAD, bold: true }),
      })],
    })),
  });

  const bodyRows = block.rows.map((row) => new TableRow({
    cantSplit: true,
    children: row.map((cell, index) => new TableCell({
      width: { size: widths[index], type: WidthType.PERCENTAGE },
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
      verticalAlign: VerticalAlign.TOP,
      children: [new Paragraph({
        alignment: alignValue(block.align?.[index]),
        spacing: { line: 240, after: 0 },
        children: parseInline(cell, { size, color: INK }),
      })],
    })),
  }));

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: [headerRow, ...bodyRows],
  });

  const children = [];
  if (block.caption) {
    children.push(new Paragraph({
      spacing: { before: 180, after: 80, line: 260 },
      keepNext: true,
      children: parseInline(block.caption, { size: 17, color: HEAD, bold: true }),
    }));
  }
  children.push(table);
  if (block.note) {
    children.push(new Paragraph({
      spacing: { before: 60, after: 180, line: 240 },
      children: [new TextRun({ text: block.note, italics: true, font: FONT, size: 15, color: MUTED })],
    }));
  } else {
    children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  }
  return children;
};

/* ─────────────────────────── Bloques ─────────────────────────── */

const IMAGE_DIR = path.resolve('docs/figuras');

const buildFigure = (block) => {
  const file = path.join(IMAGE_DIR, path.basename(block.src));
  if (!fs.existsSync(file)) {
    return [new Paragraph({ children: [new TextRun({ text: `[Figura no disponible: ${block.src}]`, italics: true, color: MUTED })] })];
  }
  const data = fs.readFileSync(file);
  const { width: pxWidth, height: pxHeight } = pngSize(data);
  const targetWidth = Math.round(((block.width ?? 100) / 100) * 610);
  const targetHeight = Math.round((pxHeight / pxWidth) * targetWidth);

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 60 },
      keepNext: true,
      children: [new ImageRun({
        type: 'png',
        data,
        transformation: { width: targetWidth, height: targetHeight },
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 240 },
      children: [new TextRun({ text: block.caption, italics: true, font: FONT, size: 16, color: MUTED })],
    }),
  ];
};

const buildCallout = (block) => {
  const cell = new TableCell({
    shading: { type: ShadingType.CLEAR, fill: 'F0F8F6', color: 'auto' },
    margins: { top: 140, bottom: 140, left: 180, right: 160 },
    borders: {
      left: { style: BorderStyle.SINGLE, size: 20, color: '0F9D70' },
      top: { style: BorderStyle.NIL },
      bottom: { style: BorderStyle.NIL },
      right: { style: BorderStyle.NIL },
    },
    children: [
      ...(block.title ? [new Paragraph({
        spacing: { after: 40, line: 260 },
        children: [new TextRun({ text: block.title, bold: true, font: SANS, size: 17, color: '0B5F47' })],
      })] : []),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 300, after: 0 },
        children: parseInline(block.text, { size: 19 }),
      }),
    ],
  });

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [new TableRow({ cantSplit: true, children: [cell] })],
  }), new Paragraph({ spacing: { after: 120 }, children: [] })];
};

const buildCode = (block) => {
  const lines = block.text.split('\n');
  const runs = [];
  lines.forEach((line, index) => {
    runs.push(new TextRun({
      text: line,
      font: 'Consolas',
      size: 15,
      color: '123B46',
      break: index === 0 ? 0 : 1,
    }));
  });
  return [new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: 'F4F8F9', color: 'auto' },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'D7E5E9' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D7E5E9' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'D7E5E9' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'D7E5E9' },
    },
    spacing: { before: 80, after: 200, line: 240 },
    children: runs,
  })];
};

const buildBlocks = (blocks) => {
  const children = [];
  blocks.forEach((block) => {
    switch (block.type) {
      case 'h2':
        children.push(new Paragraph({
          spacing: { before: 320, after: 120, line: 300 },
          keepNext: true,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CFE0E4', space: 3 } },
          children: parseInline(block.text, { size: 27, color: HEAD, bold: true }),
        }));
        break;
      case 'h3':
        children.push(new Paragraph({
          spacing: { before: 220, after: 80, line: 280 },
          keepNext: true,
          children: parseInline(block.text, { size: 23, color: '14505C', bold: true }),
        }));
        break;
      case 'p':
        if (block.strongLead) {
          children.push(new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 336, after: 110 },
            children: [
              new TextRun({ text: block.strongLead, bold: true, font: FONT, size: BASE_SIZE }),
              new TextRun({ text: ` ${block.text}`, font: FONT, size: BASE_SIZE }),
            ],
          }));
        } else {
          children.push(paragraph(block.text));
        }
        break;
      case 'lead':
        children.push(paragraph(block.text, { size: 22 }));
        break;
      case 'ul':
        block.items.forEach((item) => {
          children.push(new Paragraph({
            children: parseInline(item),
            bullet: { level: 0 },
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 320, after: 60 },
            indent: { left: 360, hanging: 180 },
          }));
        });
        children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
        break;
      case 'ol':
        block.items.forEach((item, index) => {
          const runs = parseInline(item);
          runs.unshift(new TextRun({ text: `${index + 1}. `, bold: true, font: FONT, size: BASE_SIZE, color: ACCENT }));
          children.push(new Paragraph({
            children: runs,
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 320, after: 60 },
            indent: { left: 400, hanging: 220 },
          }));
        });
        children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
        break;
      case 'table':
        children.push(...buildTable(block));
        break;
      case 'figure':
        children.push(...buildFigure(block));
        break;
      case 'callout':
        children.push(...buildCallout(block));
        break;
      case 'formula':
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 140 },
          children: [new TextRun({ text: block.text, italics: true, font: FONT, size: 21, color: '0D2A33' })],
        }));
        break;
      case 'refs':
        block.items.forEach((item) => {
          children.push(new Paragraph({
            children: parseInline(item, { size: 18 }),
            alignment: AlignmentType.LEFT,
            spacing: { line: 280, after: 80 },
            indent: { left: 320, hanging: 320 },
          }));
        });
        break;
      case 'code':
        children.push(...buildCode(block));
        break;
      case 'pagebreak':
        children.push(new Paragraph({ children: [new PageBreak()] }));
        break;
      default:
        break;
    }
  });
  return children;
};

/* ─────────────────────────── Portada ─────────────────────────── */

const buildCover = (meta) => {
  const band = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [new TableRow({
      height: { value: 1700, rule: 'atLeast' },
      children: [
        new TableCell({
          width: { size: 62, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: '082A36', color: 'auto' },
          margins: { top: 260, bottom: 220, left: 300, right: 200 },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: 'PlasTrack', bold: true, font: SANS, size: 40, color: 'FFFFFF' })],
            }),
            new Paragraph({
              spacing: { after: 0 },
              children: [new TextRun({ text: 'OBSERVATORIO SATELITAL', font: SANS, size: 14, color: '9FC3C0' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 38, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: '082A36', color: 'auto' },
          margins: { top: 260, bottom: 220, left: 200, right: 300 },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'UNIDAD 1 · BI', bold: true, font: SANS, size: 15, color: '3DDC97' })],
          })],
        }),
      ],
    })],
  });

  const spacer = (after) => new Paragraph({ spacing: { after }, children: [] });

  return [
    band,
    spacer(700),
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: meta.institution.toUpperCase(), bold: true, font: SANS, size: 18, color: '0B5F47' })] }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: meta.faculty, font: SANS, size: 17, color: MUTED })] }),
    new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: meta.career, font: SANS, size: 17, color: MUTED })] }),
    new Paragraph({
      spacing: { after: 260 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '0F9D70', space: 1 } },
      children: [],
      indent: { right: 7600 },
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: meta.title.toLowerCase().includes('memoria') ? 'MEMORIA DE CONSTRUCCIÓN' : 'INFORME TÉCNICO · ACTIVIDAD COOPERATIVA', bold: true, font: SANS, size: 16, color: '0B7FAB' })],
    }),
    new Paragraph({
      spacing: { after: 180, line: 500 },
      children: [new TextRun({ text: meta.title, bold: true, font: FONT, size: 40, color: '082A36' })],
    }),
    new Paragraph({
      spacing: { after: 360, line: 300 },
      children: [new TextRun({ text: meta.subtitle, italics: true, font: FONT, size: 22, color: '41616C' })],
    }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'AUTORES', font: SANS, size: 13, color: '7D97A0' })] }),
    new Paragraph({ spacing: { after: 220, line: 280 }, children: [new TextRun({ text: meta.authors.join(' · '), font: FONT, size: 20, color: INK })] }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'ASIGNATURA', font: SANS, size: 13, color: '7D97A0' })] }),
    new Paragraph({ spacing: { after: 200, line: 280 }, children: [new TextRun({ text: meta.course, font: FONT, size: 20, color: INK })] }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'DOCENTE', font: SANS, size: 13, color: '7D97A0' })] }),
    new Paragraph({ spacing: { after: 0, line: 280 }, children: [new TextRun({ text: meta.teacher, font: FONT, size: 20, color: INK })] }),
    spacer(900),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        ...noBorders,
        top: { style: BorderStyle.SINGLE, size: 6, color: 'D7E5E9' },
      },
      rows: [new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorders,
            margins: { top: 160, bottom: 0, left: 0, right: 0 },
            children: [new Paragraph({
              spacing: { after: 0 },
              children: [new TextRun({ text: meta.city, font: SANS, size: 17, color: MUTED })],
            })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorders,
            margins: { top: 160, bottom: 0, left: 0, right: 0 },
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 0 },
              children: [new TextRun({ text: meta.date, font: SANS, size: 17, color: MUTED })],
            })],
          }),
        ],
      })],
    }),
  ];
};

/* ─────────────────────────── Documento ─────────────────────────── */

export const buildDocx = async (doc, outputPath) => {
  const header = new Header({
    children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D7E5E9', space: 4 } },
      children: [new TextRun({ text: doc.meta.runningHead, font: SANS, size: 14, color: '7A929B' })],
    })],
  });

  const footer = new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0 },
      children: [
        new TextRun({ text: 'Universidad Técnica de Cotopaxi · ', font: SANS, size: 14, color: '7A929B' }),
        new TextRun({ text: 'Página ', font: SANS, size: 14, color: '7A929B' }),
        new TextRun({ children: [PageNumber.CURRENT], font: SANS, size: 14, color: '7A929B' }),
        new TextRun({ text: ' de ', font: SANS, size: 14, color: '7A929B' }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: SANS, size: 14, color: '7A929B' }),
      ],
    })],
  });

  const sectionProperties = {
    page: {
      size: { width: 11906, height: 16838 },
      margin: { top: 1134, right: 1134, bottom: 1134, left: 1134, header: 567, footer: 567 },
    },
  };

  const document = new Document({
    creator: 'Equipo PlasTrack',
    title: doc.meta.title,
    description: doc.meta.subtitle,
    styles: {
      default: {
        document: {
          run: { font: FONT, size: BASE_SIZE, color: INK },
          paragraph: { spacing: { line: 336, after: 110 } },
        },
      },
    },
    sections: [
      {
        properties: { ...sectionProperties, type: SectionType.NEXT_PAGE },
        children: buildCover(doc.meta),
      },
      {
        properties: {
          ...sectionProperties,
          type: SectionType.NEXT_PAGE,
          page: { ...sectionProperties.page, pageNumbers: { start: 0 } },
        },
        headers: { default: header },
        footers: { default: footer },
        children: buildBlocks(doc.sections),
      },
    ],
  });

  const buffer = await Packer.toBuffer(document);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
};
