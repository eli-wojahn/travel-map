'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Place } from '@/types';
import { getCountryFlag, getCountryFlagByCode } from '@/lib/countryFlags';
import { getCountryIdentity, getLocalizedCountryName } from '@/lib/country';
import * as Collapsible from '@radix-ui/react-collapsible';

interface StatisticsProps {
  places: Place[];
  onShareClick?: () => void;
  showTitle?: boolean;
}

/**
 * Componente que exibe estatísticas sobre os lugares visitados
 * Mostra total de cidades, países visitados e lista de países
 */
export default function Statistics({ places, onShareClick, showTitle = true }: StatisticsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [openCountries, setOpenCountries] = useState(false);
  // Calcula estatísticas baseadas nos lugares
  const stats = useMemo(() => {
    const totalCities = places.length;

    // Conta quantas cidades por país
    const countriesById = new Map<string, { count: number; name: string; countryCode?: string }>();
    places.forEach((place) => {
      const countryId = getCountryIdentity(place.country, place.countryCode);
      if (!countryId) return;

      const countryName =
        getLocalizedCountryName({ country: place.country, countryCode: place.countryCode, locale }) ||
        place.country ||
        'Unknown';

      const existing = countriesById.get(countryId);
      if (existing) {
        existing.count += 1;
        return;
      }

      countriesById.set(countryId, {
        count: 1,
        name: countryName,
        countryCode: place.countryCode,
      });
    });

    // Ordena países pelo número de cidades (decrescente)
    const uniqueCountries = Array.from(countriesById.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, data]) => ({
        id,
        name: data.name,
        countryCode: data.countryCode,
        cityCount: data.count,
      }));

    const totalCountries = uniqueCountries.length;

    return {
      totalCities,
      totalCountries,
      uniqueCountries,
    };
  }, [locale, places]);

  if (places.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>{t('statistics.noStatsYet')}</p>
        <p className="text-sm mt-2">{t('statistics.addCitiesForStats')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {(showTitle || onShareClick) && (
        <div className="flex items-center justify-between mb-4">
          {showTitle ? (
            <h3 className="font-semibold text-lg">
              {t('statistics.title')}
            </h3>
          ) : (
            <div />
          )}
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
      )}

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{stats.totalCities}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('statistics.cities')}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-3xl font-bold text-secondary">{stats.totalCountries}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('statistics.countries')}</p>
        </div>
      </div>

      {/* Lista de países visitados */}
      {stats.totalCountries > 0 && (
        <Collapsible.Root open={openCountries} onOpenChange={setOpenCountries}>
          <div className="mb-2">
            <h4 className="font-medium text-muted-foreground">{t('statistics.visitedCountries')}</h4>
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
                const cityCount = country.cityCount;
                return (
                  <div
                    key={country.id}
                    className="flex items-center justify-between p-2"
                  >
                    <span className="text-sm font-medium text-foreground flex items-center gap-2">
                      <span className="text-lg">{getCountryFlagByCode(country.countryCode) || getCountryFlag(country.name)}</span>
                      <span>{country.name}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
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

