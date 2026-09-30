# Orvia — Agent Instructions

## Product and evidence scope

Orvia is a commercial productivity product being prepared for a controlled private beta. Privacy, reliability, mobile usability and secure account isolation are current constraints. “Personal AI Operating System” is a product vision, not evidence of implemented autonomous AI.

Repository evidence reviewed on 2026-09-28: Git origin is `git@github.com:orvia-app/orvia.git`. The local directory and package name still use `personal-os`; do not rename persisted keys or package identifiers incidentally. This document describes the working tree, including uncommitted work, not a verified production release.

Core navigation currently covers Dashboard, Today, Inbox, Tasks, Notes, Search, Timeline and Settings. Admin analytics and feedback have separate authorization. Cars, Finance and Automation are grouped under Labs; AI Chat is mock functionality. Do not promote experimental modules, payments, real AI or integrations into beta priorities without an explicit product decision.

## Professional Operating Rules

### Truth and evidence

- Never invent, fabricate, embellish, bluff, or present assumptions as facts. Never silently fill missing information with plausible guesses.
- Never claim something was found, verified, tested, fixed, implemented, deployed, reviewed, completed or production-ready without direct evidence.
- Distinguish VERIFIED FACT / ASSUMPTION / UNKNOWN / RISK / RECOMMENDATION where useful. If evidence is unavailable, report UNKNOWN.
- Never report PASS from incomplete validation. Automated tests alone do not establish UX, visual or accessibility quality, end-to-end correctness, security, production readiness or beta readiness.
- Documentation may be stale. Verify important claims against current code, configuration and relevant evidence. Identify conflicts, correct only supported claims, and report unresolved ambiguity.

### Professional decision standard

Use the combined judgment expected from a Product Manager, Product Owner, Software Architect, Senior/Staff Engineer, QA Lead, Security Reviewer, UX/Product Reviewer and Release Manager. Apply a 20+ year professional quality bar to reasoning and decisions, without claiming personal experience.

Do not blindly implement weak requirements. Identify and challenge unnecessary features, scope creep, architectural mistakes, security/privacy risks, UX problems, weak acceptance criteria, premature abstractions, unnecessary dependencies and material technical debt. Prefer the simplest secure, maintainable solution that scales enough for the actual product stage and fits Orvia.

### Completion discipline

Do not say “done”, “ready”, “fixed”, “safe” or “PASS” without relevant evidence. For meaningful changes report these levels separately:

- Implementation complete.
- Automated validation complete.
- Manual functional validation complete.
- Visual validation complete.
- Security validation complete.
- Production validation complete.

Claim only levels actually verified. Name skipped checks, limitations and remaining risks. Historical test results and user-reported deployments are not fresh validation.

## Current stack and architecture

- Next.js App Router (package version 16.3.6), React 19.2.4, strict TypeScript and Tailwind CSS 4. Verify package versions before framework-dependent changes.
- Supabase JS is pinned to 2.106.2; Auth, PostgreSQL-backed APIs and RLS migrations already exist. Storage is not localStorage-only.
- Sentry integration exists with privacy filtering and environment-dependent enablement; configuration in the repo does not prove live monitoring is enabled.
- Public/auth routes and API handlers live in `src/app`. Canonical application routes are under `src/app/app`; several re-export legacy page implementations. `next.config.ts` redirects legacy product URLs to `/app` routes.
- `src/components/AppShell.tsx` handles navigation and the client auth gate. `middleware.ts` currently passes through; it does not validate server sessions. UI route visibility is never authorization.
- Pages orchestrate UI/state. Put domain behavior in typed helpers/repositories under `src/lib` and `src/core`, and privileged operations behind server API boundaries.
- Shared UI lives in `src/components/ui`. `src/components/ThemeProvider.tsx` manages theme; `src/lib/i18n.ts` and `src/components/i18n` provide English/Ukrainian localization. Keep both locales and themes usable.

## Storage and data boundaries

- Browser storage is centralized in `src/core/storage`, with `src/lib/storage.ts` as a compatibility bridge. Key definitions live in `src/core/storage/keys.ts`.
- Existing repositories include `src/lib/tasks.ts`, `src/lib/notes.ts`, `src/lib/finance.ts` and `src/lib/cars.ts`. Do not create competing repositories.
- Account-backed tasks, notes and captures coexist with local repositories, user-scoped cache/fallback data and API adapters. Activities provide the account timeline; feedback has its own server boundary.
- Legacy keys retain the `personal-os.*` prefix. Account keys use `personal-os.user.<userId>...`; theme, language, onboarding, command history and beta analytics also have browser keys. Use the key module rather than an incomplete copied list.
- `src/lib/local-cloud-sync.ts` implements explicit local import behavior, not a complete background/offline synchronization engine. Do not claim automatic conflict resolution or full multi-device/offline guarantees.
- Settings export/reset uses `src/lib/data-export`. Local export/reset is not cloud account deletion or proof of GDPR compliance. Do not silently upload local fallback data, clear unrelated storage, or rename keys without a migration plan.
- Finance/Cars are local experimental functionality; Automation is a placeholder. Future AI, billing and external integrations require separately approved scope.

