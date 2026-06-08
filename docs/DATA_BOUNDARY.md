# Orvia Data Boundary

This document defines how Orvia distinguishes cloud/account-backed data from browser-local data during the current transitional beta architecture.

## Current Cloud / Account-Backed Data

The following data is cloud-backed when the user is signed in and API requests succeed:

- Tasks through `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/[id]`, and `DELETE /api/tasks/[id]`
- Notes through `GET /api/notes`, `POST /api/notes`, `PATCH /api/notes/[id]`, and `DELETE /api/notes/[id]`
- Activities through `GET /api/activities` and `POST /api/activities`
- Inbox captures through `GET /api/captures`, `POST /api/captures`, and `PATCH /api/captures/[id]`

These API routes validate the Supabase access token server-side, derive `user_id` from the validated user, and scope reads/writes to that user.

## Current Local-Only Data

The following data remains browser-local today:

- Theme preference
- Onboarding state
- Command history
- Settings that are not explicitly cloud-backed
- Finance, Cars, and Automation Labs data
- Signed-out task/note/capture data

Signed-out Inbox and Quick Capture remain local-only. Signed-in Inbox and Quick Capture are API-primary, with local fallback if the capture API is unavailable.

Local-only data is stored through repository/storage helpers. It is not account data, does not sync across devices, and may be lost if browser storage is cleared.

New local workspaces start empty. Earlier MVP demo/test records are no longer seeded; exact known legacy demo records are filtered from normal local views so a new user does not see project sample data as their own workspace.

The Settings local reset action removes every Orvia-owned browser storage key
that starts with `personal-os.`, including legacy local-only keys and
authenticated user-scoped cache keys such as `personal-os.user.<userId>.*`.

## Mixed / Transitional Surfaces

Some screens intentionally combine cloud-backed and local-only data while Orvia transitions from local-first MVP to authenticated cloud storage:

- Tasks, Notes, and Inbox captures prefer cloud data when signed in. Authenticated cache data is scoped by Supabase user id so users on the same browser do not inherit another signed-in user's cached records.
- Successful cloud refreshes preserve authenticated records that were explicitly created as device-only fallback records. This keeps failed-write recovery visible without pretending those records were uploaded.
- Dashboard and Today use cloud-primary tasks and cloud-primary Inbox captures when signed in, with visible local fallback copy if cloud reads fail.
- Search includes account tasks, account notes, account Inbox captures, and account activity when signed in. Signed-out search uses data saved on the current device.
- Settings provides a manual local-to-cloud import for supported local tasks and notes only.

Signed-in UI must never silently present local-only data as cloud/account data.

## Signed-In UI Rules

- Cloud-backed items should be labeled clearly where mixed data can appear.
- Local-only items should use compact labels such as `Local only`.
- Local fallback items should use compact labels such as `Device only`.
- Page-level helper copy should explain mixed surfaces without long warnings.
- Inbox/quick capture surfaces must label cloud-primary, local-only, or local fallback mode clearly.
- Activity/timeline data should only be fetched with an authenticated access token.

## Local Fallback Rules

Local fallback exists to keep the product usable when cloud reads or writes fail.

Rules:

- Fallback must be visible to the user.
- Fallback must not silently become account data.
- Fallback should not delete local data.
- Fallback should not auto-import local data.
- Signed-in fallback writes must use user-scoped browser cache keyed by authenticated user id.
- Signed-in fallback writes must be marked as device-only fallback records so later successful cloud refreshes do not hide them.
- If a signed-in delete fails, the item may be hidden on that device only; it must not be described as deleted from the account.
- Signed-out fallback writes may update shared browser-local storage and should be labeled as device-only data.

## Settings Import Rules

The Settings local-to-cloud import is explicit and manual.

Rules:

- It only imports supported local tasks and notes.
- It requires a signed-in user and access token.
- It does not delete local browser data.
- It does not run automatically on login.
- It should show candidate counts before import.
- It should show a success/error summary after import.
- It must not import Inbox captures, settings, Labs data, or unsupported local records. Capture import/migration remains a separate future workflow.
- It does not upload signed-in device-only fallback changes yet. Those records remain visible as device-only recovery data until a future sync queue/import flow exists.

## Remaining Beta Risks

- Signed-out local-only browser data remains device-scoped, not account-scoped.
- User-scoped authenticated cache is an offline recovery cache, not full bidirectional sync.
- Reset local data removes Orvia-owned browser storage state and then reloads the app so in-memory React state is discarded.
- There is no full bidirectional sync engine yet.
- There is no conflict resolution UI yet.
- Existing local Inbox captures are not automatically migrated to cloud.
- Cloud capture processing currently supports status changes only; there is no full capture edit/delete UI yet.
- Finance, Cars, and Automation remain Labs/experimental and local-only.
- Source labels are UI-only and derived from the current loader result, not persisted as durable per-record sync metadata.
