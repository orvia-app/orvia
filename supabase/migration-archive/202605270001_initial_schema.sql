-- Archflow Supabase Phase 1
-- Schema and RLS foundation only. This migration does not connect the app,
-- add auth UI, migrate local data, or implement cloud sync.

create extension if not exists pgcrypto;

create or replace function public.archflow_set_updated_at()
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

comment on function public.archflow_set_updated_at() is
  'Reusable updated_at trigger for Archflow user-owned tables.';

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text,
  locale text,
  sync_status text not null default 'synced',
  version integer not null default 1,
  device_id text,
  source text not null default 'server',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint profiles_sync_status_check check (
    sync_status in ('local', 'queued', 'syncing', 'synced', 'conflict', 'failed', 'deleted')
  ),
  constraint profiles_version_check check (version > 0)
);

comment on table public.profiles is
  'Archflow application profile linked one-to-one to a Supabase auth user.';

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text,
  name text not null,
  type text not null,
  color text,
  sort_order integer not null default 0,
  sync_status text not null default 'synced',
  version integer not null default 1,
  device_id text,
  source text not null default 'local',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint workspaces_sync_status_check check (
    sync_status in ('local', 'queued', 'syncing', 'synced', 'conflict', 'failed', 'deleted')
  ),
  constraint workspaces_version_check check (version > 0)
);

comment on table public.workspaces is
  'User-owned organization scopes. Collaboration and sharing are intentionally not implemented yet.';

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'medium',
  due_date date,
  tags text[] not null default '{}',
  sync_status text not null default 'synced',
  version integer not null default 1,
  device_id text,
  source text not null default 'local',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint tasks_status_check check (status in ('todo', 'in-progress', 'done')),
  constraint tasks_priority_check check (priority in ('low', 'medium', 'high', 'critical')),
  constraint tasks_sync_status_check check (
    sync_status in ('local', 'queued', 'syncing', 'synced', 'conflict', 'failed', 'deleted')
  ),
  constraint tasks_version_check check (version > 0)
);

comment on table public.tasks is
  'User-owned task records migrated later from local-first repositories.';

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  title text not null,
  content text not null,
  type text not null default 'note',
  tags text[] not null default '{}',
  sync_status text not null default 'synced',
  version integer not null default 1,
  device_id text,
  source text not null default 'local',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint notes_type_check check (type in ('note', 'idea', 'book', 'course', 'link')),
  constraint notes_sync_status_check check (
    sync_status in ('local', 'queued', 'syncing', 'synced', 'conflict', 'failed', 'deleted')
  ),
  constraint notes_version_check check (version > 0)
);

comment on table public.notes is
  'User-owned notes and knowledge records.';

create table public.captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  raw_text text not null,
  normalized_text text,
  detected_type text,
  confidence numeric,
  suggested_tags text[] not null default '{}',
  converted_entity_type text,
  converted_entity_id uuid,
  sync_status text not null default 'synced',
  version integer not null default 1,
  device_id text,
  source text not null default 'local',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint captures_confidence_check check (confidence is null or (confidence >= 0 and confidence <= 1)),
  constraint captures_sync_status_check check (
    sync_status in ('local', 'queued', 'syncing', 'synced', 'conflict', 'failed', 'deleted')
  ),
  constraint captures_version_check check (version > 0)
);

comment on table public.captures is
  'Universal Inbox captures. Telegram and other integrations will write here only after backend auth exists.';

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  title text not null,
  subtitle text,
  actor_user_id uuid references auth.users(id) on delete set null,
  sync_status text not null default 'synced',
  version integer not null default 1,
  device_id text,
  source text not null default 'local',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint activity_events_sync_status_check check (
    sync_status in ('local', 'queued', 'syncing', 'synced', 'conflict', 'failed', 'deleted')
  ),
  constraint activity_events_version_check check (version > 0)
);

comment on table public.activity_events is
  'User-owned activity timeline events. This is not a privileged audit log yet.';

create table public.entity_relations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  from_entity_type text not null,
  from_entity_id uuid not null,
  to_entity_type text not null,
  to_entity_id uuid not null,
  relation_type text not null,
  score numeric not null default 0,
  sync_status text not null default 'synced',
  version integer not null default 1,
  device_id text,
  source text not null default 'deterministic',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint entity_relations_score_check check (score >= 0),
  constraint entity_relations_sync_status_check check (
    sync_status in ('local', 'queued', 'syncing', 'synced', 'conflict', 'failed', 'deleted')
  ),
  constraint entity_relations_version_check check (version > 0)
);

