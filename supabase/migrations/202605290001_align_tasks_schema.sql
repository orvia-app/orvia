-- Orvia tasks schema alignment.
-- This migration safely moves the current production tasks table toward the
-- SaaS-ready repository schema without requiring auth, RLS, or a workspace_id
-- type conversion yet.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Reusable updated_at trigger helper for Orvia tables.';

alter table public.tasks
  add column if not exists due_date date,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists sync_status text not null default 'synced',
  add column if not exists version integer not null default 1,
  add column if not exists device_id text,
  add column if not exists source text not null default 'local',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists user_id uuid references auth.users(id) on delete set null;

comment on column public.tasks.user_id is
  'Nullable until auth/user ownership migration is implemented.';

comment on column public.tasks.workspace_id is
  'Kept as text for now to preserve legacy local workspace ids such as 1, 2, and 3.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_status_check'
  ) then
    alter table public.tasks
      add constraint tasks_status_check
      check (status in ('todo', 'in-progress', 'done'))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_priority_check'
  ) then
    alter table public.tasks
      add constraint tasks_priority_check
      check (priority in ('low', 'medium', 'high', 'critical'))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_sync_status_check'
  ) then
    alter table public.tasks
      add constraint tasks_sync_status_check
      check (sync_status in ('local', 'queued', 'syncing', 'synced', 'conflict', 'failed', 'deleted'))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_version_check'
  ) then
    alter table public.tasks
      add constraint tasks_version_check
      check (version > 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_metadata_object_check'
  ) then
    alter table public.tasks
      add constraint tasks_metadata_object_check
      check (jsonb_typeof(metadata) = 'object')
      not valid;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.tasks'::regclass
      and tgname = 'tasks_set_updated_at'
  ) then
    execute '
      create trigger tasks_set_updated_at
        before update on public.tasks
        for each row
        execute function public.set_updated_at()
    ';
  end if;
end;
$$;

create index if not exists tasks_user_id_idx
  on public.tasks (user_id);

create index if not exists tasks_workspace_id_idx
  on public.tasks (workspace_id);

create index if not exists tasks_deleted_at_idx
  on public.tasks (deleted_at);

create index if not exists tasks_updated_at_idx
  on public.tasks (updated_at desc);

create index if not exists tasks_status_deleted_at_idx
  on public.tasks (status, deleted_at);

create index if not exists tasks_priority_deleted_at_idx
  on public.tasks (priority, deleted_at);

create index if not exists tasks_due_date_idx
  on public.tasks (due_date);

create index if not exists tasks_tags_idx
  on public.tasks using gin (tags);
