# Archflow Architecture Decisions

This document captures current architectural decisions in ADR-style form. It is intentionally concise and should evolve when major direction changes.

## ADR 001: Local-First First

Status: Accepted.

Decision: Build the MVP local-first before adding backend/auth/sync.

Why:
- Fast product iteration.
- Privacy-first default.
- No premature account or infrastructure complexity.
- Clear foundation for export/reset and user-owned data.

Tradeoffs:
- No multi-device sync.
- Browser storage is not secure cloud storage.
- Data can be lost if the browser clears storage.

## ADR 002: Storage Adapter And Repository Pattern

Status: Accepted.

Decision: UI must not access browser storage directly. Domain data flows through repositories and storage adapters.

Why:
- Centralizes validation, parsing, keys, and persistence.
- Prevents duplicated storage logic.
- Creates a migration path to IndexedDB, Supabase, or sync adapters.
- Keeps pages focused on UI orchestration.

Tradeoffs:
- Slightly more structure for simple MVP data.
- Requires discipline when adding new modules.

## ADR 003: Supabase Recommended For MVP Backend

Status: Proposed baseline.

Decision: Use Supabase/PostgreSQL for the first backend unless a concrete blocker appears.

Why:
- PostgreSQL fits entities, relations, activity, memory, and sync metadata.
- Supabase Auth and RLS reduce backend surface area.
- Vercel deployment and env workflows are straightforward.
- Repository adapters preserve an exit path.

Tradeoffs:
- Vendor coupling.
- RLS must be tested carefully.
- Offline sync and conflict handling still require custom product logic.

## ADR 004: No Frontend API Keys

Status: Accepted.

Decision: Secrets and privileged provider keys must never be placed in frontend code.

Why:
- Browser bundles are public.
- Exposed keys create abuse and data-leak risk.
- AI, payments, Telegram, and integrations require server-side validation, rate limits, logging policy, and consent boundaries.

## ADR 005: Deterministic/Mock AI Until Server-Side Route Exists

Status: Accepted.

Decision: Current AI-like behavior remains deterministic or mock-only until backend/auth/server-side AI routes exist.

Why:
- Avoids hidden data transfer.
- Keeps product claims honest.
- Preserves privacy-first direction.
- Lets entity, memory, search, and capture foundations mature before provider integration.

## ADR 006: Mobile Shell Foundation

Status: Accepted.

Decision: Add a responsive shell with desktop sidebar and mobile header/drawer.

Why:
- Mobile users need reliable navigation.
- Archflow's capture loop must work on phone widths.
- The shell keeps navigation and theme controls consistent across routes.

Tradeoffs:
- Shell complexity increased and must stay thin.
- Hydration and theme rendering require deterministic initial render.

## ADR 007: Entity/Core Layer

Status: Accepted.

Decision: Add `src/core/*` foundations for normalized entities, relations, storage, repositories, search, capture, activity, and memory.

Why:
- Current domain models should not be force-migrated all at once.
- Core adapters prepare backend sync without breaking UI types.
- Search, timeline, memory, and future AI need shared normalized concepts.

Tradeoffs:
- Some compatibility bridges remain.
- Future work must avoid creating parallel systems.

## ADR 008: Telegram Waits For Backend/Auth

Status: Accepted.

Decision: Do not add Telegram capture until backend/auth/account linking exists.

Why:
- Bot tokens must be server-only.
- Incoming messages need authenticated account mapping.
- Abuse controls, rate limits, logging, and deletion behavior require backend infrastructure.
- Client-only Telegram integration would be insecure and hard to scale.

## ADR 009: Modules Are Optional Per User

Status: Accepted.

Decision: Archflow may have database tables for all supported modules, but module visibility and ordering must be configurable per user.

Why:
- Not every user needs finance, cars, automation, AI chat, Telegram capture, or future modules.
- Module data should not need to be deleted just because a user hides a module.
- Settings -> Modules can later control enabled, pinned, and ordered modules.
- This keeps Archflow extensible without turning the default product into an overloaded dashboard.

Tradeoffs:
- Backend account setup must decide how default module preferences are created or derived.
- UI surfaces must eventually respect module preferences once backend/auth exists.
