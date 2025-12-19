'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Place } from '@/types';
import { loadPlaces } from '@/lib/storage';

/**
 * Hook customizado para gerenciar a lista de lugares visitados
 * Agora sincroniza com Supabase e suporta realtime updates
 */
export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Carrega lugares do Supabase e migra localStorage se necessário
  useEffect(() => {
    const loadPlacesFromSupabase = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Carrega lugares do Supabase
        const { data: supabasePlaces, error } = await supabase
          .from('places')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao carregar lugares:', error);
          setIsLoading(false);
          return;
        }

        // Se não há lugares no Supabase, verifica localStorage
        if (!supabasePlaces || supabasePlaces.length === 0) {
          const localPlaces = loadPlaces();
          
          if (localPlaces.length > 0) {
            // Migra lugares do localStorage para o Supabase
            console.log('🔄 Migrando', localPlaces.length, 'lugares do localStorage...');
            
            const placesToInsert = localPlaces.map((place) => ({
              user_id: user.id,
              name: place.name,
              state: place.state || null,
              country: place.country || null,
              latitude: place.latitude,
              longitude: place.longitude,
              created_at: place.createdAt,
            }));

            const { data: insertedPlaces, error: insertError } = await supabase
              .from('places')
              .insert(placesToInsert as any)
              .select();

            if (!insertError && insertedPlaces) {
              console.log('✅ Migração concluída!', insertedPlaces.length, 'lugares');
              
              // Converte para o formato Place
              const migratedPlaces: Place[] = insertedPlaces.map((p: any) => ({
                id: p.id,
                name: p.name,
                state: p.state || undefined,
                country: p.country || undefined,
                latitude: p.latitude,
                longitude: p.longitude,
                createdAt: p.created_at,
              }));
              
              setPlaces(migratedPlaces);
              
              // Limpa localStorage após migração bem-sucedida
              localStorage.removeItem('lugares-do-mundo-places');
              console.log('🗑️ localStorage limpo');
            }
          }
        } else {
          // Converte dados do Supabase para o formato Place
          const formattedPlaces: Place[] = supabasePlaces.map((p: any) => ({
            id: p.id,
            name: p.name,
            state: p.state || undefined,
            country: p.country || undefined,
            latitude: p.latitude,
            longitude: p.longitude,
            createdAt: p.created_at,
          }));
          
          setPlaces(formattedPlaces);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Erro ao carregar lugares:', err);
        setIsLoading(false);
      }
    };

    loadPlacesFromSupabase();

    // Configura realtime subscription para sincronização automática
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('places-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'places',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🔄 Realtime update:', payload);
            
            if (payload.eventType === 'INSERT') {
              const newPlace = payload.new;
              setPlaces((prev) => {
                // Evita duplicatas
                if (prev.some((p) => p.id === newPlace.id)) return prev;
                
                return [
                  {
                    id: newPlace.id,
                    name: newPlace.name,
                    state: newPlace.state || undefined,
                    country: newPlace.country || undefined,
                    latitude: newPlace.latitude,
                    longitude: newPlace.longitude,
                    createdAt: newPlace.created_at,
                  },
                  ...prev,
                ];
              });
            } else if (payload.eventType === 'DELETE') {
              setPlaces((prev) => prev.filter((p) => p.id !== payload.old.id));
            } else if (payload.eventType === 'UPDATE') {
              setPlaces((prev) =>
                prev.map((p) =>
                  p.id === payload.new.id
                    ? {
                        id: payload.new.id,
                        name: payload.new.name,
                        state: payload.new.state || undefined,
                        country: payload.new.country || undefined,
                        latitude: payload.new.latitude,
                        longitude: payload.new.longitude,
                        createdAt: payload.new.created_at,
                      }
                    : p
                )
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const unsubscribe = setupRealtimeSubscription();

    return () => {
      unsubscribe.then((cleanup) => cleanup && cleanup());
    };
  }, [supabase]);

  /**
   * Adiciona um novo lugar à lista e salva no Supabase
   */
  const addPlace = useCallback(
    async (place: Omit<Place, 'id' | 'createdAt'>): Promise<Place | null> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('Usuário não autenticado');
          return null;
        }

        // Verifica duplicatas localmente primeiro (mais rápido)
        const isDuplicate = places.some((existing) => {
          const sameName =
            existing.name.trim().toLowerCase() === place.name.trim().toLowerCase();
          const sameCountry =
            (existing.country || '').trim().toLowerCase() ===
            (place.country || '').trim().toLowerCase();
          const sameState =
            (existing.state || '').trim().toLowerCase() ===
            (place.state || '').trim().toLowerCase();
          return sameName && sameCountry && sameState;
        });

        if (isDuplicate) {
          return null;
        }

        // Insere no Supabase
        const { data, error } = await supabase
          .from('places')
          .insert({
            user_id: user.id,
            name: place.name,
            state: place.state || null,
            country: place.country || null,
            latitude: place.latitude,
            longitude: place.longitude,
          } as any)
          .select()
          .single();

        if (error) {
          console.error('Erro ao adicionar lugar:', error);
          return null;
        }

        if (!data) return null;

        // Converte para o formato Place
        const newPlace: Place = {
          id: (data as any).id,
          name: (data as any).name,
          state: (data as any).state || undefined,
          country: (data as any).country || undefined,
          latitude: (data as any).latitude,
          longitude: (data as any).longitude,
          createdAt: (data as any).created_at,
        };

        // Atualiza estado local (o realtime também vai atualizar, mas isso é mais rápido)
        setPlaces((prev) => [newPlace, ...prev]);

        return newPlace;
      } catch (err) {
        console.error('Erro ao adicionar lugar:', err);
        return null;
      }
    },
    [supabase, places]
  );

  /**
   * Remove um lugar da lista e do Supabase
   */
  const removePlace = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from('places').delete().eq('id', id);

        if (error) {
          console.error('Erro ao remover lugar:', error);
          return;
        }

        // Atualiza estado local
        setPlaces((prev) => prev.filter((place) => place.id !== id));
      } catch (err) {
        console.error('Erro ao remover lugar:', err);
      }
    },
    [supabase]
  );

  /**
   * Limpa todos os lugares do usuário
   */
  const clearPlaces = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('places')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao limpar lugares:', error);
        return;
      }

      setPlaces([]);
    } catch (err) {
      console.error('Erro ao limpar lugares:', err);
    }
  }, [supabase]);

  /**
   * Reordena os lugares (apenas local - não salva no Supabase)
   * A ordem é determinada pela data de criação no Supabase
   */
  const reorderPlaces = useCallback((startIndex: number, endIndex: number) => {
    setPlaces((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  return {
    places,
    isLoading,
    addPlace,
    removePlace,
    clearPlaces,
    reorderPlaces,
  };
}

