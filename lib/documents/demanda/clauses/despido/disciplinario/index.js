/// lib/documents/demanda/clauses/despido/disciplinario/index.js

import { DISCIPLINARY_KEYS } from '../../../types';
import { buildIncumplimientoGrave } from './incumplimientoGrave';
import { buildAusenciaInjustificadas } from './ausenciaInjustificadas';

const builders = {
  [DISCIPLINARY_KEYS.INCUMPLIMIENTO_GRAVE]: buildIncumplimientoGrave,
  [DISCIPLINARY_KEYS.AUSENCIAS_INJUSTIFICADAS]: buildAusenciaInjustificadas,
};

export function buildDespidoDisciplinario(ctx, caseInfo) {
  const subKey = caseInfo?.subKey ?? '';
  const builder = builders[subKey];

  if (!builder) {
    return null;
  }

  return builder(ctx, caseInfo);
}