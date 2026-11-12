import { describe, expect, it } from 'vitest';

import { buildDemandaDocument } from '../lib/documents/demanda/buildDemandaDocument';

const makeCtx = (demanda: Record<string, unknown>) => ({
  demanda,
  demandaFmt: {},
});

describe('buildDemandaDocument', () => {
  it('rechaza un caso principal reconocido pero aún no implementado', () => {
    const result = buildDemandaDocument(
      makeCtx({
        motivoTermino: 'Autodespido',
      })
    );

    expect(result).toMatchObject({
      ok: false,
      code: 'DOCUMENT_CASE_NOT_IMPLEMENTED',
      caseInfo: {
        caseKey: 'motivo.autoDespido',
      },
      clauseResult: null,
    });
  });

  it('rechaza una subcausal disciplinaria todavía no implementada', () => {
    const result = buildDemandaDocument(
      makeCtx({
        motivoTermino: 'Despido',
        tipoDespido: 'Disciplinario',
        despidoDisciplinario: 'Acoso laboral',
      })
    );

    expect(result).toMatchObject({
      ok: false,
      code: 'DOCUMENT_CASE_NOT_IMPLEMENTED',
      caseInfo: {
        caseKey: 'despido.disciplinario',
        subKey: 'acoso laboral',
      },
      clauseResult: null,
    });
  });

  it('mantiene operativo un caso ya implementado', () => {
    const result = buildDemandaDocument(
      makeCtx({
        motivoTermino: 'Despido',
        tipoDespido: 'Disciplinario',
        despidoDisciplinario: 'Incumplimiento Grave',
      })
    );

    expect(result.ok).toBe(true);
    expect(result.clauseResult).toMatchObject({
      caseKey: 'despido.disciplinario',
      subKey: 'incumplimiento grave',
    });
  });

  it('mantiene la validación de campos obligatorios antes de construir', () => {
    const result = buildDemandaDocument(
      makeCtx({
        motivoTermino: 'Despido',
        tipoDespido: 'Disciplinario',
      })
    );

    expect(result).toMatchObject({
      ok: false,
      code: 'CLAUSULAS_VALIDATION',
      faltantes: ['despidoDisciplinario'],
      clauseResult: null,
    });
  });
});
