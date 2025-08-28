// app/api/generate_doc/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import { createReport } from 'docx-templates';

// OJO: si usas alias "@/..." en JS, asegúrate de tener jsconfig.json/tsconfig.json con "paths".
// Si no lo tienes, cambia estos imports a rutas relativas.
import { safeSerializeDemanda, safeSerializeDemandados } from '@/utils/serializeDemanda';

export const runtime = 'nodejs';

const prisma = new PrismaClient();

function formatFecha(str) {
  if (!str) return '';
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return '';
  }
}

export async function POST(request) {
  try {
    const raw = await request.json();
    const demandaId = raw?.demandaId;
    const nombreArchivo = raw?.nombreArchivo;

    if (!demandaId || !nombreArchivo) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos faltantes (demandaId, nombreArchivo)' },
        { status: 400 }
      );
    }

    // 1) Buscar en DB (fuente de verdad / fallback)
    const demandaDB = await prisma.demanda.findUnique({
      where: { id: demandaId },
      include: {
        // Ajusta al nombre real de tu relación en el schema
        demandadoSolidario: true,
      },
    });

    if (!demandaDB) {
      return NextResponse.json(
        { success: false, error: 'Demanda no encontrada' },
        { status: 404 }
      );
    }

    // 2) Tomar del BODY (si viene) o mapear desde DB y serializar SIEMPRE
    const demandaSerializada = raw?.demanda
      ? safeSerializeDemanda(raw.demanda)
      : safeSerializeDemanda({
          // mapeo mínimo desde DB -> DTO para que el serializador trabaje
          // (ajusta nombres si difieren de tu schema)
          nombres: demandaDB.nombres ?? '',
          apPaterno: demandaDB.apPaterno ?? '',
          apMaterno: demandaDB.apMaterno ?? '',
          run: demandaDB.run ?? '',
          fechaNacimiento: demandaDB.fechaNacimiento
            ? new Date(demandaDB.fechaNacimiento).toISOString()
            : '',
          nacionalidad: demandaDB?.nacionalidad ?? '',
          correoElectronico: demandaDB.correoElectronico ?? '',
          estadoCivil: demandaDB?.estadoCivil ?? '',

          demandadoSols: Array.isArray(demandaDB?.demandadoSols)
            ? demandaDB.demandadoSols.map((x) => ({
                id: x.id,
                nombre: x.nombre ?? '',
                rut: x.rut ?? '',
                domicilio: x.domicilio ?? '',
              }))
            : [],

          nombreRazonSocial: demandaDB?.nombreRazonSocial ?? '',
          rutRazonSocial: demandaDB?.rutRazonSocial ?? '',
          domicilioRazonSocial: demandaDB?.domicilioRazonSocial ?? '',
          representanteLegal: demandaDB?.representanteLegal ?? '',
          runRepresentanteLegal: demandaDB?.runRepresentanteLegal ?? '',

          fechaInicioRelacionLaboral: demandaDB?.fechaInicioRelacionLaboral
            ? new Date(demandaDB.fechaInicioRelacionLaboral).toISOString()
            : '',
          naturalezaContrato: demandaDB?.naturalezaContrato ?? '',
          funciones: demandaDB?.funciones ?? '',
          lugar: demandaDB?.lugar ?? '',
          jornada: demandaDB?.jornada ?? '',
          otraJornada: demandaDB?.otraJornada ?? '',
          registroAsistencia: !!demandaDB?.registroAsistencia,
          remuneracion: Number(demandaDB?.remuneracion) || 0,
          formaPago: demandaDB?.formaPago ?? '',
          liquidacionSueldo: !!demandaDB?.liquidacionSueldo,
          cotizacionSalud: demandaDB?.cotizacionSalud ?? '',
          cotizacionAfp: demandaDB?.cotizacionAfp ?? '',
          cotizacionAfc: demandaDB?.cotizacionAfc ?? '',
          vacaciones: Number(demandaDB?.vacaciones) || 0,
          fuero: demandaDB?.fuero ?? '',

          fechaTerminoRelaLaboral: demandaDB?.fechaTerminoRelaLaboral
            ? new Date(demandaDB.fechaTerminoRelaLaboral).toISOString()
            : '',
          motivoTermino: demandaDB?.motivoTermino ?? '',
          tipoDespido: demandaDB?.tipoDespido ?? '',
          despidoDisciplinario: demandaDB?.despidoDisciplinario ?? '',
          otroDespidoDisciplinario: demandaDB?.otroDespidoDisciplinario ?? '',
          anosServicios: !!demandaDB?.anosServicios,
          mesAviso: !!demandaDB?.mesAviso,
          finiquito: !!demandaDB?.finiquito,
          prestacionesAdeudadas: Array.isArray(demandaDB?.prestacionesAdeudadas)
            ? demandaDB.prestacionesAdeudadas
            : [],
          materias: Array.isArray(demandaDB?.materias) ? demandaDB.materias : [],
        });

    const demandadosSerializados = raw?.demandadoSolidarios
      ? safeSerializeDemandados(raw.demandadoSolidarios)
      : safeSerializeDemandados(
          Array.isArray(demandaDB?.demandadoSols)
            ? demandaDB.demandadoSols.map((x) => ({
                id: x.id,
                nombre: x.nombre ?? '',
                rut: x.rut ?? '',
                domicilio: x.domicilio ?? '',
              }))
            : []
        );

    // 3) Data para la plantilla DOCX
    const templateData = {
      fechaEmision: formatFecha(new Date().toISOString()),
      demanda: demandaSerializada,
      demandadoSolidarios: demandadosSerializados,
    };

    // 4) Leer plantilla
    const templatePath = path.resolve(process.cwd(), 'app', 'templates', 'template_demanda.docx');
    const template = await fs.readFile(templatePath);

    // 5) Generar documento
    const buffer = await createReport({
      template,
      data: templateData,
    });

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'El documento excede el tamaño máximo permitido' },
        { status: 413 }
      );
    }

    // 6) Guardar documento
    const documento = await prisma.demandaDocumento.create({
      data: {
        nombre: nombreArchivo,
        contenido: buffer,
        demandaId: demandaDB.id, // id Int
        tamano: buffer.byteLength, // usa "tamano" en el schema (sin ñ)
        // Si tu modelo tiene JSON:
        // metadata: { demandaUsada: demandaSerializada, demandadosUsados: demandadosSerializados },
      },
    });

    return NextResponse.json({
      success: true,
      documentoId: documento.id,
      mensaje: 'Documento generado y guardado correctamente',
    });
  } catch (error) {
    console.error('[DOCX_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
