'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

/**
 * Página de callback do OAuth
 * Processa o retorno do Google e redireciona
 */
export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autenticação...');
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();

        // Verifica se há um código na URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        if (accessToken) {
          // Verifica se o usuário está autenticado
          const { data: { user }, error } = await supabase.auth.getUser();

          if (error) throw error;

          if (user) {
            setStatus('success');
            setMessage('Login realizado com sucesso! Redirecionando...');
            
            // Aguarda 1 segundo para o usuário ver a mensagem
            setTimeout(() => {
              router.push('/dashboard');
            }, 1000);
          } else {
            throw new Error('Usuário não encontrado');
          }
        } else {
          // Se não há token, verifica se já está autenticado
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            router.push('/dashboard');
          } else {
            throw new Error('Token de acesso não encontrado');
          }
        }
      } catch (err) {
        console.error('Erro no callback:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Erro ao processar autenticação');
        
        // Redireciona para login após 3 segundos
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange/10 via-green/10 to-blue-500/10 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-gray-200 border-t-orange rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Processando...
            </h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Sucesso!
            </h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erro na autenticação
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecionando para a página de login...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
