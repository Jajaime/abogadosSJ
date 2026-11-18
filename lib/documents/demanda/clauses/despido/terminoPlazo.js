/// lib/documents/demanda/clauses/despido/terminoPlazo.js

import { createClauseResult } from '../../types';

export function buildTerminoPlazo(ctx, caseInfo) {
  const fechaTermino =
    ctx?.demandaFmt?.fechaTerminoRelaLaboral_larga ||
    ctx?.demanda?.fechaTerminoRelaLaboral ||
    '_________________________';

  return createClauseResult({
    caseKey: caseInfo.caseKey,
    flags: {
      ...caseInfo.flags,
    },
    meta: {
      motivoTermino: caseInfo.normalized?.motivoTermino ?? '',
      tipoDespido: caseInfo.normalized?.tipoDespido ?? '',
    },
    sections: {
      encabezado: [
        '3) Motivo Término -> Despido',
        'd) Tipo Despido -> Término de Plazo',
      ],
      hechos: [
        'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
        `Con fecha ${fechaTermino}, el empleador me comunicó que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
        'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
        'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
      ],
      derecho: [
        'En el caso presente el contrato no ha vencido pues ha pasado a indefinido por operar los presupuestos del artículo 159 del CT.',
      ],
      peticiones: [
        `• Indemnización sustitutiva del aviso previo: ${ctx?.demandaFmt?.remuneracion_clp ?? '____________________'}`,
        `• Indemnización por años de servicios: ${ctx?.demandaFmt?.indemnizacion_monto_clp ?? '____________________'} y es procedente que esta sea incrementada en un 50% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.`,
      ],
      otrosi: [],
    },
  });
}
