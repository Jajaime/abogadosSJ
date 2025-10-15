// /utils/csrf.ts
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/jwt-public';

/** Lee una cookie del navegador (solo lado cliente). */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const pattern = new RegExp(`(?:^|; )${name.replace(/[$()*+./?[\\\]^{|}-]/g, '\\$&')}=([^;]*)`);
  const match = document.cookie.match(pattern);
  return match ? decodeURIComponent(match[1]) : null;
};

/** Devuelve el token CSRF desde la cookie pública. */
export const getCsrfToken = (): string => getCookie(CSRF_COOKIE_NAME) ?? '';

/** Inyecta el header CSRF y asegura `credentials: 'include'` en mutaciones. */
export const withCsrfHeader = (init: RequestInit = {}): RequestInit => {
  const csrf = getCsrfToken();
  const headers = new Headers(init.headers || {});
  if (csrf) headers.set(CSRF_HEADER_NAME, csrf);

  // Si el caller mandó body como string y no seteó Content-Type, lo ponemos.
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  return {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  };
};
