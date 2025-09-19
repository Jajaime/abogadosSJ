import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const TOKEN_COOKIE_NAME = 'auth_token';
const DEFAULT_EXPIRATION = '12h';
const DEFAULT_ISSUER = process.env.JWT_ISSUER ?? 'sakai-app';
const DEFAULT_AUDIENCE = process.env.JWT_AUDIENCE ?? 'sakai-app';

const encoder = new TextEncoder();

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está configurado');
  }
  return encoder.encode(secret);
};

export interface SessionTokenPayload {
  userId: string;
  email: string;
  roles?: string[];
}

export interface SessionInfo {
  userId: string;
  email: string;
  roles: string[];
}

export const signSessionToken = async (
  payload: SessionTokenPayload,
  options?: { expiresIn?: string | number }
) => {
  const secret = getSecretKey();
  const expiresIn = options?.expiresIn ?? DEFAULT_EXPIRATION;
  const roles = Array.isArray(payload.roles) ? payload.roles : [];

  return new SignJWT({ email: payload.email, roles })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setSubject(payload.userId)
    .setAudience(DEFAULT_AUDIENCE)
    .setIssuer(DEFAULT_ISSUER)
    .setExpirationTime(expiresIn)
    .sign(secret);
};

export const verifySessionToken = async (token: string): Promise<SessionInfo | null> => {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      issuer: DEFAULT_ISSUER,
      audience: DEFAULT_AUDIENCE,
    });

    const userId = typeof payload.sub === 'string' ? payload.sub : null;
    const email = typeof payload.email === 'string' ? payload.email : '';
    const roles = Array.isArray(payload.roles)
      ? payload.roles.filter((role): role is string => typeof role === 'string')
      : [];

    if (!userId) return null;

    return { userId, email, roles };
  } catch (error) {
    return null;
  }
};

export const getSessionFromCookies = async (): Promise<SessionInfo | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
};

export const createAuthCookie = (token: string) => ({
  name: TOKEN_COOKIE_NAME,
  value: token,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 12, // 12 horas
});

export const clearAuthCookie = () => ({
  name: TOKEN_COOKIE_NAME,
  value: '',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 0,
});

export const requireSession = async () => {
  const session = await getSessionFromCookies();
  if (!session) {
    throw new Error('UNAUTHENTICATED');
  }
  return session;
};

export { TOKEN_COOKIE_NAME };
