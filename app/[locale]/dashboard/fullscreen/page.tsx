'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { usePlaces } from '@/hooks/usePlaces';
import CityInput from '@/components/CityInput';

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
  const pathname = usePathname();
  const router = useRouter();
  const { places, isLoading, addPlace } = usePlaces();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locateUserRequestId, setLocateUserRequestId] = useState(0);
  const nextLocale = locale === 'pt' ? 'en' : 'pt';
  const localeFlag = locale === 'pt' ? '🇧🇷' : '🇺🇸';

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

  const handleAddPlaceFromInput = useCallback(
    async (place: { name: string; state?: string; country?: string; latitude: number; longitude: number }) => {
      const addedPlace = await addPlace(place);

      if (!addedPlace) {
        setFeedback(t('cities.cityAlreadyAdded'));
        return false;
      }

      setFeedback(t('cities.cityAdded'));
      setTimeout(() => setFeedback(null), 2500);
      return true;
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
        <Map
          places={places}
          onMapClick={handleMapClick}
          fullscreen
          locateUserRequestId={locateUserRequestId}
          onLocateUserResult={(result) => {
            setIsLocatingUser(false);

            if (result.ok) {
              setFeedback(t('dashboard.locationCentered'));
              setTimeout(() => setFeedback(null), 2500);
              return;
            }

            if (result.error === 'UNSUPPORTED') {
              setFeedback(t('dashboard.locationUnsupported'));
              return;
            }

            if (result.error === 'PERMISSION_DENIED') {
              setFeedback(t('dashboard.locationPermissionDenied'));
              return;
            }

            if (result.error === 'POSITION_UNAVAILABLE') {
              setFeedback(t('dashboard.locationUnavailable'));
              return;
            }

            if (result.error === 'TIMEOUT') {
              setFeedback(t('dashboard.locationTimeout'));
              return;
            }

            setFeedback(t('errors.errorFetchingLocation'));
          }}
        />
      )}

      <div className="absolute top-3 right-3 z-[1100] flex flex-col gap-2 items-end">
        <button
          onClick={() => {
            setFeedback(t('dashboard.locatingUser'));
            setIsLocatingUser(true);
            setLocateUserRequestId((prev) => prev + 1);
          }}
          disabled={isLoading || isLocatingUser}
          aria-label={t('dashboard.goToMyLocation')}
          className="h-11 w-11 sm:h-12 sm:w-12 bg-card text-card-foreground rounded-lg border border-border shadow-md hover:bg-muted transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLocatingUser ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
        </button>

        <button
          onClick={() => {
            const segments = pathname.split('/');
            segments[1] = nextLocale;
            router.replace(segments.join('/'));
          }}
          aria-label={t('dashboard.changeLanguage')}
          className="h-11 min-w-11 px-2 sm:h-12 sm:min-w-12 sm:px-2.5 bg-card rounded-lg border border-border shadow-md hover:bg-muted transition-colors flex items-center justify-center"
        >
          <span className="text-xl leading-none">{localeFlag}</span>
        </button>
      </div>

      <div className="absolute top-3 left-3 right-16 sm:right-20 z-[1000]">
        <div className="mx-auto max-w-3xl rounded-xl px-2.5 py-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <CityInput
                onAddPlace={handleAddPlaceFromInput}
                onError={setFeedback}
                compact
              />
            </div>
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium whitespace-nowrap"
            >
              Dashboard
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