comment on table public.entity_relations is
  'Deterministic and future AI-assisted links between user-owned entities.';

create table public.memory_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  source_type text not null,
  source_entity_type text,
  source_entity_id uuid,
  title text not null,
  summary text,
  importance text not null default 'medium',
  confidence numeric,
  tags text[] not null default '{}',
  embedding_ref text,
  provider_metadata jsonb not null default '{}'::jsonb,
  sync_status text not null default 'synced',
  version integer not null default 1,
  device_id text,
  source text not null default 'deterministic',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint memory_candidates_importance_check check (importance in ('low', 'medium', 'high', 'critical')),
  constraint memory_candidates_confidence_check check (confidence is null or (confidence >= 0 and confidence <= 1)),
  constraint memory_candidates_sync_status_check check (
    sync_status in ('local', 'queued', 'syncing', 'synced', 'conflict', 'failed', 'deleted')
  ),
  constraint memory_candidates_version_check check (version > 0)
);

comment on table public.memory_candidates is
  'Inspectable source-linked memory candidates. No embeddings or real AI generation are wired by this migration.';

create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  type text not null,
  category text not null,
  amount numeric not null,
  currency text not null,
  note text,
  transaction_date date,
  tags text[] not null default '{}',
  sync_status text not null default 'synced',
  version integer not null default 1,
  device_id text,
  source text not null default 'local',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint finance_transactions_type_check check (type in ('income', 'expense')),
  constraint finance_transactions_amount_check check (amount > 0),
  constraint finance_transactions_currency_check check (currency in ('UAH', 'USD', 'EUR')),
  constraint finance_transactions_sync_status_check check (
    sync_status in ('local', 'queued', 'syncing', 'synced', 'conflict', 'failed', 'deleted')
  ),
  constraint finance_transactions_version_check check (version > 0)
);

comment on table public.finance_transactions is
  'User-owned finance records. Finance AI usage must remain explicitly scoped in future backend work.';

create table public.cars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  name text not null,
  owner_label text,
  mileage text,
  notes text,
  tags text[] not null default '{}',
  sync_status text not null default 'synced',
  version integer not null default 1,
  device_id text,
  source text not null default 'local',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint cars_sync_status_check check (
    sync_status in ('local', 'queued', 'syncing', 'synced', 'conflict', 'failed', 'deleted')
  ),
  constraint cars_version_check check (version > 0)
);

comment on table public.cars is
  'User-owned vehicle records.';

create table public.preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null,
  key text not null,
  value jsonb not null,
  sync_status text not null default 'synced',
  version integer not null default 1,
  device_id text,
  source text not null default 'local',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint preferences_sync_status_check check (
    sync_status in ('local', 'queued', 'syncing', 'synced', 'conflict', 'failed', 'deleted')
  ),
  constraint preferences_version_check check (version > 0)
);

comment on table public.preferences is
  'User preferences that may sync selectively. Never store secrets or provider tokens here.';

create table public.user_module_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null,
  enabled boolean not null default true,
  pinned boolean not null default false,
  sort_order integer not null default 0,
  settings jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint user_module_preferences_module_key_check check (length(btrim(module_key)) > 0),
  constraint user_module_preferences_settings_object_check check (jsonb_typeof(settings) = 'object'),
  constraint user_module_preferences_metadata_object_check check (jsonb_typeof(metadata) = 'object'),
  constraint user_module_preferences_user_module_unique unique (user_id, module_key)
);

comment on table public.user_module_preferences is
  'Per-user module visibility, pinning, and ordering. Module data tables may exist even when a module is disabled for a user.';

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  integration_key text not null unique,
  name text not null,
  description text,
  category text not null default 'capture',
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integrations_integration_key_check check (length(btrim(integration_key)) > 0),
  constraint integrations_name_check check (length(btrim(name)) > 0),
  constraint integrations_category_check check (length(btrim(category)) > 0),
  constraint integrations_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

comment on table public.integrations is
  'Global registry of supported integrations. Client writes are intentionally not allowed by RLS.';

