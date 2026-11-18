/// lib/documents/demanda/clauses/despido/disciplinario/index.js

import { DISCIPLINARY_KEYS } from '../../../types';
import { buildIncumplimientoGrave } from './incumplimientoGrave';
import { buildAusenciaInjustificadas } from './ausenciaInjustificadas';
import { buildAcosoSexual } from './acosoSexual';
import { buildAcosoLaboral } from './acosoLaboral';
import { buildInjurias } from './injurias';
import { buildNegociacionIncompatible } from './negociacionIncompatible';
import { buildActosImprudenciaTemeraria } from './actosImprudenciaTemeraria';
import { buildAbandonoTrabajo } from './abandonoTrabajo';
import { buildFaltaProbidad } from './faltaProbidad';
import { buildOtrosEspecificar } from './otrosEspecificar';

const builders = {
  [DISCIPLINARY_KEYS.INCUMPLIMIENTO_GRAVE]: buildIncumplimientoGrave,
  [DISCIPLINARY_KEYS.AUSENCIAS_INJUSTIFICADAS]: buildAusenciaInjustificadas,
  [DISCIPLINARY_KEYS.ACOSO_SEXUAL]: buildAcosoSexual,
  [DISCIPLINARY_KEYS.ACOSO_LABORAL]: buildAcosoLaboral,
  [DISCIPLINARY_KEYS.INJURIAS]: buildInjurias,
  [DISCIPLINARY_KEYS.NEGOCIACION_INCOMPATIBLE]: buildNegociacionIncompatible,
  [DISCIPLINARY_KEYS.ACTOS_IMPRUDENCIA_TEMERARIA]: buildActosImprudenciaTemeraria,
  [DISCIPLINARY_KEYS.ABANDONO_TRABAJO]: buildAbandonoTrabajo,
  [DISCIPLINARY_KEYS.FALTA_DE_PROBIDAD]: buildFaltaProbidad,
  [DISCIPLINARY_KEYS.OTROS_ESPECIFICAR]: buildOtrosEspecificar,
};

export function buildDespidoDisciplinario(ctx, caseInfo) {
  const subKey = caseInfo?.subKey ?? '';
  const builder = builders[subKey];

  if (!builder) {
    return null;
  }

  return builder(ctx, caseInfo);
}