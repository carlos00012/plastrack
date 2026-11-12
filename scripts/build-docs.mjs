/**
 * build-docs.mjs — Genera el reporte técnico y la memoria en PDF y DOCX.
 *
 * Flujo:
 *   1. Lee el dataset y calcula las métricas con el mismo núcleo del dashboard.
 *   2. Construye el modelo de contenido (reporte y memoria).
 *   3. Renderiza HTML (portada y cuerpo), imprime PDF con Chrome y los une.
 *   4. Genera los DOCX equivalentes.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { PDFDocument } from 'pdf-lib';

import { computeStats } from './lib/stats.mjs';
import { renderBodyHtml, renderCoverHtml } from './lib/render-html.mjs';
import { buildDocx } from './lib/render-docx.mjs';
import { buildReport } from './content/report.mjs';
import { buildMemoria } from './content/memoria.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs');
const BUILD = path.join(DOCS, '_build');
const DATA = path.join(ROOT, 'data', 'data_copernicus_sample.json');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const findChrome = () => {
  const found = CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error('No se encontró Chrome. Defina la variable CHROME_PATH con la ruta al ejecutable.');
  }
  return found;
};

const footerTemplate = `
  <div style="width:100%; padding:0 18mm; font-family:Arial,Helvetica,sans-serif; font-size:8px; color:#7a929b; display:flex; justify-content:space-between;">
    <span>Universidad Técnica de Cotopaxi · Inteligencia de Negocios</span>
    <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
  </div>`;

const headerTemplate = `
  <div style="width:100%; padding:0 18mm; font-family:Arial,Helvetica,sans-serif; font-size:8px; color:#7a929b; display:flex; justify-content:space-between; border-bottom:0.5px solid #d7e5e9; padding-bottom:4px;">
    <span>PlasTrack · Unidad 1</span>
    <span>Dashboard de monitoreo satelital de Galápagos</span>
  </div>`;

const printPdf = async (browser, htmlFile, pdfFile, { cover = false } = {}) => {
  const page = await browser.newPage();
  await page.goto(`file://${htmlFile.replaceAll('\\', '/')}`, { waitUntil: 'load' });
  await page.emulateMediaType('print');

  await page.pdf({
    path: pdfFile,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: !cover,
    headerTemplate: cover ? '<span></span>' : headerTemplate,
    footerTemplate: cover ? '<span></span>' : footerTemplate,
    margin: cover
      ? { top: 0, right: 0, bottom: 0, left: 0 }
      : { top: '22mm', right: '18mm', bottom: '18mm', left: '18mm' },
  });

  await page.close();
};

const mergePdfs = async (coverFile, bodyFile, outputFile) => {
  const merged = await PDFDocument.create();
  const cover = await PDFDocument.load(fs.readFileSync(coverFile));
  const body = await PDFDocument.load(fs.readFileSync(bodyFile));
  const coverPages = await merged.copyPages(cover, cover.getPageIndices());
  coverPages.forEach((page) => merged.addPage(page));
  const bodyPages = await merged.copyPages(body, body.getPageIndices());
  bodyPages.forEach((page) => merged.addPage(page));
  merged.setTitle('PlasTrack · Documentación técnica');
  merged.setAuthor('Equipo PlasTrack');
  merged.setCreator('PlasTrack build-docs');
  fs.writeFileSync(outputFile, await merged.save());
};

const buildOne = async (browser, doc, baseName) => {
  const coverHtml = path.join(BUILD, `${baseName}_portada.html`);
  const bodyHtml = path.join(BUILD, `${baseName}_cuerpo.html`);
  const coverPdf = path.join(BUILD, `${baseName}_portada.pdf`);
  const bodyPdf = path.join(BUILD, `${baseName}_cuerpo.pdf`);
  const finalPdf = path.join(DOCS, `${baseName}.pdf`);
  const finalDocx = path.join(DOCS, `${baseName}.docx`);

  fs.writeFileSync(coverHtml, renderCoverHtml(doc), 'utf8');
  fs.writeFileSync(bodyHtml, renderBodyHtml(doc, { baseHref: `${pathToFileURL(DOCS).href}/` }), 'utf8');

  await printPdf(browser, coverHtml, coverPdf, { cover: true });
  await printPdf(browser, bodyHtml, bodyPdf);
  await mergePdfs(coverPdf, bodyPdf, finalPdf);
  await buildDocx(doc, finalDocx);

  const pdfKb = (fs.statSync(finalPdf).size / 1024).toFixed(0);
  const docxKb = (fs.statSync(finalDocx).size / 1024).toFixed(0);
  console.log(`✓ ${baseName}.pdf (${pdfKb} KB) y ${baseName}.docx (${docxKb} KB)`);
};

const main = async () => {
  fs.mkdirSync(BUILD, { recursive: true });

  const records = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const stats = computeStats(records);
  console.log(`Dataset: ${records.length} registros · nubosidad ${stats.kpis.cloud.toFixed(1)}% · aptitud ${stats.kpis.aptitude.toFixed(1)}%`);

  const report = buildReport(stats);
  const memoria = buildMemoria(stats);

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: ['--allow-file-access-from-files', '--force-color-profile=srgb'],
  });

  try {
    await buildOne(browser, report, 'Reporte_Tecnico_PlasTrack');
    await buildOne(browser, memoria, 'Memoria_de_Construccion');
  } finally {
    await browser.close();
  }

  console.log('Documentos generados en docs/.');
};

main().catch((error) => {
  console.error('Error al generar los documentos:', error);
  process.exit(1);
});
