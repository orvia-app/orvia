# Personal OS Architecture

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
- `src/lib/*`: repositories, domain helpers, command registries, entity/search/activity/briefing/memory foundations.
- `src/data/mock.ts`: seed data for MVP defaults.
- `src/types/index.ts`: shared core domain types.

All TypeScript modules must use `.ts` or `.tsx` extensions. Extensionless TypeScript files are not allowed because they can confuse TypeScript, Next.js, and Turbopack resolution.

## Repository And Storage Boundary

Domain data access goes through typed repository helpers. Pages and components should not parse JSON or access `localStorage` directly.

Current repositories include:
- `src/lib/tasks.ts`
- `src/lib/notes.ts`
- `src/lib/finance.ts`
- `src/lib/cars.ts`
- `src/lib/quick-captures.ts`
- `src/lib/storage.ts` as the low-level safe storage adapter

This boundary is the migration point for future API routes, server actions, Supabase, PostgreSQL, or an offline sync engine. Storage schemas should remain typed, validated, and export-friendly.

Do not leave stale extensionless duplicates such as `src/lib/storage` beside `src/lib/storage.ts`. After moving or renaming repository files, verify the final file list with `rg --files`.

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
- Open AI Inbox

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

## Workspace And Tags Foundation

`src/lib/workspaces/*` defines stable workspace keys for personal, work, cars, business, and knowledge. The helpers map current legacy workspace IDs such as `1` and `2`, plus local domain aliases such as `finance`, into canonical workspace keys and labels.

Current storage still preserves existing workspace IDs where repositories expect them. Entity, activity, memory, search, and timeline helpers can use canonical labels without forcing a storage migration.

`src/lib/tags/*` defines lightweight tag types plus deterministic normalization, validation, deduplication, and search-text helpers. Tags are not yet a full UI feature; they are a foundation for future filtering, search ranking, memory context, and backend-owned tag records.

Future backend work should treat workspaces and tags as first-class organization primitives with user ownership, permissions, filtering, and migration paths from legacy local IDs.

## Search Architecture

Search is deterministic and local today. `src/lib/search.ts` maps domain data into normalized searchable entities and filters them by text.

Future search should extend the normalized model rather than rebuilding per-page mapping logic. Planned additions include:
- finance, cars, inbox captures, and memory results
- ranking and highlighting
- backend-backed indexes
- semantic embeddings generated server-side
- permission-aware retrieval

## Activity And Timeline Foundation

`src/lib/activity/*` defines typed activity events for task, note, inbox, finance, and car changes.

Activity items include stable IDs, timestamps, entity references, metadata, optional actor/workspace fields, and future sync fields. Feed helpers convert entities into activity items, merge and sort events deterministically, filter by type, and support pagination.

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

## Security Principles

- No frontend secrets.
- No direct client calls to privileged AI/payment/backend providers.
- Validate parsed storage before use.
- Keep user data structures clear, inspectable, exportable, and deletable.
- Avoid dependencies without a strong reason.
- Treat AI memory and AI action execution as privileged server-side features when implemented.
