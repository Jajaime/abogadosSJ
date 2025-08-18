import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/usuario  -> lista
export async function GET() {
  try {
    const users = await prisma.usuario.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

// POST /api/usuario -> crear
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body ?? {};

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 });
    }

    const newUser = await prisma.usuario.create({
      data: { email, name: name ?? null },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    // Prisma unique constraint
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
