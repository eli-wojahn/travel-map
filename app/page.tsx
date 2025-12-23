'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página inicial - redireciona direto para o app
 * Usuário pode usar sem login (localStorage) ou fazer login (Supabase)
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona direto para o dashboard
    // O dashboard vai permitir uso sem login
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-orange rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}