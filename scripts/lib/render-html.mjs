/**
 * render-html.mjs — Renderiza el modelo de contenido a HTML listo para impresión.
 * Se usa para generar los PDF con Chrome (puppeteer).
 */

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const inline = (text) => escapeHtml(text)
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  .replace(/`([^`]+)`/g, '<code class="inline">$1</code>');

const BASE_CSS = `
  @page { size: A4; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Times New Roman", "Liberation Serif", serif;
    font-size: 10.5pt;
    line-height: 1.55;
    color: #172a31;
    background: #ffffff;
  }
  p { margin: 0 0 8pt; text-align: justify; orphans: 3; widows: 3; hyphens: auto; }
  h2 {
    font-size: 13.5pt; line-height: 1.25; color: #0b3b45;
    margin: 20pt 0 8pt; padding-bottom: 3pt;
    border-bottom: 0.75pt solid #cfe0e4;
    page-break-after: avoid; break-after: avoid;
  }
  h3 {
    font-size: 11.5pt; line-height: 1.3; color: #14505c;
    margin: 13pt 0 5pt; page-break-after: avoid; break-after: avoid;
  }
  strong { color: #0d2a33; }
  em { font-style: italic; }
  ul, ol { margin: 0 0 9pt; padding-left: 17pt; }
  li { margin-bottom: 4pt; text-align: justify; }
  li::marker { color: #0f7a58; }
  table {
    width: 100%; border-collapse: collapse;
    font-size: 8.2pt; line-height: 1.35;
    margin: 0 0 12pt; page-break-inside: avoid; break-inside: avoid;
  }
  thead { display: table-header-group; }
  th {
    background: #e8f3f1; color: #0b3b45; font-weight: bold;
    text-align: left; padding: 4pt 4pt;
    border-top: 1pt solid #0b3b45;
    border-bottom: 0.75pt solid #0b3b45;
    vertical-align: bottom;
  }
  td { padding: 3.5pt 4pt; border-bottom: 0.4pt solid #c9dade; vertical-align: top; }
  tr { page-break-inside: avoid; }
  table.table--long { page-break-inside: auto; break-inside: auto; }
  table.table--long tr { page-break-inside: avoid; }
  .table-caption {
    font-size: 8.6pt; font-weight: bold; color: #0b3b45;
    margin: 10pt 0 4pt; page-break-after: avoid; break-after: avoid;
  }
  .table-note { font-size: 7.8pt; font-style: italic; color: #5d7d88; margin: -9pt 0 12pt; }
  figure { margin: 10pt 0 14pt; text-align: center; page-break-inside: avoid; break-inside: avoid; }
  figure img { display: block; margin: 0 auto; border: 0.4pt solid #d7e5e9; }
  figcaption { font-size: 8.3pt; font-style: italic; color: #4a6572; margin-top: 5pt; }
  blockquote.callout {
    margin: 8pt 0 10pt; padding: 8pt 10pt;
    background: #f0f8f6; border-left: 2.5pt solid #0f9d70;
    page-break-inside: avoid; break-inside: avoid;
  }
  blockquote.callout .callout-title {
    display: block; font-weight: bold; color: #0b5f47;
    font-size: 9pt; letter-spacing: 0.02em; margin-bottom: 3pt;
  }
  blockquote.callout p { margin: 0; font-size: 9.8pt; }
  .formula {
    text-align: center; font-style: italic; font-size: 10.5pt;
    margin: 8pt 0 11pt; color: #0d2a33;
  }
  .refs { padding-left: 0; list-style: none; margin: 0; }
  .refs li {
    font-size: 9.4pt; line-height: 1.42; text-align: left;
    padding-left: 16pt; text-indent: -16pt; margin-bottom: 6pt;
  }
  pre.code {
    font-family: "Consolas", "Courier New", monospace;
    font-size: 7.8pt; line-height: 1.35; white-space: pre-wrap;
    background: #f4f8f9; border: 0.4pt solid #d7e5e9;
    padding: 8pt 10pt; margin: 6pt 0 12pt;
    page-break-inside: avoid; color: #123b46;
  }
  code.inline {
    font-family: "Consolas", monospace; font-size: 8.6pt;
    background: #f0f6f7; padding: 0 2pt; border-radius: 2pt;
  }
  .pagebreak { page-break-after: always; break-after: page; }
  .lead { font-size: 11pt; }
  sup { font-size: 0.7em; }
`;

const COVER_CSS = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  body { font-family: "Times New Roman", "Liberation Serif", serif; color: #172a31; }
  .cover { width: 210mm; height: 297mm; display: flex; flex-direction: column; overflow: hidden; position: relative; }
  .band {
    height: 54mm; background: #082a36; color: #ffffff;
    padding: 16mm 22mm 0; position: relative; flex-shrink: 0;
  }
  .band::after {
    content: ""; position: absolute; left: 0; bottom: 0; width: 100%; height: 2mm;
    background: linear-gradient(90deg, #3ddc97, #4cc9f0);
  }
  .band-row { display: flex; align-items: center; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 4mm; }
  .brand svg { width: 16mm; height: 16mm; }
  .brand-name { font-family: "Arial", sans-serif; font-size: 20pt; font-weight: bold; letter-spacing: -0.01em; }
  .brand-sub { font-family: "Arial", sans-serif; font-size: 7.5pt; letter-spacing: 0.22em; color: #9fc3c0; text-transform: uppercase; margin-top: 1mm; }
  .band-tag {
    font-family: "Arial", sans-serif; font-size: 7.5pt; letter-spacing: 0.16em;
    color: #3ddc97; border: 0.4mm solid rgba(61,220,151,.45); border-radius: 6mm;
    padding: 2mm 4mm; text-transform: uppercase;
  }
  .body { padding: 18mm 22mm 14mm; display: flex; flex-direction: column; flex: 1; }
  .inst { font-family: "Arial", sans-serif; font-size: 9pt; font-weight: bold; letter-spacing: 0.13em; color: #0b5f47; text-transform: uppercase; margin: 0 0 2mm; }
  .fac, .career { font-family: "Arial", sans-serif; font-size: 9pt; color: #5d7d88; margin: 0 0 1mm; }
  .rule { height: 0.6mm; width: 34mm; background: linear-gradient(90deg,#0f9d70,#0b7fab); margin: 7mm 0 8mm; }
  .kicker { font-family: "Arial", sans-serif; font-size: 8pt; font-weight: bold; letter-spacing: 0.18em; color: #0b7fab; text-transform: uppercase; margin: 0 0 3mm; }
  h1 { font-size: 22pt; line-height: 1.16; letter-spacing: -0.015em; margin: 0 0 5mm; color: #082a36; }
  .subtitle { font-size: 11pt; font-style: italic; color: #41616c; margin: 0 0 10mm; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm 8mm; margin-top: 2mm; }
  .meta .item span { display: block; font-family: "Arial", sans-serif; font-size: 7pt; letter-spacing: 0.14em; text-transform: uppercase; color: #7d97a0; margin-bottom: 1.5mm; }
  .meta .item p { margin: 0; font-size: 10pt; line-height: 1.35; color: #17343d; }
  .meta .wide { grid-column: 1 / -1; }
  .foot {
    margin-top: auto; border-top: 0.4mm solid #d7e5e9; padding-top: 4mm;
    display: flex; justify-content: space-between;
    font-family: "Arial", sans-serif; font-size: 8.5pt; color: #5d7d88;
  }
`;

const coverHtml = (meta) => `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><title>${escapeHtml(meta.title)}</title>
<style>${COVER_CSS}</style></head>
<body>
  <div class="cover">
    <header class="band">
      <div class="band-row">
        <div class="brand">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="21" fill="none" stroke="#4cc9f0" stroke-width="1.6" opacity=".55"/>
            <ellipse cx="32" cy="32" rx="27" ry="10" fill="none" stroke="#4cc9f0" stroke-width="1.6" opacity=".8" transform="rotate(-28 32 32)"/>
            <circle cx="32" cy="32" r="9" fill="#3ddc97"/>
            <circle cx="54" cy="17" r="3.4" fill="#3ddc97"/>
          </svg>
          <div>
            <div class="brand-name">PlasTrack</div>
            <div class="brand-sub">Observatorio satelital</div>
          </div>
        </div>
        <div class="band-tag">Unidad 1 · BI</div>
      </div>
    </header>

    <div class="body">
      <p class="inst">${escapeHtml(meta.institution)}</p>
      <p class="fac">${escapeHtml(meta.faculty)}</p>
      <p class="career">${escapeHtml(meta.career)}</p>
      <div class="rule"></div>
      <p class="kicker">${meta.title.toLowerCase().includes('memoria') ? 'Memoria de construcción' : 'Informe técnico · Actividad cooperativa'}</p>
      <h1>${escapeHtml(meta.title)}</h1>
      <p class="subtitle">${escapeHtml(meta.subtitle)}</p>

      <div class="meta">
        <div class="item wide">
          <span>Autores</span>
          <p>${meta.authors.map(escapeHtml).join(' · ')}</p>
        </div>
        <div class="item">
          <span>Asignatura</span>
          <p>${escapeHtml(meta.course)}</p>
        </div>
        <div class="item">
          <span>Docente</span>
          <p>${escapeHtml(meta.teacher)}</p>
        </div>
      </div>

      <div class="foot">
        <span>${escapeHtml(meta.city)}</span>
        <span>${escapeHtml(meta.date)}</span>
      </div>
    </div>
  </div>
</body>
</html>`;

const blockHtml = (block) => {
  switch (block.type) {
    case 'h2':
      return `<h2 id="${escapeHtml(block.text.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}">${inline(block.text)}</h2>`;
    case 'h3':
      return `<h3>${inline(block.text)}</h3>`;
    case 'p': {
      const lead = block.strongLead ? `<strong>${inline(block.strongLead)}</strong> ` : '';
      return `<p>${lead}${inline(block.text)}</p>`;
    }
    case 'lead':
      return `<p class="lead">${inline(block.text)}</p>`;
    case 'ul':
      return `<ul>${block.items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`;
    case 'ol':
      return `<ol>${block.items.map((item) => `<li>${inline(item)}</li>`).join('')}</ol>`;
    case 'table': {
      const widths = block.widths ?? [];
      const cols = block.head.map((_, index) => `<col style="width:${widths[index] ?? 100 / block.head.length}%" />`).join('');
      const head = block.head.map((cell, index) => {
        const align = block.align?.[index];
        return `<th${align ? ` style="text-align:${align}"` : ''}>${inline(cell)}</th>`;
      }).join('');
      const rows = block.rows.map((row) => `<tr>${row.map((cell, index) => {
        const align = block.align?.[index];
        return `<td${align ? ` style="text-align:${align}"` : ''}>${inline(cell)}</td>`;
      }).join('')}</tr>`).join('');
      const longClass = block.long ? ' class="table--long"' : '';
      return `
        ${block.caption ? `<div class="table-caption">${inline(block.caption)}</div>` : ''}
        <table${longClass}><colgroup>${cols}</colgroup><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>
        ${block.note ? `<div class="table-note">${inline(block.note)}</div>` : ''}`;
    }
    case 'figure': {
      const width = block.width ?? 100;
      const alt = block.alt ?? block.caption.replace(/^Figura\s+\d+\.\s*/, '');
      return `
        <figure>
          <img src="${escapeHtml(block.src)}" style="width:${width}%" alt="${escapeHtml(alt)}" />
          <figcaption>${inline(block.caption)}</figcaption>
        </figure>`;
    }
    case 'callout':
      return `
        <blockquote class="callout">
          ${block.title ? `<span class="callout-title">${inline(block.title)}</span>` : ''}
          <p>${inline(block.text)}</p>
        </blockquote>`;
    case 'formula':
      return `<div class="formula">${inline(block.text)}</div>`;
    case 'refs':
      return `<ul class="refs">${block.items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`;
    case 'code':
      return `<pre class="code">${escapeHtml(block.text)}</pre>`;
    case 'pagebreak':
      return '<div class="pagebreak"></div>';
    default:
      return '';
  }
};

export const renderBodyHtml = (doc, { baseHref = '' } = {}) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  ${baseHref ? `<base href="${baseHref}" />` : ''}
  <title>${escapeHtml(doc.meta.title)}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  ${doc.sections.map(blockHtml).join('\n')}
</body>
</html>`;

export const renderCoverHtml = (doc) => coverHtml(doc.meta);
