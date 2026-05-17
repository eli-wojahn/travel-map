import { describe, expect, it, vi } from 'vitest';
import { geocodeCity } from '@/lib/geocoding';

describe('geocoding', () => {
  it('geocodeCity maps a successful Nominatim response', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [
        {
          display_name: 'Sao Paulo, Sao Paulo, Brasil',
          lat: '-23.5505',
          lon: '-46.6333',
          address: {
            state: 'Sao Paulo',
            country: 'Brasil',
          },
        },
      ],
    } as Response);

    const result = await geocodeCity('Sao Paulo');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('q=Sao%20Paulo'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': 'LugaresDoMundo/1.0',
        }),
      })
    );
    expect(result).toEqual({
      name: 'Sao Paulo',
      state: 'Sao Paulo',
      country: 'Brasil',
      latitude: -23.5505,
      longitude: -46.6333,
    });
  });

  it('geocodeCity falls back to state_district and region', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          display_name: 'Campinas, Sao Paulo, Brasil',
          lat: '-22.9099',
          lon: '-47.0626',
          address: {
            state_district: 'Campinas',
            country: 'Brasil',
          },
        },
      ],
    } as Response);

    const withDistrict = await geocodeCity('Campinas');
    expect(withDistrict.state).toBe('Campinas');

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          display_name: 'Lyon, Auvergne-Rhone-Alpes, France',
          lat: '45.7640',
          lon: '4.8357',
          address: {
            region: 'Auvergne-Rhone-Alpes',
            country: 'France',
          },
        },
      ],
    } as Response);

    const withRegion = await geocodeCity('Lyon');
    expect(withRegion.state).toBe('Auvergne-Rhone-Alpes');
  });

  it('geocodeCity falls back to input name when display_name first segment is empty', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [
        {
          display_name: ', Unknown Region',
          lat: '0',
          lon: '0',
          address: {},
        },
      ],
    } as Response);

    const result = await geocodeCity('Fallback City');
    expect(result.name).toBe('Fallback City');
  });

  it('geocodeCity throws when API returns not found', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    await expect(geocodeCity('No City')).rejects.toThrow('City "No City" not found');
  });

  it('geocodeCity throws API error for non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    await expect(geocodeCity('Tokyo')).rejects.toThrow('API error: 503');
  });

  it('geocodeCity rethrows unexpected errors', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network failure'));

    await expect(geocodeCity('Paris')).rejects.toThrow('network failure');
  });
});
