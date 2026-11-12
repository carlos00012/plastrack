/**
 * validate-data.mjs — Verifica la integridad del dataset antes de publicar.
 * Uso: node scripts/validate-data.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateRecords } from '../assets/js/analytics.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data', 'data_copernicus_sample.json');

const records = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const { valid, issues } = validateRecords(records);

const ids = new Set();
const duplicated = records.filter((row) => {
  if (ids.has(row.id)) return true;
  ids.add(row.id);
  return false;
});

if (duplicated.length > 0) {
  issues.push(`Identificadores duplicados: ${duplicated.map((row) => row.id).join(', ')}`);
}

const fields = new Set(records.flatMap((row) => Object.keys(row)));
const expectedFields = 16;

if (fields.size !== expectedFields) {
  issues.push(`Se esperaban ${expectedFields} campos y se encontraron ${fields.size}.`);
}

if (issues.length > 0) {
  console.error(`✗ Dataset inválido (${issues.length} problema(s)):`);
  issues.forEach((issue) => console.error(`  · ${issue}`));
  process.exit(1);
}

console.log(`✓ Dataset válido: ${records.length} registros, ${fields.size} campos, sin duplicados.`);
