/**
 * stats.mjs — Métricas derivadas del dataset para la generación de documentos.
 * Reutiliza el mismo núcleo analítico del dashboard (single source of truth).
 */

import {
  byDate, byIsland, byPlatform, buildInsights, buildKpis,
  linearRegression, mean, pearson, statusOf,
} from '../../assets/js/analytics.js';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const stdDev = (values) => {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(values.reduce((acc, value) => acc + (value - avg) ** 2, 0) / (values.length - 1));
};

export const computeStats = (records) => {
  const kpis = buildKpis(records, records);
  const insights = buildInsights(records);
  const islands = byIsland(records);
  const platforms = byPlatform(records);
  const dates = byDate(records);

  const correlation = pearson(
    records.map((r) => r.nubosidad_pct),
    records.map((r) => r.aptitud_pct),
  );
  const regression = linearRegression(
    records.map((r) => r.nubosidad_pct),
    records.map((r) => r.aptitud_pct),
  );

  const monthlyMap = records.reduce((acc, row) => {
    const key = row.fecha.slice(0, 7);
    (acc[key] ??= []).push(row);
    return acc;
  }, {});

  const monthly = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rows]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        key,
        label: `${MONTHS[month - 1].charAt(0).toUpperCase()}${MONTHS[month - 1].slice(1)} ${year}`,
        short: MONTHS[month - 1].slice(0, 3),
        pasadas: rows.length,
        nubosidad: mean(rows.map((r) => r.nubosidad_pct)),
        aptitud: mean(rows.map((r) => r.aptitud_pct)),
        area: rows.reduce((acc, r) => acc + r.area_km2, 0),
      };
    });

  const sortedByAptitude = [...records].sort((a, b) => b.aptitud_pct - a.aptitud_pct);
  const bestPass = sortedByAptitude[0];
  const worstPass = sortedByAptitude[sortedByAptitude.length - 1];
  const equityGap = islands.length > 1
    ? islands[0].aptitud - islands[islands.length - 1].aptitud
    : 0;

  return {
    records,
    kpis,
    insights,
    islands,
    platforms,
    dates,
    monthly,
    correlation,
    regression,
    bestPass,
    worstPass,
    equityGap,
    stdCloud: stdDev(records.map((r) => r.nubosidad_pct)),
    stdAptitude: stdDev(records.map((r) => r.aptitud_pct)),
    suitable: records.filter((r) => r.aptitud_pct >= 70),
    statusOf,
  };
};
