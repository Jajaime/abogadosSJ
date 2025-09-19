import { NextResponse } from 'next/server';

import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const ensureAdmin = async () => {
    const session = await requireSession();
    if (!session.roles.includes('admin')) {
        throw new Error('FORBIDDEN');
    }
};

export async function GET() {
    try {
        await ensureAdmin();
        const users = await prisma.usuario.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, name: true, roles: true, createdAt: true }
        });
        return NextResponse.json(users, { status: 200 });
    } catch (error: any) {
        if (error instanceof Error) {
            if (error.message === 'UNAUTHENTICATED') {
                return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
            }
            if (error.message === 'FORBIDDEN') {
                return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
            }
        }
        return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await ensureAdmin();
        const body = await request.json().catch(() => null);
        const { email, name, roles } = (body as Record<string, unknown>) ?? {};

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 });
        }

        const normalisedRoles = Array.isArray(roles) ? roles.filter((role): role is string => typeof role === 'string') : undefined;

        const newUser = await prisma.usuario.create({
            data: {
                email,
                name: typeof name === 'string' ? name : null,
                roles: normalisedRoles && normalisedRoles.length ? normalisedRoles : undefined
            },
            select: { id: true, email: true, name: true, roles: true, createdAt: true }
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error: any) {
        if (error instanceof Error) {
            if (error.message === 'UNAUTHENTICATED') {
                return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
            }
            if (error.message === 'FORBIDDEN') {
                return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
            }
        }
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
    }
}
