# Repository truth audit — 2026-09-28

Scope: repository audit and instruction correction only. No application changes, redesign continuation, production access, deployment, Git history operations or full application validation.

## Repository state before edits

VERIFIED FACT: branch `feat/beta-analytics-admin`, HEAD `3fe9141` (fix: harden beta dependencies privacy and inbox (#103)). No staged changes. 41 tracked changed paths (40 modified, one deleted), 31 untracked files. Tracked diff: 1,241 additions and 1,679 deletions. Local main and cached origin/main each compare 0 behind / 0 ahead. No fetch: current remote state UNKNOWN. Origin is git@github.com:orvia-app/orvia.git.

## Attribution

Categories below identify subject matter, not invented per-line authorship. The working tree combines several prior tasks and has no commit boundary between them.

| Category | Existing evidence |
| --- | --- |
| Analytics/admin | Analytics routes, report page, contract/transport, helpers, storage keys and analytics tests; docs/ANALYTICS.md and admin review |
| Migration/reconciliation/security | Archived initial SQL, reconstructed prerequisite, analytics/hardening SQL, three disposable verifiers and reconciliation documentation |
| Earlier UX/i18n/auth polish | Route copy, AppShell, shared UI, locale support, auth/signup handling, dialogs, timeline/search/memory presentation and corresponding tests |
| Interrupted redesign | Only docs/ORVIA_DESIGN_SYSTEM.md added since the saved pre-redesign snapshot |
| Documentation | Existing analytics/reconciliation/readiness documents; AGENTS had only the generated Next.js instruction block added before this audit |
| Unknown provenance | Untracked src/lib/inbox-presentation 2.ts; byte-identical to src/lib/inbox-presentation.ts, but creation history not established |

Direct byte comparison against /tmp/orvia-redesign-baseline found zero differences in src and tests, and only ORVIA_DESIGN_SYSTEM.md in docs. This is stronger evidence than attributing every unstaged UI change to the redesign. Temporary evidence is not durable Git history.

The redesign stopped at research/proposal. Its token/form/motion descriptions are written in present tense but are not implemented: globals.css has only basic background/foreground theme variables and scrollbar rules. No redesigned source implementation exists to judge as working or broken. Preserve the proposal for a separately scoped design batch; its implementation and visual acceptance remain UNKNOWN. This audit deliberately leaves the proposal unchanged and flags its status in AGENTS.

## Original AGENTS section audit

CURRENT describes still-valid instructions, not proof of universal implementation compliance.

| Material section | Classification | Evidence / correction |
| --- | --- | --- |
| Product Vision | PARTIALLY STALE | Aspirations valid; auth/backend already exist; Labs are not core priorities |
| Tech Stack | PARTIALLY STALE | Next/TS/Tailwind remain; origin and localStorage-only statements wrong; live hosting not rechecked |
| Current Architecture | PARTIALLY STALE | Several paths valid; APIs, core storage, scoped keys and server boundaries omitted |
| Engineering Standards | CURRENT | Retain typing, maintainability, SSR/privacy and focused changes as rules |
| Architecture Rules | PARTIALLY STALE | Layering valid; Finance/Cars repositories already exist; core storage is canonical |
| Future SaaS Readiness | STALE | Auth, APIs, Supabase and owner isolation implemented; full sync/payments remain future |
| Security Rules | PARTIALLY STALE | Secret rules valid; blanket no-localStorage-token claim contradicts SDK persistence; document actual boundary |
| Privacy/GDPR Direction | PARTIALLY STALE | Local export/reset exists; cloud deletion/compliance not established |
| UI/UX Standards | CURRENT | Valid quality targets, not proof of visual/accessibility acceptance |
| TypeScript Standards | CURRENT | Strict configuration and typed contracts exist; retain guidance |
| Data Model Direction | CURRENT | Stable IDs/enums remain guidance, not a complete database model |
| AI Architecture Direction | CURRENT | Mock/replaceable/server-side future-provider guidance remains applicable |
| Workflow Rules | CURRENT | Preserve focused inspect/edit/validate discipline; user explicitly waived build for this docs task |
| Git Standards | CURRENT | Small meaningful commits when authorized; none authorized here |
| Current Priority | STALE | Repositories, command palette, auth and APIs already exist; no evidence for old ordered roadmap |
| Review Mindset | CURRENT | Retain simple, secure, maintainable engineering bar |
| Generated Next.js rules | CURRENT | Preserve local-framework-doc instruction block |
| Live deployment/operational quality implicit in factual claims | UNVERIFIED | No remote hosting, database, browser/E2E or production inspection in this audit |

## Current architecture evidence

- package.json: Next 16.3.6, React 19.2.4, Supabase JS 2.106.2, Tailwind 4, Node test scripts and postinstall patch.
- AppShell and next.config.ts: core/Labs navigation, client auth gate and legacy redirects. middleware.ts passes through.
- AuthProvider, lib/supabase/auth.ts, auth-errors.ts and auth-storage.ts: SDK-persisted browser session, centralized recovery, coalesced loads and subscription cleanup. patch-supabase-auth.mjs handles narrow expected SDK logging paths.
- server/api/auth.ts authenticates via getUser; lib/supabase.ts creates a service-role client; tasks/notes/captures/activities routes derive user_id and filter ownership. RLS does not constrain those service-role requests. server/admin.ts applies ADMIN_EMAILS after authentication.
- core/storage/keys.ts and lib/local-cloud-sync.ts: legacy/scoped browser storage plus explicit import, not a full sync engine. Local data export/reset is not account deletion.
- analytics-contract/transport and analytics API/admin routes: bounded event data, credential-only Authorization boundary, fixed ingestion/report RPCs and 7/30-day report selection. Analytics SQL defines trigger collection and restricted access.
- i18n.ts, locale components and ThemeProvider: English/Ukrainian and dark/light implementations, not audited visual completeness.
- Active migration files include the reconstructed prerequisite and analytics/hardening. Archived initial draft is outside the active stream. Production deployment claims in the conversation are historical user reports, not refreshed production evidence.
- verify:rls is a static assertion script; verify:ownership:runtime writes fixtures. Disposable PGlite verifiers use external modules/catalog fixtures and are not part of npm test.

## Risks, conflicts and UNKNOWN items

1. Historical docs (PRODUCT, PROJECT_OVERVIEW, ARCHITECTURE, SECURITY, SUPABASE_MIGRATIONS) contain false current-tense no-auth/no-backend claims. MIGRATION_RECONCILIATION still describes pending preparation even though active SQL now includes hardening. AGENTS flags these conflicts; this task does not rewrite the entire documentation corpus.
2. Runtime isolation depends on explicit owner filters because service-role data access bypasses RLS. This review identifies the boundary, not a fresh exhaustive authorization certification.
3. tasks API still logs error.message on failures. Compliance of all logs with privacy requirements is not established; inspect/sanitize in a separately authorized code task. No raw production errors were read here.
4. Browser-persisted sessions carry JavaScript/XSS exposure; narrow recovery plus SDK patch is not a server-cookie architecture. Patch compatibility must be checked on SDK upgrades.
5. Many prior changes are uncommitted/untracked, including migrations and tests. Preserve them; no source attribution beyond the snapshot evidence should be invented.
6. Duplicate inbox-presentation file has unknown provenance. It was not removed.
7. PGlite/catalog fixtures live outside the repo; reproducibility on a clean machine requires preserving/reconstructing approved fixtures without secrets.
8. Current remote Git state, live deployment contents, live grants/RLS, auth email delivery, authenticated E2E and visual/accessibility readiness remain UNKNOWN in this task. Prior recorded PASS results do not fill those gaps.
9. Broader product strategy and design acceptance need explicit scope. No roadmap was invented.

## Changes and validation

This task modifies AGENTS.md and creates this report only. It preserves the generated Next block and all pre-existing source/tests/migrations/configuration bytes. The redesign proposal is unchanged.

PASS: 11 package scripts and 53 repository path references resolved; SHA-256 comparison confirms only AGENTS.md changed and only this report was added. All existing application/test/migration/configuration bytes preserved. git diff --check exited 0. The manifest checker initially counted an already-deleted tracked file as newly added; filtering to existing files corrected that checker error. No build, application tests, runtime security probes or production requests ran. These results validate documentation only.

## Next batch recommendation

First resolve the documentation conflicts and scope a small redesign pilot using existing shared primitives and one representative core route, with English/Ukrainian, light/dark, mobile and keyboard acceptance criteria. Keep auth/storage/API/migration behavior out of that visual batch. Review raw error logging separately before claiming a privacy security gate. Do not expand Labs or claim beta readiness from design work alone.

## Existing changed-file inventory

Tracked changes before audit (including the pre-existing AGENTS change):

- AGENTS.md
- docs/ANALYTICS.md
- src/app/ai-chat/page.tsx
- src/app/app/page.tsx
- src/app/automation/page.tsx
- src/app/cars/page.tsx
- src/app/finance/page.tsx
- src/app/forgot-password/page.tsx
- src/app/help-center/page.tsx
- src/app/landing/page.tsx
- src/app/legal/privacy/page.tsx
- src/app/legal/terms/page.tsx
- src/app/login/page.tsx
- src/app/notes/page.tsx
- src/app/register/page.tsx
- src/app/reset-password/page.tsx
- src/app/search/page.tsx
- src/app/settings/page.tsx
- src/app/tasks/page.tsx
- src/app/timeline/page.tsx
- src/app/today/page.tsx
- src/components/AppShell.tsx
- src/components/auth/AuthProvider.tsx
- src/components/command-palette/CommandActionDialog.tsx
- src/components/command-palette/CommandPalette.tsx
- src/components/feedback/FeedbackDialog.tsx
- src/components/timeline/TimelineEventCard.tsx
- src/components/ui/Badge.tsx
- src/components/ui/Button.tsx
- src/components/ui/Card.tsx
- src/components/ui/ConfirmDialog.tsx
- src/components/ui/Page.tsx
- src/core/storage/keys.ts
- src/lib/analytics.ts
- src/lib/i18n.ts
- src/lib/supabase.ts
- src/lib/unified-search.ts
- src/server/api/auth.ts
- supabase/migrations/202605270001_initial_schema.sql
- tests/analytics.test.mjs
- tests/timeline.test.mjs

Untracked before audit:

- docs/ANALYTICS_ADMIN_V1_REVIEW.md
- docs/MIGRATION_RECONCILIATION.md
- docs/ORVIA_DESIGN_SYSTEM.md
- docs/proposed-migrations/202609250002_runtime_table_privilege_hardening.sql
- docs/testing/private-beta-readiness.md
- scripts/verify-beta-analytics-db.mjs
- scripts/verify-migration-reconciliation.mjs
- scripts/verify-runtime-privilege-hardening.mjs
- src/app/api/admin/analytics/route.ts
- src/app/api/analytics/route.ts
- src/app/app/admin/analytics/page.tsx
- src/app/error.tsx
- src/app/not-found.tsx
- src/components/i18n/LocaleSwitcher.tsx
- src/components/ui/useDialogFocus.ts
- src/lib/admin-analytics-api.ts
- src/lib/analytics-contract.ts
- src/lib/analytics-transport.ts
- src/lib/inbox-presentation 2.ts
- src/lib/memory/presentation.ts
- src/lib/signup-handoff.ts
- src/server/api/analytics-body.ts
- supabase/migration-archive/202605270001_initial_schema.sql
- supabase/migrations/202605280001_legacy_tasks_prerequisite.sql
- supabase/migrations/202609250001_beta_analytics.sql
- supabase/migrations/202609250002_runtime_table_privilege_hardening.sql
- tests/analytics-server.test.mjs
- tests/helpers/load-typescript.mjs
- tests/i18n-consistency.test.mjs
- tests/signup-flow.test.mjs
- tests/signup-handoff.test.mjs
