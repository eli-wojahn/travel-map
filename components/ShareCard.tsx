'use client';

import { Place } from '@/types';
import { getCountryFlag } from '@/lib/countryFlags';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

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

  return (
    <div 
      className={`${containerClass} bg-gradient-to-br from-orange-50 via-white to-blue-50 relative`}
      style={{ 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateRows: `${heightConfig.header}px ${heightConfig.map}px ${heightConfig.stats}px ${heightConfig.footer}px`,
      }}
    >
      {/* Padrão de fundo decorativo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-16 flex flex-col justify-center">
        <div className="flex items-center gap-4 mb-1">
          <span className={format === 'square' ? 'text-6xl' : 'text-7xl'} style={{ flexShrink: 0 }}>🌍</span>
          <h1 className={format === 'square' ? 'text-5xl font-bold text-gray-800 leading-tight' : 'text-6xl font-bold text-gray-800 leading-tight'}>
            {t('cardTitle')}
          </h1>
        </div>
        <p className={format === 'square' ? 'text-2xl text-gray-600 ml-20' : 'text-3xl text-gray-600 ml-24'}>
          {t('cardSubtitle')}
        </p>
      </div>

      {/* Mapa simplificado com pins */}
      <div className="relative z-10 mx-16 my-4 bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-100" style={{ height: '100%' }}>
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
                    fill="#E8F4F8"
                    stroke="#B8D4E0"
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
                  <circle r={5} fill="#EF4444" stroke="#FFFFFF" strokeWidth={2} />
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
        <div className="bg-white rounded-3xl shadow-2xl border-4 border-gray-100 w-full" style={{ padding: format === 'square' ? '32px' : '48px' }}>
          <div className="flex items-start justify-between gap-8">
            {/* Cidades */}
            <div className="text-center flex-shrink-0">
              <div className={format === 'square' ? 'text-6xl font-bold text-blue-600' : 'text-7xl font-bold text-blue-600'}>
                {stats.totalCities}
              </div>
              <div className={format === 'square' ? 'text-xl text-gray-600 font-medium mt-2' : 'text-2xl text-gray-600 font-medium mt-3'}>
                {stats.totalCities === 1 ? t('city') : t('cities')}
              </div>
            </div>

            {/* Divisor */}
            <div className={format === 'square' ? 'w-px h-20 bg-gray-200 flex-shrink-0' : 'w-px h-24 bg-gray-200 flex-shrink-0'} />

            {/* Países */}
            <div className="text-center flex-shrink-0">
              <div className={format === 'square' ? 'text-6xl font-bold text-green-600' : 'text-7xl font-bold text-green-600'}>
                {stats.totalCountries}
              </div>
              <div className={format === 'square' ? 'text-xl text-gray-600 font-medium mt-2' : 'text-2xl text-gray-600 font-medium mt-3'}>
                {stats.totalCountries === 1 ? t('country') : t('countries')}
              </div>
            </div>

            {/* Divisor */}
            <div className={format === 'square' ? 'w-px h-20 bg-gray-200 flex-shrink-0' : 'w-px h-24 bg-gray-200 flex-shrink-0'} />

            {/* Top 3 países */}
            <div className="flex-1">
              <div className={format === 'square' ? 'text-base text-gray-500 font-medium mb-2' : 'text-xl text-gray-500 font-medium mb-3'}>
                {t('mostVisitedCountries')}
              </div>
              <div className={format === 'square' ? 'space-y-1' : 'space-y-2'}>
                {stats.topCountries.slice(0, 3).map((country) => (
                  <div key={country} className="flex items-center gap-2">
                    <span className={format === 'square' ? 'text-2xl' : 'text-3xl'}>{getCountryFlag(country)}</span>
                    <div className="flex-1 min-w-0">
                      <span className={format === 'square' ? 'text-sm font-medium text-gray-700' : 'text-lg font-medium text-gray-700'}>
                        {country}
                      </span>
                      <span className={format === 'square' ? 'text-xs text-gray-500 ml-2' : 'text-base text-gray-500 ml-2'}>
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
        <p className={format === 'square' ? 'text-xl text-gray-500 font-medium' : 'text-2xl text-gray-500 font-medium'}>
          {t('cardFooter', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}
