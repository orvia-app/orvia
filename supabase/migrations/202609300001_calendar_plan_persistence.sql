-- Calendar + Plan Batch 2: nullable Task scheduling fields and owner-owned Events.
-- This forward migration does not assign owners to legacy Tasks or change due_date.

alter table public.tasks
  add column planned_start timestamptz,
  add column estimated_duration_minutes integer,
  add column plan_day date,
  add constraint tasks_estimated_duration_minutes_check
    check (estimated_duration_minutes is null or
           estimated_duration_minutes between 1 and 10080);

comment on column public.tasks.planned_start is
  'UTC instant for intended work start; independent of due_date.';
comment on column public.tasks.plan_day is
  'Explicit local planning date, never inferred from due_date.';

create index tasks_user_plan_day_active_idx
  on public.tasks (user_id, plan_day)
  where deleted_at is null and plan_day is not null;

create index tasks_user_planned_start_active_idx
  on public.tasks (user_id, planned_start)
  where deleted_at is null and planned_start is not null;

-- lifecycle_status distinguishes active and archived/deleted records. This
-- column does not decide recovery, retention, or when a hard DELETE is used.
create table public.orvia_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  all_day boolean not null,
  timezone text not null,
  busy boolean not null default true,
  start_at timestamptz,
  end_at timestamptz,
  start_date date,
  end_date_exclusive date,
  lifecycle_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orvia_events_title_check
    check (length(btrim(title)) between 1 and 200),
  constraint orvia_events_timezone_check
    check (length(btrim(timezone)) between 1 and 200),
  constraint orvia_events_lifecycle_status_check
    check (lifecycle_status in ('active', 'archived', 'deleted')),
  constraint orvia_events_temporal_variant_check check (
    (all_day = false and start_at is not null and end_at is not null
      and end_at > start_at and start_date is null and end_date_exclusive is null)
    or
    (all_day = true and start_at is null and end_at is null
      and start_date is not null and end_date_exclusive is not null
      and end_date_exclusive > start_date)
  )
);

comment on table public.orvia_events is
  'User-owned Orvia Events. Lifecycle status supports active filtering; recovery and retention remain open product decisions.';
comment on column public.orvia_events.timezone is
  'Required IANA timezone identifier; validate actual zone at the future API boundary.';

create trigger orvia_events_set_updated_at
  before update on public.orvia_events
  for each row execute function public.set_updated_at();

create index orvia_events_owner_timed_active_idx
  on public.orvia_events (user_id, start_at, end_at)
  where lifecycle_status = 'active' and all_day = false;

create index orvia_events_owner_all_day_active_idx
  on public.orvia_events (user_id, start_date, end_date_exclusive)
  where lifecycle_status = 'active' and all_day = true;

alter table public.orvia_events enable row level security;

create policy orvia_events_select_own on public.orvia_events
  for select to authenticated
  using (user_id = auth.uid());

create policy orvia_events_insert_own on public.orvia_events
  for insert to authenticated
  with check (user_id = auth.uid());

create policy orvia_events_update_own on public.orvia_events
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy orvia_events_delete_own on public.orvia_events
  for delete to authenticated
  using (user_id = auth.uid());

-- Explicit grants avoid inheriting broad runtime-table defaults. RLS protects
-- authenticated access; service_role bypasses RLS, so future server routes
-- must derive user_id from auth and filter every read/write by that owner.
revoke all on table public.orvia_events from public, anon, authenticated;
grant select, insert, update, delete on table public.orvia_events to authenticated;
grant select, insert, update, delete on table public.orvia_events to service_role;
