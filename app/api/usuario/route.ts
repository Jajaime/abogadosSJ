import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { requireSession } from '@/lib/auth.server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const ROLES_ALLOWLIST = new Set(['jefe_estudio', 'abogado_redactor', 'admin']);

const ensureAdmin = async () => {
  const session = await requireSession();
  if (!session.roles?.includes('admin')) {
    throw new Error('FORBIDDEN');
  }
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

const selectSafeUser = {
  id: true,
  email: true,
  name: true,
  roles: true,
  createdAt: true,
} as const;

// GET /api/usuario -> lista
export async function GET() {
  try {
    await ensureAdmin();
    const users = await prisma.usuario.findMany({
      orderBy: { createdAt: 'desc' },
      select: selectSafeUser,
    });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    const auth = handleAuthError(error);
    if (auth) return auth;
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

// POST /api/usuario -> crear (con password y roles)
export async function POST(request: Request) {
  try {
    await ensureAdmin();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
    }

    let { email, name, roles, password } = body as {
      email?: string;
      name?: string | null;
      roles?: string[];
      password?: string;
    };

    // Validaciones mínimas
    email = (email ?? '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 });
    }
    if (name !== undefined && !(typeof name === 'string' || name === null)) {
      return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 });
    }
    if (roles !== undefined) {
    if (!Array.isArray(roles) || roles.some(r => typeof r !== 'string')) {
      return NextResponse.json({ error: 'Roles inválidos' }, { status: 400 });
    }
    roles = roles.filter(r => ROLES_ALLOWLIST.has(r));
      if (roles.length === 0) roles = ['abogado_redactor']; // nuevo default
      } else {
        roles = ['abogado_redactor'];
      }

    let passwordHash: string | undefined = undefined;
    if (password !== undefined) {
      if (typeof password !== 'string' || password.trim().length < 6) {
        return NextResponse.json({ error: 'Password debe tener al menos 6 caracteres' }, { status: 400 });
      }
      passwordHash = await bcrypt.hash(password, 12);
    }

    const newUser = await prisma.usuario.create({
      data: {
        email,
        name: typeof name === 'string' ? name.trim() : null,
        roles,
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: selectSafeUser,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    const auth = handleAuthError(error);
    if (auth) return auth;
    if (error?.code === 'P2002') {
      // unique violation
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
