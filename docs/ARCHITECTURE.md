# Orvia Architecture

## Related Documentation

- `docs/PROJECT_OVERVIEW.md`: teammate-friendly product and MVP overview.
- `docs/ARCHITECTURE_DECISIONS.md`: ADR-style summary of major technical decisions.
- `docs/DEVELOPMENT_GUIDE.md`: local development and module workflow.
- `docs/QA_CHECKLIST.md`: manual QA expectations before merge.
- `docs/BACKEND_PLAN.md`: backend/auth/sync implementation plan.
- `docs/DATABASE_SCHEMA.md`: Supabase/PostgreSQL schema draft.
- `docs/SYNC_STRATEGY.md`: local-first to cloud sync strategy.
- `docs/TELEGRAM_INTEGRATION_PLAN.md`: future Telegram capture plan.

## Current Stack

- Next.js App Router
- React client components where interactivity is required
- TypeScript
- Tailwind CSS
- Local-first MVP storage through repository modules over `localStorage`
- Vercel-oriented deployment path

No backend, authentication, cloud sync, vector database, production AI calls, or payment integration exists yet.

## App Structure

- `src/app/*`: route pages and page-level UI orchestration.
- `src/components/AppShell.tsx`: application shell, sidebar navigation, theme controls, and command center mount.
- `src/components/ThemeProvider.tsx`: theme state and document class management.
- `src/components/ui/*`: reusable UI primitives such as cards, buttons, badges, sections, empty states, and skeletons.
- `src/components/command-palette/*`: command palette, action dialog, and command hooks.
- `src/core/*`: backend-ready core contracts for storage adapters, repositories, normalized entities, relations, search, capture, activity events, and memory retrieval seams.
- `src/lib/*`: repositories, domain helpers, command registries, entity/search/activity/briefing/memory foundations.
- `src/types/index.ts`: shared core domain types.

All TypeScript modules must use `.ts` or `.tsx` extensions. Extensionless TypeScript files are not allowed because they can confuse TypeScript, Next.js, and Turbopack resolution.

## Repository And Storage Boundary

Domain data access goes through typed repository helpers. Pages and components should not parse JSON or access `localStorage` directly.

New local workspaces start empty. Legacy demo/test records from earlier MVP seed data are filtered by repository helpers instead of being presented as normal user data.

Current public domain helpers include:
- `src/lib/tasks.ts`
- `src/lib/notes.ts`
- `src/lib/finance.ts`
- `src/lib/cars.ts`
- `src/lib/quick-captures.ts`

Core storage and repository contracts live in:
- `src/core/storage/keys.ts`: single registry for all app-owned browser storage keys. Legacy `personal-os.*` key names remain intentionally unchanged after the Orvia visible rebrand.
- `src/core/storage/storage-adapter.ts`: typed adapter interface plus safe JSON helpers.
- `src/core/storage/local-storage-adapter.ts`: browser-safe localStorage implementation.
- `src/core/repositories/*`: generic list/entity repository contracts and local JSON repository implementation.

`src/lib/storage.ts` remains a compatibility bridge so older imports keep working, but it delegates to the core adapter. Domain helpers keep their existing APIs and now delegate to reusable local repositories.

This boundary is the migration point for future API routes, server actions, Supabase, PostgreSQL, or an offline sync engine. Storage schemas should remain typed, validated, and export-friendly.

Do not leave stale extensionless duplicates such as `src/lib/storage` beside `src/lib/storage.ts`. After moving or renaming repository files, verify the final file list with `rg --files`.

## Environment Boundary

Environment variables are accessed only through:
- `src/env/server.ts`: server-only env plus public server-readable values.
- `src/env/client.ts`: browser-safe `NEXT_PUBLIC_*` values only.

No app code should read `process.env` directly outside those modules. This keeps secret review centralized and reduces the chance of accidentally exposing server-only values to the browser.

## Command System

The command system is split into:
- command types and registries in `src/lib/commands/*`
- route commands in `src/lib/commands/routes.ts`
- action commands in `src/lib/commands/actions.ts`
- command palette UI and hooks in `src/components/command-palette/*`
- a thin `AppShell` mount through `CommandCenter`

