import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { withCsrfHeader } from '@/utils/csrf';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const normalizeMethod = (method?: string): string => {
    if (!method) return 'GET';
    return method.toUpperCase();
};

export const apiFetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const method = normalizeMethod(init.method as string | undefined);
    let requestInit: RequestInit = { ...init, method };

    if (MUTATING_METHODS.has(method)) {
        requestInit = withCsrfHeader(requestInit);
    } else if (!requestInit.credentials) {
        requestInit.credentials = 'include';
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
