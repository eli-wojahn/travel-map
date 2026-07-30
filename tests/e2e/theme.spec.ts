import { test, expect, type Page } from '@playwright/test';

const THEME_UNLOCK_COUNTRY_CODES = [
  'BR', 'AR', 'CL', 'PE', 'CO', 'UY', 'PY', 'BO', 'EC', 'VE',
  'US', 'CA', 'MX', 'GT', 'CR', 'PA', 'CU', 'DO', 'JM', 'TT',
  'GB', 'IE', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'CH',
  'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'AT', 'HU', 'GR', 'TR',
  'JP', 'KR', 'CN', 'IN', 'TH', 'VN', 'AU', 'NZ', 'ZA', 'EG',
];

const THEME_UNLOCK_PLACES = THEME_UNLOCK_COUNTRY_CODES.map((countryCode, index) => ({
  id: `unlock-${index}`,
  name: `Cidade ${index}`,
  country: countryCode,
  countryCode,
  latitude: -30 + index * 0.1,
  longitude: -50 + index * 0.1,
  createdAt: '2024-01-01T00:00:00.000Z',
}));

async function unlockThemeSwitcher(page: Page) {
  await page.addInitScript((places) => {
    localStorage.setItem('lugares-do-mundo-places', JSON.stringify(places));
  }, THEME_UNLOCK_PLACES);
}

test('theme: alterna para dark e persiste apos reload', async ({ page }) => {
  await unlockThemeSwitcher(page);
  await page.goto('/pt/dashboard');

  await page.getByRole('button', { name: 'Escuro' }).first().click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.reload();

  await expect(page.locator('html')).toHaveClass(/dark/);
  const storedTheme = await page.evaluate(() => localStorage.getItem('theme-preference'));
  expect(storedTheme).toBe('dark');
});

test('theme: segue preferencia do sistema no primeiro acesso', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();

  await unlockThemeSwitcher(page);
  await page.goto('/pt/dashboard');
  await expect(page.locator('html')).not.toHaveClass(/dark/);

  await context.close();
});

test('theme: troca de idioma nao perde preferencia', async ({ page }) => {
  await unlockThemeSwitcher(page);
  await page.goto('/pt/dashboard');

  await page.getByRole('button', { name: 'Escuro' }).first().click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.getByRole('button', { name: 'Change language' }).click();
  await page.getByRole('button', { name: 'English' }).click();

  await expect(page).toHaveURL(/\/en\/dashboard/);
  await expect(page.locator('html')).toHaveClass(/dark/);
});
