// /app/api/auth/refresh/route.ts
import { NextResponse } from 'next/server';
import {
  buildSessionCookies,
  clearAuthCookies,
  getRefreshTokenFromCookies,
  getCsrfTokenFromCookies,
  rotateSessionWithRefreshToken,
} from '@/lib/auth.server';
import { CSRF_HEADER_NAME } from '@/lib/jwt-public';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // 1) Refresh cookie presente
    const refresh = await getRefreshTokenFromCookies();
    if (!refresh) {
      const res = NextResponse.json({ error: 'No autenticado' }, { status: 401 });
      for (const c of clearAuthCookies()) res.cookies.set(c);
      return res;
    }

    // 2) CSRF doble-submit: header debe coincidir con cookie pública
    const headerToken = request.headers.get(CSRF_HEADER_NAME) ?? '';
    const cookieToken = (await getCsrfTokenFromCookies()) ?? '';
    if (!headerToken || headerToken !== cookieToken) {
      const res = NextResponse.json({ error: 'CSRF inválido' }, { status: 403 });
      for (const c of clearAuthCookies()) res.cookies.set(c);
      return res;
    }

    // 3) Rotar tokens / versión de sesión en DB
    const issued = await rotateSessionWithRefreshToken(refresh);

    // 4) Setear cookies respetando remember
    const response = NextResponse.json({ ok: true, session: issued.session }, { status: 200 });
    for (const cookie of buildSessionCookies(issued, { remember: issued.session.remember })) {
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
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('[REFRESH_ERROR]', error);
    const response = NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    for (const c of clearAuthCookies()) response.cookies.set(c);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
}
