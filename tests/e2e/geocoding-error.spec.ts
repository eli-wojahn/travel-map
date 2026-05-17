/**
 * E2E — Erro de Geocoding
 *
 * Verifica que quando o Nominatim não encontra a cidade,
 * a UI exibe a mensagem de erro correta ao usuário.
 */
import { test, expect } from '@playwright/test';
import { mockNominatimNotFound } from './helpers/nominatim';

test('geocoding: cidade inexistente exibe erro na UI', async ({ page }) => {
  // Mock que simula Nominatim não encontrando a cidade
  await mockNominatimNotFound(page);

  await page.goto('/pt/dashboard');

  await page.getByPlaceholder('Digite o nome da cidade...').fill('XyzCidadeInexistente');
  await page.getByPlaceholder('Digite o nome da cidade...').press('Enter');

  // A mensagem de erro lançada por lib/geocoding.ts deve aparecer na tela
  await expect(
    page.getByText('City "XyzCidadeInexistente" not found')
  ).toBeVisible({ timeout: 5000 });
});
