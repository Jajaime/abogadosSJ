import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { prisma } from '@/lib/prisma';
import {
    ACCESS_TOKEN_MAX_AGE_SECONDS,
    ACCESS_TOKEN_TTL,
    DEFAULT_AUDIENCE,
    DEFAULT_ISSUER,
    REFRESH_AUDIENCE,
    REFRESH_TOKEN_MAX_AGE_SECONDS,
    SESSION_REFRESH_TOKEN_MAX_AGE_SECONDS,
    getSigningParams,
    verifyAccessTokenJwt,
    verifyRefreshTokenJwt
} from '@/lib/jwt';

import {
    ACCESS_TOKEN_COOKIE_NAME,
    REFRESH_TOKEN_COOKIE_NAME,
    CSRF_COOKIE_NAME,
} from '@/lib/jwt-public';

const isProduction = process.env.NODE_ENV === 'production';

export interface SessionInfo {
    userId: string;
    sessionId: string;
    roles: string[];
    version: number;
    /** persistencia del refresh cookie (Recordarme) */
    remember?: boolean;
    /** fecha límite absoluta para la sesión/refresh */
    expiresAt: Date;
}

interface AccessTokenPayload {
    userId: string;
    sessionId: string;
    roles: string[];
    version: number;
}

interface RefreshTokenPayload {
    userId: string;
    sessionId: string;
    version: number;
    /** rmb: persistencia solicitada por el usuario (Recordarme) */
    rmb: boolean;
}

export interface IssuedSessionTokens {
    accessToken: string;
    refreshToken: string;
    csrfToken: string;
    session: SessionInfo;
}

type CookieDescriptor = {
    name: string;
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict';
    path: string;
    /** si no se define, el cookie será de sesión (se borra al cerrar el navegador) */
    maxAge?: number;
};

const normalizeRoles = (roles?: unknown): string[] => {
    if (!Array.isArray(roles)) return [];
    const unique = new Set<string>();
    for (const role of roles) {
        if (typeof role === 'string') {
            const trimmed = role.trim();
            if (trimmed) unique.add(trimmed);
        }
    }
    return Array.from(unique);
};

const newCsrfToken = () => randomBytes(32).toString('base64url');
const hashRefreshToken = (token: string) => createHash('sha256').update(token).digest('hex');
const computeSessionExpiry = (remember: boolean) => {
    const ttlSeconds = remember ? REFRESH_TOKEN_MAX_AGE_SECONDS : SESSION_REFRESH_TOKEN_MAX_AGE_SECONDS;
    return new Date(Date.now() + ttlSeconds * 1000);
};

const signAccessToken = async ({ userId, sessionId, roles, version }: AccessTokenPayload) => {
    const { key, kid } = getSigningParams();
    return new SignJWT({ sid: sessionId, roles, ver: version })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT', kid })
        .setIssuedAt()
        .setSubject(userId)
        .setIssuer(DEFAULT_ISSUER)
        .setAudience(DEFAULT_AUDIENCE)
        .setExpirationTime(ACCESS_TOKEN_TTL)
        .sign(key);
};

const signRefreshToken = async ({ userId, sessionId, version, rmb }: RefreshTokenPayload, expiresAt: Date) => {
    const { key, kid } = getSigningParams();
    // incluimos "rmb" en el payload del refresh
    return new SignJWT({ sid: sessionId, ver: version, rmb })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT', kid })
        .setIssuedAt()
        .setSubject(userId)
        .setIssuer(DEFAULT_ISSUER)
        .setAudience(REFRESH_AUDIENCE)
        .setExpirationTime(expiresAt)
        .sign(key);
};

const buildCookie = (
    name: string,
    value: string,
    options: { httpOnly: boolean; maxAge?: number }
): CookieDescriptor => ({
    name,
    value,
    httpOnly: options.httpOnly,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    ...(typeof options.maxAge === 'number' ? { maxAge: options.maxAge } : {})
});

export const createAccessCookie = (token: string): CookieDescriptor =>
    buildCookie(ACCESS_TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS
    });

/**
 * Cookie de refresh:
 *  - remember = true  => persistente (Max-Age)
 *  - remember = false => cookie de sesión (sin Max-Age)
 */
export const createRefreshCookie = (
    token: string,
    options: { remember: boolean; maxAgeSeconds?: number }
): CookieDescriptor =>
    buildCookie(REFRESH_TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        maxAge: options.remember ? options.maxAgeSeconds ?? REFRESH_TOKEN_MAX_AGE_SECONDS : undefined
    });

