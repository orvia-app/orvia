-- PROPOSAL ONLY: outside the active migration stream; not deployed.
-- Preserve application CRUD, service_role, analytics and existing RLS/triggers.
begin;

revoke truncate, references, trigger, maintain
on table public.tasks, public.notes, public.captures, public.activities, public.feedback
from public, anon, authenticated;

-- Current application tables are owned/created by postgres.
-- Defaults apply to future objects created by this role, not other owners.
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain on tables
  from public, anon, authenticated;

-- supabase_admin is platform-managed. Its defaults are intentionally unchanged;
-- future tables created as that role require a separate supported privilege review.
commit;
