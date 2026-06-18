# Orvia Beta Smoke Checklist

Use this checklist before inviting the first private beta users. The goal is to
prove that the production-like build is understandable, stable, privacy-safe,
and operationally supportable for a small external beta group.

Record the tester, date, environment, browser, device, and build/deployment URL
before starting.

## 1. Environment Pre-Check

### Production Surface

- [ ] Production domain opens: `https://useorvia.com`
- [ ] `https://www.useorvia.com` redirects to `https://useorvia.com`
- [ ] `/` renders the public landing page
- [ ] `/landing` still renders the public landing page
- [ ] `/app` requires sign-in for anonymous users
- [ ] Public pages stay public:
  - [ ] `/login`
  - [ ] `/register`
  - [ ] `/forgot-password`
  - [ ] `/reset-password`
  - [ ] `/help-center`
  - [ ] `/legal/privacy`
  - [ ] `/legal/terms`

### Vercel

- [ ] Production deployment is from the intended commit/branch
- [ ] Preview deployment, if used, is from the intended PR branch
- [ ] Production environment variables are present where required
- [ ] Preview environment variables are preview-safe and not copied blindly from production
- [ ] Build command matches the repository default
- [ ] No real secrets appear in build logs
- [ ] No unexpected warnings or failed functions appear in Vercel deployment logs

### Supabase

- [ ] Supabase project is reachable
- [ ] Auth is healthy
- [ ] Database is reachable
- [ ] Latest required migrations have been applied
- [ ] `public.tasks`, `public.notes`, `public.captures`, `public.activities`, and `public.feedback` exist
- [ ] RLS is enabled on user-owned tables
- [ ] Authenticated grants exist for runtime ownership verification tables
- [ ] No unauthenticated service-role test route exists

### Email

- [ ] Signup confirmation email is delivered
- [ ] Password reset email is delivered
- [ ] Sender/domain is correct for private beta
- [ ] Email links open the expected Orvia routes
- [ ] Expired or reused reset links fail safely

### Monitoring

- [ ] `NEXT_PUBLIC_SENTRY_DSN` missing or blank disables Sentry without app errors
- [ ] If `NEXT_PUBLIC_SENTRY_DSN` is configured, Sentry receives test errors only after redaction
- [ ] Session Replay is disabled
- [ ] tracing/performance monitoring is disabled
- [ ] profiling is disabled
- [ ] source-map upload is disabled unless explicitly approved in a later PR

## 2. Landing

### Desktop

- [ ] Landing loads with no console errors
- [ ] Header layout is stable
- [ ] Sign in link opens `/login`
- [ ] Create account / private beta CTA opens `/register`
- [ ] Demo/preview CTA scrolls to the intended section
- [ ] Footer links work:
  - [ ] Terms
  - [ ] Privacy
  - [ ] Help Center
  - [ ] Sign in
  - [ ] Create account

### Mobile

Test at 320px, 360px, 375px, 390px, and 414px widths.

- [ ] No horizontal scroll
- [ ] Header controls stay visible
- [ ] Theme switcher is visible
- [ ] Language switcher is visible
- [ ] Sign in text does not wrap awkwardly
- [ ] Create account CTA does not wrap
- [ ] Hero CTAs are not oversized
- [ ] Product preview cards do not overlap

### Language And Theme

- [ ] English landing copy is complete
- [ ] Ukrainian landing copy is complete
- [ ] Switching language persists after reload
- [ ] Light theme works
- [ ] Dark theme works
- [ ] Theme switch persists after reload

## 3. Auth

### Signup

- [ ] New user can open `/register`
- [ ] Existing signed-in user on `/register` redirects to `/app`
- [ ] Signup with valid email/password succeeds
- [ ] Signup with invalid password shows a useful error
- [ ] Signup does not reveal sensitive internal errors
- [ ] Signup completion state is clear

### Email Confirmation

- [ ] Confirmation link opens correctly
- [ ] Confirmed user can reach `/app`
- [ ] Already signed-in confirmed user is not stranded on landing/login
- [ ] Invalid confirmation link fails safely

### Login

- [ ] User can open `/login`
- [ ] Existing signed-in user on `/login` redirects to `/app`
- [ ] Valid credentials log in and redirect to `/app`
- [ ] Wrong credentials show a safe error
- [ ] Login does not log email/password/session data

### Logout

- [ ] Logout clears Supabase session
- [ ] Logout clears AuthProvider user/session state
- [ ] Logout does not clear Orvia local workspace data
- [ ] Clicking Sign in after logout opens `/login`
- [ ] Refreshing `/login` after logout stays on `/login`

### Password Recovery

- [ ] `/forgot-password` opens without auth
- [ ] Forgot password accepts email
- [ ] Forgot password shows a safe success message regardless of whether the email exists
- [ ] `/reset-password` opens from recovery link
- [ ] New password validates minimum length
- [ ] Password update succeeds
- [ ] User can log in with new password

### Stale Session Recovery

