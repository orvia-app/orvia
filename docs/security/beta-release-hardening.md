# Private beta hardening — 2026-09-25

Branch: `fix/beta-release-hardening`. No commit, push or deployment performed.

## Dependency audit

Registry `npm audit` results for the checked-out lockfile:

| Scope | Critical | High | Moderate | Low | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Before, all dependencies | 1 | 7 | 2 | 1 | 11 |
| Before, `--omit=dev` | 1 | 6 | 1 | 1 | 9 |
| After, all dependencies | 0 | 0 | 0 | 0 | 0 |
| After, `--omit=dev` | 0 | 0 | 0 | 0 | 0 |

The reported GitHub count of 46 (4 critical / 28 high / 13 moderate / 1 low)
was not reproduced by npm against this branch. GitHub alerts and npm's aggregate
package findings are different reporting scopes; the precise reason for the
historical discrepancy was not verified. Zero here means no findings in the
queried npm advisory database, not proof of an entirely secure product.

### Critical / High triage

All entries except Next.js are transitive. “Production tree” describes npm's
classification; some tools in that tree run during builds rather than requests.

| Package | Scope / owner | Installed before | Patched floor for reported issues | Chosen after | Relevance and remediation |
| --- | --- | --- | --- | --- | --- |
| next (critical) | Direct production runtime | 16.2.6 | 16.3.3 for critical findings; 16.2.11 for earlier high findings | 16.3.6 | App Router/Turbopack runtime. Windows RCE is not the documented Vercel deployment path. No app `next/image`, custom server, Server Actions or attacker-controlled rewrites were found, reducing reachability of several findings, but framework security fixes are still appropriate. Supported same-major minor release. |
| sharp (high) | Production optional dependency of Next | 0.34.5 | 0.35.4 | 0.35.4 | Image processing/libvips/libheif issues; no current app Image component found. Updated through Next's supported dependency, not an independent forced override. |
| postcss (high) | Production tree via Next; also Tailwind build tooling | 8.5.14 override | 8.5.23 | 8.5.28 | Source-map file traversal. App does not accept arbitrary CSS for compilation. Updated existing override within major 8. |
| nanoid (high) | Production tree via PostCSS | 3.3.12 | 3.3.18 | 3.3.19 | Invalid-size generator loops; no user-controlled generator size found in Orvia. Compatible transitive patch resolution. |
| brace-expansion (high) | Both dev ESLint and production-tree Sentry/glob build tooling | 1.1.14, 5.0.6 | 1.1.18, 5.0.9 | 1.1.21, 5.0.12 | Expansion DoS; not an app feature accepting user glob expressions. Targeted compatible updates to each installed major. |
| browserslist (high) | Production-tree Babel/Sentry build tooling | 4.28.2 | 4.28.7 | 4.29.1 | Untrusted queries/custom statistics can exhaust memory or crash. App does not accept these inputs. Compatible targeted update. |
| fast-uri (high) | Production-tree Sentry → webpack → schema-utils/Ajv | 3.1.2 | 3.1.6 | 3.1.8 | Host confusion/SSRF parsing issues; used by schema tooling, not Orvia URL routing. Compatible patch update. |
| js-yaml (high) | Dev-only ESLint config tooling | 4.1.1 | 4.3.2 | 4.3.2 | YAML merge/omap CPU exhaustion. Orvia does not expose a YAML upload/parser endpoint. Compatible minor update. |

Other findings: Babel core 7.29.0 → 7.29.7 (low), baseline-browser-mapping
2.10.29 → 2.11.26 (moderate), and the Tailwind/PostCSS propagated moderate finding
resolved by the PostCSS override. Babel helper/parser and browser-data updates
are dependencies of these targeted updates.

`eslint-config-next` and Next's compiler/environment packages now match 16.3.6.
No existing package changed its major version. No `audit fix --force` or blanket
update was used. Sharp's pre-1.0 minor update follows Next's supported dependency
and was validated by the production build.

React/React DOM remain 19.2.4; Sentry remains 10.57.0. They have no findings in
this audit. Supabase JS/Auth remain 2.106.2 with the existing logging patch;
the root Supabase requirement is now exact to prevent an ordinary install from
selecting an incompatible SDK. Postinstall and all stale-session tests pass.
The patch script and authentication implementation were not changed.

