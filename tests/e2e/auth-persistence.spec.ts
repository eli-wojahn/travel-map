/**
 * E2E — Auth Persistence
 *
 * Verifica que um usuário autenticado vê seus lugares vindos do Supabase,
 * e que eles persistem após reload (sem depender do localStorage).
 */
import { test, expect } from '@playwright/test';
import { injectFakeSession, FAKE_USER } from './helpers/auth';

const FAKE_PLACE = {
  id: 'e2e-place-1',
  user_id: FAKE_USER.id,
  name: 'Paris',
  state: 'Île-de-France',
  country: 'France',
  latitude: 48.8566,
  longitude: 2.3522,
  created_at: '2024-06-01T00:00:00.000Z',
};

test('auth: lugares do Supabase aparecem e persistem após reload', async ({ page }) => {
  // Injeta sessão fake antes de carregar a página
  await injectFakeSession(page);

  // Mock da rota REST do Supabase para GET places
  await page.route('**/rest/v1/places*', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([FAKE_PLACE]),
      });
    } else {
      route.continue();
    }
  });

  await page.goto('/pt/dashboard');

  // Lugar do Supabase aparece na lista
  await expect(page.getByText('1. Paris')).toBeVisible({ timeout: 5000 });

  // Reload — o lugar continua, ainda vindo do Supabase mockado
  await page.reload();
  await expect(page.getByText('1. Paris')).toBeVisible({ timeout: 5000 });
});
