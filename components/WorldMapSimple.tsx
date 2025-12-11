'use client';

import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { Place } from '@/types';

const GEO_URL = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';

interface WorldMapSimpleProps {
  places: Place[];
}

function normalize(str?: string) {
  return (str || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

// Mapa manual de equivalência entre nomes Nominatim / português e nomes do GeoJSON (em inglês)
// Cobre variações em PT e EN, traduções comuns e formas alternativas
const COUNTRY_ALIASES: Record<string, string> = {
  // Português -> GeoJSON (inglês)
  'brasil': 'brazil',
  'argentina': 'argentina',
  'bolívia': 'bolivia',
  'chile': 'chile',
  'colômbia': 'colombia',
  'equador': 'ecuador',
  'guiana': 'guyana',
  'guiana francesa': 'french guiana',
  'surinã': 'suriname',
  'paraguai': 'paraguay',
  'peru': 'peru',
  'uruguai': 'uruguay',
  'venezuela': 'venezuela',

  // Europa
  'alemanha': 'germany',
  'áustria': 'austria',
  'bélgica': 'belgium',
  'bósnia': 'bosnia and herzegovina',
  'bulgária': 'bulgaria',
  'croácia': 'croatia',
  'chipre': 'cyprus',
  'tchéquia': 'czech republic',
  'dinamarca': 'denmark',
  'eslovênia': 'slovenia',
  'eslovaquia': 'slovakia',
  'espanha': 'spain',
  'estônia': 'estonia',
  'finlândia': 'finland',
  'frança': 'france',
  'grécia': 'greece',
  'hungria': 'hungary',
  'irlanda': 'ireland',
  'itália': 'italy',
  'letônia': 'latvia',
  'lituânia': 'lithuania',
  'luxemburgo': 'luxembourg',
  'macedônia': 'north macedonia',
  'malta': 'malta',
  'moldova': 'moldova',
  'mônaco': 'monaco',
  'montenegro': 'montenegro',
  'noruega': 'norway',
  'países baixos': 'netherlands',
  'holanda': 'netherlands',
  'polônia': 'poland',
  'portugal': 'portugal',
  'romênia': 'romania',
  'rússia': 'russia',
  'sérvia': 'serbia',
  'suécia': 'sweden',
  'suíça': 'switzerland',
  'turquia': 'turkey',
  'ucrânia': 'ukraine',
  'reino unido': 'england', 
  'vaticano': 'italy',

  // África
  'áfrica do sul': 'south africa',
  'argélia': 'algeria',
  'angola': 'angola',
  'benin': 'benin',
  'botswana': 'botswana',
  'burquina fasso': 'burkina faso',
  'burkina faso': 'burkina faso',
  'burundi': 'burundi',
  'cabo verde': 'cape verde',
  'camarões': 'cameroon',
  'chade': 'chad',
  'comores': 'comoros',
  'costa do marfim': 'côte d\'ivoire',
  'egito': 'egypt',
  'eritreia': 'eritrea',
  'eswatini': 'eswatini',
  'etiopia': 'ethiopia',
  'gana': 'ghana',
  'guiné': 'guinea',
  'guiné-bissau': 'guinea-bissau',
  'kenya': 'kenya',
  'lesoto': 'lesotho',
  'libéria': 'liberia',
  'líbia': 'libya',
  'madagascar': 'madagascar',
  'malawi': 'malawi',
  'mali': 'mali',
  'marrocos': 'morocco',
  'moçambique': 'mozambique',
  'namíbia': 'namibia',
  'níger': 'niger',
  'nigéria': 'nigeria',
  'república do congo': 'congo (brazzaville)',
  'república democrática do congo': 'congo (kinshasa)',
  'ruanda': 'rwanda',
  'são tomé e príncipe': 'sao tome and principe',
  'senegal': 'senegal',
  'seicheles': 'seychelles',
  'sierra leone': 'sierra leone',
  'somalia': 'somalia',
  'sudão': 'sudan',
  'tanzânia': 'tanzania',
  'tunísia': 'tunisia',
  'uganda': 'uganda',
  'zâmbia': 'zambia',
  'zimbábue': 'zimbabwe',

  // Ásia e Oceania
  'china': 'china',
  'índia': 'india',
  'indonésia': 'indonesia',
  'iraque': 'iraq',
  'irã': 'iran',
  'israel': 'israel',
  'japão': 'japan',
  'jordânia': 'jordan',
  'cazaquistão': 'kazakhstan',
  'kuwait': 'kuwait',
  'laos': 'laos',
  'líbano': 'lebanon',
  'malásia': 'malaysia',
  'maldivas': 'maldives',
  'mongólia': 'mongolia',
  'mianmar': 'myanmar',
  'nepal': 'nepal',
  'coreia do sul': 'south korea',
  'coreia do norte': 'north korea',
  'omã': 'oman',
  'paquistão': 'pakistan',
  'filipinas': 'philippines',
  'qatar': 'qatar',
  'arabia saudita': 'saudi arabia',
  'singapura': 'singapore',
  'sri lanka': 'sri lanka',
  'síria': 'syria',
  'tailândia': 'thailand',
  'timor-leste': 'east timor',
  'turcomenistão': 'turkmenistan',
  'emirados árabes': 'united arab emirates',
  'uzbequistão': 'uzbekistan',
  'vietnam': 'vietnam',
  'austrália': 'australia',
  'nova zelândia': 'new zealand',

  // Variantes e formas em inglês (Nominatim)
  'united states': 'usa',
  'estados unidos da américa': 'usa',
  'united states of america': 'usa',
  'usa': 'usa',
  'united kingdom': 'england',
  'great britain': 'england',
  'britain': 'england',
  'uk': 'england',
  'england': 'england',
  'scotland': 'england',
  'wales': 'england',
  'northern ireland': 'england',
};

export default function WorldMapSimple({ places }: WorldMapSimpleProps) {
  const visitedCountries = useMemo(() => {
    return Array.from(new Set(places.map((p) => p.country).filter(Boolean))) as string[];
  }, [places]);

  const visitedCountriesNorm = useMemo(() => visitedCountries.map((c) => normalize(c)), [visitedCountries]);

  // Criar um mapa de nomes GeoJSON normalizados para comparação
  // Este será preenchido assim que o GeoJSON for carregado
  const [geoCountryNames, setGeoCountryNames] = useState<Set<string>>(new Set());

  // Função para encontrar o nome do país no GeoJSON
  function matchGeoCountry(nominatimCountry: string): string | null {
    const norm = normalize(nominatimCountry);

    // 1. Try direct normalization match
    if (geoCountryNames.has(norm)) {
      return norm;
    }

    // 2. Try alias mapping
    const aliasKey = Object.keys(COUNTRY_ALIASES).find((k) => normalize(k) === norm);
    if (aliasKey) {
      const aliasTarget = normalize(COUNTRY_ALIASES[aliasKey]);
      if (geoCountryNames.has(aliasTarget)) {
        return aliasTarget;
      }
    }

    // 3. Try fuzzy substring match
    for (const geoName of geoCountryNames) {
      if (norm.includes(geoName) || geoName.includes(norm)) {
        return geoName;
      }
    }

    return null;
  }

  function isGeoVisited(geo: any): boolean {
    const geoName = geo.properties?.NAME || geo.properties?.name;
    if (!geoName) return false;

    const geoNorm = normalize(geoName);

    // Verificar se este país do GeoJSON está em visitedCountries
    for (const visited of visitedCountriesNorm) {
      if (visited === geoNorm) return true;

      // Tentar match com alias
      const match = matchGeoCountry(visited);
      if (match === geoNorm) return true;
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
      const match = matchGeoCountry(original);
      if (!match) {
        list.push(original);
      }
    });
    return Array.from(new Set(list));
  }, [visitedCountries, geoCountryNames]);

  // Debug: log all available geo countries on load
  // removed debug effect

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm">
      <h3 className="font-semibold text-lg mb-4">Mapa (países coloridos por visitas)</h3>
      <div className="w-full">
        <ComposableMap projectionConfig={{ scale: 145 }}>
          <Geographies geography={GEO_URL}>
            {({ geographies }: any) => {
              // Extract country names from GeoJSON on first load
              if (geographies.length > 0 && geoCountryNames.size === 0) {
                const names = new Set<string>();
                geographies.forEach((geo: any) => {
                  const name = geo.properties?.NAME || geo.properties?.name;
                  if (name) names.add(normalize(name));
                });
                setGeoCountryNames(names);
              }

              return (
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
              );
            }}
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
