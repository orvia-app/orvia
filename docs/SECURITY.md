# Orvia Security

Orvia is pre-private-beta. This document describes the current security model, its evidence and limits, and engineering requirements for future work. It does not establish production or beta security readiness. The [Product Specification](product/PRODUCT_SPEC.md) governs product decisions; this document governs security engineering within that scope. [Security verification](SECURITY_VERIFICATION.md) records the checks performed, not a product roadmap.

## A. Current verified security model

### Data and trust boundaries

Supabase Auth, PostgreSQL-backed APIs, and browser-local repositories coexist. Signed-in tasks, notes, Inbox captures, and activities use account APIs when those requests succeed; local and user-scoped fallback data remain possible. Signed-out data and Labs data are browser-local. The exact behavior of mixed surfaces and manual local import is in [Data Boundary](DATA_BOUNDARY.md). The current source and [AGENTS.md](../AGENTS.md) support this architecture; they do not prove a deployment is configured identically.

Data classes for review are public content, internal operational material, user-authored or activity data, sensitive authentication and integration data, and server-only secrets. Classification determines access, minimization, retention, export, and deletion requirements. Tasks, notes, captures, activities, feedback, and pseudonymous analytics identifiers are personal data even when they omit obvious names.

### Authentication and account isolation

Current cloud data APIs validate bearer credentials server-side through Supabase `getUser()` in `src/server/api/auth.ts`. They derive the user ID from the validated account rather than accepting client-provided `user_id`. The service-role client in `src/lib/supabase.ts` is server-side and can bypass RLS, so each API route must filter reads and scope writes by the authenticated owner. UI navigation and the client auth gate are not authorization boundaries.

Active migrations define owner-only RLS for tasks, notes, captures, activities, and the new `orvia_events` table. [Security Verification](SECURITY_VERIFICATION.md) records two-user runtime cross-user checks as passed for the first four tables and the Tasks, Notes, Captures, Search, Today, Command Palette, local-isolation, and local-reset flows. Events have static checks and a local disposable PGlite two-owner probe; their migration has not been applied or tested against live Supabase. The recorded direct authenticated Supabase checks exercise RLS; application API checks exercise route ownership. This evidence is scoped to those tests and their target at the time, not proof of every route, deployment, or future policy. Feedback has a separate authenticated submission and admin authorization boundary documented in [Feedback Admin](FEEDBACK_ADMIN.md); the four-table runtime result must not be extended to it or Events.

Authenticated fallback cache keys are scoped by Supabase user ID (`personal-os.user.<userId>.*`) for tasks, notes, and quick captures. The runtime verification records a shared-browser cache isolation bug and a successful retest after this change. Local cache isolation does not make device-only records cloud-synced.

Admin feedback and analytics routes validate the account and compare its email with the server-only `ADMIN_EMAILS` allowlist before privileged access. Hiding an admin link is only UI behavior. See [Feedback Admin](FEEDBACK_ADMIN.md) and [Analytics](ANALYTICS.md).

### Sessions, browser storage, and secrets

The browser Supabase client currently uses SDK session persistence. Browser storage is accessible to same-origin JavaScript, can be cleared, and is not a secure vault. Keep storage access in the centralized adapter and repositories; do not put provider credentials, payment secrets, or separate token copies into application storage. The current auth recovery path clears only this project's exact auth keys for known stale, missing, or corrupted sessions. It preserves unrelated and workspace data; network and unexpected errors must not be treated as ordinary sign-out. The pinned SDK patch is limited to expected recovery logging. See [auth-session recovery](testing/auth-session-recovery.md) for implementation and manual checks still needed.

`NEXT_PUBLIC_*` configuration is browser-visible. Service-role keys, provider keys, private credentials, and `ADMIN_EMAILS` belong only in server runtime configuration. Do not commit secrets, credentials, tokens, real user records, or populated private environment files. Environment access is centralized in `src/env/client.ts` and `src/env/server.ts`; see [Environment](ENVIRONMENT.md).

### Monitoring, analytics, and user content

Sentry integration is DSN-gated and configured for minimized error reporting, with replay, tracing, profiling, and source-map upload disabled. The allowed user identity is Supabase user ID; task/note/capture text, search queries, emails, tokens, headers, sessions, bodies, and raw errors must not enter monitoring. Repository configuration does not verify that live monitoring is enabled or that every deployment log path is clean. See [Environment](ENVIRONMENT.md).

First-party analytics uses bounded event contracts and separates bearer credentials from serialized event data. Event data must exclude task and note content, captures, feedback messages, search queries, email, URLs, tokens, arbitrary metadata, and raw errors. Pseudonymous identifiers still require privacy handling. Analytics ingestion, database grants, aggregation, limitations, and unverified deployment steps are detailed in [Analytics](ANALYTICS.md).

