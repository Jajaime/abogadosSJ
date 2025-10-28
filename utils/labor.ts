// utils/labor.ts
export type DiffYMD = { years: number; months: number; days: number };

function daysInMonth(year: number, month0: number) {
  // month0: 0..11
  return new Date(year, month0 + 1, 0).getDate();
}

/**
 * Diferencia exacta Y-M-D entre dos fechas (ISO o Date).
 * Si end < start, intercambia.
 */
export function diffYMD(startIn: string | Date | undefined, endIn: string | Date | undefined): DiffYMD {
  if (!startIn || !endIn) return { years: 0, months: 0, days: 0 };
  let start = new Date(startIn);
  let end = new Date(endIn);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { years: 0, months: 0, days: 0 };
  if (end < start) [start, end] = [end, start];

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const y = end.getMonth() === 0 ? end.getFullYear() - 1 : end.getFullYear();
    const m0 = end.getMonth() === 0 ? 11 : end.getMonth() - 1;
    days += daysInMonth(y, m0);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

/** Redondeo para indemnización: si meses >= 6, suma 1 año. */
export function yearsForIndemnizacion(d: DiffYMD): number {
  return d.years + (d.months >= 6 ? 1 : 0);
}

/** Indemnización simple: años_redondeados * última remuneración. */
export function calcIndemnizacionSimple(ultimaRemuneracion: number | undefined | null, yRounded: number): number {
  const r = Number(ultimaRemuneracion ?? 0);
  if (!Number.isFinite(r) || r <= 0) return 0;
  if (!Number.isFinite(yRounded) || yRounded <= 0) return 0;
  return r * yRounded;
}

/** Recargo del 30 % sobre la indemnización base. */
export function calcRecargo30PorCiento(indemnizacionBase: number | undefined | null): number {
  const base = Number(indemnizacionBase ?? 0);
  if (!Number.isFinite(base) || base <= 0) return 0;
  return base * 0.3;
}
