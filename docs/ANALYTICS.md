# Orvia first-party beta analytics

## Existing foundation and scope

Analytics Admin v1 extends `src/lib/analytics.ts`, its 200-record local buffer,
and the existing Feedback Admin authorization. The broad `trackEvent` taxonomy
remains a no-op: its older metadata sanitizer is NOT a server ingestion schema.
Previously six events were local-only; confirmation trusted `type=signup` URL
text, first-task detection was browser-wide and only on the Tasks page, and
feedback success was absent. Those inaccurate paths have been replaced.

There is no third-party product analytics SDK, autocapture, replay, fingerprint,
retention engine, or per-user analytics screen. Sentry remains separate,
DSN-gated error monitoring with its existing redaction and disabled replay,
tracing, profiling and source-map upload settings. Feedback messages remain in
`feedback`, accessible through the existing authorized feedback workflow; only
a content-free submission event enters analytics.

## Events and meaning

| Event | Source | Deduplication / meaning |
| --- | --- | --- |
| `landing_view` | Landing after auth resolves | Once per random browser session |
| `signup_started` | Registration submission | Once per browser session, not every attempt |
| `signup_completed` | Successful Supabase signup response | Once per browser session; Supabase can obscure existing accounts, so not a verified new-account count |
| `email_confirmed` | Confirmed authenticated session, rechecked server-side and against `auth.users` | Once per account; first observation of confirmed status, including pre-existing accounts; not the historical confirmation timestamp |
| `login_completed` | Successful password login | Once per account/browser session; does not count every session restoration or link sign-in |
| `first_task_created` | Database task INSERT trigger | First successful cloud task, once per account; covers every creation surface and batch inserts; prior and soft-deleted tasks prevent reactivation |
| `feedback_submitted` | Database feedback INSERT trigger | One per successful feedback row; no event for opening, rejected inserts or rolled-back transactions |

Local fallback/offline tasks are not counted until a first cloud write succeeds.
No historical events or old local-buffer records are uploaded/backfilled.
Hard-deleted history predating deployment cannot be reconstructed. If a trigger
fails, the business write survives and the event may be missing; fixed diagnostic
warnings make this observable without including any content.

## Data contract and continuity

`analytics_events` stores exactly:

- `id`: UUID event ID (feedback uses its source UUID for idempotency).
- `event_name`: one of the seven names above, enforced by a database constraint.
- `anonymous_id`, `session_id`: random UUIDs for browser events; NULL for
  database task/feedback events.
- `authenticated`: derived from verified server identity, never client JSON.
- `user_id`: verified Supabase account UUID or NULL; linked events cascade on
  account deletion. It is pseudonymous personal data, not anonymized data.
- `locale`: `en` or `ua` for browser events; NULL when unavailable in triggers.
- `created_at`: database server time.

There is no metadata column. NEVER stored in analytics: task titles/descriptions,
note titles/content, captures, search queries, feedback messages, email addresses,
passwords, access/refresh tokens, auth headers/cookies, URLs, raw errors, arbitrary
request/response bodies, IP addresses or device fingerprints.

The existing anonymous-ID key holds a cryptographically random UUID. Legacy
prefixed IDs are replaced, not uploaded. A shared browser-storage session record
expires after 30 minutes without analytics activity, retaining continuity over
refreshes/tabs. Initial simultaneous tab creation can race and cause extra
sessions; no invasive synchronization/fingerprinting is used. Storage failures
fall back to in-memory random IDs; without secure randomness telemetry is dropped.
Local reset creates new identifiers. Account switching does not merge account
identities. A shared browser can retain the same anonymous ID across accounts,
so anonymous counts are browser signals, not people.

Landing and signup use anonymous transport, including successful signup with an
automatically created session. No signup caller passes `data.session?.access_token`
to `trackBetaEvent`. Login and confirmation use a separate
`createAuthenticatedAnalyticsTransport` function; credentials are not fields in
`TrackBetaEventInput`, `BrowserAnalyticsEvent`, or local records. The factory
closes over the existing auth credential only for the immediate request.

Exact credential flow: Supabase session → transport factory → Authorization
header → `authenticateApiRequest` → Supabase `getUser()` → verified user ID and
confirmation state → allowlisted database RPC arguments. Explicit serialization
and strict endpoint validation exclude credentials and extra fields. Failure
handling never logs or returns raw errors/headers. Tests use a sentinel credential
to verify the whole application boundary. Existing Sentry redaction strips auth
headers and request bodies; independently configured hosting/proxy logs remain an
operational configuration responsibility.

