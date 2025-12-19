-- ============================================
-- TRAVEL MAP - DATABASE SCHEMA
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Cole e Execute
-- ============================================

-- 1. Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create places table
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  state TEXT,
  country TEXT,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  address_full TEXT,
  notes TEXT,
  photos TEXT[],
  visit_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_places_user_id ON places(user_id);
CREATE INDEX IF NOT EXISTS idx_places_country ON places(user_id, country);
CREATE INDEX IF NOT EXISTS idx_places_created_at ON places(user_id, created_at DESC);

-- Geospatial index using PostGIS
CREATE INDEX IF NOT EXISTS idx_places_coords ON places USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- 4. Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
-- Users can only view their own places
CREATE POLICY "Users can view own places"
  ON places FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert places for themselves
CREATE POLICY "Users can insert own places"
  ON places FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own places
CREATE POLICY "Users can update own places"
  ON places FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own places
CREATE POLICY "Users can delete own places"
  ON places FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create function to find nearby places
CREATE OR REPLACE FUNCTION nearby_places(
  lat DECIMAL,
  lng DECIMAL,
  radius_km INTEGER DEFAULT 50,
  user_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  country TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.country,
    p.latitude,
    p.longitude,
    ROUND(
      ST_Distance(
        ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
      ) / 1000, 2
    ) AS distance_km
  FROM places p
  WHERE 
    (user_uuid IS NULL OR p.user_id = user_uuid)
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function for user statistics
CREATE OR REPLACE FUNCTION user_travel_stats(user_uuid UUID)
RETURNS TABLE (
  total_places BIGINT,
  total_countries BIGINT,
  total_cities BIGINT,
  countries_list TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_places,
    COUNT(DISTINCT country)::BIGINT as total_countries,
    COUNT(DISTINCT name)::BIGINT as total_cities,
    ARRAY_AGG(DISTINCT country) FILTER (WHERE country IS NOT NULL) as countries_list
  FROM places
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 9. Create geocoding cache table (optional - for performance)
CREATE TABLE IF NOT EXISTS geocoding_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT UNIQUE NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_geocoding_cache_query ON geocoding_cache(query);
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_expires ON geocoding_cache(expires_at);

-- Auto-delete expired cache entries (runs daily)
CREATE OR REPLACE FUNCTION delete_expired_geocoding_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM geocoding_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SETUP COMPLETO! ✅
-- ============================================
-- Próximos passos:
-- 1. Configure Google OAuth em Authentication > Providers
-- 2. Instale as dependências no projeto: npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
-- 3. Configure as variáveis de ambiente no .env.local
-- ============================================
