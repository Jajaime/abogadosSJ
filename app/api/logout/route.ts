import { NextResponse } from 'next/server';

import { clearAuthCookies, getRefreshTokenFromCookies, requireSession, resolveSessionIdFromRefreshToken, revokeSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
    let sessionId: string | null = null;

    try {
        const session = await requireSession();
        sessionId = session.sessionId;
    } catch {
        const refreshToken = await getRefreshTokenFromCookies();
        if (refreshToken) {
            sessionId = await resolveSessionIdFromRefreshToken(refreshToken);
        }
    }

    if (sessionId) {
        await revokeSession(sessionId).catch(() => undefined);
    }

    const response = NextResponse.json({ ok: true });
    for (const cookie of clearAuthCookies()) {
        response.cookies.set(cookie);
    }
    response.headers.set('Cache-Control', 'no-store');
    return response;
}
