import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  compare: vi.fn(),
  createSession: vi.fn(),
  buildCookies: vi.fn(),
  clearCookies: vi.fn(),
  getRefresh: vi.fn(),
  getCsrf: vi.fn(),
  rotate: vi.fn(),
  requireSession: vi.fn(),
  resolveSessionId: vi.fn(),
  revokeSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    usuario: { findUnique: mocks.findUser },
  },
}));

vi.mock('bcryptjs', () => ({
  default: { compare: mocks.compare },
}));

vi.mock('@/lib/auth.server', () => ({
  createUserSession: mocks.createSession,
  buildSessionCookies: mocks.buildCookies,
  clearAuthCookies: mocks.clearCookies,
  getRefreshTokenFromCookies: mocks.getRefresh,
  getCsrfTokenFromCookies: mocks.getCsrf,
  rotateSessionWithRefreshToken: mocks.rotate,
  requireSession: mocks.requireSession,
  resolveSessionIdFromRefreshToken: mocks.resolveSessionId,
  revokeSession: mocks.revokeSession,
}));

import { POST as login } from '../app/api/login/route';
import { POST as refresh } from '../app/api/auth/refresh/route';
import { POST as logout } from '../app/api/logout/route';
import { GET as status } from '../app/api/auth/status/route';

const issued = {
  accessToken: 'access-prueba',
  refreshToken: 'refresh-prueba',
  csrfToken: 'csrf-prueba',
  session: {
    userId: 'usuario-1',
    sessionId: 'sesion-1',
    roles: ['admin'],
    version: 0,
    remember: true,
    expiresAt: new Date('2030-01-01'),
  },
};

const cookie = (
  name: string,
  value: string,
  httpOnly = true
) => ({
  name,
  value,
  httpOnly,
  secure: false,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 3600,
});