export const createCsrfCookie = (token: string, maxAgeSeconds?: number): CookieDescriptor => ({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: false,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeSeconds ?? REFRESH_TOKEN_MAX_AGE_SECONDS
});

export const clearAuthCookies = (): CookieDescriptor[] => [
    buildCookie(ACCESS_TOKEN_COOKIE_NAME, '', { httpOnly: true, maxAge: 0 }),
    buildCookie(REFRESH_TOKEN_COOKIE_NAME, '', { httpOnly: true, maxAge: 0 }),
    {
        name: CSRF_COOKIE_NAME,
        value: '',
        httpOnly: false,
        secure: isProduction,
        sameSite: 'strict',
        path: '/',
        maxAge: 0
    }
];

/** Nuevo: acepta opts para controlar persistencia del refresh cookie */
export const buildSessionCookies = (
    tokens: IssuedSessionTokens,
    opts: { remember?: boolean } = {}
): CookieDescriptor[] => {
    const remember = opts.remember ?? tokens.session.remember ?? false;
    const expiresAt = tokens.session.expiresAt;
    const secondsUntilExpiry =
        expiresAt instanceof Date ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)) : undefined;
    const refreshMaxAge = remember ? secondsUntilExpiry ?? REFRESH_TOKEN_MAX_AGE_SECONDS : undefined;
    const csrfMaxAge =
        secondsUntilExpiry ?? (remember ? REFRESH_TOKEN_MAX_AGE_SECONDS : SESSION_REFRESH_TOKEN_MAX_AGE_SECONDS);
    return [
        createAccessCookie(tokens.accessToken),
        createRefreshCookie(tokens.refreshToken, { remember, maxAgeSeconds: refreshMaxAge }),
        createCsrfCookie(tokens.csrfToken, csrfMaxAge)
    ];
};

const mapAccessPayloadToSession = async (payload: any): Promise<SessionInfo> => {
    const sessionId = typeof payload.sid === 'string' ? payload.sid : null;
    const userId = typeof payload.sub === 'string' ? payload.sub : null;
    const version = typeof payload.ver === 'number' ? payload.ver : Number(payload.ver);
    if (!sessionId || !userId || Number.isNaN(version)) {
        throw new Error('ACCESS_TOKEN_INVALID_PAYLOAD');
    }

    const record = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { id: true, userId: true, version: true, expiresAt: true }
    });

    if (!record || record.userId !== userId) {
        throw new Error('SESSION_NOT_FOUND');
    }
    if (record.expiresAt.getTime() <= Date.now()) {
        throw new Error('SESSION_EXPIRED');
    }
    if (record.version !== version) {
        throw new Error('ACCESS_TOKEN_VERSION_MISMATCH');
    }

    const roles = normalizeRoles(payload.roles);
    return { userId, sessionId, roles, version, expiresAt: record.expiresAt } satisfies SessionInfo;
};

const mapRefreshPayload = (payload: any): RefreshTokenPayload => {
    const sessionId = typeof payload.sid === 'string' ? payload.sid : null;
    const userId = typeof payload.sub === 'string' ? payload.sub : null;
    const version = typeof payload.ver === 'number' ? payload.ver : Number(payload.ver);
    const rmb = Boolean(payload.rmb);
    if (!sessionId || !userId || Number.isNaN(version)) {
        throw new Error('REFRESH_TOKEN_INVALID_PAYLOAD');
    }
    return { userId, sessionId, version, rmb } satisfies RefreshTokenPayload;
};

/** Nuevo: acepta remember para setear cookie persistente o de sesión */
export const createUserSession = async (
    userId: string,
    roles: string[] = [],
    opts: { remember?: boolean } = {}
): Promise<IssuedSessionTokens> => {
    const remember = !!opts.remember;
    const normalizedRoles = normalizeRoles(roles);
    const sessionId = randomUUID();
    const version = 0;
    const expiresAt = computeSessionExpiry(remember);

    const refreshToken = await signRefreshToken({
        userId,
        sessionId,
        version,
        rmb: remember
    }, expiresAt);

    await prisma.session.create({
        data: {
            id: sessionId,
            userId,
            version,
            refreshTokenHash: hashRefreshToken(refreshToken),
            // vida máxima de la sesión en el servidor (independiente del cookie)
            expiresAt
        }
    });

    const accessToken = await signAccessToken({
        userId,
        sessionId,
        roles: normalizedRoles,
        version
    });
    const csrfToken = newCsrfToken();

    return {
        accessToken,
        refreshToken,
        csrfToken,
        session: {
            userId,
            sessionId,
            roles: normalizedRoles,
            version,
            remember,
            expiresAt
        }
    } satisfies IssuedSessionTokens;
};

