# Orvia RLS And Ownership Verification

## Purpose

This document records the current repository-level evidence for user ownership, Row Level Security, and API authorization before beta.

It separates three kinds of proof:
- **Code verified:** visible in application API routes and helpers.
- **Migration verified:** visible in SQL migration files.
- **Runtime not verified:** requires testing against the actual Supabase project.

## Current Runtime Scope

The cloud-backed application surface currently uses these tables:
- `public.tasks`
- `public.notes`
- `public.activities`

Other user-owned tables exist in the initial schema migration, but current application routes do not read or write them yet.

## Protected Tables In Migrations

The initial schema migration enables RLS and owner policies for:
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

The currently relevant application migrations also define RLS for:
- `public.tasks`: `202606010001_enable_tasks_rls.sql`
- `public.notes`: `202606010002_notes_cloud_foundation.sql`
- `public.activities`: `202606010004_create_activities.sql`

Runtime application code currently uses `tasks`, `notes`, and `activities` only.

## Ownership Model

API requests must send `Authorization: Bearer <Supabase access token>`.

`src/server/api/auth.ts` validates that token server-side by calling Supabase Auth `getUser()`. The application derives `user_id` only from the validated token. Client-provided `user_id` is not accepted by the current Tasks, Notes, or Activities APIs.

The server data client in `src/lib/supabase.ts` uses the service-role key server-side. Because service-role clients can bypass RLS, the current app must keep explicit API ownership filters and insert ownership checks even when RLS is enabled.

## API Authorization Summary

| API | Auth required | Ownership source | Query scope | Service role used | RLS-only |
| --- | --- | --- | --- | --- | --- |
| `GET /api/tasks` | Yes | validated Bearer token | `user_id = auth.userId`, `deleted_at is null` | Yes | No |
| `POST /api/tasks` | Yes | validated Bearer token | insert sets `user_id = auth.userId` | Yes | No |
| `PATCH /api/tasks/[id]` | Yes | validated Bearer token | `id`, `user_id = auth.userId`, `deleted_at is null` | Yes | No |
| `DELETE /api/tasks/[id]` | Yes | validated Bearer token | soft delete by `id`, `user_id = auth.userId`, `deleted_at is null` | Yes | No |
| `GET /api/notes` | Yes | validated Bearer token | `user_id = auth.userId`, `deleted_at is null` | Yes | No |
| `POST /api/notes` | Yes | validated Bearer token | insert sets `user_id = auth.userId` | Yes | No |
| `PATCH /api/notes/[id]` | Yes | validated Bearer token | `id`, `user_id = auth.userId`, `deleted_at is null` | Yes | No |
| `DELETE /api/notes/[id]` | Yes | validated Bearer token | soft delete by `id`, `user_id = auth.userId`, `deleted_at is null` | Yes | No |
| `GET /api/activities` | Yes | validated Bearer token | `user_id = auth.userId`, `deleted_at is null` | Yes | No |
| `POST /api/activities` | Yes | validated Bearer token | insert sets `user_id = auth.userId` | Yes | No |

There are no current APIs that rely only on RLS.

## CRUD Verification Status

### Tasks

- Create: code verified. `POST /api/tasks` validates auth and inserts `user_id` from the authenticated user.
- Read: code verified. `GET /api/tasks` filters by authenticated `user_id`.
- Update: code verified. `PATCH /api/tasks/[id]` filters by `id`, authenticated `user_id`, and non-deleted rows.
- Delete: code verified. `DELETE /api/tasks/[id]` soft-deletes only rows matching `id`, authenticated `user_id`, and non-deleted rows.
- RLS: migration verified. Runtime not verified in this repository.

### Notes

- Create: code verified. `POST /api/notes` validates auth and inserts `user_id` from the authenticated user.
- Read: code verified. `GET /api/notes` filters by authenticated `user_id`.
- Update: code verified. `PATCH /api/notes/[id]` filters by `id`, authenticated `user_id`, and non-deleted rows.
- Delete: code verified. `DELETE /api/notes/[id]` soft-deletes only rows matching `id`, authenticated `user_id`, and non-deleted rows.
- RLS: migration verified. Runtime not verified in this repository.

### Activities

- Create: code verified. `POST /api/activities` validates auth and inserts `user_id` from the authenticated user.
- Read: code verified. `GET /api/activities` filters by authenticated `user_id`.
- Update: no application API exists yet.
- Delete: no application API exists yet.
- RLS update/delete policies: migration verified. Runtime not verified in this repository.

## Static Verification

Run:

```bash
npm run verify:rls
```

This script checks that:
- owner-only RLS policies exist in the relevant migration files
- Tasks, Notes, and Activities API routes require `authenticateApiRequest`
- API reads are scoped by `user_id = auth.userId`
- API writes set `user_id` from the authenticated user
- update/delete routes are scoped by both resource ID and authenticated user ID
- soft deletes use `deleted_at`
- the unsafe `/api/test` service-role endpoint is absent

This is a repository-level guard. It does not connect to Supabase and does not prove production runtime RLS state.

## Runtime Verification Required

Before beta, verify against the real Supabase project with two test users:

1. User A creates a task, note, and activity through the app/API.
2. User B creates a task, note, and activity through the app/API.
3. User A cannot read User B rows through app APIs.
4. User B cannot read User A rows through app APIs.
5. User A cannot PATCH or DELETE User B task/note IDs through app APIs.
6. User B cannot PATCH or DELETE User A task/note IDs through app APIs.
7. Direct authenticated Supabase anon-client queries cannot select/update/delete another user's rows.
8. Legacy `tasks.user_id is null` rows are not returned by authenticated APIs.
9. Soft-deleted rows are excluded from GET APIs.

## Remaining Risks

- RLS exists in migrations, but this repository cannot prove that the migrations are applied in the live Supabase project.
- The app's server data client uses service-role access, so API ownership checks remain mandatory defense. RLS is defense-in-depth and future direct-client protection.
- Activities have create/read APIs only. Update/delete protections exist as RLS policies but are not exercised by application routes.
- LocalStorage data is not user-scoped and can still appear in local fallback flows on a shared browser profile.

## Beta Readiness Assessment

The previous unauthenticated service-role test endpoint has been removed. Current Tasks, Notes, and Activities APIs enforce ownership in code.

Beta readiness still requires live Supabase verification that:
- the latest migrations are applied
- RLS is enabled for `tasks`, `notes`, and `activities`
- owner-only policies are present
- two-user isolation tests pass
