-- ============================================
-- PLACES PRIVILEGES HARDENING
-- ============================================
-- Run once in Supabase SQL Editor.
-- Keeps authenticated CRUD working via RLS policies
-- while fully removing anon table privileges.

BEGIN;

REVOKE ALL ON TABLE public.places FROM anon;
REVOKE ALL ON TABLE public.places FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.places TO authenticated;

COMMIT;
