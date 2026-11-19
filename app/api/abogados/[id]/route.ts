import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePerm } from '@/lib/api-authz';
import { can } from '@/lib/authz';
import { abogadoUpdateSchema } from '@/lib/abogados/validation';
import { errorDeEntrada, errorDePrisma, exigirCsrf, leerJsonSeguro } from '@/lib/abogados/http';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { session, error } = await requirePerm('listAbogados');
  if (error) return error;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }
  try {
    const abogado = await prisma.abogado.findUnique({ where: { id } });
    if (!abogado || (!abogado.activo && !can(session.roles, 'manageAbogados'))) {
      return NextResponse.json({ error: 'Abogado no encontrado' }, { status: 404 });
    }
    return NextResponse.json(abogado);
  } catch (error) {
    console.error('[ABOGADOS_GET_ERROR]', error);
    return NextResponse.json({ error: 'No se pudo consultar el abogado' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { error } = await requirePerm('manageAbogados');
  if (error) return error;
  const csrfError = await exigirCsrf(request);
  if (csrfError) return csrfError;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }
  try {
    const body = await leerJsonSeguro(request);
    const parsed = abogadoUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', issues: parsed.error.issues }, { status: 400 });
    }
    const abogado = await prisma.abogado.update({ where: { id }, data: parsed.data });
    return NextResponse.json(abogado);
  } catch (error) {
    const known = errorDeEntrada(error) ?? errorDePrisma(error);
    if (known) return known;
    console.error('[ABOGADOS_UPDATE_ERROR]', error);
    return NextResponse.json({ error: 'No se pudo actualizar el abogado' }, { status: 500 });
  }
}
