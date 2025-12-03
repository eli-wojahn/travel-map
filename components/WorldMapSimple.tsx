'use client';

import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import countriesData from 'world-countries';
import { Place } from '@/types';

const GEO_URL = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';

interface WorldMapSimpleProps {
  places: Place[];
}

function normalize(str?: string) {
  return (str || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

export default function WorldMapSimple({ places }: WorldMapSimpleProps) {
  const visitedCountries = useMemo(() => {
    return Array.from(new Set(places.map((p) => p.country).filter(Boolean))) as string[];
  }, [places]);

  const visitedCountriesNorm = useMemo(() => visitedCountries.map((c) => normalize(c)), [visitedCountries]);

  // Precompute a lookup map of all possible normalized names -> country record
  const nameToCountryMap = useMemo(() => {
    const map = new Map<string, any>();
    countriesData.forEach((c: any) => {
      // common and official
      const common = normalize(c.name?.common);
      const official = normalize(c.name?.official);
      if (common) map.set(common, c);
      if (official) map.set(official, c);

      // alt spellings
      (c.altSpellings || []).forEach((a: string) => {
        const n = normalize(a);
        if (n) map.set(n, c);
      });

      // translations (include all languages available)
      const translations = c.translations || {};
      Object.values(translations).forEach((t: any) => {
        if (!t) return;
        const tCommon = normalize(t.common);
        const tOfficial = normalize(t.official);
        if (tCommon) map.set(tCommon, c);
        if (tOfficial) map.set(tOfficial, c);
      });

      // ISO codes
      if (c.cca2) map.set(normalize(c.cca2), c);
      if (c.cca3) map.set(normalize(c.cca3), c);
    });
    return map;
  }, []);

  // helper to find country record from geo name
  function matchCountryByName(name?: string) {
    if (!name) return undefined;
    const n = normalize(name);

    // fast exact lookup via precomputed map
    const direct = nameToCountryMap.get(n);
    if (direct) return direct;

    // fallback fuzzy: check contains/substring matches across common/official/alt/translations
    const found = countriesData.find((c: any) => {
      const common = normalize(c.name?.common);
      const official = normalize(c.name?.official);
      if (common && (n.includes(common) || common.includes(n))) return true;
      if (official && (n.includes(official) || official.includes(n))) return true;

      const alt = (c.altSpellings || []).map((a: string) => normalize(a));
      if (alt.some((a: string) => a && (n.includes(a) || a.includes(n)))) return true;

      const translations = c.translations || {};
      for (const t of Object.values(translations) as any[]) {
        if (!t) continue;
        const tCommon = normalize(t.common);
        const tOfficial = normalize(t.official);
        if (tCommon && (n.includes(tCommon) || tCommon.includes(n))) return true;
        if (tOfficial && (n.includes(tOfficial) || tOfficial.includes(n))) return true;
      }

      return false;
    });
    return found;
  }


  // set of visited country names normalized
  const visitedCountriesSet = useMemo(() => new Set(visitedCountriesNorm), [visitedCountriesNorm]);

  function isGeoVisited(geo: any) {
    const geoName = geo.properties?.NAME || geo.properties?.name || geo.properties?.admin || geo.properties?.sovereignty;
    const matched = matchCountryByName(geoName) as any | undefined;
    if (!matched) return false;

    const common = normalize(matched.name.common);
    const official = normalize(matched.name.official);
    const alts = (matched.altSpellings || []).map((a: string) => normalize(a));

    if (visitedCountriesSet.has(common) || visitedCountriesSet.has(official)) return true;
    if (alts.some((a: string) => visitedCountriesSet.has(a))) return true;

    // try fuzzy contains
    for (const v of visitedCountriesSet) {
      if (v.includes(common) || common.includes(v) || v.includes(official) || official.includes(v)) return true;
    }
    return false;
  }

  function getFillForGeo(geo: any) {
    if (isGeoVisited(geo)) return '#d87943';
    return '#e5e7eb';
  }

  // diagnostic: list countries from places that couldn't be matched
  const [showUnrecognized, setShowUnrecognized] = useState(false);
  const unrecognizedCountries = useMemo(() => {
    const list: string[] = [];
    visitedCountries.forEach((original) => {
      const matched = matchCountryByName(original);
      if (!matched) list.push(original);
    });
    return Array.from(new Set(list));
  }, [visitedCountries]);

  // log to console for easier copy-paste
  if (unrecognizedCountries.length > 0) {
    console.debug('WorldMapSimple - países não reconhecidos:', unrecognizedCountries);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm">
      <h3 className="font-semibold text-lg mb-4">Mapa (continentes coloridos por visitas)</h3>
      <div className="w-full">
        <ComposableMap projectionConfig={{ scale: 145 }}>
          <Geographies geography={GEO_URL}>
            {({ geographies }: any) => (
              <>
                {geographies.map((geo: any) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getFillForGeo(geo)}
                    stroke="#ffffff"
                    strokeWidth={0.3}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', opacity: 0.85 },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))}
              </>
            )}
          </Geographies>
        </ComposableMap>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#d87943' }} />
            <span className="text-gray-700">País visitado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-300" />
            <span className="text-gray-700">Sem visitas</span>
          </div>
        </div>

        {unrecognizedCountries.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowUnrecognized((s) => !s)}
              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm"
            >
              {showUnrecognized ? 'Esconder' : `Países não reconhecidos (${unrecognizedCountries.length})`}
            </button>

            {showUnrecognized && (
              <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
                {unrecognizedCountries.map((c) => (
                  <li key={c} className="break-words">{c}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
