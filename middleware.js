import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Excluir rutas públicas (como la página de inicio de sesión o APIs)
    if (pathname.startsWith('/auth') || pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // Verificar si hay un token de autenticación en las cookies
    const token = request.cookies.get('auth_token');
    if (!token) {
        console.log('Middle no hay token');
        // Si no hay token, redirigir al login
        return NextResponse.redirect(new URL('/auth/login', request.url));
        console.log('Middle no hay token 2');
    }

    // Si hay un token, permitir el acceso a las rutas protegidas
    return NextResponse.next();
}

// Configuración para determinar a qué rutas se aplica el middleware
export const config = {
    matcher: [
        '/',                // Página principal (dashboard)
        '/dashboard/:path*' // Subrutas del dashboard
    ],
};
