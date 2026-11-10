// Formateadores creados una sola vez (Intl.NumberFormat es costoso de instanciar).
const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const integerFormatter = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat('es-CO', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const pctFormatters = new Map();

const toNumber = (value) => {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

/** $ 1.234.567 */
export const formatCOP = (value) => copFormatter.format(Math.round(toNumber(value)));

/** 1.234.567 (sin símbolo, para inputs) */
export const formatInteger = (value) => integerFormatter.format(Math.round(toNumber(value)));

/** $1,2 M · $350 mil — para ejes y etiquetas cortas */
export const formatCompactCOP = (value) => {
  const n = toNumber(value);
  if (n === 0) return '$0';
  return `$${compactFormatter.format(n)}`;
};

/** 24,00 % */
export const formatPct = (value, digits = 2) => {
  if (!pctFormatters.has(digits)) {
    pctFormatters.set(
      digits,
      new Intl.NumberFormat('es-CO', { minimumFractionDigits: digits, maximumFractionDigits: digits }),
    );
  }
  return `${pctFormatters.get(digits).format(toNumber(value))} %`;
};

/** Convierte lo que escribe el usuario ("24,5" o "24.5") en número. */
export const parseDecimal = (raw) => {
  if (typeof raw === 'number') return raw;
  const cleaned = String(raw ?? '')
    .replace(/\s/g, '')
    .replace(/[^0-9,.]/g, '')
    .replace(',', '.');
  if (cleaned === '' || cleaned === '.') return NaN;
  return parseFloat(cleaned);
};

/** Solo dígitos → entero (los montos en COP no llevan decimales). */
export const parseIntegerInput = (raw) => {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return digits === '' ? 0 : parseInt(digits, 10);
};

/** Muestra un decimal con coma, sin ceros sobrantes: 24.5 → "24,5" */
export const toDecimalInput = (value, digits = 2) => {
  if (!Number.isFinite(value)) return '';
  const factor = Math.pow(10, digits);
  return String(Math.round(value * factor) / factor).replace('.', ',');
};

/** Fecha en español: "30 de octubre de 2026" */
const dateFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const formatDate = (iso) => (iso ? dateFormatter.format(new Date(iso.slice(0, 10) + 'T00:00:00Z')) : '');
