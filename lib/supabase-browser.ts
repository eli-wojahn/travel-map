'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

/**
 * Cliente Supabase otimizado para uso no browser (Client Components)
 * Usa @supabase/ssr para melhor performance e cache
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
