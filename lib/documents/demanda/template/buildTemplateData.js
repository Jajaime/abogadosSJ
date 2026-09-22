/// lib/documents/demanda/template/buildTemplateData.js

import { sectionsToSingleText, joinParagraphs } from './paragraphUtils';

export function buildTemplateData({
  ctx,
  clauseResult,
  hasDemandadoSolidarios,
  solidariosInline,
}) {
  const sections = clauseResult?.sections ?? {
    encabezado: [],
    hechos: [],
    derecho: [],
    peticiones: [],
    otrosi: [],
  };

  return {
    fechaEmision: ctx.fechaEmision,
    demanda: ctx.demanda,
    demandadoSolidarios: ctx.demandadoSolidarios,
    demandaFmt: ctx.demandaFmt,
    demandadoSolidariosFmt: ctx.demandadoSolidariosFmt,
    solidarios_inline: solidariosInline,
    hasDemandadoSolidarios,

    // compatibilidad vieja si aún la ocupas en alguna prueba
    clausulas: sectionsToSingleText(sections),
    clausulasTexto: sectionsToSingleText(sections),

    // NUEVO: cada sección como string listo para Word
    clausulas_encabezado: joinParagraphs(sections.encabezado ?? []),
    clausulas_hechos: joinParagraphs(sections.hechos ?? []),
    clausulas_derecho: joinParagraphs(sections.derecho ?? []),
    clausulas_peticiones: joinParagraphs(sections.peticiones ?? []),
    clausulas_otrosi: joinParagraphs(sections.otrosi ?? []),

    ...(clauseResult?.flags ?? {}),
  };
}