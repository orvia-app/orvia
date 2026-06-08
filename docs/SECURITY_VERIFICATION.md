# Orvia Runtime Security Verification

## Purpose

This document is the runtime verification plan for Orvia's user ownership and
Row Level Security model before beta.

The repository has static evidence that Tasks, Notes, Captures, and Activities
enforce authenticated ownership in API code and define owner-only RLS policies
in migrations. Runtime verification has now been completed against the current
application flow with two authenticated users.

## Verification Scope

- Tasks: `public.tasks`
- Notes: `public.notes`
- Captures: `public.captures`
- Activities: `public.activities`

## Current Security Model

### Authentication

All current cloud data APIs require an `Authorization: Bearer <access token>`
header and call `authenticateApiRequest(request)` from
`src/server/api/auth.ts`.

The helper validates the token server-side through Supabase Auth and returns a
server-derived `userId`. API routes do not accept client-provided `user_id`.

### Service-Role Usage

The data client in `src/lib/supabase.ts` uses the Supabase service-role key on
the server only. Service-role access can bypass RLS, so application API routes
must keep explicit ownership filters even when RLS is enabled.

Current API routes do enforce ownership in code:

- `GET` routes filter by `user_id = auth.userId` and `deleted_at is null`.
- `POST` routes insert `user_id = auth.userId`.
- `PATCH` routes scope mutations by record `id`, `user_id = auth.userId`, and
  `deleted_at is null`.
- `DELETE` routes for Tasks and Notes soft-delete only records matching record
  `id`, `user_id = auth.userId`, and `deleted_at is null`.

### RLS Policies

Owner-only policies exist in migrations for:

- Tasks: `supabase/migrations/202606010001_enable_tasks_rls.sql`
- Notes: `supabase/migrations/202606010002_notes_cloud_foundation.sql`
- Activities: `supabase/migrations/202606010004_create_activities.sql`
- Captures: `supabase/migrations/202606010005_create_captures.sql`

RLS is defense-in-depth for the current API path because server API routes use
service-role access. It is still required for future direct authenticated
Supabase client access and for database-level safety.

## Verified By Code

- Bearer token parsing and Supabase Auth validation:
  `src/server/api/auth.ts`
- Tasks ownership:
  `src/app/api/tasks/route.ts`,
  `src/app/api/tasks/[id]/route.ts`
- Notes ownership:
  `src/app/api/notes/route.ts`,
  `src/app/api/notes/[id]/route.ts`
- Captures ownership:
  `src/app/api/captures/route.ts`,
  `src/app/api/captures/[id]/route.ts`
- Activities ownership:
  `src/app/api/activities/route.ts`
- Static guard:
  `scripts/security-guard.mjs`
- Static RLS and ownership check:
  `scripts/verify-rls-ownership.mjs`

## Runtime Verification Status

- Local data isolation: PASS
- Tasks isolation: PASS
- Notes isolation: PASS
- Captures isolation: PASS
- Search isolation: PASS
- Today isolation: PASS
- Command Palette isolation: PASS
- Reset local data: PASS

Runtime testing discovered a local cache isolation bug during the first pass.
The root cause was shared authenticated browser cache: signed-in cloud reads and
fallback paths could merge account rows with shared `personal-os.*` localStorage
records from another user on the same browser profile.

The fix introduced authenticated user-scoped cache keys:

- `personal-os.user.<userId>.tasks`
- `personal-os.user.<userId>.notes`
- `personal-os.user.<userId>.quick-captures`

Tasks, Notes, Captures, Search, Today, related context, and Command Palette
were retested after the fix. Runtime retesting passed.

## Automated Runtime Ownership Script

The repository includes a no-new-dependency runtime verification command:

```bash
npm run verify:ownership:runtime
```

