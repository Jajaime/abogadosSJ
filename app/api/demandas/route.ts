import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { demandaPayloadSchema, MAX_DEMANDA_BODY_SIZE, toDemandaPersistence } from '@/types/demanda.schema';
import { prisma } from '@/lib/prisma';
import { requirePerm, isElevated } from '@/lib/api-authz';

export const runtime = 'nodejs';

class BadRequest extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequest';
  }
}

const mapDemandadoSolidario = (item: any) => ({
  id: item.id,
  nombreRazonSocial: item.nombreRazonSocial ?? '',
  rut: item.rut ?? '',
  domicilio: item.domicilio ?? '',
  representanteLegal: item.representanteLegal ?? '',
  runRepresentanteLegal: item.runRepresentanteLegal ?? '',
});

const mapDemanda = (demanda: any) => ({
  ...demanda,
  representanteLegal: demanda.representanteLegal ?? '',
  runRepresentanteLegal: demanda.runRepresentanteLegal ?? '',
  demandadoSols: Array.isArray(demanda.demandadoSolidario)
    ? demanda.demandadoSolidario.map(mapDemandadoSolidario)
    : [],
});

const parseDemandaPayload = async (req: Request) => {
  const rawBody = await req.text();
  if (rawBody.length > MAX_DEMANDA_BODY_SIZE) {
    throw new BadRequest('El payload excede el tamaño máximo permitido.');
  }

  let json: unknown;
  try {
    json = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    throw new BadRequest('El cuerpo de la solicitud debe ser JSON válido.');
  }

  const parsed = demandaPayloadSchema.safeParse(json);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join(', ');
    throw new BadRequest(detail || 'Payload inválido.');
  }

  return parsed.data;
};

/* ---------- GET: lista ---------- */
export async function GET() {
  // 👇 permiso fino para listar
  const { session, error } = await requirePerm('listDemandas');
  if (error) return error;

  try {
    const where = isElevated(session.roles)
      ? {} // admin/jefe_estudio ven todas
      : { usuarioId: session.userId }; // redactor solo las propias

    const allDemandas = await prisma.demanda.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { demandadoSolidario: true },
    });

    return NextResponse.json(allDemandas.map(mapDemanda), { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Error al obtener las demandas' }, { status: 500 });
  }
}

/* ---------- POST: crear ---------- */
export async function POST(req: Request) {
  // 👇 permiso fino para crear
  const { session, error } = await requirePerm('createDemanda');
  if (error) return error;

  try {
    const body = await parseDemandaPayload(req);
    const { data, demandadoSols } = toDemandaPersistence(body);

    const nuevaDemanda = await prisma.demanda.create({
      data: {
        ...data,
        usuarioId: session.userId, // 👈 dueño = usuario autenticado
        demandadoSolidario: demandadoSols.length
          ? { create: demandadoSols }
          : undefined,
      },
      include: { demandadoSolidario: true },
    });

    return NextResponse.json(mapDemanda(nuevaDemanda), { status: 201 });
  } catch (error: any) {
    if (error instanceof BadRequest) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'RUN o correo ya existen (violación de unicidad).' }, { status: 409 });
    }
    console.error('Error al crear demanda:', error);
    return NextResponse.json({ error: 'Error al crear demanda' }, { status: 500 });
  }
}
