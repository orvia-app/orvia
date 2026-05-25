# Personal OS Architecture

## Current Stack

- Next.js App Router
- React client components where interactivity is required
- TypeScript
- Tailwind CSS
- Local-first MVP storage via repository modules over `localStorage`
- Vercel-oriented deployment path

No backend, auth, sync engine, vector database, or real AI API integration exists yet.

## App Structure

- `src/app/*`: route pages and page-level UI orchestration.
- `src/components/AppShell.tsx`: application shell, navigation, and command center mount.
- `src/components/ThemeProvider.tsx`: theme state and document class management.
- `src/components/ui/*`: reusable UI primitives.
- `src/components/command-palette/*`: command palette, action dialog, and related hooks.
- `src/lib/*`: domain repositories, typed helpers, search, briefing, entities, and command registries.
- `src/data/mock.ts`: current seed data for MVP/demo defaults.
- `src/types/index.ts`: shared core domain types.

## Repository Pattern

Domain data access goes through typed repository helpers. Pages and components should not parse JSON or access `localStorage` directly.

Current repositories include:
- `src/lib/tasks.ts`
- `src/lib/notes.ts`
- `src/lib/finance.ts`
- `src/lib/cars.ts`
- `src/lib/quick-captures.ts`
- `src/lib/storage.ts` as the low-level safe storage adapter

This keeps the path open to replace local storage with API routes, Supabase, PostgreSQL, server actions, or a sync engine.

## Entity System

`src/lib/entities/*` defines a lightweight universal entity model for:
- task
- note
- finance transaction
- car
- inbox item

Entities have stable typed IDs, metadata, timestamps where available, workspace awareness where appropriate, URLs, searchable text, relation hooks, and future memory tags.

This is the foundation for:
- universal search
- AI memory references
- semantic search
- timeline/activity feeds
- cross-entity relations

## Command System

The command system is split into:
- command types and registries in `src/lib/commands/*`
- command palette UI and hooks in `src/components/command-palette/*`
- a thin `AppShell` mount through `CommandCenter`

Current commands support navigation and lightweight create actions. The action model is extensible for future task creation, note creation, AI actions, entity opening, backend results, and integration workflows.

## Search Architecture

Search is currently deterministic and local. `src/lib/search.ts` maps domain data into normalized searchable entities and filters them by text.

Future search can add:
- backend-backed entity indexes
- semantic embeddings
- vector retrieval
- permission-aware search
- AI memory retrieval

The page should continue consuming normalized search results rather than rebuilding per-domain mapping logic.

## Briefing Foundation

`src/lib/briefing.ts` contains deterministic aggregation helpers for overdue tasks, today tasks, recent notes, and recent captures. It does not call AI.

Future daily briefing can use this module as a structured input source for server-side AI summarization.

## SSR and Client Boundaries

- Browser APIs must be guarded and isolated behind client-safe hooks or repository adapters.
- Initial render should be deterministic to avoid hydration mismatches.
- Client components may hydrate from local repositories after mount when local browser state can differ from static seed data.
- Server-side AI or backend access should not be introduced into client components.

## Future Backend Direction

The likely backend path should support:
- authenticated users
- relational persistence
- per-user data ownership
- cloud sync with local-first behavior
- export/delete flows
- auditability for AI actions
- billing and subscription state

Current repositories should become the boundary for backend migration.

## Future AI and Memory Direction

AI should be server-side only. Future memory architecture should build on normalized entities, explicit metadata, search indexes, and user-controlled retrieval.

Planned AI surfaces:
- daily briefing
- semantic search
- inbox parsing
- task prioritization
- entity summaries
- timeline insights
- safe action execution

## Security Principles

- No frontend secrets.
- No client-side API keys.
- Validate parsed storage before use.
- Keep user data structures clear and exportable.
- Avoid adding third-party packages without a strong reason.
- Treat future AI calls as privileged server-side operations.