This script signs in two disposable Supabase Auth users through the public
Supabase anon client. It does not use the service-role key and does not require
application server access. The script loads `.env.local` through Next's local
environment loader, so `npm run verify:ownership:runtime` works from a fresh
terminal without manually exporting variables.

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ORVIA_RUNTIME_USER_A_EMAIL=
ORVIA_RUNTIME_USER_A_PASSWORD=
ORVIA_RUNTIME_USER_B_EMAIL=
ORVIA_RUNTIME_USER_B_PASSWORD=
```

Use disposable test accounts only. Do not use real customer accounts and do not
commit real credentials.

The script verifies:

- User A cannot read User B Tasks through direct authenticated Supabase access.
- User A cannot update User B Tasks through direct authenticated Supabase access.
- User A cannot delete User B Tasks through direct authenticated Supabase access.
- User A cannot read User B Notes through direct authenticated Supabase access.
- User A cannot update User B Notes through direct authenticated Supabase access.
- User A cannot delete User B Notes through direct authenticated Supabase access.
- User A cannot read User B Captures through direct authenticated Supabase access.
- User A cannot update User B Captures through direct authenticated Supabase access.
- User A cannot delete User B Captures through direct authenticated Supabase access.
- User A cannot read User B Activities through direct authenticated Supabase access.
- User B cannot read User A rows created during the same verification run.

The script creates temporary records for both users and attempts to clean them up
with each owning user's authenticated Supabase session. If cleanup fails, remove
rows whose titles/content include the printed runtime verification prefix from
the target Supabase project manually.

This script proves runtime RLS behavior for direct authenticated Supabase access.
It complements, but does not replace, the static API ownership checks in
`npm run verify:rls` and the application API smoke checks below.

## Runtime Grants Requirement

Runtime verification found that `public.tasks` had owner-only RLS policies but
was missing authenticated table privileges in the target Supabase database.
PostgreSQL checks table privileges before evaluating Row Level Security, so an
authenticated direct-client request needs table-level privileges and then RLS
decides which rows are visible or mutable.

The migration
`supabase/migrations/202606010007_grant_authenticated_runtime_table_permissions.sql`
grants `select`, `insert`, `update`, and `delete` on `public.tasks`,
`public.notes`, `public.captures`, and `public.activities` to the
`authenticated` role only. It does not grant access to `anon`, does not disable
RLS, and does not change owner-only policies.

Manual SQL, if the migration must be applied through the Supabase SQL Editor:

```sql
grant select, insert, update, delete
  on table public.tasks,
           public.notes,
           public.captures,
           public.activities
  to authenticated;
