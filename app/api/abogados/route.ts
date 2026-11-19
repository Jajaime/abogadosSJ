import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePerm } from '@/lib/api-authz';
import { can } from '@/lib/authz';
import { abogadoCreateSchema } from '@/lib/abogados/validation';
import { errorDeEntrada, errorDePrisma, exigirCsrf, leerJsonSeguro } from '@/lib/abogados/http';

export const runtime = 'nodejs';

export async function GET() {
  const { session, error } = await requirePerm('listAbogados');
  if (error) return error;
  try {
    const abogados = await prisma.abogado.findMany({
      where: can(session.roles, 'manageAbogados') ? undefined : { activo: true },
      orderBy: [{ activo: 'desc' }, { nombreCompleto: 'asc' }],
    });
    return NextResponse.json(abogados);
  } catch (error) {
    console.error('[ABOGADOS_LIST_ERROR]', error);
    return NextResponse.json({ error: 'No se pudo listar abogados' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requirePerm('manageAbogados');
  if (error) return error;
  const csrfError = await exigirCsrf(request);
  if (csrfError) return csrfError;
  try {
    const body = await leerJsonSeguro(request);
    const parsed = abogadoCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', issues: parsed.error.issues }, { status: 400 });
    }
    const abogado = await prisma.abogado.create({ data: parsed.data });
    return NextResponse.json(abogado, { status: 201 });
  } catch (error) {
    const known = errorDeEntrada(error) ?? errorDePrisma(error);
    if (known) return known;
    console.error('[ABOGADOS_CREATE_ERROR]', error);
    return NextResponse.json({ error: 'No se pudo crear el abogado' }, { status: 500 });
  }
}
