/**
 * app.js — Controlador principal de PlasTrack
 * Orquesta estado, filtros, KPIs, tabla, mapa y gráficos.
 */

import {
  buildKpis, buildInsights, filterRecords, statusOf, toCsv, validateRecords,
} from './analytics.js';
import { decimal, km2, longDate, nf, pct, signed } from './format.js';
import { renderCharts, rerenderCharts } from './charts.js';
import { initMap, updateMap, toggleLayer, setMapTheme } from './map.js';
import { FALLBACK_RECORDS } from './fallback-data.js';

const DATA_URL = 'data/data_copernicus_sample.json';
const THEME_KEY = 'plastrack-theme';

const state = {
  records: [],
  filtered: [],
  filters: { isla: 'all', satelite: 'all', desde: '', hasta: '' },
  search: '',
  sort: { key: 'fecha', dir: 'asc' },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

/* ---------------------------------- Iconos ---------------------------------- */

const ICONS = {
  satellite: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 7l4 4-3 3-4-4 3-3z"/><path d="M8 10l-4 4 6 6 4-4"/><path d="M15 4l2-2 5 5-2 2"/><circle cx="6" cy="18" r="3"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6 9.5 4.25 4.25 0 0 0 7 18z"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  area: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 7l6-4 6 4 6-4v14l-6 4-6-4-6 4V7z"/><path d="M9 3v14M15 7v14"/></svg>',
};

/* ---------------------------------- Tema ---------------------------------- */

const applyTheme = (theme, { rerender = true } = {}) => {
  document.documentElement.dataset.theme = theme;
  const toggle = $('#themeToggle');
  if (toggle) {
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#07131a' : '#f2f7f9');
  setMapTheme(theme);
  if (rerender) rerenderCharts();
};

const initTheme = () => {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch { saved = null; }
  const preferred = saved
    ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  applyTheme(preferred, { rerender: false });
};

/* ---------------------------------- KPIs ---------------------------------- */

const kpiCard = ({ label, value, unit, sub, progress, icon }) => `
  <article class="kpi">
    <div class="kpi__top">
      <span class="kpi__label">${label}</span>
      <span class="kpi__icon" aria-hidden="true">${icon}</span>
    </div>
    <p class="kpi__value">${value}<span class="kpi__unit">${unit}</span></p>
    <p class="kpi__sub">${sub}</p>
    <div class="kpi__bar" role="presentation"><span style="width:${Math.max(2, Math.min(100, progress))}%"></span></div>
  </article>`;

const renderKpis = () => {
  const kpis = buildKpis(state.filtered, state.records);
  const filtered = state.filtered.length !== state.records.length;
  const container = $('#kpiGrid');

  const delta = (value, unit, lowerIsBetter = false) => {
    if (!filtered) return 'Referencia global del dataset';
    const good = lowerIsBetter ? value < 0 : value > 0;
    const cls = value === 0 ? '' : good ? 'up' : 'down';
    const arrow = value === 0 ? '=' : value > 0 ? '▲' : '▼';
    return `<b class="${cls}">${arrow} ${nf(Math.abs(value), 1)} ${unit}</b> vs. global`;
  };

  container.innerHTML = [
    kpiCard({
      label: 'Pasadas analizadas',
      value: nf(kpis.total),
      unit: '',
      icon: ICONS.satellite,
      sub: `${kpis.islands} islas · ${kpis.platforms} plataformas`,
      progress: (kpis.total / (kpis.totalBase || 1)) * 100,
    }),
    kpiCard({
      label: 'Nubosidad promedio',
      value: decimal(kpis.cloud),
      unit: '%',
      icon: ICONS.cloud,
      sub: delta(kpis.cloudDelta, 'pp', true),
      progress: kpis.cloud,
    }),
    kpiCard({
      label: 'Aptitud del sensor',
      value: decimal(kpis.aptitude),
      unit: '%',
      icon: ICONS.target,
      sub: delta(kpis.aptitudeDelta, 'pp'),
      progress: kpis.aptitude,
    }),
    kpiCard({
      label: 'Pasadas aptas',
      value: nf(kpis.suitable),
      unit: ` de ${kpis.total}`,
      icon: ICONS.check,
      sub: filtered
        ? `<b class="${kpis.suitableRateDelta >= 0 ? 'up' : 'down'}">${signed(kpis.suitableRateDelta, 1)} pp</b> vs. global`
        : `${pct(kpis.suitableRate, 0)} con aptitud ≥ 70%`,
      progress: kpis.suitableRate,
    }),
    kpiCard({
      label: 'Área monitoreada',
      value: km2(kpis.area),
      unit: 'km²',
      icon: ICONS.area,
      sub: `${km2(kpis.areaAverage)} km² por pasada · NDVI ${decimal(kpis.ndvi, 2)}`,
      progress: kpis.areaShare,
    }),
  ].join('');
};

/* ---------------------------------- Insights ---------------------------------- */

const renderInsights = () => {
  const { headline, items, correlation } = buildInsights(state.filtered);
  $('#headlineInsight').textContent = headline;

  const list = $('#insightList');
  list.innerHTML = items.map((item) => `
    <li><strong>${item.title}</strong><span>${item.text}</span></li>
  `).join('');

  const badge = $('#corrBadge');
  const r = Number.isFinite(correlation) ? correlation : 0;
  badge.textContent = `r = ${r.toFixed(2)}`;
  const strength = Math.abs(r) >= 0.9 ? 'muy fuerte' : Math.abs(r) >= 0.7 ? 'fuerte' : Math.abs(r) >= 0.4 ? 'moderada' : 'débil';
  badge.title = `Correlación ${strength} ${r < 0 ? 'negativa' : 'positiva'}: a mayor nubosidad, ${r < 0 ? 'menor' : 'mayor'} aptitud.`;
};

/* ---------------------------------- Tabla ---------------------------------- */

const getTableRows = () => {
  const term = state.search.trim().toLowerCase();
  const rows = state.filtered.filter((row) => {
    if (!term) return true;
    return [row.id, row.isla, row.zona, row.satelite, row.sensor]
      .some((value) => String(value).toLowerCase().includes(term));
  });

  const { key, dir } = state.sort;
  const factor = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
    return String(va).localeCompare(String(vb), 'es') * factor;
  });
};

