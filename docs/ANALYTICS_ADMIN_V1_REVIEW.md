# Analytics Admin v1 — implementation review

## 1. Existing architecture

The existing `src/lib/analytics.ts` had a six-event local-only buffer and a broader
no-op taxonomy. Landing could repeat on rerenders; first-task detection was
browser-wide and Tasks-page-only; confirmation trusted a URL parameter. Feedback
success was absent. The implementation extends this foundation and reuses
Feedback Admin's server authorization. It does not introduce a second auth system.

## 2. Implemented architecture

Existing browser helpers → strict credential-free event contract → anonymous or
separate authenticated transport → `/api/analytics` → server-only RPC → Supabase.
Task and feedback INSERT triggers record successful cloud actions atomically.
`/api/admin/analytics` authorizes with the existing admin helper and returns only
aggregates to `/app/admin/analytics`.

Signup remains anonymous and `src/app/register/page.tsx` is unchanged. No access
token is a field in event inputs, serialized events, buffers or database arguments.
For login/confirmation only: existing Supabase session credential → transport
factory closure → Authorization header → server `getUser()` validation → verified
user ID / confirmation state → allowlisted RPC. No extra auth/session requests
are made by the browser analytics helper. Tests trace a sentinel credential through
this boundary, including a thrown error containing it, without logging/persisting
it. Hosting/proxy logging configuration is an external operational responsibility.

## 3. Database migration

`supabase/migrations/202609250001_beta_analytics.sql` adds one table, useful time/
anonymous indexes, UUID/session/account uniqueness, two service-only RPCs and two
content-free trigger functions. RLS is enabled; PUBLIC/anon/authenticated table
privileges and RPC execution are revoked. Service-role privileges are also reset
before granting only SELECT/INSERT, overriding Supabase default grants. Existing
RLS policies are unchanged.
Account deletion cascades linked analytics. Requires PostgreSQL 15+.
The migration has NOT been applied to a live Supabase project.

## 4. Exact event list

`landing_view`, `signup_started`, `signup_completed`, `email_confirmed`,
`login_completed`, `first_task_created`, `feedback_submitted`.

## 5. Exact stored fields

`id` UUID; constrained `event_name`; nullable UUID `anonymous_id` and `session_id`;
server-derived `authenticated`; nullable verified UUID `user_id`; nullable
`locale` (`en`/`ua`); server `created_at`. Database-trigger events have NULL browser
IDs and locale. Feedback uses its source UUID as the idempotent event ID.
No metadata column exists. The local buffer retains only anonymous/session IDs,
event name, language, timestamp and the UI's signed-in boolean, capped at 200 rows.

## 6. Data never stored in analytics

Task titles/descriptions; note titles/content; capture text; search queries;
feedback bodies; email addresses; passwords; access/refresh tokens; auth headers;
cookies; raw errors; arbitrary URLs; request/response bodies; arbitrary metadata;
IP addresses or device fingerprints. Strict input rejection and explicit output
projection enforce this boundary; this is not a general-purpose metadata API.

## 7. Anonymous continuity

Random browser ID plus a shared 30-minute inactivity session ID survive refresh
and normally share across tabs. Local reset rotates IDs; unsupported randomness
and unavailable storage degrade safely. Login/confirmation rows join the browser
context with a server-verified account. Anonymous history is not retrospectively
assigned to accounts; no cross-device anonymous matching or fingerprinting occurs.
A shared browser is not necessarily one person. Simultaneous first tabs can race.

## 8. Admin authorization

Existing `authenticateAdminApiRequest`, Supabase token verification and server
`ADMIN_EMAILS`: unauthenticated 401, normal account 403, allowlisted admin 200.
Navigation reuses the existing Feedback Admin probe; direct API authorization is
mandatory. Responses are private/no-store. Old account reports are hidden on
account changes. No client-provided admin flag or owner identity is trusted.

## 9. Dashboard

