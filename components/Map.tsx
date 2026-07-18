'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Place } from '@/types';
import { getCountryFlag } from '@/lib/countryFlags';
import 'leaflet/dist/leaflet.css';

// Fix para ícones padrão do Leaflet no Next.js
// Configura os ícones usando CDN para evitar problemas de caminho
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}


/**
 * Componente interno para ajustar a visualização do mapa quando os lugares mudam
 */
function getContinentFromCoordinates(
  lat: number,
  lng: number
): 'Europe' | 'Americas' | 'Asia' | 'Africa' | 'Oceania' | 'Other' {
  // Europe (aproximação por bounding box)
  if (lat >= 35 && lat <= 72 && lng >= -25 && lng <= 45) return 'Europe';

  // Asia
  if (lat >= -10 && lat <= 80 && lng >= 45 && lng <= 180) return 'Asia';

  // Africa
  if (lat >= -35 && lat <= 38 && lng >= -20 && lng <= 55) return 'Africa';

  // Oceania
  if (lat >= -50 && lat <= 10 && lng >= 110 && lng <= 180) return 'Oceania';

  // Americas (Norte + Central + Sul)
  if (lat >= -60 && lat <= 85 && lng >= -170 && lng <= -25) return 'Americas';

  return 'Other';
}

function normalizeCountry(country?: string): string | null {
  if (!country) return null;
  const normalized = country.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function MapUpdater({
  places,
  focusMode = 'fit-all',
  focusAddedPlaceId,
}: {
  places: Place[];
  focusMode?: 'fit-all' | 'majority-continent';
  focusAddedPlaceId?: string;
}) {
  const map = useMap();
  const hasAppliedSmartFocusRef = useRef(false);
  const lastFocusedAddedPlaceIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (places.length === 0) return;

    if (focusAddedPlaceId && lastFocusedAddedPlaceIdRef.current !== focusAddedPlaceId) {
      const addedPlace = places.find((place) => place.id === focusAddedPlaceId);

      if (addedPlace) {
        lastFocusedAddedPlaceIdRef.current = focusAddedPlaceId;
        const nextZoom = Math.min(map.getZoom() + 1, 10);

        map.flyTo([addedPlace.latitude, addedPlace.longitude], nextZoom, {
          animate: true,
          duration: 0.9,
        });
        return;
      }
    }

    if (focusMode === 'majority-continent') {
      if (hasAppliedSmartFocusRef.current) {
        return;
      }

      const groupedByRegion = new globalThis.Map<string, Place[]>();

      places.forEach((place) => {
        const countryKey = normalizeCountry(place.country);
        const regionKey = countryKey ?? `continent:${getContinentFromCoordinates(place.latitude, place.longitude)}`;
        const current = groupedByRegion.get(regionKey) ?? [];
        current.push(place);
        groupedByRegion.set(regionKey, current);
      });

      // Começa pela cidade mais recente (places[0]) e só troca se encontrar grupo maior.
      const firstCountryKey = normalizeCountry(places[0].country);
      let dominantRegion = firstCountryKey ?? `continent:${getContinentFromCoordinates(places[0].latitude, places[0].longitude)}`;
      let dominantCount = groupedByRegion.get(dominantRegion)?.length ?? 0;

      groupedByRegion.forEach((list, regionKey) => {
        if (list.length > dominantCount) {
          dominantRegion = regionKey;
          dominantCount = list.length;
        }
      });

      const dominantPlaces = groupedByRegion.get(dominantRegion) ?? [];
      if (dominantPlaces.length > 0) {
        hasAppliedSmartFocusRef.current = true;
        const avgLat =
          dominantPlaces.reduce((sum, place) => sum + place.latitude, 0) / dominantPlaces.length;
        const avgLng =
          dominantPlaces.reduce((sum, place) => sum + place.longitude, 0) / dominantPlaces.length;

        // Recentraliza sem alterar o zoom atual (evita zoom out automático).
        map.flyTo([avgLat, avgLng], map.getZoom(), {
          animate: true,
          duration: 1,
        });
        return;
      }

      hasAppliedSmartFocusRef.current = true;
    }

    // Se houver apenas um lugar, centraliza nele
    if (places.length === 1) {
      map.setView([places[0].latitude, places[0].longitude], 10);
      return;
    }

    // Fallback: ajusta o zoom para mostrar todos
    const bounds = L.latLngBounds(
      places.map((place) => [place.latitude, place.longitude])
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [focusAddedPlaceId, focusMode, places, map]);

  return null;
}

/**
 * Componente interno para capturar cliques no mapa
 */
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
}

