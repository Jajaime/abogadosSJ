/// lib/documents/demanda/resolver/validators.js

import { CASE_KEYS, DISCIPLINARY_KEYS } from '../types';

export function validateTerminationCase(caseInfo, demanda = {}) {
  const faltantes = [];
  const n = caseInfo?.normalized ?? {};

  if (!n.motivoTermino) {
    faltantes.push('motivoTermino');
  }

  if (n.motivoTermino === 'despido' && !n.tipoDespido) {
    faltantes.push('tipoDespido');
  }

  if (caseInfo.caseKey === CASE_KEYS.DESPIDO_DISCIPLINARIO) {
    if (!n.despidoDisciplinario) {
      faltantes.push('despidoDisciplinario');
    }

    if (
      n.despidoDisciplinario === DISCIPLINARY_KEYS.OTROS_ESPECIFICAR &&
      !n.otroDespidoDisciplinario
    ) {
      faltantes.push('otroDespidoDisciplinario');
    }
  }

  if (caseInfo.caseKey === CASE_KEYS.DESPIDO_NECESIDADES_EMPRESA) {
    if (typeof demanda.anosServicios !== 'boolean') {
      faltantes.push('anosServicios');
    }
    if (typeof demanda.mesAviso !== 'boolean') {
      faltantes.push('mesAviso');
    }
  }

  return {
    ok: faltantes.length === 0,
    faltantes,
  };
}