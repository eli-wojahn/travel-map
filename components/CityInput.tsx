'use client';

import { useState, FormEvent, useRef } from 'react';
import { geocodeCity } from '@/lib/geocoding';
import { Place } from '@/types';

interface CityInputProps {
  onAddPlace: (place: Omit<Place, 'id' | 'createdAt'>) => Promise<boolean> | boolean;
  onError?: (error: string) => void;
}

/**
 * Componente para adicionar uma cidade através de input de texto
 * Faz geocodificação automática ao submeter o formulário
 */
export default function CityInput({ onAddPlace, onError }: CityInputProps) {
  const [cityName, setCityName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!cityName.trim()) {
      onError?.('Por favor, digite o nome de uma cidade');
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    let shouldFocus = false;

    try {
      // Faz a geocodificação da cidade
      const geocodeResult = await geocodeCity(cityName.trim());
      
      // Adiciona o lugar usando o callback
      const success = await onAddPlace({
        name: geocodeResult.name,
        state: geocodeResult.state,
        country: geocodeResult.country,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
      });

      if (!success) {
        onError?.('Essa cidade já foi adicionada.');
        shouldFocus = true;
      } else {
        // Limpa o input após adicionar
        setCityName('');
        shouldFocus = true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao buscar a cidade. Tente novamente.';
      onError?.(errorMessage);
      shouldFocus = true;
    } finally {
      setIsLoading(false);
      
      // Foca no input após tudo estar completo
      if (shouldFocus) {
        // Usa múltiplos timeouts para garantir que o foco aconteça
        requestAnimationFrame(() => {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <input
        ref={inputRef}
        type="text"
        value={cityName}
        onChange={(e) => setCityName(e.target.value)}
        placeholder="Digite o nome da cidade..."
        className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={isLoading}
        autoFocus
      />
      <button
        type="submit"
        disabled={isLoading || !cityName.trim()}
        className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        onMouseDown={(e) => {
          // Previne que o botão roube o foco do input
          e.preventDefault();
        }}
      >
        {isLoading ? 'Buscando...' : 'Adicionar'}
      </button>
    </form>
  );
}

