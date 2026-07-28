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
    RAISE NOTICE 'RLS hardening applied on public.spatial_ref_sys';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Unable to alter public.spatial_ref_sys: current role is not table owner. Open Supabase support ticket and request owner-level remediation.';
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

-- 3) Diagnostics for extension-owned exception handling
-- Use this output in the support ticket if Security Advisor still flags spatial_ref_sys.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  pg_get_userbyid(c.relowner) AS table_owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'spatial_ref_sys'
  AND c.relkind = 'r';

SELECT
  e.extname AS extension_name,
  pg_get_userbyid(e.extowner) AS extension_owner
FROM pg_extension e
WHERE e.extname = 'postgis';

SELECT
  table_schema,
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'spatial_ref_sys'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;