function request(
  path: string,
  body?: unknown,
  csrf?: string
) {
  return new Request(`http://localhost:3003${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(csrf ? { 'x-csrf-token': csrf } : {}),
    },
    ...(body === undefined
      ? {}
      : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();

  mocks.findUser.mockResolvedValue(null);
  mocks.compare.mockResolvedValue(false);
  mocks.createSession.mockResolvedValue(issued);
  mocks.rotate.mockResolvedValue(issued);
  mocks.getRefresh.mockResolvedValue('refresh-prueba');
  mocks.getCsrf.mockResolvedValue('csrf-prueba');
  mocks.resolveSessionId.mockResolvedValue('sesion-1');
  mocks.revokeSession.mockResolvedValue(undefined);

  mocks.requireSession.mockResolvedValue(issued.session);

  mocks.buildCookies.mockReturnValue([
    cookie('auth_token', 'access-prueba'),
    cookie('refresh_token', 'refresh-prueba'),
    cookie('csrf_token', 'csrf-prueba', false),
  ]);

  mocks.clearCookies.mockReturnValue([
    cookie('auth_token', ''),
    cookie('refresh_token', ''),
    cookie('csrf_token', '', false),
  ]);
});

describe('POST /api/login', () => {
  it('rechaza credenciales malformadas', async () => {
    const response = await login(
      request('/api/login', { email: 'invalido' })
    );

    expect(response.status).toBe(400);
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it('rechaza usuario inexistente', async () => {
    const response = await login(
      request('/api/login', {
        email: 'usuario@example.test',
        password: 'clave-prueba',
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it('rechaza contraseña incorrecta', async () => {
    mocks.findUser.mockResolvedValue({
      id: 'usuario-1',
      passwordHash: 'hash-prueba',
      roles: ['admin'],
    });

    const response = await login(
      request('/api/login', {
        email: 'usuario@example.test',
        password: 'clave-incorrecta',
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it('inicia sesión válida con Recordarme', async () => {
    mocks.findUser.mockResolvedValue({
      id: 'usuario-1',
      email: 'usuario@example.test',
      name: 'Usuario Prueba',
      passwordHash: 'hash-prueba',
      roles: ['admin'],
    });
    mocks.compare.mockResolvedValue(true);

    const response = await login(
      request('/api/login', {
        email: 'usuario@example.test',
        password: 'clave-correcta',
        remember: true,
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.createSession).toHaveBeenCalledWith(
      'usuario-1',
      ['admin'],
      { remember: true }
    );
    expect(response.cookies.get('auth_token')?.value)
      .toBe('access-prueba');
    expect(response.headers.get('cache-control'))
      .toBe('no-store');
  });
});

describe('POST /api/auth/refresh', () => {
  it('rechaza ausencia de refresh token', async () => {
    mocks.getRefresh.mockResolvedValue(null);

    const response = await refresh(
      request('/api/auth/refresh', {}, 'csrf-prueba')
    );

    expect(response.status).toBe(401);
    expect(mocks.rotate).not.toHaveBeenCalled();
    expect(mocks.clearCookies).toHaveBeenCalled();
  });

  it('rechaza CSRF inválido', async () => {
    const response = await refresh(
      request('/api/auth/refresh', {}, 'csrf-incorrecto')
    );

    expect(response.status).toBe(403);
    expect(mocks.rotate).not.toHaveBeenCalled();
  });

  it('renueva tokens con CSRF válido', async () => {
    const response = await refresh(
      request('/api/auth/refresh', {}, 'csrf-prueba')
    );

    expect(response.status).toBe(200);
    expect(mocks.rotate).toHaveBeenCalledWith(
      'refresh-prueba'
    );
    expect(response.cookies.get('refresh_token')?.value)
      .toBe('refresh-prueba');
    expect(response.headers.get('cache-control'))
      .toBe('no-store');
  });
});

describe('POST /api/logout', () => {
  it('rechaza CSRF incorrecto sin revocar', async () => {
    const response = await logout(
      request('/api/logout', {}, 'csrf-incorrecto')
    );

    expect(response.status).toBe(403);
    expect(mocks.revokeSession).not.toHaveBeenCalled();
  });

  it('rechaza error de lectura CSRF sin revocar', async () => {
    mocks.getCsrf.mockRejectedValueOnce(
      new Error('COOKIE_READ_ERROR')
    );

    const response = await logout(
      request('/api/logout', {}, 'csrf-prueba')
    );

    expect(response.status).toBe(403);
    expect(mocks.requireSession).not.toHaveBeenCalled();
    expect(mocks.revokeSession).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control'))
      .toBe('no-store');
  });

  it('revoca sesión autenticada', async () => {
    const response = await logout(
      request('/api/logout', {}, 'csrf-prueba')
    );

    expect(response.status).toBe(200);
    expect(mocks.revokeSession).toHaveBeenCalledWith(
      'sesion-1'
    );
    expect(response.cookies.get('auth_token')?.value)
      .toBe('');
  });

  it('usa refresh como alternativa', async () => {
    mocks.requireSession.mockRejectedValueOnce(
      new Error('UNAUTHENTICATED')
    );

    const response = await logout(
      request('/api/logout', {}, 'csrf-prueba')
    );

    expect(response.status).toBe(200);
    expect(mocks.resolveSessionId).toHaveBeenCalledWith(
      'refresh-prueba'
    );
    expect(mocks.revokeSession).toHaveBeenCalledWith(
      'sesion-1'
    );
  });
});

describe('GET /api/auth/status', () => {
  it('confirma sesión válida', async () => {
    const response = await status();

    expect(response.status).toBe(200);
    expect((await response.json()).ok).toBe(true);
  });

  it('rechaza sesión ausente', async () => {
    mocks.requireSession.mockRejectedValueOnce(
      new Error('UNAUTHENTICATED')
    );

    const response = await status();

    expect(response.status).toBe(401);
    expect((await response.json()).ok).toBe(false);
  });
});
