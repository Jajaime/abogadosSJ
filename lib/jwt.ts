import { jwtVerify, type JWTPayload, type JWTVerifyResult } from 'jose';

interface SecretEntry {
    kid: string;
    key: Uint8Array;
}

const decodeBase64Url = (value: string): Uint8Array => {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(value, 'base64url');
    }
    if (typeof atob === 'function') {
        const binary = atob(value);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
    throw new Error('Runtime sin soporte para Buffer ni atob');
};

const loadSecretEntries = (): SecretEntry[] => {
    const raw = process.env.JWT_SECRETS;
    if (!raw) {
        throw new Error('JWT_SECRETS no est� configurado');
    }

    const entries = raw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => {
            const [kid, secret] = value.split(':');
            if (!kid || !secret) {
                throw new Error(`Entrada inv�lida en JWT_SECRETS: "${value}"`);
            }
            const key = decodeBase64Url(secret);
            if (key.byteLength < 32) {
                throw new Error(`La clave asociada al kid "${kid}" debe tener al menos 32 bytes en base64url`);
            }
            return { kid, key } satisfies SecretEntry;
        });

    if (!entries.length) {
        throw new Error('JWT_SECRETS no contiene ninguna clave v�lida');
    }

    return entries;
};

const secretEntries = loadSecretEntries();
const secretMap = new Map(secretEntries.map((entry) => [entry.kid, entry.key] as const));

export const DEFAULT_ISSUER = process.env.JWT_ISSUER ?? 'sakai-app';
export const DEFAULT_AUDIENCE = process.env.JWT_AUDIENCE ?? 'sakai-app';
export const REFRESH_AUDIENCE = `${DEFAULT_AUDIENCE}:refresh`;

export const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TOKEN_TTL ?? '15m';
export const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_TOKEN_TTL ?? '30d';
export const CLOCK_TOLERANCE = process.env.JWT_CLOCK_TOLERANCE ?? '60s';

export const ACCESS_TOKEN_COOKIE_NAME = 'auth_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';
export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const durationUnits: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400
};

export const ttlToSeconds = (ttl: string | number): number => {
    if (typeof ttl === 'number') {
        return ttl;
    }
    const simple = Number(ttl);
    if (Number.isFinite(simple) && simple > 0) {
        return Math.floor(simple);
    }
    const match = /^([0-9]+)([smhd])$/i.exec(ttl.trim());
    if (!match) {
        throw new Error(`Formato de TTL inv�lido: "${ttl}"`);
    }
    const [, rawValue, rawUnit] = match;
    const unit = rawUnit.toLowerCase();
    const factor = durationUnits[unit];
    return Number(rawValue) * factor;
};

export const ACCESS_TOKEN_MAX_AGE_SECONDS = ttlToSeconds(ACCESS_TOKEN_TTL);
export const REFRESH_TOKEN_MAX_AGE_SECONDS = ttlToSeconds(REFRESH_TOKEN_TTL);
export const CLOCK_TOLERANCE_SECONDS = ttlToSeconds(CLOCK_TOLERANCE);

export const CURRENT_KID = process.env.JWT_CURRENT_KID ?? secretEntries[0]?.kid;
if (!CURRENT_KID) {
    throw new Error('JWT_CURRENT_KID no est� definido y no se encontr� un kid por defecto');
}

const signingKey = secretMap.get(CURRENT_KID);
if (!signingKey) {
    throw new Error(`JWT_CURRENT_KID="${CURRENT_KID}" no coincide con ninguna clave en JWT_SECRETS`);
}

const getVerificationKey = async (protectedHeader: { kid?: string }) => {
    const kid = protectedHeader?.kid ?? CURRENT_KID;
    const key = secretMap.get(kid);
    if (!key) {
        throw new Error(`Se recibi� un kid desconocido: "${kid}"`);
    }
    return key;
};

export const getSigningParams = () => ({ key: signingKey, kid: CURRENT_KID });

export const verifyAccessTokenJwt = (token: string): Promise<JWTVerifyResult<JWTPayload>> =>
    jwtVerify(token, getVerificationKey, {
        issuer: DEFAULT_ISSUER,
        audience: DEFAULT_AUDIENCE,
        clockTolerance: CLOCK_TOLERANCE_SECONDS
    });

export const verifyRefreshTokenJwt = (token: string): Promise<JWTVerifyResult<JWTPayload>> =>
    jwtVerify(token, getVerificationKey, {
        issuer: DEFAULT_ISSUER,
        audience: REFRESH_AUDIENCE,
        clockTolerance: CLOCK_TOLERANCE_SECONDS
    });
