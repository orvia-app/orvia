# Final private-beta readiness audit — 2026-09-28

Status: PASS WITH MANUAL CHECKS. Local checks do not constitute authenticated production E2E sign-off.

## Scope and evidence

Source review covered landing/auth/email-confirmation states, Dashboard, Today, Inbox, Tasks, Notes, Search, Timeline, feedback, Settings, Help, Labs and both admin screens, plus shared navigation, forms, dialogs, loaders and fallbacks. Protected screens were reviewed in source; authentication was not bypassed. No production credentials or production writes were used. Database, migration, RLS, grants, auth configuration and analytics semantics were not changed by this audit.

Browser verification used an isolated localhost preview with Supabase and telemetry configuration disabled. Landing, login, registration, forgot-password, reset-password, Help, Privacy, Terms and 404 were checked in EN and UA at 375, 768 and 1440 pixels: all 54 page/language/width combinations had document scroll width equal to viewport width. Representative landing and registration screenshots were inspected. This does not prove every internal element or authenticated state fits; complete the manual checks below. Dark/light and assistive-technology coverage is not exhaustive.

## Changes and limitations

- Localized Labs previews and mock assistant responses; clarified that these are local/planned/mock features.
- Corrected mixed-language English settings copy and Ukrainian terminology, awkward phrasing and count labels.
- Added language controls to auth, Help, legal and fallback pages; added localized 404 and error UI without raw error text.
- Improved wrapping in shared buttons, headers/actions, timeline cards and modal footers; prevented auth logo compression.
- Added dialog focus containment/restoration and missing Escape handling, bounded scrollable dialogs, feedback live status, current-page navigation and theme pressed states.
- Clarified that command-palette task/note creation saves on this device; account saving remains available through Tasks/Notes. This pre-existing local-only behavior was not redesigned.
- Finance remains a Labs feature; mixed-currency totals explicitly disclose no conversion. Assistant is a mock and automation is planned.
- Static server metadata remains English; localized client UI does not imply localized SEO metadata.
- Existing Sentry warning about a missing global-error handler remains an observability follow-up, not a failed build.
- No confidently safe deletion of pre-existing duplicate/legacy files was made. No new dependencies.

## Terminology

| English | Ukrainian |
| --- | --- |
| Task / Tasks | Завдання |
| Note / Notes | Нотатка / Нотатки |
| Inbox | Вхідні |
| Today | Сьогодні |
| Search | Пошук |
| Timeline | Історія активності |
| Settings | Налаштування |
| Feedback | Зворотний зв’язок |
| Dashboard | Огляд |
| Create | Створити |
| Save | Зберегти |
| Cancel | Скасувати |
| Delete | Видалити |
| Edit | Редагувати |
| Completed | Завершено |
| Priority | Пріоритет |
| Due date | Термін виконання |
| Help | Допомога |
| Analytics | Аналітика |

Inflect nouns naturally in sentences. Preserve user-entered content, brand names and technical identifiers.

## Manual release smoke checklist

Run the entire sequence once in English and once in Ukrainian, with a dedicated beta/test account and synthetic content only. Use a separate authorized admin test account for admin checks. Record browser, language, viewport, theme, result and any screenshot for each failure. These steps are pending, not completed by the audit.

