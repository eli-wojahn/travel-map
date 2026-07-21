/**
 * Mapeamento de nomes de países para emojis de bandeiras
 * Suporta nomes em português e inglês
 */
const countryFlags: Record<string, string> = {
  // Países em português
  'Brasil': '🇧🇷',
  'Estados Unidos': '🇺🇸',
  'Estados Unidos da América': '🇺🇸',
  'Reino Unido': '🇬🇧',
  'França': '🇫🇷',
  'Alemanha': '🇩🇪',
  'Itália': '🇮🇹',
  'Espanha': '🇪🇸',
  'Portugal': '🇵🇹',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colômbia': '🇨🇴',
  'México': '🇲🇽',
  'Peru': '🇵🇪',
  'Uruguai': '🇺🇾',
  'Paraguai': '🇵🇾',
  'Venezuela': '🇻🇪',
  'Equador': '🇪🇨',
  'Bolívia': '🇧🇴',
  'Japão': '🇯🇵',
  'China': '🇨🇳',
  'Índia': '🇮🇳',
  'Coreia do Sul': '🇰🇷',
  'Coreia do Norte': '🇰🇵',
  'Tailândia': '🇹🇭',
  'Vietnã': '🇻🇳',
  'Indonésia': '🇮🇩',
  'Malásia': '🇲🇾',
  'Singapura': '🇸🇬',
  'Filipinas': '🇵🇭',
  'Austrália': '🇦🇺',
  'Nova Zelândia': '🇳🇿',
  'Rússia': '🇷🇺',
  'Turquia': '🇹🇷',
  'Grécia': '🇬🇷',
  'Países Baixos': '🇳🇱',
  'Holanda': '🇳🇱',
  'Bélgica': '🇧🇪',
  'Suíça': '🇨🇭',
  'Áustria': '🇦🇹',
  'Suécia': '🇸🇪',
  'Noruega': '🇳🇴',
  'Dinamarca': '🇩🇰',
  'Finlândia': '🇫🇮',
  'Polônia': '🇵🇱',
  'República Tcheca': '🇨🇿',
  'Hungria': '🇭🇺',
  'Romênia': '🇷🇴',
  'Bulgária': '🇧🇬',
  'Croácia': '🇭🇷',
  'Sérvia': '🇷🇸',
  'Eslováquia': '🇸🇰',
  'Eslovênia': '🇸🇮',
  'Irlanda': '🇮🇪',
  'Islândia': '🇮🇸',
  'Luxemburgo': '🇱🇺',
  'Mônaco': '🇲🇨',
  'Liechtenstein': '🇱🇮',
  'Andorra': '🇦🇩',
  'San Marino': '🇸🇲',
  'Vaticano': '🇻🇦',
  'Malta': '🇲🇹',
  'Chipre': '🇨🇾',
  'Egito': '🇪🇬',
  'África do Sul': '🇿🇦',
  'Marrocos': '🇲🇦',
  'Tunísia': '🇹🇳',
  'Turquemenistão': '🇹🇲',
  'Argélia': '🇩🇿',
  'Quênia': '🇰🇪',
  'Etiópia': '🇪🇹',
  'Nigéria': '🇳🇬',
  'Gana': '🇬🇭',
  'Senegal': '🇸🇳',
  'Costa Rica': '🇨🇷',
  'Panamá': '🇵🇦',
  'Guatemala': '🇬🇹',
  'Honduras': '🇭🇳',
  'Nicarágua': '🇳🇮',
  'El Salvador': '🇸🇻',
  'Cuba': '🇨🇺',
  'República Dominicana': '🇩🇴',
  'Jamaica': '🇯🇲',
  'Trinidad e Tobago': '🇹🇹',
  'Bahamas': '🇧🇸',
  'Barbados': '🇧🇧',
  'Israel': '🇮🇱',
  'Emirados Árabes Unidos': '🇦🇪',
  'Arábia Saudita': '🇸🇦',
  'Catar': '🇶🇦',
  'Kuwait': '🇰🇼',
  'Omã': '🇴🇲',
  'Bahrein': '🇧🇭',
  'Jordânia': '🇯🇴',
  'Líbano': '🇱🇧',
  'Síria': '🇸🇾',
  'Iraque': '🇮🇶',
  'Irã': '🇮🇷',
  'Paquistão': '🇵🇰',
  'Bangladesh': '🇧🇩',
  'Sri Lanka': '🇱🇰',
  'Nepal': '🇳🇵',
  'Butão': '🇧🇹',
  'Myanmar': '🇲🇲',
  'Camboja': '🇰🇭',
  'Laos': '🇱🇦',
  'Mongólia': '🇲🇳',
  'Cazaquistão': '🇰🇿',
  'Uzbequistão': '🇺🇿',
  'Geórgia': '🇬🇪',
  'Armênia': '🇦🇲',
  'Azerbaijão': '🇦🇿',
  'Ucrânia': '🇺🇦',
  'Bielorrússia': '🇧🇾',
  'Lituânia': '🇱🇹',
  'Letônia': '🇱🇻',
  'Estônia': '🇪🇪',
  'Moldávia': '🇲🇩',
  'Albânia': '🇦🇱',
  'Macedônia do Norte': '🇲🇰',
  'Bósnia e Herzegovina': '🇧🇦',
  'Montenegro': '🇲🇪',
  'Kosovo': '🇽🇰',
  'Groenlândia': '🇬🇱',
  'Canadá': '🇨🇦',
  'Tchéquia': '🇨🇿',
  'Polónia': '🇵🇱',
  'Suriname': '🇸🇷',
  'Guiana': '🇬🇾',
  'Palestina': '🇵🇸',  
  'Territórios Palestinianos': '🇵🇸',
  
  // Países em inglês (fallback)
  'Brazil': '🇧🇷',
  'United States': '🇺🇸',
  'United States of America': '🇺🇸',
  'USA': '🇺🇸',
  'US': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'France': '🇫🇷',
  'Germany': '🇩🇪',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Colombia': '🇨🇴',
  'Mexico': '🇲🇽',
  'Uruguay': '🇺🇾',
  'Paraguay': '🇵🇾',
  'Ecuador': '🇪🇨',
  'Bolivia': '🇧🇴',
  'Japan': '🇯🇵',
  'India': '🇮🇳',
  'South Korea': '🇰🇷',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Indonesia': '🇮🇩',
  'Malaysia': '🇲🇾',
  'Singapore': '🇸🇬',
  'Philippines': '🇵🇭',
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿',
  'Russia': '🇷🇺',
  'Turkey': '🇹🇷',
  'Greece': '🇬🇷',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'Switzerland': '🇨🇭',
  'Austria': '🇦🇹',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Poland': '🇵🇱',
  'Czech Republic': '🇨🇿',
  'Hungary': '🇭🇺',
  'Romania': '🇷🇴',
  'Bulgaria': '🇧🇬',
  'Croatia': '🇭🇷',
  'Serbia': '🇷🇸',
  'Slovakia': '🇸🇰',
  'Slovenia': '🇸🇮',
  'Ireland': '🇮🇪',
  'Iceland': '🇮🇸',
  'Luxembourg': '🇱🇺',
  'Monaco': '🇲🇨',
  'Vatican': '🇻🇦',
  'Vatican City': '🇻🇦',
  'Cyprus': '🇨🇾',
  'Egypt': '🇪🇬',
  'South Africa': '🇿🇦',
  'Morocco': '🇲🇦',
  'Tunisia': '🇹🇳',
  'Algeria': '🇩🇿',
  'Kenya': '🇰🇪',
  'Ethiopia': '🇪🇹',
  'Nigeria': '🇳🇬',
  'Ghana': '🇬🇭',
  'Panama': '🇵🇦',
  'Nicaragua': '🇳🇮',
  'Dominican Republic': '🇩🇴',
  'Trinidad and Tobago': '🇹🇹',
  'United Arab Emirates': '🇦🇪',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Qatar': '🇶🇦',
  'Oman': '🇴🇲',
  'Bahrain': '🇧🇭',
  'Jordan': '🇯🇴',
  'Lebanon': '🇱🇧',
  'Syria': '🇸🇾',
  'Iraq': '🇮🇶',
  'Iran': '🇮🇷',
  'Pakistan': '🇵🇰',
  'Bhutan': '🇧🇹',
  'Cambodia': '🇰🇭',
  'Mongolia': '🇲🇳',
  'Kazakhstan': '🇰🇿',
  'Uzbekistan': '🇺🇿',
  'Georgia': '🇬🇪',
  'Armenia': '🇦🇲',
  'Azerbaijan': '🇦🇿',
  'Ukraine': '🇺🇦',
  'Belarus': '🇧🇾',
  'Lithuania': '🇱🇹',
  'Latvia': '🇱🇻',
  'Estonia': '🇪🇪',
  'Moldova': '🇲🇩',
  'Albania': '🇦🇱',
  'North Macedonia': '🇲🇰',
  'Bosnia and Herzegovina': '🇧🇦',
  'Greenland': '🇬🇱',
  'Canada': '🇨🇦',
};

