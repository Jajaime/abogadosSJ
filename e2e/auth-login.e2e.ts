import { test, expect } from '@playwright/test';

test('muestra el formulario de login', async ({ page }) => {
  await page.goto('/auth/login');

  await expect(
    page.getByText('Bienvenidos a Ss&Cía')
  ).toBeVisible();

  await expect(
    page.getByLabel('Correo Electrónico')
  ).toBeVisible();

  await expect(
    page.getByLabel('Contraseña')
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: 'Ingresar' })
  ).toBeVisible();
});

test('valida campos obligatorios', async ({ page }) => {
  await page.goto('/auth/login');

  await page.getByRole('button', {
    name: 'Ingresar',
  }).click();

  await expect(
    page.getByText(
      'Correo y contraseña son obligatorios.'
    )
  ).toBeVisible();
});

test('redirige al login sin sesión', async ({ page }) => {
  await page.goto('/pages/demanda');

  await expect(page).toHaveURL(/\/auth\/login/);

  const url = new URL(page.url());

  expect(url.searchParams.get('next'))
    .toBe('/pages/demanda');

  await expect(
    page.getByRole('button', { name: 'Ingresar' })
  ).toBeVisible();
});
