const REFRESH_ENDPOINT = '/api/auth/refresh';
const SAFE_TO_SKIP_REFRESH = new Set(['/api/login', '/api/auth/refresh', '/api/logout']);

const DEFAULT_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';

const shouldAttemptRefresh = (request: Request) => {
    try {
        const url = new URL(request.url, DEFAULT_ORIGIN);
        if (SAFE_TO_SKIP_REFRESH.has(url.pathname)) {
            return false;
        }
        return true;
    } catch (error) {
        console.warn('[fetchWithAuth] unable to parse url for refresh', error);
        return false;
    }
};

const cloneRequest = (input: RequestInfo | URL, init?: RequestInit): Request => {
    const mergedInit: RequestInit = { ...init };
    if (!mergedInit.credentials) {
        mergedInit.credentials = 'include';
    }
    if (input instanceof Request) {
        return new Request(input, mergedInit);
    }
    return new Request(input, mergedInit);
};

const attemptFetch = (request: Request) => fetch(request.clone());

// Nota: este helper est� pensado para ejecutarse en el cliente.
export const fetchWithAuth = async <T extends RequestInfo | URL>(input: T, init?: RequestInit): Promise<Response> => {
    if (typeof window === 'undefined') {
        const mergedInit: RequestInit = init ? { ...init } : {};
        if (!mergedInit.credentials) mergedInit.credentials = 'include';
        return fetch(input as RequestInfo, mergedInit);
    }

    const request = cloneRequest(input, init);

    let response = await attemptFetch(request);
    if (response.status !== 401 || !shouldAttemptRefresh(request)) {
        return response;
    }

    try {
        const refreshResponse = await fetch(REFRESH_ENDPOINT, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Cache-Control': 'no-store' }
        });

        if (!refreshResponse.ok) {
            return response;
        }

        response = await attemptFetch(request);
        return response;
    } catch (error) {
        console.error('[fetchWithAuth] refresh failed', error);
        return response;
    }
};
