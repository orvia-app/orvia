# Archflow Database Schema Draft

This is a planning draft for a Supabase/PostgreSQL backend. It should be implemented through migrations, with Row Level Security enabled on every user-owned table.

Conventions:
- IDs use `uuid`.
- Timestamps use `timestamptz`.
- Soft delete uses nullable `deleted_at`.
- User ownership uses `user_id uuid not null`.
- Workspace-owned records also include `workspace_id uuid`.
- Flexible non-critical metadata uses `jsonb`, but core query fields should remain typed columns.

## profiles

Purpose: application profile linked to auth user.

Fields:
- `id uuid primary key references auth.users(id)`
- `display_name text null`
- `avatar_url text null`
- `timezone text null`
- `locale text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Indexes:
- primary key on `id`
- optional index on `deleted_at`

Notes:
- `id` is the ownership root for user data.
- Do not store billing card data here.

## workspaces

Purpose: user-owned organization scopes.

Fields:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `key text null`
- `name text not null`
- `type text not null`
- `color text null`
- `sort_order integer not null default 0`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Indexes:
- `(user_id, deleted_at)`
- `(user_id, key)` unique where `deleted_at is null and key is not null`
- `(user_id, sort_order)`

Notes:
- Initial keys map to `personal`, `work`, `cars`, `business`, and `knowledge`.
- Future collaboration can add workspace memberships rather than overloading this table.

## tasks

Fields:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `workspace_id uuid null references workspaces(id)`
- `title text not null`
- `description text null`
- `status text not null`
- `priority text not null`
- `due_date date null`
- `tags text[] not null default '{}'`
- `metadata jsonb not null default '{}'::jsonb`
- `version integer not null default 1`
- `source text not null default 'local'`
- `device_id text null`
- `last_synced_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Indexes:
- `(user_id, status, deleted_at)`
- `(user_id, workspace_id, deleted_at)`
- `(user_id, due_date)`
- `gin(tags)`
- `(user_id, updated_at desc)`

Notes:
- Valid statuses should match `todo`, `in-progress`, `done` initially.
- Valid priorities should match `low`, `medium`, `high`, `critical`.

## notes

Fields:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `workspace_id uuid null references workspaces(id)`
- `title text not null`
- `content text not null`
- `type text not null default 'note'`
- `tags text[] not null default '{}'`
- `metadata jsonb not null default '{}'::jsonb`
- `version integer not null default 1`
- `source text not null default 'local'`
- `device_id text null`
- `last_synced_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Indexes:
- `(user_id, type, deleted_at)`
- `(user_id, workspace_id, deleted_at)`
- `gin(tags)`
- `(user_id, updated_at desc)`

## captures

Purpose: universal inbox captures before or after conversion.

Fields:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `workspace_id uuid null references workspaces(id)`
- `raw_text text not null`
- `normalized_text text null`
- `detected_type text null`
- `confidence numeric null`
- `suggested_tags text[] not null default '{}'`
- `converted_entity_type text null`
- `converted_entity_id uuid null`
- `metadata jsonb not null default '{}'::jsonb`
- `version integer not null default 1`
- `source text not null default 'local'`
- `device_id text null`
- `last_synced_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Indexes:
- `(user_id, created_at desc)`
- `(user_id, detected_type)`
- `(user_id, workspace_id, deleted_at)`
- `gin(suggested_tags)`

## activity_events

Purpose: event stream for timeline, audit-lite, AI context, and future sync visibility.

Fields:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `workspace_id uuid null references workspaces(id)`
- `event_type text not null`
- `entity_type text not null`
- `entity_id uuid not null`
- `title text not null`
- `subtitle text null`
- `actor_user_id uuid null references auth.users(id)`
- `source text not null default 'local'`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Indexes:
- `(user_id, created_at desc)`
- `(user_id, entity_type, entity_id)`
- `(user_id, workspace_id, created_at desc)`
- `(user_id, event_type)`

Notes:
- Do not rely on client-supplied activity as the only audit source for sensitive actions.

## entity_relations

Purpose: deterministic and future AI-assisted links between entities.

Fields:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `workspace_id uuid null references workspaces(id)`
- `from_entity_type text not null`
- `from_entity_id uuid not null`
- `to_entity_type text not null`
- `to_entity_id uuid not null`
- `relation_type text not null`
- `score numeric not null default 0`
- `source text not null default 'deterministic'`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Indexes:
- `(user_id, from_entity_type, from_entity_id)`
- `(user_id, to_entity_type, to_entity_id)`
- `(user_id, relation_type, score desc)`
- unique `(user_id, from_entity_type, from_entity_id, to_entity_type, to_entity_id, relation_type)` where `deleted_at is null`

## memory_candidates

Purpose: inspectable memory candidates and future generated memories.

Fields:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `workspace_id uuid null references workspaces(id)`
- `source_type text not null`
- `source_entity_type text null`
- `source_entity_id uuid null`
- `title text not null`
- `summary text null`
- `importance text not null default 'medium'`
- `confidence numeric null`
- `tags text[] not null default '{}'`
- `embedding_ref text null`
- `provider_metadata jsonb not null default '{}'::jsonb`
- `metadata jsonb not null default '{}'::jsonb`
- `version integer not null default 1`
- `source text not null default 'deterministic'`
- `device_id text null`
- `last_synced_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Indexes:
- `(user_id, importance, updated_at desc)`
- `(user_id, workspace_id, deleted_at)`
- `(user_id, source_type)`
- `(user_id, source_entity_type, source_entity_id)`
- `gin(tags)`

Notes:
- Embeddings should be generated server-side only.
- Deleting a source entity must delete or invalidate linked memory candidates.

## finance_transactions

Fields:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `workspace_id uuid null references workspaces(id)`
- `type text not null`
- `category text not null`
- `amount numeric not null`
- `currency text not null`
- `note text null`
- `transaction_date date null`
- `tags text[] not null default '{}'`
- `metadata jsonb not null default '{}'::jsonb`
- `version integer not null default 1`
- `source text not null default 'local'`
- `device_id text null`
- `last_synced_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Indexes:
- `(user_id, created_at desc)`
- `(user_id, type, deleted_at)`
- `(user_id, category)`
- `(user_id, workspace_id, deleted_at)`
- `gin(tags)`

Notes:
- Keep finance AI usage opt-in and minimal.

## cars

Fields:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `workspace_id uuid null references workspaces(id)`
- `name text not null`
- `owner_label text null`
- `mileage text null`
- `notes text null`
- `tags text[] not null default '{}'`
- `metadata jsonb not null default '{}'::jsonb`
- `version integer not null default 1`
- `source text not null default 'local'`
- `device_id text null`
- `last_synced_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Indexes:
- `(user_id, updated_at desc)`
- `(user_id, workspace_id, deleted_at)`
- `gin(tags)`

## settings_preferences

Purpose: user and device preferences that should sync selectively.

Fields:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `scope text not null`
- `key text not null`
- `value jsonb not null`
- `device_id text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Indexes:
- unique `(user_id, scope, key, device_id)` where `deleted_at is null`
- `(user_id, scope)`

Notes:
- Theme can remain device-local or sync per account depending on product decision.
- Store preferences only; never store secrets or provider tokens here.

## Future Tables

Likely later additions:
- `workspace_memberships` for collaboration.
- `sync_operations` for offline queue persistence.
- `integration_accounts` with encrypted server-side token handling.
- `billing_customers` and `subscriptions` with Stripe references only.
- `audit_events` for sensitive backend actions.
