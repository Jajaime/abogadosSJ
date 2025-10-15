// /utils/fetchWithAuth.ts
import { withCsrfHeader } from '@/utils/csrf';

const REFRESH_ENDPOINT = '/api/auth/refresh';
const SAFE_TO_SKIP_REFRESH = new Set<string>([
  '/api/login',
  '/api/auth/refresh',
  '/api/logout',
]);

const DEFAULT_ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost';

const shouldAttemptRefresh = (request: Request) => {
  try {
    const url = new URL(request.url, DEFAULT_ORIGIN);
    return !SAFE_TO_SKIP_REFRESH.has(url.pathname);
  } catch (error) {
    console.warn('[fetchWithAuth] unable to parse url for refresh', error);
    return false;
  }
};

const cloneRequest = (input: RequestInfo | URL, init?: RequestInit): Request => {
  const mergedInit: RequestInit = { ...init };
  if (!mergedInit.credentials) mergedInit.credentials = 'include';
  return input instanceof Request ? new Request(input, mergedInit) : new Request(input, mergedInit);
};

const attemptFetch = (request: Request) => fetch(request.clone());

/**
 * Hace fetch incluyendo cookies. Si recibe 401, intenta:
 *  - POST /api/auth/refresh con CSRF (doble-submit)
 *  - Reintenta UNA sola vez la request original.
 */
export const fetchWithAuth = async <T extends RequestInfo | URL>(
  input: T,
  init?: RequestInit
): Promise<Response> => {
  // SSR: no refrescamos; solo hacemos fetch con credenciales.
  if (typeof window === 'undefined') {
    const mergedInit: RequestInit = { credentials: 'include', ...(init || {}) };
    return fetch(input as RequestInfo, mergedInit);
  }

  const request = cloneRequest(input, init);
  let response = await attemptFetch(request);

  if (response.status !== 401 || !shouldAttemptRefresh(request)) {
    return response;
  }

  try {
    // Refresh con header CSRF y credenciales incluidas
    const refreshResponse = await fetch(
      REFRESH_ENDPOINT,
      withCsrfHeader({ method: 'POST', headers: { 'Cache-Control': 'no-store' } })
    );

    if (!refreshResponse.ok) {
      return response; // sigue 401 → que el caller decida (redirigir a login, etc.)
    }

    // Reintento una única vez
    response = await attemptFetch(request);
    return response;
  } catch (error) {
    console.error('[fetchWithAuth] refresh failed', error);
    return response;
  }
};
