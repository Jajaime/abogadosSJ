import { NextResponse, type NextRequest } from 'next/server';

import { ACCESS_TOKEN_COOKIE_NAME, CSRF_COOKIE_NAME, CSRF_HEADER_NAME, REFRESH_TOKEN_COOKIE_NAME, verifyAccessTokenJwt } from '@/lib/jwt';

const PUBLIC_PATHS = ['/auth/login', '/api/login', '/api/auth/refresh'];
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_EXEMPT_PATHS = new Set(['/api/login', '/api/auth/refresh']);
const isProduction = process.env.NODE_ENV === 'production';

const RBAC_RULES: Array<{ prefix: string; roles: string[] }> = [{ prefix: '/api/usuario', roles: ['admin'] }];

const isPublicPath = (pathname: string) => PUBLIC_PATHS.some((publicPath) => pathname.startsWith(publicPath));

const isAuthorizedForPath = (pathname: string, roles: string[]): boolean => {
    if (!RBAC_RULES.length) return true;
    const roleSet = new Set(roles);
    for (const rule of RBAC_RULES) {
        if (pathname.startsWith(rule.prefix)) {
            return rule.roles.some((required) => roleSet.has(required));
        }
    }
    return true;
};

const clearAuthCookiesOn = (response: NextResponse) => {
    response.cookies.set({
        name: ACCESS_TOKEN_COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        path: '/',
        maxAge: 0
    });
    response.cookies.set({
        name: REFRESH_TOKEN_COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        path: '/',
        maxAge: 0
    });
    response.cookies.set({
        name: CSRF_COOKIE_NAME,
        value: '',
        httpOnly: false,
        secure: isProduction,
        sameSite: 'strict',
        path: '/',
        maxAge: 0
    });
};

const enforceCsrfProtection = (request: NextRequest): NextResponse | null => {
    if (!CSRF_METHODS.has(request.method.toUpperCase())) {
        return null;
    }
    if (CSRF_EXEMPT_PATHS.has(request.nextUrl.pathname)) {
        return null;
    }

    const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const csrfHeader = request.headers.get(CSRF_HEADER_NAME);
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return NextResponse.json({ error: 'CSRF token inválido' }, { status: 403 });
    }
    return null;
};

const handleUnauthenticated = (request: NextRequest): NextResponse => {
    const isApiRoute = request.nextUrl.pathname.startsWith('/api');
    if (isApiRoute) {
        const response = NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        clearAuthCookiesOn(response);
        return response;
    }
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    clearAuthCookiesOn(response);
    return response;
};

const handleForbidden = (request: NextRequest): NextResponse => {
    if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    const csrfResponse = enforceCsrfProtection(request);
    if (csrfResponse) {
        return csrfResponse;
    }

    const token = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
    if (!token) {
        return handleUnauthenticated(request);
    }

    try {
        const { payload } = await verifyAccessTokenJwt(token);
        const sessionId = typeof payload.sid === 'string' ? payload.sid : null;
        const userId = typeof payload.sub === 'string' ? payload.sub : null;

        if (!sessionId || !userId) {
            throw new Error('ACCESS_TOKEN_PAYLOAD_INVALID');
        }

        const roles = Array.isArray(payload.roles) ? payload.roles.filter((role): role is string => typeof role === 'string') : [];

        if (!isAuthorizedForPath(pathname, roles)) {
            return handleForbidden(request);
        }

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-session-id', sessionId);
        requestHeaders.set('x-user-id', userId);
        requestHeaders.set('x-user-roles', roles.join(','));

        return NextResponse.next({
            request: {
                headers: requestHeaders
            }
        });
    } catch (error) {
        console.warn('[MIDDLEWARE_AUTH_ERROR]', error);
        return handleUnauthenticated(request);
    }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|themes/|auth/login|api/login|api/auth/refresh).*)',
  ],
};

