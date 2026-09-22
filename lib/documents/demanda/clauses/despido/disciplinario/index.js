/// lib/documents/demanda/clauses/despido/disciplinario/index.js

import { DISCIPLINARY_KEYS } from '../../../types';
import { buildIncumplimientoGrave } from './incumplimientoGrave';

export function buildDespidoDisciplinario(ctx, caseInfo) {
  const subKey = caseInfo?.subKey ?? '';

  const builders = {
    [DISCIPLINARY_KEYS.INCUMPLIMIENTO_GRAVE]: buildIncumplimientoGrave,
  };

  const builder = builders[subKey];

  if (!builder) {
    return {
      caseKey: caseInfo.caseKey,
      subKey,
      faltantes: [],
      flags: {
        ...caseInfo.flags,
      },
      meta: {
        subtipo: subKey,
      },
      sections: {
        encabezado: [
          'Motivo Término -> Despido',
          'Tipo Despido -> Disciplinario',
        ],
        hechos: [
          `No existe aún un builder implementado para la subcausal disciplinaria: ${subKey || '(vacía)'}.`,
        ],
        derecho: [],
        peticiones: [],
        otrosi: [],
      },
    };
  }

  return builder(ctx, caseInfo);
}