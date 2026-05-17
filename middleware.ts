import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

// Create next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

/**
 * Middleware do Next.js para gerenciar autenticação Supabase e i18n
 * Atualiza a sessão do usuário em cada request e detecta o locale
 */
export async function middleware(request: NextRequest) {
  // Handle internationalization first
  let response = intlMiddleware(request);
  
  // If intl middleware returns a redirect, return it immediately
  if (response.status === 307 || response.status === 308) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();

  // Extract locale from pathname (e.g., /pt/dashboard -> pt)
  const pathnameLocale = request.nextUrl.pathname.split('/')[1];
  const locale = locales.includes(pathnameLocale as any) ? pathnameLocale : defaultLocale;

  // Protege rotas que requerem autenticação (check after locale prefix)
  const pathWithoutLocale = request.nextUrl.pathname.replace(`/${locale}`, '');
  const isAuthRoute = pathWithoutLocale.startsWith('/dashboard');
  const isLoginRoute = pathWithoutLocale.startsWith('/login');

  // Dashboard agora permite acesso sem autenticação (modo guest)
  // Não redireciona mais para login

  if (isLoginRoute && session) {
    // Redireciona para dashboard se já autenticado
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/webpack-hmr (HMR endpoint in development)
     * - favicon.ico (favicon file)
     * - any file with an extension (e.g. .json, .mp4, .png)
     */
    '/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\..*).*)',
  ],
};