Supabase verifies authenticated events on the server. Their anonymous/session IDs provide same-browser continuity
with preceding events. Earlier anonymous rows are not rewritten with user IDs,
and no cross-device anonymous identity matching is attempted. The admin response
contains aggregate numbers only.

## Ingestion and security

`POST /api/analytics` accepts exactly `id`, `event_name`, `anonymous_id`,
`session_id`, `locale`. Only the first five event types are accepted from browsers.
Unknown/extra fields (including `user_id`, `authenticated`, metadata and dates)
are rejected. UUIDv4, locale and event allowlists are enforced. Actual streamed
JSON is limited to 1 KiB. Origin must match the request origin; cross-site fetches
and non-JSON content types are rejected. No CORS access is offered.

Missing bearer tokens yield anonymous events only for the first three names.
Invalid supplied tokens return 401, never downgrade to anonymous. Confirmation
and login require verified authentication; confirmation requires actual confirmed
state, never URL parameters. Browser signup/landing signals remain client-reported
and cannot prove genuine human activity.

The service-only RPC uses a nonblocking transaction advisory lock and durable
budgets of 30 events/browser/minute and 600 events globally/minute. UUID replay,
per-session duplicates and per-account milestones hit unique indexes, not extra
rows. Busy ingestion returns 429; client sends are best effort, bounded to five
seconds, with no retry queue. This intentionally favors product availability over
perfect measurement. Rate limits do not replace hosting/WAF request limits:
rotating browser IDs or request flooding can consume resources or suppress metrics.
Origin headers are not bot authentication. No IPs are saved for rate limiting.

RLS is enabled with no anon/authenticated policies or table privileges. RPCs and
trigger functions have fixed empty search paths and revoked PUBLIC execution.
Service-role table privileges are explicitly reset before granting only SELECT
and INSERT, overriding broad Supabase defaults. Only service_role can ingest/read aggregates. No existing table policy is weakened.
Trigger exceptions emit only fixed warnings and do not roll back product writes.
No keys, payloads or raw provider errors are logged by analytics routes.

## Admin dashboard and definitions

`GET /api/admin/analytics?days=7|30` uses the same
`authenticateAdminApiRequest` / server `ADMIN_EMAILS` allowlist as Feedback Admin.
Unauthenticated = 401, authenticated non-admin = 403. Navigation hiding reuses
the Feedback Admin probe; direct route/API requests still require authorization.
Admin responses are private/no-store; SQL returns aggregates, not identities.

`/app/admin/analytics` has seven counts, proportional bars, 7/30-day controls,
UTC daily totals, refresh, loading/error/denied/empty states, EN/UA and existing
responsive light/dark components. On account or period change, the old report is
hidden while authorization/loading completes.

Conversions use distinct matching participants with BOTH steps in the selected
UTC calendar-day window, not ratios of unrelated event totals:

- Signup: sessions with completed AND started / sessions with started.
- Activation: accounts with first-task AND login / accounts with login.
- Feedback: accounts with feedback AND first-task / accounts with first-task.

These are period overlaps, not chronological cohorts or retention measurements.
A zero denominator displays `—`, never a fabricated percentage. Existing
activated users do not re-enter the activation denominator simply by returning.

## Deployment (required; not applied automatically)

1. Confirm the target project and PostgreSQL version (15+ for NULLS NOT DISTINCT):
   `select current_database(), current_setting('server_version');`.
2. Confirm all existing migrations through `202606010008_create_feedback.sql`
   are already applied and `public.tasks` / `public.feedback` exist. Back up the
   target project using its normal operational process.
3. In the target Supabase SQL Editor run the complete, transactional file
   `supabase/migrations/202609250001_beta_analytics.sql` once. Alternatively, with
   your existing linked CLI workflow, inspect `supabase migration list`, then
   `supabase db push --dry-run`, and only apply `supabase db push` after checking
   that this is the intended pending migration set. Do not blindly apply unrelated
   older pending migrations to a manually provisioned database.
4. Verify table RLS, absent anon/authenticated grants, and service-only RPC grants.
   Use disposable anon/authenticated clients: table reads/writes and both RPCs
   must fail. Run `select public.beta_analytics_report(7);` as a privileged operator
   to check a well-formed zero/empty report. Test on staging before production.
