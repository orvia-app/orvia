-- Orvia runtime authenticated table grants.
--
-- PostgreSQL table privileges are required before Row Level Security policies
-- can evaluate authenticated direct-client requests. These grants do not
-- expose cross-user rows: RLS remains enabled and owner-only policies still
-- enforce user_id = auth.uid() for each operation.
--
-- Do not grant these runtime user-owned tables to anon.

grant select, insert, update, delete
  on table public.tasks,
           public.notes,
           public.captures,
           public.activities
  to authenticated;
