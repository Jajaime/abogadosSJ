import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

type MockUser = {
  id: string;
  roles?: string[] | null;
};

type MockSession = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  version: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const BASE_DATE = new Date('2025-01-01T00:00:00Z');
const TEST_SECRET = Buffer.from(
  'integration-secret-in-tests-should-be-long-enough-1234567890',
  'utf8'
).toString('base64url');

const mockDb: {
  users: Map<string, MockUser>;
  sessions: Map<string, MockSession>;
} = {
  users: new Map(),
  sessions: new Map(),
};

vi.mock('server-only', () => ({}), { virtual: true });

const cloneWithSelect = <T extends Record<string, any>>(
  entity: T | undefined,
  select?: Record<string, boolean>
) => {
  if (!entity) return null;

  const cloneValue = (value: unknown) =>
    value instanceof Date ? new Date(value) : value;

  if (!select) {
    return Object.fromEntries(
      Object.entries(entity).map(([key, value]) => [key, cloneValue(value)])
    ) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, enabled] of Object.entries(select)) {
    if (!enabled) continue;
    result[key] = cloneValue(entity[key as keyof T]);
  }
  return result as T;
};

vi.mock('@/lib/prisma', () => {
  const prisma = {
    usuario: {
      findUnique: async ({ where, select }: any) => {
        const key = where?.id ?? where?.email ?? null;
        if (!key) return null;
        const user =
          mockDb.users.get(key) ??
          [...mockDb.users.values()].find(
            (candidate) => candidate.id === key || (candidate as any).email === key
          );
        return cloneWithSelect(user ?? undefined, select);
      },
    },
    session: {
      create: async ({ data }: any) => {
        const record: MockSession = {
          id: data.id,
          userId: data.userId,
          refreshTokenHash: data.refreshTokenHash,
          version: data.version,
          expiresAt: new Date(data.expiresAt),
          createdAt: data.createdAt ?? new Date(Date.now()),
          updatedAt: data.updatedAt ?? new Date(Date.now()),
        };
        mockDb.sessions.set(record.id, record);
        return { ...record };
      },
      findUnique: async ({ where, select }: any) => {
        const record = mockDb.sessions.get(where?.id);
        return cloneWithSelect(record, select);
      },
      update: async ({ where, data }: any) => {
        const existing = mockDb.sessions.get(where?.id);
        if (!existing) throw new Error('SESSION_NOT_FOUND');
        if (typeof data.version === 'number') existing.version = data.version;
        if (typeof data.refreshTokenHash === 'string') {
          existing.refreshTokenHash = data.refreshTokenHash;
        }
        if (data.expiresAt) {
          existing.expiresAt = new Date(data.expiresAt);
        }
        existing.updatedAt = new Date(Date.now());
        mockDb.sessions.set(existing.id, existing);
        return { ...existing };
      },
      delete: async ({ where }: any) => {
        const existed = mockDb.sessions.get(where?.id);
        mockDb.sessions.delete(where?.id);
        return existed ? { ...existed } : null;
      },
      deleteMany: async ({ where }: any) => {
        let count = 0;
        for (const [id, record] of [...mockDb.sessions.entries()]) {
          const matchId = where?.id && where.id === id;
          const matchUser = where?.userId && where.userId === record.userId;
          if (matchId || matchUser) {
            mockDb.sessions.delete(id);
            count += 1;
          }
        }
        return { count };
      },
    },
  };
  return { prisma };
});

let authModule: typeof import('@/lib/auth.server');

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(BASE_DATE);

  mockDb.users.clear();
  mockDb.sessions.clear();

  process.env.JWT_SECRETS = `test-kid:${TEST_SECRET}`;
  process.env.JWT_CURRENT_KID = 'test-kid';
  process.env.JWT_ACCESS_TOKEN_TTL = '15m';
  process.env.JWT_REFRESH_TOKEN_TTL = '30d';
  process.env.JWT_SESSION_REFRESH_TOKEN_TTL = '1d';
  process.env.JWT_ISSUER = 'test-app';
  process.env.JWT_AUDIENCE = 'test-app';

  vi.resetModules();
  authModule = await import('@/lib/auth.server');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('remember me session expiry controls', () => {
  it('allows refresh up to day 29 and expires on day 31 when remember is true', async () => {
    mockDb.users.set('user-remember', { id: 'user-remember', roles: ['member'] });

    const initial = await authModule.createUserSession('user-remember', ['member'], {
      remember: true,
    });

    const initialExpiry = initial.session.expiresAt.getTime();
    expect(initialExpiry).toBe(BASE_DATE.getTime() + 30 * DAY_MS);

    let refreshToken = initial.refreshToken;
    for (const day of [1, 5, 15, 29]) {
      vi.setSystemTime(new Date(BASE_DATE.getTime() + day * DAY_MS));
      const rotated = await authModule.rotateSessionWithRefreshToken(refreshToken);
      expect(rotated.session.expiresAt.getTime()).toBe(initialExpiry);
      refreshToken = rotated.refreshToken;
    }

    vi.setSystemTime(new Date(BASE_DATE.getTime() + 31 * DAY_MS));
    await expect(authModule.rotateSessionWithRefreshToken(refreshToken)).rejects.toThrowError(
      /SESSION_EXPIRED|claim timestamp check failed/
    );
  });

  it('enforces the short session TTL when remember is false', async () => {
    mockDb.users.set('user-short', { id: 'user-short', roles: ['member'] });

    const initial = await authModule.createUserSession('user-short', ['member'], {
      remember: false,
    });
    const shortExpiry = initial.session.expiresAt.getTime();
    expect(shortExpiry).toBe(BASE_DATE.getTime() + DAY_MS);

    let refreshToken = initial.refreshToken;

    vi.setSystemTime(new Date(BASE_DATE.getTime() + 12 * HOUR_MS));
    const rotated = await authModule.rotateSessionWithRefreshToken(refreshToken);
    expect(rotated.session.expiresAt.getTime()).toBe(shortExpiry);
    refreshToken = rotated.refreshToken;

    vi.setSystemTime(new Date(BASE_DATE.getTime() + 2 * DAY_MS));
    await expect(authModule.rotateSessionWithRefreshToken(refreshToken)).rejects.toThrowError(
      /SESSION_EXPIRED|claim timestamp check failed/
    );
  });
});
