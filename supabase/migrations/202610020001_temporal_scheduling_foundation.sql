-- Orvia beta Batch 1: persisted planning preferences and normalized Task plan blocks.
-- Existing tasks.planned_start and tasks.plan_day remain as a compatibility source only.

create table public.planning_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  planning_timezone text not null,
  enabled_weekdays smallint[] not null default array[1, 2, 3, 4, 5]::smallint[],
  local_start_time time without time zone not null default time '09:00',
  local_end_time time without time zone not null default time '18:00',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planning_preferences_timezone_check
    check (length(btrim(planning_timezone)) between 1 and 200),
  constraint planning_preferences_weekdays_check
    check (
      cardinality(enabled_weekdays) <= 7
      and enabled_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
    ),
  constraint planning_preferences_window_check
    check (local_end_time > local_start_time),
  constraint planning_preferences_version_check
    check (version > 0)
);

comment on table public.planning_preferences is
  'Account-owned planning timezone and weekly planning window. ISO weekdays use Monday=1 through Sunday=7.';
comment on column public.planning_preferences.planning_timezone is
  'Authoritative account planning timezone after the user saves preferences; validated as IANA at the API boundary.';

create trigger planning_preferences_set_updated_at
  before update on public.planning_preferences
  for each row execute function public.set_updated_at();

alter table public.planning_preferences enable row level security;

create policy planning_preferences_select_own on public.planning_preferences
  for select to authenticated
  using (user_id = auth.uid());

create policy planning_preferences_insert_own on public.planning_preferences
  for insert to authenticated
  with check (user_id = auth.uid());

create policy planning_preferences_update_own on public.planning_preferences
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy planning_preferences_delete_own on public.planning_preferences
  for delete to authenticated
  using (user_id = auth.uid());

revoke all on table public.planning_preferences from public, anon, authenticated;
grant select, insert, update, delete on table public.planning_preferences to authenticated;
grant select, insert, update, delete on table public.planning_preferences to service_role;

-- The composite key lets block ownership be enforced by a real foreign key even
-- while legacy Task rows may still have a null user_id.
alter table public.tasks
  add constraint tasks_user_id_id_unique unique (user_id, id);

create table public.task_plan_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_plan_blocks_owner_task_fkey
    foreign key (user_id, task_id)
    references public.tasks (user_id, id)
    on delete cascade,
  constraint task_plan_blocks_interval_check
    check (end_at > start_at and end_at <= start_at + interval '7 days'),
  constraint task_plan_blocks_version_check
    check (version > 0),
  constraint task_plan_blocks_exact_interval_unique
    unique (user_id, task_id, start_at, end_at)
);

comment on table public.task_plan_blocks is
  'Authoritative planned Task intervals. One Task may own zero, one, or many blocks.';
comment on column public.task_plan_blocks.start_at is
  'UTC-backed timestamptz start instant; displayed local date comes from the active planning timezone.';

create trigger task_plan_blocks_set_updated_at
  before update on public.task_plan_blocks
  for each row execute function public.set_updated_at();

create index task_plan_blocks_owner_task_idx
  on public.task_plan_blocks (user_id, task_id, start_at);

create index task_plan_blocks_owner_time_idx
  on public.task_plan_blocks (user_id, start_at, end_at);

alter table public.task_plan_blocks enable row level security;

create policy task_plan_blocks_select_own on public.task_plan_blocks
  for select to authenticated
  using (user_id = auth.uid());

create policy task_plan_blocks_insert_own on public.task_plan_blocks
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tasks
      where tasks.id = task_plan_blocks.task_id
        and tasks.user_id = auth.uid()
        and tasks.deleted_at is null
    )
  );

create policy task_plan_blocks_update_own on public.task_plan_blocks
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tasks
      where tasks.id = task_plan_blocks.task_id
        and tasks.user_id = auth.uid()
        and tasks.deleted_at is null
    )
  );

create policy task_plan_blocks_delete_own on public.task_plan_blocks
  for delete to authenticated
  using (user_id = auth.uid());

revoke all on table public.task_plan_blocks from public, anon, authenticated;
grant select, insert, update, delete on table public.task_plan_blocks to authenticated;
grant select, insert, update, delete on table public.task_plan_blocks to service_role;
