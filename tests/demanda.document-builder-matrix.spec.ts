import { describe, expect, it } from 'vitest';

import { buildDemandaDocument } from '../lib/documents/demanda/buildDemandaDocument';
import { CASE_KEYS, DISCIPLINARY_KEYS } from '../lib/documents/demanda/types';

const makeCtx = (
  demanda: Record<string, unknown>,
  demandaFmt: Record<string, unknown> = {}
) => ({
  demanda,
  demandaFmt,
});

describe('buildDemandaDocument matrix', () => {
  it('construye Renuncia con su builder implementado', () => {
    const result = buildDemandaDocument(
      makeCtx({
        motivoTermino: 'Renuncia',
      })
    );

    expect(result).toMatchObject({
      ok: true,
      caseInfo: {
        caseKey: CASE_KEYS.RENUNCIA,
      },
      clauseResult: {
        caseKey: CASE_KEYS.RENUNCIA,
        flags: {
          isRenuncia: true,
        },
      },
    });
  });

  it('construye Mutuo Acuerdo con su builder implementado', () => {
    const result = buildDemandaDocument(
      makeCtx(
        {
          motivoTermino: 'Mutuo Acuerdo',
        },
        {
          feriado_legal_habiles_text: '10 días',
          feriado_legal_monto_clp: '$100.000',
          feriado_proporcional_habiles_text: '5 días',
          feriado_proporcional_monto_clp: '$50.000',
        }
      )
    );

    expect(result).toMatchObject({
      ok: true,
      caseInfo: {
        caseKey: CASE_KEYS.MUTUO_ACUERDO,
      },
      clauseResult: {
        caseKey: CASE_KEYS.MUTUO_ACUERDO,
        flags: {
          isMutuoAcuerdo: true,
        },
      },
    });

    expect(result.clauseResult?.sections.hechos.join(' ')).toContain('$100.000');
    expect(result.clauseResult?.sections.hechos.join(' ')).toContain('$50.000');
  });

  it('construye Autodespido con el texto jurídico migrado', () => {
    const result = buildDemandaDocument(
      makeCtx(
        {
          motivoTermino: 'Autodespido',
          fechaTerminoRelaLaboral: '2026-11-12',
        },
        {
          fechaTerminoRelaLaboral_larga: '12 de noviembre de 2026',
          remuneracion_clp: '$1.000.000',
          indemnizacion_monto_clp: '$3.000.000',
        }
      )
    );

    expect(result).toMatchObject({
      ok: true,
      caseInfo: {
        caseKey: CASE_KEYS.AUTO_DESPIDO,
      },
      clauseResult: {
        caseKey: CASE_KEYS.AUTO_DESPIDO,
        flags: {
          isAutoDespido: true,
        },
      },
    });

    expect(result.clauseResult?.sections.derecho.join(' ')).toContain('artículo 171');
    expect(result.clauseResult?.sections.derecho.join(' ')).toContain(
      '12 de noviembre de 2026'
    );
    expect(result.clauseResult?.sections.peticiones.join(' ')).toContain('$1.000.000');
    expect(result.clauseResult?.sections.peticiones.join(' ')).toContain('$3.000.000');
  });

  it('construye Necesidades de la Empresa con el texto jurídico migrado', () => {
    const result = buildDemandaDocument(
      makeCtx(
        {
          motivoTermino: 'Despido',
          tipoDespido: 'Necesidades de la Empresa',
          anosServicios: false,
          mesAviso: false,
        },
        {
          remuneracion_clp: '$1.000.000',
          indemnizacion_monto_clp: '$3.000.000',
          indemnizacion_recargo30_clp: '$900.000',
        }
      )
    );

    expect(result).toMatchObject({
      ok: true,
      caseInfo: {
        caseKey: CASE_KEYS.DESPIDO_NECESIDADES_EMPRESA,
      },
      clauseResult: {
        caseKey: CASE_KEYS.DESPIDO_NECESIDADES_EMPRESA,
        flags: {
          isDespido: true,
          isNecesidadesEmpresa: true,
        },
      },
    });

    expect(result.clauseResult?.sections.derecho.join(' ')).toContain('artículo 161');
    expect(result.clauseResult?.sections.derecho.join(' ')).toContain('Rol N° 119.179-2020');
    expect(result.clauseResult?.sections.peticiones.join(' ')).toContain('$1.000.000');
    expect(result.clauseResult?.sections.peticiones.join(' ')).toContain('$3.000.000');
    expect(result.clauseResult?.sections.peticiones.join(' ')).toContain('$900.000');
  });

  it('construye Sin Causa con el texto jurídico migrado', () => {
    const result = buildDemandaDocument(
      makeCtx(
        {
          motivoTermino: 'Despido',
          tipoDespido: 'Sin Causa',
          fechaTerminoRelaLaboral: '2026-11-12',
        },
        {
          fechaTerminoRelaLaboral_larga: '12 de noviembre de 2026',
          remuneracion_clp: '$1.000.000',
          indemnizacion_monto_clp: '$3.000.000',
        }
      )
    );

    expect(result).toMatchObject({
      ok: true,
      caseInfo: {
        caseKey: CASE_KEYS.DESPIDO_SIN_CAUSA,
      },
      clauseResult: {
        caseKey: CASE_KEYS.DESPIDO_SIN_CAUSA,
        flags: {
          isDespido: true,
          isSinCausa: true,
        },
      },
    });

    expect(result.clauseResult?.sections.hechos.join(' ')).toContain(
      '12 de noviembre de 2026'
    );
    expect(result.clauseResult?.sections.derecho.join(' ')).toContain('in causado');
    expect(result.clauseResult?.sections.peticiones.join(' ')).toContain('$1.000.000');
    expect(result.clauseResult?.sections.peticiones.join(' ')).toContain('$3.000.000');
  });

  it('construye Término de Plazo con el texto jurídico migrado', () => {
    const result = buildDemandaDocument(
      makeCtx(
        {
          motivoTermino: 'Despido',
          tipoDespido: 'Término de Plazo',
          fechaTerminoRelaLaboral: '2026-11-12',
        },
        {
          fechaTerminoRelaLaboral_larga: '12 de noviembre de 2026',
          remuneracion_clp: '$1.000.000',
          indemnizacion_monto_clp: '$3.000.000',
        }
      )
    );

    expect(result).toMatchObject({
      ok: true,
      caseInfo: {
        caseKey: CASE_KEYS.DESPIDO_TERMINO_PLAZO,
      },
      clauseResult: {
        caseKey: CASE_KEYS.DESPIDO_TERMINO_PLAZO,
        flags: {
          isDespido: true,
          isTerminoPlazo: true,
        },
      },
    });

    expect(result.clauseResult?.sections.hechos.join(' ')).toContain(
      '12 de noviembre de 2026'
    );
    expect(result.clauseResult?.sections.derecho.join(' ')).toContain('artículo 159');
    expect(result.clauseResult?.sections.peticiones.join(' ')).toContain('$1.000.000');
    expect(result.clauseResult?.sections.peticiones.join(' ')).toContain('$3.000.000');
  });

  it('construye Incumplimiento Grave con el builder disciplinario implementado', () => {
    const result = buildDemandaDocument(
      makeCtx(
        {
          motivoTermino: 'Despido',
          tipoDespido: 'Disciplinario',
          despidoDisciplinario: 'Incumplimiento Grave',
        },
        {
          remuneracion_clp: '$1.000.000',
          indemnizacion_monto_clp: '$3.000.000',
        }
      )
    );

    expect(result).toMatchObject({
      ok: true,
      caseInfo: {
        caseKey: CASE_KEYS.DESPIDO_DISCIPLINARIO,
        subKey: DISCIPLINARY_KEYS.INCUMPLIMIENTO_GRAVE,
      },
      clauseResult: {
        caseKey: CASE_KEYS.DESPIDO_DISCIPLINARIO,
        subKey: DISCIPLINARY_KEYS.INCUMPLIMIENTO_GRAVE,
        flags: {
          isDespido: true,
          isDespidoDisciplinario: true,
          isIncumplimientoGrave: true,
        },
      },
    });
  });

  const principalNotImplemented = [
    [
      'Término de Obra o Faena',
      {
        motivoTermino: 'Despido',
        tipoDespido: 'Término de Obra o Faena',
      },
      CASE_KEYS.DESPIDO_TERMINO_OBRA_FAENA,
    ],
  ] as const;

  for (const [label, demanda, expectedCaseKey] of principalNotImplemented) {
    it(`rechaza ${label} mientras su builder no esté implementado`, () => {
      const result = buildDemandaDocument(makeCtx(demanda));

      expect(result).toMatchObject({
        ok: false,
        code: 'DOCUMENT_CASE_NOT_IMPLEMENTED',
        faltantes: [],
        caseInfo: {
          caseKey: expectedCaseKey,
        },
        clauseResult: null,
      });
    });
  }

  const disciplinaryNotImplemented = [
    ['Ausencia Injustificadas', DISCIPLINARY_KEYS.AUSENCIAS_INJUSTIFICADAS],
    ['Acoso Sexual', DISCIPLINARY_KEYS.ACOSO_SEXUAL],
    ['Acoso Laboral', DISCIPLINARY_KEYS.ACOSO_LABORAL],
    ['Injurias', DISCIPLINARY_KEYS.INJURIAS],
    ['Negociación Incompatible', DISCIPLINARY_KEYS.NEGOCIACION_INCOMPATIBLE],
    ['Actos o Imprudencia Temeraria', DISCIPLINARY_KEYS.ACTOS_IMPRUDENCIA_TEMERARIA],
    ['Abandono de Trabajo', DISCIPLINARY_KEYS.ABANDONO_TRABAJO],
    ['Falta de Probidad', DISCIPLINARY_KEYS.FALTA_DE_PROBIDAD],
    ['Otros Especificar', DISCIPLINARY_KEYS.OTROS_ESPECIFICAR],
  ] as const;

  for (const [formValue, expectedSubKey] of disciplinaryNotImplemented) {
    it(`rechaza ${formValue} mientras su builder disciplinario no esté implementado`, () => {
      const demanda: Record<string, unknown> = {
        motivoTermino: 'Despido',
        tipoDespido: 'Disciplinario',
        despidoDisciplinario: formValue,
      };

      if (expectedSubKey === DISCIPLINARY_KEYS.OTROS_ESPECIFICAR) {
        demanda.otroDespidoDisciplinario = 'Detalle informado';
      }

      const result = buildDemandaDocument(makeCtx(demanda));

      expect(result).toMatchObject({
        ok: false,
        code: 'DOCUMENT_CASE_NOT_IMPLEMENTED',
        faltantes: [],
        caseInfo: {
          caseKey: CASE_KEYS.DESPIDO_DISCIPLINARIO,
          subKey: expectedSubKey,
        },
        clauseResult: null,
      });
    });
  }

  it('prioriza CLAUSULAS_VALIDATION antes de buscar un builder', () => {
    const result = buildDemandaDocument(
      makeCtx({
        motivoTermino: 'Despido',
        tipoDespido: 'Disciplinario',
      })
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        code: 'CLAUSULAS_VALIDATION',
        faltantes: ['despidoDisciplinario'],
        clauseResult: null,
      })
    );
  });

  it('rechaza un motivo informado pero desconocido como caso no implementado', () => {
    const result = buildDemandaDocument(
      makeCtx({
        motivoTermino: 'Causal inexistente',
      })
    );

    expect(result).toMatchObject({
      ok: false,
      code: 'DOCUMENT_CASE_NOT_IMPLEMENTED',
      faltantes: [],
      caseInfo: {
        caseKey: '',
      },
      clauseResult: null,
    });
  });

  it('rechaza un tipo de despido informado pero desconocido como caso no implementado', () => {
    const result = buildDemandaDocument(
      makeCtx({
        motivoTermino: 'Despido',
        tipoDespido: 'Tipo inexistente',
      })
    );

    expect(result).toMatchObject({
      ok: false,
      code: 'DOCUMENT_CASE_NOT_IMPLEMENTED',
      faltantes: [],
      caseInfo: {
        caseKey: '',
        flags: {
          isDespido: true,
        },
      },
      clauseResult: null,
    });
  });
});
