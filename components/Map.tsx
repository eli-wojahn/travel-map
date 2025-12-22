'use client';

import { useEffect, useState } from 'react';
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
function MapUpdater({ places }: { places: Place[] }) {
  const map = useMap();

  useEffect(() => {
    if (places.length === 0) return;

    // Se houver apenas um lugar, centraliza nele
    if (places.length === 1) {
      map.setView([places[0].latitude, places[0].longitude], 10);
      return;
    }

    // Se houver múltiplos lugares, ajusta o zoom para mostrar todos
    const bounds = L.latLngBounds(
      places.map((place) => [place.latitude, place.longitude])
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [places, map]);

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
}

/**
 * Componente de mapa interativo usando React-Leaflet
 * 
 * IMPORTANTE: Este componente deve ser renderizado apenas no cliente
 * devido às dependências do Leaflet que não funcionam com SSR
 */
export default function Map({ places, onMapClick }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Garante que o componente só renderize no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Coordenadas padrão (centro do mundo)
  const defaultCenter: [number, number] = [20, 0];
  const defaultZoom = 2;

  // Não renderiza até estar montado no cliente
  if (!isMounted) {
    return (
      <div className="w-full h-[400px] sm:h-[600px] rounded-lg border border-gray-300 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Carregando mapa...</p>
      </div>
    );
  }

  return (
    <div 
      className="w-full rounded-lg overflow-hidden border border-gray-300 h-[400px] sm:h-[600px]" 
      style={{ position: 'relative', width: '100%' }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        minZoom={2}
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

        {/* Atualizador de visualização */}
        <MapUpdater places={places} />

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
                  {new Date(place.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

