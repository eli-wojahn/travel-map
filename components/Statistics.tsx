'use client';

import { useMemo } from 'react';
import { Place } from '@/types';
import { getCountryFlag } from '@/lib/countryFlags';

interface StatisticsProps {
  places: Place[];
}

/**
 * Componente que exibe estatísticas sobre os lugares visitados
 * Mostra total de cidades, países visitados e lista de países
 */
export default function Statistics({ places }: StatisticsProps) {
  // Calcula estatísticas baseadas nos lugares
  const stats = useMemo(() => {
    const totalCities = places.length;
    
    // Extrai países únicos (filtra lugares que têm país definido)
    const countriesSet = new Set<string>();
    places.forEach((place) => {
      if (place.country) {
        countriesSet.add(place.country);
      }
    });
    
    // Conta quantas cidades por país
    const citiesByCountry = new Map<string, number>();
    places.forEach((place) => {
      if (place.country) {
        const count = citiesByCountry.get(place.country) || 0;
        citiesByCountry.set(place.country, count + 1);
      }
    });
    
    // Ordena países pelo número de cidades (decrescente)
    const uniqueCountries = Array.from(citiesByCountry.keys())
      .sort((a, b) => (citiesByCountry.get(b) || 0) - (citiesByCountry.get(a) || 0));
    
    const totalCountries = uniqueCountries.length;
    
    return {
      totalCities,
      totalCountries,
      uniqueCountries,
      citiesByCountry,
    };
  }, [places]);

  if (places.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Nenhuma estatística disponível ainda.</p>
        <p className="text-sm mt-2">Adicione cidades para ver suas estatísticas!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg mb-4">
        Estatísticas
      </h3>
      
      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.totalCities}</p>
          <p className="text-sm text-gray-600 mt-1">Cidades</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.totalCountries}</p>
          <p className="text-sm text-gray-600 mt-1">Países</p>
        </div>
      </div>

      {/* Lista de países visitados */}
      {stats.totalCountries > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Países Visitados:</h4>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {stats.uniqueCountries.map((country) => {
              const cityCount = stats.citiesByCountry.get(country) || 0;
              return (
                <div
                  key={country}
                  className="flex items-center justify-between p-2"
                >
                  <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <span className="text-lg">{getCountryFlag(country)}</span>
                    <span>{country}</span>
                  </span>
                  <span className="text-xs text-gray-600">
                    {cityCount} {cityCount === 1 ? 'cidade' : 'cidades'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

