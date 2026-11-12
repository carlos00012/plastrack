/**
 * map.js — Capa geoespacial con Leaflet
 * Marcadores por pasada, mapa de calor de nubosidad y zonas de acumulación por isla.
 */

import { statusOf } from './analytics.js';
import { decimal, longDate } from './format.js';

const GALAPAGOS_CENTER = [-0.65, -90.55];

const state = {
  map: null,
  markers: null,
  heat: null,
  zones: null,
  tiles: null,
  records: [],
  visible: { markers: true, heat: true, zones: true },
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));

const tileUrl = () =>
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const fallbackTileUrl = () =>
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

const referenceUrl = () =>
  'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

const ATTRIBUTION =
  'Imágenes &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>, Maxar, Earthstar Geographics · Datos &copy; Copernicus';

export const initMap = (theme = 'dark') => {
  if (state.map) return state.map;
  if (typeof L === 'undefined') {
    console.warn('[PlasTrack] Leaflet (L) aún no está listo. Se reintentará...');
    setTimeout(() => {
      if (typeof L !== 'undefined' && !state.map) {
        initMap(theme);
        if (state.records?.length) updateMap(state.records);
      }
    }, 200);
    return null;
  }

  const map = L.map('map', {
    center: GALAPAGOS_CENTER,
    zoom: 8,
    minZoom: 5,
    maxZoom: 15,
    zoomControl: false,
    scrollWheelZoom: true,
    worldCopyJump: true,
  });

  const baseTiles = L.tileLayer(tileUrl(), {
    attribution: ATTRIBUTION,
    maxZoom: 19,
  });

  baseTiles.on('tileerror', () => {
    if (!state.fallbackTriggered) {
      state.fallbackTriggered = true;
      console.warn('[PlasTrack] Teselas satelitales Esri no respondieron; cambiando a capa de respaldo.');
      map.removeLayer(baseTiles);
      state.tiles = L.tileLayer(fallbackTileUrl(), {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);
    }
  });

  state.tiles = baseTiles.addTo(map);

  // Etiquetas de referencia sobre la imagen satelital con pane dedicado
  if (!map.getPane('labelsPane')) {
    map.createPane('labelsPane');
    map.getPane('labelsPane').style.zIndex = 450;
    map.getPane('labelsPane').style.pointerEvents = 'none';
  }
  L.tileLayer(referenceUrl(), { maxZoom: 19, opacity: 0.85, pane: 'labelsPane' }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

  state.markers = (typeof L.markerClusterGroup === 'function'
    ? L.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 42,
        disableClusteringAtZoom: 11,
        iconCreateFunction: (cluster) => L.divIcon({
          className: 'marker-cluster-wrap',
          html: `<div class="marker-cluster"><span>${cluster.getChildCount()}</span></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
      })
    : L.layerGroup()).addTo(map);
  state.zones = L.layerGroup().addTo(map);
  state.map = map;

  // El contenedor puede cambiar de tamaño al rotar el dispositivo o terminar layout
  window.addEventListener('resize', () => map.invalidateSize({ debounceMoveend: true }));

  setTimeout(() => map.invalidateSize(), 150);
  setTimeout(() => map.invalidateSize(), 500);
  return map;
};

const popupHtml = (row) => {
  const status = statusOf(row.aptitud_pct);
  return `
    <h4>${escapeHtml(row.isla)} · ${escapeHtml(row.zona)}</h4>
    <dl>
      <dt>Fecha</dt><dd>${longDate(row.fecha)} ${row.hora_utc} UTC</dd>
      <dt>Plataforma</dt><dd>${escapeHtml(row.satelite)} · ${escapeHtml(row.sensor)}</dd>
      <dt>Nubosidad</dt><dd>${decimal(row.nubosidad_pct)}%</dd>
      <dt>Aptitud</dt><dd>${decimal(row.aptitud_pct)}% (${status.label})</dd>
      <dt>NDVI</dt><dd>${decimal(row.ndvi_promedio, 2)}</dd>
      <dt>Área</dt><dd>${decimal(row.area_km2)} km²</dd>
    </dl>`;
};

const buildMarkers = (records) => {
  state.markers.clearLayers();
  records.forEach((row) => {
    const status = statusOf(row.aptitud_pct);
    const icon = L.divIcon({
      className: 'pin-wrap',
      html: `<div class="pin pin--${status.key}"></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -16],
    });
    L.marker([row.lat, row.lon], { icon, title: `${row.isla} · ${row.id}`, alt: `Pasada ${row.id} en ${row.isla}` })
      .bindPopup(popupHtml(row), { maxWidth: 280 })
      .addTo(state.markers);
  });
};

