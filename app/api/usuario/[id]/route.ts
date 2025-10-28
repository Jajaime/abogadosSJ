import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revokeUserSessions } from '@/lib/auth';

export const runtime = 'nodejs';

const ROLES_ALLOWLIST = new Set(['jefe_estudio', 'abogado_redactor', 'admin']);

const requireAdminSession = async () => {
  const session = await requireSession();
  if (!session.roles?.includes('admin')) {
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

const selectSafeUser = {
  id: true,
  email: true,
  name: true,
  roles: true,
  createdAt: true,
} as const;

// GET /api/usuario/:id
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await ctx.params; // 👈 importante: await
    const user = await prisma.usuario.findUnique({
      where: { id },
      select: selectSafeUser,
    });
    if (!user) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

// PUT /api/usuario/:id
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await ctx.params; // 👈 importante: await

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
    }

    let { email, name, roles, password } = body as {
      email?: string;
      name?: string | null;
      roles?: string[];
      password?: string;
    };

    if (
      email === undefined &&
      name === undefined &&
      roles === undefined &&
      (password === undefined || password === '')
    ) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    const data: Record<string, any> = {};

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.trim()) {
        return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
      }
      data.email = email.trim().toLowerCase();
    }

    if (name !== undefined) {
      if (!(typeof name === 'string' || name === null)) {
        return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 });
      }
      data.name = typeof name === 'string' ? name.trim() : null;
    }

    if (roles !== undefined) {
      if (!Array.isArray(roles) || roles.some(r => typeof r !== 'string')) {
        return NextResponse.json({ error: 'Roles inválidos' }, { status: 400 });
      }
      const cleaned = roles.filter(r => ROLES_ALLOWLIST.has(r));
      data.roles = cleaned; // sin forzar nada; si quieres default:
      // data.roles = cleaned.length ? cleaned : ['abogado_redactor'];
    }

    if (password !== undefined) {
      if (password) {
        if (typeof password !== 'string' || password.trim().length < 6) {
          return NextResponse.json({ error: 'Password debe tener al menos 6 caracteres' }, { status: 400 });
        }
        data.passwordHash = await bcrypt.hash(password, 12);
      }
      // si viene string vacío, no cambia el hash
    }

    const updated = await prisma.usuario.update({
      where: { id },
      data,
      select: selectSafeUser,
    });

    if (roles !== undefined) {
      await revokeUserSessions(updated.id);
    }

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
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

// DELETE /api/usuario/:id
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await ctx.params; // 👈 importante: await
    await prisma.usuario.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
