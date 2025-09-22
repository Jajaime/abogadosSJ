import { NextResponse } from 'next/server';

import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const requireAdminSession = async () => {
  const session = await requireSession();
  if (!session.roles.includes('admin')) {
    throw new Error('FORBIDDEN');
  }
  return session;
};

const handleAuthError = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }
  }
  return null;
};

// GET /api/usuario/:id -> obtener uno
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await ctx.params;
    const user = await prisma.usuario.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error('Error al obtener usuario:', error);
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

// PUT /api/usuario/:id -> actualizar (parcial)
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await ctx.params;
    const body = await req.json();
    const { email, name } = body ?? {};

    if (email === undefined && name === undefined) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }
    if (email !== undefined && typeof email !== 'string') {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (name !== undefined && !(typeof name === 'string' || name === null)) {
      return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 });
    }

    const updated = await prisma.usuario.update({
      where: { id },
      data: {
        ...(email !== undefined ? { email } : {}),
        ...(name !== undefined ? { name } : {}),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
    }
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

// DELETE /api/usuario/:id -> eliminar
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await ctx.params;
    await prisma.usuario.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
