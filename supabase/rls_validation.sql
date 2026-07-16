-- ============================================
-- RLS VALIDATION CHECKLIST (POST-FIX)
-- ============================================
-- Run after rls_hardening.sql to verify:
-- 1) RLS is enabled
-- 2) Policies are present
-- 3) anon/authenticated do not have table privileges
-- ============================================

-- 1) RLS enabled status
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('spatial_ref_sys', 'geocoding_cache')
  AND c.relkind = 'r'
ORDER BY c.relname;

-- 2) Policies present for target tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('spatial_ref_sys', 'geocoding_cache')
ORDER BY tablename, policyname;

-- 3) Effective table privileges for API roles
SELECT
  table_schema,
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('spatial_ref_sys', 'geocoding_cache')
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;

-- 4) Optional: quick pass/fail summary
WITH target AS (
  SELECT 'public'::text AS schema_name, 'spatial_ref_sys'::text AS table_name
  UNION ALL
  SELECT 'public', 'geocoding_cache'
),
rls_ok AS (
  SELECT n.nspname AS schema_name, c.relname AS table_name,
         (c.relrowsecurity IS TRUE) AS ok
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN ('spatial_ref_sys', 'geocoding_cache')
    AND c.relkind = 'r'
),
grant_bad AS (
  SELECT table_schema AS schema_name, table_name,
         COUNT(*) AS bad_grants
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name IN ('spatial_ref_sys', 'geocoding_cache')
    AND grantee IN ('anon', 'authenticated')
  GROUP BY table_schema, table_name
)
SELECT
  t.schema_name,
  t.table_name,
  COALESCE(r.ok, FALSE) AS rls_enabled,
  COALESCE(g.bad_grants, 0) AS anon_auth_grants,
  CASE
    WHEN COALESCE(r.ok, FALSE) IS TRUE AND COALESCE(g.bad_grants, 0) = 0 THEN 'PASS'
    ELSE 'FAIL'
  END AS status
FROM target t
LEFT JOIN rls_ok r
  ON r.schema_name = t.schema_name AND r.table_name = t.table_name
LEFT JOIN grant_bad g
  ON g.schema_name = t.schema_name AND g.table_name = t.table_name
ORDER BY t.table_name;
