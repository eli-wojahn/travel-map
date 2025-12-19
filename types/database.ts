/**
 * Tipos gerados automaticamente do schema do Supabase
 * Representa a estrutura do banco de dados
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      places: {
        Row: {
          id: string
          user_id: string
          name: string
          state: string | null
          country: string | null
          latitude: number
          longitude: number
          address_full: string | null
          notes: string | null
          photos: string[] | null
          visit_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          state?: string | null
          country?: string | null
          latitude: number
          longitude: number
          address_full?: string | null
          notes?: string | null
          photos?: string[] | null
          visit_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          state?: string | null
          country?: string | null
          latitude?: number
          longitude?: number
          address_full?: string | null
          notes?: string | null
          photos?: string[] | null
          visit_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      geocoding_cache: {
        Row: {
          id: string
          query: string
          result: Json
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          query: string
          result: Json
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          query?: string
          result?: Json
          created_at?: string
          expires_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      nearby_places: {
        Args: {
          lat: number
          lng: number
          radius_km?: number
          user_uuid?: string
        }
        Returns: {
          id: string
          name: string
          country: string | null
          latitude: number
          longitude: number
          distance_km: number
        }[]
      }
      user_travel_stats: {
        Args: {
          user_uuid: string
        }
        Returns: {
          total_places: number
          total_countries: number
          total_cities: number
          countries_list: string[]
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
