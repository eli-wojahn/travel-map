/**
 * Tipo que representa um lugar visitado
 */
export interface Place {
  id: string; // ID único gerado automaticamente
  name: string; // Nome da cidade
  state?: string; // Estado / região (opcional)
  country?: string; // País (opcional, pode não estar disponível na geocodificação)
  countryCode?: string; // Código ISO 3166-1 alpha-2 (ex.: BR, US)
  latitude: number; // Latitude
  longitude: number; // Longitude
  createdAt: string; // Data de criação em formato ISO
}

/**
 * Resposta da API de geocodificação (Nominatim/OSM)
 */
export interface GeocodeResult {
  name: string;
  state?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

