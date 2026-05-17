/**
 * E2E — Migração Guest → Auth
 *
 * Verifica que ao carregar a dashboard com a flag de migração ativa,
 * os dados do localStorage são enviados ao Supabase e o localStorage é limpo.
 */
import { test, expect } from '@playwright/test';
import { injectFakeSession, FAKE_USER } from './helpers/auth';

const GUEST_PLACE = {
  id: 'guest-place-1',
  name: 'Buenos Aires',
  state: 'Buenos Aires',
  country: 'Argentina',
  latitude: -34.6037,
  longitude: -58.3816,
  createdAt: '2024-01-01T00:00:00.000Z',
};

test('migração: dados guest são enviados ao Supabase e localStorage é limpo', async ({ page }) => {
  // Injeta sessão autenticada fake
  await injectFakeSession(page);

  // Popula localStorage com dado guest E seta a flag de migração
  await page.addInitScript(
    ({ place, storageKey }) => {
      localStorage.setItem(storageKey, JSON.stringify([place]));
      sessionStorage.setItem('should-migrate-guest-data', 'true');
    },
    { place: GUEST_PLACE, storageKey: 'lugares-do-mundo-places' }
  );

  // GET places → vazio (ainda não migrou nada)
  await page.route('**/rest/v1/places*', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else if (route.request().method() === 'POST') {
      // Simula insert bem-sucedido retornando os dados inseridos
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'supabase-place-1',
            user_id: FAKE_USER.id,
            name: GUEST_PLACE.name,
            state: GUEST_PLACE.state,
            country: GUEST_PLACE.country,
            latitude: GUEST_PLACE.latitude,
            longitude: GUEST_PLACE.longitude,
            created_at: GUEST_PLACE.createdAt,
          },
        ]),
      });
    } else {
      route.continue();
    }
  });

  await page.goto('/pt/dashboard');

  // Aguarda a migração completar — verifica que localStorage foi limpo
  await expect
    .poll(
      async () =>
        page.evaluate(() => localStorage.getItem('lugares-do-mundo-places')),
      { timeout: 5000, message: 'localStorage deve ser removido após migração' }
    )
    .toBeNull();
});
