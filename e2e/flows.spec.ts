import { expect, test } from '@playwright/test';

test('creates a task from the home screen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Añadir tarea' }).click();

  const dialog = page.getByRole('dialog', { name: 'Nueva tarea' });
  await dialog.getByLabel('Título').fill('Prueba E2E de tarea');
  await dialog.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByText('Prueba E2E de tarea')).toBeVisible();
});

test('imports a book from the library', async ({ page }) => {
  await page.goto('/biblioteca');
  await page.getByRole('button', { name: 'Importar documento' }).click();

  const dialog = page.getByRole('dialog', { name: 'Importar documento' });
  await dialog.getByLabel('Título').fill('Libro de prueba E2E');
  await dialog.getByLabel('Autor o edición').fill('Autora de prueba');
  await dialog.getByRole('button', { name: 'Importar' }).click();

  await expect(page.getByText('Libro de prueba E2E')).toBeVisible();
});

test('creates a deck from the flashcards screen', async ({ page }) => {
  await page.goto('/tarjetas');
  await page.getByRole('button', { name: 'Crear nuevo contenido' }).click();
  await page.getByRole('button', { name: 'Nuevo mazo' }).click();

  const dialog = page.getByRole('dialog', { name: 'Nuevo mazo' });
  await dialog.getByLabel('Nombre del mazo').fill('Mazo de prueba E2E');
  await dialog.getByRole('button', { name: 'Crear mazo' }).click();

  await expect(page.getByText('Mazo de prueba E2E')).toBeVisible();
});

test('changes the app palette from settings', async ({ page }) => {
  await page.goto('/ajustes');
  await page.getByRole('button', { name: 'Abrir personalización del tema' }).click();

  const dialog = page.getByRole('dialog', { name: 'Tema y paleta' });
  await dialog.getByRole('button', { name: /Océano/ }).click();

  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--c-primary')))
    .toBe('11 99 206');
});

test('switches to dark mode and remembers it', async ({ page }) => {
  await page.goto('/ajustes');
  await page.getByRole('tab', { name: 'Oscuro' }).click();

  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);

  await page.reload();
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
});

test('starts a focus session', async ({ page }) => {
  await page.goto('/enfoque');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('button', { name: 'Pausar sesión' })).toBeVisible();
});

test('completes a flashcard review', async ({ page }) => {
  await page.goto('/repaso/d-anat');

  for (let card = 0; card < 30; card += 1) {
    if (await page.getByRole('heading', { name: 'Sesión completada' }).isVisible()) break;
    await page.getByRole('button', { name: 'Mostrar respuesta' }).click();
    await page.getByRole('button', { name: /^Bien/ }).click();
  }

  await expect(page.getByRole('heading', { name: 'Sesión completada' })).toBeVisible();
});