Seven summary counts with proportional bars; last 7/30 UTC calendar days; daily
totals; matched signup, activation and feedback conversions; zero denominator
shown as `—`; refresh/loading/error/denied/empty states; EN/UA; existing responsive
light/dark components. No per-user rows, content, chart dependency or cohort engine.
Conversions require both steps in the period and match a browser session or
account; they are explicitly period overlaps rather than chronological cohorts.

## 10. Files changed

Modified:

- `docs/ANALYTICS.md`
- `src/app/landing/page.tsx`
- `src/app/login/page.tsx`
- `src/app/tasks/page.tsx`
- `src/components/AppShell.tsx`
- `src/components/auth/AuthProvider.tsx`
- `src/core/storage/keys.ts`
- `src/lib/analytics.ts`
- `src/lib/i18n.ts`
- `src/lib/supabase.ts` (RPC types only)
- `src/server/api/auth.ts` (exposes verified confirmation state)
- `tests/analytics.test.mjs`

Added:

- `docs/ANALYTICS_ADMIN_V1_REVIEW.md`
- `scripts/verify-beta-analytics-db.mjs`
- `src/app/api/analytics/route.ts`
- `src/app/api/admin/analytics/route.ts`
- `src/app/app/admin/analytics/page.tsx`
- `src/lib/analytics-contract.ts`
- `src/lib/analytics-transport.ts`
- `src/lib/admin-analytics-api.ts`
- `src/server/api/analytics-body.ts`
- `supabase/migrations/202609250001_beta_analytics.sql`
- `tests/analytics-server.test.mjs`
- `tests/helpers/load-typescript.mjs`

An unrelated untracked `src/lib/inbox-presentation 2.ts` appeared during the task.
It is byte-identical to the existing file and was left untouched; exclude it from
this PR. Package files and `scripts/patch-supabase-auth.mjs` are unchanged.

## 11. Tests

71 application tests pass, preserving existing analytics and real Supabase stale-
session regression coverage. Added behavior checks cover strict event/field/type
validation, metadata/content/identity rejection, actual body-size and origin
limits, server confirmation evidence, generic failures, admin 401/403/200,
bounded periods, sanitized responses, zero denominators, credential isolation,
network failure, refresh deduplication, repeated auth callbacks, local reset and
corrupt stored records.

The disposable PostgreSQL runner executes the actual migration and checks first-
task uniqueness, retries, multirow inserts, soft-deleted/prior tasks, failed writes,
rollbacks, feedback success only, telemetry outage isolation, account switching,
confirmation evidence, aggregate math, rate budgets, role restrictions and deletion
cascade. Its fixture models broad Supabase default grants, verifies denied service-
role UPDATE/DELETE/TRUNCATE, and verifies no PUBLIC/anon/authenticated execution
of the four analytics functions. It adds no project dependency and never connects to production.

## 12. Validation

- `npm run typecheck`: PASS after preserving two byte-identical generated
  `.next/types/* 2.ts` duplicates outside the type directory at
  `/tmp/orvia-generated-types-94p756f4`. They had reappeared after the build;
  investigate filesystem synchronization if this recurs. No source duplicate was removed.
- `npm run test`: PASS, 71 tests.
- Disposable PostgreSQL migration/behavior verification: PASS.
- `npm run security:guard`: PASS.
- `npm audit --omit=dev`: PASS, zero vulnerabilities (registry access required).
- `git diff --check`: PASS.
- Generated browser asset scan: configured service-role credential absent.
- `npm run build`: environment failure in Turbopack's instrumentation loader;
  worker port binding returns `Operation not permitted`, including elevated retry.
- `npm run build -- --webpack`: PASS on final source; TypeScript and all 45 pages.
  Existing non-blocking Sentry missing-global-error-handler warning remains.
- Supabase JS/Auth: both 2.106.2. Dependency manifests, lockfile and auth patch
  unchanged; real SDK recovery regressions pass.

