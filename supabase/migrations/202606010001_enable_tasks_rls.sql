-- Orvia tasks RLS hardening.
-- Enables owner-only row level security for public.tasks without claiming
-- legacy rows where user_id is null and without changing the table shape.

alter table public.tasks enable row level security;

drop policy if exists "Allow public read tasks" on public.tasks;
drop policy if exists tasks_select_own on public.tasks;
create policy tasks_select_own on public.tasks
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists tasks_insert_own on public.tasks;
create policy tasks_insert_own on public.tasks
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists tasks_update_own on public.tasks;
create policy tasks_update_own on public.tasks
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists tasks_delete_own on public.tasks;
create policy tasks_delete_own on public.tasks
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on table public.tasks is
  'User-owned tasks. RLS allows authenticated users to access only rows where user_id matches auth.uid(). Legacy null-owner rows remain untouched and inaccessible through owner policies.';