export const rotateSessionWithRefreshToken = async (refreshToken: string): Promise<IssuedSessionTokens> => {
    const { payload } = await verifyRefreshTokenJwt(refreshToken);
    const input = mapRefreshPayload(payload);

    const record = await prisma.session.findUnique({ where: { id: input.sessionId } });
    if (!record || record.userId !== input.userId) {
        throw new Error('SESSION_NOT_FOUND');
    }
    if (record.expiresAt.getTime() <= Date.now()) {
        await prisma.session.delete({ where: { id: record.id } }).catch(() => undefined);
        throw new Error('SESSION_EXPIRED');
    }

    if (record.refreshTokenHash !== hashRefreshToken(refreshToken)) {
        throw new Error('REFRESH_TOKEN_REUSED');
    }
    if (record.version !== input.version) {
        throw new Error('REFRESH_TOKEN_VERSION_MISMATCH');
    }

    const user = await prisma.usuario.findUnique({
        where: { id: input.userId },
        select: { id: true, roles: true }
    });
    if (!user) {
        await prisma.session.delete({ where: { id: record.id } }).catch(() => undefined);
        throw new Error('USER_NOT_FOUND');
    }

    const roles = normalizeRoles(user.roles);
    const nextVersion = record.version + 1;

    const newRefreshToken = await signRefreshToken(
        {
            userId: user.id,
            sessionId: record.id,
            version: nextVersion,
            // mantenemos la preferencia de persistencia original
            rmb: input.rmb
        },
        record.expiresAt
    );

    await prisma.session.update({
        where: { id: record.id },
        data: {
            version: nextVersion,
            refreshTokenHash: hashRefreshToken(newRefreshToken)
        }
    });

    const accessToken = await signAccessToken({
        userId: user.id,
        sessionId: record.id,
        roles,
        version: nextVersion
    });
    const csrfToken = newCsrfToken();

    return {
        accessToken,
        refreshToken: newRefreshToken,
        csrfToken,
        session: {
            userId: user.id,
            sessionId: record.id,
            roles,
            version: nextVersion,
            remember: input.rmb,
            expiresAt: record.expiresAt
        }
    } satisfies IssuedSessionTokens;
};

export const revokeSession = async (sessionId: string) => {
    await prisma.session.deleteMany({ where: { id: sessionId } });
};

export const revokeUserSessions = async (userId: string) => {
    await prisma.session.deleteMany({ where: { userId } });
};

export const resolveSessionIdFromRefreshToken = async (refreshToken: string): Promise<string | null> => {
    try {
        const { payload } = await verifyRefreshTokenJwt(refreshToken);
        const input = mapRefreshPayload(payload);
        const record = await prisma.session.findUnique({
            where: { id: input.sessionId },
            select: { id: true, userId: true, refreshTokenHash: true, expiresAt: true }
        });

        if (!record || record.userId !== input.userId) return null;
        if (record.expiresAt.getTime() <= Date.now()) return null;
        if (record.refreshTokenHash !== hashRefreshToken(refreshToken)) return null;

        return record.id;
    } catch {
        return null;
    }
};

export const verifySessionToken = async (token: string): Promise<SessionInfo> => {
    const { payload } = await verifyAccessTokenJwt(token);
    return mapAccessPayloadToSession(payload);
};

export const getSessionFromCookies = async (): Promise<SessionInfo | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
    if (!token) return null;
    try {
        return await verifySessionToken(token);
    } catch (error) {
        console.warn('[AUTH] token inválido en cookies', error);
        return null;
    }
};

export const requireSession = async (): Promise<SessionInfo> => {
    const session = await getSessionFromCookies();
    if (!session) {
        throw new Error('UNAUTHENTICATED');
    }
    return session;
};

export const getRefreshTokenFromCookies = async (): Promise<string | null> => {
    const cookieStore = await cookies();
    return cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value ?? null;
};

export const getCsrfTokenFromCookies = async (): Promise<string | null> => {
    const cookieStore = await cookies();
    return cookieStore.get(CSRF_COOKIE_NAME)?.value ?? null;
};

export { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/jwt-public';
