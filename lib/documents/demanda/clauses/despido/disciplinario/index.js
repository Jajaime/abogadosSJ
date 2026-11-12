/// lib/documents/demanda/clauses/despido/disciplinario/index.js

import { DISCIPLINARY_KEYS } from '../../../types';
import { buildIncumplimientoGrave } from './incumplimientoGrave';

const builders = {
  [DISCIPLINARY_KEYS.INCUMPLIMIENTO_GRAVE]: buildIncumplimientoGrave,
};

export function buildDespidoDisciplinario(ctx, caseInfo) {
  const subKey = caseInfo?.subKey ?? '';
  const builder = builders[subKey];

  if (!builder) {
    return null;
  }

  return builder(ctx, caseInfo);
}