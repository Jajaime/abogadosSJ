// utils/decorateDemanda.ts
import {
  toUpperCL, toTitleCL, formatFechaLargaISO, formatCLP, formatRut, listaNatural
} from './formatters';
import { diffYMD, 
  yearsForIndemnizacion, 
  calcIndemnizacionSimple, 
  calcRecargo30PorCiento,
  diasFeriadoProporcionalHabiles,
  corridosDesdeHabiles,
  diasFeriadoProgresivo,
  montoPorDiasCorridos,
  diasFeriadoLegalPendientes,
  diasCorridosFeriadoLegalPendiente,
  montoFeriadoLegalPendiente,
 } from './labor';

// Ajusta los nombres de campos a tu DTO real:
export function decorateDemandaForDocx(d: any) {

  // período exacto entre inicio y término
  const ymd = diffYMD(d?.fechaInicioRelacionLaboral, d?.fechaTerminoRelaLaboral);
  const yIndem = yearsForIndemnizacion(ymd);

  // indemnización simple (sin topes/reglas adicionales)
  const indemMonto = calcIndemnizacionSimple(d?.remuneracion, yIndem);
  // recargo del 30 % sobre la indemnización base
  const recargo30 = calcRecargo30PorCiento(indemMonto);

  const materias_texto = listaNatural(
    Array.isArray(d?.materias) ? d.materias : [],
    { upper: true, period: false, conjuncion: 'y' }
  );

  const materias_texto_2 = listaNatural(
    Array.isArray(d?.materias) ? d.materias : [],
    { upper: false, period: false, conjuncion: 'y' }
  );

  const prestacionesAdeudadas_texto = listaNatural(
    Array.isArray(d?.prestacionesAdeudadas) ? d.prestacionesAdeudadas : [],
    { upper: true, period: true, conjuncion: 'y' }
  );

  // --- FERIAS (solo valores formateados) ---
  const fechaIni = d?.fechaInicioRelacionLaboral;
  const fechaFin = d?.fechaTerminoRelaLaboral;
  const sueldoMensual = Number(d?.remuneracion ?? 0);

  // Reconocidos previos (si no usas, quedará 0)
  const aniosReconocidosPrevios = Number(d?.aniosReconocidosPrevios ?? 0);
  // Días hábiles de feriado legal ya tomados en años completos (si no usas, quedará 0)
  const diasFeriadoLegalTomados = Number(d?.diasFeriadoLegalTomados ?? 0);

  // LEGAL pendiente (hábiles y corridos)
  const legalPendHabiles = diasFeriadoLegalPendientes(
    fechaIni,
    fechaFin,
    diasFeriadoLegalTomados,
    aniosReconocidosPrevios
  );
  const legalPendCorridos = diasCorridosFeriadoLegalPendiente(
    fechaFin,
    legalPendHabiles
    // , feriadosOpcionales
  );
  const legalMonto = montoFeriadoLegalPendiente(
    fechaFin,
    legalPendHabiles,
    sueldoMensual
    // , feriadosOpcionales
  );

  // PROPORCIONAL (art. 73): base anual 15 + progresivo vigente
  const ymdServicio = diffYMD(fechaIni, fechaFin);
  const totalYearsReconocidos = aniosReconocidosPrevios + ymdServicio.years;
  const progDias = diasFeriadoProgresivo(totalYearsReconocidos);
  const diasAnuales = 15 + progDias;

  const propHabiles = diasFeriadoProporcionalHabiles(fechaIni, fechaFin, diasAnuales);
  const nextDay = fechaFin ? new Date(new Date(fechaFin).getTime() + 24 * 3600 * 1000) : null;
  const propCorridos = nextDay ? corridosDesdeHabiles(nextDay, propHabiles) : 0;
  const propMonto = montoPorDiasCorridos(propCorridos, sueldoMensual);

  // Textos formateados
  const feriadoLegalHabilesText   = `${legalPendHabiles} días hábiles`;
  const feriadoLegalCorridosText  = `${legalPendCorridos.toFixed(2)} días corridos`;
  const feriadoLegalMontoCLP      = formatCLP(legalMonto);

  const feriadoPropHabilesText    = `${propHabiles.toFixed(2)} días hábiles`;
  const feriadoPropCorridosText   = `${propCorridos.toFixed(2)} días corridos`;
  const feriadoPropMontoCLP       = formatCLP(propMonto);

  return {
    // variantes comunes
    nombres_upper: toUpperCL(`${d?.nombres ?? ''} ${d?.apPaterno ?? ''} ${d?.apMaterno ?? ''}`.trim()),
    nombres_title: toTitleCL(`${d?.nombres ?? ''} ${d?.apPaterno ?? ''} ${d?.apMaterno ?? ''}`.trim()),

    run_fmt: formatRut(d?.run),
    fechaNacimiento_larga: formatFechaLargaISO(d?.fechaNacimiento),
    fechaInicioRelacionLaboral_larga: formatFechaLargaISO(d?.fechaInicioRelacionLaboral),
    fechaTerminoRelaLaboral_larga: formatFechaLargaISO(d?.fechaTerminoRelaLaboral),

    remuneracion_clp: formatCLP(d?.remuneracion),

    nombreRazonSocial_upper: toUpperCL(d?.nombreRazonSocial),
    rutRazonSocial_fmt: formatRut(d?.rutRazonSocial),
    domicilioRazonSocial_upper: toUpperCL(d?.domicilioRazonSocial),
    domicilioParticular_upper: toUpperCL(d?.domicilioParticular),

    // variantes específicas
    // === NUEVO: período de servicios ===
    aniosServicio_num: ymd.years,           // 4
    mesesServicio_num: ymd.months,          // 9
    diasServicio_num: ymd.days,             // 30
    aniosServicio_redondeado: yIndem,       // 5 (si meses>=6 → +1)
    aniosServicio_texto: `${ymd.years} años y ${ymd.months} meses`, // para párrafos
    // si quieres incluir días:
    aniosServicio_texto_largo:
      `${ymd.years} años, ${ymd.months} meses y ${ymd.days} días`,
    
    // === NUEVO: indemnización simple (mostrar) ===
    indemnizacion_anios_base: ymd.years,
    indemnizacion_anios_redondeado: yIndem,
    indemnizacion_monto_num: indemMonto,
    indemnizacion_monto_clp: formatCLP(indemMonto),
    indemnizacion_recargo30_num: recargo30,
    indemnizacion_recargo30_clp: formatCLP(recargo30),    

    // listas / arrays
    materias_texto,
    materias_texto_2,
    prestacionesAdeudadas_texto,

    // domicilio y otros campos con casing deseado
    domicilioParticular_title: toTitleCL(d?.domicilioParticular),
    domicilioRazonSocial_title: toTitleCL(d?.domicilioRazonSocial),

// FERIAdo LEGAL (solo formateados)
    feriado_legal_habiles_text: feriadoLegalHabilesText,          // ej: "15 días hábiles"
    feriado_legal_corridos_text: feriadoLegalCorridosText,        // ej: "21.00 días corridos"
    feriado_legal_monto_clp: feriadoLegalMontoCLP,                // ej: "$650.000"

    // FERIAdo PROPORCIONAL (solo formateados)
    feriado_proporcional_habiles_text: feriadoPropHabilesText,    // ej: "10.08 días hábiles"
    feriado_proporcional_corridos_text: feriadoPropCorridosText,  // ej: "14.08 días corridos"
    feriado_proporcional_monto_clp: feriadoPropMontoCLP,          // ej: "$305.000"

    // si quieres etiquetas rápidas:
    feriado_legal_label: 'Feriado legal pendiente',
    feriado_proporcional_label: 'Feriado proporcional',

    // por si quieres conservar los crudos también:
    _raw: d,
  };
}

export function decorateDemandadoSolidarioForDocx(x: any) {
  return {
    ...x,
    nombre_upper: toUpperCL(x?.nombreRazonSocial),
    rut_fmt: formatRut(x?.rut),
    domicilio_title: toTitleCL(x?.domicilio),
    domicilio_upper: toUpperCL(x?.domicilio),
    representanteLegal_upper: toUpperCL(x?.representanteLegal),
    runRepresentanteLegal_fmt: formatRut(x?.runRepresentanteLegal),
  };
}
