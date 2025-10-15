import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { buildSessionCookies, createUserSession } from '@/lib/auth';

export const runtime = 'nodejs';

const loginSchema = z.object({
  email: z.string().email('Correo no válido').max(320),
  password: z.string().min(1, 'La contraseña es obligatoria').max(255),
  remember: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(json);

    if (!parsed.success) {
      const detail = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: 'Credenciales inválidas', detail }, { status: 400 });
    }

    // normaliza email para evitar sorpresas por mayúsculas/espacios
    const email = parsed.data.email.trim().toLowerCase();
    const { password, remember } = parsed.data;

    const user = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, name: true, roles: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // crea sesión y emite tokens, marcando preferencia de persistencia
    const issued = await createUserSession(user.id, user.roles ?? [], { remember });

    const response = NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: issued.session.roles,
        },
      },
      { status: 200 }
    );

    // setea cookies: access (siempre con maxAge corto), refresh (persistente si remember=true),
    // y csrf (no httpOnly) para doble submit en POST si lo usas.
    for (const cookie of buildSessionCookies(issued, { remember })) {
      response.cookies.set({
        name: cookie.name,
        value: cookie.value,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        path: cookie.path,
        ...(typeof cookie.maxAge === 'number' ? { maxAge: cookie.maxAge } : {}),
      });
    }

    // evita que caches intermedios guarden esta respuesta
    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('[LOGIN_ERROR]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
