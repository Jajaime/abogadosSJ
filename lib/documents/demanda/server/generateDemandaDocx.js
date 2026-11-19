/// lib/documents/demanda/server/generateDemandaDocx.js

import path from 'path';
import fs from 'fs/promises';
import { createReport } from 'docx-templates';

import { safeSerializeDemanda, safeSerializeDemandados } from '@/utils/serializeDemanda';
import {
  decorateDemandaForDocx,
  decorateDemandadoSolidarioForDocx,
} from '@/utils/decorateDemanda';
import { formatFechaLargaDate } from '@/utils/formatters';

import { buildDemandaDocument } from '../buildDemandaDocument';
import { buildTemplateData } from '../template/buildTemplateData';
import { validarPatrocinanteDocx } from '../abogadoPatrocinante';

export const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024; // 2MB

const REQUIRED_BASE_FIELDS = [
  'nombres',
  'apPaterno',
  'apMaterno',
  'run',
  'nombreRazonSocial',
  'rutRazonSocial',
];

const sanitizeFilenamePart = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const buildDocumentFilename = (demanda) => {
  const personName =
    sanitizeFilenamePart(
      [demanda?.nombres, demanda?.apPaterno].filter(Boolean).join(' ')
    ).slice(0, 120) || 'Sin_Nombre';

  return `Demanda_${demanda.id}_${personName}.docx`;
};

const debug = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[generate_doc]', ...args);
  }
};

/**
 * @param {{ nombre_upper: string, rut_fmt: string }[]} demandadoSolidariosFmt
 */
function solidariosInline(demandadoSolidariosFmt = []) {
  const items = demandadoSolidariosFmt.map(
    (demandado) => `${demandado.nombre_upper}, RUT: ${demandado.rut_fmt}`
  );

  if (items.length === 0) return '';
  if (items.length === 1) return items[0];

  return items.slice(0, -1).join(', ') + ' y ' + items[items.length - 1];
}

export function prepareDemandaDocument(demandaDB) {
  // No crear documentos con el patrocinante fijo de la antigua plantilla.
  // El abogado procede únicamente de la relación cargada por Prisma.
  const validacionAbogado = validarPatrocinanteDocx(demandaDB?.abogadoPatrocinante);
  if (!validacionAbogado.ok) {
    return {
      ok: false,
      code: 'DOCUMENT_ABOGADO_INVALIDO',
      detail: validacionAbogado.detail,
      faltantes: validacionAbogado.faltantes,
      clauseResult: null,
    };
  }

  const demandadoSolidariosDB = Array.isArray(demandaDB?.demandadoSolidario)
    ? demandaDB.demandadoSolidario
    : [];

  const demandaSerializada = safeSerializeDemanda({
    ...demandaDB,
    demandadoSols: demandadoSolidariosDB,
  });

  const missingBaseFields = REQUIRED_BASE_FIELDS.filter(
    (field) => !demandaSerializada[field]
  );

  if (missingBaseFields.length > 0) {
    return {
      ok: false,
      code: 'DOCUMENT_BASE_VALIDATION',
      faltantes: missingBaseFields,
      clauseResult: null,
    };
  }

  const demandadosSerializados = safeSerializeDemandados(demandadoSolidariosDB);
  debug('demandadosSerializados', {
    count: demandadosSerializados.length,
  });

  const demandaFmt = decorateDemandaForDocx(demandaSerializada);
  const demandadoSolidariosFmt = demandadosSerializados.map(
    decorateDemandadoSolidarioForDocx
  );

  const docCtx = {
    fechaEmision: formatFechaLargaDate(new Date()),
    demanda: demandaSerializada,
    demandadoSolidarios: demandadosSerializados,
    demandaFmt,
    demandadoSolidariosFmt,
    abogadoPatrocinante: validacionAbogado.abogado,
  };

  const documentBuild = buildDemandaDocument(docCtx);

  if (!documentBuild.ok) {
    return documentBuild;
  }

  return {
    ok: true,
    nombreArchivo: buildDocumentFilename(demandaDB),
    templateData: buildTemplateData({
      ctx: docCtx,
      clauseResult: documentBuild.clauseResult,
      hasDemandadoSolidarios: demandadoSolidariosFmt.length > 0,
      solidariosInline: solidariosInline(demandadoSolidariosFmt),
    }),
  };
}

export async function renderDemandaDocx(templateData) {
  const templatePath = path.resolve(
    process.cwd(),
    'app',
    'templates',
    'template_demanda.docx'
  );
  const template = await fs.readFile(templatePath);

  return createReport({
    template,
    data: templateData,
  });
}