1. **Landing → signup:** open a clean browser session; select EN/UA, inspect header, main CTA and example; open registration. Check empty/invalid fields and password validation, then create the dedicated account. Confirm the verification-email state, localized explanations and disabled/loading controls.
2. **Email confirmation → login:** follow the test email link; verify success, expired/reused-link handling and return destination. Log in; wrong-password errors must be generic and localized with no raw Supabase error or token. Test password recovery using only the test account.
3. **Dashboard → first task:** inspect the empty dashboard; create a task with a long Ukrainian title, priority and due date through Tasks. Check success feedback and refresh persistence. Confirm account data does not appear for another test account.
4. **Today:** find the due task, check priority/due-date labels, complete it and verify the resulting state. Check an empty day too.
5. **Inbox:** capture a synthetic idea, process one capture into a task and another into a note; verify success, retained context and no duplicate creation on repeated clicks.
6. **Tasks:** create/edit/filter/complete a synthetic task. Open deletion confirmation and cancel. Delete only disposable test content when explicitly intended. Refresh and verify persistence. Test long titles and validation failures.
7. **Notes:** create/edit/search a synthetic note with long text; verify refresh persistence. Check modal keyboard behavior, cancel and intentional empty states.
8. **Search:** find the synthetic task/note/capture, open each result, then search for a nonexistent phrase. Check count labels, empty state and navigation.
9. **Timeline:** verify test actions appear, filters and ordering work, localized system labels do not translate user content, and long titles/timestamps fit.
10. **Settings:** switch language and light/dark/system themes, navigate away and refresh to check persistence. Inspect local-data/import explanations without importing or clearing existing real data.
11. **Feedback:** open from navigation, check required fields, submit one clearly identified beta-test report, verify pending/success states and no duplicate submit. Check failure messaging in a controlled non-production environment.
12. **Help:** open FAQ, Privacy and Terms, change language, verify links and return navigation. Open an unknown URL for localized 404.
13. **Logout/login again:** log out, refresh, and open a protected route directly; expect login with no private-content flash. Log in again and confirm the account data persists. Repeat in Incognito. Use the separate auth-session-recovery checklist for stale-token testing on disposable browser storage only.
14. **Admin Feedback:** ordinary test account must be denied; authorized admin account should see the submitted test report, usable filters and sensible empty/error/loading states. Do not edit existing production reports.
15. **Admin Analytics:** ordinary/anonymous access must be denied. Authorized admin opens 7-day and 30-day views, switches ranges and refreshes. Check aggregates only, zero/empty states and safe errors. Do not send synthetic analytics requests directly or expose event/user identifiers or credentials.
16. **Labs/command palette:** confirm mock/local/planned labels in both languages. Verify command-palette local-save disclosure; do not mistake it for cloud persistence.

### Mobile and accessibility pass

At 375px, repeat signup/login, sidebar open/close, first task, Inbox processing, note editing, feedback and logout. At 768px and 1440px, inspect the same screens plus both admin screens. Repeat in light and dark themes, with long Ukrainian strings and 200% zoom.

- [ ] No overflowing/clipped text, broken buttons, horizontal page scroll or overlaps.
- [ ] Dialogs fit the viewport; content scrolls and actions remain reachable with the mobile keyboard open.
- [ ] Tab/Shift+Tab remain inside dialogs; Escape closes where appropriate; closing returns focus to the trigger.
- [ ] Buttons/fields have accessible names, visible focus and meaningful disabled/loading states.
- [ ] Sidebar/navigation works and indicates the current screen.
- [ ] EN/UA strings are correct; no translation keys/raw errors appear; user content is unchanged.
- [ ] Empty, loading, error and success states look intentional; retries do not double-submit.
- [ ] Screen-reader spot check announces dialog titles and feedback outcomes.

## Validation

Translation consistency: 3 checks pass (matching/nonempty/unique keys, matching placeholders, no Ukrainian text in English dictionary). Full suite: 74 tests pass. Typecheck and security guard pass. git diff --check passes. npm run build -- --webpack passes, including both admin routes. The initial build exposed a Card ref type mismatch; Card now accepts React 19 div props including ref, and the final typecheck/build pass. The existing Sentry global-error warning is non-fatal.

## Git plan

No commit or push was performed. The working tree already contains analytics, auth and migration-reconciliation changes from earlier work. Review/stage by hunk, especially i18n, Tasks and auth pages; do not mix those pre-existing changes accidentally into UI commits. Suggested audit grouping: (1) translations and locale/fallback UI with translation tests, (2) responsive/accessibility improvements, (3) this audit and smoke checklist. Use a focused beta-polish PR after the authenticated smoke pass; keep previous analytics/security work separately attributable.

## Files changed by this audit

Pre-existing analytics/auth/migration changes in the working tree are excluded from this list; several files contain changes from both tasks.

