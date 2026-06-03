-- Orvia Inbox/Capture cloud foundation.
-- Creates or aligns public.captures as a lean user-owned Inbox entity.
-- This does not migrate local quick captures or change the current Inbox UI.

create table if not exists public.captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  source text not null default 'manual',
  status text not null default 'inbox',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.captures
  add column if not exists content text,
  add column if not exists source text not null default 'manual',
  add column if not exists status text not null default 'inbox',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'captures'
      and column_name = 'raw_text'
  ) then
    update public.captures
    set content = raw_text
    where content is null
      and raw_text is not null;
  end if;
end $$;

alter table public.captures
  drop constraint if exists captures_content_non_empty_check,
  drop constraint if exists captures_source_check,
  drop constraint if exists captures_status_check,
  drop constraint if exists captures_metadata_object_check;

alter table public.captures
  add constraint captures_content_non_empty_check
    check (content is not null and length(btrim(content)) > 0) not valid,
  add constraint captures_source_check
    check (source in ('quick_capture', 'manual', 'import', 'telegram', 'system')) not valid,
  add constraint captures_status_check
    check (status in ('inbox', 'processed', 'archived')) not valid,
  add constraint captures_metadata_object_check
    check (jsonb_typeof(metadata) = 'object') not valid;

comment on table public.captures is
  'User-owned Inbox captures prepared for cloud-backed capture workflows. Existing local quick captures are not migrated by this migration.';
comment on column public.captures.content is
  'Raw capture text shown in Inbox and future processing queues.';
comment on column public.captures.source is
  'Capture origin such as manual, quick_capture, import, telegram, or system.';
comment on column public.captures.status is
  'Capture lifecycle state: inbox, processed, or archived.';

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.captures'::regclass
      and tgname = 'captures_set_updated_at'
  ) then
    create trigger captures_set_updated_at
      before update on public.captures
      for each row
      execute function public.set_updated_at();
  end if;
end $$;

create index if not exists captures_user_id_idx
  on public.captures (user_id);

create index if not exists captures_status_idx
  on public.captures (status);

create index if not exists captures_created_at_idx
  on public.captures (created_at desc);

create index if not exists captures_updated_at_idx
  on public.captures (updated_at desc);

create index if not exists captures_deleted_at_idx
  on public.captures (deleted_at);

create index if not exists captures_source_idx
  on public.captures (source);

alter table public.captures enable row level security;

drop policy if exists captures_select_own on public.captures;
drop policy if exists captures_insert_own on public.captures;
drop policy if exists captures_update_own on public.captures;
drop policy if exists captures_delete_own on public.captures;

create policy captures_select_own on public.captures
  for select
  to authenticated
  using (user_id = auth.uid());

create policy captures_insert_own on public.captures
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy captures_update_own on public.captures
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy captures_delete_own on public.captures
  for delete
  to authenticated
  using (user_id = auth.uid());

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete
  on public.captures
  to authenticated;

grant select, insert, update, delete
  on public.captures
  to service_role;

