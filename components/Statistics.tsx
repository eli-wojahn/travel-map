'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Place } from '@/types';
import { getCountryFlag } from '@/lib/countryFlags';
import * as Collapsible from '@radix-ui/react-collapsible';

interface StatisticsProps {
  places: Place[];
  onShareClick?: () => void;
}

/**
 * Componente que exibe estatísticas sobre os lugares visitados
 * Mostra total de cidades, países visitados e lista de países
 */
export default function Statistics({ places, onShareClick }: StatisticsProps) {
  const t = useTranslations();
  const [openCountries, setOpenCountries] = useState(false);
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
        <p>{t('statistics.noStatsYet')}</p>
        <p className="text-sm mt-2">{t('statistics.addCitiesForStats')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">
          {t('statistics.title')}
        </h3>
        {onShareClick && (
          <button
            onClick={onShareClick}
            className="flex items-center gap-2 px-4 py-2 bg-orange hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
            title={t('statistics.share')}
          >
            <span>📤</span>
            <span>{t('statistics.share')}</span>
          </button>
        )}
      </div>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.totalCities}</p>
          <p className="text-sm text-gray-600 mt-1">{t('statistics.cities')}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.totalCountries}</p>
          <p className="text-sm text-gray-600 mt-1">{t('statistics.countries')}</p>
        </div>
      </div>

      {/* Lista de países visitados */}
      {stats.totalCountries > 0 && (
        <Collapsible.Root open={openCountries} onOpenChange={setOpenCountries}>
          <div className="mb-2">
            <h4 className="font-medium text-gray-700">{t('statistics.visitedCountries')}</h4>
          </div>
          <Collapsible.Content
            forceMount
            className={`flex-1 overflow-auto ${stats.totalCountries > 8 && !openCountries ? 'pb-10' : ''}`}
          >
            <div className="space-y-2">
              {(openCountries || stats.totalCountries <= 8
                ? stats.uniqueCountries
                : stats.uniqueCountries.slice(0, 8)
              ).map((country) => {
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
                      {cityCount} {cityCount === 1 ? t('cities.city') : t('cities.cities')}
                    </span>
                  </div>
                );
              })}
            </div>
          </Collapsible.Content>
          {stats.totalCountries > 8 && (
            <div className="h-12 flex items-center justify-center">
              <Collapsible.Trigger asChild>
                <button
                  className="w-10 h-10 flex items-center justify-center bg-green text-white rounded-lg hover:opacity-90 transition-opacity"
                  aria-label={openCountries ? t('cities.collapse') : t('cities.expand')}
                  title={openCountries ? t('cities.collapse') : t('cities.expand')}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`transition-transform duration-200 ${openCountries ? 'rotate-180' : ''}`}
                  >
                    <path
                      d="M8 10l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </Collapsible.Trigger>
            </div>
          )}
        </Collapsible.Root>
      )}
    </div>
  );
}

