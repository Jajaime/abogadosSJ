// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@/lib/jwt-public'; // <- Edge/client-safe

// Rutas públicas que NO requieren auth (puedes ajustar)
const PUBLIC_PATHS = new Set<string>([
  '/auth/login',
  '/auth/error',
  '/auth/access',        // o '/auth/access-denied'
  '/robots.txt',
  '/sitemap.xml',
  '/favicon.ico',
  '/manifest.json',
  '/api/login',
  '/api/auth/refresh',
]);

// Métodos sensibles para CSRF (sólo navegación, no APIs)
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
// Rutas exentas de CSRF (form login/refresh, etc.)
const CSRF_EXEMPT_PATHS = new Set(['/api/login', '/api/auth/refresh']);

const isProduction = process.env.NODE_ENV === 'production';

// ---- helpers ----

const isPublicPath = (pathname: string) =>
  Array.from(PUBLIC_PATHS).some((p) => pathname.startsWith(p));

/**
 * Ignora assets no-HTML y TODAS las /api para que las validaciones fuertes
 * (JWT/CSRF) ocurran en los handlers SSR/API del servidor.
 */
const isNonHtmlAssetOrApi = (req: NextRequest) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api')) return true; // que lo maneje el handler
  const accept = req.headers.get('accept') || '';
  const isHtmlNav = accept.includes('text/html');
  return !isHtmlNav;
};

const clearAuthCookiesOn = (response: NextResponse) => {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: '',
    httpOnly: false,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
};

const enforceCsrfProtection = (request: NextRequest): NextResponse | null => {
  if (!CSRF_METHODS.has(request.method.toUpperCase())) return null;
  if (CSRF_EXEMPT_PATHS.has(request.nextUrl.pathname)) return null;

  const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const csrfHeader = request.headers.get(CSRF_HEADER_NAME);
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return NextResponse.json({ error: 'CSRF token invalido' }, { status: 403 });
  }
  return null;
};

const handleUnauthenticated = (request: NextRequest): NextResponse => {
  const { pathname, search } = request.nextUrl;
  // Para navegaciones, redirige a login con ?next
  const url = request.nextUrl.clone();
  url.pathname = '/auth/login';
  url.searchParams.set('next', `${pathname}${search || ''}`);
  const response = NextResponse.redirect(url);
  clearAuthCookiesOn(response);
  return response;
};

// ---- middleware ----

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Público explícito
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 2) Assets no-HTML y todas las /api (dejar que lo maneje el handler)
  if (isNonHtmlAssetOrApi(request)) {
    return NextResponse.next();
  }

  // 3) CSRF (solo navegaciones/métodos mutantes, no /api)
  const csrfResponse = enforceCsrfProtection(request);
  if (csrfResponse) return csrfResponse;

  // 4) Gate básico por cookie: requiere access_token
  const hasAccess = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value);
  if (!hasAccess) {
    return handleUnauthenticated(request);
  }

  // 5) Continuar (verificación JWT/roles queda en SSR/API)
  return NextResponse.next();
}

// ---- matcher ----
// Protege todo excepto assets estáticos, temas/demos públicos, rutas de auth y todas las /api
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|themes/|demo/|auth/|api/).*)',
  ],
};
