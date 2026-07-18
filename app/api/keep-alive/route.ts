import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

function getProvidedSecret(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  return request.headers.get('x-keep-alive-secret')?.trim() || '';
}

function getExpectedSecrets() {
  return [process.env.KEEP_ALIVE_SECRET, process.env.CRON_SECRET].filter(
    (secret): secret is string => Boolean(secret && secret.trim())
  );
}

export async function GET(request: Request) {
  const expectedSecrets = getExpectedSecrets();
  const providedSecret = getProvidedSecret(request);

  if (expectedSecrets.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'No keep-alive secret is configured (KEEP_ALIVE_SECRET or CRON_SECRET)',
      },
      { status: 500 }
    );
  }

  if (!expectedSecrets.includes(providedSecret)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        success: false,
        error: 'Supabase admin credentials are not configured',
        details: 'Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
      },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await supabaseAdmin.from('places').select('id').limit(1);

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Supabase keep-alive failed',
        details: error.message,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Supabase keep-alive succeeded',
    checkedAt: new Date().toISOString(),
  });
}