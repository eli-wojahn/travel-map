-- Add language-independent country identity to places
-- Run once in Supabase SQL editor
ALTER TABLE public.places
ADD COLUMN IF NOT EXISTS country_code text;

-- Backfill from existing country names is intentionally skipped because names can be localized.
-- New/updated rows should populate country_code from geocoding source (ISO 3166-1 alpha-2).

CREATE INDEX IF NOT EXISTS idx_places_country_code ON public.places(country_code);