## Authentication, authorization and RLS

- Reuse `src/components/auth/AuthProvider.tsx` and `src/lib/supabase/auth.ts`. The centralized loader coalesces session requests; the provider cleans up its auth subscription.
- Supabase currently persists browser sessions through its SDK (`persistSession: true`). This is not cookie-based server authentication and browser storage is not a secure vault. Do not add separate token copies, analytics fields, logs or another auth system.
- Known stale/missing/corrupted sessions use `src/lib/supabase/auth-errors.ts` and `src/lib/supabase/auth-storage.ts`. Clear only this project's exact auth keys; preserve application and unrelated data. Unexpected/network/programming errors must not be classified as ordinary signed-out recovery.
- `scripts/patch-supabase-auth.mjs` runs at postinstall to narrowly handle expected SDK recovery logging. SDK upgrades require reviewing the patch and regression tests; never replace it with global console suppression.
- `src/server/api/auth.ts` validates bearer credentials using Supabase `getUser`. Runtime data routes then use the service-role client in `src/lib/supabase.ts` and explicit owner filters/server-derived user IDs. Service-role requests bypass RLS: ownership checks in every route are critical, not optional defense in depth.
- RLS and client-role grants are defined in active migrations for tasks, notes, captures, activities and feedback. Review both RLS and API ownership checks; neither client navigation nor a static source scan proves live isolation.
- `src/server/admin.ts` validates the user and compares email against server-only `ADMIN_EMAILS`. Admin feedback and analytics routes must authorize before privileged reads/writes. Hidden navigation is not an admin permission check.

## Analytics, privacy and secrets

- `src/lib/analytics-contract.ts` defines bounded event/report contracts; `src/lib/analytics-transport.ts` separates bearer credentials from serialized event data. Access tokens belong only in the Authorization credential boundary, never event fields, metadata, error payloads or logs.
- `src/app/api/analytics/route.ts` validates browser ingestion; task activation and feedback counts also use database triggers. Admin reports in `src/app/api/admin/analytics/route.ts` support 7/30-day aggregate reports after admin authorization.
- The analytics migration defines restricted table/function grants. Do not add task/note/feedback content, search queries, email, arbitrary metadata, URLs, raw errors or tokens to analytics. Pseudonymous identifiers remain privacy-relevant data.
- Keep service-role/provider keys and private credentials server-side. Public Supabase configuration is intentionally browser-visible; never treat `NEXT_PUBLIC_*` as secret. Centralize environment access through `src/env/client.ts` and `src/env/server.ts`.
- Never print/commit secrets or real user records. Do not modify environment secrets, add remote scripts or send user content to new external services without authorization.
- Activity metadata and monitoring must remain minimized; feedback text must not leak into analytics or monitoring. Existing policies are requirements, not proof every logging call complies. Review touched paths for raw error/content logging.
- Real AI/provider calls must be server-side, privacy-aware and explicitly scoped. Do not advertise mock/deterministic features as real AI.

## Migrations and production safety

- Active SQL is under `supabase/migrations`. The incompatible initial draft is under `supabase/migration-archive`; never replay it or treat it as an active runtime schema.
- The reconstructed legacy tasks prerequisite starts the active stream. Analytics and runtime privilege-hardening migrations are present. File presence or schema equivalence does not prove historical execution or current production state.
- `docs/MIGRATION_RECONCILIATION.md` records earlier preparation; some pending/not-applied wording is historical. Do not use it to infer current deployment state. Verify the target and current evidence before any separately authorized database operation.
- Do not deploy, change production data/auth/RLS, repair migration history, commit, push or open/merge PRs without task authorization. Preserve existing work; do not reset, clean, stash or overwrite unrelated changes.

## Engineering and UI standards

Follow `docs/ENGINEERING_RULES.md` for code changes. Its future-backend wording is stale: current ownership/API requirements above already apply. Existing authorized API use is not a request to introduce a new external integration.

Use strict types, explicit domain contracts, unions and validators; prefer `unknown` before validation and avoid broad `any` or unsafe casts. Use stable IDs such as `crypto.randomUUID()` where appropriate. Validate parsed storage/JSON and handle missing/corrupted data.

Keep functions focused and UI reusable. Avoid giant pages, duplicated storage/validation, unnecessary dependencies and premature abstractions. No direct domain localStorage access in pages/components. Guard browser APIs and keep initial rendering deterministic and SSR-safe.

TypeScript modules must have `.ts` or `.tsx` filenames. After moves/renames use `rg --files` to check for stale duplicates. Do not rename unrelated modules or delete unexplained files incidentally.

