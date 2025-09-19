// utils/rut.ts
export const cleanRut = (input: string) =>
  input
    .toUpperCase()
    .replace(/[^0-9K]/g, '')   // deja solo dígitos y K
    .replace(/^0+/, '');       // quita ceros a la izquierda

// Inserta puntos y guión en un RUT ya "limpio" (solo dígitos + posible K al final)
export const formatRut = (clean: string) => {
  if (!clean) return '';
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  // agrega puntos cada 3 desde la derecha
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withDots}-${dv}`;
};

export const computeDv = (body: string) => {
  // body solo dígitos, sin DV
  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (sum % 11);
  if (res === 11) return '0';
  if (res === 10) return 'K';
  return String(res);
};

/** Devuelve true si el string es *potencialmente* un RUT (por patrón) */
export const looksLikeRut = (input: string) => {
  const s = cleanRut(input);
  // cuerpo de 7 u 8 dígitos + DV [0-9K]
  return /^[0-9]{7,8}[0-9K]$/.test(s);
};

/** Valida un RUT (con o sin puntos/guión). */
export const validateRut = (input: string) => {
  const s = cleanRut(input);
  if (!/^[0-9]{7,8}[0-9K]$/.test(s)) return false; // patrón base
  const body = s.slice(0, -1);
  const dv = s.slice(-1);
  return computeDv(body) === dv;
};

/** Normaliza a formato bonito 12.345.678-5 (si se puede) */
export const normalizeRut = (input: string) => {
  const s = cleanRut(input);
  if (s.length < 2) return s; // aún escribiendo
  return formatRut(s);
};
