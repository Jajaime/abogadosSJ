/// lib/documents/demanda/types.js

/**
 * Claves canónicas de casos.
 */
export const CASE_KEYS = {
  RENUNCIA: 'motivo.renuncia',
  MUTUO_ACUERDO: 'motivo.mutuoAcuerdo',
  AUTO_DESPIDO: 'motivo.autoDespido',

  DESPIDO_NECESIDADES_EMPRESA: 'despido.necesidadesEmpresa',
  DESPIDO_SIN_CAUSA: 'despido.sinCausa',
  DESPIDO_TERMINO_PLAZO: 'despido.terminoPlazo',
  DESPIDO_TERMINO_OBRA_FAENA: 'despido.terminoObraFaena',

  DESPIDO_DISCIPLINARIO: 'despido.disciplinario',
};

/**
 * Subcausales disciplinarias canónicas.
 */
export const DISCIPLINARY_KEYS = {
  INCUMPLIMIENTO_GRAVE: 'incumplimiento grave',
  AUSENCIAS_INJUSTIFICADAS: 'ausencia injustificadas',
  ACOSO_SEXUAL: 'acoso sexual',
  ACOSO_LABORAL: 'acoso laboral',
  INJURIAS: 'injurias',
  NEGOCIACION_INCOMPATIBLE: 'negociacion incompatible',
  ACTOS_IMPRUDENCIA_TEMERARIA: 'actos o imprudencia temeraria',
  ABANDONO_TRABAJO: 'abandono de trabajo',
  FALTA_DE_PROBIDAD: 'falta de probidad',
  OTROS_ESPECIFICAR: 'otros especificar',
};

/**
 * Crea una estructura base de secciones semánticas.
 */
export function createEmptySections() {
  return {
    encabezado: [],
    hechos: [],
    derecho: [],
    peticiones: [],
    otrosi: [],
  };
}

/**
 * Crea una respuesta base para builders.
 */
export function createClauseResult(overrides = {}) {
  return {
    caseKey: '',
    subKey: '',
    faltantes: [],
    flags: {},
    sections: createEmptySections(),
    meta: {},
    ...overrides,
  };
}