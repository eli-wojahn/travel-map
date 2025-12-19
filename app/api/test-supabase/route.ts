import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API Route de teste para verificar conexão com Supabase
 * Acesse: http://localhost:3000/api/test-supabase
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Tenta buscar a versão do PostgreSQL
    const { data, error } = await supabase
      .from('places')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          hint: 'Verifique se executou o schema.sql no Supabase'
        },
        { status: 500 }
      );
    }

    // Testa autenticação
    const { data: { user } } = await supabase.auth.getUser();

    return NextResponse.json({
      success: true,
      message: '✅ Supabase conectado com sucesso!',
      database: 'places table encontrada',
      authenticated: user ? true : false,
      user: user ? {
        id: user.id,
        email: user.email
      } : null
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        hint: 'Verifique o .env.local'
      },
      { status: 500 }
    );
  }
}
