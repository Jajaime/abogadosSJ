import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';
const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const demandaIdParam = url.searchParams.get('demandaId');

    if (!demandaIdParam) {
      return new Response(JSON.stringify({ error: 'ID de la demanda requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parsear y validar que sea entero
    const demandaId = Number(demandaIdParam);
    if (!Number.isInteger(demandaId)) {
      return new Response(JSON.stringify({ error: 'demandaId debe ser un entero' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const documento = await prisma.demandaDocumento.findFirst({
      where: { demandaId }, // ahora es Int
      select: { nombre: true, contenido: true, tamano: true },
    });

    if (!documento) {
      return new Response(JSON.stringify({ error: 'Documento no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // contenido (Bytes) se devuelve como Uint8Array/Buffer; Response lo soporta
    return new Response(documento.contenido, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(documento.nombre)}"`,
        'Content-Length': String(documento.tamano ?? (documento.contenido?.length ?? 0)),
      },
    });
  } catch (error) {
    console.error('[DOCX_DOWNLOAD_ERROR]', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
