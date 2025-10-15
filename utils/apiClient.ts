// /utils/apiClient.ts
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { withCsrfHeader } from '@/utils/csrf';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const normalizeMethod = (method?: string): string => (method ? method.toUpperCase() : 'GET');

export const apiFetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
  const method = normalizeMethod(init.method as string | undefined);

  // Incluye cookies por defecto
  let requestInit: RequestInit = { credentials: 'include', ...init, method };

  // En mutaciones, inyecta CSRF automáticamente
  if (MUTATING_METHODS.has(method)) {
    requestInit = withCsrfHeader(requestInit);
  } else {
    // Si hay body string y no se definió Content-Type, lo seteamos
    if (requestInit.body && typeof requestInit.body === 'string') {
      const headers = new Headers(requestInit.headers || {});
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
      requestInit.headers = headers;
    }
  }

  return fetchWithAuth(input, requestInit);
};

export const apiFetchJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await apiFetch(input, init);
  if (!response.ok) {
    throw new Error(await response.text().catch(() => response.statusText));
  }
  return (await response.json()) as T;
};
