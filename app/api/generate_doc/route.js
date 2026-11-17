// app/api/generate_doc/route.js
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { createReport } from 'docx-templates';
import { z } from 'zod';

// OJO: si usas alias "@/..." en JS, asegúrate de tener jsconfig.json/tsconfig.json con "paths".
import { safeSerializeDemanda, safeSerializeDemandados } from '@/utils/serializeDemanda';
import { decorateDemandaForDocx, decorateDemandadoSolidarioForDocx } from '@/utils/decorateDemanda';
import { formatFechaLargaDate } from '@/utils/formatters';
import { prisma } from '@/lib/prisma';
import { requirePerm, isElevated } from '@/lib/api-authz';
import {
  resolveTerminationCase,
  validateTerminationCase,
  buildDemandaDocument,
  buildTemplateData,
} from '@/lib/documents/demanda';
//import { de } from 'zod/v4/locales';

export const runtime = 'nodejs';

const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024; // 2MB
const sanitizeFilenamePart = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const buildDocumentFilename = (demanda) => {
  const personName = sanitizeFilenamePart(
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
  const items = demandadoSolidariosFmt.map(d => `${d.nombre_upper}, RUT: ${d.rut_fmt}`);
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(', ') + ' y ' + items[items.length - 1];
}


/* =========================
   1) Schemas y handler
   ========================= */

const requestSchema = z.object({
  demandaId: z.preprocess((value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || !/^\d+$/.test(trimmed)) return Number.NaN;
      return Number.parseInt(trimmed, 10);
    }
    return value;
  }, z.number().int().positive()),
});

export async function POST(request) {
  try {
    const { session, error } = await requirePerm('generateDoc');
    if (error) return error;

    const raw = await request.json();
    const parsed = requestSchema.safeParse(raw);

    if (!parsed.success) {
      const detail = parsed.error.issues.map((issue) => issue.message).join(', ');
      console.debug(parsed.error.issues);
      return NextResponse.json(
        { success: false, error: 'Body inválido', detail },
        { status: 400 }
      );
    }

    const { demandaId } = parsed.data;

    // 1) Buscar en DB
    const demandaDB = await prisma.demanda.findUnique({
      where: { id: demandaId },
      include: {
        demandadoSolidario: true,
      },
    });

    if (!demandaDB) {
      return NextResponse.json({ success: false, error: 'Demanda no encontrada' }, { status: 404 });
    }

    if (!isElevated(session.roles) && demandaDB.usuarioId !== session.userId) {
      return NextResponse.json({ success: false, error: 'Prohibido' }, { status: 403 });
    }

    // 2) PostgreSQL es la única fuente de datos del documento.
    const demandadoSolidariosDB = Array.isArray(demandaDB.demandadoSolidario)
      ? demandaDB.demandadoSolidario
      : [];

    const demandaSerializada = safeSerializeDemanda({
      ...demandaDB,
      demandadoSols: demandadoSolidariosDB,
    });

    const nombreArchivo = buildDocumentFilename(demandaDB);

    // 3) Validar campos base provenientes de PostgreSQL.
    const missingBaseFields = ['nombres', 'apPaterno', 'apMaterno', 'run', 'nombreRazonSocial', 'rutRazonSocial'].filter(
      (field) => !demandaSerializada[field]
    );

    if (missingBaseFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan datos obligatorios para generar el documento',
          detail: `Campos requeridos sin valor: ${missingBaseFields.join(', ')}`,
        },
        { status: 422 }
      );
    }

    const caseInfo = resolveTerminationCase(demandaSerializada);
    const validation = validateTerminationCase(caseInfo, demandaSerializada);

    if (!validation.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan datos obligatorios para las cláusulas legales',
          detail: `Campos faltantes: ${validation.faltantes.join(', ')}`,
          code: 'CLAUSULAS_VALIDATION',
        },
        { status: 422 }
      );
    }

    const demandadosSerializados = safeSerializeDemandados(demandadoSolidariosDB);
    debug('demandadosSerializados', {
      count: demandadosSerializados.length,
    });

    // 4) Data formateada para la plantilla
    const demandaFmt = decorateDemandaForDocx(demandaSerializada);
    const demandadoSolidariosFmt = (Array.isArray(demandadosSerializados) ? demandadosSerializados : []).map(
      decorateDemandadoSolidarioForDocx
    );

    const fechaEmisionLarga = formatFechaLargaDate(new Date());
    const hasDemandadoSolidarios = demandadoSolidariosFmt.length > 0;

    const docCtx = {
      fechaEmision: fechaEmisionLarga,
      demanda: demandaSerializada,
      demandadoSolidarios: demandadosSerializados,
      demandaFmt,
      demandadoSolidariosFmt,
    };

    const documentBuild = buildDemandaDocument(docCtx);

    if (!documentBuild.ok) {
      if (documentBuild.code === 'DOCUMENT_CASE_NOT_IMPLEMENTED') {
        return NextResponse.json(
          {
            success: false,
            error: 'Caso documental no implementado',
            detail: documentBuild.detail,
            code: documentBuild.code,
          },
          { status: 422 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Faltan datos obligatorios para las cláusulas legales',
          detail: `Campos faltantes: ${documentBuild.faltantes.join(', ')}`,
          code: documentBuild.code ?? 'CLAUSULAS_VALIDATION',
        },
        { status: 422 }
      );
    }

    const templateData = buildTemplateData({
      ctx: docCtx,
      clauseResult: documentBuild.clauseResult,
      hasDemandadoSolidarios,
      solidariosInline: solidariosInline(demandadoSolidariosFmt),
    });

    // 7) Leer plantilla
    const templatePath = path.resolve(process.cwd(), 'app', 'templates', 'template_demanda.docx');
    const template = await fs.readFile(templatePath);

    // 8) Generar documento
    const buffer = await createReport({
      template,
      data: templateData,
    });

    if (buffer.byteLength > MAX_DOCUMENT_SIZE) {
      return NextResponse.json(
        { success: false, error: 'El documento excede el tamaño máximo permitido' },
        { status: 413 }
      );
    }

    // 9) Un único documento vigente por demanda.
    // usuarioId identifica a quien realizó la última generación.
    const documento = await prisma.demandaDocumento.upsert({
      where: { demandaId: demandaDB.id },
      update: {
        nombre: nombreArchivo,
        contenido: buffer,
        tamano: buffer.byteLength,
        usuarioId: session.userId,
      },
      create: {
        nombre: nombreArchivo,
        contenido: buffer,
        demandaId: demandaDB.id,
        usuarioId: session.userId,
        tamano: buffer.byteLength,
      },
    });

    return NextResponse.json({
      success: true,
      documentoId: documento.id,
      mensaje: 'Documento generado y guardado correctamente',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('[DOCX_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