```

## Test Accounts

### User A

- Email: `PENDING`
- Supabase user id: `PENDING`

### User B

- Email: `PENDING`
- Supabase user id: `PENDING`

## Setup Checklist

1. Create User A in the target Supabase project.
2. Create User B in the same Supabase project.
3. Confirm both users can obtain valid Supabase access tokens.
4. Login as User A.
5. Create:
   - one task
   - one note
   - one capture
   - one activity
6. Record User A record IDs.
7. Login as User B.
8. Create:
   - one task
   - one note
   - one capture
   - one activity
9. Record User B record IDs.
10. Run the API and direct-RLS checks below.

## Verification Matrix

### Tasks

| Test | Expected | Result |
| --- | --- | --- |
| User A creates a task through `POST /api/tasks` | ALLOWED | PASS |
| User B reads tasks through `GET /api/tasks` | User A task is not returned | PASS |
| User B updates User A task through `PATCH /api/tasks/[id]` | DENIED, 404 | PASS |
| User B deletes User A task through `DELETE /api/tasks/[id]` | DENIED, 404 | PASS |
| User B selects User A task through direct authenticated Supabase anon client | DENIED / no row returned | PASS |
| User B updates User A task through direct authenticated Supabase anon client | DENIED / no row updated | PASS |
| User B deletes User A task through direct authenticated Supabase anon client | DENIED / no row deleted | PASS |

### Notes

| Test | Expected | Result |
| --- | --- | --- |
| User A creates a note through `POST /api/notes` | ALLOWED | PASS |
| User B reads notes through `GET /api/notes` | User A note is not returned | PASS |
| User B updates User A note through `PATCH /api/notes/[id]` | DENIED, 404 | PASS |
| User B deletes User A note through `DELETE /api/notes/[id]` | DENIED, 404 | PASS |
| User B selects User A note through direct authenticated Supabase anon client | DENIED / no row returned | PASS |
| User B updates User A note through direct authenticated Supabase anon client | DENIED / no row updated | PASS |
| User B deletes User A note through direct authenticated Supabase anon client | DENIED / no row deleted | PASS |

### Captures

| Test | Expected | Result |
| --- | --- | --- |
| User A creates a capture through `POST /api/captures` | ALLOWED | PASS |
| User B reads captures through `GET /api/captures` | User A capture is not returned | PASS |
| User B updates User A capture through `PATCH /api/captures/[id]` | DENIED, 404 | PASS |
| User B selects User A capture through direct authenticated Supabase anon client | DENIED / no row returned | PASS |
| User B updates User A capture through direct authenticated Supabase anon client | DENIED / no row updated | PASS |
| User B deletes User A capture through direct authenticated Supabase anon client | DENIED / no row deleted | PASS |

Note: the application currently exposes `GET`, `POST`, and `PATCH` for
Captures. There is no application `DELETE /api/captures/[id]` route yet. The
direct delete check verifies the database RLS delete policy only.

### Activities

| Test | Expected | Result |
| --- | --- | --- |
| User A creates an activity through `POST /api/activities` | ALLOWED | PASS |
| User B reads activities through `GET /api/activities` | User A activity is not returned | PASS |
| User B selects User A activity through direct authenticated Supabase anon client | DENIED / no row returned | PASS |
| User B updates User A activity through direct authenticated Supabase anon client | DENIED / no row updated | PASS |
| User B deletes User A activity through direct authenticated Supabase anon client | DENIED / no row deleted | PASS |

Note: the application currently exposes `GET` and `POST` for Activities only.
There are no application `PATCH` or `DELETE` activity routes yet. Direct update
and delete checks verify database RLS policies only.

## API Verification Checklist

For each table, use User B's access token against User A's record IDs:

1. Confirm unauthenticated requests return `401`.
2. Confirm invalid bearer tokens return `401`.
3. Confirm User B `GET` routes do not include User A rows.
4. Confirm User B mutation routes for User A record IDs return `404`.
5. Confirm soft-deleted Task and Note rows do not appear in `GET` responses.
6. Confirm no response includes another user's `user_id` row through normal API
   access.

## Direct Supabase RLS Checklist

Using an authenticated Supabase anon client as User B:

1. Attempt to select User A rows from `tasks`, `notes`, `captures`, and
   `activities`.
2. Attempt to update User A rows in each table.
3. Attempt to delete User A rows in each table.
4. Confirm each attempt returns no rows, no mutation, or an RLS permission
   failure.
5. Repeat the same checks as User A against User B rows.

## Security Review Summary

### Verified By Repository

- Current API routes require server-side Supabase Auth token validation.
- User ownership is derived from the validated bearer token.
- Current APIs do not trust client-provided `user_id`.
- Current read routes filter by authenticated `user_id`.
- Current create routes insert authenticated `user_id`.
- Current update routes scope by record ID and authenticated `user_id`.
- Current Task and Note delete routes perform ownership-scoped soft deletes.
- RLS migrations define owner-only policies for the four runtime tables.
- Static verification scripts check the relevant route and migration patterns.

### Still Pending

- Confirmation that service-role keys remain server-only in deployed bundles.

## If A Security Bug Is Found

Do not silently fix it inside a verification-only PR. Record:

- Severity
- Impact
- Affected table/API/policy
- Reproduction steps
- Recommended fix

Then open a focused security fix PR.

## Beta Readiness Gate

Runtime cross-user checks now pass for Tasks, Notes, Captures, Activities,
Search, Today, Command Palette, and Reset local data.

The remaining beta security requirement is deployment/bundle verification that
service-role keys remain server-only in the production environment.