const renderTable = () => {
  const rows = getTableRows();
  const body = $('#tableBody');
  const empty = $('#tableEmpty');

  body.innerHTML = rows.map((row) => {
    const status = statusOf(row.aptitud_pct);
    return `
      <tr>
        <td><strong>${row.id}</strong></td>
        <td>${longDate(row.fecha)}<br /><span class="muted">${row.hora_utc} UTC</span></td>
        <td><strong>${row.isla}</strong><br /><span class="muted">${row.zona}</span></td>
        <td>${row.satelite}<br /><span class="muted">${row.sensor} · ${row.resolucion_m} m</span></td>
        <td class="num">${decimal(row.nubosidad_pct)}%</td>
        <td class="num"><strong>${decimal(row.aptitud_pct)}%</strong></td>
        <td class="num col-optional">${decimal(row.ndvi_promedio, 2)}</td>
        <td class="num">${km2(row.area_km2)}</td>
        <td class="num col-optional">${decimal(row.temperatura_superficie_c)} °C</td>
        <td><span class="flag flag--${status.key}">${status.label}</span></td>
      </tr>`;
  }).join('');

  empty.hidden = rows.length > 0;
  $$('#dataTable thead th').forEach((th) => {
    th.classList.toggle('is-sorted', th.dataset.sort === state.sort.key);
    const arrow = th.querySelector('.sort');
    if (arrow && th.dataset.sort === state.sort.key) {
      arrow.textContent = state.sort.dir === 'asc' ? '↑' : '↓';
    } else if (arrow) {
      arrow.textContent = '↕';
    }
    if (th.dataset.sort) {
      th.setAttribute('aria-sort', th.dataset.sort === state.sort.key
        ? (state.sort.dir === 'asc' ? 'ascending' : 'descending')
        : 'none');
    }
  });
};

/* ---------------------------------- Render global ---------------------------------- */

