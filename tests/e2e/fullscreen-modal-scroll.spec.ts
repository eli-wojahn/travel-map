import { test, expect, type Page } from '@playwright/test';

type SeedPlace = {
  id: string;
  name: string;
  state: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  createdAt: string;
};

const COUNTRIES = [
  ['Brasil', 'BR'],
  ['Portugal', 'PT'],
  ['Espanha', 'ES'],
  ['França', 'FR'],
  ['Itália', 'IT'],
  ['Alemanha', 'DE'],
  ['Japão', 'JP'],
  ['Canadá', 'CA'],
  ['Argentina', 'AR'],
  ['México', 'MX'],
  ['Chile', 'CL'],
  ['Peru', 'PE'],
  ['Colômbia', 'CO'],
  ['Uruguai', 'UY'],
  ['Paraguai', 'PY'],
  ['Estados Unidos', 'US'],
  ['Reino Unido', 'GB'],
  ['Holanda', 'NL'],
  ['Suíça', 'CH'],
  ['Austrália', 'AU'],
] as const;

function buildPlaces(total = 120): SeedPlace[] {
  const now = Date.now();

  return Array.from({ length: total }, (_, i) => {
    const [country, countryCode] = COUNTRIES[i % COUNTRIES.length];

    return {
      id: `place-${now}-${i}`,
      name: `Cidade ${i + 1}`,
      state: `Estado ${(i % 16) + 1}`,
      country,
      countryCode,
      latitude: -35 + (i % 24),
      longitude: -70 + (i % 24),
      createdAt: new Date(now - i * 3_600_000).toISOString(),
    };
  });
}

async function seedFullscreenData(page: Page) {
  const places = buildPlaces();

  await page.addInitScript((payload) => {
    localStorage.setItem('lugares-do-mundo-places', JSON.stringify(payload.places));
    localStorage.setItem('lugares-do-mundo-welcome-modal-seen-v1', 'true');
  }, { places });
}

async function openPanel(page: Page, panelAriaLabel: 'Cidades' | 'Estatísticas') {
  await page.getByRole('button', { name: panelAriaLabel }).click();
  const panelShell = page.locator('div.fixed.inset-0.z-\\[1060\\]').first();
  await expect(panelShell).toHaveClass(/pointer-events-auto/);
}

async function closePanel(page: Page) {
  // Fullscreen page closes the panel on Escape; this is less flaky than pointer clicks over map overlays.
  await page.keyboard.press('Escape');
  const panelShell = page.locator('div.fixed.inset-0.z-\\[1060\\]').first();
  await expect(panelShell).toHaveClass(/pointer-events-none/);
}

async function assertModalKeepsSizeAndScrollsInternally(page: Page) {
  const modal = page.locator('div.z-\\[1060\\] > div.rounded-2xl').first();
  await expect(modal).toBeVisible();

  const before = await modal.boundingBox();
  expect(before).not.toBeNull();

  const expandButton = page.getByRole('button', { name: 'Expandir' });
  await expect(expandButton).toBeVisible();
  await expandButton.click();

  const after = await modal.boundingBox();
  expect(after).not.toBeNull();

  const heightDelta = Math.abs((after?.height ?? 0) - (before?.height ?? 0));
  expect(heightDelta).toBeLessThanOrEqual(1);

  const maxOverflowDelta = await modal.evaluate((container) => {
    const elements = Array.from(container.querySelectorAll<HTMLElement>('*'));

    let best = 0;
    for (const el of elements) {
      const style = window.getComputedStyle(el);
      const isScrollable = style.overflowY === 'auto' || style.overflowY === 'scroll';
      if (!isScrollable) continue;

      const delta = el.scrollHeight - el.clientHeight;
      if (delta > best) best = delta;
    }

    return best;
  });

  expect(maxOverflowDelta).toBeGreaterThan(0);
}

async function runFullscreenModalScrollScenario(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await seedFullscreenData(page);
  await page.goto('/pt/dashboard/fullscreen');

  await expect(page.getByRole('button', { name: 'Cidades' })).toBeVisible();

  await openPanel(page, 'Cidades');
  await assertModalKeepsSizeAndScrollsInternally(page);
  await closePanel(page);

  await openPanel(page, 'Estatísticas');
  await assertModalKeepsSizeAndScrollsInternally(page);
  await closePanel(page);
}

test('fullscreen: modal de cidades e estatisticas mantém proporcao e rola internamente (desktop)', async ({ page }) => {
  await runFullscreenModalScrollScenario(page, { width: 1366, height: 900 });
});

test('fullscreen: modal de cidades e estatisticas mantém proporcao e rola internamente (mobile)', async ({ page }) => {
  await runFullscreenModalScrollScenario(page, { width: 390, height: 844 });
});
