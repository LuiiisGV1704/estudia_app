import { expect, test } from '@playwright/test';

test('shows the app shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible();
});