const renderAll = () => {
  state.filtered = filterRecords(state.records, state.filters);
  const total = state.records.length;
  $('#filterCount').textContent = `${state.filtered.length} de ${total} registros`;
  $('#lastUpdate').textContent = new Date().toLocaleDateString('es-EC', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  renderKpis();
  renderInsights();
  renderTable();
  updateMap(state.filtered);

  try {
    renderCharts(state.filtered);
  } catch (error) {
    console.error('[PlasTrack] No se pudieron renderizar los gráficos:', error);
  }
};

/* ---------------------------------- Filtros ---------------------------------- */

const populateFilters = () => {
  const islands = [...new Set(state.records.map((r) => r.isla))].sort((a, b) => a.localeCompare(b, 'es'));
  const platforms = [...new Set(state.records.map((r) => r.satelite))].sort((a, b) => a.localeCompare(b, 'es'));
  const dates = state.records.map((r) => r.fecha).sort();

  $('#filterIsla').insertAdjacentHTML('beforeend',
    islands.map((v) => `<option value="${v}">${v}</option>`).join(''));
  $('#filterSatelite').insertAdjacentHTML('beforeend',
    platforms.map((v) => `<option value="${v}">${v}</option>`).join(''));

  const from = $('#filterFrom');
  const to = $('#filterTo');
  [from, to].forEach((input) => {
    input.min = dates[0];
    input.max = dates[dates.length - 1];
  });
};

const readFilters = () => {
  const desde = $('#filterFrom').value;
  const hasta = $('#filterTo').value;
  if (desde && hasta && desde > hasta) {
    $('#filterFrom').value = hasta;
    $('#filterTo').value = desde;
  }
  state.filters = {
    isla: $('#filterIsla').value,
    satelite: $('#filterSatelite').value,
    desde: $('#filterFrom').value,
    hasta: $('#filterTo').value,
  };
  state.search = $('#tableSearch').value;
  renderAll();
};

const resetFilters = () => {
  $('#filterIsla').value = 'all';
  $('#filterSatelite').value = 'all';
  $('#filterFrom').value = '';
  $('#filterTo').value = '';
  $('#tableSearch').value = '';
  state.search = '';
  state.filters = { isla: 'all', satelite: 'all', desde: '', hasta: '' };
  renderAll();
};

/* ---------------------------------- Exportación ---------------------------------- */

const exportCsv = () => {
  const rows = getTableRows();
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `plastrack_pasadas_${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/* ---------------------------------- Eventos ---------------------------------- */

const bindEvents = () => {
  $('#themeToggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, next); } catch { /* modo privado */ }
    applyTheme(next);
  });

  $('#applyFilters').addEventListener('click', readFilters);
  $('#resetFilters').addEventListener('click', resetFilters);

  ['filterIsla', 'filterSatelite', 'filterFrom', 'filterTo'].forEach((id) => {
    $(`#${id}`).addEventListener('change', readFilters);
  });

  let searchTimer;
  $('#tableSearch').addEventListener('input', (event) => {
    clearTimeout(searchTimer);
    const value = event.target.value;
    searchTimer = setTimeout(() => {
      state.search = value;
      renderTable();
    }, 180);
  });

  $$('#dataTable thead th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      state.sort = {
        key,
        dir: state.sort.key === key && state.sort.dir === 'asc' ? 'desc' : 'asc',
      };
      renderTable();
    });
    th.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        th.click();
      }
    });
    th.tabIndex = 0;
  });

  $$('.chip[data-layer]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const active = toggleLayer(chip.dataset.layer);
      if (typeof active === 'boolean') {
        chip.classList.toggle('is-active', active);
        chip.setAttribute('aria-pressed', String(active));
      }
    });
  });

  $('#exportCsv').addEventListener('click', exportCsv);
};

/* ---------------------------------- Arranque ---------------------------------- */

const showFatalError = (message) => {
  const box = document.createElement('div');
  box.className = 'insight-bar';
  box.setAttribute('role', 'alert');
  box.innerHTML = `<span class="insight-bar__icon" aria-hidden="true">⚠️</span><p>${message}</p>`;
  $('#resumen')?.prepend(box);
  $('#filterCount').textContent = '0 de 0 registros';
  $('#kpiGrid').innerHTML = '';
  $('#insightList').innerHTML = '';
  $('#headlineInsight').textContent = message;
};

const init = async () => {
  initTheme();
  bindEvents();

  let data = null;
  try {
    const response = await fetch(DATA_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (error) {
    console.warn('[PlasTrack] No se pudo cargar JSON vía HTTP; usando datos de respaldo integrados:', error);
    data = FALLBACK_RECORDS;
  }

  if (Array.isArray(data) && data.length > 0) {
    const { valid, issues } = validateRecords(data);
    if (!valid) {
      console.warn('[PlasTrack] Incidencias de validación:', issues);
    }
    state.records = data;
    initMap(document.documentElement.dataset.theme);
    populateFilters();
    renderAll();
  } else {
    showFatalError(
      'No se pudo cargar data_copernicus_sample.json. Verifique que el sitio se sirva por HTTP(S) y que el archivo exista en /data.',
    );
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
