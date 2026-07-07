import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function getProvidedSecret(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  return request.headers.get('x-keep-alive-secret')?.trim() || '';
}

export async function GET(request: Request) {
  const expectedSecret = process.env.KEEP_ALIVE_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { success: false, error: 'KEEP_ALIVE_SECRET is not configured' },
      { status: 500 }
    );
  }

  if (getProvidedSecret(request) !== expectedSecret) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

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