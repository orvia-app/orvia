# Archflow Backend Plan

## Recommendation

Use Supabase for the MVP backend.

Why:
- PostgreSQL matches Archflow's entity, relation, timeline, and future memory model.
- Supabase Auth, Row Level Security, migrations, storage primitives, and Vercel-friendly environment setup reduce implementation surface area.
- RLS gives a strong first security boundary for per-user and workspace-owned records.
- The current repository/storage architecture can migrate behind adapters without rewriting UI flows.

Avoid a custom backend for the MVP unless Supabase constraints become a blocker. A custom backend increases auth, session, database, RLS-equivalent authorization, migrations, realtime, and operational burden before product-market fit.

## Backend Strategy

### Supabase MVP

Use Supabase for:
- authentication
- PostgreSQL persistence
- row-level security
- schema migrations
- server-side service jobs where needed
- future realtime/sync experiments after the data model is stable

Use Next.js server routes/actions for:
- server-only AI gateway
- Stripe webhooks and billing orchestration
- privileged backend operations that must not expose service-role credentials to the client
- validation and rate limiting where Supabase client access is insufficient

### Risks

- RLS policies must be designed and tested carefully; weak policies become broken object-level authorization.
- Supabase service-role keys must never be used in browser code.
- Offline/local-first sync is not automatic; conflict handling and operation queues still need product-specific design.
- Vendor coupling is acceptable for MVP speed, but repositories should preserve an exit path.
- Realtime/collaboration can increase complexity quickly and should wait until single-user sync is solid.

## Auth Model

### Initial Auth

- Email/password for MVP account creation and login.
- Email verification should be enabled before public launch.
- Password reset handled by Supabase Auth.
- Sessions should use secure, HTTP-only server-managed flows where possible; do not store access tokens in localStorage.

### Later Auth

- OAuth providers can be added after email/password is stable.
- Add passkeys only after auth/session architecture is mature.
- Support provider linking carefully to avoid account takeover edge cases.

### Anonymous / Local-Only Mode

Keep local-only mode as an intentional product mode:
- no account required
- data remains in browser storage
- export/reset stays local
- user can later choose to create an account and migrate local data

The migration flow should be explicit and reversible until upload is confirmed.

### Account Deletion

Account deletion must:
- require confirmation and recent authentication where practical
- soft-delete first where product/legal requirements need recovery windows
- permanently delete product data after the retention window
- delete or invalidate derived memory, embeddings, sync queues, integration data, and cached AI context
- preserve only billing/legal records required by law, with product content removed

## Session Security

- Treat client route checks as UX only, not a security boundary.
- Enforce authorization in RLS and server routes.
- Avoid storing sensitive tokens in browser storage.
- Restrict service-role usage to server-only code paths.
- Add audit logs for sensitive actions after backend persistence exists.

## Row Level Security Plan

Enable RLS on every user-owned table before any browser Supabase client reads or writes production data.

Initial policy model:
- users can read their own rows where `user_id = auth.uid()`
- users can insert rows only with `user_id = auth.uid()`
- users can update and soft-delete only their own rows
- workspace-scoped records must reference a workspace owned by the current user
- profile rows are readable/updatable only by the owning user

Future collaboration model:
- add `workspace_memberships`
- scope access by membership role
- keep owner/admin/member permissions explicit
- avoid sharing by guessing IDs or trusting client-provided workspace metadata

Admin access:
- no broad admin client in normal app flows
- service-role usage only in server-side jobs/routes with explicit purpose
- support/debug access must be scoped, time-limited, and audited

Security risks:
- missing RLS on one table can expose cross-user data
- weak workspace policies can leak collaboration data
- service-role keys in client bundles are a critical incident
- soft-deleted rows must remain hidden from normal reads unless intentionally restored

## AI Data And Privacy Strategy

No real AI calls exist today. Future AI must run through server-side routes only.

Allowed later with user consent and clear scoping:
- task titles/descriptions relevant to the current request
- note excerpts selected by retrieval rules
- captures selected for parsing or organization
- activity metadata needed for summaries
- memory candidates with source references
- workspace/tag context needed to disambiguate results

Keep local/private by default:
- secrets, tokens, credentials, and payment data
- full finance history unless the user explicitly asks for finance analysis
- sensitive notes excluded by user controls
- deleted entities and memories
- unrelated workspace data outside the current request scope

Retention and deletion:
- prompts/responses should not be retained by default beyond operational logs defined in policy
- embeddings must be linked to source entities and deleted or regenerated when sources are deleted
- AI-derived memory must be inspectable, source-linked, and deletable
- users should be able to exclude entities/workspaces from AI context

Product boundary:
- AI suggestions are assistive, not authoritative
- destructive AI actions require confirmation
- users should be able to see whether AI suggested an action or executed it

## Implementation Roadmap

### Phase A: Environment Setup

- Create Supabase project.
- Add local/preview/production env variables.
- Keep `.env.example` placeholders only.
- Add server-only secret handling rules to implementation PR.
- Confirm Vercel preview/prod variable separation.

Initial infrastructure preparation now exists without connecting live services:
- `.env.example` documents future public and server-only placeholders.
- `src/env/server.ts` and `src/env/client.ts` centralize typed env reads and validation.
- `src/server/supabase/*` and `src/lib/supabase/*` define config readiness and client factory seams without installing or invoking Supabase.
- `src/core/auth/*`, `src/core/backend/*`, and `src/core/sync/*` define backend/auth/sync types and deterministic local sync helpers.

Before moving beyond preparation, install the Supabase SDK intentionally, review RLS policies, and ensure no service-role key is reachable from client code.

### Phase B: Supabase Schema

- Create migrations for the tables in `docs/DATABASE_SCHEMA.md`.
- Enable RLS on all user-owned tables.
- Add basic per-user policies.
- Add module preference tables so users can enable, disable, pin, and order modules without deleting underlying module data.
- Add integration registry and per-user integration state tables without storing provider secrets.
- Add seed-free local dev migration workflow.
- Create typed schema generation plan.

### Phase C: Auth

- Add sign up, sign in, sign out, password reset.
- Add protected server/client boundaries.
- Preserve local-only mode.
- Add account deletion planning stub, not full destructive flow until retention policy is final.
- Decide whether account setup should create default `user_module_preferences` rows or derive defaults until the user customizes Settings -> Modules.

### Phase D: Cloud Repository Adapter

- Add Supabase-backed repository implementations behind existing contracts.
- Keep current localStorage repositories as local-only mode.
- Add account migration flow from local data to cloud.
- Avoid changing UI data shapes until adapter behavior is verified.

### Phase E: Sync Queue

- Add sync metadata persistence.
- Add operation queue design and minimal implementation.
- Implement conflict detection with versions and timestamps.
- Add soft-delete propagation.
- Add device ID handling.

### Phase F: AI Route

- Add server-side AI route only after auth and data ownership exist.
- Enforce consent, scoping, rate limits, and logging policy.
- Keep prompts source-linked and deletion-aware.
- Generate embeddings server-side only if retention/deletion behavior is defined.

## Open Questions Before Coding

- Should cloud sync be opt-in for local-only users or the default after account creation?
- What data classes are allowed into AI context by default?
- What is the first paid plan boundary: sync, AI memory, integrations, or storage?
- Should workspaces support collaboration in v1 backend, or remain single-user owned initially?
- What is the retention window for deleted records and backups?
- Should IndexedDB be introduced before Supabase sync for larger local datasets?
- What audit events are required before beta launch?
- Which modules should be enabled by default for new users?
- Should integration registry rows be managed by migrations, internal admin tooling, or both?
