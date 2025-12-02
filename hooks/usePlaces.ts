'use client';

import { useState, useEffect } from 'react';
import { Place } from '@/types';
import { loadPlaces, savePlaces, generatePlaceId } from '@/lib/storage';

/**
 * Hook customizado para gerenciar a lista de lugares visitados
 * Gerencia o estado e sincroniza com localStorage
 */
export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega lugares do localStorage ao montar o componente
  useEffect(() => {
    const loadedPlaces = loadPlaces();
    setPlaces(loadedPlaces);
    setIsLoading(false);
  }, []);

  // Salva lugares no localStorage sempre que a lista mudar
  useEffect(() => {
    if (!isLoading) {
      savePlaces(places);
    }
  }, [places, isLoading]);

  /**
   * Adiciona um novo lugar à lista
   */
  const addPlace = (place: Omit<Place, 'id' | 'createdAt'>): Place | null => {
    const isDuplicate = places.some((existing) => {
      const sameName =
        existing.name.trim().toLowerCase() === place.name.trim().toLowerCase();
      const sameCountry =
        (existing.country || '').trim().toLowerCase() ===
        (place.country || '').trim().toLowerCase();
      const sameState =
        (existing.state || '').trim().toLowerCase() ===
        (place.state || '').trim().toLowerCase();
      return sameName && sameCountry && sameState;
    });

    if (isDuplicate) {
      return null;
    }

    const newPlace: Place = {
      ...place,
      id: generatePlaceId(),
      createdAt: new Date().toISOString(),
    };
    
    setPlaces((prev) => [...prev, newPlace]);
    return newPlace;
  };

  /**
   * Remove um lugar da lista pelo ID
   */
  const removePlace = (id: string) => {
    setPlaces((prev) => prev.filter((place) => place.id !== id));
  };

  /**
   * Limpa todos os lugares
   */
  const clearPlaces = () => {
    setPlaces([]);
  };

  /**
   * Reordena os lugares (para drag and drop)
   */
  const reorderPlaces = (startIndex: number, endIndex: number) => {
    setPlaces((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  return {
    places,
    isLoading,
    addPlace,
    removePlace,
    clearPlaces,
    reorderPlaces,
  };
}

