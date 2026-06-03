# Orvia Data Boundary

This document defines how Orvia distinguishes cloud/account-backed data from browser-local data during the current transitional beta architecture.

## Current Cloud / Account-Backed Data

The following data is cloud-backed when the user is signed in and API requests succeed:

- Tasks through `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/[id]`, and `DELETE /api/tasks/[id]`
- Notes through `GET /api/notes`, `POST /api/notes`, `PATCH /api/notes/[id]`, and `DELETE /api/notes/[id]`
- Activities through `GET /api/activities` and `POST /api/activities`

These API routes validate the Supabase access token server-side, derive `user_id` from the validated user, and scope reads/writes to that user.

## Current Local-Only Data

The following data remains browser-local today:

- Inbox / quick captures
- Theme preference
- Onboarding state
- Command history
- Settings that are not explicitly cloud-backed
- Finance, Cars, and Automation Labs data
- Local task/note cache and signed-out task/note data

Local-only data is stored through repository/storage helpers. It is not account data, does not sync across devices, and may be lost if browser storage is cleared.

## Mixed / Transitional Surfaces

Some screens intentionally combine cloud-backed and local-only data while Orvia transitions from local-first MVP to authenticated cloud storage:

- Tasks and Notes prefer cloud data when signed in, but may include local-only cached items that have not been imported.
- Dashboard and Today use cloud-primary tasks when signed in, but Inbox counts are local-only.
- Search includes cloud tasks/activity when signed in and local notes/inbox sources where those modules still use local helpers.
- Settings provides a manual local-to-cloud import for supported local tasks and notes only.

Signed-in UI must never silently present local-only data as cloud/account data.

## Signed-In UI Rules

- Cloud-backed items should be labeled clearly where mixed data can appear.
- Local-only items should use compact labels such as `Local only`.
- Local fallback items should use compact labels such as `Local fallback`.
- Page-level helper copy should explain mixed surfaces without long warnings.
- Local Inbox/quick capture surfaces must not imply cloud sync exists.
- Activity/timeline data should only be fetched with an authenticated access token.

## Local Fallback Rules

Local fallback exists to keep the product usable when cloud reads or writes fail.

Rules:

- Fallback must be visible to the user.
- Fallback must not silently become account data.
- Fallback should not delete local data.
- Fallback should not auto-import local data.
- Fallback writes may update local browser cache but should be labeled as local fallback until cloud access succeeds.

## Settings Import Rules

The Settings local-to-cloud import is explicit and manual.

Rules:

- It only imports supported local tasks and notes.
- It requires a signed-in user and access token.
- It does not delete local browser data.
- It does not run automatically on login.
- It should show candidate counts before import.
- It should show a success/error summary after import.
- It must not import Inbox captures, settings, Labs data, or unsupported local records.

## Remaining Beta Risks

- Local-only browser data can still sit beside cloud data until the user imports or clears it.
- There is no full bidirectional sync engine yet.
- There is no conflict resolution UI yet.
- Inbox is still local-only and not account-backed.
- Finance, Cars, and Automation remain Labs/experimental and local-only.
- Source labels are UI-only and derived from the current loader result, not persisted as durable per-record sync metadata.

