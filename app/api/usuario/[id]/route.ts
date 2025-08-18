import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/usuario/:id -> obtener uno
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = await prisma.usuario.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(user, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

// PUT /api/usuario/:id -> actualizar (parcial)
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
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
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

// DELETE /api/usuario/:id -> eliminar
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await prisma.usuario.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
