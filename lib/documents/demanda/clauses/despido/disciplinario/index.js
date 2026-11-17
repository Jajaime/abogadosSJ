/// lib/documents/demanda/clauses/despido/disciplinario/index.js

import { DISCIPLINARY_KEYS } from '../../../types';
import { buildIncumplimientoGrave } from './incumplimientoGrave';
import { buildAusenciaInjustificadas } from './ausenciaInjustificadas';
import { buildAcosoSexual } from './acosoSexual';

const builders = {
  [DISCIPLINARY_KEYS.INCUMPLIMIENTO_GRAVE]: buildIncumplimientoGrave,
  [DISCIPLINARY_KEYS.AUSENCIAS_INJUSTIFICADAS]: buildAusenciaInjustificadas,
  [DISCIPLINARY_KEYS.ACOSO_SEXUAL]: buildAcosoSexual,
};

export function buildDespidoDisciplinario(ctx, caseInfo) {
  const subKey = caseInfo?.subKey ?? '';
  const builder = builders[subKey];

  if (!builder) {
    return null;
  }

  return builder(ctx, caseInfo);
}