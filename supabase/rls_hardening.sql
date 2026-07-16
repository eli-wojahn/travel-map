-- ============================================
-- RLS HARDENING FOR SUPABASE SECURITY ADVISOR
-- ============================================
-- Run this once in Supabase SQL Editor to fix:
-- - rls_disabled_in_public on public.spatial_ref_sys
-- - rls_disabled_in_public on public.geocoding_cache
-- ============================================

BEGIN;

-- 1) PostGIS metadata table in public schema
-- Some projects cannot alter extension-owned tables; ignore that case gracefully.
DO $$
BEGIN
  BEGIN
    ALTER TABLE IF EXISTS public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public.spatial_ref_sys FROM anon, authenticated;
    DROP POLICY IF EXISTS spatial_ref_sys_service_role_all ON public.spatial_ref_sys;
    CREATE POLICY spatial_ref_sys_service_role_all
      ON public.spatial_ref_sys
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipping hardening for public.spatial_ref_sys (owner privileges required).';
  END;
END
$$;

-- 2) Geocoding cache table
DO $$
BEGIN
  IF to_regclass('public.geocoding_cache') IS NOT NULL THEN
    ALTER TABLE public.geocoding_cache ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public.geocoding_cache FROM anon, authenticated;
    DROP POLICY IF EXISTS geocoding_cache_service_role_all ON public.geocoding_cache;
    CREATE POLICY geocoding_cache_service_role_all
      ON public.geocoding_cache
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  ELSE
    RAISE NOTICE 'Skipping hardening for public.geocoding_cache (table not found).';
  END IF;
END
$$;

COMMIT;
