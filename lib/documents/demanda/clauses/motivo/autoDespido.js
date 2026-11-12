/// lib/documents/demanda/clauses/motivo/autoDespido.js

import { createClauseResult } from '../../types';

export function buildAutoDespido(ctx, caseInfo) {
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
    },
    sections: {
      encabezado: ['4) Motivo Término -> AutoDespido'],
      hechos: [],
      derecho: [
        'El artículo 171 del Código del Trabajo consagra la institución que doctrinariamente se conoce como despido indirecto o auto despido en los siguientes términos: “Si quien incurriere en las causales de los números 1, 5 ó 7 del artículo 160 fuere el empleador, el trabajador podrá poner término al contrato y recurrir al juzgado respectivo, dentro del plazo de sesenta días hábiles, contado desde la terminación, para que éste ordene el pago de las indemnizaciones establecidas en el inciso cuarto del artículo 162, y en los incisos primero o segundo del artículo 163, según corresponda, aumentada en un cincuenta por ciento en el caso de la causal del número 7º...”',
        `Con fecha ${fechaTermino}, tomé la decisión de poner término al contrato por haberse incumplido por parte del empleador las obligaciones contractuales señaladas.`,
        '2.- Pues bien, en el caso de autos la demandada ha incurrido en la causal de caducidad establecida en el numeral séptimo del artículo 160 del Código del Trabajo, esto es “Incumplimiento grave de las obligaciones que impone el contrato”. Efectivamente, tal como se ha explicado en detalle en la relación circunstanciada de los hechos, el demandado no ha respetado derechos básicos establecidos a favor de los trabajadores que deben entenderse incorporados a todo contrato individual de trabajo, asimismo no ha respetado cláusulas del mismo válidamente acordadas por las partes y no ha dado cumplimiento a obligaciones contenidas en las leyes de seguridad social.',
        'Si bien se pactaron todas las estipulaciones antedichas, como la remuneración, jornada de trabajo, naturaleza del contrato, la demandada no cumplió, como por ejemplo escrituró mi contrato individual de trabajo, no contaba con libro de asistencia y no me entregó liquidaciones de remuneraciones.',
      ],
      peticiones: [
        `• Indemnización sustitutiva del aviso previo: ${ctx?.demandaFmt?.remuneracion_clp ?? '____________________'}`,
        `• Indemnización por años de servicios: ${ctx?.demandaFmt?.indemnizacion_monto_clp ?? '____________________'} y es procedente que esta sea incrementada en un 50% siendo esta suma según apreciación de S.S., de acuerdo al artículo 171 del CT.`,
      ],
      otrosi: [],
    },
  });
}
