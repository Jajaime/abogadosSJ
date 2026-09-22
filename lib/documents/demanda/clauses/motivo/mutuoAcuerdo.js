/// lib/documents/demanda/clauses/motivo/mutuoAcuerdo.js

import { createClauseResult } from '../../types';

export function buildMutuoAcuerdo(ctx, caseInfo) {
  return createClauseResult({
    caseKey: caseInfo.caseKey,
    flags: {
      ...caseInfo.flags,
    },
    meta: {
      motivoTermino: caseInfo.normalized?.motivoTermino ?? '',
    },
    sections: {
      encabezado: ['Motivo Término -> Mutuo Acuerdo'],
      hechos: [
        `Se solicita el pago de los feriados legales y proporcionales pendientes al momento del término de la relación laboral, se solicita el pago Feriado Legal de ${ctx?.demandaFmt?.feriadoLegalHabilesText ?? '____________________'} por ${ctx?.demandaFmt?.feriado_legal_monto_clp ?? '____________________'} y Feriado Proporcional de ${ctx?.demandaFmt?.feriado_proporcional_habiles_text ?? '____________________'} por ${ctx?.demandaFmt?.feriado_proporcional_monto_clp ?? '____________________'}.`,
      ],
      derecho: [],
      peticiones: [],
      otrosi: [],
    },
  });
}