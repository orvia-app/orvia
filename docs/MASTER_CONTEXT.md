# Orvia Master Context

## Current Status In One Paragraph

Orvia is a local-first, frontend-only MVP for a future AI-native productivity operating system. It currently runs as a Next.js App Router app with TypeScript, Tailwind, typed local repositories, storage adapters, command workflows, deterministic capture/search/timeline/memory foundations, responsive navigation, and planning docs for Supabase/auth/sync. It does not yet have production auth, backend persistence, cloud sync, real AI provider calls, payments, Telegram capture, or external integrations.

## What Orvia Is

Orvia is a calm personal operating layer for capture, organization, recall, and action. It should help users drop anything into one trusted workspace, structure it into tasks/notes/captures/entities, retrieve it later through search/timeline/memory, and eventually act through safe user-approved AI and automation.

Orvia is not an admin panel, CRUD dashboard, generic chatbot, or demo parser.

## Naming Status

Orvia is the current visible product brand after Rebrand Phase 1. The prior working name was Archflow.

Before buying domains, naming production Supabase/Vercel projects, creating Telegram bots, or preparing public beta/App Store assets, read `docs/BRANDING_NAMING.md` and `docs/REBRAND_PLAN.md`. External validation is still required before public infrastructure is named.

## Product Vision

Long term, Orvia should become a private, command-first AI operating system for personal and work context. The product moat is not a single model call; it is the combination of trusted capture, structured local data, explicit memory, timeline context, workspace/tag organization, and safe actions.

## Current Product State

Implemented today:
- Responsive app shell with desktop sidebar, mobile drawer, theme controls, and Command Center mount.
- Dashboard with onboarding, Recent Activity, and Memory Preview.
- Inbox universal capture with deterministic parsing and preview metadata.
- Tasks and Notes with local persistence, filtering, and related context.
- Search over normalized local entities, activity, and memory candidates.
- Timeline activity feed with recency grouping and contextual routing.
- Today with Focus Plan and deterministic Daily Briefing.
- Command Center with route/action commands, command history, and Create Task/Create Note flows.
- Finance and Cars as early local-first modules.
- Settings with theme, local export/reset, and onboarding reset.
- Entity, relation, memory, activity, briefing, capture, workspace, tag, storage, repository, auth, backend, and sync foundations.

## Current Stack

- Next.js App Router.
- React client components where interactivity is required.
- TypeScript.
- Tailwind CSS.
- Local-first persistence through typed repositories over browser storage.
- Vercel-oriented deployment path.
- Supabase/PostgreSQL planned for MVP backend, but not connected.

## Architecture Principles

- UI -> hooks/services -> repositories -> storage adapters.
- Pages orchestrate UI and state; domain logic belongs in `src/lib/*` and `src/core/*`.
- Storage keys are centralized in `src/core/storage/keys.ts`.
- Browser storage access is isolated behind storage adapters and repository helpers.
- Core models prepare backend/sync/AI without force-migrating all UI domain types at once.
- `AppShell` stays thin.
- Deterministic local behavior comes before real AI or cloud sync.
- No broad rewrites or parallel architectures without a clear migration plan.

## Local-First Philosophy

Orvia currently stores data locally in the browser. Local-first is used for fast iteration, privacy-first defaults, and offline-friendly product shaping. Browser storage is not a secure vault and does not sync across devices.

Future cloud sync must preserve an intentional local-only mode and use repository adapters instead of direct network calls from pages.

## Current Implemented Systems

- Storage/repository layer: `src/core/storage/*`, `src/core/repositories/*`, and compatibility helpers in `src/lib/*`.
- Entity/search foundation: normalized entity mapping, deterministic search, and future semantic search seams.
- Activity/timeline foundation: local events for tasks, notes, captures, finance, and cars.
- Memory/context foundation: deterministic source-linked memory candidates, ranking, and relationship helpers.
- Capture pipeline: deterministic inbox classification, workspace/tag suggestions, and preview structure.
- Command system: route commands, action commands, recent history, and typed future action unions.
- Data management: local export/reset helpers that only target known Orvia-owned browser storage keys. Legacy `personal-os.*` key names remain intentionally unchanged for compatibility.
- Environment boundary: `src/env/server.ts` and `src/env/client.ts`.
- Backend prep: typed auth/backend/sync models and Supabase factory seams with no live connection.

## Backend And Supabase Status

Supabase is the recommended MVP backend, but it is not wired into the app.

Current backend preparation:
- `.env.example` contains blank placeholders only.
- `src/env/*` centralizes environment access.
- `src/core/auth/*`, `src/core/backend/*`, and `src/core/sync/*` define type foundations.
- `src/server/supabase/*` and `src/lib/supabase/*` are factory seams only.
- `supabase/migrations/202605270001_initial_schema.sql` defines schema/RLS preparation only.

