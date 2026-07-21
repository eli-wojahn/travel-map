/**
 * Testes do hook usePlaces – modo autenticado
 *
 * Cobre: carregamento via Supabase, addPlace/removePlace/clearPlaces/reorderPlaces
 * no ramo autenticado, e o ciclo de vida da subscription realtime.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock estável do Supabase (deve ser criado antes dos imports do módulo)
// ---------------------------------------------------------------------------
const { mockAuth, mockClient, mockChannel, mockQb } = vi.hoisted(() => {
  const mockQb = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    single: vi.fn(),
  };

  const mockChannel = {
    on: vi.fn(),
    subscribe: vi.fn(),
    _cb: null as ((payload: any) => void) | null,
  };

  const mockAuth = {
    getUser: vi.fn(),
  };

  const mockClient = {
    auth: mockAuth,
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  };

  return { mockAuth, mockClient, mockChannel, mockQb };
});

vi.mock('@/lib/supabase-browser', () => ({
  createClient: () => mockClient,
}));

import { usePlaces } from '@/hooks/usePlaces';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockUser = { id: 'user-123', email: 'test@example.com' };

const dbPlace = {
  id: 'place-1',
  name: 'São Paulo',
  state: 'São Paulo',
  country: 'Brasil',
  latitude: -23.5,
  longitude: -46.6,
  created_at: '2024-01-01T00:00:00.000Z',
};

const expectedPlace = {
  id: 'place-1',
  name: 'São Paulo',
  state: 'São Paulo',
  country: 'Brazil',
  countryCode: 'BR',
  latitude: -23.5,
  longitude: -46.6,
  createdAt: '2024-01-01T00:00:00.000Z',
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  // Query builder – métodos de cadeia retornam o próprio qb
  mockQb.select.mockReturnValue(mockQb);
  mockQb.eq.mockReturnValue(mockQb);
  mockQb.insert.mockReturnValue(mockQb);
  mockQb.delete.mockReturnValue(mockQb);
  // Terminais com valores padrão
  mockQb.order.mockResolvedValue({ data: [], error: null });
  mockQb.single.mockResolvedValue({ data: null, error: null });

  // Canal realtime – captura o callback passado ao .on()
  mockChannel._cb = null;
  mockChannel.on.mockImplementation((_type: any, _filter: any, cb: any) => {
    mockChannel._cb = cb;
    return mockChannel;
  });
  mockChannel.subscribe.mockReturnValue(mockChannel);

  // Auth – usuário autenticado por padrão
  mockAuth.getUser.mockResolvedValue({ data: { user: mockUser } });

  // Client
  mockClient.from.mockReturnValue(mockQb);
  mockClient.channel.mockReturnValue(mockChannel);
});

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------
describe('usePlaces – modo autenticado', () => {
  it('define isGuestMode como false quando há usuário', async () => {
    const { result } = renderHook(() => usePlaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isGuestMode).toBe(false);
  });

  it('carrega e mapeia lugares do Supabase no mount', async () => {
    mockQb.order.mockResolvedValueOnce({ data: [dbPlace], error: null });

    const { result } = renderHook(() => usePlaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.places).toHaveLength(1);
    expect(result.current.places[0]).toEqual(expectedPlace);
  });

  it('converte state null do banco em undefined', async () => {
    mockQb.order.mockResolvedValueOnce({
      data: [{ ...dbPlace, state: null }],
      error: null,
    });

    const { result } = renderHook(() => usePlaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.places[0].state).toBeUndefined();
  });

  it('mantém places vazio quando Supabase retorna array vazio', async () => {
    const { result } = renderHook(() => usePlaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.places).toEqual([]);
  });

  it('não crasha e termina loading quando Supabase retorna erro de carregamento', async () => {
    mockQb.order.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });

    const { result } = renderHook(() => usePlaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.places).toEqual([]);
  });

  it('addPlace chama insert no Supabase e retorna o lugar criado', async () => {
    mockQb.single.mockResolvedValueOnce({ data: dbPlace, error: null });

    const { result } = renderHook(() => usePlaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const newPlace = await act(async () =>
      result.current.addPlace({
        name: 'São Paulo',
        state: 'São Paulo',
        country: 'Brasil',
        latitude: -23.5,
        longitude: -46.6,
      })
    );

    expect(mockClient.from).toHaveBeenCalledWith('places');
    expect(mockQb.insert).toHaveBeenCalled();
    expect(newPlace).toEqual(expectedPlace);
    expect(result.current.places).toHaveLength(1);
  });

  it('addPlace retorna null quando insert falha', async () => {
    mockQb.single.mockResolvedValueOnce({ data: null, error: { message: 'insert failed' } });

    const { result } = renderHook(() => usePlaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const newPlace = await act(async () =>
      result.current.addPlace({
        name: 'Tokyo',
        latitude: 35.7,
        longitude: 139.7,
      })
    );

    expect(newPlace).toBeNull();
    expect(result.current.places).toHaveLength(0);
  });

  it('addPlace retorna null para lugar duplicado (sem chamar Supabase)', async () => {
    mockQb.order.mockResolvedValueOnce({ data: [dbPlace], error: null });

    const { result } = renderHook(() => usePlaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Reseta para detectar se insert foi chamado
    mockQb.insert.mockClear();

    const duplicate = await act(async () =>
      result.current.addPlace({
        name: 'São Paulo',
        state: 'São Paulo',
        country: 'Brasil',
        latitude: -23.5,
        longitude: -46.6,
      })
    );

    expect(duplicate).toBeNull();
    expect(mockQb.insert).not.toHaveBeenCalled();
  });

  it('removePlace chama delete no Supabase e atualiza estado local', async () => {
    mockQb.order.mockResolvedValueOnce({ data: [dbPlace], error: null });

    const { result } = renderHook(() => usePlaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.places).toHaveLength(1);

    // eq() como terminal de delete retorna { error: null }
    mockQb.eq.mockResolvedValueOnce({ error: null });

    await act(async () => result.current.removePlace('place-1'));

    expect(mockQb.delete).toHaveBeenCalled();
    expect(result.current.places).toHaveLength(0);
  });

  it('clearPlaces chama delete por user_id e esvazia estado local', async () => {
    mockQb.order.mockResolvedValueOnce({ data: [dbPlace], error: null });

    const { result } = renderHook(() => usePlaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockQb.eq.mockResolvedValueOnce({ error: null });

    await act(async () => result.current.clearPlaces());

    expect(mockQb.delete).toHaveBeenCalled();
    expect(mockQb.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    expect(result.current.places).toHaveLength(0);
  });

  it('reorderPlaces reordena localmente sem tocar localStorage', async () => {
    const place2 = { ...dbPlace, id: 'place-2', name: 'Rio de Janeiro' };
    mockQb.order.mockResolvedValueOnce({ data: [dbPlace, place2], error: null });

    const { result } = renderHook(() => usePlaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.reorderPlaces(0, 1));

    expect(result.current.places[0].name).toBe('Rio de Janeiro');
    expect(result.current.places[1].name).toBe('São Paulo');
    // localStorage não deve ser escrito em modo autenticado
    expect(localStorage.getItem('lugares-do-mundo-places')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Testes de realtime
// ---------------------------------------------------------------------------
describe('usePlaces – subscription realtime', () => {
  it('configura subscription apenas em modo autenticado', async () => {
    renderHook(() => usePlaces());
    await waitFor(() => expect(mockClient.channel).toHaveBeenCalledWith('places-changes'));
    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('evento INSERT adiciona lugar ao estado', async () => {
    const { result } = renderHook(() => usePlaces());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(mockChannel._cb).not.toBeNull();
    });

    act(() => {
      mockChannel._cb!({
        eventType: 'INSERT',
        new: dbPlace,
        old: {},
      });
    });

    expect(result.current.places).toHaveLength(1);
    expect(result.current.places[0]).toEqual(expectedPlace);
  });

  it('evento INSERT ignora duplicata (mesmo id já presente)', async () => {
    mockQb.order.mockResolvedValueOnce({ data: [dbPlace], error: null });

    const { result } = renderHook(() => usePlaces());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(mockChannel._cb).not.toBeNull();
    });

    act(() => {
      mockChannel._cb!({ eventType: 'INSERT', new: dbPlace, old: {} });
    });

    expect(result.current.places).toHaveLength(1);
  });

  it('evento DELETE remove lugar do estado', async () => {
    mockQb.order.mockResolvedValueOnce({ data: [dbPlace], error: null });

    const { result } = renderHook(() => usePlaces());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(mockChannel._cb).not.toBeNull();
    });

    act(() => {
      mockChannel._cb!({ eventType: 'DELETE', old: { id: 'place-1' }, new: {} });
    });

    expect(result.current.places).toHaveLength(0);
  });

  it('evento UPDATE atualiza lugar no estado', async () => {
    mockQb.order.mockResolvedValueOnce({ data: [dbPlace], error: null });

    const { result } = renderHook(() => usePlaces());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(mockChannel._cb).not.toBeNull();
    });

    const updated = { ...dbPlace, name: 'São Paulo Updated' };

    act(() => {
      mockChannel._cb!({ eventType: 'UPDATE', new: updated, old: { id: 'place-1' } });
    });

    expect(result.current.places[0].name).toBe('São Paulo Updated');
  });

  it('chama removeChannel ao desmontar o hook', async () => {
    const { result, unmount } = renderHook(() => usePlaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(mockChannel._cb).not.toBeNull());

    unmount();
    // Aguarda microtask queue para o .then() do unsubscribe ser processado
    await act(async () => {});

    expect(mockClient.removeChannel).toHaveBeenCalledWith(mockChannel);
  });
});
