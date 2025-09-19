// app/api/generate_doc/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import { createReport } from 'docx-templates';

// OJO: si usas alias "@/..." en JS, asegúrate de tener jsconfig.json/tsconfig.json con "paths".
// Si no lo tienes, cambia estos imports a rutas relativas.
import { safeSerializeDemanda, safeSerializeDemandados } from '@/utils/serializeDemanda';
import { decorateDemandaForDocx, decorateDemandadoSolidarioForDocx } from '@/utils/decorateDemanda';
import { formatFechaLargaDate } from '@/utils/formatters';

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

    // 2) Normaliza la fuente desde DB (si mañana cambias el nombre de la relación, solo tocas aquí)
    const demandadoSolidariosDB = Array.isArray(demandaDB?.demandadoSolidario)
      ? demandaDB.demandadoSolidario
      : [];

    // 3) SOLO usa lo del body si es un array con elementos; si viene vacío o inexistente, usa DB
    const bodyHasSolidarios = Array.isArray(raw?.demandadoSolidarios) && raw.demandadoSolidarios.length > 0;
    const sourceSolidarios = bodyHasSolidarios ? raw.demandadoSolidarios : demandadoSolidariosDB;


    // DEBUG para ver qué nombre trae datos realmente
    console.log('DBG keys:', Object.keys(demandaDB || {}));
    console.log('DBG lengths:', {
      demandadoSolidario: Array.isArray(demandaDB?.demandadoSolidario) ? demandaDB.demandadoSolidario.length : null,
      demandadoSols: Array.isArray(demandaDB?.demandadoSols) ? demandaDB.demandadoSols.length : null,
      demandadoSolidarios: Array.isArray(demandaDB?.demandadoSolidarios) ? demandaDB.demandadoSolidarios.length : null,
    });

    // Toma la lista que exista (solo una será array)
    const solidariosDB =
      Array.isArray(demandaDB?.demandadoSolidario) ? demandaDB.demandadoSolidario :
        Array.isArray(demandaDB?.demandadoSols) ? demandaDB.demandadoSols :
          Array.isArray(demandaDB?.demandadoSolidarios) ? demandaDB.demandadoSolidarios :
            [];

    console.log('DBG solidariosDB length:', solidariosDB.length);

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
        domicilioParticular: demandaDB.domicilioParticular ?? '',

        demandadoSols: Array.isArray(demandaDB?.demandadoSolidario)
          ? demandaDB.demandadoSolidario.map((x) => ({
            id: x.id,
            nombreRazonSocial: x.nombreRazonSocial ?? '',
            rut: x.rut ?? '',
            domicilio: x.domicilio ?? '',
            representanteLegal: x.representanteLegal ?? '',
            runRepresentanteLegal: x.runRepresentanteLegal ?? '',
          }))
          : [],

        nombreRazonSocial: demandaDB?.nombreRazonSocial ?? '',
        rutRazonSocial: demandaDB?.rutRazonSocial ?? '',
        domicilioRazonSocial: demandaDB?.domicilioRazonSocial ?? '',

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

    const demandadosSerializados = safeSerializeDemandados(
  sourceSolidarios.map((x) => ({
    id: x.id,
    nombreRazonSocial: x.nombreRazonSocial ?? '',
    rut: x.rut ?? '',
    domicilio: x.domicilio ?? '',
    representanteLegal: x.representanteLegal ?? '',
    runRepresentanteLegal: x.runRepresentanteLegal ?? '',
  }))
);
    console.log('DBG demandadosSerializados length2:', demandaDB.demandadoSolidario.length);
    console.log('DBG demandadosSerializados length:', demandadosSerializados.length);
    // (opcional) logs de verificación
console.log('DBG solidariosDB length:', solidariosDB.length);
console.log('DBG bodyHasSolidarios:', bodyHasSolidarios, ' (si true, pisó DB)');
console.log('DBG demandadosSerializados length:', demandadosSerializados.length);
    // >>> AQUÍ VA TU BLOQUE NUEVO <<<
    // 3) Data formateada para la plantilla (nombres en mayúsculas, fechas largas, RUT, CLP, etc.)
    const demandaFmt = decorateDemandaForDocx(demandaSerializada);
    const demandadoSolidariosFmt = (Array.isArray(demandadosSerializados) ? demandadosSerializados : [])
      .map(decorateDemandadoSolidarioForDocx);

    // (opcional) ya no uses la función antigua formatFecha() para la portada:
    const fechaEmisionLarga = formatFechaLargaDate(new Date());
    const hasDemandadoSolidarios = demandadoSolidariosFmt.length > 0;

    // 3) Data para la plantilla DOCX
    const templateData = {
      fechaEmision: fechaEmisionLarga,
      demanda: demandaSerializada,                 // crudo, por si lo necesitas
      demandadoSolidarios: demandadosSerializados, // crudo
      demandaFmt,                                  // formateado listo para imprimir
      demandadoSolidariosFmt,                      // formateado listo para imprimir
      hasDemandadoSolidarios,
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
