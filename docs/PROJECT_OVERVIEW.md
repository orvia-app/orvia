# Archflow Project Overview

## What Archflow Is

Archflow is a local-first, AI-native productivity and life operating system. It is designed to help users capture, organize, retrieve, and act on personal and work context across tasks, notes, inbox captures, search, timeline, memory, finance, cars, and future automation.

The current app is a frontend-only MVP. It is not a production SaaS backend yet.

## Product Vision

Archflow should become a private second brain and operating layer that:
- captures anything quickly
- organizes user context into useful entities
- resurfaces relevant information at the right time
- supports keyboard-first action through Command Center
- adds real AI only through privacy-aware server-side infrastructure
- preserves user control, exportability, and deletion

## Current MVP Scope

Current scope:
- Next.js App Router frontend
- TypeScript and Tailwind CSS
- local-first browser persistence through repositories
- responsive shell with desktop sidebar and mobile drawer
- deterministic capture, search, timeline, briefing, and memory foundations
- no backend dependencies

Current data is stored locally in browser storage through typed repository helpers. Browser storage is not a secure vault and does not sync across devices.

Archflow should not assume every user needs every module. Future backend module preferences will allow users to enable, disable, pin, and order modules such as tasks, notes, finance, cars, automation, AI chat, Telegram capture, and future modules.

## What Is Implemented

- Dashboard with overview, onboarding, recent activity, and Memory Preview.
- Inbox universal capture with deterministic parsing and preview metadata.
- Tasks with local persistence, filtering, status, priority, and contextual routing.
- Notes with local persistence and related context foundations.
- Search over normalized local entities, activity, and memory candidates.
- Timeline with deterministic activity grouping and contextual routing.
- Today with focus planning and deterministic Daily Briefing.
- Command Center with route commands, action commands, command history, and create task/note flows.
- Finance and Cars as early local operations modules.
- Settings with theme controls, local export, local reset, and onboarding reset.
- Core storage adapter, repository, entity, relation, activity, capture, search, memory, and sync metadata foundations.
- Documentation for product, architecture, security, backend planning, database schema, and sync strategy.

## Intentionally Not Implemented Yet

- Production backend.
- Authentication.
- Cloud sync.
- Multi-device conflict resolution.
- Real AI provider calls.
- Embeddings or vector search.
- Payments or subscriptions.
- External integrations.
- Telegram capture.
- iOS/native mobile app.
- Collaboration or shared workspaces.

## Key Product Loops

### Capture

Users drop raw thoughts into Inbox. Deterministic parsing suggests type, workspace, tags, and confidence. Future AI can replace the classifier behind the same capture pipeline.

### Tasks

Tasks represent commitments and action. They support status, priority, due dates, workspace context, and local persistence.

### Notes

Notes store ideas, references, learning, and long-form context. They connect to the entity, search, memory, and relation foundations.

### Search

Search is the universal retrieval layer. It currently uses deterministic normalized local results and is structured for future backend and semantic search.

### Timeline

Timeline is the event stream for user activity. It groups local activity by recency and prepares the product for audit history, recaps, sync review, and AI memory context.

### Memory And Context

Memory is currently deterministic and inspectable. Memory candidates are source-linked and ranked with local signals. There is no hidden or real AI memory yet.

### Command Center

Command Center is the keyboard-first control surface. It supports navigation, quick actions, recent commands, and typed future action categories.

## Future Direction

### Backend, Auth, And Sync

The recommended MVP backend path is Supabase/PostgreSQL with Row Level Security. Cloud sync should be added behind repository adapters while preserving local-only mode.

See:
- `docs/BACKEND_PLAN.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/SYNC_STRATEGY.md`

### AI Memory

Future AI memory should be server-side, source-linked, inspectable, deletable, and scoped by user consent. Embeddings must not become hidden copies of deleted user data.

### Telegram Capture

Telegram is a future quick capture channel. It requires backend/auth first because bot tokens, account linking, validation, and abuse controls must be server-side.

See `docs/TELEGRAM_INTEGRATION_PLAN.md`.

### iOS And Mobile App

Mobile direction starts with responsive web and fast capture. A PWA or native iOS companion should wait until backend identity, sync, and capture schemas are stable.
