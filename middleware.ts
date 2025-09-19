import { NextResponse, type NextRequest } from 'next/server';

import { TOKEN_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/auth/login', '/api/login'];

const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((publicPath) => pathname.startsWith(publicPath));

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const session = await verifySessionToken(token);

  if (!session) {
    const response = pathname.startsWith('/api')
      ? NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      : NextResponse.redirect(new URL('/auth/login', request.url));

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', session.userId);
  requestHeaders.set('x-user-email', session.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/login|api/login).*)',
  ],
};
