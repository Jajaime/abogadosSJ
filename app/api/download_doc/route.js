import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const demandaId = request.nextUrl.searchParams.get('demandaId');
    console.log(demandaId);
    if (!demandaId) {
      return new Response(JSON.stringify({ error: 'ID de usuario requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const documento = await prisma.demandaDocumento.findFirst({
      where: { demandaId: demandaId },
      select: { nombre: true, contenido: true },
    });

    if (!documento) {
      return new Response(JSON.stringify({ error: 'Documento no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log(documento.nombre);
    return new Response(documento.contenido, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${documento.nombre}"`,
      },
    });
  } catch (error) {
    console.error('[DOCX_DOWNLOAD_ERROR]', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
