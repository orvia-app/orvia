-- Orvia notes cloud migration foundation.
-- Creates public.notes for future Supabase-backed, user-owned storage while
-- preserving the current localStorage notes flow. This does not create an API,
-- migrate local notes, or require user ownership for existing rows yet.

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  content text,
  type text not null default 'note',
  tags text[] not null default '{}'::text[],
  source text not null default 'local',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint notes_title_non_empty_check check (length(btrim(title)) > 0),
  constraint notes_type_check check (type in ('note', 'idea', 'book', 'course', 'link')),
  constraint notes_source_check check (source in ('local', 'api', 'import', 'telegram', 'system')),
  constraint notes_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

comment on table public.notes is
  'User-owned notes prepared for future cloud storage. Existing localStorage notes are not migrated by this migration.';

comment on column public.notes.user_id is
  'Nullable during the localStorage-to-cloud transition. Future cloud writes should set this to auth.uid().';

create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.set_updated_at();

create index notes_user_id_idx
  on public.notes (user_id);

create index notes_updated_at_idx
  on public.notes (updated_at desc);

create index notes_deleted_at_idx
  on public.notes (deleted_at);

create index notes_type_idx
  on public.notes (type);

create index notes_tags_idx
  on public.notes using gin (tags);

alter table public.notes enable row level security;

create policy notes_select_own on public.notes
  for select
  to authenticated
  using (user_id = auth.uid());

create policy notes_insert_own on public.notes
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy notes_update_own on public.notes
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notes_delete_own on public.notes
  for delete
  to authenticated
  using (user_id = auth.uid());
