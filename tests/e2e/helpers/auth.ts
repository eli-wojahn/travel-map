import { Page } from '@playwright/test';

const DEFAULT_PROJECT_REF = 'xeyntotoxjrjyperghmq';

export function getAuthStorageKey(supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL): string {
  const projectRef = (() => {
    if (!supabaseUrl) return DEFAULT_PROJECT_REF;

    try {
      return new URL(supabaseUrl).hostname.split('.')[0] || DEFAULT_PROJECT_REF;
    } catch {
      return DEFAULT_PROJECT_REF;
    }
  })();

  return `sb-${projectRef}-auth-token`;
}

const FAKE_USER = {
  id: 'fake-user-e2e-id',
  aud: 'authenticated',
  email: 'e2e@test.com',
  role: 'authenticated',
  app_metadata: { provider: 'google' },
  user_metadata: { full_name: 'E2E User', avatar_url: '' },
  created_at: '2024-01-01T00:00:00.000Z',
};

const FAKE_SESSION = {
  access_token: 'fake-access-token-e2e',
  refresh_token: 'fake-refresh-token-e2e',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: FAKE_USER,
};

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/**
 * Injeta uma sessão autenticada fake no browser antes da página carregar.
 * Intercepta chamadas ao Supabase Auth para que o app acredite que há
 * um usuário logado, sem precisar passar pelo Google OAuth real.
 */
export async function injectFakeSession(page: Page): Promise<void> {
  const storageKey = getAuthStorageKey();
  const encodedSession = `base64-${toBase64Url(JSON.stringify(FAKE_SESSION))}`;

  // 1. Seta a sessão no cookie usado pelo createBrowserClient (@supabase/ssr)
  // Também mantém localStorage para compatibilidade com libs/fallbacks.
  await page.context().addCookies([
    {
      name: storageKey,
      value: encodedSession,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // 2. Seta o token de auth no localStorage antes do script da página rodar
  await page.addInitScript(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
      // Remove a marca de modo guest caso esteja presente
      localStorage.removeItem('guest-mode');
    },
    { key: storageKey, session: FAKE_SESSION }
  );

  // 3. Intercepta GET /auth/v1/user (chamado pelo getUser() do SDK)
  await page.route('**/auth/v1/user**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_USER),
    });
  });

  // 4. Intercepta POST /auth/v1/token (renovação de token / getSession)
  await page.route('**/auth/v1/token**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_SESSION),
    });
  });
}

export { FAKE_USER };
