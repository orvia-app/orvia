# Archflow Security

## Current Security Posture

Archflow is currently a local-first MVP. Data is stored in browser storage through typed repository helpers. There is no backend, authentication, cloud sync, production AI API integration, payment system, or external integration layer yet.

This document defines security direction and engineering constraints. It is not a claim of production security readiness.

## Local-First Principles

- Keep MVP data local unless the user explicitly enables future sync.
- Validate parsed browser storage before use.
- Keep storage schemas understandable and migration-friendly.
- Avoid unnecessary third-party services.
- Avoid hidden analytics or unapproved external data transfer.
- Keep future export/delete requirements in mind for every user data type.

## Threat Model Basics

Current MVP risks:
- accidental secret commits
- unsafe browser storage assumptions
- dependency or build-chain compromise
- XSS exposing local browser data
- future AI prompts sending too much personal context
- future payment or auth code trusting client state

Future backend risks:
- broken object-level authorization
- weak session handling
- service-role key exposure
- missing Supabase RLS policies
- unsafe webhook handling
- overbroad logs containing personal data
- AI memory retaining data after source deletion

Security reviews should focus on data ownership, authorization boundaries, secrets handling, logs, and deletion/export behavior before launch.

## GitHub And Vercel Production Safety

Current repository hygiene:
- keep the main branch deployable
- run `npm run build` and `git diff --check` before pushing meaningful changes
- do not leave merge conflict markers, broken builds, or placeholder secrets in committed files

Future team workflow:
- require pull requests before merging to main
- protect the main branch
- require build, typecheck, lint/security checks where applicable, and review before merge
- use Vercel preview deployments for PR validation
- keep production deployments tied to reviewed main-branch changes
- restrict production environment variable access to trusted maintainers only

## Data Classification

Current and future data should be classified before sync or AI processing:
- Public: marketing copy, public app metadata, non-sensitive docs.
- Internal: source code, roadmap, architecture notes, operational metadata.
- User personal: tasks, notes, inbox captures, cars, finance entries, memory candidates, timeline activity.
- Sensitive: authentication/session data, integration tokens, billing references, high-risk notes, AI prompts/responses containing personal context.
- Secrets: API keys, service-role keys, webhook secrets, private credentials.

Secrets must never enter the frontend. Sensitive and user personal data need explicit export/delete handling and minimal retention.

## Local Export And Reset

The MVP includes local-only data export and reset controls in Settings. Export produces a JSON snapshot from existing local repositories. Reset clears only known Archflow browser storage keys and does not clear unrelated browser storage.

This is not cloud account deletion. Future backend sync will need authenticated export/delete workflows that remove server-side data, synced replicas, AI-derived memory, integration data where applicable, and billing/account references according to retention policy.

## Data Retention And Deletion Strategy

Current local-only behavior:
- user data lives in browser storage through repository helpers
- export is a local JSON download only
- reset clears known Archflow browser storage keys only
- reset does not clear unrelated browser storage, remote accounts, backups, or synced replicas because those do not exist yet

Future cloud behavior:
- every user-owned record should be included in authenticated export/delete account flows
- backups, sync queues, derived memories, embeddings, and integration data must respect deletion requests according to documented retention windows
- deletion requests should be auditable in the backend phase without exposing unnecessary personal content
- soft-delete, restore, and permanent-delete semantics must be explicit before production sync
- billing and legal retention requirements must be separated from product data deletion

## No Frontend Secrets

Frontend code must never contain:
- OpenAI or AI provider keys
- backend service-role keys
- Stripe secret keys
- integration tokens
- database credentials
- private webhooks

Public configuration must be clearly safe for browser exposure. Secrets belong in server-side runtime configuration only.

See `docs/ENVIRONMENT.md` for environment variable strategy. `NEXT_PUBLIC_*` variables are bundled into browser JavaScript and must be treated as public.

## No Direct AI Provider Calls From Client

Future AI features must not call AI providers directly from client components. AI calls should go through server-side gateways that can enforce:
- authentication
- authorization
- rate limits
- input validation
- data minimization
- logging policy
- source reference tracking
- deletion/regeneration behavior for AI-derived memory

## Browser Storage Risks

Current browser storage is suitable for MVP local-first behavior, but it is not a secure vault.

Risks:
- accessible to JavaScript running on the origin
- device/browser dependent
- can be cleared by the user or browser
- no built-in multi-device sync
- not appropriate for secrets or sensitive tokens

Do not store integration tokens, API keys, payment secrets, or high-risk credentials in `localStorage`.

## Future Server-Side AI Architecture

