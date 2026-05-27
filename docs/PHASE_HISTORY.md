# Archflow Phase History

This is a concise milestone memory for teammates, reviewers, and future AI sessions. It is not a full changelog.

## v0.2 UX Foundation

What changed:
- Added shared UI primitives and visual polish across core surfaces.
- Introduced Dashboard Recent Activity and Today Daily Briefing previews.
- Added Command Center route/action flows, task/note creation dialogs, onboarding v1, and Archflow branding.
- Improved theme, modal, density, sidebar, scrollbar, and mobile-aware UI details.

Why it matters:
- Moved the app away from demo CRUD surfaces toward a calmer productivity product.
- Established reusable UI patterns and command-first interaction.
- Made the capture -> organize -> recall loop visible.

Deferred:
- Real AI.
- Backend/auth/sync.
- Native mobile capture.
- Deep module personalization.

## v0.3 Architecture And Mobile Foundation

What changed:
- Consolidated storage keys and browser storage access behind adapters/repositories.
- Added core entity, relation, search, activity, capture, memory, and sync metadata foundations.
- Improved timeline/search/memory/context behavior with deterministic local logic.
- Added responsive shell foundations with mobile header/drawer and hydration/theme fixes.

Why it matters:
- Created a safer path from localStorage MVP to IndexedDB/Supabase/cloud sync.
- Reduced page-level persistence coupling.
- Made mobile navigation viable without changing routes.

Deferred:
- Cloud repository adapter.
- Persisted sync queue.
- Real conflict resolution.
- Backend-enforced authorization.

## v0.4 Backend Planning And Teammate Docs

What changed:
- Added backend, database, sync, security, environment, QA, contribution, and Telegram planning docs.
- Recommended Supabase/PostgreSQL for MVP backend.
- Documented auth, RLS, AI privacy, Telegram, data deletion, and teammate workflows.

Why it matters:
- Turned backend work into a staged plan instead of an ad hoc integration.
- Created shared expectations for engineers, designers, QA, and AI coding sessions.
- Clarified what is not live yet.

Deferred:
- Supabase project setup.
- Auth UI.
- API routes/server actions.
- Applied migrations.

## v0.5 Backend And Sync Infrastructure Prep

What changed:
- Added `.env.example` placeholders and centralized env access through `src/env/server.ts` and `src/env/client.ts`.
- Added backend-ready type foundations in `src/core/auth/*`, `src/core/backend/*`, and `src/core/sync/*`.
- Added deterministic local sync helpers for operation IDs, queue transforms, device IDs, and conflict models.
- Added Supabase factory seams in `src/server/supabase/*` and `src/lib/supabase/*`.

Why it matters:
- Established server/client boundaries before any real provider integration.
- Prepared future sync/auth work without changing local-first behavior.
- Reduced risk of frontend secret leakage.

Deferred:
- Supabase SDK installation.
- Live auth/session management.
- Real networking, polling, or background sync.
- Cloud persistence.

## v0.6 Supabase Schema And RLS Foundation

What changed:
- Added initial Supabase migration SQL for profiles, workspaces, tasks, notes, captures, activity events, entity relations, memory candidates, finance transactions, cars, preferences, module preferences, integrations, and user integrations.
- Added updated-at triggers, ownership indexes, soft-delete columns, sync-ready fields, and RLS policies.
- Corrected product architecture so modules are optional per user through `user_module_preferences`.
- Added global integration registry and per-user integration state without storing provider secrets.

Why it matters:
- Established a production-oriented database foundation before wiring the app to cloud services.
- Preserved optional module direction instead of assuming every user needs every feature.
- Kept Telegram and future integrations backend-dependent and secure by design.

Deferred:
- Applying migrations to a real Supabase project.
- Auth UI and account setup.
- Default module preference creation.
- Cloud repository adapter and local data migration.
- Team sharing/collaboration policies.
