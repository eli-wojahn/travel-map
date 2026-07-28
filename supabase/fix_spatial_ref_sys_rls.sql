-- ============================================================
-- Fix: Supabase Security Advisor - rls_disabled_in_public
-- Target: public.spatial_ref_sys
-- ============================================================
-- Run in Supabase SQL Editor with a role that can ALTER this table.
-- If your role cannot alter extension-owned tables, open a Supabase support
-- ticket and request enabling RLS on public.spatial_ref_sys.

BEGIN;

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

  -- Defense in depth: remove direct table grants from API roles.
  REVOKE ALL ON TABLE public.spatial_ref_sys FROM anon, authenticated;

  -- Optional explicit policy for service role operations.
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
    RAISE NOTICE 'Unable to alter public.spatial_ref_sys: current role is not table owner. Open Supabase support ticket and request RLS enablement for this table.';
END
$$;

COMMIT;

-- Validation
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

-- Extra context for support ticket.
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
