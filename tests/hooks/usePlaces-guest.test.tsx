import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Place } from '@/types';

const STORAGE_KEY = 'lugares-do-mundo-places';

// Stable mock references created before the module is loaded
const { mockAuth, mockClient } = vi.hoisted(() => {
  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
  };
  const mockClient = {
    auth: mockAuth,
    from: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  };
  return { mockAuth, mockClient };
});

vi.mock('@/lib/supabase-browser', () => ({
  // Always return the same reference so the [supabase] dependency doesn't change
  createClient: () => mockClient,
}));

import { usePlaces } from '@/hooks/usePlaces';

function makePlaceInput(
  overrides: Partial<Omit<Place, 'id' | 'createdAt'>> = {}
) {
  return {
    name: 'Sao Paulo',
    state: 'Sao Paulo',
    country: 'Brasil',
    latitude: -23.5505,
    longitude: -46.6333,
    ...overrides,
  };
}

// Wait until the hook finishes loading (async auth check completes)
async function initGuestHook() {
  const hook = renderHook(() => usePlaces());
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

describe('usePlaces – guest mode', () => {
  beforeEach(() => {
    // Ensure guest mode for every test
    mockAuth.getUser.mockResolvedValue({ data: { user: null } });
  });

  it('sets isGuestMode to true when no user is authenticated', async () => {
    const { result } = await initGuestHook();
    expect(result.current.isGuestMode).toBe(true);
  });

  it('starts with an empty places array when localStorage is empty', async () => {
    const { result } = await initGuestHook();
    expect(result.current.places).toEqual([]);
  });

  it('loads pre-existing places from localStorage on mount', async () => {
    const existing: Place[] = [
      {
        id: 'p-1',
        name: 'Tokyo',
        country: 'Japan',
        latitude: 35.6762,
        longitude: 139.6503,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    const { result } = await initGuestHook();
    expect(result.current.places).toHaveLength(1);
    expect(result.current.places[0].name).toBe('Tokyo');
  });

  it('addPlace returns the new place on success', async () => {
    const { result } = await initGuestHook();

    let added: Place | null = null;
    await act(async () => {
      added = await result.current.addPlace(makePlaceInput());
    });

    expect(added).not.toBeNull();
    expect(added!.name).toBe('Sao Paulo');
    expect(added!.id).toMatch(/^place-/);
    expect(added!.createdAt).toBeDefined();
  });

  it('addPlace persists the new place to localStorage', async () => {
    const { result } = await initGuestHook();

    await act(async () => {
      await result.current.addPlace(makePlaceInput());
    });

    const stored: Place[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Sao Paulo');
  });

  it('addPlace returns null for an exact duplicate', async () => {
    const { result } = await initGuestHook();

    await act(async () => {
      await result.current.addPlace(makePlaceInput());
    });

    let duplicate: Place | null = null;
    await act(async () => {
      duplicate = await result.current.addPlace(makePlaceInput());
    });

    expect(duplicate).toBeNull();
    expect(result.current.places).toHaveLength(1);
  });

  it('duplicate detection is case-insensitive for name', async () => {
    const { result } = await initGuestHook();

    await act(async () => {
      await result.current.addPlace(makePlaceInput({ name: 'sao paulo' }));
    });

    let duplicate: Place | null = null;
    await act(async () => {
      duplicate = await result.current.addPlace(makePlaceInput({ name: 'SAO PAULO' }));
    });

    expect(duplicate).toBeNull();
  });

  it('duplicate detection trims leading/trailing whitespace from name', async () => {
    const { result } = await initGuestHook();

    await act(async () => {
      await result.current.addPlace(makePlaceInput({ name: 'Paris' }));
    });

    let duplicate: Place | null = null;
    await act(async () => {
      duplicate = await result.current.addPlace(makePlaceInput({ name: '  Paris  ' }));
    });

    expect(duplicate).toBeNull();
  });

  it('treats the same city as duplicate when country names differ by language but countryCode is equal', async () => {
    const { result } = await initGuestHook();

    await act(async () => {
      await result.current.addPlace(
        makePlaceInput({ name: 'Rome', state: 'Lazio', country: 'Italy', countryCode: 'IT' })
      );
    });

    let duplicate: Place | null = null;
    await act(async () => {
      duplicate = await result.current.addPlace(
        makePlaceInput({ name: 'Rome', state: 'Lazio', country: 'Itália', countryCode: 'it' })
      );
    });

    expect(duplicate).toBeNull();
    expect(result.current.places).toHaveLength(1);
  });

  it('treats the same city as duplicate when country names differ by language without countryCode', async () => {
    const { result } = await initGuestHook();

    await act(async () => {
      await result.current.addPlace(
        makePlaceInput({ name: 'Rome', state: 'Lazio', country: 'Italy', countryCode: undefined })
      );
    });

    let duplicate: Place | null = null;
    await act(async () => {
      duplicate = await result.current.addPlace(
        makePlaceInput({ name: 'Rome', state: 'Lazio', country: 'Itália', countryCode: undefined })
      );
    });

    expect(duplicate).toBeNull();
    expect(result.current.places).toHaveLength(1);
  });

  it('two cities with same name but different countries are allowed', async () => {
    const { result } = await initGuestHook();

    await act(async () => {
      await result.current.addPlace(makePlaceInput({ name: 'Springfield', country: 'USA' }));
    });

    let second: Place | null = null;
    await act(async () => {
      second = await result.current.addPlace(
        makePlaceInput({ name: 'Springfield', country: 'Australia' })
      );
    });

    expect(second).not.toBeNull();
    expect(result.current.places).toHaveLength(2);
  });

  it('removePlace removes the correct place and updates localStorage', async () => {
    const { result } = await initGuestHook();

    let added: Place | null = null;
    await act(async () => {
      added = await result.current.addPlace(makePlaceInput());
    });

    await act(async () => {
      await result.current.removePlace(added!.id);
    });

    expect(result.current.places).toHaveLength(0);
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    ).toHaveLength(0);
  });

  it('reorderPlaces changes order and persists to localStorage', async () => {
    const { result } = await initGuestHook();

    // Add two places – newest first, so after adding: [Second, First]
    await act(async () => {
      await result.current.addPlace(makePlaceInput({ name: 'First' }));
    });
    await act(async () => {
      await result.current.addPlace(makePlaceInput({ name: 'Second' }));
    });

    expect(result.current.places[0].name).toBe('Second');

    // Move index 0 → 1: [First, Second]
    act(() => {
      result.current.reorderPlaces(0, 1);
    });

    expect(result.current.places[0].name).toBe('First');
    expect(result.current.places[1].name).toBe('Second');

    const stored: Place[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );
    expect(stored[0].name).toBe('First');
  });
});
