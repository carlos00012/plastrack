/**
 * charts.js — Capa de visualización (Chart.js 4)
 * Mantiene una instancia por canvas y las recrea al cambiar de tema o filtros.
 */

import { byDate, byIsland, byPlatform, linearRegression } from './analytics.js';
import { shortDate } from './format.js';

const charts = new Map();
let lastRecords = [];

const css = (name, fallback) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

const palette = () => ({
  ink: css('--ink', '#eaf6f4'),
  soft: css('--ink-soft', '#b8cfd4'),
  muted: css('--muted', '#86a2ac'),
  line: css('--line', 'rgba(255,255,255,.09)'),
  surface: css('--surface', '#0d2029'),
  accent: css('--accent', '#3ddc97'),
  accent2: css('--accent-2', '#4cc9f0'),
  warn: css('--warn', '#ffb703'),
  danger: css('--danger', '#ef476f'),
  good: css('--good', '#3ddc97'),
  mid: css('--mid', '#ffb703'),
  low: css('--low', '#ef476f'),
});

const withAlpha = (hex, alpha) => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const baseOptions = (colors) => ({
  responsive: true,
  maintainAspectRatio: false,
  locale: 'es-EC',
  animation: { duration: 450 },
  plugins: {
    legend: {
      labels: {
        color: colors.soft,
        font: { family: 'Inter, sans-serif', size: 11.5, weight: 500 },
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: colors.surface,
      titleColor: colors.ink,
      bodyColor: colors.soft,
      borderColor: colors.line,
      borderWidth: 1,
      padding: 11,
      cornerRadius: 10,
      titleFont: { family: 'Inter, sans-serif', size: 12, weight: 600 },
      bodyFont: { family: 'Inter, sans-serif', size: 12 },
      displayColors: true,
      usePointStyle: true,
    },
  },
  scales: {
    x: {
      grid: { color: colors.line, drawTicks: false },
      border: { display: false },
      ticks: { color: colors.muted, font: { size: 11 }, padding: 8 },
    },
    y: {
      grid: { color: colors.line, drawTicks: false },
      border: { display: false },
      ticks: { color: colors.muted, font: { size: 11 }, padding: 8 },
      beginAtZero: true,
    },
  },
});

/** Mensaje superpuesto cuando no hay datos que graficar. */
const emptyStatePlugin = {
  id: 'emptyState',
  afterDraw(chart, _args, options) {
    const hasData = chart.data.datasets.some((dataset) => dataset.data?.length);
    if (hasData) return;
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    ctx.save();
    ctx.fillStyle = options?.color ?? '#86a2ac';
    ctx.font = '500 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(options?.message ?? 'Sin datos para los filtros aplicados', chartArea.width / 2 + chartArea.left, chartArea.height / 2 + chartArea.top);
    ctx.restore();
  },
};

const destroy = (key) => {
  const chart = charts.get(key);
  if (chart) {
    chart.destroy();
    charts.delete(key);
  }
};

export const renderTrend = (records) => {
  const colors = palette();
  const series = byDate(records);
  const empty = colors.muted;
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;

  destroy('trend');
  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: series.map((d) => shortDate(d.fecha)),
      datasets: [
        {
          label: 'Nubosidad (%)',
          data: series.map((d) => Number(d.nubosidad.toFixed(1))),
          borderColor: colors.accent2,
          backgroundColor: withAlpha(colors.accent2, 0.16),
          pointBackgroundColor: colors.accent2,
          pointBorderColor: colors.surface,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2.4,
          tension: 0.38,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Aptitud del sensor (%)',
          data: series.map((d) => Number(d.aptitud.toFixed(1))),
          borderColor: colors.accent,
          backgroundColor: withAlpha(colors.accent, 0.12),
          pointBackgroundColor: colors.accent,
          pointBorderColor: colors.surface,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2.4,
          tension: 0.38,
          fill: true,
          yAxisID: 'y',
        },
      ],
    },
    options: {
      ...baseOptions(colors),
      interaction: { mode: 'index', intersect: false },
      plugins: {
        ...baseOptions(colors).plugins,
        legend: { ...baseOptions(colors).plugins.legend, position: 'top', align: 'end' },
        emptyState: { color: empty },
      },
      scales: {
        x: { ...baseOptions(colors).scales.x, ticks: { ...baseOptions(colors).scales.x.ticks, maxTicksLimit: 6, autoSkip: true } },
        y: {
          ...baseOptions(colors).scales.y,
          min: 0,
          max: 100,
          title: { display: true, text: 'Porcentaje (%)', color: colors.muted, font: { size: 11 } },
        },
      },
    },
    plugins: [emptyStatePlugin],
  });
  charts.set('trend', chart);
};