- [ ] Corrupt Supabase auth storage with broken access/refresh token
- [ ] Open `/app`
- [ ] App does not show a Next.js red overlay
- [ ] User lands on `/login` or signed-out state
- [ ] Supabase auth storage is cleaned or ignored
- [ ] Normal login works after cleanup

## 4. Core App

### Dashboard

- [ ] `/app` loads for signed-in user
- [ ] Empty new-user guidance appears for a truly empty account
- [ ] Guidance does not appear for an account with tasks, notes, or captures
- [ ] Daily focus content loads without a jarring blank state
- [ ] Quick Capture is visible and usable
- [ ] Recent activity does not show fake/generated data

### Today

- [ ] `/app/today` loads
- [ ] Empty state is understandable
- [ ] Top priority appears when actionable tasks exist
- [ ] Focus Queue ordering is deterministic and understandable
- [ ] Score/debug numbers are not visible
- [ ] Inbox waiting count is accurate
- [ ] Recent changes show real activity only

### Inbox And Capture

- [ ] Quick Capture opens from AppShell
- [ ] Capture copy explains that items go to Inbox
- [ ] Signed-in capture writes to cloud first
- [ ] Signed-out capture is clearly device-only
- [ ] Capture success closes popup and shows temporary success notification
- [ ] New capture appears in Inbox without full page refresh
- [ ] Inbox explains that captures are processed into tasks or notes
- [ ] Convert to Task shows loader only on the Task action
- [ ] Convert to Note shows loader only on the Note action
- [ ] Cloud capture processing updates capture status instead of deleting local-only data

### Tasks

- [ ] `/app/tasks` loads
- [ ] Create task works
- [ ] Task title is required
- [ ] Task status dropdown works:
  - [ ] Todo
  - [ ] Progress
  - [ ] Done
- [ ] Setting status to Done records/completes the task as expected
- [ ] Edit task works if edit UI is present
- [ ] Delete task opens confirmation
- [ ] Delete task removes/hides the item according to cloud/local mode
- [ ] Signed-in cloud failure fallback is visibly device-only
- [ ] No `user_id` is sent from the UI

### Notes

- [ ] `/app/notes` loads
- [ ] Create note works
- [ ] Edit note title/content/type works
- [ ] Delete note opens confirmation
- [ ] Delete note removes/hides the item according to cloud/local mode
- [ ] Signed-in cloud failure fallback is visibly device-only
- [ ] No `user_id` is sent from the UI

### Search

- [ ] `/app/search` loads
- [ ] Search returns tasks
- [ ] Search returns notes
- [ ] Search returns captures
- [ ] Search returns activity when authenticated
- [ ] Empty state is useful
- [ ] Source labels do not imply local data is cloud data
- [ ] Search query is not sent to analytics, Sentry, or logs
- [ ] Result links navigate to valid app routes

### Timeline

- [ ] `/app/timeline` loads
- [ ] Signed-out users do not call the activities API
- [ ] Timeline uses real activities only
- [ ] New task activity appears
- [ ] Task completion activity appears
- [ ] New note activity appears
- [ ] Quick capture activity appears
- [ ] Inbox processed activity appears
- [ ] Unknown future activity types render safely
- [ ] Ukrainian locale renders known activity text in Ukrainian
- [ ] Activity titles/descriptions do not contain raw user content

### Settings

- [ ] `/app/settings` loads
- [ ] Profile section shows signed-in email when available
- [ ] Language switch works and persists
- [ ] Theme switch works and persists
- [ ] Backup download works
- [ ] Restore is clearly marked unavailable if not implemented
- [ ] Reset local data requires confirmation
- [ ] Reset local data clears Orvia browser-local state only
- [ ] Local-to-cloud import is manual and does not delete local data
- [ ] Integrations are clearly coming soon, not active
- [ ] Billing is clearly not active during private beta
- [ ] Feedback actions open the feedback dialog
- [ ] Help/legal links open public pages

## 5. Feedback

### User Feedback

- [ ] Feedback entry is visible in AppShell/sidebar
- [ ] Feedback entry is usable on mobile drawer
- [ ] Settings feedback card is visible
- [ ] Feedback dialog opens
- [ ] Type selector works:
  - [ ] General
  - [ ] Bug
  - [ ] Idea
  - [ ] Confusing
  - [ ] Missing feature
- [ ] Message is required
- [ ] Submit succeeds for signed-in user
- [ ] Success state stays visible until dialog close
- [ ] Success copy is correct in English
- [ ] Success copy is correct in Ukrainian
- [ ] Feedback message is not echoed in API response
- [ ] Feedback message is not written to activity/timeline
- [ ] Feedback message is not logged

### Admin Inbox

- [ ] Admin email is present in `ADMIN_EMAILS`
- [ ] Admin can open `/app/admin/feedback`
- [ ] Admin sees feedback newest first
- [ ] Admin can filter by type
- [ ] Admin can update status:
  - [ ] New
  - [ ] Reviewed
  - [ ] Planned
  - [ ] Closed
