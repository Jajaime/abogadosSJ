// utils/serializeDemanda.ts

/**
 * Serializadores y formateadores para DemandaDTO y DemandadoSolDTO
 * - Normaliza fechas a ISO y agrega formatos dd-mm-yyyy
 * - Aplana opciones {name, code} -> string (toma .name)
 * - Convierte booleanos a "Sí/No"
 * - Formatea remuneración con separadores para es-CL
 * - Deja arrays como CSV y también listos para loops en docx-templates
 */

import type { DemandaDTO, DemandadoSolDTO } from '@/types/demanda';

// ------------------ Helpers de normalización ------------------

const toISO = (v: unknown) => {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString();
  // Si viene como string pero es fecha válida, conserva como ISO
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? String(v) : d.toISOString();
};

const formatDDMMYYYY = (isoOrStr?: string) => {
  if (!isoOrStr) return '';
  const d = new Date(isoOrStr);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

// Si a veces llegan objetos { name, code }, aplanamos a string legible
const readMaybeOption = (v: unknown) => {
  if (v && typeof v === 'object' && 'name' in (v as any)) {
    return (v as any).name ?? '';
  }
  return (v as string) ?? '';
};

// textos Sí/No para booleanos, útil en doc
const yesNo = (b: unknown) => (b ? 'Sí' : 'No');

// formato de miles para CLP/num
const formatMoney = (n: unknown) => {
  const value = typeof n === 'number' ? n : Number(n);
  if (isNaN(value)) return '';
  return value.toLocaleString('es-CL'); // “1.234.567”
};

// unión por coma simple (y espacio)
const joinCSV = (arr?: string[]) =>
  Array.isArray(arr) ? arr.filter(Boolean).join(', ') : '';

// normaliza demandados para plantilla/loops
export function safeSerializeDemandados(list: DemandadoSolDTO[] = []) {
  return list.map((x) => ({
    id: x.id ?? '',
    nombre: x.nombre ?? '',
    rut: x.rut ?? '',
    domicilio: x.domicilio ?? '',
  }));
}

// ------------------ SERIALIZADOR PRINCIPAL ------------------

export function safeSerializeDemanda(d: DemandaDTO) {
  // Normalizamos primero listas y opciones
  const demandaSols = safeSerializeDemandados(d.demandadoSols || []);

  const nacionalidadStr = readMaybeOption(d.nacionalidad);
  const estadoCivilStr = readMaybeOption(d.estadoCivil);

  // Fechas ISO
  const fnacISO = toISO(d.fechaNacimiento);
  const finicioISO = toISO(d.fechaInicioRelacionLaboral);
  const fterminoISO = toISO(d.fechaTerminoRelaLaboral);

  return {
    // --- Campos en crudo, ya normalizados a string/number/boolean ---
    nombres: d.nombres ?? '',
    apPaterno: d.apPaterno ?? '',
    apMaterno: d.apMaterno ?? '',
    run: d.run ?? '',
    fechaNacimiento: fnacISO,
    nacionalidad: nacionalidadStr,
    correoElectronico: d.correoElectronico ?? '',
    estadoCivil: estadoCivilStr,

    demandadoSols: demandaSols, // lista lista para loops

    nombreRazonSocial: d.nombreRazonSocial ?? '',
    rutRazonSocial: d.rutRazonSocial ?? '',
    domicilioRazonSocial: d.domicilioRazonSocial ?? '',
    representanteLegal: d.representanteLegal ?? '',
    runRepresentanteLegal: d.runRepresentanteLegal ?? '',

    fechaInicioRelacionLaboral: finicioISO,
    naturalezaContrato: d.naturalezaContrato ?? '',
    funciones: d.funciones ?? '',
    lugar: d.lugar ?? '',
    jornada: d.jornada ?? '',
    otraJornada: d.otraJornada ?? '',
    registroAsistencia: !!d.registroAsistencia,
    remuneracion:
      typeof d.remuneracion === 'number' ? d.remuneracion : Number(d.remuneracion) || 0,
    formaPago: d.formaPago ?? '',
    liquidacionSueldo: !!d.liquidacionSueldo,
    cotizacionSalud: d.cotizacionSalud ?? '',
    cotizacionAfp: d.cotizacionAfp ?? '',
    cotizacionAfc: d.cotizacionAfc ?? '',
    vacaciones:
      typeof d.vacaciones === 'number' ? d.vacaciones : Number(d.vacaciones) || 0,
    fuero: d.fuero ?? '',

    fechaTerminoRelaLaboral: fterminoISO,
    motivoTermino: d.motivoTermino ?? '',
    tipoDespido: d.tipoDespido ?? '',
    despidoDisciplinario: d.despidoDisciplinario ?? '',
    otroDespidoDisciplinario: d.otroDespidoDisciplinario ?? '',
    anosServicios: !!d.anosServicios,
    mesAviso: !!d.mesAviso,
    finiquito: !!d.finiquito,
    prestacionesAdeudadas: Array.isArray(d.prestacionesAdeudadas) ? d.prestacionesAdeudadas : [],
    materias: Array.isArray(d.materias) ? d.materias : [],

    // --- Derivados FÁCILES para usar en DOCX ---
    // Fechas legibles
    fechaNacimientoFmt: formatDDMMYYYY(fnacISO),
    fechaInicioRelacionLaboralFmt: formatDDMMYYYY(finicioISO),
    fechaTerminoRelaLaboralFmt: formatDDMMYYYY(fterminoISO),

    // Booleanos como texto
    registroAsistenciaTxt: yesNo(d.registroAsistencia),
    liquidacionSueldoTxt: yesNo(d.liquidacionSueldo),
    anosServiciosTxt: yesNo(d.anosServicios),
    mesAvisoTxt: yesNo(d.mesAviso),
    finiquitoTxt: yesNo(d.finiquito),

    // Remuneración con miles
    remuneracionCLP: formatMoney(d.remuneracion),

    // Arrays como CSV (útil si en el doc pones una sola línea)
    prestacionesAdeudadasCSV: joinCSV(d.prestacionesAdeudadas),
    materiasCSV: joinCSV(d.materias),

    // NOTA: también quedan listas “loopables” sin tocar para docx-templates:
    // {#demandadoSols}{nombre} - {rut} - {domicilio}{/demandadoSols}
    // {#prestacionesAdeudadas}{.}{/prestacionesAdeudadas}
    // {#materias}{.}{/materias}
  };
}

// ------------------ Exports opcionales (si quieres reutilizarlos) ------------------

export const formatters = {
  toISO,
  formatDDMMYYYY,
  yesNo,
  formatMoney,
  joinCSV,
  readMaybeOption,
};