export const renderPlatforms = (records) => {
  const colors = palette();
  const data = byPlatform(records);
  const canvas = document.getElementById('platformChart');
  if (!canvas) return;

  destroy('platform');
  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: data.map((d) => d.satelite),
      datasets: [{
        data: data.map((d) => d.pasadas),
        backgroundColor: [colors.accent, colors.accent2, colors.warn, colors.danger],
        borderColor: colors.surface,
        borderWidth: 3,
        hoverOffset: 8,
      }],
    },
    options: {
      ...baseOptions(colors),
      cutout: '64%',
      plugins: {
        ...baseOptions(colors).plugins,
        legend: { ...baseOptions(colors).plugins.legend, position: 'bottom' },
        tooltip: {
          ...baseOptions(colors).plugins.tooltip,
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
              const share = ((ctx.parsed / total) * 100).toFixed(0);
              return ` ${ctx.label}: ${ctx.parsed} pasadas (${share}%)`;
            },
          },
        },
        emptyState: { color: colors.muted },
      },
      scales: {},
    },
    plugins: [emptyStatePlugin],
  });
  charts.set('platform', chart);
};

export const renderIslands = (records) => {
  const colors = palette();
  const data = byIsland(records);
  const canvas = document.getElementById('islandChart');
  if (!canvas) return;

  const colorFor = (value) => (value >= 80 ? colors.good : value >= 60 ? colors.mid : colors.low);

  destroy('island');
  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: data.map((d) => d.isla),
      datasets: [{
        label: 'Aptitud promedio (%)',
        data: data.map((d) => Number(d.aptitud.toFixed(1))),
        backgroundColor: data.map((d) => withAlpha(colorFor(d.aptitud), 0.75)),
        borderColor: data.map((d) => colorFor(d.aptitud)),
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 14,
      }],
    },
    options: {
      ...baseOptions(colors),
      indexAxis: 'y',
      plugins: {
        ...baseOptions(colors).plugins,
        legend: { display: false },
        emptyState: { color: colors.muted },
      },
      scales: {
        x: {
          ...baseOptions(colors).scales.x,
          min: 0,
          max: 100,
          ticks: { color: colors.muted, font: { size: 11 }, callback: (v) => `${v}%` },
        },
        y: {
          ...baseOptions(colors).scales.y,
          grid: { display: false },
          ticks: { color: colors.soft, font: { size: 11.5 } },
        },
      },
    },
    plugins: [emptyStatePlugin],
  });
  charts.set('island', chart);
};

export const renderScatter = (records) => {
  const colors = palette();
  const canvas = document.getElementById('scatterChart');
  if (!canvas) return;

  const points = records.map((r) => ({ x: r.nubosidad_pct, y: r.aptitud_pct, isla: r.isla, id: r.id }));
  const regression = linearRegression(points.map((p) => p.x), points.map((p) => p.y));
  const datasets = [{
    label: 'Pasadas',
    data: points,
    backgroundColor: points.map((p) => withAlpha(p.y >= 80 ? colors.good : p.y >= 60 ? colors.mid : colors.low, 0.8)),
    borderColor: points.map((p) => (p.y >= 80 ? colors.good : p.y >= 60 ? colors.mid : colors.low)),
    borderWidth: 1.5,
    pointRadius: 6,
    pointHoverRadius: 8,
  }];

  if (regression && points.length > 1) {
    const xs = points.map((p) => p.x);
    const min = Math.min(...xs);
    const max = Math.max(...xs);
    datasets.push({
      type: 'line',
      label: 'Tendencia',
      data: [
        { x: min, y: regression.slope * min + regression.intercept },
        { x: max, y: regression.slope * max + regression.intercept },
      ],
      borderColor: withAlpha(colors.accent2, 0.8),
      borderDash: [6, 6],
      borderWidth: 1.6,
      pointRadius: 0,
      fill: false,
    });
  }

  destroy('scatter');
  const chart = new Chart(canvas, {
    type: 'scatter',
    data: { datasets },
    options: {
      ...baseOptions(colors),
      plugins: {
        ...baseOptions(colors).plugins,
        legend: { display: false },
        tooltip: {
          ...baseOptions(colors).plugins.tooltip,
          callbacks: {
            label: (ctx) => {
              const raw = ctx.raw;
              if (!raw.isla) return `Tendencia: ${raw.y.toFixed(1)}%`;
              return ` ${raw.isla} (${raw.id}) · nubosidad ${raw.x}% · aptitud ${raw.y}%`;
            },
          },
        },
        emptyState: { color: colors.muted },
      },
      scales: {
        x: {
          ...baseOptions(colors).scales.x,
          min: 0,
          max: 100,
          title: { display: true, text: 'Nubosidad (%)', color: colors.muted, font: { size: 11 } },
        },
        y: {
          ...baseOptions(colors).scales.y,
          min: 0,
          max: 100,
          title: { display: true, text: 'Aptitud (%)', color: colors.muted, font: { size: 11 } },
        },
      },
    },
    plugins: [emptyStatePlugin],
  });
  charts.set('scatter', chart);
};

export const renderCharts = (records) => {
  lastRecords = records;
  renderTrend(records);
  renderPlatforms(records);
  renderIslands(records);
  renderScatter(records);
};

export const rerenderCharts = () => {
  if (lastRecords) renderCharts(lastRecords);
};
