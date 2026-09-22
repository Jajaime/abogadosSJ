// app/api/download/route.js
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePerm, isElevated } from '@/lib/api-authz';
// ✅ para elevar permisos si lo necesitas

export const runtime = 'nodejs';

/** ────────────────────────────────────────────────────────────────────────────
 *  1) Schemas y helpers
 *  ──────────────────────────────────────────────────────────────────────────── */
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

const SAFE_FILENAME_REGEX = /^[^<>:"/\\|?*\r\n]+$/;

/** Recorta y deja un nombre seguro. Si es vacío o inválido, usa por defecto. */
const toSafeFilename = (value) => {
  if (typeof value !== 'string') return 'documento.docx';
  const sanitized = value.replace(/[\r\n]/g, ' ').trim();
  if (!sanitized) return 'documento.docx';
  const trimmed = sanitized.slice(0, 255);
  if (!SAFE_FILENAME_REGEX.test(trimmed)) return 'documento.docx';
  return trimmed;
};

/** Calcula tamaño de forma robusta (Buffer, Uint8Array, etc.) */
const byteLength = (val) => {
  if (!val) return 0;
  if (typeof val.byteLength === 'number') return val.byteLength;
  if (typeof val.length === 'number') return val.length;
  return 0;
};

/** ────────────────────────────────────────────────────────────────────────────
 *  2) Handler
 *  ──────────────────────────────────────────────────────────────────────────── */
export async function GET(request) {
  try {
    const { session, error } = await requirePerm('downloadDoc');
    if (error) return error;

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

    const demanda = await prisma.demanda.findUnique({
      where: { id: demandaId },
      select: { id: true, usuarioId: true },
    });

    if (!demanda) {
      return new Response(JSON.stringify({ error: 'Demanda no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!isElevated(session.roles) && demanda.usuarioId !== session.userId) {
      return new Response(JSON.stringify({ error: 'Prohibido' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const documento = await prisma.demandaDocumento.findUnique({
      where: { demandaId },
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

    const body = documento.contenido;
    const len = Number(documento.tamano ?? byteLength(body));

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': contentDisposition,
        'Content-Length': String(len),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, max-age=0',
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