No live database changes, commits or pushes. Deployed/browser smoke checks remain
pending; the SQL runtime test is not a claim of deployed Supabase verification.

## 13. Security review

Reviewed IDOR, admin bypass, service-key exposure, PII/content leakage, arbitrary
metadata, event-name injection, oversized/streamed bodies, replay, XSS, credential
logging and RLS. The new routes expose no per-user analytics query surface. Only
server-verified identities reach ingestion; task/feedback names cannot be submitted
through the browser endpoint. Requests are limited to 1 KiB and fixed UUID/locale
fields. Database uniqueness handles replay; durable 30/browser/minute and
600/global/minute budgets bound stored volume. SQL uses no dynamic input SQL.
Dashboard values are constrained labels/dates/numbers rendered through React.

The browser endpoint is intentionally public for anonymous events: origin checks
are not bot authentication. Rotating IDs, request floods or global-budget
exhaustion can distort metrics or consume resources. Hosting/WAF request limits
remain appropriate; no IP tracking was introduced. Counts are not audit/security/
billing evidence. Raw provider errors are not logged by these endpoints.

## 14. Privacy/legal

EN/UA privacy copy now describes first-party server/Supabase analytics, limited
local buffering, account association, content exclusions and no decided server
retention. Sentry monitoring and feedback content remain distinct. Terms were
reviewed and did not require changes. No compliance or invented retention claim.

## 15. Remaining risks/decisions

Decide retention, deletion/export handling and market-specific notice/consent with
appropriate review. Client events are spoofable and lossy; triggers favor product
availability over guaranteed analytics delivery. Email confirmation is first
observed confirmed status, including existing accounts; signup completion means a
successful Supabase response, not guaranteed new account. First-task means first
successful cloud task; offline fallback and predeployment hard-deleted history
cannot be reliably reconstructed. Cross-connection concurrency and deployed
RLS/UI/provider behavior still need staging smoke verification. Default Turbopack
needs a host/build-environment investigation; Webpack production compilation passes.

## 16. Exact migration/deployment steps

Follow the deployment section of `docs/ANALYTICS.md`: check project/version and
prior migrations, apply the complete transactional analytics SQL on staging,
verify restricted roles/RPCs, deploy with existing server-only service role and
ADMIN_EMAILS, and run smoke checks before production. CLI users must inspect
`supabase migration list` and `supabase db push --dry-run` before `supabase db push`;
do not blindly apply unrelated pending migrations. No new environment variables.

## 17. Manual smoke checklist

The complete executable checklist is in `docs/ANALYTICS.md`: landing refresh/tabs,
signup failure/success, real confirmation versus forged URL, login, first task
across creation surfaces and concurrent tabs, feedback failure/success, blocked
telemetry, malicious payloads, anon/user/admin authorization, RLS, 7/30-day and
empty/error states, EN/UA/light/dark/mobile, account switching, and stale-session/
logout/protected-route/Incognito regression checks.

## 18. Recommended PR title

Add privacy-safe first-party beta analytics and admin dashboard

## 19. Recommended PR description

The existing beta funnel was local-only, with browser-wide first-task tracking,
URL-based confirmation detection and no feedback-success event. Extend the
existing analytics helpers with a strict first-party endpoint and an authorized
aggregate dashboard for seven beta milestones. Keep credentials in separate
transport, derive identity server-side, and record first cloud task/feedback
success through deduplicated database triggers. Reuse Feedback Admin authorization;
add EN/UA privacy copy and migration/deployment documentation.

Validation: 71 application tests, disposable PostgreSQL behavior/RLS-grant checks,
typecheck, security guard, zero-vulnerability production audit, diff check and
Webpack production build pass. Default Turbopack hits an environment worker-port
permission failure. Supabase 2.106.2 and its recovery patch are unchanged. Apply
`202609250001_beta_analytics.sql` and run staging smoke checks before deploying.
Server retention remains an explicit unresolved decision.
