# Supabase Support Ticket - spatial_ref_sys RLS

## Summary
Security Advisor reports rls_disabled_in_public on public.spatial_ref_sys.
Project SQL role cannot remediate owner-level privileges on this extension-owned table.

## Error observed
- SQLSTATE: 42501
- Message: must be owner of table spatial_ref_sys

## Current exposure evidence
The following privileges are still granted on public.spatial_ref_sys:
- anon: SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
- authenticated: SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER

## Requested remediation (owner-level)
Please apply remediation on this project for public.spatial_ref_sys:
1. Enable RLS on public.spatial_ref_sys
2. Remove table grants for anon and authenticated
3. Keep access restricted to privileged internal role(s) only

## Ticket body (copy/paste)
Hello team,

Security Advisor reports rls_disabled_in_public on public.spatial_ref_sys in our project.

We attempted remediation through SQL Editor, but owner-level operations fail with:
SQLSTATE 42501: must be owner of table spatial_ref_sys.

Current grants still show anon/authenticated privileges on this table.
Please apply owner-level remediation in this project:
- enable RLS on public.spatial_ref_sys
- remove anon/authenticated table grants

Thanks.

## Internal references
- Hardening script: supabase/rls_hardening.sql
- Diagnostic script: supabase/fix_spatial_ref_sys_rls.sql
