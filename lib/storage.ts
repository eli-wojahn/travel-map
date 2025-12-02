import { Place } from '@/types';

const STORAGE_KEY = 'lugares-do-mundo-places';

/**
 * Salva a lista de lugares no localStorage
 */
export function savePlaces(places: Place[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
  } catch (error) {
    console.error('Erro ao salvar lugares no localStorage:', error);
  }
}

/**
 * Carrega a lista de lugares do localStorage
 */
export function loadPlaces(): Place[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    return JSON.parse(stored) as Place[];
  } catch (error) {
    console.error('Erro ao carregar lugares do localStorage:', error);
    return [];
  }
}

/**
 * Gera um ID único para um novo lugar
 */
export function generatePlaceId(): string {
  return `place-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

