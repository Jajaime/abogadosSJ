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

export function listaNatural(items?: string[], conjuncion = 'y') {
  const a = (items ?? []).filter(Boolean);
  if (a.length === 0) return '';
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} ${conjuncion} ${a[1]}`;
  return `${a.slice(0, -1).join(', ')} ${conjuncion} ${a[a.length - 1]}`;
}
