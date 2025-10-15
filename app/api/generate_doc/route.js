// app/api/generate_doc/route.js
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { createReport } from 'docx-templates';
import { z } from 'zod';

// OJO: si usas alias "@/..." en JS, asegúrate de tener jsconfig.json/tsconfig.json con "paths".
// Si no lo tienes, cambia estos imports a rutas relativas.
import { safeSerializeDemanda, safeSerializeDemandados } from '@/utils/serializeDemanda';
import { decorateDemandaForDocx, decorateDemandadoSolidarioForDocx } from '@/utils/decorateDemanda';
import { formatFechaLargaDate } from '@/utils/formatters';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024; // 2MB
const SAFE_FILENAME_REGEX = /^[^<>:"/\\|?*\r\n]+$/;
const numberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const debug = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[generate_doc]', ...args);
  }
};

const demandadoSolidarioSchema = z
  .object({
    id: z.string().trim().optional(),
    nombreRazonSocial: z.string().trim().max(255).optional(),
    rut: z.string().trim().max(30).optional(),
    domicilio: z.string().trim().max(255).optional(),
    representanteLegal: z.string().trim().max(255).optional(),
    runRepresentanteLegal: z.string().trim().max(30).optional(),
  })
  .strip();

const demandaSchema = z
  .object({
    id: z.string().optional(),
    nombres: z.string().trim().optional(),
    apPaterno: z.string().trim().optional(),
    apMaterno: z.string().trim().optional(),
    run: z.string().trim().optional(),
    fechaNacimiento: z.union([z.string(), z.date()]).optional(),
    nacionalidad: z.union([z.string(), z.object({ name: z.string(), code: z.string().optional() })]).optional(),
    correoElectronico: z.string().trim().max(320).optional(),
    estadoCivil: z.union([z.string(), z.object({ name: z.string(), code: z.string().optional() })]).optional(),
    domicilioParticular: z.string().trim().optional(),
    demandadoSols: z.array(demandadoSolidarioSchema).optional(),
    nombreRazonSocial: z.string().trim().optional(),
    rutRazonSocial: z.string().trim().optional(),
    domicilioRazonSocial: z.string().trim().optional(),
    representanteLegal: z.string().trim().optional(),
    runRepresentanteLegal: z.string().trim().optional(),
    fechaInicioRelacionLaboral: z.union([z.string(), z.date()]).optional(),
    naturalezaContrato: z.string().trim().optional(),
    funciones: z.string().trim().optional(),
    lugar: z.string().trim().optional(),
    jornada: z.string().trim().optional(),
    otraJornada: z.string().trim().optional(),
    registroAsistencia: z.boolean().optional(),
    remuneracion: z.union([z.number(), z.string()]).optional(),
    formaPago: z.string().trim().optional(),
    liquidacionSueldo: z.boolean().optional(),
    cotizacionSalud: z.string().trim().optional(),
    cotizacionAfp: z.string().trim().optional(),
    cotizacionAfc: z.string().trim().optional(),
    vacaciones: z.union([z.number(), z.string()]).optional(),
    fuero: z.string().trim().optional(),
    fechaTerminoRelaLaboral: z.union([z.string(), z.date()]).optional(),
    motivoTermino: z.string().trim().optional(),
    tipoDespido: z.string().trim().optional(),
    despidoDisciplinario: z.string().trim().optional(),
    otroDespidoDisciplinario: z.string().trim().optional(),
    anosServicios: z.boolean().optional(),
    mesAviso: z.boolean().optional(),
    finiquito: z.boolean().optional(),
    prestacionesAdeudadas: z.array(z.string().trim()).optional(),
    materias: z.array(z.string().trim()).optional(),
  })
  .passthrough();

const requestSchema = z.object({
  demandaId: z.preprocess((value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || !/^\d+$/.test(trimmed)) return Number.NaN;
      return Number.parseInt(trimmed, 10);
    }
    return value;
  }, z.number().int().positive()),
  nombreArchivo: z
    .string()
    .trim()
    .min(1, 'nombreArchivo requerido')
    .max(255)
    .regex(SAFE_FILENAME_REGEX, 'nombreArchivo contiene caracteres no permitidos'),
  demandadoSolidarios: z.array(demandadoSolidarioSchema).optional(),
  demanda: demandaSchema.optional(),
});

