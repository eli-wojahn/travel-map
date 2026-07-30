'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import LoadingPlane from '@/components/LoadingPlane';

/**
 * Página de callback do OAuth
 * Processa o retorno do Google e redireciona
 */
export default function AuthCallbackPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState(t('auth.processingAuth'));
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
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) throw error;

          if (session?.user) {
            setStatus('success');
            setMessage(t('auth.loginSuccess'));
            
            // Aguarda 1 segundo para o usuário ver a mensagem
            setTimeout(() => {
              router.push(`/${locale}/dashboard`);
            }, 1000);
          } else {
            throw new Error(t('errors.sessionNotFound'));
          }
        } else {
          // Se não há token, verifica se já está autenticado
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            router.push(`/${locale}/dashboard`);
          } else {
            throw new Error(t('errors.accessTokenNotFound'));
          }
        }
      } catch (err) {
        console.error('Erro no callback:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : t('errors.errorProcessingAuth'));
        
        // Redireciona para login após 3 segundos
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 3000);
      }
    };

    handleCallback();
  }, [locale, router, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange/10 via-green/10 to-blue-500/10 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {status === 'loading' && (
          <>
            <LoadingPlane
              size="lg"
              hideLabel
              ariaLabel={t('auth.processing')}
              className="gap-0 mx-auto mb-4"
            />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('auth.processing')}
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
              {t('auth.successTitle')}
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
              {t('auth.errorTitle')}
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              {t('auth.redirectingToLogin')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
