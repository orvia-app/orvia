# Browser session recovery

## Root cause and implementation

Supabase auth-js 2.106.2 logs stale refresh errors inside `_recoverAndRefresh`
(initialization and tab visibility) and `_emitInitialSession` (including the
Supabase client's own listener). Those paths can consume the error and return
an empty session before Orvia's existing loader sees it. `skipAutoInitialize`
alone does not prevent the internal listener from reading storage.

`scripts/patch-supabase-auth.mjs` runs at postinstall. It changes only logging
for expected session failures in those paths, using the classifier generated
from `src/lib/supabase/auth-errors.ts`. It preserves SDK refresh, locks,
broadcasting, storage removal, callbacks and unexpected error logging. There
is no global console interception in production. The script checks the SDK
version and patch boundaries and updates source plus CommonJS/ESM artifacts.
Run `npm run postinstall` after pulling this change into an existing install,
then restart Next.js. New installs apply it automatically. TypeScript dev
build dependencies must be installed before postinstall (as for Next builds).
SDK upgrades require reviewing/removing the patch and rerunning the real-SDK
regression tests. Do not bypass an installation failure caused by that check.

The existing loader coalesces concurrent requests and finishes companion-key
cleanup when SDK initialization drops a stored session. Cleanup is limited to
this project's exact auth key, `-code-verifier`, and `-user`. An unscoped legacy
`supabase.auth.token` key and arbitrary similarly prefixed keys are preserved.
Login relies on the provider for initial loading and successful-login redirect.
Logout no longer reads a session back after a successful sign-out.

## Manual smoke checklist

Use a disposable beta account on localhost. Start `npm run dev`, open Chrome
DevTools Console and Network (Preserve log), and Application > Local Storage >
the localhost origin. Do not copy real tokens into reports or screenshots.
These checks have not been automated against a live Supabase account.

### A. Stale-token reproduction and recovery

1. Log in normally. In Application > Local Storage, add
   `orvia-auth-smoke-sentinel` with value `keep`.
2. Find `sb-<configured-project-ref>-auth-token`. Edit its JSON in the storage
   editor: set `refresh_token` to `orvia-stale-test` and `expires_at` to `1`.
   Keep the other fields intact. This invalidates only this browser test session.
3. Hard-refresh `/`. Expect signed-out landing navigation, no red overlay and
   no stale-token console error. A rejected refresh request in Network is normal.
4. Verify the project auth key and its SDK companion keys are absent; verify
   the sentinel, theme and app data remain. Refresh twice; there must be no
   repeated refresh-token requests for the removed session.
5. Repeat steps 1–2 separately before loading `/login`, `/register` and `/app`.
   Login/register remain usable; `/app` redirects to `/login` without showing
   protected content or leaving a loading spinner stuck.
6. Repeat with malformed auth JSON (`{broken`). Expect local cleanup without
   a refresh request. Also test stale storage followed by switching away from
   and back to the tab, to exercise SDK visibility recovery.

### B. Normal login

1. Open `/login`, enter valid beta credentials and submit once.
2. Expect `/app`, correct account identity and no repeated redirects.
3. Try incorrect credentials after logging out: expect the normal form error,
   no protected content. Check `/register` still shows its normal result/error.

### C. Refresh while logged in

1. Log in, refresh `/app` several times, then switch tabs and return.
2. Expect the same account, retained app data and a loading state that resolves.
3. Leave the session active across its token expiry; verify SDK refresh succeeds
   and the account remains signed in. Repeat with two tabs open.

### D. Logout

1. Sign out using the account menu. Expect signed-out UI and protected-route exit.
2. Refresh and reopen `/login`; remain signed out. The old session must not return.
3. Check another open tab updates to signed out. Verify the sentinel remains.

### E. Protected route while logged out

1. Paste `/app` directly into the address bar while signed out.
2. Expect `/login`, no protected content, no redirect loop or stuck spinner.
3. Refresh `/login` and use Back; protected content must remain unavailable.

### F. Incognito clean session

1. Open a fresh Incognito window and visit `/`, `/login`, `/register`, then `/app`.
2. Public pages work and `/app` requires login; no refresh-token request is needed.
3. Log in, refresh, log out and refresh again. Expect the same behavior as B–E.
4. Remove the sentinel from the regular test window when finished.

## Remaining limits

Unexpected SDK failures still use upstream logging; app-owned diagnostics omit
raw messages and tokens. A rejected refresh HTTP request remains visible in
DevTools Network. Network outages are not classified as stale sessions. Browser
storage denial and offline logout can prevent persistence/revocation guarantees;
local cleanup is best effort, and failed remote logout remains an error. The
client's session is for UI state only: server `getUser()` validation and existing
route/API authorization remain authoritative and unchanged.
