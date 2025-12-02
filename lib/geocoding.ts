import { GeocodeResult } from '@/types';

/**
 * Geocodifica o nome de uma cidade usando a API Nominatim (OpenStreetMap)
 * Esta é uma API gratuita e open-source, sem necessidade de chave API
 * 
 * @param cityName - Nome da cidade a ser geocodificada
 * @returns Promise com os dados da cidade (nome, país, coordenadas)
 * @throws Error se a cidade não for encontrada ou houver erro na API
 */
export async function geocodeCity(cityName: string): Promise<GeocodeResult> {
  // Remove espaços extras e codifica para URL
  const encodedCity = encodeURIComponent(cityName.trim());
  
  // URL da API Nominatim (OpenStreetMap)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedCity}&limit=1&addressdetails=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LugaresDoMundo/1.0', // Nominatim requer User-Agent
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error(`Cidade "${cityName}" não encontrada`);
    }
    
    const result = data[0];
    
    // Extrai o nome da cidade e país
    const name = result.display_name.split(',')[0]; // Primeira parte do display_name geralmente é a cidade
    const country = result.address?.country || undefined;
    const state =
      result.address?.state ||
      result.address?.state_district ||
      result.address?.region ||
      undefined;
    
    return {
      name: name || cityName, // Fallback para o nome original se não houver
      state,
      country,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro desconhecido ao geocodificar a cidade');
  }
}

