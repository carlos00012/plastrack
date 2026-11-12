/**
 * analytics.js — Núcleo analítico de PlasTrack
 * Funciones puras: filtrado, agregaciones, KPIs, correlación y exportación.
 * Al ser independientes del DOM, son fácilmente testeables.
 */

import { decimal, longDate } from './format.js';

export const REQUIRED_FIELDS = [
  'id', 'satelite', 'sensor', 'fecha', 'isla', 'zona', 'lat', 'lon',
  'nubosidad_pct', 'aptitud_pct', 'ndvi_promedio', 'area_km2',
  'temperatura_superficie_c', 'resolucion_m',
];

export const APTITUDE_THRESHOLD = 70;
export const EXCELLENT_THRESHOLD = 80;

/* ---------------------------------- Estadística ---------------------------------- */

export const sum = (values) => values.reduce((acc, v) => acc + v, 0);

export const mean = (values) => (values.length ? sum(values) / values.length : 0);

export const median = (values) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Coeficiente de correlación de Pearson. Devuelve 0 si no es calculable. */
export const pearson = (xs, ys) => {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i += 1) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
};

/** Regresión lineal simple y = m·x + b (para la línea de tendencia del scatter). */
export const linearRegression = (xs, ys) => {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  if (den === 0) return null;
  const slope = num / den;
  return { slope, intercept: my - slope * mx };
};

/* ---------------------------------- Validación ---------------------------------- */

export const validateRecords = (records) => {
  if (!Array.isArray(records)) throw new Error('El dataset debe ser un arreglo JSON.');
  if (records.length === 0) throw new Error('El dataset está vacío.');

  const issues = [];
  records.forEach((row, index) => {
    REQUIRED_FIELDS.forEach((field) => {
      if (row[field] === undefined || row[field] === null || row[field] === '') {
        issues.push(`Registro ${index + 1}: falta el campo "${field}".`);
      }
    });
    if (Number(row.nubosidad_pct) < 0 || Number(row.nubosidad_pct) > 100) {
      issues.push(`Registro ${index + 1}: nubosidad fuera de rango (0–100).`);
    }
    if (Number(row.aptitud_pct) < 0 || Number(row.aptitud_pct) > 100) {
      issues.push(`Registro ${index + 1}: aptitud fuera de rango (0–100).`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(row.fecha))) {
      issues.push(`Registro ${index + 1}: fecha con formato inválido (YYYY-MM-DD).`);
    }
  });

  return { valid: issues.length === 0, issues };
};

/* ---------------------------------- Filtrado ---------------------------------- */

export const filterRecords = (records, filters = {}) => {
  const { isla = 'all', satelite = 'all', desde = '', hasta = '' } = filters;
  return records.filter((row) => {
    if (isla !== 'all' && row.isla !== isla) return false;
    if (satelite !== 'all' && row.satelite !== satelite) return false;
    if (desde && row.fecha < desde) return false;
    if (hasta && row.fecha > hasta) return false;
    return true;
  });
};

/* ---------------------------------- Agregaciones ---------------------------------- */

export const groupBy = (records, key) =>
  records.reduce((acc, row) => {
    const group = row[key];
    (acc[group] ??= []).push(row);
    return acc;
  }, {});

export const byIsland = (records) => {
  const groups = groupBy(records, 'isla');
  return Object.entries(groups)
    .map(([isla, rows]) => ({
      isla,
      pasadas: rows.length,
      nubosidad: mean(rows.map((r) => r.nubosidad_pct)),
      aptitud: mean(rows.map((r) => r.aptitud_pct)),
      area: sum(rows.map((r) => r.area_km2)),
      ndvi: mean(rows.map((r) => r.ndvi_promedio)),
    }))
    .sort((a, b) => b.aptitud - a.aptitud);
};

export const byPlatform = (records) => {
  const groups = groupBy(records, 'satelite');
  return Object.entries(groups)
    .map(([satelite, rows]) => ({
      satelite,
      pasadas: rows.length,
      aptitud: mean(rows.map((r) => r.aptitud_pct)),
      nubosidad: mean(rows.map((r) => r.nubosidad_pct)),
    }))
    .sort((a, b) => b.pasadas - a.pasadas);
};

