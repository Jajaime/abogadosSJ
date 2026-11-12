import { describe, expect, it } from 'vitest';

import { resolveTerminationCase } from '../lib/documents/demanda/resolver/resolveTerminationCase';
import { CASE_KEYS, DISCIPLINARY_KEYS } from '../lib/documents/demanda/types';

describe('resolveTerminationCase', () => {
  const principalCases = [
    {
      label: 'Renuncia',
      demanda: { motivoTermino: 'Renuncia' },
      caseKey: CASE_KEYS.RENUNCIA,
      flags: { isRenuncia: true },
    },
    {
      label: 'Mutuo Acuerdo',
      demanda: { motivoTermino: 'Mutuo Acuerdo' },
      caseKey: CASE_KEYS.MUTUO_ACUERDO,
      flags: { isMutuoAcuerdo: true },
    },
    {
      label: 'Autodespido',
      demanda: { motivoTermino: 'Autodespido' },
      caseKey: CASE_KEYS.AUTO_DESPIDO,
      flags: { isAutoDespido: true },
    },
    {
      label: 'Necesidades de la Empresa',
      demanda: {
        motivoTermino: 'Despido',
        tipoDespido: 'Necesidades de la Empresa',
      },
      caseKey: CASE_KEYS.DESPIDO_NECESIDADES_EMPRESA,
      flags: { isDespido: true, isNecesidadesEmpresa: true },
    },
    {
      label: 'Sin Causa',
      demanda: {
        motivoTermino: 'Despido',
        tipoDespido: 'Sin Causa',
      },
      caseKey: CASE_KEYS.DESPIDO_SIN_CAUSA,
      flags: { isDespido: true, isSinCausa: true },
    },
    {
      label: 'Término de Plazo',
      demanda: {
        motivoTermino: 'Despido',
        tipoDespido: 'Término de Plazo',
      },
      caseKey: CASE_KEYS.DESPIDO_TERMINO_PLAZO,
      flags: { isDespido: true, isTerminoPlazo: true },
    },
    {
      label: 'Término de Obra o Faena',
      demanda: {
        motivoTermino: 'Despido',
        tipoDespido: 'Término de Obra o Faena',
      },
      caseKey: CASE_KEYS.DESPIDO_TERMINO_OBRA_FAENA,
      flags: { isDespido: true, isTerminoObra: true },
    },
  ];

  for (const testCase of principalCases) {
    it(`resuelve el caso principal ${testCase.label}`, () => {
      const result = resolveTerminationCase(testCase.demanda);

      expect(result).toMatchObject({
        caseKey: testCase.caseKey,
        subKey: '',
        flags: testCase.flags,
      });
    });
  }

  const disciplinaryCases = [
    ['Incumplimiento Grave', DISCIPLINARY_KEYS.INCUMPLIMIENTO_GRAVE],
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

  for (const [formValue, expectedSubKey] of disciplinaryCases) {
    it(`resuelve la subcausal disciplinaria ${formValue}`, () => {
      const result = resolveTerminationCase({
        motivoTermino: 'Despido',
        tipoDespido: 'Disciplinario',
        despidoDisciplinario: formValue,
      });

      expect(result).toMatchObject({
        caseKey: CASE_KEYS.DESPIDO_DISCIPLINARIO,
        subKey: expectedSubKey,
        flags: {
          isDespido: true,
          isDespidoDisciplinario: true,
        },
      });
    });
  }

  const aliases = [
    [{ motivoTermino: 'mutuoacuerdo' }, CASE_KEYS.MUTUO_ACUERDO],
    [{ motivoTermino: 'Auto Despido' }, CASE_KEYS.AUTO_DESPIDO],
    [{ motivoTermino: 'Autodespido (171)' }, CASE_KEYS.AUTO_DESPIDO],
    [
      { motivoTermino: 'Despido', tipoDespido: 'sincausa' },
      CASE_KEYS.DESPIDO_SIN_CAUSA,
    ],
  ] as const;

  for (const [demanda, expectedCaseKey] of aliases) {
    it(`mantiene compatibilidad con alias ${JSON.stringify(demanda)}`, () => {
      const result = resolveTerminationCase(demanda);

      expect(result.caseKey).toBe(expectedCaseKey);
    });
  }

  it('normaliza espacios, mayúsculas y tildes antes de resolver', () => {
    const result = resolveTerminationCase({
      motivoTermino: '  DESPIDO  ',
      tipoDespido: '  TÉRMINO DE OBRA O FAENA  ',
    });

    expect(result).toMatchObject({
      caseKey: CASE_KEYS.DESPIDO_TERMINO_OBRA_FAENA,
      flags: {
        isDespido: true,
        isTerminoObra: true,
      },
    });
  });

  it('devuelve un resultado vacío cuando falta motivoTermino', () => {
    const result = resolveTerminationCase({});

    expect(result).toMatchObject({
      caseKey: '',
      subKey: '',
      flags: {},
    });
  });

  it('no inventa un caseKey para un motivo desconocido', () => {
    const result = resolveTerminationCase({
      motivoTermino: 'Causal inexistente',
    });

    expect(result).toMatchObject({
      caseKey: '',
      subKey: '',
      flags: {},
    });
  });

  it('identifica Despido aunque el tipo no sea reconocido', () => {
    const result = resolveTerminationCase({
      motivoTermino: 'Despido',
      tipoDespido: 'Tipo inexistente',
    });

    expect(result).toMatchObject({
      caseKey: '',
      subKey: '',
      flags: {
        isDespido: true,
      },
    });
  });

  it('conserva normalizada una subcausal disciplinaria desconocida', () => {
    const result = resolveTerminationCase({
      motivoTermino: 'Despido',
      tipoDespido: 'Disciplinario',
      despidoDisciplinario: '  Causal Especial  ',
    });

    expect(result).toMatchObject({
      caseKey: CASE_KEYS.DESPIDO_DISCIPLINARIO,
      subKey: 'causal especial',
      flags: {
        isDespido: true,
        isDespidoDisciplinario: true,
      },
    });
  });
});
