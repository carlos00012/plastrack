/**
 * format.js — Utilidades de formato (es-EC)
 * Se mantienen puras y sin dependencias para facilitar pruebas.
 */

const LOCALE = 'es-EC';

export const nf = (value, digits = 0) =>
  new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export const pct = (value, digits = 1) => `${nf(value, digits)}%`;

export const decimal = (value, digits = 1) => nf(value, digits);

export const km2 = (value) =>
  new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(value);

/** Convierte '2026-02-05' en '05 feb 2026' sin desfase de zona horaria. */
export const longDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

export const shortDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  });
};

export const signed = (value, digits = 1) =>
  `${value > 0 ? '+' : ''}${nf(value, digits)}`;