Activity records should use short system-generated action text and allowlisted categorical or boolean metadata, not a second copy of user content. Feedback text is user-entered content: submission is authenticated, and the server-side admin workflow is separately authorized. Do not copy feedback into analytics, activities, monitoring, or logs. See [Feedback Admin](FEEDBACK_ADMIN.md).

### Local export and reset

Settings export/reset operates on Orvia-owned browser data. The local reset targets the `personal-os.*` namespace, including authenticated cache keys, while preserving unrelated browser storage. Local export and reset do not export or delete cloud account records, backups, analytics, or provider data; they do not establish account deletion or legal compliance. [Data Boundary](DATA_BOUNDARY.md) describes the current behavior.

## B. Current limitations and known risks

- [Security Verification](SECURITY_VERIFICATION.md) retains **deployment/bundle confirmation that the service-role key remains server-only** as a pending beta security requirement. Source placement alone does not close that item.
- The four-table runtime checks are historical evidence. Current production configuration, migration history, grants, policies, and isolation require target-specific verification before claims about a live environment. File presence is not proof that a migration ran.
- Browser session persistence and local fallback expose data to same-origin script compromise and device loss. User-scoped caches reduce cross-account mixing on one browser but do not provide full offline sync, conflict resolution, or cross-device guarantees. Offline logout and denied browser storage can limit local cleanup or remote revocation.
- Local export/reset does not satisfy the Product Specification's **Export my data** and **Delete account and data** beta requirements. Cloud lifecycle, retention, backup deletion, and account deletion remain to be specified and verified.
- Authenticated API and RLS evidence does not cover every future entity or workspace membership rule. Client route visibility is not server-side session validation; `middleware.ts` currently passes through.
- Sentry, analytics, auth, and admin documentation describe code and bounded checks, not a complete production privacy review. Hosting/proxy logs, deployed variables, incident process, and live behavior need operational validation.
- Real AI, billing, and external integrations are outside the current verified security model. AI Chat is mock functionality; browser-local Labs data must not be presented as secure account storage.

## C. Security requirements and future direction

### Authorization and data lifecycle

Every new user-owned table and route needs server-validated identity, explicit owner or workspace authorization, appropriate RLS and grants, input validation, and cross-user tests. Service-role access must stay server-side, narrowly scoped, and filtered by the validated owner. Privileged admin/support access needs explicit authorization, scope, review, and auditability. Future workspace sharing needs real membership rules rather than client-provided IDs.

Before beta, design and verify account-level export and deletion across cloud records and relevant derived data. Define archive, soft-delete, restore, permanent-delete, backup, and retention semantics. Do not describe local reset as account deletion. Keep billing/legal retention separate from product data deletion, and avoid claiming GDPR or other legal compliance from code alone.

The Product Specification also requires privacy transparency, controls to disable behavioral learning and reset learned preferences, and a real processing boundary for sensitive workspaces excluded from AI recommendations. Beta authentication includes Google and email/password with safe identity linking, confirmation, password recovery, and session handling; the exact Google account-linking implementation remains an open decision. Treat these as product requirements until implementation and validation establish each behavior.

### AI and external content

Any real AI/provider call must run through a server-side boundary with authorization, scoped context, validation, rate limits where relevant, minimized logging, and documented retention/deletion for prompts, responses, embeddings, and derived memory. Keep generated information distinguishable from user-authored sources. Require confirmation for destructive or external actions and respect the Product Specification's user controls, including sensitive workspace processing boundaries when implemented.

Treat captured URLs, fetched pages, attachments, and integration responses as untrusted input. Defend against unsafe redirects, phishing, malicious instructions, prompt injection, and automatic external actions. Do not execute instructions found in external content.

### Integrations, payments, and secrets

Future OAuth/Telegram/provider credentials and refresh tokens belong in server-side secret storage and narrowly authorized server jobs, not browser storage or ordinary metadata. Validate provider callbacks and webhook signatures before trusting them. Payment processing must use a suitable provider; do not store card data or trust client-reported billing state. Public publishable keys are distinct from private keys. Introduce these capabilities only after an explicit product decision and security review.

### Operations and hygiene

Keep logs useful for diagnosis without recording tokens, auth headers, feedback text, full AI prompts, payment data, or unnecessary personal content. Define access and retention for operational logs and include them in incident handling where applicable. Review dependencies and supply-chain changes, justify new SDKs, monitor advisories, and avoid unreviewed remote scripts.

Assess encryption in transit, at rest, and for stored provider credentials against the actual data and deployment design. Do not infer effective encryption or key management from a proposed architecture.

Before production use, define incident severity, triage ownership, credential rotation, rollback, user notification criteria, evidence preservation, and post-incident review. Verify deployed bundle secrecy, environment access, database state, and relevant authenticated flows against the intended target. Security and privacy are part of the Product Specification's definition of done for every relevant feature; automated or historical checks alone do not establish release readiness.
