'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { usePlaces } from '@/hooks/usePlaces';
import CityInput from '@/components/CityInput';
import CityList from '@/components/CityList';
import Statistics from '@/components/Statistics';
import WorldMapSimple from '@/components/WorldMapSimple';
import Modal from '@/components/Modal';
import { getCountryFlag } from '@/lib/countryFlags';
import { Place } from '@/types';

// Importação dinâmica do Map para evitar problemas de SSR
// O Leaflet não funciona com Server-Side Rendering
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[600px] rounded-lg border border-gray-300 flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Carregando mapa...</p>
    </div>
  ),
});

// Importação dinâmica do DotLottieReact
const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((mod) => mod.DotLottieReact),
  { ssr: false }
);

export default function Home() {
  const { places, isLoading, addPlace, removePlace, clearPlaces, reorderPlaces } = usePlaces();
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAnimationModal, setShowAnimationModal] = useState(false);
  const [recentlyAddedPlace, setRecentlyAddedPlace] = useState<Place | null>(null);

  // Pré-carrega a animação em background
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

  // Handler para adicionar lugar via input
  const handleAddPlace = useCallback(
    (place: Omit<Place, 'id' | 'createdAt'>) => {
      const isFirstPlace = places.length === 0;
      const addedPlace = addPlace(place);
      if (!addedPlace) {
        setError('Essa cidade já está na sua lista.');
        return false;
      }
      setError(null);
      setRecentlyAddedPlace(addedPlace);

      // Se é a primeira cidade, mostra animação primeiro
      if (isFirstPlace) {
        setShowAnimationModal(true);
      } else {
        // Se não é a primeira, mostra direto o modal de confirmação
        setShowConfirmModal(true);
      }
      return true;
    },
    [addPlace, places]
  );

  // Handler para rolar até a listagem de cidades
  const scrollToList = () => {
    const listElement = document.getElementById('city-list-section');
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handler para adicionar lugar via clique no mapa
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    try {
      // Faz geocodificação reversa para obter o nome da cidade
      // Usa a API Nominatim em modo reverso (chamada direta do cliente, como antes)
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
      const addedPlace = addPlace(placeData);

      if (!addedPlace) {
        setError('Essa cidade já está na sua lista.');
        return;
      }

      setError(null);
      setRecentlyAddedPlace(addedPlace);

      // Se é a primeira cidade, mostra animação primeiro
      if (isFirstPlace) {
        setShowAnimationModal(true);
      } else {
        // Se não é a primeira, mostra direto o modal de confirmação
        setShowConfirmModal(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Erro ao adicionar local. Tente novamente.';
      setError(errorMessage);
    }
  }, [addPlace]);

  // Handler para erros do CityInput
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    // Remove o erro após 5 segundos
    setTimeout(() => setError(null), 5000);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Cabeçalho */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Travel Map
          </h1>
          <p className="text-gray-600">
            Marque e visualize todos os lugares que você já visitou
          </p>
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

        {/* Mapa centralizado */}
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

        {/* Botão flutuante para rolar até a lista (apenas mobile) */}
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

        {/* Lista de cidades e Estatísticas lado a lado */}
        <div id="city-list-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto items-start">
          {/* Lista de cidades */}
          <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm min-h-56">
            <CityList places={places} onRemovePlace={removePlace} onReorderPlaces={reorderPlaces} />
          </div>

          {/* Estatísticas */}
          <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm min-h-56">
            <Statistics places={places} />
          </div>
        </div>

        {/* Mapa simplificado com react-simple-maps */}
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

        {/* Modal de Animação (primeira cidade) */}
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

        {/* Modal de Salvar */}
        <Modal
          isOpen={showSaveModal}
          title="Salvar Lugares"
          message="Seus dados já estão sendo salvos automaticamente no navegador. Funcionalidade de salvar será implementada em breve! ."
          confirmText="Entendi"
          cancelText="Fechar"
          type="info"
          onConfirm={() => setShowSaveModal(false)}
          onCancel={() => setShowSaveModal(false)}
        />

        {/* Modal de Limpar */}
        <Modal
          isOpen={showClearModal}
          title="Limpar Todas as Cidades"
          message={`Tem certeza que deseja limpar todas as ${places.length} cidade(s) visitada(s)? Esta ação não pode ser desfeita.`}
          confirmText="Limpar"
          cancelText="Cancelar"
          type="warning"
          onConfirm={() => {
            clearPlaces();
            setShowClearModal(false);
          }}
          onCancel={() => setShowClearModal(false)}
        />

        {/* Modal de Confirmação de Cidade Adicionada */}
        {recentlyAddedPlace && (
          <Modal
            isOpen={showConfirmModal}
            title="Cidade Adicionada!"
            message={
              <div className="space-y-2">
                {/* Detecta se é apenas coordenada (nome contém vírgula e números) */}
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
              // Remove the recently added place
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