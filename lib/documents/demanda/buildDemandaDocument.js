/// lib/documents/demanda/buildDemandaDocument.js

import { CASE_KEYS } from './types';
import { resolveTerminationCase } from './resolver/resolveTerminationCase';
import { validateTerminationCase } from './resolver/validators';

import { buildRenuncia } from './clauses/motivo/renuncia';
import { buildMutuoAcuerdo } from './clauses/motivo/mutuoAcuerdo';
import { buildDespidoDisciplinario } from './clauses/despido/disciplinario';

export function buildDemandaDocument(ctx) {
  const demanda = ctx?.demanda ?? {};
  const caseInfo = resolveTerminationCase(demanda);
  const validation = validateTerminationCase(caseInfo, demanda);

  if (!validation.ok) {
    return {
      ok: false,
      faltantes: validation.faltantes,
      caseInfo,
      clauseResult: null,
    };
  }

  const builders = {
    [CASE_KEYS.RENUNCIA]: buildRenuncia,
    [CASE_KEYS.MUTUO_ACUERDO]: buildMutuoAcuerdo,
    [CASE_KEYS.DESPIDO_DISCIPLINARIO]: buildDespidoDisciplinario,
  };

  const builder = builders[caseInfo.caseKey];

  if (!builder) {
    return {
      ok: true,
      faltantes: [],
      caseInfo,
      clauseResult: {
        caseKey: caseInfo.caseKey,
        subKey: caseInfo.subKey,
        faltantes: [],
        flags: caseInfo.flags,
        meta: {},
        sections: {
          encabezado: [],
          hechos: ['No existe builder implementado para este caso.'],
          derecho: [],
          peticiones: [],
          otrosi: [],
        },
      },
    };
  }

  const clauseResult = builder(ctx, caseInfo);

  return {
    ok: true,
    faltantes: [],
    caseInfo,
    clauseResult,
  };
}