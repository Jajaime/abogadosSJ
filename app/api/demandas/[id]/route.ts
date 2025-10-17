// app/api/demandas/[id]/route.ts
import { NextResponse } from 'next/server';

import { requireSession } from '@/lib/auth';
import { findDemandaForUser } from '@/lib/demanda';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/* Helpers */
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

const toResponsePayload = (demanda: any) => ({
  ...demanda,
  demandadoSols: Array.isArray(demanda.demandadoSolidario)
    ? demanda.demandadoSolidario.map((d: any) => ({
        id: d.id,
        nombreRazonSocial: d.nombreRazonSocial,
        rut: d.rut,
        domicilio: d.domicilio,
        representanteLegal: d.representanteLegal,
        runRepresentanteLegal: d.runRepresentanteLegal,
      }))
    : [],
});

/** GET /api/demandas/:id */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const demanda = await findDemandaForUser(id, session.userId, { include: { demandadoSolidario: true } });
    if (!demanda) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    return NextResponse.json(toResponsePayload(demanda), { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    console.error('Error al obtener demanda:', error);
    return NextResponse.json({ error: 'Error al obtener demanda' }, { status: 500 });
  }
}

/** PUT /api/demandas/:id */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const existing = await findDemandaForUser(id, session.userId);
    if (!existing) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const data = await req.json();
    const updateData: any = {};

    const setIfString = (key: string, val: any) => {
      if (val !== undefined) updateData[key] = strFrom(val);
    };
    const setIfDate = (key: string, val: any) => {
      if (val !== undefined) {
        const d = dateFrom(val);
        if (!d) throw new Error(`Fecha inválida en '${key}'`);
        updateData[key] = d;
      }
    };
    const setIfNumber = (key: string, val: any) => {
      if (val !== undefined) updateData[key] = numOrNull(val) ?? undefined;
    };
    const setIfBool = (key: string, val: any) => {
      if (val !== undefined) updateData[key] = boolNormalize(val);
    };
    const setIfStringArray = (key: string, val: any) => {
      if (val !== undefined) updateData[key] = Array.isArray(val) ? val.map(strFrom) : [];
    };

    // Cliente
    setIfString('nombres', data.nombres);
    setIfString('apPaterno', data.apPaterno);
    setIfString('apMaterno', data.apMaterno);
    setIfString('run', data.run);
    setIfString('nacionalidad', data.nacionalidad);
    setIfString('estadoCivil', data.estadoCivil);
    setIfDate('fechaNacimiento', data.fechaNacimiento);
    setIfString('correoElectronico', data.correoElectronico);
    setIfString('domicilioParticular', data.domicilioParticular);

    // Demandado principal
    setIfString('nombreRazonSocial', data.nombreRazonSocial);
    setIfString('rutRazonSocial', data.rutRazonSocial);
    setIfString('domicilioRazonSocial', data.domicilioRazonSocial);

    // Relación laboral
    setIfDate('fechaInicioRelacionLaboral', data.fechaInicioRelacionLaboral);
    setIfString('naturalezaContrato', data.naturalezaContrato);
    setIfString('funciones', data.funciones);
    setIfString('lugar', data.lugar);
    setIfString('jornada', data.jornada);
    if (data.otraJornada !== undefined) updateData.otraJornada = data.otraJornada ? strFrom(data.otraJornada) : null;
    setIfBool('registroAsistencia', data.registroAsistencia);
    setIfNumber('remuneracion', data.remuneracion);
    setIfString('formaPago', data.formaPago);
    setIfBool('liquidacionSueldo', data.liquidacionSueldo);
    setIfStringArray('cotizacionSalud', data.cotizacionSalud);
    setIfStringArray('cotizacionAfp', data.cotizacionAfp);
    setIfStringArray('cotizacionAfc', data.cotizacionAfc);
    setIfNumber('vacaciones', data.vacaciones);
    setIfString('fuero', data.fuero);

    // Término relación
    setIfDate('fechaTerminoRelaLaboral', data.fechaTerminoRelaLaboral);
    setIfString('motivoTermino', data.motivoTermino);
    setIfString('tipoDespido', data.tipoDespido);
    setIfString('despidoDisciplinario', data.despidoDisciplinario);
    if (data.otroDespidoDisciplinario !== undefined)
      updateData.otroDespidoDisciplinario = data.otroDespidoDisciplinario ? strFrom(data.otroDespidoDisciplinario) : null;
    setIfBool('anosServicios', data.anosServicios);
    setIfBool('mesAviso', data.mesAviso);
    setIfBool('finiquito', data.finiquito);

    setIfStringArray('prestacionesAdeudadas', data.prestacionesAdeudadas);
    setIfStringArray('materias', data.materias);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.demanda.update({ where: { id }, data: updateData });

      if (Array.isArray(data.demandadoSols)) {
        await tx.demandadoSolidario.deleteMany({ where: { demandaId: id } });
        if (data.demandadoSols.length > 0) {
          await tx.demandadoSolidario.createMany({
            data: data.demandadoSols.map((d: any) => ({
              demandaId: id,
              nombreRazonSocial: strFrom(d?.nombreRazonSocial),
              rut: strFrom(d?.rut),
              domicilio: strFrom(d?.domicilio),
              representanteLegal: strFrom(d?.representanteLegal),
              runRepresentanteLegal: strFrom(d?.runRepresentanteLegal),
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.demanda.findUnique({ where: { id }, include: { demandadoSolidario: true } });
    });

    if (!updated) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    return NextResponse.json(toResponsePayload(updated), { status: 200 });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }
    if (typeof error?.message === 'string' && error.message.startsWith('Fecha inválida')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'RUN o correo ya existen (violación de unicidad).' }, { status: 409 });
    }
    console.error('Error al actualizar demanda:', error);
    return NextResponse.json({ error: 'Error al actualizar demanda' }, { status: 500 });
  }
}

/** DELETE /api/demandas/:id */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const existing = await findDemandaForUser(id, session.userId);
    if (!existing) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    await prisma.demanda.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }
    console.error('Error al eliminar demanda:', error);
    return NextResponse.json({ error: 'Error al eliminar demanda' }, { status: 500 });
  }
}

