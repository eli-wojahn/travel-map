import { test, expect } from '@playwright/test';

test('theme: alterna para dark e persiste apos reload', async ({ page }) => {
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

  await page.goto('/pt/dashboard');
  await expect(page.locator('html')).toHaveClass(/dark/);

  await context.close();
});

test('theme: troca de idioma nao perde preferencia', async ({ page }) => {
  await page.goto('/pt/dashboard');

  await page.getByRole('button', { name: 'Escuro' }).first().click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.getByRole('button', { name: 'Change language' }).click();
  await page.getByRole('button', { name: 'English' }).click();

  await expect(page).toHaveURL(/\/en\/dashboard/);
  await expect(page.locator('html')).toHaveClass(/dark/);
});
