/// lib/documents/demanda/clauses/despido/disciplinario/acosoLaboral.js

import { createClauseResult } from '../../../types';

export function buildAcosoLaboral(ctx, caseInfo) {
  const fechaTermino =
    ctx?.demandaFmt?.fechaTerminoRelaLaboral_larga ||
    ctx?.demanda?.fechaTerminoRelaLaboral ||
    '_________________________';

  return createClauseResult({
    caseKey: caseInfo.caseKey,
    subKey: caseInfo.subKey,
    flags: {
      ...caseInfo.flags,
      isAcosoLaboral: true,
    },
    meta: {
      motivoTermino: caseInfo.normalized?.motivoTermino ?? '',
      tipoDespido: caseInfo.normalized?.tipoDespido ?? '',
      subtipo: caseInfo.normalized?.despidoDisciplinario ?? '',
    },
    sections: {
      encabezado: [
        '3) Motivo Término -> Despido',
        'a) Tipo Despido -> Disciplinario',
        '4) Disciplinario -> Acoso Laboral',
      ],
      hechos: [
        'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
        `Con fecha ${fechaTermino}, el empleador me comunicó verbalmente que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
        'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
        'En el caso presente niego todas las imputaciones realizadas por el empleador, pues son falsas.',
        'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
      ],
      derecho: [],
      peticiones: [
        `En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de ${ctx?.demandaFmt?.remuneracion_clp ?? '____________________'}.`,
        `También, por tanto, procede otorgar indemnización por años de servicio, correspondiente a: ${ctx?.demandaFmt?.indemnizacion_monto_clp ?? '____________________'} y es procedente que esta sea incrementada en un 80% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.`,
      ],
      otrosi: [],
    },
  });
}
