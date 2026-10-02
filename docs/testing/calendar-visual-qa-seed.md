# Calendar visual QA fixture

The rich Calendar fixture is a development-only, in-memory schedule projection for visual review around Friday, October 2, 2026. It does not create database records, add schema, weaken authentication, or run in production builds. Production builds replace the development module with a fail-closed guard so the fixture data is not emitted. It uses the same `ScheduleProjectionResult`, Event, planned Task, overlap, timezone, and Calendar rendering contracts as the normal schedule API.

## Activate the visual fixture

1. Run the app locally on port 3001 and sign in with a local test account.
2. Open:

```text
http://localhost:3001/app/calendar?calendarQa=rich
```

The normal application auth gate remains active. In development, the query selects the in-memory fixture for the authenticated user's Calendar. It fixes the QA date to October 2, the planning timezone to `Europe/Kyiv`, and the current-time reference to 14:15 Kyiv so screenshots remain deterministic. Removing the query returns to normal authenticated API data.

Fixture records are defined once in `scripts/dev/calendar-visual-qa-data.mjs`. `src/dev/calendar-visual-qa-fixture.ts` validates and projects them through the existing schedule domain.

## Fixture records

| Day | Type | Title | Europe/Kyiv time | Workspace | State |
| --- | --- | --- | --- | --- | --- |
| Mon Sep 28 | Event | Design sync | 09:00–10:00 | Work | Busy |
| Mon Sep 28 | Event | Prepare release | 11:30–12:30 | Work | Busy |
| Mon Sep 28 | Event | Build prototype | 14:00–15:30 | Work | Busy |
| Mon Sep 28 | Event | Gym | 17:00–18:00 | Personal | Busy |
| Tue Sep 29 | Event | Focus time | 09:30–11:00 | Work | Free |
| Tue Sep 29 | Event | Lunch | 12:00–13:00 | Personal | Busy |
| Tue Sep 29 | Event | Dinner with friends | 18:00–19:30 | Personal | Busy |
| Wed Sep 30 | Event | Customer interview | 10:00–11:00 | Work | Busy |
| Wed Sep 30 | Event | Design review | 11:30–13:00 | Work | Busy |
| Wed Sep 30 | Event | Deep work | 14:00–17:00 | Side Project | Busy |
| Thu Oct 1 | Event | Kyiv Tech Meetup | All day | Personal | Busy |
| Thu Oct 1 | Event | Product planning | 09:00–10:30 | Work | Busy |
| Thu Oct 1 | Event | Cross-team review | 11:00–12:00 | Work | Busy |
| Fri Oct 2 | Event | Team planning | 09:00–10:00 | Work | Busy |
| Fri Oct 2 | Event | Write docs | 11:00–12:00 | Work | Busy |
| Fri Oct 2 | Event | Product sync | 12:30–13:30 | Work | Busy |
| Fri Oct 2 | Task | Review analytics | 13:30–14:15 | Work | Planned, 45m |
| Fri Oct 2 | Event | Deep work | 14:15–15:30 | Side Project | Busy, overlap fixture |
| Fri Oct 2 | Event | Marketing sync | 14:30–15:30 | Work | Busy, overlap fixture |
| Fri Oct 2 | Task | Finish landing copy | 15:30–16:30 | Side Project | Planned, 60m |
| Fri Oct 2 | Event | Call with parents | 16:00–17:00 | Personal | Busy |
| Fri Oct 2 | Event | Plan next week | 17:00–18:00 | Side Project | Busy |
| Fri Oct 2–Sat Oct 3 | Event | Release monitoring | 22:30–00:30 | Work | Busy, one cross-midnight interval |
| Sat Oct 3 | Event | Call with parents | 10:00–11:00 | Personal | Busy |
| Sat Oct 3 | Event | Side Project review | 14:00–15:30 | Side Project | Busy |
| Sun Oct 4 | Event | Family day | 11:00–15:00 | Personal | Busy |

The second Friday Deep work block is intentional: together with Marketing sync it exercises Event-to-Event overlap placement while the Wednesday block exercises the requested long-duration treatment.

## Optional authenticated API seed and cleanup

`scripts/dev/calendar-visual-qa.mjs` remains available for disposable test-database checks. Do not run it against a production-backed server. The Event API intentionally does not accept client-selected workspace identity, so this API mode is not the authoritative workspace-identity visual fixture.

Before using API mode, confirm the local server points to a disposable test database, save the signed-in test user's access token outside the repository in a mode-600 file, and use that token's exact user UUID:

```sh
node scripts/dev/calendar-visual-qa.mjs seed \
  --origin http://localhost:3001 \
  --user-id YOUR_TEST_USER_UUID \
  --token-file /private/tmp/orvia-calendar-qa-token \
  --confirm-test-backend
```

The script sends only fields accepted by the existing Event and Task APIs. It writes returned IDs to the Git-ignored `.calendar-visual-qa.seed` manifest and refuses another seed while that manifest exists.

Cleanup uses only those recorded IDs and the same authenticated owner boundary:

```sh
node scripts/dev/calendar-visual-qa.mjs cleanup \
  --origin http://localhost:3001 \
  --user-id YOUR_TEST_USER_UUID \
  --token-file /private/tmp/orvia-calendar-qa-token
```

Cleanup checks owner and title before each per-record lifecycle deletion. It never uses a table-wide delete. If a create response is lost before its returned ID reaches the manifest, stop and inspect that test user's records manually rather than guessing or broad-deleting.
