/// lib/documents/demanda/clauses/motivo/renuncia.js

import { createClauseResult } from '../../types';

export function buildRenuncia(ctx, caseInfo) {
  return createClauseResult({
    caseKey: caseInfo.caseKey,
    flags: {
      ...caseInfo.flags,
    },
    meta: {
      motivoTermino: caseInfo.normalized?.motivoTermino ?? '',
    },
    sections: {
      encabezado: ['Motivo Término -> Renuncia'],
      hechos: [
        'Solo genera el pago del feriado legal o proporcional.',
      ],
      derecho: [],
      peticiones: [],
      otrosi: [],
    },
  });
}