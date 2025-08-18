import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/* ---------- Helpers de normalización ---------- */
const strFrom = (v: any): string => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && typeof v.name === 'string') return v.name;
  return String(v);
};

const dateFrom = (v: any): Date | null => {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const numOrNull = (v: any): number | null => {
  if (v === '' || v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const boolNormalize = (v: any): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return ['si', 'sí', 'true', '1', 'on', 'yes'].includes(s);
  }
  return Boolean(v);
};

/* ---------- Helpers de validación (requeridos) ---------- */
class BadRequest extends Error { constructor(msg: string) { super(msg); this.name = 'BadRequest'; } }

const reqStr = (v: any, field: string): string => {
  const s = strFrom(v).trim();
  if (!s) throw new BadRequest(`El campo '${field}' es obligatorio.`);
  return s;
};

const reqDate = (v: any, field: string): Date => {
  const d = dateFrom(v);
  if (!d) throw new BadRequest(`El campo '${field}' debe ser una fecha válida.`);
  return d;
};

const reqBool = (v: any, field: string): boolean => {
  if (v === undefined || v === null || (typeof v === 'string' && v.trim() === ''))
    throw new BadRequest(`El campo '${field}' es obligatorio.`);
  return boolNormalize(v);
};

/* ---------- GET: lista ---------- */
export async function GET() {
  try {
    const allDemandas = await prisma.demanda.findMany({
      orderBy: { createdAt: 'desc' },
      include: { demandadoSolidario: true }
    });
    return NextResponse.json(allDemandas, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener las demandas' }, { status: 500 });
  }
}

/* ---------- POST: crear ---------- */
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Campos REQUERIDOS según tu schema
    const payload = {
      // Cliente
      nombres: reqStr(data.nombres, 'nombres'),
      apPaterno: reqStr(data.apPaterno, 'apPaterno'),
      apMaterno: reqStr(data.apMaterno, 'apMaterno'),
      run: reqStr(data.run, 'run'),
      nacionalidad: reqStr(data.nacionalidad, 'nacionalidad'),
      estadoCivil: reqStr(data.estadoCivil, 'estadoCivil'),
      fechaNacimiento: reqDate(data.fechaNacimiento, 'fechaNacimiento'),
      correoElectronico: reqStr(data.correoElectronico, 'correoElectronico'),

      // Demandado principal
      nombreRazonSocial: reqStr(data.nombreRazonSocial, 'nombreRazonSocial'),
      rutRazonSocial: reqStr(data.rutRazonSocial, 'rutRazonSocial'),
      domicilioRazonSocial: reqStr(data.domicilioRazonSocial, 'domicilioRazonSocial'),
      representanteLegal: reqStr(data.representanteLegal, 'representanteLegal'),
      runRepresentanteLegal: reqStr(data.runRepresentanteLegal, 'runRepresentanteLegal'),

      // Relación laboral
      fechaInicioRelacionLaboral: dateFrom(data.fechaInicioRelacionLaboral) ?? undefined, // opcional en schema
      naturalezaContrato: reqStr(data.naturalezaContrato, 'naturalezaContrato'),
      funciones: reqStr(data.funciones, 'funciones'),
      lugar: reqStr(data.lugar, 'lugar'),
      jornada: reqStr(data.jornada, 'jornada'),
      otraJornada: data.otraJornada ? strFrom(data.otraJornada) : undefined,
      registroAsistencia: reqBool(data.registroAsistencia, 'registroAsistencia'),
      remuneracion: numOrNull(data.remuneracion) ?? undefined, // opcional en schema
      formaPago: reqStr(data.formaPago, 'formaPago'),
      liquidacionSueldo: reqBool(data.liquidacionSueldo, 'liquidacionSueldo'),
      cotizacionSalud: reqStr(data.cotizacionSalud, 'cotizacionSalud'),
      cotizacionAfp: reqStr(data.cotizacionAfp, 'cotizacionAfp'),
      cotizacionAfc: reqStr(data.cotizacionAfc, 'cotizacionAfc'),
      vacaciones: numOrNull(data.vacaciones) ?? undefined, // opcional en schema
      fuero: reqStr(data.fuero, 'fuero'),

      // Término relación
      fechaTerminoRelaLaboral: dateFrom(data.fechaTerminoRelaLaboral) ?? undefined, // opcional en schema
      motivoTermino: reqStr(data.motivoTermino, 'motivoTermino'),
      tipoDespido: reqStr(data.tipoDespido, 'tipoDespido'),
      despidoDisciplinario: reqStr(data.despidoDisciplinario, 'despidoDisciplinario'),
      otroDespidoDisciplinario: data.otroDespidoDisciplinario ? strFrom(data.otroDespidoDisciplinario) : undefined,
      anosServicios: reqBool(data.anosServicios, 'anosServicios'),
      mesAviso: reqBool(data.mesAviso, 'mesAviso'),
      finiquito: reqBool(data.finiquito, 'finiquito'),

      // Array requerido => si no viene, lo dejamos vacío
      prestacionesAdeudadas: Array.isArray(data.prestacionesAdeudadas)
        ? data.prestacionesAdeudadas.map(strFrom)
        : [],
      materias: Array.isArray(data.materias)
        ? data.materias.map(strFrom)
        : [],

      // Relación hijos
      demandadoSolidario: {
        create: (Array.isArray(data.demandadoSols) ? data.demandadoSols : []).map((d: any) => ({
          nombreRazonSocial: reqStr(d?.nombre, 'demandadoSols.nombre'),
          rut: reqStr(d?.rut, 'demandadoSols.rut'),
          domicilio: reqStr(d?.domicilio, 'demandadoSols.domicilio')
        }))
      }
    } as const;

    const nuevaDemanda = await prisma.demanda.create({
      data: payload as any,
      include: { demandadoSolidario: true }
    });

    return NextResponse.json(nuevaDemanda, { status: 201 });
  } catch (error: any) {
    if (error instanceof BadRequest) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // errores comunes de Prisma (únicos, etc.)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'RUN o correo ya existen (violación de unicidad).' }, { status: 409 });
    }
    console.error('Error al crear demanda:', error);
    return NextResponse.json({ error: 'Error al crear demanda' }, { status: 500 });
  }
}
