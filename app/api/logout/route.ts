// /app/api/logout/route.ts
import { NextResponse } from 'next/server';
import {
  clearAuthCookies,
  getCsrfTokenFromCookies,
  getRefreshTokenFromCookies,
  requireSession,
  resolveSessionIdFromRefreshToken,
  revokeSession,
} from '@/lib/auth';
import { CSRF_HEADER_NAME } from '@/lib/jwt-public';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  // 1) CSRF doble-submit (opcional, pero recomendable)
  try {
    const headerToken = request.headers.get(CSRF_HEADER_NAME) ?? '';
    const cookieToken = (await getCsrfTokenFromCookies()) ?? '';
    if (!headerToken || headerToken !== cookieToken) {
      const res = NextResponse.json({ ok: false, error: 'CSRF inválido' }, { status: 403 });
      for (const c of clearAuthCookies()) res.cookies.set(c);
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
  } catch {
    // si algo falla leyendo cookies, fuerza salida
  }

  let sessionId: string | null = null;

  try {
    // 2) Intenta por access token
    const session = await requireSession();
    sessionId = session.sessionId;
  } catch {
    // 3) Fallback: intenta resolver desde refresh token
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
