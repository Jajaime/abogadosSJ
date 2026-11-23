import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

const enabled = process.env.RUN_POSTGRES_INTEGRATION === '1';
const integration = enabled ? describe : describe.skip;

integration('Autenticación con PostgreSQL real', () => {
  let db: PrismaClient;
  let auth: typeof import('../lib/auth.server');

  const usuariosCreados: string[] = [];

  beforeAll(async () => {
    const raw = process.env.DATABASE_URL;

    if (!raw) {
      throw new Error('DATABASE_URL ausente');
    }

    const url = new URL(raw);

    const seguro =
      url.protocol === 'postgresql:' &&
      url.hostname === '127.0.0.1' &&
      url.port === '5434' &&
      url.username === 'abogadossj_it' &&
      url.pathname === '/abogadossj_it';

    if (!seguro) {
      throw new Error(
        'SEGURIDAD: base de integración no autorizada'
      );
    }

    db = new PrismaClient();
    await db.$connect();

    const identity = await db.$queryRaw<
      Array<{ db_name: string; db_user: string }>
    >`
      SELECT
        current_database() AS db_name,
        current_user AS db_user
    `;

    if (
      identity[0]?.db_name !== 'abogadossj_it' ||
      identity[0]?.db_user !== 'abogadossj_it'
    ) {
      throw new Error(
        'SEGURIDAD: identidad PostgreSQL incorrecta'
      );
    }

    // Credenciales JWT efímeras y exclusivas para este test.
    // Deben definirse antes de importar auth.server.
    process.env.JWT_SECRETS =
      `integration:${randomBytes(48).toString('base64url')}`;
    process.env.JWT_CURRENT_KID = 'integration';
    process.env.JWT_ISSUER = 'abogadossj-integration';
    process.env.JWT_AUDIENCE = 'abogadossj-integration';

    auth = await import('../lib/auth.server');
  }, 30000);

  afterEach(async () => {
    // Elimina solamente los usuarios creados por este test.
    // Sus sesiones se eliminan por cascada.
    for (const id of usuariosCreados.splice(0)) {
      await db.usuario.deleteMany({
        where: { id },
      });
    }
  });

  afterAll(async () => {
    await db?.$disconnect();

    if (auth) {
      const shared = await import('../lib/prisma');
      await shared.prisma.$disconnect();
    }
  });

  async function crearUsuario() {
    const usuario = await db.usuario.create({
      data: {
        email: `it-auth-${randomUUID()}@example.test`,
        name: 'Usuario Integración',
        roles: ['abogado_redactor'],
      },
    });

    usuariosCreados.push(usuario.id);
    return usuario;
  }

  it('crea sesión y persiste hash del refresh', async () => {
    const usuario = await crearUsuario();

    const issued = await auth.createUserSession(
      usuario.id,
      usuario.roles,
      { remember: false }
    );

    const record = await db.session.findUnique({
      where: { id: issued.session.sessionId },
    });

    expect(record).not.toBeNull();
    expect(record?.userId).toBe(usuario.id);
    expect(record?.version).toBe(0);

    const expectedHash = createHash('sha256')
      .update(issued.refreshToken)
      .digest('hex');

    expect(record?.refreshTokenHash).toBe(expectedHash);
    expect(record?.refreshTokenHash)
      .not.toBe(issued.refreshToken);

    const verified = await auth.verifySessionToken(
      issued.accessToken
    );

    expect(verified.userId).toBe(usuario.id);
    expect(verified.sessionId)
      .toBe(issued.session.sessionId);
  });

  it('rota refresh e invalida tokens anteriores', async () => {
    const usuario = await crearUsuario();

    const first = await auth.createUserSession(
      usuario.id,
      usuario.roles
    );

    const second = await auth.rotateSessionWithRefreshToken(
      first.refreshToken
    );

    expect(second.session.version).toBe(1);
    expect(second.refreshToken).not.toBe(first.refreshToken);

    const record = await db.session.findUnique({
      where: { id: first.session.sessionId },
    });

    expect(record?.version).toBe(1);

    await expect(
      auth.rotateSessionWithRefreshToken(first.refreshToken)
    ).rejects.toThrow('REFRESH_TOKEN_REUSED');

    await expect(
      auth.verifySessionToken(first.accessToken)
    ).rejects.toThrow('ACCESS_TOKEN_VERSION_MISMATCH');

    expect(
      await auth.resolveSessionIdFromRefreshToken(
        first.refreshToken
      )
    ).toBeNull();

    expect(
      await auth.resolveSessionIdFromRefreshToken(
        second.refreshToken
      )
    ).toBe(first.session.sessionId);

    const verified = await auth.verifySessionToken(
      second.accessToken
    );

    expect(verified.version).toBe(1);
  });

  it('actualiza los roles al renovar la sesión', async () => {
    const usuario = await crearUsuario();

    const first = await auth.createUserSession(
      usuario.id,
      usuario.roles
    );

    await db.usuario.update({
      where: { id: usuario.id },
      data: { roles: ['jefe_estudio'] },
    });

    const second = await auth.rotateSessionWithRefreshToken(
      first.refreshToken
    );

    expect(second.session.roles).toEqual([
      'jefe_estudio',
    ]);

    const verified = await auth.verifySessionToken(
      second.accessToken
    );

    expect(verified.roles).toEqual([
      'jefe_estudio',
    ]);
  });

  it('revoca una sesión y rechaza sus tokens', async () => {
    const usuario = await crearUsuario();

    const issued = await auth.createUserSession(
      usuario.id,
      usuario.roles
    );

    await auth.revokeSession(issued.session.sessionId);

    expect(
      await db.session.count({
        where: { id: issued.session.sessionId },
      })
    ).toBe(0);

    await expect(
      auth.verifySessionToken(issued.accessToken)
    ).rejects.toThrow('SESSION_NOT_FOUND');

    await expect(
      auth.rotateSessionWithRefreshToken(issued.refreshToken)
    ).rejects.toThrow('SESSION_NOT_FOUND');
  });

  it('revoca todas las sesiones de un usuario', async () => {
    const usuario = await crearUsuario();

    const first = await auth.createUserSession(
      usuario.id,
      usuario.roles
    );

    const second = await auth.createUserSession(
      usuario.id,
      usuario.roles,
      { remember: true }
    );

    expect(
      await db.session.count({
        where: { userId: usuario.id },
      })
    ).toBe(2);

    await auth.revokeUserSessions(usuario.id);

    expect(
      await db.session.count({
        where: { userId: usuario.id },
      })
    ).toBe(0);

    expect(
      await auth.resolveSessionIdFromRefreshToken(
        first.refreshToken
      )
    ).toBeNull();

    expect(
      await auth.resolveSessionIdFromRefreshToken(
        second.refreshToken
      )
    ).toBeNull();
  });
});
