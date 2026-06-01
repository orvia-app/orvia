create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  entity_type text not null,
  entity_id uuid,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint activities_title_non_empty_check
    check (length(btrim(title)) > 0),
  constraint activities_metadata_object_check
    check (jsonb_typeof(metadata) = 'object'),
  constraint activities_type_check
    check (
      type in (
        'task_created',
        'task_updated',
        'task_deleted',
        'note_created',
        'note_updated',
        'note_deleted',
        'inbox_processed',
        'quick_capture_created',
        'local_import_completed',
        'system_event'
      )
    ),
  constraint activities_entity_type_check
    check (
      entity_type in (
        'task',
        'note',
        'inbox',
        'quick_capture',
        'sync',
        'system'
      )
    )
);

comment on table public.activities is
  'User-owned event stream for future timeline, audit, sync, and memory context.';
comment on column public.activities.metadata is
  'Structured event metadata. Must remain a JSON object and must not store secrets.';

create index activities_user_id_idx
  on public.activities (user_id);

create index activities_occurred_at_idx
  on public.activities (occurred_at desc);

create index activities_entity_lookup_idx
  on public.activities (entity_type, entity_id);

create index activities_type_idx
  on public.activities (type);

create index activities_deleted_at_idx
  on public.activities (deleted_at);

create index activities_metadata_gin_idx
  on public.activities using gin (metadata);

alter table public.activities enable row level security;

create policy "Users can select own activities"
  on public.activities
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own activities"
  on public.activities
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own activities"
  on public.activities
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own activities"
  on public.activities
  for delete
  to authenticated
  using (user_id = auth.uid());

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete
  on public.activities
  to authenticated;

grant select, insert, update, delete
  on public.activities
  to service_role;