const buildHeat = (records) => {
  if (state.heat) {
    state.map.removeLayer(state.heat);
    state.heat = null;
  }
  if (!records.length || typeof L.heatLayer === 'undefined') return;

  const points = records.map((row) => [row.lat, row.lon, Math.max(0.15, row.nubosidad_pct / 100)]);
  state.heat = L.heatLayer(points, {
    radius: 58,
    blur: 42,
    maxZoom: 11,
    minOpacity: 0.25,
    gradient: { 0.2: '#4cc9f0', 0.45: '#3ddc97', 0.7: '#ffb703', 1: '#ef476f' },
  });
  if (state.visible.heat) state.heat.addTo(state.map);
};

const buildZones = (records) => {
  state.zones.clearLayers();
  const groups = records.reduce((acc, row) => {
    (acc[row.isla] ??= []).push(row);
    return acc;
  }, {});

  Object.entries(groups).forEach(([isla, rows]) => {
    const lat = rows.reduce((a, r) => a + r.lat, 0) / rows.length;
    const lon = rows.reduce((a, r) => a + r.lon, 0) / rows.length;
    const area = rows.reduce((a, r) => a + r.area_km2, 0);
    const aptitude = rows.reduce((a, r) => a + r.aptitud_pct, 0) / rows.length;
    const radius = 3000 + Math.sqrt(area) * 140 + rows.length * 500;

    L.circle([lat, lon], {
      radius,
      color: '#4cc9f0',
      weight: 1,
      opacity: 0.55,
      fillColor: '#4cc9f0',
      fillOpacity: 0.07,
      dashArray: '4 6',
      interactive: true,
    })
      .bindTooltip(
        `<strong>${escapeHtml(isla)}</strong><br>${rows.length} pasada(s) · ${Math.round(area)} km²<br>Aptitud media ${aptitude.toFixed(1)}%`,
        { sticky: true, opacity: 0.95 },
      )
      .addTo(state.zones);
  });
};

export const updateMap = (records) => {
  if (!state.map && typeof L !== 'undefined') {
    initMap();
  }
  if (!state.map) {
    state.records = records;
    return;
  }
  state.records = records;

  state.map.invalidateSize();

  buildMarkers(records);
  buildHeat(records);
  buildZones(records);

  if (!records.length) {
    state.map.setView(GALAPAGOS_CENTER, 8);
    return;
  }
  const bounds = L.latLngBounds(records.map((r) => [r.lat, r.lon]));
  if (bounds.isValid()) {
    state.map.fitBounds(bounds.pad(0.25), { maxZoom: 9 });
  }

  // Asegura re-renderizado en caso de cálculo tardío de dimensiones del contenedor
  setTimeout(() => {
    if (state.map) {
      state.map.invalidateSize();
      if (bounds.isValid()) {
        state.map.fitBounds(bounds.pad(0.25), { maxZoom: 9 });
      }
    }
  }, 100);
};

export const toggleLayer = (key) => {
  if (!(key in state.visible) || !state.map) return;
  state.visible[key] = !state.visible[key];
  const layer = key === 'heat' ? state.heat : state[key];
  if (!layer) return;
  if (state.visible[key]) layer.addTo(state.map);
  else state.map.removeLayer(layer);
  return state.visible[key];
};

export const setMapTheme = () => {
  // La imagen satelital de Esri no depende del tema; se conserva la API
  // para mantener desacoplado el controlador de la capa de mapa.
};

export const refreshMapSize = () => state.map?.invalidateSize();
