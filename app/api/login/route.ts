import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { buildSessionCookies, createUserSession } from '@/lib/auth';

export const runtime = 'nodejs';

const loginSchema = z.object({
    email: z.string().email('Correo no válido').max(320),
    password: z.string().min(1, 'La contraseña es obligatoria').max(255)
});

export async function POST(request: Request) {
    try {
        const json = await request.json().catch(() => null);
        const parsed = loginSchema.safeParse(json);

        if (!parsed.success) {
            const detail = parsed.error.issues.map((issue) => issue.message).join(', ');
            return NextResponse.json({ error: 'Credenciales inválidas', detail }, { status: 400 });
        }

        const { email, password } = parsed.data;

        const user = await prisma.usuario.findUnique({
            where: { email },
            select: { id: true, email: true, passwordHash: true, name: true, roles: true }
        });

        if (!user?.passwordHash) {
            return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
            return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
        }

        const issued = await createUserSession(user.id, user.roles ?? []);

        const response = NextResponse.json(
            {
                ok: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    roles: issued.session.roles
                }
            },
            { status: 200 }
        );

        for (const cookie of buildSessionCookies(issued)) {
            response.cookies.set(cookie);
        }
        response.headers.set('Cache-Control', 'no-store');

        return response;
    } catch (error) {
        console.error('[LOGIN_ERROR]', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
