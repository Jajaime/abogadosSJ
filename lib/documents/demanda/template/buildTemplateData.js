/// lib/documents/demanda/template/buildTemplateData.js

import { sectionsToSingleText, joinParagraphs, cleanParagraphs } from './paragraphUtils';

function buildSolidariosComparecencia(items = []) {
  return items.map((d) => {
    const partes = [
      `${d.nombre_upper ?? ''}, RUT: ${d.rut_fmt ?? ''}`,
    ];
    if (d.domicilio_upper) {
      partes.push(`con domicilio en ${d.domicilio_upper}`);
    }
    if (d.representanteLegal_upper) {
      const rutRep = d.runRepresentanteLegal_fmt
        ? `, RUN: ${d.runRepresentanteLegal_fmt}`
        : '';
      partes.push(`cuya representación legal corresponde a ${d.representanteLegal_upper}${rutRep}`);
    }
    return partes.join(', ');
  }).join('; y ');
}

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
    abogado_nombre: ctx.abogadoPatrocinante?.nombreCompleto?.toLocaleUpperCase('es-CL') ?? '',
    abogado_run: ctx.abogadoPatrocinante?.run ?? '',
    abogado_domicilio: ctx.abogadoPatrocinante?.domicilioProfesional?.toLocaleUpperCase('es-CL') ?? '',
    demanda: ctx.demanda,
    demandadoSolidarios: ctx.demandadoSolidarios,
    demandaFmt: ctx.demandaFmt,
    demandadoSolidariosFmt: ctx.demandadoSolidariosFmt,
    solidarios_inline: solidariosInline,
    solidarios_comparecencia: buildSolidariosComparecencia(ctx.demandadoSolidariosFmt),
    hasDemandadoSolidarios,

    // compatibilidad vieja si aún la ocupas en alguna prueba
    clausulas: sectionsToSingleText(sections),
    clausulasTexto: sectionsToSingleText(sections),

    // NUEVO: cada sección como string listo para Word
    clausulas_encabezado: joinParagraphs(sections.encabezado ?? []),
    clausulas_hechos: joinParagraphs(sections.hechos ?? []),
    clausulas_derecho: joinParagraphs(sections.derecho ?? []),
    clausulas_derecho_parrafos: cleanParagraphs(sections.derecho ?? []),
    clausulas_peticiones: joinParagraphs(sections.peticiones ?? []),
    clausulas_peticiones_parrafos: cleanParagraphs(sections.peticiones ?? []),
    clausulas_otrosi: joinParagraphs(sections.otrosi ?? []),

    ...(clauseResult?.flags ?? {}),
  };
}