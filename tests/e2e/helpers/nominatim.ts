import { Page } from '@playwright/test';

export interface FakeCity {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
}

const DEFAULT_CITY: FakeCity = {
  name: 'Tokyo',
  state: 'Tokyo Metropolis',
  country: 'Japan',
  lat: 35.6762,
  lon: 139.6503,
};

/**
 * Intercepta chamadas ao Nominatim (forward geocoding) e retorna uma cidade fake.
 * Evita dependência de internet e limites de rate durante os testes.
 */
export async function mockNominatim(page: Page, city: FakeCity = DEFAULT_CITY): Promise<void> {
  await page.route('**/nominatim.openstreetmap.org/search*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          place_id: 12345,
          display_name: `${city.name}, ${city.state ?? ''}, ${city.country}`,
          lat: String(city.lat),
          lon: String(city.lon),
          address: {
            city: city.name,
            state: city.state,
            country: city.country,
            country_code: city.country.slice(0, 2).toLowerCase(),
          },
        },
      ]),
    });
  });
}

/**
 * Intercepta Nominatim e retorna lista vazia (cidade não encontrada).
 */
export async function mockNominatimNotFound(page: Page): Promise<void> {
  await page.route('**/nominatim.openstreetmap.org/search*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}
