'use client';

import { Place } from '@/types';
import { getCountryFlag } from '@/lib/countryFlags';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { useTheme } from '@/lib/theme';

const GEO_URL = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';

interface ShareCardProps {
  places: Place[];
  format?: 'square' | 'portrait'; // 1:1 Instagram/WhatsApp ou 9:16 Stories
}

/**
 * Componente para gerar card de compartilhamento em redes sociais
 * Layout otimizado com mapa simplificado e estatísticas
 */
export default function ShareCard({ places, format = 'square' }: ShareCardProps) {
  const t = useTranslations('share');
  const { resolvedTheme } = useTheme();
  // Calcula estatísticas
  const stats = useMemo(() => {
    const totalCities = places.length;
    
    const countriesSet = new Set<string>();
    places.forEach((place) => {
      if (place.country) {
        countriesSet.add(place.country);
      }
    });
    
    const citiesByCountry = new Map<string, number>();
    places.forEach((place) => {
      if (place.country) {
        const count = citiesByCountry.get(place.country) || 0;
        citiesByCountry.set(place.country, count + 1);
      }
    });
    
    const uniqueCountries = Array.from(citiesByCountry.keys())
      .sort((a, b) => (citiesByCountry.get(b) || 0) - (citiesByCountry.get(a) || 0));
    
    const totalCountries = uniqueCountries.length;
    const topCountries = uniqueCountries.slice(0, 3);
    
    return {
      totalCities,
      totalCountries,
      topCountries,
      citiesByCountry,
    };
  }, [places]);

  const containerClass = format === 'square' 
    ? 'w-[1080px] h-[1080px]' 
    : 'w-[1080px] h-[1920px]';

  const heightConfig = format === 'square' 
    ? { header: 160, map: 640, stats: 200, footer: 80 }
    : { header: 240, map: 1100, stats: 460, footer: 120 };

  const palette = resolvedTheme === 'dark'
    ? {
        containerGradient: 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-900',
        containerPrimaryText: 'text-zinc-100',
        containerSecondaryText: 'text-zinc-300',
        blurA: 'bg-orange',
        blurB: 'bg-blue-500',
        cardSurface: 'bg-zinc-900',
        cardBorder: 'border-zinc-700',
        mapCountryFill: '#1f2937',
        mapCountryStroke: '#374151',
        mapPinStroke: '#111827',
        statLabel: 'text-zinc-300',
        divider: 'bg-zinc-700',
        countryText: 'text-zinc-100',
        countText: 'text-zinc-400',
      }
    : {
        containerGradient: 'bg-gradient-to-br from-orange-50 via-white to-blue-50',
        containerPrimaryText: 'text-gray-800',
        containerSecondaryText: 'text-gray-600',
        blurA: 'bg-orange',
        blurB: 'bg-blue-500',
        cardSurface: 'bg-white',
        cardBorder: 'border-gray-100',
        mapCountryFill: '#E8F4F8',
        mapCountryStroke: '#B8D4E0',
        mapPinStroke: '#FFFFFF',
        statLabel: 'text-gray-600',
        divider: 'bg-gray-200',
        countryText: 'text-gray-700',
        countText: 'text-gray-500',
      };

  return (
    <div 
      className={`${containerClass} ${palette.containerGradient} relative`}
      style={{ 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateRows: `${heightConfig.header}px ${heightConfig.map}px ${heightConfig.stats}px ${heightConfig.footer}px`,
      }}
    >
      {/* Padrão de fundo decorativo */}
      <div className="absolute inset-0 opacity-5">
        <div className={`absolute top-0 left-0 w-96 h-96 ${palette.blurA} rounded-full blur-3xl`} />
        <div className={`absolute bottom-0 right-0 w-96 h-96 ${palette.blurB} rounded-full blur-3xl`} />
      </div>

      {/* Header */}
      <div className="relative z-10 px-16 flex flex-col justify-center">
        <div className="flex items-center gap-4 mb-1">
          <span className={format === 'square' ? 'text-6xl' : 'text-7xl'} style={{ flexShrink: 0 }}>🌍</span>
          <h1 className={format === 'square' ? `text-5xl font-bold leading-tight ${palette.containerPrimaryText}` : `text-6xl font-bold leading-tight ${palette.containerPrimaryText}`}>
            {t('cardTitle')}
          </h1>
        </div>
        <p className={format === 'square' ? `text-2xl ml-20 ${palette.containerSecondaryText}` : `text-3xl ml-24 ${palette.containerSecondaryText}`}>
          {t('cardSubtitle')}
        </p>
      </div>

      {/* Mapa simplificado com pins */}
      <div className={`relative z-10 mx-16 my-4 ${palette.cardSurface} rounded-3xl shadow-2xl overflow-hidden border-4 ${palette.cardBorder}`} style={{ height: '100%' }}>
        <div className="absolute inset-0">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 147,
            }}
            style={{
              width: '100%',
              height: '100%',
            }}
          >
            {/* Países */}
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={palette.mapCountryFill}
                    stroke={palette.mapCountryStroke}
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>
            
            {/* Pins dos lugares */}
            {places.map((place) => (
              <Marker
                key={place.id}
                coordinates={[place.longitude, place.latitude]}
              >
                {/* Pin customizado */}
                <g>
                  {/* Sombra */}
                  <circle r={6} fill="rgba(0, 0, 0, 0.2)" cy={2} />
                  {/* Pin principal */}
                  <circle r={5} fill="#EF4444" stroke={palette.mapPinStroke} strokeWidth={2} />
                  {/* Brilho */}
                  <circle r={2} fill="rgba(255, 255, 255, 0.5)" cx={-1.5} cy={-1.5} />
                </g>
              </Marker>
            ))}
          </ComposableMap>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="relative z-10 px-16 flex items-center">
        <div className={`${palette.cardSurface} rounded-3xl shadow-2xl border-4 ${palette.cardBorder} w-full`} style={{ padding: format === 'square' ? '32px' : '48px' }}>
          <div className="flex items-start justify-between gap-8">
            {/* Cidades */}
            <div className="text-center flex-shrink-0">
              <div className={format === 'square' ? 'text-6xl font-bold text-blue-600' : 'text-7xl font-bold text-blue-600'}>
                {stats.totalCities}
              </div>
              <div className={format === 'square' ? `text-xl font-medium mt-2 ${palette.statLabel}` : `text-2xl font-medium mt-3 ${palette.statLabel}`}>
                {stats.totalCities === 1 ? t('city') : t('cities')}
              </div>
            </div>

            {/* Divisor */}
            <div className={format === 'square' ? `w-px h-20 ${palette.divider} flex-shrink-0` : `w-px h-24 ${palette.divider} flex-shrink-0`} />

            {/* Países */}
            <div className="text-center flex-shrink-0">
              <div className={format === 'square' ? 'text-6xl font-bold text-green-600' : 'text-7xl font-bold text-green-600'}>
                {stats.totalCountries}
              </div>
              <div className={format === 'square' ? `text-xl font-medium mt-2 ${palette.statLabel}` : `text-2xl font-medium mt-3 ${palette.statLabel}`}>
                {stats.totalCountries === 1 ? t('country') : t('countries')}
              </div>
            </div>

            {/* Divisor */}
            <div className={format === 'square' ? `w-px h-20 ${palette.divider} flex-shrink-0` : `w-px h-24 ${palette.divider} flex-shrink-0`} />

            {/* Top 3 países */}
            <div className="flex-1">
              <div className={format === 'square' ? `text-base font-medium mb-2 ${palette.countText}` : `text-xl font-medium mb-3 ${palette.countText}`}>
                {t('mostVisitedCountries')}
              </div>
              <div className={format === 'square' ? 'space-y-1' : 'space-y-2'}>
                {stats.topCountries.slice(0, 3).map((country) => (
                  <div key={country} className="flex items-center gap-2">
                    <span className={format === 'square' ? 'text-2xl' : 'text-3xl'}>{getCountryFlag(country)}</span>
                    <div className="flex-1 min-w-0">
                      <span className={format === 'square' ? `text-sm font-medium ${palette.countryText}` : `text-lg font-medium ${palette.countryText}`}>
                        {country}
                      </span>
                      <span className={format === 'square' ? `text-xs ml-2 ${palette.countText}` : `text-base ml-2 ${palette.countText}`}>
                        ({stats.citiesByCountry.get(country)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center flex items-center justify-center">
        <p className={format === 'square' ? `text-xl font-medium ${palette.countText}` : `text-2xl font-medium ${palette.countText}`}>
          {t('cardFooter', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}