- [ ] Status update persists after reload
- [ ] Non-admin cannot access admin API
- [ ] Non-admin opening `/app/admin/feedback` sees only access denied or redirect
- [ ] Non-admin never sees filters/table/admin shell
- [ ] Service-role key is not exposed to the browser

## 6. Security And Privacy

### Automated Security Checks

- [ ] `npm run security:guard` passes
- [ ] `npm run verify:rls` passes
- [ ] `npm run verify:ownership:runtime` passes against the target Supabase project

### User Isolation

- [ ] User A creates task/note/capture/activity
- [ ] User B does not see User A data
- [ ] User B cannot update User A task/note/capture
- [ ] User B cannot delete User A task/note/capture
- [ ] Search for User B does not include User A data
- [ ] Today for User B does not include User A data
- [ ] Command Palette for User B does not include User A data
- [ ] Reset local data fully clears local cache before retesting isolation

### Frontend Secret Checks

- [ ] No service-role key in browser bundle
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` usage in client components
- [ ] No `ADMIN_EMAILS` usage in client components
- [ ] No `NEXT_PUBLIC_ADMIN_EMAILS`
- [ ] No access tokens, refresh tokens, or sessions in console logs
- [ ] No feedback messages, task text, note text, capture text, or search queries in logs

### Sentry Redaction

- [ ] Authorization headers are removed
- [ ] Cookies and `set-cookie` are removed
- [ ] `access_token` and `refresh_token` are removed
- [ ] Supabase session-like objects are removed
- [ ] Email and password fields are removed
- [ ] Request and response bodies are removed
- [ ] Task, note, capture, and search content is removed
- [ ] Safe operational fields remain useful
- [ ] Breadcrumbs containing sensitive terms are dropped

## 7. Mobile

Test at minimum on iPhone-size width around 390px and one Android/Chrome-size
width if available.

- [ ] App drawer opens
- [ ] App drawer closes on route click
- [ ] App drawer closes on Escape
- [ ] App drawer closes on backdrop click
- [ ] Language switcher is reachable
- [ ] Theme switcher is reachable
- [ ] Capture button is visible and does not overlap important controls
- [ ] Feedback entry is reachable
- [ ] Task creation form works with keyboard open
- [ ] Note creation/edit form works with keyboard open
- [ ] Capture form works with keyboard open
- [ ] Feedback form works with keyboard open
- [ ] Dialogs fit viewport
- [ ] No horizontal scroll
- [ ] Bottom safe-area spacing is acceptable

## 8. Commands

Run before inviting beta users:

```bash
npm run typecheck
npm run build
npm run test
npm run security:guard
npm run verify:rls
npm run verify:ownership:runtime
git diff --check
```

Record command output summaries:

| Command | Result | Notes |
| --- | --- | --- |
| `npm run typecheck` |  |  |
| `npm run build` |  |  |
| `npm run test` |  |  |
| `npm run security:guard` |  |  |
| `npm run verify:rls` |  |  |
| `npm run verify:ownership:runtime` |  |  |
| `git diff --check` |  |  |

## 9. Bug Template

Use this template for every issue found during smoke testing.

```text
Area:
Device / browser:
Environment / URL:
Account type: signed-out / normal user / admin
Locale:
Theme:

Steps:
1.
2.
3.

Actual:

Expected:

Severity: blocker / major / minor

Screenshot / recording:

Decision: fix before beta / accept for beta / defer
Owner:
```

## 10. Go / No-Go Criteria

### Blockers

Private beta is **No-Go** if any blocker is open:

- Auth signup/login/logout/password reset is broken
- Signed-out users can access protected app data
- User A can see, search, update, or delete User B data
- Runtime ownership verification fails
- Service-role key or admin allowlist leaks to frontend
- Feedback admin is visible to non-admin users
- Sentry sends tokens, cookies, sessions, emails, request bodies, response
  bodies, or user-authored content
- Core loop cannot be completed: Capture -> Inbox -> Task/Note -> Today
- Production build fails
- Production domain is unavailable

### Majors

Private beta should wait unless the founder explicitly accepts the risk:

- Email confirmation or password reset is unreliable
- Quick Capture works only after refresh
- Timeline does not show core activity events
- Search misses newly created task/note/capture data
- Mobile navigation blocks core flows
- Settings reset/import copy creates data-loss confusion
- Feedback submission fails
- Admin cannot triage feedback
- Ukrainian or English core UI is visibly mixed in beta-critical flows

### Minors

Private beta may proceed with documented minor issues:

- Cosmetic spacing issues that do not block task completion
- Non-critical Labs pages are rough or marked experimental
- Restore backup remains coming soon
- Full cloud account export/account deletion is not implemented but clearly
  marked coming later
- Analytics funnel is local-only or incomplete, as long as privacy boundaries
  are clear

### Go Decision

Go only when:

- [ ] All blockers are closed
- [ ] Any accepted majors are documented with owner and follow-up date
- [ ] Beta tester support path is ready
- [ ] Rollback plan is known
- [ ] Founder/owner signs off on the build and checklist result
