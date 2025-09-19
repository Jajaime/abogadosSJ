// utils/formatters.ts
export function toUpperCL(s?: string) {
  return (s ?? '').toLocaleUpperCase('es-CL');
}

export function toTitleCL(s?: string) {
  const t = (s ?? '').toLowerCase();
  return t.replace(/\b([a-záéíóúñü])([a-záéíóúñü]*)/gi, (_, f, rest) => f.toUpperCase() + rest);
}

export function formatFechaLargaISO(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  // "1 de enero de 2022"
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatFechaLargaDate(date: Date) {
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatCLP(n?: number) {
  const val = Number(n || 0);
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
}

export function formatRut(rut?: string) {
  const s = (rut ?? '').replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (!s) return '';
  const cuerpo = s.slice(0, -1);
  const dv = s.slice(-1);
  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${conPuntos}-${dv}`;
}

// utils/formatters.ts
export type ListaNaturalOpts = {
  upper?: boolean;       // Pone todo en MAYÚSCULAS (respeta acentos con es-CL)
  period?: boolean;      // Agrega punto final si falta
  conjuncion?: string;   // Por defecto 'y'
};

function _cleanItem(s: string) {
  // recorta, colapsa espacios internos y elimina puntuación final suelta
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[,\.;:\s]+$/g, '');
}

export function listaNatural(
  items?: Array<string | null | undefined>,
  opts: ListaNaturalOpts = {}
) {
  const { upper = false, period = false, conjuncion = 'y' } = opts;

  // 1) limpia y filtra
  const a = (items ?? []).map(x => (x ?? '') + '').map(_cleanItem).filter(Boolean);
  if (a.length === 0) return '';

  // 2) arma la oración con comas y conjunción
  const conj = upper ? conjuncion.toLocaleUpperCase('es-CL') : conjuncion;
  let joined =
    a.length === 1
      ? a[0]
      : a.length === 2
        ? `${a[0]} ${conj} ${a[1]}`
        : `${a.slice(0, -1).join(', ')}, ${conj} ${a[a.length - 1]}`;

  // 3) mayúsculas (locale Spanish para acentos correctos)
  if (upper) joined = joined.toLocaleUpperCase('es-CL');

  // 4) punto final si se pidió y no existe
  if (period && !/[.!?]$/.test(joined)) joined += '.';

  return joined;
}

