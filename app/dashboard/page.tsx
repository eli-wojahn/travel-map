'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { usePlaces } from '@/hooks/usePlaces';
import CityInput from '@/components/CityInput';
import CityList from '@/components/CityList';
import Statistics from '@/components/Statistics';
import WorldMapSimple from '@/components/WorldMapSimple';
import Modal from '@/components/Modal';
import { getCountryFlag } from '@/lib/countryFlags';
import { Place } from '@/types';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[600px] rounded-lg border border-gray-300 flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Carregando mapa...</p>
    </div>
  ),
});

const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((mod) => mod.DotLottieReact),
  { ssr: false }
);

/**
 * Dashboard - Página principal após login
 */
export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const { places, isLoading, addPlace, removePlace, clearPlaces, reorderPlaces } = usePlaces();
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAnimationModal, setShowAnimationModal] = useState(false);
  const [recentlyAddedPlace, setRecentlyAddedPlace] = useState<Place | null>(null);

  // Verifica autenticação
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);
      setIsLoadingAuth(false);
    };

    checkAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  // Pré-carrega a animação
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/celebration-animation.json';
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const handleAddPlace = useCallback(
    async (place: Omit<Place, 'id' | 'createdAt'>) => {
      const isFirstPlace = places.length === 0;
      const addedPlace = await addPlace(place);
      if (!addedPlace) {
        setError('Essa cidade já está na sua lista.');
        return false;
      }
      setError(null);
      setRecentlyAddedPlace(addedPlace);

      const isCoordinate = addedPlace.name.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/);

      if (isFirstPlace && !isCoordinate) {
        setShowAnimationModal(true);
      } else {
        setShowConfirmModal(true);
      }
      return true;
    },
    [addPlace, places]
  );

  const scrollToList = () => {
    const listElement = document.getElementById('city-list-section');
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erro ao buscar informações do local');
      }

      const data = await response.json();
      const name = data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality ||
        `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const country = data.address?.country || undefined;

      const placeData = {
        name,
        state:
          data.address?.state ||
          data.address?.state_district ||
          data.address?.region ||
          undefined,
        country,
        latitude: lat,
        longitude: lng,
      };

      const isFirstPlace = places.length === 0;
      const addedPlace = await addPlace(placeData);

      if (!addedPlace) {
        setError('Essa cidade já está na sua lista.');
        return;
      }

      setError(null);
      setRecentlyAddedPlace(addedPlace);

      const isCoordinate = addedPlace.name.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/);

      if (isFirstPlace && !isCoordinate) {
        setShowAnimationModal(true);
      } else {
        setShowConfirmModal(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Erro ao adicionar local. Tente novamente.';
      setError(errorMessage);
    }
  }, [addPlace, places]);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-orange rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Cabeçalho com info do usuário */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Travel Map
              </h1>
              <p className="text-gray-600">
                Marque e visualize todos os lugares que você já visitou
              </p>
            </div>
            
            {user && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Olá,</p>
                  <p className="font-medium text-gray-900">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                </div>
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Erro:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Input de cidade */}
        <div className="mb-6 max-w-2xl mx-auto">
          <CityInput onAddPlace={handleAddPlace} onError={handleError} />
        </div>

        {/* Mapa */}
        <div className="mb-6 max-w-6xl mx-auto">
          {isLoading ? (
            <div className="w-full h-full min-h-[600px] rounded-lg border border-gray-300 flex items-center justify-center bg-gray-100">
              <p className="text-gray-500">Carregando lugares...</p>
            </div>
          ) : (
            <Map places={places} onMapClick={handleMapClick} />
          )}
          <p className="text-sm text-gray-500 mt-2 text-center">
            Clique no mapa para adicionar um local diretamente
          </p>

          {/* Botões de ação */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-6 py-2 bg-orange text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Salvar
            </button>
            <button
              onClick={() => {
                if (places.length === 0) {
                  setError('Não há cidades para limpar.');
                  setTimeout(() => setError(null), 5000);
                  return;
                }
                setShowClearModal(true);
              }}
              className="px-6 py-2 bg-green text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Botão flutuante mobile */}
        <button
          onClick={scrollToList}
          className="lg:hidden fixed bottom-6 right-6 bg-orange text-white p-4 rounded-full shadow-lg hover:opacity-90 transition-all z-50 flex items-center justify-center"
          aria-label="Ver lista de cidades"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Lista e Estatísticas */}
        <div id="city-list-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto items-start">
          <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm min-h-56">
            <CityList places={places} onRemovePlace={removePlace} onReorderPlaces={reorderPlaces} />
          </div>
          <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm min-h-56">
            <Statistics places={places} />
          </div>
        </div>

        {/* Mapa simplificado */}
        <div className="max-w-6xl mx-auto mt-6">
          <WorldMapSimple places={places} />
        </div>

        {/* Rodapé */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>
            Desenvolvido por{' '}
            <a
              href="https://github.com/eli-wojahn/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Elias Wojahn
            </a>
          </p>
        </footer>

        {/* Modais */}
        <Modal
          isOpen={showAnimationModal}
          title=""
          message={
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Parabéns, você visitou seu primeiro país!
              </h2>
              <div className="w-96 h-96 flex items-center justify-center">
                <DotLottieReact
                  src="/celebration-animation.json"
                  autoplay={true}
                  loop={false}
                  speed={0.7}
                />
              </div>
            </div>
          }
          confirmText="OK"
          cancelText=""
          type="success"
          onConfirm={() => {
            setShowAnimationModal(false);
            setShowConfirmModal(true);
          }}
          onCancel={() => {}}
        />

        <Modal
          isOpen={showSaveModal}
          title="Salvar Lugares"
          message="Seus dados já estão sendo salvos automaticamente no Supabase e sincronizados entre todos os seus dispositivos!"
          confirmText="Entendi"
          cancelText="Fechar"
          type="info"
          videoSrc="/save-map.mp4"
          onConfirm={() => setShowSaveModal(false)}
          onCancel={() => setShowSaveModal(false)}
        />

        <Modal
          isOpen={showClearModal}
          title="Limpar Todas as Cidades"
          message={`Tem certeza que deseja limpar todas as ${places.length} cidade(s) visitada(s)? Esta ação não pode ser desfeita.`}
          confirmText="Limpar"
          cancelText="Cancelar"
          type="warning"
          videoSrc="/trash-bin.mp4"
          onConfirm={() => {
            clearPlaces();
            setShowClearModal(false);
          }}
          onCancel={() => setShowClearModal(false)}
        />

        {recentlyAddedPlace && (
          <Modal
            isOpen={showConfirmModal}
            title="Cidade Adicionada!"
            videoSrc="/city-added.mp4"
            message={
              <div className="space-y-2">
                {recentlyAddedPlace.name.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/) && (
                  <p className="text-yellow-600 font-medium text-sm mb-2">
                    ⚠️ O local adicionado não é uma cidade.
                  </p>
                )}
                <p className="font-semibold text-lg">{recentlyAddedPlace.name}</p>
                {(recentlyAddedPlace.state || recentlyAddedPlace.country) && (
                  <p className="text-gray-600 flex items-center gap-1 justify-center">
                    {recentlyAddedPlace.country && (
                      <span>{getCountryFlag(recentlyAddedPlace.country)}</span>
                    )}
                    <span>
                      {[recentlyAddedPlace.state, recentlyAddedPlace.country].filter(Boolean).join(', ')}
                    </span>
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Adicionada em: {new Date(recentlyAddedPlace.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </p>
              </div>
            }
            confirmText="OK"
            cancelText="Remover"
            type="info"
            onConfirm={() => {
              setShowConfirmModal(false);
              setRecentlyAddedPlace(null);
            }}
            onCancel={() => {
              if (recentlyAddedPlace) {
                removePlace(recentlyAddedPlace.id);
              }
              setShowConfirmModal(false);
              setRecentlyAddedPlace(null);
            }}
          />
        )}
      </div>
    </main>
  );
}
