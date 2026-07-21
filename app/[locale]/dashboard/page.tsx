'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase-browser';
import { usePlaces } from '@/hooks/usePlaces';
import { loadPlaces } from '@/lib/storage';
import CityInput from '@/components/CityInput';
import CityList from '@/components/CityList';
import Statistics from '@/components/Statistics';
import WorldMapSimple from '@/components/WorldMapSimple';
import Modal from '@/components/Modal';
import ShareModal from '@/components/ShareModal';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { getCountryFlag } from '@/lib/countryFlags';
import { Place } from '@/types';

function MapLoading() {
  const t = useTranslations('map');

  return (
    <div className="w-full h-full min-h-[600px] rounded-lg border border-border flex items-center justify-center bg-muted">
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
 * Dashboard - Página principal após login
 */
export default function DashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const { places, isLoading, isGuestMode, addPlace, removePlace, clearPlaces, reorderPlaces } = usePlaces();
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAnimationModal, setShowAnimationModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [recentlyAddedPlace, setRecentlyAddedPlace] = useState<Place | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // Função para migrar dados do localStorage para o Supabase
  const migrateGuestData = useCallback(async () => {
    try {
      // Carrega lugares do localStorage
      const localPlaces = loadPlaces();

      // Se não há dados para migrar, não faz nada
      if (localPlaces.length === 0) {
        console.log('📭 Nenhum dado para migrar');
        return;
      }

      setIsMigrating(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsMigrating(false);
        return;
      }

      console.log('🔄 Migrando', localPlaces.length, 'lugares do localStorage para Supabase...');

      // Prepara lugares para inserção
      const placesToInsert = localPlaces.map((place) => ({
        user_id: user.id,
        name: place.name,
        state: place.state || null,
        country: place.country || null,
        latitude: place.latitude,
        longitude: place.longitude,
        created_at: place.createdAt,
      }));

      // Insere no Supabase
      const { data: insertedPlaces, error: insertError } = await supabase
        .from('places')
        .insert(placesToInsert as any)
        .select();

      if (!insertError && insertedPlaces) {
        console.log('✅ Migração concluída!', insertedPlaces.length, 'lugares salvos');

        // Limpa localStorage após migração bem-sucedida
        localStorage.removeItem('lugares-do-mundo-places');
        console.log('🗑️ localStorage limpo');

        // Aguarda 1 segundo para mostrar mensagem de sucesso
        setTimeout(() => {
          setIsMigrating(false);
          // O usePlaces vai recarregar automaticamente via realtime
        }, 1500);
      } else {
        console.error('Erro na migração:', insertError);
        setIsMigrating(false);
        setError(t('errors.errorSavingData'));
      }
    } catch (err) {
      console.error('Erro ao migrar dados:', err);
      setIsMigrating(false);
      setError(t('errors.errorSavingData'));
    }
  }, [supabase, t]);

  // Verifica autenticação (mas não redireciona mais)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        // Remove marca de modo guest se usuário está logado
        localStorage.removeItem('guest-mode');
        
        // Verifica se deve migrar dados (apenas se vem de callback de auth)
        const shouldMigrate = sessionStorage.getItem('should-migrate-guest-data');
        if (shouldMigrate === 'true') {
          sessionStorage.removeItem('should-migrate-guest-data');
          await migrateGuestData();
        }
      }
      
      setIsLoadingAuth(false);
    };

    checkAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.setItem('guest-mode', 'true');
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        localStorage.removeItem('guest-mode');
        // Marca que deve migrar dados na próxima verificação
        sessionStorage.setItem('should-migrate-guest-data', 'true');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [migrateGuestData, supabase]);

  // Pré-carrega a animação
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/celebration-animation.json';
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const handleAddPlace = useCallback(
    async (place: Omit<Place, 'id' | 'createdAt'>) => {
      const isFirstPlace = places.length === 0;
      const addedPlace = await addPlace(place);
      if (!addedPlace) {
        setError(t('cities.cityAlreadyAdded'));
        return false;
      }
      setError(null);
      setRecentlyAddedPlace(addedPlace);

      const isCoordinate = addedPlace.name.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/);

      if (isFirstPlace && !isCoordinate) {
        setShowAnimationModal(true);
      } else {
        setShowConfirmModal(true);
      }
      return true;
    },
    [addPlace, places, t]
  );

  const scrollToList = () => {
    const listElement = document.getElementById('city-list-section');
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    try {
      const url = `/api/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&lang=${encodeURIComponent(locale)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(t('errors.errorFetchingLocation'));
      }

      const data = await response.json();
      const name = data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality ||
        `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const country = data.address?.country || undefined;

      const placeData = {
        name,
        state:
          data.address?.state ||
          data.address?.state_district ||
          data.address?.region ||
          undefined,
        country,
        latitude: lat,
        longitude: lng,
      };

      const isFirstPlace = places.length === 0;
      const addedPlace = await addPlace(placeData);

      if (!addedPlace) {
        setError(t('cities.cityAlreadyAdded'));
        return;
      }

      setError(null);
      setRecentlyAddedPlace(addedPlace);

      const isCoordinate = addedPlace.name.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/);

      if (isFirstPlace && !isCoordinate) {
        setShowAnimationModal(true);
      } else {
        setShowConfirmModal(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : t('errors.errorAddingPlace');
      setError(errorMessage);
    }
  }, [addPlace, locale, places, t]);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Não redireciona mais, apenas marca como guest mode
    localStorage.setItem('guest-mode', 'true');
    window.location.reload(); // Recarrega para atualizar o estado
  };

  // Handler para o botão de salvar/login
  const handleSaveToCloud = () => {
    if (places.length === 0) {
      setError(t('errors.addCitiesBeforeLogin'));
      return;
    }
    router.push(`/${locale}/login`);
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Cabeçalho com info do usuário */}
        <header className="mb-6 sm:mb-8">
          {/* Mobile: Layout vertical */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-1">
                  {t('dashboard.title')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.subtitle')}
                </p>
              </div>
              <div className="flex items-center gap-2 pl-2">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
            </div>
            
            {/* Modo Guest - Botão de Salvar */}
            {!user && isGuestMode && (
              <div className="bg-orange/10 border-2 border-orange/30 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-orange/90 mb-1">
                      {t('auth.guestModeShort')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('auth.loginToSync')}
                    </p>
                  </div>
                  <button
                    onClick={handleSaveToCloud}
                    disabled={places.length === 0}
                    className="px-4 py-2 bg-green text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {places.length > 0 ? `💾 ${t('common.save')}` : t('auth.login')}
                  </button>
                </div>
              </div>
            )}
            
            {/* Modo Autenticado - Info do usuário */}
            {user && (
              <div className="flex items-center justify-between bg-card rounded-lg p-3 shadow-sm border border-border">
                <div className="flex items-center gap-3">
                  {user.user_metadata?.avatar_url && (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">{t('auth.hello')}</p>
                    <p className="font-medium text-sm text-foreground truncate max-w-[150px]">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs bg-muted text-muted-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {t('auth.logout')}
                </button>
              </div>
            )}
          </div>

          {/* Desktop: Layout horizontal original */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {t('dashboard.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('dashboard.subtitle')}
              </p>
            </div>
            
            {/* Modo Guest - Botão de Salvar (Desktop) */}
            {!user && isGuestMode && (
              <div className="bg-orange/10 border-2 border-orange/30 rounded-lg p-4 ml-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-orange/90 mb-1">
                      {t('auth.guestModeShort')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('auth.guestModeDescription')}
                    </p>
                  </div>
                  <button
                    onClick={handleSaveToCloud}
                    disabled={places.length === 0}
                    className="px-6 py-2.5 bg-green text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {places.length > 0 ? t('auth.loginAndSave') : t('auth.login')}
                  </button>
                </div>
              </div>
            )}
            
            {/* Modo Autenticado - Info do usuário (Desktop) */}
            {user && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('auth.hello')}</p>
                  <p className="font-medium text-foreground">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                </div>
                {user.user_metadata?.avatar_url && (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {t('auth.logout')}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg">
            <p className="font-semibold">{t('common.error')}:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Input de cidade */}
        <div className="mb-6 max-w-2xl mx-auto">
          <CityInput onAddPlace={handleAddPlace} onError={handleError} />
        </div>

        {/* Mapa */}
        <div className="mb-6 max-w-6xl mx-auto">
          {isLoading ? (
            <div className="w-full h-full min-h-[400px] sm:min-h-[600px] rounded-lg border border-border flex items-center justify-center bg-muted">
              <p className="text-muted-foreground">{t('dashboard.loadingPlaces')}</p>
            </div>
          ) : (
            <Map places={places} onMapClick={handleMapClick} />
          )}
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-center px-2">
            {t('dashboard.clickMapToAdd')}
          </p>

          {/* Botões de ação */}
          <div className="flex justify-center gap-3 sm:gap-4 mt-4">
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-orange text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              {t('common.save')}
            </button>
            <button
              onClick={() => {
                if (places.length === 0) {
                  setError(t('errors.noCitiesToClear'));
                  setTimeout(() => setError(null), 5000);
                  return;
                }
                setShowClearModal(true);
              }}
              className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-green text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              {t('common.clear')}
            </button>
            <button
              onClick={() => router.push(`/${locale}/dashboard/fullscreen`)}
              className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              {t('dashboard.openFullscreen')}
            </button>
          </div>
        </div>

        {/* Botão flutuante mobile */}
        <button
          onClick={scrollToList}
          className="lg:hidden fixed bottom-6 right-6 bg-orange text-white p-4 rounded-full shadow-lg hover:opacity-90 transition-all z-50 flex items-center justify-center"
          aria-label={t('dashboard.scrollToCities')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Lista e Estatísticas */}
        <div id="city-list-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto items-start">
          <div className="bg-card rounded-lg border border-border p-4 shadow-sm min-h-56">
            <CityList places={places} onRemovePlace={removePlace} onReorderPlaces={reorderPlaces} />
          </div>
          <div className="bg-card rounded-lg border border-border p-4 shadow-sm min-h-56">
            <Statistics places={places} onShareClick={() => setShowShareModal(true)} />
          </div>
        </div>

        {/* Mapa simplificado */}
        <div className="max-w-6xl mx-auto mt-6">
          <WorldMapSimple places={places} />
        </div>

        {/* Rodapé */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            {t('dashboard.footerText')}{' '}
            <a
              href="https://github.com/eli-wojahn/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Elias Wojahn
            </a>
          </p>
        </footer>

        {/* Modais */}
        
        {/* Modal de Compartilhamento */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          places={places}
        />
        
        {/* Modal de Migração */}
        <Modal
          isOpen={isMigrating}
          title={t('modal.migratingSaving')}
          message={
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground text-center">
                {t('modal.migratingMessage')}
              </p>
            </div>
          }
          confirmText=""
          cancelText=""
          type="info"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
        
        <Modal
          isOpen={showAnimationModal}
          title=""
          message={
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold text-card-foreground mb-4 text-center">
                {t('modal.congratulations')}
              </h2>
              <div className="w-96 h-96 flex items-center justify-center">
                <DotLottieReact
                  src="/celebration-animation.json"
                  autoplay={true}
                  loop={false}
                  speed={0.7}
                />
              </div>
            </div>
          }
          confirmText="OK"
          cancelText=""
          type="success"
          onConfirm={() => {
            setShowAnimationModal(false);
            setShowConfirmModal(true);
          }}
          onCancel={() => {}}
        />

        <Modal
          isOpen={showSaveModal}
          title={t('modal.savePlaces')}
          message={t('modal.savePlacesMessage')}
          confirmText={t('modal.understood')}
          cancelText={t('common.close')}
          type="info"
          videoSrc="/save-map.mp4"
          onConfirm={() => setShowSaveModal(false)}
          onCancel={() => setShowSaveModal(false)}
        />

        <Modal
          isOpen={showClearModal}
          title={t('modal.clearPlaces')}
          message={t('modal.clearPlacesMessage', { count: places.length })}
          confirmText={t('common.clear')}
          cancelText={t('common.cancel')}
          type="warning"
          videoSrc="/trash-bin.mp4"
          onConfirm={() => {
            clearPlaces();
            setShowClearModal(false);
          }}
          onCancel={() => setShowClearModal(false)}
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
                  {t('cities.addedOn')} {new Date(recentlyAddedPlace.createdAt).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US', {
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
      </div>
    </main>
  );
}
