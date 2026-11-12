/**
 * build-figures.mjs — Regenera las capturas usadas en los documentos.
 * Requiere el sitio en ejecución (npm run serve) y Chrome instalado.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIGURES = path.join(ROOT, 'docs', 'figuras');
const SITE = process.env.SITE_URL ?? 'http://localhost:8123';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].filter(Boolean);

const findChrome = () => {
  const found = CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error('No se encontró Chrome. Defina CHROME_PATH.');
  return found;
};

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

const main = async () => {
  fs.mkdirSync(FIGURES, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: ['--allow-file-access-from-files', '--force-color-profile=srgb'],
  });

  try {
    const desktop = await browser.newPage();
    await desktop.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1.5 });
    await desktop.goto(SITE, { waitUntil: 'networkidle0' });
    await wait(2500);
    await desktop.screenshot({ path: path.join(FIGURES, 'dashboard_preview.png') });
    await desktop.screenshot({ path: path.join(FIGURES, 'dashboard_full.png'), fullPage: true });

    const mobile = await browser.newPage();
    await mobile.setViewport({ width: 390, height: 900, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await mobile.goto(SITE, { waitUntil: 'networkidle0' });
    await wait(2500);
    await mobile.screenshot({ path: path.join(FIGURES, 'dashboard_movil.png') });

    const diagram = await browser.newPage();
    await diagram.setViewport({ width: 1600, height: 820, deviceScaleFactor: 1 });
    await diagram.goto(`file://${path.join(FIGURES, 'arquitectura.svg').replaceAll('\\', '/')}`, { waitUntil: 'load' });
    await diagram.screenshot({ path: path.join(FIGURES, 'arquitectura.png') });

    console.log('Figuras actualizadas en docs/figuras.');
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error('Error al generar las figuras:', error);
  process.exit(1);
});
