import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

export const runtime = 'nodejs';

const querySchema = z.object({
  demandaId: z.preprocess((value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || !/^\d+$/.test(trimmed)) return Number.NaN;
      return Number.parseInt(trimmed, 10);
    }
    return value;
  }, z.number().int().positive()),
});

const toSafeFilename = (value) => {
  if (typeof value !== 'string') return 'documento.docx';
  const sanitized = value.replace(/[\r\n]/g, ' ').trim();
  if (!sanitized) return 'documento.docx';
  return sanitized.slice(0, 255);
};

export async function GET(request) {
  try {
    const session = await requireSession();
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const parsed = querySchema.safeParse(params);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'demandaId debe ser un entero positivo' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { demandaId } = parsed.data;

    const documento = await prisma.demandaDocumento.findFirst({
      where: { demandaId, usuarioId: session.userId },
      select: { nombre: true, contenido: true, tamano: true },
    });

    if (!documento) {
      return new Response(JSON.stringify({ error: 'Documento no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!documento.contenido) {
      return new Response(JSON.stringify({ error: 'Documento sin contenido' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const safeName = toSafeFilename(documento.nombre);
    const encodedName = encodeURIComponent(safeName);
    const contentDisposition = `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`;

    return new Response(documento.contenido, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': contentDisposition,
        'Content-Length': String(documento.tamano ?? documento.contenido.length ?? 0),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('[DOCX_DOWNLOAD_ERROR]', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}