function normalizeCountryNameForLookup(value?: string): string | undefined {
  if (!value) return undefined;

  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  return normalized || undefined;
}

function decodeFlagToCountryCode(flag: string): string | undefined {
  const chars = Array.from(flag);
  if (chars.length !== 2) return undefined;

  const code = chars
    .map((char) => String.fromCharCode(char.codePointAt(0)! - 127397))
    .join('');

  return /^[A-Z]{2}$/.test(code) ? code : undefined;
}

const countryNameToCodeFromFlags = (() => {
  const map = new Map<string, string>();

  Object.entries(countryFlags).forEach(([countryName, flag]) => {
    const normalizedName = normalizeCountryNameForLookup(countryName);
    const code = decodeFlagToCountryCode(flag);
    if (normalizedName && code && !map.has(normalizedName)) {
      map.set(normalizedName, code);
    }
  });

  return map;
})();

export function inferCountryCodeFromCountryName(countryName?: string): string | undefined {
  const normalizedName = normalizeCountryNameForLookup(countryName);
  if (!normalizedName) return undefined;

  return countryNameToCodeFromFlags.get(normalizedName);
}

/**
 * Retorna o emoji da bandeira para um país
 * @param countryName - Nome do país (em português ou inglês)
 * @returns Emoji da bandeira ou 🗺️ se não encontrado
 */
export function getCountryFlag(countryName: string | undefined): string {
  if (!countryName) return '🗺️';
  
  // Tenta encontrar o país exato (case-insensitive)
  const normalized = countryName.trim();
  const flag = countryFlags[normalized] || countryFlags[normalized.toLowerCase()];
  
  if (flag) return flag;
  
  // Tenta encontrar por substring (para casos como "United States" vs "United States of America")
  const found = Object.keys(countryFlags).find(key => 
    normalized.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(normalized.toLowerCase())
  );
  
  if (found) return countryFlags[found];
  
  // Fallback: retorna emoji genérico de mapa
  return '🗺️';
}

/**
 * Retorna o emoji da bandeira a partir de código ISO 3166-1 alpha-2
 * @param countryCode - Ex.: BR, US, IT
 * @returns Emoji da bandeira ou undefined se código inválido
 */
export function getCountryFlagByCode(countryCode: string | undefined): string | undefined {
  if (!countryCode) return undefined;

  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return undefined;

  const flag = String.fromCodePoint(
    ...Array.from(code).map((char) => 127397 + char.charCodeAt(0))
  );

  return flag;
}

