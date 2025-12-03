'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { usePlaces } from '@/hooks/usePlaces';
import CityInput from '@/components/CityInput';
import CityList from '@/components/CityList';
import Statistics from '@/components/Statistics';
import WorldMapSimple from '@/components/WorldMapSimple';
import Modal from '@/components/Modal';
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

export default function Home() {
  const { places, isLoading, addPlace, removePlace, clearPlaces, reorderPlaces } = usePlaces();
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Handler para adicionar lugar via input
  const handleAddPlace = useCallback(
    (place: Omit<Place, 'id' | 'createdAt'>) => {
      const result = addPlace(place);
      if (!result) {
        setError('Essa cidade já está na sua lista.');
        return false;
      }
      setError(null);
      return true;
    },
    [addPlace]
  );

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

      const result = addPlace({
        name,
        state:
          data.address?.state ||
          data.address?.state_district ||
          data.address?.region ||
          undefined,
        country,
        latitude: lat,
        longitude: lng,
      });

      if (!result) {
        setError('Essa cidade já está na sua lista.');
        return;
      }

      setError(null);
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

        {/* Lista de cidades e Estatísticas lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto items-start">
          {/* Lista de cidades */}
          <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm min-h-56">
            <CityList places={places} onRemovePlace={removePlace} onReorderPlaces={reorderPlaces} />
          </div>

          {/* Estatísticas */}
          <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm min-h-56">
            <Statistics places={places} />
          </div>
        </div>

        {/* Mapa simplificado com react-simple-maps para marcar países visitados */}
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
      </div>
    </main>
  );
}