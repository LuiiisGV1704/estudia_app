import { expect, test } from '@playwright/test';

const screens = [
  ['/', 'Inicio'],
  ['/agenda', 'Agenda'],
  ['/tarjetas', 'Tarjetas'],
  ['/biblioteca', 'Biblioteca'],
  ['/grupos', 'Grupos'],
  ['/ajustes', 'Ajustes'],
  ['/estadisticas', 'Estadísticas'],
  ['/buscar', 'Búsqueda global'],
  ['/enfoque', 'Concentración'],
  ['/repaso/d-anat', 'Anatomía: Huesos del cráneo'],
  ['/lector/b-anat', 'Anatomía humana'],
] as const;

test.describe('all screens', () => {
  for (const [path, heading] of screens) {
    test(`renders ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});
