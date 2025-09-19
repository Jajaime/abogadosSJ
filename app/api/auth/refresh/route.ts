import { NextResponse } from 'next/server';

import { buildSessionCookies, clearAuthCookies, getRefreshTokenFromCookies, rotateSessionWithRefreshToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
    try {
        const refreshToken = await getRefreshTokenFromCookies();
        if (!refreshToken) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const issued = await rotateSessionWithRefreshToken(refreshToken);
        const response = NextResponse.json({ ok: true, session: issued.session });
        for (const cookie of buildSessionCookies(issued)) {
            response.cookies.set(cookie);
        }
        response.headers.set('Cache-Control', 'no-store');
        return response;
    } catch (error) {
        console.error('[REFRESH_ERROR]', error);
        const response = NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        for (const cookie of clearAuthCookies()) {
            response.cookies.set(cookie);
        }
        return response;
    }
}
