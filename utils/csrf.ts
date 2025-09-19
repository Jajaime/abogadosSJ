const CSRF_COOKIE_NAME = 'csrf_token';

export const getCsrfToken = (): string => {
    if (typeof document === 'undefined') {
        return '';
    }
    const cookies = document.cookie ? document.cookie.split(';') : [];
    for (const cookie of cookies) {
        const [name, ...rest] = cookie.trim().split('=');
        if (name === CSRF_COOKIE_NAME) {
            return decodeURIComponent(rest.join('='));
        }
    }
    return '';
};

export const withCsrfHeader = (init: RequestInit = {}): RequestInit => {
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        return { ...init, credentials: init.credentials ?? 'include' };
    }
    const headers = new Headers(init.headers ?? {});
    headers.set('X-CSRF-Token', csrfToken);
    return {
        ...init,
        headers,
        credentials: init.credentials ?? 'include'
    };
};