create table public.user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  integration_key text not null references public.integrations(integration_key),
  enabled boolean not null default false,
  status text not null default 'disconnected',
  external_user_id text,
  external_username text,
  settings jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint user_integrations_status_check check (
    status in ('disconnected', 'pending', 'connected', 'error', 'disabled')
  ),
  constraint user_integrations_settings_object_check check (jsonb_typeof(settings) = 'object'),
  constraint user_integrations_metadata_object_check check (jsonb_typeof(metadata) = 'object'),
  constraint user_integrations_user_integration_unique unique (user_id, integration_key)
);

comment on table public.user_integrations is
  'Per-user integration connection state. Provider secrets and bot tokens must remain server-side and are not stored here.';

create or replace function public.archflow_user_owns_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    target_workspace_id is null
    or exists (
      select 1
      from public.workspaces
      where id = target_workspace_id
        and user_id = auth.uid()
        and deleted_at is null
    );
$$;

comment on function public.archflow_user_owns_workspace(uuid) is
  'RLS helper ensuring workspace-scoped rows reference a workspace owned by the current user. Sharing is not implemented yet.';

create index profiles_user_id_idx on public.profiles (user_id);
create index profiles_deleted_at_idx on public.profiles (deleted_at);
create index profiles_updated_at_idx on public.profiles (updated_at desc);

create index workspaces_user_id_idx on public.workspaces (user_id);
create index workspaces_deleted_at_idx on public.workspaces (deleted_at);
create index workspaces_updated_at_idx on public.workspaces (updated_at desc);
create unique index workspaces_user_key_idx on public.workspaces (user_id, key) where deleted_at is null and key is not null;
create index workspaces_user_sort_order_idx on public.workspaces (user_id, sort_order);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_workspace_id_idx on public.tasks (workspace_id);
create index tasks_deleted_at_idx on public.tasks (deleted_at);
create index tasks_updated_at_idx on public.tasks (updated_at desc);
create index tasks_user_status_idx on public.tasks (user_id, status, deleted_at);
create index tasks_user_due_date_idx on public.tasks (user_id, due_date);
create index tasks_tags_idx on public.tasks using gin (tags);

create index notes_user_id_idx on public.notes (user_id);
create index notes_workspace_id_idx on public.notes (workspace_id);
create index notes_deleted_at_idx on public.notes (deleted_at);
create index notes_updated_at_idx on public.notes (updated_at desc);
create index notes_user_type_idx on public.notes (user_id, type, deleted_at);
create index notes_tags_idx on public.notes using gin (tags);

create index captures_user_id_idx on public.captures (user_id);
create index captures_workspace_id_idx on public.captures (workspace_id);
create index captures_deleted_at_idx on public.captures (deleted_at);
create index captures_updated_at_idx on public.captures (updated_at desc);
create index captures_user_detected_type_idx on public.captures (user_id, detected_type);
create index captures_suggested_tags_idx on public.captures using gin (suggested_tags);

create index activity_events_user_id_idx on public.activity_events (user_id);
create index activity_events_workspace_id_idx on public.activity_events (workspace_id);
create index activity_events_deleted_at_idx on public.activity_events (deleted_at);
create index activity_events_updated_at_idx on public.activity_events (updated_at desc);
create index activity_events_entity_lookup_idx on public.activity_events (user_id, entity_type, entity_id);
create index activity_events_user_event_type_idx on public.activity_events (user_id, event_type);

create index entity_relations_user_id_idx on public.entity_relations (user_id);
create index entity_relations_workspace_id_idx on public.entity_relations (workspace_id);
create index entity_relations_deleted_at_idx on public.entity_relations (deleted_at);
create index entity_relations_updated_at_idx on public.entity_relations (updated_at desc);
create index entity_relations_from_idx on public.entity_relations (user_id, from_entity_type, from_entity_id);
create index entity_relations_to_idx on public.entity_relations (user_id, to_entity_type, to_entity_id);
create index entity_relations_type_score_idx on public.entity_relations (user_id, relation_type, score desc);
create unique index entity_relations_unique_active_idx
  on public.entity_relations (
    user_id,
    from_entity_type,
    from_entity_id,
    to_entity_type,
    to_entity_id,
    relation_type
  )
  where deleted_at is null;

create index memory_candidates_user_id_idx on public.memory_candidates (user_id);
create index memory_candidates_workspace_id_idx on public.memory_candidates (workspace_id);
create index memory_candidates_deleted_at_idx on public.memory_candidates (deleted_at);
create index memory_candidates_updated_at_idx on public.memory_candidates (updated_at desc);
create index memory_candidates_importance_idx on public.memory_candidates (user_id, importance, updated_at desc);
create index memory_candidates_source_idx on public.memory_candidates (user_id, source_type);
create index memory_candidates_source_entity_idx on public.memory_candidates (user_id, source_entity_type, source_entity_id);
create index memory_candidates_tags_idx on public.memory_candidates using gin (tags);