5. Deploy the app with existing `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, server-only `SUPABASE_SERVICE_ROLE_KEY`, and
   server-only `ADMIN_EMAILS`. No new env vars or dependencies. Ensure proxy origin
   forwarding preserves the public request origin. Never expose the service key.
6. Perform the smoke checklist below, then inspect only fixed analytics diagnostics
   and aggregate counts. The new browser instrumentation requires this migration;
   without it analytics returns 503 but product actions continue.

Rollback: roll back the app first; old code ignores the analytics objects. If
collection must stop, drop `beta_task_activation` on tasks and
`beta_feedback_submission` on feedback. Retain the analytics table until its data
handling is decided; do not casually drop collected data. A destructive database
rollback is a separate operator decision.

## Automated verification

Normal gates: `npm run typecheck`, `npm run build`, `npm run test`,
`npm run security:guard`, `npm audit --omit=dev`, `git diff --check`.
The real Supabase 2.106.2 stale-session SDK tests must remain green; the pinned
version, lockfile and patch script are unchanged.

API tests execute the real routes/auth/admin helpers with mocked providers,
checking validation, identity spoofing, content rejection, payload/origin limits,
confirmation evidence, generic failures, authorization, bounded periods, sanitized
reports, zero denominators and browser failure/refresh behavior. Existing local
analytics tests are preserved and updated for the new authoritative event sources.

Database behavior can be exercised without project dependencies or a real account
using an isolated PGlite PostgreSQL runtime:

```sh
npm install --prefix /tmp/orvia-analytics-pg-test --no-save --package-lock=false --ignore-scripts @electric-sql/pglite@0.3.14
node scripts/verify-beta-analytics-db.mjs /tmp/orvia-analytics-pg-test/node_modules/@electric-sql/pglite/dist/index.js
```

This creates only an in-memory database with minimal auth/tasks/feedback fixtures.
It checks real SQL migration/trigger behavior, multirow/retry deduplication,
soft-deleted history, failed writes, rollback, telemetry outages, confirmation,
rate budgets, aggregates, restricted role grants and deletion cascade. The fixture
models broad Supabase default table/function grants and verifies service_role can
SELECT/INSERT but cannot UPDATE/DELETE/TRUNCATE, while PUBLIC/anon/authenticated
cannot directly execute any analytics function. It does not
prove deployed Supabase configuration or multi-connection timing; unique indexes
provide database-level concurrent deduplication. Staging RLS and concurrent-tab
smoke tests remain required.

## Manual smoke checklist

1. On staging, open a clean browser at `/landing`. Refresh, change EN/UA, navigate
   away/back and open another tab. Expect one landing event for the shared session.
   Inspect only the analytics POST schema: no URLs, content, identity or tokens in
   JSON; an auth header is expected only for login/confirmation events.
2. Submit an invalid signup, then a valid disposable signup. Started increments
   once/session; completed only on successful response. Confirm email, sign in,
   refresh several times: email confirmation increments once/account, login once
   per account/session. A forged `?type=signup` alone must not confirm anything.
3. With a brand-new user, create tasks from Tasks, Command Palette or Inbox, then
   refresh/open a second tab/create more. Exactly one first-task event. Test two
   tabs creating the user's first task concurrently. Existing users with prior or
   soft-deleted tasks must not get a new activation. Offline fallback is excluded.
4. Open/cancel Feedback: no event. Force submission failure: no event. Successfully
   submit: one event. Its analytics row must not contain message/category/metadata.
5. Block `/api/analytics` in DevTools. Signup/login/task/feedback behavior should
   continue normally; no retry loop. Restore network and test subsequent events.
6. Call analytics with extra `user_id`, metadata, unknown name or oversized JSON:
   expect 400. Cross-origin = 403; invalid token = 401. Direct Supabase table/RPC
   access with anon and normal-user roles must fail.
7. Logged out: admin API returns 401. Normal user: API returns 403, no admin nav.
   Allowlisted admin: dashboard opens, 7/30-day data loads, empty/error/retry states
   work, conversions with zero denominator show `—`. Check EN/UA, dark/light and
   390px mobile width. Switch from admin to normal account: old report disappears.
8. Repeat stale-session recovery smoke from `docs/testing/auth-session-recovery.md`:
   stale token becomes signed out without overlay, normal login/refresh/logout work,
   protected routes deny signed-out access, Incognito works cleanly.

## Outstanding decisions and limitations

- Choose/document server retention and deletion/export handling before broader
  release. No invented retention period or legal-compliance claim is made here.
- Review notice/consent and lawful-basis requirements for intended markets with
  qualified counsel; code does not establish compliance.
- Anonymous client signals are spoofable and telemetry is lossy (blocked network,
  timeouts, global budget, simultaneous new tabs, trigger errors). Metrics are not
  billing, audit, fraud or security records.
- Deploy-time RLS, preview UI, real email confirmation, cross-tab concurrency and
  provider behavior require staging verification; no production migration is run
  by this implementation or its tests.
