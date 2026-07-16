-- ============================================
-- RLS AUDIT FOR APPLICATION TABLES (PUBLIC)
-- ============================================
-- Focuses on real app risk by excluding common PostGIS metadata tables.

WITH extension_tables AS (
  SELECT unnest(ARRAY[
    'spatial_ref_sys',
    'geometry_columns',
    'geography_columns',
    'raster_columns',
    'raster_overviews'
  ]) AS table_name
),
public_tables AS (
  SELECT n.nspname AS schema_name, c.relname AS table_name, c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
),
app_tables AS (
  SELECT p.*
  FROM public_tables p
  LEFT JOIN extension_tables e ON e.table_name = p.table_name
  WHERE e.table_name IS NULL
),
grants_by_role AS (
  SELECT
    table_schema AS schema_name,
    table_name,
    COUNT(*) FILTER (WHERE grantee = 'anon') AS anon_grants,
    COUNT(*) FILTER (WHERE grantee = 'authenticated') AS authenticated_grants
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee IN ('anon', 'authenticated')
  GROUP BY table_schema, table_name
)
SELECT
  a.schema_name,
  a.table_name,
  a.rls_enabled,
  COALESCE(g.anon_grants, 0) AS anon_grants,
  COALESCE(g.authenticated_grants, 0) AS authenticated_grants,
  CASE
    WHEN a.rls_enabled IS TRUE AND COALESCE(g.anon_grants, 0) = 0 THEN 'PASS'
    ELSE 'REVIEW'
  END AS status
FROM app_tables a
LEFT JOIN grants_by_role g
  ON g.schema_name = a.schema_name AND g.table_name = a.table_name
ORDER BY a.table_name;
