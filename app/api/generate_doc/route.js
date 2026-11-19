// app/api/generate_doc/route.js
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { requirePerm, isElevated } from '@/lib/api-authz';
import {
  MAX_DOCUMENT_SIZE,
  prepareDemandaDocument,
  renderDemandaDocx,
} from '@/lib/documents/demanda/server/generateDemandaDocx';

export const runtime = 'nodejs';

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

    const demandaDB = await prisma.demanda.findUnique({
      where: { id: demandaId },
      include: {
        demandadoSolidario: true,
        abogadoPatrocinante: {
          select: {
            id: true,
            nombreCompleto: true,
            run: true,
            domicilioProfesional: true,
            activo: true,
          },
        },
      },
    });

    if (!demandaDB) {
      return NextResponse.json(
        { success: false, error: 'Demanda no encontrada' },
        { status: 404 }
      );
    }

    if (!isElevated(session.roles) && demandaDB.usuarioId !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Prohibido' },
        { status: 403 }
      );
    }

    const prepared = prepareDemandaDocument(demandaDB);

    if (!prepared.ok) {
      if (prepared.code === 'DOCUMENT_ABOGADO_INVALIDO') {
        return NextResponse.json(
          {
            success: false,
            error: 'Debe asignar un abogado patrocinante activo con datos profesionales completos.',
            detail: prepared.detail,
            code: prepared.code,
          },
          { status: 422 }
        );
      }
      if (prepared.code === 'DOCUMENT_BASE_VALIDATION') {
        return NextResponse.json(
          {
            success: false,
            error: 'Faltan datos obligatorios para generar el documento',
            detail: `Campos requeridos sin valor: ${prepared.faltantes.join(', ')}`,
          },
          { status: 422 }
        );
      }

      if (prepared.code === 'DOCUMENT_CASE_NOT_IMPLEMENTED') {
        return NextResponse.json(
          {
            success: false,
            error: 'Caso documental no implementado',
            detail: prepared.detail,
            code: prepared.code,
          },
          { status: 422 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Faltan datos obligatorios para las cláusulas legales',
          detail: `Campos faltantes: ${prepared.faltantes.join(', ')}`,
          code: prepared.code ?? 'CLAUSULAS_VALIDATION',
        },
        { status: 422 }
      );
    }

    const buffer = await renderDemandaDocx(prepared.templateData);

    if (buffer.byteLength > MAX_DOCUMENT_SIZE) {
      return NextResponse.json(
        { success: false, error: 'El documento excede el tamaño máximo permitido' },
        { status: 413 }
      );
    }

    const documento = await prisma.demandaDocumento.upsert({
      where: { demandaId: demandaDB.id },
      update: {
        nombre: prepared.nombreArchivo,
        contenido: buffer,
        tamano: buffer.byteLength,
        usuarioId: session.userId,
      },
      create: {
        nombre: prepared.nombreArchivo,
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
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    console.error('[DOCX_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