create index finance_transactions_user_id_idx on public.finance_transactions (user_id);
create index finance_transactions_workspace_id_idx on public.finance_transactions (workspace_id);
create index finance_transactions_deleted_at_idx on public.finance_transactions (deleted_at);
create index finance_transactions_updated_at_idx on public.finance_transactions (updated_at desc);
create index finance_transactions_user_type_idx on public.finance_transactions (user_id, type, deleted_at);
create index finance_transactions_user_category_idx on public.finance_transactions (user_id, category);
create index finance_transactions_tags_idx on public.finance_transactions using gin (tags);

create index cars_user_id_idx on public.cars (user_id);
create index cars_workspace_id_idx on public.cars (workspace_id);
create index cars_deleted_at_idx on public.cars (deleted_at);
create index cars_updated_at_idx on public.cars (updated_at desc);
create index cars_tags_idx on public.cars using gin (tags);

create index preferences_user_id_idx on public.preferences (user_id);
create index preferences_deleted_at_idx on public.preferences (deleted_at);
create index preferences_updated_at_idx on public.preferences (updated_at desc);
create unique index preferences_user_scope_key_device_idx
  on public.preferences (user_id, scope, key, coalesce(device_id, ''))
  where deleted_at is null;

create index user_module_preferences_user_id_idx on public.user_module_preferences (user_id);
create index user_module_preferences_user_enabled_idx on public.user_module_preferences (user_id, enabled);
create index user_module_preferences_user_sort_order_idx on public.user_module_preferences (user_id, sort_order);
create index user_module_preferences_deleted_at_idx on public.user_module_preferences (deleted_at);

create index integrations_key_idx on public.integrations (integration_key);
create index integrations_enabled_idx on public.integrations (enabled);
create index integrations_category_idx on public.integrations (category);
create index integrations_updated_at_idx on public.integrations (updated_at desc);

create index user_integrations_user_id_idx on public.user_integrations (user_id);
create index user_integrations_integration_key_idx on public.user_integrations (integration_key);
create index user_integrations_user_enabled_idx on public.user_integrations (user_id, enabled);
create index user_integrations_user_status_idx on public.user_integrations (user_id, status);
create index user_integrations_external_user_id_idx on public.user_integrations (external_user_id) where external_user_id is not null;
create index user_integrations_deleted_at_idx on public.user_integrations (deleted_at);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.archflow_set_updated_at();

create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.archflow_set_updated_at();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.archflow_set_updated_at();

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.archflow_set_updated_at();

create trigger captures_set_updated_at
  before update on public.captures
  for each row execute function public.archflow_set_updated_at();

create trigger activity_events_set_updated_at
  before update on public.activity_events
  for each row execute function public.archflow_set_updated_at();

create trigger entity_relations_set_updated_at
  before update on public.entity_relations
  for each row execute function public.archflow_set_updated_at();

create trigger memory_candidates_set_updated_at
  before update on public.memory_candidates
  for each row execute function public.archflow_set_updated_at();

create trigger finance_transactions_set_updated_at
  before update on public.finance_transactions
  for each row execute function public.archflow_set_updated_at();

create trigger cars_set_updated_at
  before update on public.cars
  for each row execute function public.archflow_set_updated_at();

create trigger preferences_set_updated_at
  before update on public.preferences
  for each row execute function public.archflow_set_updated_at();

create trigger user_module_preferences_set_updated_at
  before update on public.user_module_preferences
  for each row execute function public.archflow_set_updated_at();

create trigger integrations_set_updated_at
  before update on public.integrations
  for each row execute function public.archflow_set_updated_at();

create trigger user_integrations_set_updated_at
  before update on public.user_integrations
  for each row execute function public.archflow_set_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.captures enable row level security;
alter table public.activity_events enable row level security;
alter table public.entity_relations enable row level security;
alter table public.memory_candidates enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.cars enable row level security;
alter table public.preferences enable row level security;
alter table public.user_module_preferences enable row level security;
alter table public.integrations enable row level security;
alter table public.user_integrations enable row level security;

