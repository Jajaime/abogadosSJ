// lib/jwt.ts
import 'server-only';
import { jwtVerify, type JWTPayload, type JWTVerifyResult } from 'jose';

// ===== Helpers y parsing de ENV (server) =====

interface SecretEntry {
  kid: string;
  key: Uint8Array;
}

/** Decodifica base64url solo en Node (server). */
const decodeBase64Url = (value: string): Uint8Array => {
  // En runtime nodejs, Buffer existe. En edge no; este modulo es server-only.
  // value debe venir en base64url sin padding.
  return Buffer.from(value, 'base64url');
};

const loadSecretEntries = (): SecretEntry[] => {
  const raw = process.env.JWT_SECRETS;
  if (!raw) {
    throw new Error('JWT_SECRETS no esta configurado');
  }

  // Admite multiples pares separados por coma:
  // JWT_SECRETS="2025-01:base64url,2025-02:base64url"
  const entries = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf(':');
      if (idx <= 0 || idx === pair.length - 1) {
        throw new Error(`Entrada invalida en JWT_SECRETS: "${pair}" (esperado KID:BASE64URL)`);
      }
      const kid = pair.slice(0, idx).trim();
      const secret = pair.slice(idx + 1).trim();
      if (!kid || !secret) {
        throw new Error(`Entrada invalida en JWT_SECRETS: "${pair}"`);
      }
      const key = decodeBase64Url(secret);
      if (key.byteLength < 32) {
        throw new Error(`La clave para kid "${kid}" debe tener >= 32 bytes (base64url)`);
      }
      return { kid, key } satisfies SecretEntry;
    });

  if (!entries.length) {
    throw new Error('JWT_SECRETS no contiene ningun par KID:BASE64URL valido');
  }

  return entries;
};

const secretEntries = loadSecretEntries();
const secretMap = new Map(secretEntries.map((e) => [e.kid, e.key] as const));

// ===== Config de emisor/audiencias/TTLs (server) =====

export const DEFAULT_ISSUER = process.env.JWT_ISSUER ?? 'sakai-app';
export const DEFAULT_AUDIENCE = process.env.JWT_AUDIENCE ?? 'sakai-app';
export const REFRESH_AUDIENCE = `${DEFAULT_AUDIENCE}:refresh`;

export const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TOKEN_TTL ?? '15m';
export const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_TOKEN_TTL ?? '30d';
export const CLOCK_TOLERANCE = process.env.JWT_CLOCK_TOLERANCE ?? '60s';

const durationUnits: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

export const ttlToSeconds = (ttl: string | number): number => {
  if (typeof ttl === 'number') return ttl;
  const n = Number(ttl);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  const m = /^([0-9]+)([smhd])$/i.exec(ttl.trim());
  if (!m) throw new Error(`Formato de TTL invalido: "${ttl}" (usa 15m, 30d, etc.)`);
  const [, raw, unit] = m;
  return Number(raw) * durationUnits[unit.toLowerCase()];
};

export const ACCESS_TOKEN_MAX_AGE_SECONDS = ttlToSeconds(ACCESS_TOKEN_TTL);
export const REFRESH_TOKEN_MAX_AGE_SECONDS = ttlToSeconds(REFRESH_TOKEN_TTL);
export const CLOCK_TOLERANCE_SECONDS = ttlToSeconds(CLOCK_TOLERANCE);

// ===== KID actual y claves =====

export const CURRENT_KID = process.env.JWT_CURRENT_KID ?? secretEntries[0]?.kid;
if (!CURRENT_KID) {
  throw new Error('JWT_CURRENT_KID no esta definido y no hay KID por defecto en JWT_SECRETS');
}

const signingKey = secretMap.get(CURRENT_KID);
if (!signingKey) {
  throw new Error(`JWT_CURRENT_KID="${CURRENT_KID}" no coincide con ninguna clave en JWT_SECRETS`);
}

const getVerificationKey = async (protectedHeader: { kid?: string }) => {
  const kid = protectedHeader?.kid ?? CURRENT_KID;
  const key = secretMap.get(kid);
  if (!key) {
    throw new Error(`Se recibio un KID desconocido: "${kid}"`);
  }
  return key;
};

// ===== API publica del modulo (server) =====

export const getSigningParams = () => ({ key: signingKey, kid: CURRENT_KID });

export const verifyAccessTokenJwt = (token: string): Promise<JWTVerifyResult<JWTPayload>> =>
  jwtVerify(token, getVerificationKey, {
    issuer: DEFAULT_ISSUER,
    audience: DEFAULT_AUDIENCE,
    clockTolerance: CLOCK_TOLERANCE_SECONDS,
  });

export const verifyRefreshTokenJwt = (token: string): Promise<JWTVerifyResult<JWTPayload>> =>
  jwtVerify(token, getVerificationKey, {
    issuer: DEFAULT_ISSUER,
    audience: REFRESH_AUDIENCE,
    clockTolerance: CLOCK_TOLERANCE_SECONDS,
  });

// NOTA: No exportes constantes de cookies/headers desde aqui al cliente.
// Usa lib/jwt-public.ts para eso.
