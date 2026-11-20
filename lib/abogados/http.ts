import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
export { exigirCsrf } from '@/lib/security/csrf';

const MAX_BODY_LENGTH = 8192;

export async function leerJsonSeguro(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('CONTENT_TYPE');
  }
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_LENGTH) {
    throw new Error('BODY_SIZE');
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_LENGTH) throw new Error('BODY_SIZE');
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('BODY_JSON');
  }
}

export function errorDeEntrada(error: unknown): NextResponse | null {
  if (error instanceof Error && ['CONTENT_TYPE', 'BODY_SIZE', 'BODY_JSON'].includes(error.message)) {
    return NextResponse.json({ error: 'JSON inválido o cuerpo demasiado grande (máximo 8 KB)' }, { status: 400 });
  }
  return null;
}

export function errorDePrisma(error: unknown): NextResponse | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un abogado con ese RUN' }, { status: 409 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Abogado no encontrado' }, { status: 404 });
    }
  }
  return null;
}
