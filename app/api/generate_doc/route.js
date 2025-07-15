// app/api/generate_doc/route.js
import { NextResponse } from 'next/server';
import createReport from 'docx-templates';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // 1. Obtener datos del body
    const body = await request.json();

    // Validar campos requeridos
    if (!body.demandaId || !body.nombreArchivo) {
      return NextResponse.json(
        { success: false, error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Validar existencia de la demanda
    const demandaExistente = await prisma.demanda.findUnique({
      where: { id: body.demandaId }
    });

    if (!demandaExistente) {
      return NextResponse.json(
        { success: false, error: "Demanda no encontrado" },
        { status: 404 }
      );
    }

    // 2. Leer plantilla desde el sistema de archivos
    const templatePath = path.resolve(process.cwd(), 'app', 'templates', 'template_demanda.docx');
    const template = await fs.readFile(templatePath);

    // 3. Generar documento
    const buffer = await createReport({
      template,
      data: body, // Usa el objeto body completo
    });

    // Después de generar el buffer
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "El documento excede el tamaño máximo permitido" },
        { status: 413 }
      );
    }

    // 4. Guardar documento en PostgreSQL
    const documento = await prisma.demandaDocumento.create({
      data: {
        nombre: body.nombreArchivo,
        contenido: buffer,
        demandaId: body.demandaId.toString(),
        tamaño: buffer.byteLength,
      }
    });

    return NextResponse.json({
      success: true,
      documentoId: documento.id,
      mensaje: 'Documento generado y guardado correctamente'
    });

  } catch (error) {
    console.error('[DOCX_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