Commands use typed action unions so navigation, task creation, note creation, AI actions, entity opening, and future backend results can share one execution surface without putting action logic inside `AppShell`.

## Action Command Flow

Current action commands support:
- Create Task
- Create Note
- Open Inbox

The palette handles keyboard discovery and selection. Action execution is delegated to command hooks/components. Creation flows persist through existing task/note repositories, keeping storage and validation concerns outside the palette UI.

Future action flows should preserve this pattern:
- command registry provides typed command definitions
- command UI collects minimal input
- domain repository/service executes the operation
- command center stays orchestration-only

## Entity Model

`src/lib/entities/*` defines a lightweight universal entity model for:
- task
- note
- finance transaction
- car
- inbox item

Entities include stable typed IDs, source IDs, title/subtitle helpers, metadata, timestamps where available, workspace awareness where appropriate, URLs, searchable text, relation hooks, and memory tags.

The entity layer is the shared substrate for search, activity, memory, future relations, and backend synchronization.

`src/core/entities/*` adds the backend-ready normalized entity foundation. It defines:
- `BaseEntity`
- `EntityRelation`
- `EntityMetadata`
- `SyncMetadata`
- deterministic relation scoring
- adapters from current domain models into core entities

Current domain models are not force-migrated. Mappers keep UI types stable while preparing future sync, soft delete, versioning, and source-aware AI retrieval.

## Workspace And Tags Foundation

`src/lib/workspaces/*` defines stable workspace keys for personal, work, cars, business, and knowledge. The helpers map current legacy workspace IDs such as `1` and `2`, plus local domain aliases such as `finance`, into canonical workspace keys and labels.

Current storage still preserves existing workspace IDs where repositories expect them. Entity, activity, memory, search, and timeline helpers can use canonical labels without forcing a storage migration.

`src/lib/tags/*` defines lightweight tag types plus deterministic normalization, validation, deduplication, and search-text helpers. Tags are not yet a full UI feature; they are a foundation for future filtering, search ranking, memory context, and backend-owned tag records.

Future backend work should treat workspaces and tags as first-class organization primitives with user ownership, permissions, filtering, and migration paths from legacy local IDs.

## Search Architecture

Search is deterministic and local today. `src/lib/search.ts` maps tasks and notes into searchable entities for legacy/simple usage. Universal search is bridged through `src/lib/universal-search.ts`, which delegates to `src/core/search/*`.

The core search layer separates:
- text normalization
- result types
- local retrieval
- result ranking/mapping

Future search should extend the normalized model rather than rebuilding per-page mapping logic. Planned additions include:
- finance, cars, inbox captures, and memory results
- ranking and highlighting
- backend-backed indexes
- semantic embeddings generated server-side
- permission-aware retrieval

## Activity And Timeline Foundation

`src/lib/activity/*` defines typed activity events for task, note, inbox, finance, and car changes.

Activity items include stable IDs, timestamps, entity references, metadata, optional actor/workspace fields, and future sync fields. Feed helpers convert entities into activity items, merge and sort events deterministically, filter by type, and support pagination.

`src/core/activity/*` adds an event-sourcing-lite shape for future sync/audit work. Existing timeline behavior still uses the current local activity feed, while core event adapters can map activity items into backend-ready events with source and sync metadata.

This foundation can later power a visible timeline, audit history, AI memory context, daily/weekly recaps, analytics, and sync conflict review.

## Briefing Foundation

`src/lib/briefing.ts` contains deterministic aggregation helpers for:
- overdue tasks
- today tasks
- recent notes
- recent captures

The Today page uses this foundation for a local Daily Briefing preview. Future AI briefing should treat these helpers as structured server-side input, not as a client-side AI call site.

## AI Memory Foundation

`src/lib/memory/*` defines an inspectable memory model with:
- stable memory IDs
- source references to entities and activity items
- source types for task, note, inbox, activity, and manual memory
- importance levels
- timestamps
- user/workspace ownership placeholders
- optional vector/embedding references
- deterministic candidate and index helpers

The Dashboard Memory Preview renders read-only candidates from existing entities/activity. There is no memory persistence, no embedding generation, no AI provider call, and no backend memory service yet.

