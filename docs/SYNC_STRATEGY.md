# Orvia Sync Strategy

## Current State

Orvia is local-first. User data is stored in browser storage through typed repositories and storage adapters. There is no backend, auth, cloud sync, operation queue, realtime, or conflict resolver yet.

The current architecture target remains:

UI → hooks/services → repositories → storage adapters

The future sync layer should plug in below repository contracts rather than pushing network behavior into pages.

## Migration Path

### Step 1: localStorage Adapter

Current MVP:
- simple local persistence
- typed validators
- export/reset controls
- local-only onboarding/theme/command history

Limitations:
- no durable large-data storage
- no multi-device sync
- no conflict handling
- not suitable for secrets

### Step 2: IndexedDB Adapter

Use IndexedDB when local datasets, offline queues, or larger memory/search indexes outgrow localStorage.

Purpose:
- larger local cache
- operation queue storage
- local search index cache
- sync metadata per record

This can be introduced before or alongside Supabase without changing UI contracts.

### Step 3: Supabase / Cloud Adapter

Add cloud repositories behind existing contracts:
- authenticated reads/writes
- per-user RLS
- workspace-scoped records
- server-generated timestamps where needed
- local cache retained for offline/read performance

Cloud sync should be opt-in or account-bound, with clear migration from local-only data.

## Sync Metadata

Every syncable record should support:
- `version`
- `syncStatus`
- `source`
- `lastSyncedAt`
- `deviceId`
- `deletedAt`

Current core entity types already model these fields. Backend tables should store equivalent columns for user-owned records.

## Conflict Handling

Initial strategy:
- Prefer explicit conflict detection over silent overwrites.
- Use `version` and `updated_at` to detect stale writes.
- Treat `deleted_at` as a first-class state, not as absence.
- Keep the local operation that caused a conflict inspectable.

Early MVP conflict resolution:
- last-write-wins only for low-risk preferences.
- field-level merge where safe for tags/metadata.
- user-visible conflict state for notes/tasks if both sides changed meaningful content.

Future strategy:
- operation queue with causal metadata.
- per-field merge policies.
- conflict review UI for high-value records.

## Delete And Reset Behavior

Local reset currently clears known app-owned browser keys only. Legacy `personal-os.*` key names remain intentionally unchanged after the Orvia visible rebrand.

Future cloud deletion must:
- mark records with `deleted_at`
- sync tombstones to all devices
- remove derived memory and embeddings linked to deleted sources
- remove queued operations for deleted entities
- respect backup/legal retention windows
- record auditable deletion metadata without retaining unnecessary personal content

## Operation Queue Later

A future queue should store:
- operation ID
- user ID
- device ID
- entity type and ID
- operation type
- payload or patch
- base version
- created timestamp
- retry state
- error state

Do not add this until cloud repositories and auth are in place.

Current preparation:
- `src/core/sync/types.ts` defines operation, status, device, and conflict models.
- `src/core/sync/operation-queue.ts` provides pure local queue transforms and deterministic operation IDs.
- `src/core/sync/conflict-resolution.ts` provides deterministic conflict detection and low-risk preference resolution helpers.
- `src/core/sync/device.ts` provides deterministic device ID helpers.

These helpers do not persist data, start background work, open network connections, or imply that cloud sync exists.

## AI And Sync

AI-derived data must remain source-linked:
- memory candidates
- summaries
- embeddings
- AI action logs

Deleting or excluding a source entity should delete, regenerate, or invalidate derived AI records. Embeddings should not become orphaned shadow copies of deleted user data.

## Implementation Guardrails

- No direct network calls from pages for domain persistence.
- No direct localStorage reads from pages/components.
- No service-role keys in the browser.
- RLS must protect every user-owned table before browser clients can access Supabase.
- Sync must preserve local-only mode.
- Export/delete flows must include synced and derived data before production cloud launch.
