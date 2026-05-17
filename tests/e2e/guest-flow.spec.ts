/**
 * E2E — Fluxo Guest
 *
 * Verifica que um usuário não logado consegue adicionar uma cidade,
 * e que ela persiste após recarregar a página (via localStorage).
 */
import { test, expect } from '@playwright/test';
import { mockNominatim } from './helpers/nominatim';

test('guest: adicionar cidade e persistir após reload', async ({ page }) => {
  // Mock Nominatim antes de qualquer navegação
  await mockNominatim(page, {
    name: 'Tokyo',
    state: 'Tokyo Metropolis',
    country: 'Japan',
    lat: 35.6762,
    lon: 139.6503,
  });

  await page.goto('/pt/dashboard');

  // Preenche e submete o formulário de busca
  await page.getByPlaceholder('Digite o nome da cidade...').fill('Tokyo');
  await page.getByPlaceholder('Digite o nome da cidade...').press('Enter');

  // Cidade aparece na lista
  await expect(page.getByText('1. Tokyo')).toBeVisible({ timeout: 5000 });

  // Recarrega a página
  await page.reload();

  // Cidade ainda está lá (veio do localStorage)
  await expect(page.getByText('1. Tokyo')).toBeVisible({ timeout: 5000 });
});