`src/core/memory/*` exposes memory candidate generation, ranking, relation signals, retrieval, and indexing through a core namespace. Current behavior delegates to deterministic local helpers; future AI retrieval can replace or extend this layer without pushing provider logic into UI components.

## Capture Pipeline Foundation

Inbox capture remains deterministic and local. `src/lib/inbox.ts` owns the current parser and preview helpers.

`src/core/capture/*` introduces a pipeline shape:

capture input → normalize → classify → enrich → suggest → preview → persist

The current deterministic parser is bridged into that pipeline. Future AI classification should replace the classifier stage server-side while preserving preview, user control, and repository persistence.

## Sync-Ready Metadata

Core entities include sync metadata fields for future backend work:
- version
- sync status
- source
- last synced timestamp
- device ID
- optional deleted timestamp

These fields are type foundations only. There is no network sync, offline queue, conflict resolver, auth, Supabase, or backend persistence yet.

`src/core/auth/*`, `src/core/backend/*`, and `src/core/sync/*` now provide backend-ready type foundations for sessions, backend errors, sync operations, device IDs, and conflict handling. The sync helpers are local and deterministic only; they do not persist an operation queue, start timers, poll, or contact a backend.

## SSR And Hydration Safety

Patterns to preserve:
- initial renders must be deterministic
- browser-backed data should load after mount in client components
- browser APIs must be guarded with `typeof window !== "undefined"`
- date rendering should avoid locale/time-dependent SSR output unless stabilized
- storage parsing belongs in repositories, not pages
- AI/backend access must not be introduced into client components

Before finishing code changes, run `git diff --check` and `npm run build`. If Next/Turbopack reports odd parser or module cache errors after renames, clear `.next` with `rm -rf .next` and rebuild.

## Future Backend/Auth/Sync Direction

The likely SaaS path should support:
- authenticated users and secure sessions
- per-user and workspace-level data ownership
- relational persistence, likely PostgreSQL through a managed backend such as Supabase
- row-level security or equivalent authorization controls
- local-first sync with conflict handling
- export/delete flows
- server-side AI gateways
- billing and subscription state
- auditability for AI actions and sensitive operations

Repositories should become the compatibility layer between current local-first MVP storage and future backend/sync infrastructure.

The intended migration path is:

UI → hooks/services → public domain helpers → repository contracts → storage adapter

The initial adapter is localStorage. Future adapters can target IndexedDB, server actions, Supabase/PostgreSQL, or a sync engine while preserving current helper APIs during migration.

Backend planning references:
- `docs/BACKEND_PLAN.md`: recommended Supabase MVP path, auth model, implementation phases, and open questions.
- `docs/DATABASE_SCHEMA.md`: first PostgreSQL schema draft for users/profiles, workspaces, tasks, notes, captures, activity events, entity relations, memory candidates, finance, cars, and preferences.
- `docs/SYNC_STRATEGY.md`: localStorage → IndexedDB → Supabase migration path, sync metadata, conflict handling, operation queue direction, and deletion behavior.

Current recommendation: use Supabase/PostgreSQL for the MVP backend while keeping Next.js server routes for AI gateways, Stripe webhooks, and privileged operations. A custom backend is not recommended for the first backend phase because it would add auth, session, database, authorization, migrations, and operations work before the product needs that flexibility.

Backend implementation must preserve local-only mode. Authenticated cloud sync should be added behind repository adapters rather than by introducing direct persistence calls in pages.

Initial auth should start with email/password and secure session handling. OAuth can follow after the core account model, export/delete behavior, and RLS policies are stable.

Supabase preparation currently consists of typed config readiness and factory seams only:
- `src/server/supabase/*` for server-side future client creation.
- `src/lib/supabase/*` for browser-safe future client creation.

There is no Supabase dependency, live query, auth UI, server action, API route, or storage migration yet.

## Security Principles

- No frontend secrets.
- No direct client calls to privileged AI/payment/backend providers.
- Validate parsed storage before use.
- Keep user data structures clear, inspectable, exportable, and deletable.
- Avoid dependencies without a strong reason.
- Treat AI memory and AI action execution as privileged server-side features when implemented.
