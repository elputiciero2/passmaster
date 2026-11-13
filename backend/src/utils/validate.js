// Validaciones de entrada. Exigir el tipo evita que un objeto o arreglo llegue a una consulta SQL.

const isStr = (v, max = 255) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

const isEmail = (v) => isStr(v, 180) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Acepta números o cadenas numéricas; devuelve NaN para cualquier otra cosa
const toNumber = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  return NaN;
};

const toInt = (v, min, max) => {
  const n = toNumber(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

const isHttpUrl = (v) => {
  if (!isStr(v, 500)) return false;
  try {
    return ['http:', 'https:'].includes(new URL(v).protocol);
  } catch {
    return false;
  }
};

module.exports = { isStr, isEmail, toNumber, toInt, isHttpUrl };