The migration includes user-owned product tables, module preferences, integration registry/state, updated-at triggers, indexes, and RLS policies. It has not been applied and no Supabase SDK dependency is installed.

## AI Status

AI is not live. Current AI-like behavior is deterministic or mock-only:
- AI Chat is mock-only.
- Memory Preview is deterministic and local.
- Inbox parsing is deterministic.
- Search and ranking are deterministic.

Future AI must run server-side, use source-linked context, respect deletion/export, avoid frontend secrets, and require confirmation for destructive or high-impact actions.

## Telegram Status

Telegram capture is future work. It requires backend/auth first for bot token storage, webhook validation, account linking, rate limiting, and deletion/export coverage. Telegram bot tokens must never be client-side, committed, or stored in `user_integrations`.

## Mobile Status

The web app has a responsive shell with desktop sidebar and mobile drawer. Mobile capture is product-important, but there is no native iOS app, PWA install flow, share-sheet capture, or Telegram capture yet.

## Security Rules

- No frontend secrets.
- No service-role key in browser code.
- No direct AI provider calls from client components.
- No integration tokens in browser storage.
- No direct `localStorage` in pages/components except the guarded theme pre-hydration script.
- Treat `NEXT_PUBLIC_*` as public.
- Keep RLS enabled and reviewed before browser Supabase access.
- Keep AI, Stripe, Telegram, and privileged integrations server-side.
- Validate parsed storage data.
- Run `npm run typecheck`, `npm run build`, and `git diff --check` before handoff.

## Current Constraints

- No backend/auth/cloud sync is live.
- No real AI/API/provider call is live.
- No payments or external integrations are live.
- No new dependencies unless strongly justified.
- Preserve local-first behavior and existing routes.
- Do not rename localStorage keys without migration.
- Do not create extensionless TypeScript files.
- Do not overclaim product capability.

## Intentionally Not Implemented Yet

- Production backend.
- Authentication and account deletion.
- Cloud sync and conflict resolution.
- IndexedDB cache or operation queue persistence.
- Real AI gateway, embeddings, or vector search.
- Telegram webhook/account linking.
- Stripe billing.
- Collaboration/shared workspaces.
- Settings -> Modules UI.
- Native mobile app.

## How Future Work Should Be Approached

Start from existing architecture and extend it:
- Add domain logic in typed helpers/repositories, not pages.
- Add backend behavior behind repository adapters.
- Add AI behavior through server-side routes only.
- Keep deterministic local behavior inspectable.
- Preserve export/delete implications for every new data type.
- Update docs when product scope, architecture, security, setup, or QA changes.

Before coding major work, read the specific plan docs:
- Backend: `docs/BACKEND_PLAN.md`, `docs/DATABASE_SCHEMA.md`, `docs/SUPABASE_MIGRATIONS.md`, `docs/SYNC_STRATEGY.md`.
- Security/env: `docs/SECURITY.md`, `docs/ENVIRONMENT.md`, `docs/ENGINEERING_RULES.md`.
- Product: `docs/PRODUCT.md`, `docs/PRODUCT_PRINCIPLES.md`, `docs/ROADMAP.md`.
- Naming/brand: `docs/BRANDING_NAMING.md`.
- Teammate workflow: `docs/DEVELOPMENT_GUIDE.md`, `docs/CONTRIBUTING.md`, `docs/QA_CHECKLIST.md`.
- Telegram: `docs/TELEGRAM_INTEGRATION_PLAN.md`.

## How To Brief A New AI Assistant

Use this brief:

> You are working on Orvia, a local-first, frontend-only MVP for a future AI-native productivity operating system. Read `AGENTS.md`, `docs/MASTER_CONTEXT.md`, `docs/PRODUCT_PRINCIPLES.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and `docs/DEVELOPMENT_GUIDE.md` before editing. Do not add backend, auth, sync, real AI, provider calls, payments, or dependencies unless explicitly requested. Preserve local-first behavior, routes, storage keys, Command Center, timeline, theme behavior, and mobile shell. No direct `localStorage` in pages/components, no frontend secrets, no fake AI claims, no broad rewrites. Use typed repositories/helpers and shared UI primitives. Run `npm run typecheck`, `npm run build`, and `git diff --check` before finishing.

For backend-related tasks, add:

> Also read `docs/BACKEND_PLAN.md`, `docs/DATABASE_SCHEMA.md`, `docs/SUPABASE_MIGRATIONS.md`, and `docs/SYNC_STRATEGY.md`. Supabase is planned but not connected. Migrations exist as schema/RLS preparation only. Do not expose service-role keys or store provider secrets in user-owned tables.