Server-side AI should:
- use typed request/response contracts
- send only necessary user context
- include source references where possible
- distinguish generated memory from user-authored data
- support deletion of AI-derived memory linked to source entities
- require confirmation for destructive or external actions
- avoid retaining prompts/responses beyond the defined logging policy

## AI Data Handling Policy

Before real AI calls exist:
- define which entity fields may be sent to providers
- minimize context to the specific user-approved task
- keep source references for generated memory and answers
- avoid sending secrets, credentials, payment data, or unnecessary finance details
- provide deletion/regeneration behavior for AI-derived memory
- document retention assumptions for prompts, responses, embeddings, and logs

No AI provider call should be made directly from client components.

## AI Safety And Product Boundaries

AI features must be assistive, transparent, and user-controlled.

Current behavior:
- AI Chat is mock-only until a server-side AI route exists
- Memory Preview is deterministic and local; it is not real AI memory

Future behavior:
- AI suggestions are not authoritative decisions
- medical, legal, financial, or similarly high-impact recommendations must not be treated as final decisions without user confirmation
- destructive AI actions must require explicit confirmation
- users should be able to distinguish AI suggestions from AI-executed actions
- AI-generated content should keep source references where possible
- privacy-sensitive AI features must explain what context is used and avoid hidden data transfer

## Logging Policy

Future logs should be useful for debugging and abuse prevention without becoming a shadow data store.

Rules:
- do not log secrets, auth tokens, webhook signatures, card data, or full AI prompts by default
- redact personal content when practical
- keep request IDs and operational metadata separate from user content
- define retention periods before production
- restrict access to production logs
- treat logs as in-scope for incident response and data deletion policy where applicable

## Future Auth And Session Architecture

Future auth should support:
- per-user data ownership
- workspace-level access where applicable
- secure session handling
- server-side authorization checks
- scoped access for integrations
- safe account deletion/export
- separation between user data and operational metadata

Client-side route visibility is not a security boundary. Backend authorization must enforce access.

## Future Access Control Plan

When backend storage exists:
- every user-owned record should include `user_id` or an equivalent ownership reference
- workspace-scoped records should include workspace ownership and membership context
- workspace-level permissions should be enforced server-side
- Supabase RLS or equivalent authorization policies should protect every user-owned table
- sensitive actions should produce an audit trail with actor, target, timestamp, and outcome
- admin/debug tooling must not bypass user isolation casually
- privileged support access should be explicit, logged, scoped, and time-limited

## Future Supabase/RLS Direction

If Supabase/PostgreSQL is used, row-level security or equivalent authorization must be part of the initial backend design.

Expected principles:
- every user-owned row has owner/workspace scope
- policies enforce read/write permissions server-side
- service-role credentials are never exposed to the browser
- privileged jobs are isolated from normal user request paths
- migrations preserve data ownership and deletion behavior

## Future Stripe Rules

Payment processing should use Stripe or an equivalent PCI-compliant provider through server-side integration.

Rules:
- the app must not store card data
- the frontend must not receive Stripe secret keys
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` may be public, but secret and webhook keys must remain server-only
- store only required customer, subscription, price, and billing status references
- webhook handlers must verify signatures server-side
- billing state must not be trusted from client input alone
- payment logs must avoid card data and unnecessary personal data

## GDPR And Privacy Readiness

The product may target US/EU users, so architecture should support:
- user data export
- user data deletion
- clear data categories
- retention controls
- consent-aware integrations
- deletion of AI-derived memory linked to source entities
- minimal collection by default

AI memory must remain inspectable, source-linked, and deletable.

## Future Encryption Direction

Encryption should be considered for synced user data, sensitive notes, AI memory, and integration credentials.

Potential future layers:
- TLS in transit
- database encryption at rest
- encrypted secrets management
- per-user encryption keys for sensitive payloads
- optional local encryption for high-sensitivity data

Encryption design should be chosen after backend/auth/sync architecture is defined.

## Dependency Audit

Before production use:
- audit dependencies and transitive risk
- remove unused packages
- keep dependency additions justified
- monitor security advisories
- pin or manage versions consistently
- avoid remote scripts and unreviewed client-side SDKs

## Incident Response Basics

Before launch, define:
- severity levels
- internal owner for triage
- user notification criteria
- credential rotation procedure
- rollback procedure
- evidence/log preservation guidance
- post-incident review process

## Future Backend Security Principles

When a backend is introduced:
- validate all inputs server-side
- enforce per-user and workspace authorization
- keep audit logs for sensitive operations
- isolate privileged jobs from client permissions
- avoid broad service-role usage in request paths
- rotate credentials safely
- monitor abuse and failed auth events
- treat AI tool execution as a privileged action
