// utils/decorateDemanda.ts
import {
  toUpperCL, toTitleCL, formatFechaLargaISO, formatCLP, formatRut, listaNatural
} from './formatters';

// Ajusta los nombres de campos a tu DTO real:
export function decorateDemandaForDocx(d: any) {

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
