'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { usePlaces } from '@/hooks/usePlaces';

function MapLoading() {
  const t = useTranslations('map');

  return (
    <div className="w-full h-[100dvh] border border-border flex items-center justify-center bg-muted">
      <p className="text-muted-foreground">{t('loadingMap')}</p>
    </div>
  );
}

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <MapLoading />,
});

/**
 * Tela dedicada ao mapa em modo full screen.
 */
export default function FullscreenMapPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { places, isLoading, addPlace } = usePlaces();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      try {
        const url = `/api/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(t('errors.errorFetchingLocation'));
        }

        const data = await response.json();
        const name =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.municipality ||
          `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        const addedPlace = await addPlace({
          name,
          state:
            data.address?.state ||
            data.address?.state_district ||
            data.address?.region ||
            undefined,
          country: data.address?.country || undefined,
          latitude: lat,
          longitude: lng,
        });

        if (!addedPlace) {
          setFeedback(t('cities.cityAlreadyAdded'));
          return;
        }

        setFeedback(t('cities.cityAdded'));
        setTimeout(() => setFeedback(null), 2500);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('errors.errorAddingPlace');
        setFeedback(errorMessage);
      }
    },
    [addPlace, t]
  );

  return (
    <main className="relative h-[100dvh] w-full bg-background overflow-hidden">
      {isLoading ? (
        <div className="w-full h-[100dvh] border border-border flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">{t('dashboard.loadingPlaces')}</p>
        </div>
      ) : (
        <Map places={places} onMapClick={handleMapClick} fullscreen />
      )}

      <div className="absolute top-3 left-3 right-3 z-[1000]">
        <div className="mx-auto max-w-4xl rounded-xl border border-border/80 bg-background/90 backdrop-blur px-3 py-2 shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm sm:text-base font-semibold text-foreground">
                {t('dashboard.fullscreenHint')}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {places.length} {t('statistics.cities')}
              </p>
            </div>
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              {t('dashboard.backToDashboard')}
            </button>
          </div>
          {feedback && (
            <p className="mt-2 text-xs sm:text-sm text-primary font-medium">{feedback}</p>
          )}
        </div>
      </div>
    </main>
  );
}
