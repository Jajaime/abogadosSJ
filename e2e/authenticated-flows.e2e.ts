import { randomBytes, randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { expect, test, type Page } from '@playwright/test';

let db: PrismaClient;
let adminEmail = '';
let adminId = '';
let redactorEmail = '';

const idsCreados: string[] = [];
const password = randomBytes(24).toString('base64url');

test.beforeAll(async () => {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL ausente');

  const url = new URL(raw);

  const seguro =
    url.protocol === 'postgresql:' &&
    url.hostname === '127.0.0.1' &&
    url.port === '5434' &&
    url.username === 'abogadossj_it' &&
    url.pathname === '/abogadossj_it';

  if (!seguro) {
    throw new Error('Base E2E no autorizada');
  }

  db = new PrismaClient();
  await db.$connect();

  const identity = await db.$queryRaw<
    Array<{ database_name: string; database_user: string }>
  >`
    SELECT
      current_database() AS database_name,
      current_user AS database_user
  `;

  if (
    identity[0]?.database_name !== 'abogadossj_it' ||
    identity[0]?.database_user !== 'abogadossj_it'
  ) {
    throw new Error('Identidad PostgreSQL incorrecta');
  }

  const hash = await bcrypt.hash(password, 8);

  const admin = await db.usuario.create({
    data: {
      email: `e2e-admin-${randomUUID()}@example.test`,
      name: 'Administrador E2E',
      passwordHash: hash,
      roles: ['admin'],
    },
  });

  adminId = admin.id;
  adminEmail = admin.email;
  idsCreados.push(admin.id);

  const redactor = await db.usuario.create({
    data: {
      email: `e2e-redactor-${randomUUID()}@example.test`,
      name: 'Redactor E2E',
      passwordHash: hash,
      roles: ['abogado_redactor'],
    },
  });

  redactorEmail = redactor.email;
  idsCreados.push(redactor.id);
});

test.afterAll(async () => {
  if (!db) return;

  try {
    if (idsCreados.length > 0) {
      await db.usuario.deleteMany({
        where: { id: { in: idsCreados } },
      });
    }
  } finally {
    await db.$disconnect();
  }
});

async function iniciarSesion(page: Page, email: string) {
  await page.goto('/auth/login?next=%2Fpages%2Fdemanda');

  await page.getByLabel('Correo Electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);

  await page.getByRole('button', {
    name: 'Ingresar',
  }).click();

  await expect(page).toHaveURL(/\/pages\/demanda\/?$/);

  await expect(
    page.getByRole('button', { name: 'Nueva Demanda' })
  ).toBeVisible();
}

test('administrador inicia y cierra sesión real', async ({ page }) => {
  await iniciarSesion(page, adminEmail);

  await expect(
    page.getByRole('link', { name: 'Usuarios' })
  ).toBeVisible();

  const status = await page.request.get('/api/auth/status');

  expect(status.status()).toBe(200);
  expect((await status.json()).ok).toBe(true);

  await page.getByRole('button', {
    name: 'Salir',
  }).click();

  await expect(page).toHaveURL(/\/auth\/login/);

  await expect.poll(async () => {
    return db.session.count({
      where: { userId: adminId },
    });
  }).toBe(0);
});

test('redactor no puede acceder a Usuarios', async ({ page }) => {
  await iniciarSesion(page, redactorEmail);

  await expect(
    page.getByRole('link', { name: 'Usuarios' })
  ).toHaveCount(0);

  await page.goto('/pages/usuario');

  await expect(page).toHaveURL(/\/auth\/access/);

  await expect(
    page.getByRole('heading', { name: 'Acceso Denegado' })
  ).toBeVisible();
});