- src/lib/i18n.ts
- tests/i18n-consistency.test.mjs
- src/components/i18n/LocaleSwitcher.tsx
- src/components/ui/useDialogFocus.ts
- src/components/ui/Button.tsx
- src/components/ui/Card.tsx
- src/components/ui/ConfirmDialog.tsx
- src/components/ui/Page.tsx
- src/components/AppShell.tsx
- src/components/command-palette/CommandActionDialog.tsx
- src/components/feedback/FeedbackDialog.tsx
- src/components/timeline/TimelineEventCard.tsx
- src/app/ai-chat/page.tsx
- src/app/automation/page.tsx
- src/app/cars/page.tsx
- src/app/finance/page.tsx
- src/app/login/page.tsx
- src/app/register/page.tsx
- src/app/forgot-password/page.tsx
- src/app/reset-password/page.tsx
- src/app/help-center/page.tsx
- src/app/legal/privacy/page.tsx
- src/app/legal/terms/page.tsx
- src/app/notes/page.tsx
- src/app/tasks/page.tsx
- src/app/search/page.tsx
- src/app/timeline/page.tsx
- src/app/error.tsx
- src/app/not-found.tsx
- docs/testing/private-beta-readiness.md

## Final copy and visual polish follow-up

The second pass replaces abstract Dashboard onboarding ("one real capture", "capture something") with explicit steps and actions: "Add to Inbox" / "Додати у Вхідні", create a task or note, then open Today. More than 145 EN/UA copy pairs were revised across landing, auth, onboarding, Dashboard, Today, Inbox, Tasks, Notes, Search, Timeline, Settings, Help, admin and fallback screens. Search-generated status/priority text and related-item labels now use translations too. User-entered content is not translated.

Terminology refinements: Capture as an action = Add to Inbox / Додати у Вхідні; capture as a noun = Inbox item / запис у Вхідних. Feedback = Відгук (plural Відгуки); Done = Готово; Complete = Позначити як готове; Add = Додати; Due date = Термін виконання. Save / Зберегти and Create / Створити remain distinct. Timeline is Історія активності; Dashboard is Огляд.

Signup now checks the Supabase result. A returned session follows the existing AuthProvider redirect to the app. A new unconfirmed user redirects to Login with an account-created confirmation notice, prefilled email and empty password. An ambiguous/obfuscated account response uses neutral check-email/sign-in copy, without claiming a new account or sent email. Failures stay retryable. A completed signup cannot be submitted again from the same form.

The email handoff exists only in browser module memory, expires after five minutes, and is consumed once. It is never placed in a URL, browser storage, analytics payload or log; no password or session token enters the handoff. A full reload intentionally discards the notice/prefill. This is UI state, not a replacement auth/session mechanism.

Sidebar email gets a full-width ellipsis row and a native title for the signed-in user's own email; Settings shows the full address with wrapping. Task/note/search/activity titles and related items wrap instead of truncating. User content is not copied into tooltips. Note badges stack on mobile, badges have bounded width, command text wraps, and long card text breaks safely.

Additional automated regression coverage includes signup outcome classification, one-use/expiry/SSR handoff behavior, redirect/password clearing, repeat-submit prevention, failure retry and analytics privacy. Existing activity-copy assertions were updated without removing their behavior checks.

Local production preview: mobile Ukrainian landing and registration screenshots inspected; login/register EN/UA at 375/768/1440px had no document overflow (12 combinations). Preview used disabled Supabase/telemetry credentials; no real signup/email delivery was exercised. The running user development server was left untouched.

Before restarting manual smoke, verify the new signup success panel with a dedicated test account: account-created title, correct email, confirmation instructions, empty password and Login CTA. Confirm the email link and then sign in. Verify confirmation-disabled behavior only in a separate test environment; do not change production auth settings. Also inspect signed-in sidebar with a long email and Tasks/Notes/Search/Today with long Ukrainian titles, on touch devices and in both themes. These authenticated visual checks remain pending, not accepted as already polished by automated width tests.

Final follow-up validation: translation consistency PASS; typecheck PASS; full suite 80/80 PASS; security guard PASS; git diff --check PASS; Webpack production build PASS. Final changes were reviewed against the pre-pass diff; prior auth/analytics/migration work was preserved. No production changes, dependency installs, commits or pushes were performed.
