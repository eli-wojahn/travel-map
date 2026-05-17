import { describe, expect, it, vi } from 'vitest';
import type { Place } from '@/types';
import { generatePlaceId, loadPlaces, savePlaces } from '@/lib/storage';

const STORAGE_KEY = 'lugares-do-mundo-places';

function createPlace(overrides: Partial<Place> = {}): Place {
  return {
    id: 'place-1',
    name: 'Sao Paulo',
    state: 'Sao Paulo',
    country: 'Brasil',
    latitude: -23.5505,
    longitude: -46.6333,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('storage', () => {
  it('savePlaces stores serialized places', () => {
    const places = [createPlace()];
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    savePlaces(places);

    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(places));
  });

  it('savePlaces catches localStorage write errors', () => {
    const places = [createPlace()];
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => savePlaces(places)).not.toThrow();
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it('loadPlaces returns an empty array when storage is empty', () => {
    expect(loadPlaces()).toEqual([]);
  });

  it('loadPlaces returns parsed places when storage has valid json', () => {
    const places = [createPlace({ id: 'place-2', name: 'Tokyo', country: 'Japan' })];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(places));

    expect(loadPlaces()).toEqual(places);
  });

  it('loadPlaces returns an empty array when json is corrupted', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    localStorage.setItem(STORAGE_KEY, '{not-valid-json');

    expect(loadPlaces()).toEqual([]);
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it('generatePlaceId creates unique ids with expected prefix', () => {
    const ids = Array.from({ length: 100 }, () => generatePlaceId());

    expect(ids.every((id) => id.startsWith('place-'))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
