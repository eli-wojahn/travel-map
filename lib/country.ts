import { inferCountryCodeFromCountryName } from '@/lib/countryFlags';

export function normalizeCountryCode(countryCode?: string): string | undefined {
  if (!countryCode) return undefined;

  const normalized = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return undefined;

  return normalized;
}

function normalizeForLookup(value?: string): string | undefined {
  if (!value) return undefined;

  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  return normalized || undefined;
}

function normalizeCountryName(country?: string): string | undefined {
  if (!country) return undefined;

  const normalized = country.trim();
  if (!normalized) return undefined;

  return normalized;
}

function getDisplayNameFromCode(countryCode: string, locale: string): string | undefined {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
    return displayNames.of(countryCode) || undefined;
  } catch {
    return undefined;
  }
}

function getRegionCodes(): string[] {
  try {
    const valuesOf = (Intl as any).supportedValuesOf;
    if (typeof valuesOf === 'function') {
      return valuesOf('region') as string[];
    }
  } catch {
    // Ignore and fallback to empty list.
  }

  return [];
}

const LOOKUP_LOCALES = ['en', 'pt', 'es', 'fr', 'de', 'it'];
const countryNameToCode = new Map<string, string>();

for (const code of getRegionCodes()) {
  for (const locale of LOOKUP_LOCALES) {
    const displayName = getDisplayNameFromCode(code, locale);
    const normalizedName = normalizeForLookup(displayName);
    if (normalizedName && !countryNameToCode.has(normalizedName)) {
      countryNameToCode.set(normalizedName, code);
    }
  }
}

export function inferCountryCode(country?: string): string | undefined {
  const normalizedCountry = normalizeForLookup(country);
  if (!normalizedCountry) return undefined;

  return countryNameToCode.get(normalizedCountry) || inferCountryCodeFromCountryName(country);
}

export function getCanonicalCountryName(country?: string, countryCode?: string): string | undefined {
  const normalizedCode = normalizeCountryCode(countryCode) || inferCountryCode(country);

  if (normalizedCode) {
    return getDisplayNameFromCode(normalizedCode, 'en') || normalizeCountryName(country);
  }

  return normalizeCountryName(country);
}

export function getLocalizedCountryName(options: {
  country?: string;
  countryCode?: string;
  locale: string;
}): string | undefined {
  const normalizedCode = normalizeCountryCode(options.countryCode) || inferCountryCode(options.country);

  if (normalizedCode) {
    return (
      getDisplayNameFromCode(normalizedCode, options.locale) ||
      getDisplayNameFromCode(normalizedCode, 'en') ||
      normalizeCountryName(options.country)
    );
  }

  return normalizeCountryName(options.country);
}

export function getCountryIdentity(country?: string, countryCode?: string): string | undefined {
  const normalizedCode = normalizeCountryCode(countryCode) || inferCountryCode(country);
  if (normalizedCode) {
    return `code:${normalizedCode}`;
  }

  const normalizedCountry = normalizeCountryName(country)?.toLowerCase();
  if (!normalizedCountry) return undefined;

  return `name:${normalizedCountry}`;
}
