// utils/decorateDemanda.ts
import {
  toUpperCL, toTitleCL, formatFechaLargaISO, formatCLP, formatRut, listaNatural
} from './formatters';
import { diffYMD, yearsForIndemnizacion, calcIndemnizacionSimple, calcRecargo30PorCiento } from './labor';

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