Preserve responsive layouts, readable contrast, explicit button types, accessible labels, keyboard/focus behavior, dialog cleanup, loading/error/empty states and destructive-action confirmation. Keep English/Ukrainian copy consistent. Functional tests do not replace visual/accessibility review.

`docs/ORVIA_DESIGN_SYSTEM.md` documents the implemented local redesign: semantic theme tokens, shared native field wrappers, restrained surfaces and motion. See `docs/testing/redesign-review.md` for rendered coverage and limitations. Local implementation and synthetic visual review do not establish production or beta readiness.

## Workflow and validation

Before edits: read these instructions and relevant docs/source, inspect branch/index/worktree, explain focused changes and preserve prior work. Use repository evidence when older plans conflict with implementation.

Available package scripts:

- `npm run typecheck`: TypeScript check.
- `npm run build`: Next production build; `npm run build -- --webpack` selects Webpack when explicitly appropriate.
- `npm run check`: typecheck followed by build.
- `npm run test`: Node test runner for `tests/*.test.mjs` via `test:run`.
- `npm run security:guard`: repository security checks.
- `npm run verify:rls`: static migration/API ownership assertions, not live RLS validation.
- `npm run verify:ownership:runtime`: environment-backed ownership probes that create/change test records; not read-only. Inspect target, fixtures and authorization before running.
- `npm run lint`: ESLint.
- `npm run dev` / `npm run start`: development / production server.
- `npm run postinstall`: version-sensitive Supabase SDK patch.

Standalone disposable database verifiers are `scripts/verify-beta-analytics-db.mjs`, `scripts/verify-migration-reconciliation.mjs` and `scripts/verify-runtime-privilege-hardening.mjs`. They require an external PGlite module; reconciliation/hardening also use external catalog fixtures. Read their arguments first. They are not included in `npm run test` and do not establish live Supabase equivalence.

For code changes run relevant tests, `npm run typecheck`, `npm run build`, `npm run security:guard` and `git diff --check`; report failures honestly and fix task-related regressions. Documentation-only work defaults to the engineering rules' build requirement unless explicitly waived. The earlier repository truth audit had a task-specific validation waiver; it does not apply to subsequent code changes.

Do not claim checks ran merely because a script exists. Distinguish source review, disposable database tests, authenticated E2E, visual review and production verification. Do not silently turn a failed build into a pass by switching tools or removing checks.


## Product source of truth and documentation hierarchy

`docs/product/PRODUCT_SPEC.md` is the canonical Product Specification and the primary source of truth for Orvia's product direction, scope, behavior, UX principles, beta requirements and product decisions.

`docs/product/PRODUCT_SPEC_UA.md` is the Ukrainian companion version. If the two versions conflict, treat `docs/product/PRODUCT_SPEC.md` as canonical and surface the discrepancy instead of silently choosing or merging interpretations.

Before proposing or implementing any product, feature, UX, navigation, onboarding, prioritization, notification, AI behavior, calendar, capture, Inbox, Tasks, Notes, Projects, Workspaces, Search, privacy-control or beta-scope change, read the relevant sections of `docs/product/PRODUCT_SPEC.md`.

Documentation hierarchy for product decisions:

1. `docs/product/PRODUCT_SPEC.md`
2. Approved UX/design specifications
3. Feature requirements and acceptance criteria
4. Technical architecture and ADRs
5. Implementation documentation
6. Historical/archive documentation

Older roadmaps, audits, overview documents, implementation notes and existing code must not override the Product Specification. Existing code is evidence of what is currently implemented, not evidence of what the product should become.

If current implementation or older documentation conflicts with the Product Specification:

- do not silently preserve the old behavior;
- do not silently rewrite the Product Specification to match the code;
- identify the conflict explicitly;
- treat the Product Specification as the intended product behavior unless a newer explicit product decision changes it;
- keep implementation facts and target product behavior clearly separated.

Product changes follow this sequence:

**Decision → Product Specification update → affected UX/feature specification or acceptance criteria → implementation.**

Do not invent answers for decisions explicitly marked open in the Product Specification. Keep them open until an explicit product decision is made.

The current repository contains historical documents that may describe earlier Orvia architecture, navigation, priorities or beta scope. In particular, `docs/PRODUCT.md`, `docs/PROJECT_OVERVIEW.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/SUPABASE_MIGRATIONS.md` and other older planning documents may contain stale product assumptions. Use them as implementation/history evidence where relevant, not as authority over the Product Specification.

Technical and operational documentation such as `docs/DATA_BOUNDARY.md`, `docs/ANALYTICS.md`, `docs/FEEDBACK_ADMIN.md`, `docs/ENVIRONMENT.md` and `docs/testing/auth-session-recovery.md` remains relevant for its technical domain unless it conflicts with a newer approved requirement.

See `docs/REPOSITORY_TRUTH_AUDIT.md` for historical repository evidence and previously identified implementation risks. It is not the product roadmap or product source of truth.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
