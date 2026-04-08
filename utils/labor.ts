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

export function lastAnniversary(startIn?: string | Date, endIn?: string | Date): Date | null {
  if (!startIn || !endIn) return null;
  const start = new Date(startIn);
  const end = new Date(endIn);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  let years = end.getFullYear() - start.getFullYear();
  const beforeAnniv =
    end.getMonth() < start.getMonth() ||
    (end.getMonth() === start.getMonth() && end.getDate() < start.getDate());
  if (beforeAnniv) years -= 1;

  const ann = new Date(start);
  ann.setFullYear(start.getFullYear() + Math.max(0, years));
  return ann <= end ? ann : null;
}

// === art.73: feriado proporcional (hábiles) ===
// diasAnuales = 15 + progresivo (si aplica). 15 es la base legal sin progresivo.
export function diasFeriadoProporcionalHabiles(
  fechaInicio?: string | Date,
  fechaTermino?: string | Date,
  diasAnuales: number = 15
): number {
  if (!fechaInicio || !fechaTermino) return 0;
  const ann = lastAnniversary(fechaInicio, fechaTermino) ?? new Date(fechaInicio as any);
  const ymd = diffYMD(ann, fechaTermino!);
  const meses = ymd.years * 12 + ymd.months;
  const fraccionMes = ymd.days / 30; // Dirección del Trabajo usa 30 días
  const diasPorMes = diasAnuales / 12;
  return meses * diasPorMes + fraccionMes * diasPorMes; // ej: 15/12=1.25 → 1.25*mes + 1.25*(días/30)
}

// === convertir hábiles → corridos (sumando sábados/dom/feriados) ===
export function corridosDesdeHabiles(
  startNextDay: Date,           // día siguiente al término del contrato
  habiles: number,              // p.ej. 10.08
  feriados?: Array<string | Date> // feriados nacionales opcionales
): number {
  const feriadosSet = new Set(
    (feriados ?? []).map((f) => {
      const d = new Date(f as any);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  let remaining = habiles;
  let d = new Date(startNextDay);
  let corridos = 0;

  const isHoliday = (x: Date) => feriadosSet.has(`${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`);
  const isWeekday = (x: Date) => x.getDay() >= 1 && x.getDay() <= 5; // 1..5 = L..V

  while (remaining > 1e-9) {
    const laboral = isWeekday(d) && !isHoliday(d);
    if (laboral) {
      if (remaining >= 1) {
        remaining -= 1;
        corridos += 1;
      } else {
        corridos += remaining; // fracción del último día hábil
        remaining = 0;
      }
    } else {
      // inhábil: cuenta como corrido pero no descuenta hábil
      corridos += 1;
    }
    d.setDate(d.getDate() + 1);
  }
  return corridos;
}

// remuneración diaria de referencia
export function remuneracionDiariaCL(sueldoMensual?: number | null): number {
  const r = Number(sueldoMensual ?? 0);
  return Number.isFinite(r) && r > 0 ? r / 30 : 0;
}

export function montoPorDiasCorridos(diasCorridos: number, sueldoMensual?: number | null): number {
  const base = remuneracionDiariaCL(sueldoMensual);
  return base > 0 && diasCorridos > 0 ? Math.round(base * diasCorridos) : 0;
}

// progresivo opcional (1 día cada 3 años desde 10 años reconocidos)
export function diasFeriadoProgresivo(totalYearsReconocidos: number = 0): number {
  if (totalYearsReconocidos < 10) return 0;
  return Math.floor((totalYearsReconocidos - 10) / 3);
}

/** Progresivo vigente a X años reconocidos: 1 día cada 3 desde 10 */
export function progresivoVigente(totalYearsReconocidos: number): number {
  if (totalYearsReconocidos < 10) return 0;
  return Math.floor((totalYearsReconocidos - 10) / 3);
}

/**
 * Días hábiles de feriado legal GENERADOS por los años COMPLETOS transcurridos.
 * Suma año a año: desde el 1° hasta el N° aniversario,
 * aplicando el progresivo vigente en cada uno de esos aniversarios.
 *
 * Ej.: si aniosReconocidosPrevios=9 y cumple 2 años en la empresa:
 *   año 1 -> reconocidos 10  => 15 + 0
 *   año 2 -> reconocidos 11  => 15 + 0
 * total generados = 30 hábiles.
 */
export function diasFeriadoLegalGenerados(
  fechaInicio?: string | Date,
  fechaTermino?: string | Date,
  aniosReconocidosPrevios: number = 0
): number {
  if (!fechaInicio || !fechaTermino) return 0;
  const ymd = diffYMD(fechaInicio, fechaTermino);
  const fullYears = ymd.years;
  if (fullYears <= 0) return 0;

  let total = 0;
  for (let i = 1; i <= fullYears; i++) {
    const reconocidosEnEseAnio = aniosReconocidosPrevios + i;
    const prog = progresivoVigente(reconocidosEnEseAnio);
    total += 15 + prog; // días hábiles generados ese año
  }
  return total;
}

/**
 * Días hábiles de feriado legal PENDIENTES (generados - tomados).
 * `diasTomados` debe estar expresado en días hábiles.
 */
export function diasFeriadoLegalPendientes(
  fechaInicio?: string | Date,
  fechaTermino?: string | Date,
  diasTomados: number = 0,
  aniosReconocidosPrevios: number = 0
): number {
  const generados = diasFeriadoLegalGenerados(fechaInicio, fechaTermino, aniosReconocidosPrevios);
  const usados = Number(diasTomados ?? 0);
  return Math.max(0, generados - (Number.isFinite(usados) ? usados : 0));
}

/** Días CORRIDOS a pagar por feriado legal pendiente (art. 67–70). */
export function diasCorridosFeriadoLegalPendiente(
  fechaTermino?: string | Date,
  diasHabilesPendientes: number = 0,
  feriados?: Array<string | Date>
): number {
  if (!fechaTermino || diasHabilesPendientes <= 0) return 0;
  const nextDay = new Date(new Date(fechaTermino).getTime() + 24 * 3600 * 1000);
  return corridosDesdeHabiles(nextDay, diasHabilesPendientes, feriados);
}

/** Monto a pagar por feriado legal pendiente (corridos * remuneración diaria). */
export function montoFeriadoLegalPendiente(
  fechaTermino?: string | Date,
  diasHabilesPendientes: number = 0,
  sueldoMensual?: number | null,
  feriados?: Array<string | Date>
): number {
  const corridos = diasCorridosFeriadoLegalPendiente(fechaTermino, diasHabilesPendientes, feriados);
  return montoPorDiasCorridos(corridos, sueldoMensual);
}

