/// lib/documents/demanda/resolver/resolveTerminationCase.js

import { CASE_KEYS } from '../types';
import { normalizeTerminationData } from './normalize';

export function resolveTerminationCase(demanda = {}) {
  const n = normalizeTerminationData(demanda);

  const result = {
    caseKey: '',
    subKey: '',
    flags: {},
    normalized: n,
  };

  if (!n.motivoTermino) {
    return result;
  }

  if (n.motivoTermino === 'renuncia') {
    return {
      ...result,
      caseKey: CASE_KEYS.RENUNCIA,
      flags: {
        isRenuncia: true,
      },
    };
  }

  if (n.motivoTermino === 'mutuo acuerdo' || n.motivoTermino === 'mutuoacuerdo') {
    return {
      ...result,
      caseKey: CASE_KEYS.MUTUO_ACUERDO,
      flags: {
        isMutuoAcuerdo: true,
      },
    };
  }

  if (
    n.motivoTermino === 'autodespido' ||
    n.motivoTermino === 'auto despido' ||
    n.motivoTermino === 'autodespido (171)'
  ) {
    return {
      ...result,
      caseKey: CASE_KEYS.AUTO_DESPIDO,
      flags: {
        isAutoDespido: true,
      },
    };
  }

  if (n.motivoTermino !== 'despido') {
    return result;
  }

  if (n.tipoDespido === 'disciplinario') {
    return {
      ...result,
      caseKey: CASE_KEYS.DESPIDO_DISCIPLINARIO,
      subKey: n.despidoDisciplinario,
      flags: {
        isDespido: true,
        isDespidoDisciplinario: true,
      },
    };
  }

  if (n.tipoDespido === 'necesidades de la empresa') {
    return {
      ...result,
      caseKey: CASE_KEYS.DESPIDO_NECESIDADES_EMPRESA,
      flags: {
        isDespido: true,
        isNecesidadesEmpresa: true,
      },
    };
  }

  if (n.tipoDespido === 'sin causa' || n.tipoDespido === 'sincausa') {
    return {
      ...result,
      caseKey: CASE_KEYS.DESPIDO_SIN_CAUSA,
      flags: {
        isDespido: true,
        isSinCausa: true,
      },
    };
  }

  if (n.tipoDespido === 'termino de plazo' || n.tipoDespido === 'término de plazo') {
    return {
      ...result,
      caseKey: CASE_KEYS.DESPIDO_TERMINO_PLAZO,
      flags: {
        isDespido: true,
        isTerminoPlazo: true,
      },
    };
  }

  if (
    n.tipoDespido === 'termino de obra o faena' ||
    n.tipoDespido === 'término de obra o faena'
  ) {
    return {
      ...result,
      caseKey: CASE_KEYS.DESPIDO_TERMINO_OBRA_FAENA,
      flags: {
        isDespido: true,
        isTerminoObra: true,
      },
    };
  }

  return {
    ...result,
    flags: {
      isDespido: true,
    },
  };
}