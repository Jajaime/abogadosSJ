/// lib/documents/demanda/buildDemandaDocument.js

import { CASE_KEYS } from './types';
import { resolveTerminationCase } from './resolver/resolveTerminationCase';
import { validateTerminationCase } from './resolver/validators';

import { buildRenuncia } from './clauses/motivo/renuncia';
import { buildMutuoAcuerdo } from './clauses/motivo/mutuoAcuerdo';
import { buildAutoDespido } from './clauses/motivo/autoDespido';
import { buildDespidoDisciplinario } from './clauses/despido/disciplinario';

const CASE_NOT_IMPLEMENTED_CODE = 'DOCUMENT_CASE_NOT_IMPLEMENTED';
const VALIDATION_CODE = 'CLAUSULAS_VALIDATION';

function buildNotImplementedResult(caseInfo) {
  const caseKey = caseInfo?.caseKey || '(sin caseKey)';
  const subKey = caseInfo?.subKey || '';

  return {
    ok: false,
    code: CASE_NOT_IMPLEMENTED_CODE,
    faltantes: [],
    caseInfo,
    clauseResult: null,
    detail: subKey
      ? `No existe builder documental implementado para ${caseKey} / ${subKey}.`
      : `No existe builder documental implementado para ${caseKey}.`,
  };
}

export function buildDemandaDocument(ctx) {
  const demanda = ctx?.demanda ?? {};
  const caseInfo = resolveTerminationCase(demanda);
  const validation = validateTerminationCase(caseInfo, demanda);

  if (!validation.ok) {
    return {
      ok: false,
      code: VALIDATION_CODE,
      faltantes: validation.faltantes,
      caseInfo,
      clauseResult: null,
    };
  }

  const builders = {
    [CASE_KEYS.RENUNCIA]: buildRenuncia,
    [CASE_KEYS.MUTUO_ACUERDO]: buildMutuoAcuerdo,
    [CASE_KEYS.AUTO_DESPIDO]: buildAutoDespido,
    [CASE_KEYS.DESPIDO_DISCIPLINARIO]: buildDespidoDisciplinario,
  };

  const builder = builders[caseInfo.caseKey];

  if (!builder) {
    return buildNotImplementedResult(caseInfo);
  }

  const clauseResult = builder(ctx, caseInfo);

  if (!clauseResult) {
    return buildNotImplementedResult(caseInfo);
  }

  return {
    ok: true,
    faltantes: [],
    caseInfo,
    clauseResult,
  };
}