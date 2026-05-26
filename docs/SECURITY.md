# Personal OS Security

## Current Security Posture

Personal OS is currently a local-first MVP. Data is stored in browser storage through typed repository helpers. There is no backend, authentication, cloud sync, production AI API integration, payment system, or external integration layer yet.

This document defines security direction and engineering constraints. It is not a claim of production security readiness.

## Local-First Principles

- Keep MVP data local unless the user explicitly enables future sync.
- Validate parsed browser storage before use.
- Keep storage schemas understandable and migration-friendly.
- Avoid unnecessary third-party services.
- Avoid hidden analytics or unapproved external data transfer.
- Keep future export/delete requirements in mind for every user data type.

## No Frontend Secrets

Frontend code must never contain:
- OpenAI or AI provider keys
- backend service-role keys
- Stripe secret keys
- integration tokens
- database credentials
- private webhooks

Public configuration must be clearly safe for browser exposure. Secrets belong in server-side runtime configuration only.

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
- store only required customer, subscription, price, and billing status references
- webhook handlers must verify signatures server-side
- billing state must not be trusted from client input alone

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
