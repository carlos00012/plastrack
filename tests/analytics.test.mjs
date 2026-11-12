/**
 * Pruebas del núcleo analítico de PlasTrack.
 * Ejecutar con: npm test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildKpis, byIsland, filterRecords, linearRegression, mean,
  pearson, statusOf, toCsv, validateRecords,
} from '../assets/js/analytics.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const records = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'data_copernicus_sample.json'), 'utf8'));

test('media aritmética de una serie simple', () => {
  assert.equal(mean([10, 20, 30]), 20);
  assert.equal(mean([]), 0);
});

test('correlación de Pearson perfecta e inversa', () => {
  assert.equal(pearson([1, 2, 3], [6, 4, 2]), -1);
  assert.equal(pearson([1], [1]), 0);
});

test('correlación del dataset es fuertemente negativa', () => {
  const r = pearson(
    records.map((row) => row.nubosidad_pct),
    records.map((row) => row.aptitud_pct),
  );
  assert.ok(r < -0.99, `Se esperaba r < -0.99, se obtuvo ${r}`);
});

test('regresión lineal devuelve pendiente negativa', () => {
  const model = linearRegression(
    records.map((row) => row.nubosidad_pct),
    records.map((row) => row.aptitud_pct),
  );
  assert.ok(model.slope < 0);
  assert.ok(Math.abs(model.slope + 1.2245) < 0.01);
});

test('filtro por isla devuelve tres registros de Isabela', () => {
  const result = filterRecords(records, { isla: 'Isabela' });
  assert.equal(result.length, 3);
  assert.ok(result.every((row) => row.isla === 'Isabela'));
});

test('filtro por plataforma devuelve cinco registros Sentinel-2B', () => {
  assert.equal(filterRecords(records, { satelite: 'Sentinel-2B' }).length, 5);
});

test('filtro por rango de fechas respeta los límites', () => {
  const result = filterRecords(records, { desde: '2026-05-01', hasta: '2026-05-31' });
  assert.equal(result.length, 2);
  assert.ok(result.every((row) => row.fecha >= '2026-05-01' && row.fecha <= '2026-05-31'));
});

test('KPIs globales coinciden con el dataset', () => {
  const kpis = buildKpis(records, records);
  assert.equal(kpis.total, 15);
  assert.equal(kpis.suitable, 8);
  assert.ok(Math.abs(kpis.cloud - 30.65) < 0.01);
  assert.ok(Math.abs(kpis.aptitude - 72.67) < 0.01);
  assert.ok(Math.abs(kpis.area - 6896.1) < 0.1);
  assert.equal(kpis.islands, 9);
  assert.equal(kpis.platforms, 3);
});

test('agrupación por isla: nueve islas y orden descendente', () => {
  const islands = byIsland(records);
  assert.equal(islands.length, 9);
  assert.equal(islands[0].isla, 'Baltra');
  for (let index = 1; index < islands.length; index += 1) {
    assert.ok(islands[index - 1].aptitud >= islands[index].aptitud);
  }
});

test('semáforo de aptitud en los tres umbrales', () => {
  assert.equal(statusOf(85).key, 'good');
  assert.equal(statusOf(68).key, 'mid');
  assert.equal(statusOf(59).key, 'low');
});

test('exportación CSV incluye encabezados y quince filas', () => {
  const csv = toCsv(records);
  const lines = csv.trim().split(/\r?\n/);
  assert.equal(lines.length, 16);
  assert.ok(lines[0].includes('Nubosidad (%)'));
  assert.ok(lines[0].includes('Temperatura superficial (°C)'));
});

test('validación de esquema acepta el dataset y detecta campos faltantes', () => {
  assert.equal(validateRecords(records).valid, true);

  const incomplete = structuredClone(records);
  delete incomplete[0].aptitud_pct;
  const result = validateRecords(incomplete);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.includes('aptitud_pct')));
});