export async function POST(request) {
  try {
    const session = await requireSession();
    const raw = await request.json();
    const parsed = requestSchema.safeParse(raw);

    if (!parsed.success) {
      const detail = parsed.error.issues.map((issue) => issue.message).join(', ');
      console.debug(parsed.error.issues);
      return NextResponse.json(
        {
          success: false,
          error: 'Body inválido',
          detail,
        },
        { status: 400 }
      );
    }

    const {
      demandaId,
      nombreArchivo,
      demandadoSolidarios: bodyDemandados,
      demanda,
    } = parsed.data;

    // Sustituye el bloque “1) Buscar en DB” por esto:
const demandaDB = await prisma.demanda.findFirst({
  where: {
    id: demandaId,
    usuarioId: session.userId, // ajusta si tu campo se llama distinto
  },
  include: { 
    demandadoSolidario: true,  // ⚠️ cámbialo al nombre exacto de tu relación
  },
});

    if (!demandaDB) {
      return NextResponse.json(
        { success: false, error: 'Demanda no encontrada' },
        { status: 404 }
      );
    }

    // 2) Normaliza la fuente desde DB (si mañana cambias el nombre de la relación, solo tocas aquí)
    const demandadoSolidariosDB = Array.isArray(demandaDB.demandadoSolidario)
      ? demandaDB.demandadoSolidario
      : [];

    const bodySolidarios = Array.isArray(bodyDemandados) ? bodyDemandados : [];
    const bodyHasSolidarios = bodySolidarios.length > 0;
    const sourceSolidarios = bodyHasSolidarios ? bodySolidarios : demandadoSolidariosDB;

    const baseDemanda = {
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
      demandadoSols: sourceSolidarios,
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
      remuneracion: numberOrNull(demandaDB?.remuneracion),
      formaPago: demandaDB?.formaPago ?? '',
      liquidacionSueldo: !!demandaDB?.liquidacionSueldo,
      cotizacionSalud: demandaDB?.cotizacionSalud ?? '',
      cotizacionAfp: demandaDB?.cotizacionAfp ?? '',
      cotizacionAfc: demandaDB?.cotizacionAfc ?? '',
      vacaciones: numberOrNull(demandaDB?.vacaciones),
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
    };

    const demandaOverride = demanda ? { ...demanda } : undefined;
    const overrideSolidarios = demandaOverride?.demandadoSols;
    const mergedDemandadoSols = Array.isArray(overrideSolidarios)
      ? overrideSolidarios
      : sourceSolidarios;

    const cleanedOverride = demandaOverride
      ? Object.fromEntries(
          Object.entries(demandaOverride).filter(([key, value]) => key !== 'demandadoSols' && value !== undefined)
        )
      : undefined;

    const demandaMerged = cleanedOverride
      ? { ...baseDemanda, ...cleanedOverride, demandadoSols: mergedDemandadoSols }
      : { ...baseDemanda, demandadoSols: mergedDemandadoSols };

    const demandaSerializada = safeSerializeDemanda(demandaMerged);
    const missingBaseFields = ['nombres', 'apPaterno', 'apMaterno', 'run', 'nombreRazonSocial', 'rutRazonSocial']
      .filter((field) => !demandaSerializada[field]);

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

    const demandadosSerializados = safeSerializeDemandados(mergedDemandadoSols);
    debug('demandadosSerializados', {
      count: demandadosSerializados.length,
      overriddenByBody: bodyHasSolidarios,
    });

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

    if (buffer.byteLength > MAX_DOCUMENT_SIZE) {
      return NextResponse.json(
        { success: false, error: 'El documento excede el tamaño máximo permitido' },
        { status: 413 }
      );
    }

    // 6) Guardar documento (único por demanda/usuario)
    const documento = await prisma.$transaction(async (tx) => {
      const existente = await tx.demandaDocumento.findFirst({
        where: { demandaId: demandaDB.id, usuarioId: session.userId },
        select: { id: true },
      });

      if (existente) {
        return tx.demandaDocumento.update({
          where: { id: existente.id },
          data: {
            nombre: nombreArchivo,
            contenido: buffer,
            tamano: buffer.byteLength,
          },
        });
      }

      return tx.demandaDocumento.create({
        data: {
          nombre: nombreArchivo,
          contenido: buffer,
          demandaId: demandaDB.id,
          usuarioId: session.userId,
          tamano: buffer.byteLength,
        },
      });
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

