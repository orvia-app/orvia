# Archflow Supabase Migrations

## Current Status

Supabase migrations now exist as schema/RLS preparation only.

The app is not connected to Supabase yet. There is no Supabase SDK dependency, auth UI, API route, server action, cloud repository adapter, local data migration, realtime subscription, or sync queue persistence.

These migrations have not been applied locally in this phase. No local Supabase project, Supabase CLI, or PostgreSQL connection is required for the current app build.

## Migration Files

- `supabase/migrations/202605270001_initial_schema.sql`

This migration creates:
- `profiles`
- `workspaces`
- `tasks`
- `notes`
- `captures`
- `activity_events`
- `entity_relations`
- `memory_candidates`
- `finance_transactions`
- `cars`
- `preferences`
- `user_module_preferences`
- `integrations`
- `user_integrations`

It also creates:
- `public.archflow_set_updated_at()`
- `public.archflow_user_owns_workspace(uuid)`
- `updated_at` triggers
- indexes for ownership, workspaces, soft delete, timestamps, entity lookups, tags, and common filters
- Row Level Security policies for per-user access

## How To Apply Later

Do not apply these migrations to production until the Supabase project, environments, and RLS review are ready.

When ready, use the Supabase CLI or dashboard migration flow for the target project. The expected CLI flow is:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

For local Supabase development, the expected flow is:

```bash
supabase start
supabase db reset
```

The Supabase CLI is not installed or required by the app today.

## RLS Model

Every user-owned table has RLS enabled.

Current policies:
- authenticated users can select only rows where `user_id = auth.uid()`
- authenticated users can insert only rows where `user_id = auth.uid()`
- authenticated users can update only rows where `user_id = auth.uid()`
- authenticated users can delete only rows where `user_id = auth.uid()`

`profiles` also uses the same `user_id = auth.uid()` ownership rule and enforces a unique profile per auth user.

`integrations` is a global registry. Authenticated users can read it, but client insert/update/delete policies are intentionally absent. Future admin/service-role tooling must manage registry writes server-side.

Future team sharing is intentionally not implemented. There are no workspace membership tables or shared-workspace policies yet.

## Optional Modules

Archflow should not assume every user wants every module. Module-specific tables may exist in the database even when that module is disabled or hidden for a user.

`user_module_preferences` controls:
- module visibility
- pinning
- user-specific ordering
- future module-specific settings

Expected default module keys for future account setup:
- `dashboard`
- `search`
- `today`
- `timeline`
- `inbox`
- `tasks`
- `notes`
- `ai_chat`
- `finance`
- `cars`
- `automation`
- `settings`

No user-specific module rows are seeded in this migration. Settings -> Modules is future product work.

## Integrations

`integrations` represents globally supported integrations such as Telegram, Gmail, Google Calendar, Notion, Slack, and future providers.

`user_integrations` represents a user's connection state for an integration.

Do not store Telegram bot tokens, OAuth client secrets, refresh tokens, or provider credentials in `user_integrations`. Secrets belong in server-side environment variables or a future secret manager.

## Security Assumptions

- No public table access is intended.
- No service-role key should be exposed to browser code.
- Browser clients may use the Supabase anon key only after RLS policies are reviewed in a real project.
- Service-role access must stay server-side and should be narrowly scoped.
- Hard delete policies exist for owner rows, but product flows should prefer explicit soft-delete semantics where appropriate.
- `activity_events` is a user-facing event stream, not a privileged audit log.
- `memory_candidates` are source-linked and must respect source deletion once AI/embedding systems exist.

## What Is Intentionally Not Wired Yet

- No app repository reads/writes use Supabase.
- No localStorage data is migrated.
- No authenticated session is created in the app.
- No account creation, sign-in, sign-out, or password reset UI exists.
- No sync queue is persisted.
- No conflict resolver runs against cloud data.
- No Telegram webhook exists.
- No AI route or embedding generation exists.

## Manual Verification Checklist

Before applying to a shared or production Supabase project:
- Review every table has `user_id`.
- Review every user-owned table has RLS enabled.
- Review policies use `user_id = auth.uid()`.
- Confirm no policy grants public/anonymous cross-user access.
- Confirm workspace sharing is not implied by current policies.
- Confirm indexes match common queries and do not expose data.
- Confirm `updated_at` triggers exist on all tables with `updated_at`.
- Confirm `deleted_at` is present for soft delete.
- Confirm `metadata` defaults to `{}`.
- Confirm `preferences` does not store secrets or provider tokens.
- Confirm `user_module_preferences` can hide/disable modules without deleting module data.
- Confirm `integrations` has no client write policies.
- Confirm `user_integrations` does not contain provider secrets.
- Run migration in a disposable Supabase project first.
- Test with at least two users that each cannot read, update, or delete the other's rows.
- Test that workspace-scoped rows cannot reference another user's workspace.
