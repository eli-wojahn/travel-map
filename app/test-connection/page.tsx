'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

/**
 * Página de teste para verificar conexão com Supabase
 * Acesse: http://localhost:3000/test-connection
 */
export default function TestConnectionPage() {
  const [status, setStatus] = useState<{
    connected: boolean;
    message: string;
    details?: any;
  }>({ connected: false, message: 'Testando conexão...' });

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient();

        // Testa query na tabela places
        const { data, error } = await supabase
          .from('places')
          .select('count');

        if (error) {
          setStatus({
            connected: false,
            message: '❌ Erro ao conectar com Supabase',
            details: {
              error: error.message,
              hint: error.hint,
              code: error.code
            }
          });
          return;
        }

        // Testa auth
        const { data: { user } } = await supabase.auth.getUser();

        setStatus({
          connected: true,
          message: '✅ Supabase conectado com sucesso!',
          details: {
            database: 'Tabela places encontrada',
            authenticated: user ? 'Sim' : 'Não (esperado - ainda sem login)',
            user: user ? { id: user.id, email: user.email } : null
          }
        });
      } catch (err) {
        setStatus({
          connected: false,
          message: '❌ Erro ao conectar',
          details: {
            error: err instanceof Error ? err.message : 'Erro desconhecido',
            hint: 'Verifique o .env.local'
          }
        });
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Teste de Conexão Supabase
        </h1>

        <div className={`p-6 rounded-lg mb-6 ${
          status.connected 
            ? 'bg-green-50 border-2 border-green-500' 
            : 'bg-yellow-50 border-2 border-yellow-500'
        }`}>
          <p className="text-2xl font-semibold mb-4">{status.message}</p>
          
          {status.details && (
            <div className="mt-4 space-y-2">
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(status.details, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="space-y-4 text-sm text-gray-600">
          <h2 className="font-semibold text-lg text-gray-900">Checklist:</h2>
          <ul className="space-y-2">
            <li>✅ Dependências instaladas (@supabase/supabase-js)</li>
            <li>✅ Schema SQL executado no Supabase</li>
            <li>✅ Variáveis de ambiente configuradas (.env.local)</li>
            <li className={status.connected ? '✅' : '⏳'}>
              {status.connected ? '✅' : '⏳'} Conexão com banco de dados
            </li>
          </ul>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <a
            href="/"
            className="block w-full text-center bg-orange text-white py-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            ← Voltar para o Mapa
          </a>
        </div>
      </div>
    </div>
  );
}
