// /utils/fetchWithAuth.ts
import { withCsrfHeader } from '@/utils/csrf';

const REFRESH_ENDPOINT = '/api/auth/refresh';
const SAFE_TO_SKIP_REFRESH = new Set<string>(['/api/login', '/api/auth/refresh', '/api/logout']);

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

/** ========= Mutex de refresh (una sola llamada en vuelo) ========= */
let refreshPromise: Promise<boolean> | null = null;

/**
 * Dispara el refresh solo si no hay otro en vuelo.
 * Devuelve true si el refresh fue exitoso; false en caso contrario.
 */
async function refreshOnce(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(
        REFRESH_ENDPOINT,
        withCsrfHeader({
          method: 'POST',
          credentials: 'include',
          headers: { 'Cache-Control': 'no-store' }
        })
      );
      return res.ok;
    } catch (e) {
      console.error('[fetchWithAuth] refresh failed', e);
      return false;
    } finally {
      // libera el lock en el próximo tick para que los "await" pendientes resuelvan primero
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    }
  })();

  return refreshPromise;
}

/**
 * Hace fetch incluyendo cookies. Si recibe 401, intenta:
 *  - POST /api/auth/refresh con CSRF (doble-submit) usando mutex
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

  // Si ya marcamos que es un reintento, no volvemos a entrar en el bucle de refresh
  const originalHeaders = new Headers((init && init.headers) || {});
  const isRetry = originalHeaders.get('x-auth-retry') === '1';

  const request = cloneRequest(input, init);
  let response = await attemptFetch(request);

  if (response.status !== 401 || !shouldAttemptRefresh(request) || isRetry) {
    return response;
  }

  // Mutex: varias 401 simultáneas esperarán el mismo refreshOnce()
  const ok = await refreshOnce();
  if (!ok) {
    // refresh falló; devolvemos la respuesta 401 original y que el caller decida (logout, redirect, etc.)
    return response;
  }

  // Reintento una única vez con marca para evitar loops
  const retryHeaders = new Headers(originalHeaders);
  retryHeaders.set('x-auth-retry', '1');

  const retryRequest = cloneRequest(input, {
    ...(init || {}),
    headers: retryHeaders,
    credentials: 'include'
  });

  return attemptFetch(retryRequest);
};