Primary framework sources:
- [Windows RCE advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36)
- [AVIF image optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4)
- [Next 16.3.6 release](https://github.com/vercel/next.js/releases/tag/v16.3.6)

## Privacy / support audit

Inspected Supabase auth/API code, feedback submission and admin review, Sentry
configuration/redaction, analytics helpers, storage keys and export/reset helpers.
Terms and Privacy now show a fixed last-updated date. Both languages explain:

- Supabase authentication/database storage and auth email requests;
- feedback messages, account association, operational metadata and admin review;
- Sentry diagnostics/internal user ID when a deployment enables monitoring;
- disabled replay/tracing/profiling and configured redaction;
- local beta events/identifiers without third-party analytics delivery;
- browser session storage, preferences, caches and Labs records;
- exact local backup scope: legacy local tasks/notes/captures, Finance, Cars, theme;
- excluded cloud records, signed-in recovery caches, feedback and activity;
- unavailable restore, full account export and self-service account deletion;
- Settings/sidebar feedback and the existing invite channel as support paths.

Settings no longer implies backup restore is available. Help no longer implies
fallback writes will upload automatically. Help includes a Settings support link.
No support address, legal operator identity, data residency, retention period or
GDPR/CCPA compliance claim was invented. Production DSN enablement, Supabase SMTP
configuration, provider retention and delivery were not verified remotely.
The Privacy copy is conditional about monitoring for that reason.

Relevant stale documentation in ENVIRONMENT and BETA_FEEDBACK was corrected.

## Inbox changes

Uses shared Page, PageHeader and section headers like Dashboard/Today/Tasks/
Notes/Timeline. Standardized heading size, width, spacing and empty state.
Actions wrap on smaller screens; long content wraps; the input has an accessible
name. Account/device indicators and fallback warnings remain visible.
Removed redundant parser confidence/source/tag/summary diagnostics from the UI;
type and workspace labels and singular create actions are localized. Draft copy
now describes the actual preview → task/note flow instead of promising queue
insertion. Parsing, generated stored content, capture API, processing, data model,
auth, RLS and navigation are unchanged.

## Remaining beta risks

- No unresolved Critical/High npm findings at audit time. Re-audit before release.
- The version-checked Supabase patch still requires deliberate SDK upgrade review.
- No external support email; users unable to sign in need their existing invite
  channel. Establish a public support/contact path before broader access.
- Legal operator identity, provider contracts/retention, jurisdiction-specific
  obligations and production monitoring/email settings need owner verification.
  This copy alignment does not establish legal compliance.
- Account deletion/full cloud export/backup restore are not implemented.
- Local fallback has no automatic upload queue. Local reset can lose unsynced data.
- Inbox parser remains English-keyword/rule-based; this pass localizes UI labels,
  not classification logic or generated stored summaries.
- Existing preview creation still has limited failure feedback; no processing
  behavior was changed during this visual-only pass.

## Validation and manual smoke plan

Required gates: typecheck, production build, 59 tests (including stale-session
SDK regressions), security guard and whitespace check. Full/prod audits are zero.
Isolated component fixtures rendered for EN/UA, light/dark, empty/populated states.
Browser policy blocked opening the local fixtures, so no browser screenshot or
live authenticated/mobile smoke pass is claimed.
Final diff review checks package majors, secret exposure, protected-route/auth
changes, RLS/migrations and locale keys. No backend/schema/auth changes are included.

Before beta, run with a disposable account:
1. Install with `npm ci`; verify postinstall succeeds. Confirm Supabase JS/Auth
   2.106.2 and Next 16.3.6. Repeat both npm audits.
2. Verify login, authenticated refresh, logout, logged-out protected-route
   redirect and Incognito behavior. Run the stale-token checklist in
   `docs/testing/auth-session-recovery.md`.
3. Open Terms, Privacy and Help in EN and UA; confirm the date, readable mobile
   layout, support link, and no claimed account-delete/restore controls.
4. From Settings, open feedback and send a disposable test message; verify the
   acknowledgement and authorized admin review. Do not put secrets in feedback.
5. Confirm production Sentry enablement/redaction and Supabase confirmation/reset
   email delivery using deployment configuration and a test account.
6. Check Inbox empty and populated at 360px and desktop, in both themes/languages.
   Include a long unbroken URL and multiline capture; check wrapping and buttons.
7. Convert separate captures to task/note; archive another; check Tasks/Notes/
   Timeline. Confirm account/device fallback labels remain accurate offline.
8. Preview a draft in both languages; verify explicit create actions and existing
   behavior. Check Settings backup exclusions against the downloaded JSON.
