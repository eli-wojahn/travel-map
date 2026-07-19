'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { usePlaces } from '@/hooks/usePlaces';
import CityInput from '@/components/CityInput';
import Modal from '@/components/Modal';
import { getCountryFlag } from '@/lib/countryFlags';
import { Place } from '@/types';

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

const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((mod) => mod.DotLottieReact),
  { ssr: false }
);

/**
 * Tela dedicada ao mapa em modo full screen.
 */
export default function FullscreenMapPage() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { places, isLoading, addPlace, removePlace } = usePlaces();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locateUserRequestId, setLocateUserRequestId] = useState(0);
  const [showAnimationModal, setShowAnimationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);
  const [recentlyAddedPlace, setRecentlyAddedPlace] = useState<Place | null>(null);
  const [focusAddedPlaceId, setFocusAddedPlaceId] = useState<string | undefined>(undefined);
  const nextLocale = locale === 'pt' ? 'en' : 'pt';
  const localeFlag = locale === 'pt' ? '🇧🇷' : '🇺🇸';

  const openErrorModal = useCallback((message: string) => {
    setModalErrorMessage(message);
    setShowErrorModal(true);
  }, []);

  const showAddedPlaceFlow = useCallback(
    (addedPlace: Place, isFirstPlace: boolean) => {
      setRecentlyAddedPlace(addedPlace);
      setFocusAddedPlaceId(addedPlace.id);
      const isCoordinate = addedPlace.name.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/);

      if (isFirstPlace && !isCoordinate) {
        setShowAnimationModal(true);
        return;
      }

      setShowConfirmModal(true);
    },
    []
  );

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      try {
        const isFirstPlace = places.length === 0;
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
          openErrorModal(t('cities.cityAlreadyAdded'));
          return;
        }

        showAddedPlaceFlow(addedPlace, isFirstPlace);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('errors.errorAddingPlace');
        openErrorModal(errorMessage);
      }
    },
    [addPlace, openErrorModal, places.length, showAddedPlaceFlow, t]
  );

  const handleAddPlaceFromInput = useCallback(
    async (place: { name: string; state?: string; country?: string; latitude: number; longitude: number }) => {
      const isFirstPlace = places.length === 0;
      const addedPlace = await addPlace(place);

      if (!addedPlace) {
        openErrorModal(t('cities.cityAlreadyAdded'));
        return false;
      }

      showAddedPlaceFlow(addedPlace, isFirstPlace);
      return true;
    },
    [addPlace, openErrorModal, places.length, showAddedPlaceFlow, t]
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
          initialCenter={[50, 10]}
          initialZoom={5}
          focusMode="majority-continent"
          focusAddedPlaceId={focusAddedPlaceId}
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

      <div className="absolute bottom-3 left-3 z-[1100] flex flex-col gap-2 items-start pointer-events-none">
        <button
          onClick={() => router.push(`/${locale}/dashboard`)}
          aria-label="Dashboard"
          className="pointer-events-auto h-11 w-11 sm:h-12 sm:w-12 bg-primary text-primary-foreground rounded-lg border border-border shadow-md hover:opacity-90 transition-opacity flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 9.75V21h13.5V9.75" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 21v-6h4.5v6" />
          </svg>
        </button>

        <button
          onClick={() => {
            setFeedback(t('dashboard.locatingUser'));
            setIsLocatingUser(true);
            setLocateUserRequestId((prev) => prev + 1);
          }}
          disabled={isLoading || isLocatingUser}
          aria-label={t('dashboard.goToMyLocation')}
          className="pointer-events-auto h-11 w-11 sm:h-12 sm:w-12 bg-card text-card-foreground rounded-lg border border-border shadow-md hover:bg-muted transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
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
          className="pointer-events-auto h-11 min-w-11 px-2 sm:h-12 sm:min-w-12 sm:px-2.5 bg-card rounded-lg border border-border shadow-md hover:bg-muted transition-colors flex items-center justify-center"
        >
          <span className="text-xl leading-none">{localeFlag}</span>
        </button>
      </div>

      <div className="absolute top-3 left-16 right-3 sm:left-3 z-[1000] pointer-events-none">
        <div className="mx-auto max-w-4xl rounded-xl px-2 py-2 pointer-events-none">
          <div className="flex items-start gap-2 pointer-events-none">
            <div className="flex-1 min-w-0 pointer-events-none">
              <div className="flex-1 pointer-events-auto">
              <CityInput
                onAddPlace={handleAddPlaceFromInput}
                onError={openErrorModal}
                compact
                compactAddAsIcon
              />
              </div>
            </div>
          </div>
          {feedback && (
            <p className="pointer-events-none mt-2 text-xs sm:text-sm text-primary font-medium">{feedback}</p>
          )}
        </div>
      </div>

      <Modal
        isOpen={showAnimationModal}
        title=""
        message={
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              {t('modal.congratulations')}
            </h2>
            <div className="w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
              <DotLottieReact
                src="/celebration-animation.json"
                autoplay={true}
                loop={false}
                speed={0.7}
              />
            </div>
          </div>
        }
        confirmText={t('common.ok')}
        cancelText=""
        type="success"
        onConfirm={() => {
          setShowAnimationModal(false);
          setShowConfirmModal(true);
        }}
        onCancel={() => {}}
      />

      {recentlyAddedPlace && (
        <Modal
          isOpen={showConfirmModal}
          title={t('cities.cityAdded')}
          videoSrc="/city-added.mp4"
          message={
            <div className="space-y-2">
              {recentlyAddedPlace.name.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/) && (
                <p className="text-yellow-600 font-medium text-sm mb-2">
                  {t('map.notACity')}
                </p>
              )}
              <p className="font-semibold text-lg">{recentlyAddedPlace.name}</p>
              {(recentlyAddedPlace.state || recentlyAddedPlace.country) && (
                <p className="text-muted-foreground flex items-center gap-1 justify-center">
                  {recentlyAddedPlace.country && (
                    <span>{getCountryFlag(recentlyAddedPlace.country)}</span>
                  )}
                  <span>
                    {[recentlyAddedPlace.state, recentlyAddedPlace.country].filter(Boolean).join(', ')}
                  </span>
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {t('cities.addedOn')}{' '}
                {new Date(recentlyAddedPlace.createdAt).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </p>
            </div>
          }
          confirmText={t('common.ok')}
          cancelText={t('common.remove')}
          type="info"
          onConfirm={() => {
            setShowConfirmModal(false);
            setRecentlyAddedPlace(null);
          }}
          onCancel={() => {
            if (recentlyAddedPlace) {
              removePlace(recentlyAddedPlace.id);
            }
            setShowConfirmModal(false);
            setRecentlyAddedPlace(null);
          }}
        />
      )}

      <Modal
        isOpen={showErrorModal}
        title={t('auth.errorTitle')}
        message={modalErrorMessage || t('errors.errorAddingPlace')}
        confirmText={t('common.ok')}
        cancelText=""
        type="warning"
        onConfirm={() => {
          setShowErrorModal(false);
          setModalErrorMessage(null);
        }}
        onCancel={() => {
          setShowErrorModal(false);
          setModalErrorMessage(null);
        }}
      />
    </main>
  );
}
