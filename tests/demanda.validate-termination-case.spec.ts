import { describe, expect, it } from 'vitest';

import { resolveTerminationCase } from '../lib/documents/demanda/resolver/resolveTerminationCase';
import { validateTerminationCase } from '../lib/documents/demanda/resolver/validators';

const validate = (demanda: Record<string, unknown>) => {
  const caseInfo = resolveTerminationCase(demanda);
  return validateTerminationCase(caseInfo, demanda);
};

describe('validateTerminationCase', () => {
  it('exige motivoTermino cuando está ausente', () => {
    expect(validate({})).toEqual({
      ok: false,
      faltantes: ['motivoTermino'],
    });
  });

  it('acepta Renuncia sin exigir campos propios de Despido', () => {
    expect(validate({ motivoTermino: 'Renuncia' })).toEqual({
      ok: true,
      faltantes: [],
    });
  });

  it('exige tipoDespido cuando el motivo es Despido', () => {
    expect(validate({ motivoTermino: 'Despido' })).toEqual({
      ok: false,
      faltantes: ['tipoDespido'],
    });
  });

  it('exige despidoDisciplinario para un Despido Disciplinario', () => {
    expect(
      validate({
        motivoTermino: 'Despido',
        tipoDespido: 'Disciplinario',
      })
    ).toEqual({
      ok: false,
      faltantes: ['despidoDisciplinario'],
    });
  });

  it('acepta una subcausal disciplinaria informada', () => {
    expect(
      validate({
        motivoTermino: 'Despido',
        tipoDespido: 'Disciplinario',
        despidoDisciplinario: 'Incumplimiento Grave',
      })
    ).toEqual({
      ok: true,
      faltantes: [],
    });
  });

  it('exige detalle cuando la subcausal es Otros Especificar', () => {
    expect(
      validate({
        motivoTermino: 'Despido',
        tipoDespido: 'Disciplinario',
        despidoDisciplinario: 'Otros Especificar',
      })
    ).toEqual({
      ok: false,
      faltantes: ['otroDespidoDisciplinario'],
    });
  });

  it('considera vacío un detalle con sólo espacios en Otros Especificar', () => {
    expect(
      validate({
        motivoTermino: 'Despido',
        tipoDespido: 'Disciplinario',
        despidoDisciplinario: 'Otros Especificar',
        otroDespidoDisciplinario: '   ',
      })
    ).toEqual({
      ok: false,
      faltantes: ['otroDespidoDisciplinario'],
    });
  });

  it('acepta Otros Especificar cuando existe detalle', () => {
    expect(
      validate({
        motivoTermino: 'Despido',
        tipoDespido: 'Disciplinario',
        despidoDisciplinario: 'Otros Especificar',
        otroDespidoDisciplinario: 'Otra causal disciplinaria',
      })
    ).toEqual({
      ok: true,
      faltantes: [],
    });
  });

  it('exige anosServicios y mesAviso para Necesidades de la Empresa', () => {
    expect(
      validate({
        motivoTermino: 'Despido',
        tipoDespido: 'Necesidades de la Empresa',
      })
    ).toEqual({
      ok: false,
      faltantes: ['anosServicios', 'mesAviso'],
    });
  });

  it('acepta false como respuesta válida en Necesidades de la Empresa', () => {
    expect(
      validate({
        motivoTermino: 'Despido',
        tipoDespido: 'Necesidades de la Empresa',
        anosServicios: false,
        mesAviso: false,
      })
    ).toEqual({
      ok: true,
      faltantes: [],
    });
  });

  it('acepta combinaciones booleanas válidas en Necesidades de la Empresa', () => {
    expect(
      validate({
        motivoTermino: 'Despido',
        tipoDespido: 'Necesidades de la Empresa',
        anosServicios: true,
        mesAviso: false,
      })
    ).toEqual({
      ok: true,
      faltantes: [],
    });
  });

  it('rechaza valores no booleanos en los campos de Necesidades de la Empresa', () => {
    expect(
      validate({
        motivoTermino: 'Despido',
        tipoDespido: 'Necesidades de la Empresa',
        anosServicios: 'false',
        mesAviso: 'true',
      })
    ).toEqual({
      ok: false,
      faltantes: ['anosServicios', 'mesAviso'],
    });
  });

  it('no exige anosServicios ni mesAviso para otros tipos de Despido', () => {
    expect(
      validate({
        motivoTermino: 'Despido',
        tipoDespido: 'Sin Causa',
      })
    ).toEqual({
      ok: true,
      faltantes: [],
    });
  });

  it('deja que el motor documental gestione un caso reconocido pero no implementado', () => {
    expect(
      validate({
        motivoTermino: 'Autodespido',
      })
    ).toEqual({
      ok: true,
      faltantes: [],
    });
  });

  it('deja que el motor documental gestione una subcausal desconocida pero informada', () => {
    expect(
      validate({
        motivoTermino: 'Despido',
        tipoDespido: 'Disciplinario',
        despidoDisciplinario: 'Causal Especial',
      })
    ).toEqual({
      ok: true,
      faltantes: [],
    });
  });
});