/** Serie temporal: promedio de métricas por fecha (orden ascendente). */
export const byDate = (records) => {
  const groups = groupBy(records, 'fecha');
  return Object.entries(groups)
    .map(([fecha, rows]) => ({
      fecha,
      pasadas: rows.length,
      nubosidad: mean(rows.map((r) => r.nubosidad_pct)),
      aptitud: mean(rows.map((r) => r.aptitud_pct)),
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
};

/* ---------------------------------- KPIs ---------------------------------- */

export const buildKpis = (records, baseline = records) => {
  const total = records.length;
  const totalBase = baseline.length || 1;

  const cloud = mean(records.map((r) => r.nubosidad_pct));
  const aptitude = mean(records.map((r) => r.aptitud_pct));
  const cloudBase = mean(baseline.map((r) => r.nubosidad_pct));
  const aptitudeBase = mean(baseline.map((r) => r.aptitud_pct));

  const suitable = records.filter((r) => r.aptitud_pct >= APTITUDE_THRESHOLD);
  const suitableRate = total ? (suitable.length / total) * 100 : 0;
  const suitableRateBase = (baseline.filter((r) => r.aptitud_pct >= APTITUDE_THRESHOLD).length / totalBase) * 100;

  const area = sum(records.map((r) => r.area_km2));
  const areaBase = sum(baseline.map((r) => r.area_km2));
  const islands = new Set(records.map((r) => r.isla)).size;
  const platforms = new Set(records.map((r) => r.satelite)).size;
  const ndvi = mean(records.map((r) => r.ndvi_promedio));

  return {
    total,
    totalBase: baseline.length,
    islands,
    platforms,
    cloud,
    cloudDelta: cloud - cloudBase,
    aptitude,
    aptitudeDelta: aptitude - aptitudeBase,
    suitable: suitable.length,
    suitableRate,
    suitableRateDelta: suitableRate - suitableRateBase,
    area,
    areaShare: areaBase ? (area / areaBase) * 100 : 0,
    areaAverage: total ? area / total : 0,
    ndvi,
  };
};

/* ---------------------------------- Insights ---------------------------------- */

export const buildInsights = (records) => {
  if (!records.length) return { headline: 'No hay registros con los filtros seleccionados.', items: [], correlation: 0 };

  const islands = byIsland(records);
  const dates = byDate(records);
  const correlation = pearson(
    records.map((r) => r.nubosidad_pct),
    records.map((r) => r.aptitud_pct),
  );

  const bestDate = [...dates].sort((a, b) => b.aptitud - a.aptitud)[0];
  const leader = islands[0];
  const clearest = [...records].sort((a, b) => a.nubosidad_pct - b.nubosidad_pct)[0];
  const cloudiest = [...records].sort((a, b) => b.nubosidad_pct - a.nubosidad_pct)[0];
  const bestPass = [...records].sort((a, b) => b.aptitud_pct - a.aptitud_pct)[0];
  const worstPass = [...records].sort((a, b) => a.aptitud_pct - b.aptitud_pct)[0];

  const half = Math.ceil(dates.length / 2);
  const firstHalf = mean(dates.slice(0, half).map((d) => d.aptitud));
  const secondHalf = mean(dates.slice(half).map((d) => d.aptitud));
  const trend = secondHalf - firstHalf;

  const items = [
    {
      title: `Mejor ventana: ${longDate(bestPass.fecha)}`,
      text: `${bestPass.isla} (${bestPass.zona}) alcanzó ${decimal(bestPass.aptitud_pct)}% de aptitud con ${decimal(bestPass.nubosidad_pct)}% de nubosidad.`,
    },
    {
      title: `Isla líder: ${leader.isla}`,
      text: `Promedio de ${decimal(leader.aptitud)}% de aptitud en ${leader.pasadas} pasada(s), sobre ${Math.round(leader.area)} km² cubiertos.`,
    },
    {
      title: trend >= 0 ? 'Tendencia al alza' : 'Tendencia a la baja',
      text: `La aptitud ${trend >= 0 ? 'mejora' : 'cae'} ${decimal(Math.abs(trend))} puntos entre la primera y la segunda mitad del periodo filtrado.`,
    },
    {
      title: 'Contraste de nubosidad',
      text: `De ${decimal(clearest.nubosidad_pct)}% (${clearest.isla}) a ${decimal(cloudiest.nubosidad_pct)}% (${cloudiest.isla}). La peor pasada fue ${worstPass.id} con ${decimal(worstPass.aptitud_pct)}% de aptitud.`,
    },
  ];

  const headline = `Con ${records.length} pasada(s), la aptitud promedio es ${decimal(mean(records.map((r) => r.aptitud_pct)))}% y la nubosidad ${decimal(mean(records.map((r) => r.nubosidad_pct)))}%. La mejor ventana de adquisición es ${longDate(bestDate.fecha)} (${decimal(bestDate.aptitud)}%).`;

  return { headline, items, correlation, bestDate, leader };
};

/* ---------------------------------- Exportación ---------------------------------- */

const CSV_COLUMNS = [
  ['id', 'ID'],
  ['fecha', 'Fecha'],
  ['hora_utc', 'Hora UTC'],
  ['isla', 'Isla'],
  ['zona', 'Zona'],
  ['satelite', 'Satélite'],
  ['sensor', 'Sensor'],
  ['lat', 'Latitud'],
  ['lon', 'Longitud'],
  ['nubosidad_pct', 'Nubosidad (%)'],
  ['aptitud_pct', 'Aptitud (%)'],
  ['ndvi_promedio', 'NDVI'],
  ['area_km2', 'Área (km²)'],
  ['temperatura_superficie_c', 'Temperatura superficial (°C)'],
  ['resolucion_m', 'Resolución (m)'],
];

export const toCsv = (records) => {
  const escape = (value) => {
    const text = String(value ?? '');
    return /[";\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const header = CSV_COLUMNS.map(([, label]) => escape(label)).join(';');
  const rows = records.map((row) => CSV_COLUMNS.map(([key]) => escape(row[key])).join(';'));
  return `\uFEFF${[header, ...rows].join('\r\n')}`;
};

export const statusOf = (aptitude) => {
  if (aptitude >= EXCELLENT_THRESHOLD) return { key: 'good', label: 'Óptima' };
  if (aptitude >= 60) return { key: 'mid', label: 'Aceptable' };
  return { key: 'low', label: 'Limitada' };
};