interface MapProps {
  places: Place[];
  onMapClick?: (lat: number, lng: number) => void;
  fullscreen?: boolean;
  initialCenter?: [number, number];
  initialZoom?: number;
  focusMode?: 'fit-all' | 'majority-continent';
  focusAddedPlaceId?: string;
  locateUserRequestId?: number;
  onLocateUserResult?: (result: {
    ok: boolean;
    error?: 'UNSUPPORTED' | 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  }) => void;
}

function UserLocationHandler({
  locateUserRequestId,
  onLocateUserResult,
}: {
  locateUserRequestId?: number;
  onLocateUserResult?: (result: {
    ok: boolean;
    error?: 'UNSUPPORTED' | 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  }) => void;
}) {
  const map = useMap();
  const lastProcessedRequestRef = useRef<number>(0);

  useEffect(() => {
    if (!locateUserRequestId || locateUserRequestId <= 0) {
      return;
    }

    if (lastProcessedRequestRef.current === locateUserRequestId) {
      return;
    }

    lastProcessedRequestRef.current = locateUserRequestId;

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onLocateUserResult?.({ ok: false, error: 'UNSUPPORTED' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        map.flyTo([lat, lng], 13, {
          animate: true,
          duration: 1.2,
        });

        onLocateUserResult?.({ ok: true });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          onLocateUserResult?.({ ok: false, error: 'PERMISSION_DENIED' });
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          onLocateUserResult?.({ ok: false, error: 'POSITION_UNAVAILABLE' });
          return;
        }

        if (error.code === error.TIMEOUT) {
          onLocateUserResult?.({ ok: false, error: 'TIMEOUT' });
          return;
        }

        onLocateUserResult?.({ ok: false, error: 'UNKNOWN' });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [locateUserRequestId, map, onLocateUserResult]);

  return null;
}

/**
 * Componente de mapa interativo usando React-Leaflet
 * 
 * IMPORTANTE: Este componente deve ser renderizado apenas no cliente
 * devido às dependências do Leaflet que não funcionam com SSR
 */
export default function Map({
  places,
  onMapClick,
  fullscreen = false,
  initialCenter,
  initialZoom,
  focusMode = 'fit-all',
  focusAddedPlaceId,
  locateUserRequestId,
  onLocateUserResult,
}: MapProps) {
  const t = useTranslations('map');
  const locale = useLocale();
  const [isMounted, setIsMounted] = useState(false);

  // Garante que o componente só renderize no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Coordenadas padrão (centro do mundo)
  const minZoom = 2;
  const defaultCenter: [number, number] = initialCenter ?? [20, 0];
  const defaultZoom = initialZoom ?? minZoom;
  const wrapperClassName = fullscreen
    ? 'w-full h-[100dvh]'
    : 'w-full rounded-lg overflow-hidden border border-gray-300 h-[400px] sm:h-[600px]';
  const loadingClassName = fullscreen
    ? 'w-full h-[100dvh] border border-gray-300 flex items-center justify-center bg-gray-100'
    : 'w-full h-[400px] sm:h-[600px] rounded-lg border border-gray-300 flex items-center justify-center bg-gray-100';

  // Não renderiza até estar montado no cliente
  if (!isMounted) {
    return (
      <div className={loadingClassName}>
        <p className="text-gray-500">{t('loadingMap')}</p>
      </div>
    );
  }

  return (
    <div 
      className={wrapperClassName}
      style={{ position: 'relative', width: '100%' }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        minZoom={minZoom}
        worldCopyJump={true}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        {/* Camada de tiles do OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Handler de cliques no mapa */}
        <MapClickHandler onMapClick={onMapClick} />

        {/* Handler para centralizar na localização atual do usuário */}
        <UserLocationHandler
          locateUserRequestId={locateUserRequestId}
          onLocateUserResult={onLocateUserResult}
        />

        {/* Atualizador de visualização */}
        <MapUpdater
          places={places}
          focusMode={focusMode}
          focusAddedPlaceId={focusAddedPlaceId}
        />

        {/* Marcadores para cada lugar */}
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">
                  {place.name}
                  {place.state && (
                    <span className="text-gray-500 font-normal">
                      {`, ${place.state}`}
                    </span>
                  )}
                </p>
                {(place.country || place.state) && (
                  <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    {place.country && (
                      <span>{getCountryFlag(place.country)}</span>
                    )}
                    <span>
                      {[place.state, place.country].filter(Boolean).join(', ')}
                    </span>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(place.createdAt).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US')}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

