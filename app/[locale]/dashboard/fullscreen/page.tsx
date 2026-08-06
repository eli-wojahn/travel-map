'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { usePlaces } from '@/hooks/usePlaces';
import CityInput from '@/components/CityInput';
import CityList from '@/components/CityList';
import Statistics from '@/components/Statistics';
import Modal from '@/components/Modal';
import LoadingPlane from '@/components/LoadingPlane';
import { getCanonicalCountryName, getLocalizedCountryName, normalizeCountryCode } from '@/lib/country';
import { getCountryFlag, getCountryFlagByCode } from '@/lib/countryFlags';
import { Place } from '@/types';

function MapLoading() {
  const t = useTranslations('map');

  return (
    <div className="w-full h-[100dvh] border border-border flex items-center justify-center bg-white">
      <LoadingPlane label={t('loadingMap')} size="lg" />
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

const FULLSCREEN_WELCOME_MODAL_KEY = 'lugares-do-mundo-welcome-modal-seen-v1';

/**
 * Tela dedicada ao mapa em modo full screen.
 */
export default function FullscreenMapPage() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { places, isLoading, addPlace, removePlace, reorderPlaces } = usePlaces();
  const [activePanel, setActivePanel] = useState<'cities' | 'statistics' | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locateUserRequestId, setLocateUserRequestId] = useState(0);
  const [showAnimationModal, setShowAnimationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);
  const [recentlyAddedPlace, setRecentlyAddedPlace] = useState<Place | null>(null);
  const [focusAddedPlaceId, setFocusAddedPlaceId] = useState<string | undefined>(undefined);
  const [isMapComponentReady, setIsMapComponentReady] = useState(false);
  const localizedRecentlyAddedCountry = recentlyAddedPlace
    ? getLocalizedCountryName({
        country: recentlyAddedPlace.country,
        countryCode: recentlyAddedPlace.countryCode,
        locale,
      })
    : undefined;
  const nextLocale = locale === 'pt' ? 'en' : 'pt';
  const localeFlag = locale === 'pt' ? '🇧🇷' : '🇺🇸';

  const openErrorModal = useCallback((message: string) => {
    setModalErrorMessage(message);
    setShowErrorModal(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasSeenWelcomeModal = window.localStorage.getItem(FULLSCREEN_WELCOME_MODAL_KEY);
    if (!hasSeenWelcomeModal) {
      setShowWelcomeModal(true);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    import('@/components/Map')
      .then(() => {
        if (isActive) {
          setIsMapComponentReady(true);
        }
      })
      .catch(() => {
        if (isActive) {
          setIsMapComponentReady(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const closeWelcomeModal = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FULLSCREEN_WELCOME_MODAL_KEY, 'true');
    }
    setShowWelcomeModal(false);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePanel(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
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
        const url = `/api/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&lang=${encodeURIComponent(locale)}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(t('errors.errorFetchingLocation'));
        }

        const data = await response.json();
        const countryCode = normalizeCountryCode(data.address?.country_code);
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
          country: getCanonicalCountryName(data.address?.country, countryCode),
          countryCode,
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
    [addPlace, locale, openErrorModal, places.length, showAddedPlaceFlow, t]
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

  if (isLoading || !isMapComponentReady) {
    return (
      <main className="relative h-[100dvh] w-full bg-background overflow-hidden">
        <div className="w-full h-[100dvh] border border-border flex items-center justify-center bg-white">
          <LoadingPlane label={t('dashboard.loadingPlaces')} size="lg" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-[100dvh] w-full bg-background overflow-hidden">
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

      <div className="absolute bottom-3 right-3 z-40 flex flex-col gap-2 items-end pointer-events-none lg:hidden">
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
            <LoadingPlane
              size="sm"
              hideLabel
              ariaLabel={t('dashboard.locatingUser')}
              className="gap-0"
            />
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

      <div className="absolute top-3 right-3 z-40 hidden lg:flex flex-col gap-2 items-end pointer-events-none">
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
            <LoadingPlane
              size="sm"
              hideLabel
              ariaLabel={t('dashboard.locatingUser')}
              className="gap-0"
            />
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

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-40 -translate-x-1/2">
        <Image
          src="/logo1.png"
          alt={t('dashboard.title')}
          width={180}
          height={59}
          priority
          className="h-auto w-[180px] max-w-[70vw] opacity-95 drop-shadow-md"
        />
      </div>

      <div className="absolute bottom-3 left-3 z-40 pointer-events-none">
        <div className="pointer-events-auto inline-flex flex-col items-start gap-2">
          <button
            onClick={() => setActivePanel((prev) => (prev === 'cities' ? null : 'cities'))}
            aria-label={t('statistics.cities')}
            title={t('statistics.cities')}
            aria-pressed={activePanel === 'cities'}
            className={`h-11 w-11 sm:h-12 sm:w-12 rounded-lg border border-border shadow-md transition-colors flex items-center justify-center ${
              activePanel === 'cities'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-card-foreground hover:bg-muted'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 20V9h5v11" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 20V4h5v16" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h1m0 3h1m6-6h1m0 3h1" />
            </svg>
          </button>
          <button
            onClick={() => setActivePanel((prev) => (prev === 'statistics' ? null : 'statistics'))}
            aria-label={t('statistics.title')}
            title={t('statistics.title')}
            aria-pressed={activePanel === 'statistics'}
            className={`h-11 w-11 sm:h-12 sm:w-12 rounded-lg border border-border shadow-md transition-colors flex items-center justify-center ${
              activePanel === 'statistics'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-card-foreground hover:bg-muted'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 20v-6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20v-10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-14" />
            </svg>
          </button>
        </div>
      </div>

      <div
        onClick={() => setActivePanel(null)}
        className={`fixed inset-0 z-[1050] bg-black/55 backdrop-blur-[1px] transition-opacity duration-300 ${
          activePanel ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        className={`fixed inset-0 z-[1060] flex items-center justify-center p-3 md:p-6 transition-all duration-300 ${
          activePanel ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className={`w-full max-w-[560px] max-h-[75dvh] rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300 md:max-h-[calc(100dvh-7.5rem)] ${
            activePanel ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-base sm:text-lg font-semibold">
              {activePanel === 'statistics' ? t('statistics.title') : t('cities.visitedCities')}
            </h2>
            <button
              onClick={() => setActivePanel(null)}
              className="h-9 w-9 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              aria-label={t('common.close')}
              title={t('common.close')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="h-[calc(75dvh-4.25rem)] overflow-auto p-4 md:h-[calc(100%-4.25rem)]">
            {activePanel === 'statistics' ? (
              <Statistics places={places} />
            ) : (
              <CityList places={places} onRemovePlace={removePlace} onReorderPlaces={reorderPlaces} />
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-3 left-16 right-3 z-[1000] pointer-events-none lg:hidden">
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

      <div className="absolute top-3 left-3 right-20 z-[1000] pointer-events-none hidden lg:block">
        <div className="mx-auto max-w-2xl rounded-xl px-2.5 py-2 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-none">
            <div className="flex-1 pointer-events-auto">
              <CityInput
                onAddPlace={handleAddPlaceFromInput}
                onError={openErrorModal}
                compact
              />
            </div>
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="pointer-events-auto px-3 sm:px-4 py-2 text-xs sm:text-sm bg-primary text-primary-foreground rounded-lg shadow-md hover:opacity-90 transition-opacity font-medium whitespace-nowrap"
            >
              Dashboard
            </button>
          </div>
          {feedback && (
            <p className="pointer-events-none mt-2 text-xs sm:text-sm text-primary font-medium">{feedback}</p>
          )}
        </div>
      </div>

      <Modal
        isOpen={showWelcomeModal}
        title={t('modal.projectSummaryTitle')}
        videoSrc="/roma.mp4"
        videoClassName="w-full h-64 sm:h-80 md:h-[26rem] max-h-[52vh] object-contain rounded-lg border border-border bg-black/5"
        contentClassName="max-w-3xl sm:max-w-4xl max-h-[95vh]"
        message={
          <div className="space-y-3 text-left">
            <p>{t('modal.projectSummaryDescription')}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('modal.projectSummaryItem1')}</li>
              <li>{t('modal.projectSummaryItem2')}</li>
              <li>{t('modal.projectSummaryItem3')}</li>
            </ul>
            <p>{t('modal.projectSummaryFooter')}</p>
          </div>
        }
        confirmText={t('common.understood')}
        cancelText=""
        type="info"
        onConfirm={closeWelcomeModal}
        onCancel={closeWelcomeModal}
      />

      <Modal
        isOpen={showAnimationModal}
        title=""
        message={
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-card-foreground mb-4 text-center">
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
                  {(recentlyAddedPlace.country || recentlyAddedPlace.countryCode) && (
                    <span>{getCountryFlagByCode(recentlyAddedPlace.countryCode) || getCountryFlag(localizedRecentlyAddedCountry)}</span>
                  )}
                  <span>
                    {[recentlyAddedPlace.state, localizedRecentlyAddedCountry].filter(Boolean).join(', ')}
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