create policy profiles_select_own on public.profiles
  for select using (user_id = auth.uid());

create policy profiles_insert_own on public.profiles
  for insert with check (user_id = auth.uid());

create policy profiles_update_own on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy profiles_delete_own on public.profiles
  for delete using (user_id = auth.uid());

create policy workspaces_select_own on public.workspaces
  for select using (user_id = auth.uid());

create policy workspaces_insert_own on public.workspaces
  for insert with check (user_id = auth.uid());

create policy workspaces_update_own on public.workspaces
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy workspaces_delete_own on public.workspaces
  for delete using (user_id = auth.uid());

create policy tasks_select_own on public.tasks
  for select using (user_id = auth.uid());

create policy tasks_insert_own on public.tasks
  for insert with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy tasks_update_own on public.tasks
  for update using (user_id = auth.uid()) with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy tasks_delete_own on public.tasks
  for delete using (user_id = auth.uid());

create policy notes_select_own on public.notes
  for select using (user_id = auth.uid());

create policy notes_insert_own on public.notes
  for insert with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy notes_update_own on public.notes
  for update using (user_id = auth.uid()) with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy notes_delete_own on public.notes
  for delete using (user_id = auth.uid());

create policy captures_select_own on public.captures
  for select using (user_id = auth.uid());

create policy captures_insert_own on public.captures
  for insert with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy captures_update_own on public.captures
  for update using (user_id = auth.uid()) with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy captures_delete_own on public.captures
  for delete using (user_id = auth.uid());

create policy activity_events_select_own on public.activity_events
  for select using (user_id = auth.uid());

create policy activity_events_insert_own on public.activity_events
  for insert with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy activity_events_update_own on public.activity_events
  for update using (user_id = auth.uid()) with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy activity_events_delete_own on public.activity_events
  for delete using (user_id = auth.uid());

create policy entity_relations_select_own on public.entity_relations
  for select using (user_id = auth.uid());

create policy entity_relations_insert_own on public.entity_relations
  for insert with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy entity_relations_update_own on public.entity_relations
  for update using (user_id = auth.uid()) with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy entity_relations_delete_own on public.entity_relations
  for delete using (user_id = auth.uid());

create policy memory_candidates_select_own on public.memory_candidates
  for select using (user_id = auth.uid());

create policy memory_candidates_insert_own on public.memory_candidates
  for insert with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy memory_candidates_update_own on public.memory_candidates
  for update using (user_id = auth.uid()) with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy memory_candidates_delete_own on public.memory_candidates
  for delete using (user_id = auth.uid());

create policy finance_transactions_select_own on public.finance_transactions
  for select using (user_id = auth.uid());

create policy finance_transactions_insert_own on public.finance_transactions
  for insert with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy finance_transactions_update_own on public.finance_transactions
  for update using (user_id = auth.uid()) with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy finance_transactions_delete_own on public.finance_transactions
  for delete using (user_id = auth.uid());

create policy cars_select_own on public.cars
  for select using (user_id = auth.uid());

create policy cars_insert_own on public.cars
  for insert with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy cars_update_own on public.cars
  for update using (user_id = auth.uid()) with check (
    user_id = auth.uid()
    and public.archflow_user_owns_workspace(workspace_id)
  );

create policy cars_delete_own on public.cars
  for delete using (user_id = auth.uid());

create policy preferences_select_own on public.preferences
  for select using (user_id = auth.uid());

create policy preferences_insert_own on public.preferences
  for insert with check (user_id = auth.uid());

create policy preferences_update_own on public.preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy preferences_delete_own on public.preferences
  for delete using (user_id = auth.uid());

create policy user_module_preferences_select_own on public.user_module_preferences
  for select using (user_id = auth.uid());

create policy user_module_preferences_insert_own on public.user_module_preferences
  for insert with check (user_id = auth.uid());

create policy user_module_preferences_update_own on public.user_module_preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_module_preferences_delete_own on public.user_module_preferences
  for delete using (user_id = auth.uid());

create policy integrations_select_authenticated on public.integrations
  for select to authenticated using (true);

create policy user_integrations_select_own on public.user_integrations
  for select using (user_id = auth.uid());

create policy user_integrations_insert_own on public.user_integrations
  for insert with check (user_id = auth.uid());

create policy user_integrations_update_own on public.user_integrations
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_integrations_delete_own on public.user_integrations
  for delete using (user_id = auth.uid());
