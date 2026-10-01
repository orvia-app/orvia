# Disposable Calendar visual QA seed

This local script is for the October 1–4, 2026 Calendar visual review. It does not run with the app, add a UI, create schema, or use service-role credentials. It calls the existing authenticated Event and Task APIs. **Do not run it against a production-backed local server.** Check the local server's Supabase configuration and confirm it points to a disposable test project before using the seed flag.

## Before seeding

1. Run the app locally and sign in as the test user whose Calendar Maksym will review. Note the exact local origin (for example, `http://localhost:3001`) and that user's Supabase UUID.
2. Obtain that session's current Supabase **access token** from the local browser's developer tools. Keep it private; do not paste it into a command argument, chat, source file, or tracked file. Save it in a temporary file **outside the repository**, readable only by your OS user (`chmod 600`). The script reads it but never writes it to the manifest. The token's JWT subject must equal `--user-id`, and the API validates it with Supabase before any write.
3. Confirm the local server is connected to the intended disposable test database. `--confirm-test-backend` records this deliberate check; a localhost URL alone does not prove the database is nonproduction.

From the repository root, run (replace placeholders with the local origin, test-user UUID, and private token-file path):

```sh
node scripts/dev/calendar-visual-qa.mjs seed \
  --origin http://localhost:3001 \
  --user-id YOUR_TEST_USER_UUID \
  --token-file /private/tmp/orvia-calendar-qa-token \
  --confirm-test-backend
```

The script creates four Events and two Tasks through the normal APIs. Timed values are sent as UTC instants representing the requested Europe/Kyiv wall times; the all-day Event uses date-only bounds with an exclusive end date. The Task scheduling route sets `plannedStart`, `estimatedDurationMinutes`, and `planDay` after creation. The resulting IDs are saved in the local, Git-ignored `.calendar-visual-qa.seed` manifest. A second seed run stops while that manifest exists. If seeding fails partway through, keep the manifest and run cleanup; it contains IDs returned up to the failure.

| Type | Title | Europe/Kyiv time | Busy / duration |
| --- | --- | --- | --- |
| Event | Product sync | Oct 1, 09:30–10:15 | Busy |
| Event | Focus / optional | Oct 1, 13:00–14:00 | Free |
| Task | Finish onboarding flow | Oct 1, 10:30 | 45 min, plan day Oct 1 |
| Task | Review release checklist | Oct 2, 14:00 | 90 min, plan day Oct 2 |
| Event | Design review | All day Oct 2 | Busy |
| Event | Deep work block | Oct 3, 22:30–Oct 4, 00:30 | Busy |

## Cleanup

Use the **same origin and user ID**, with a current access token for that same user:

```sh
node scripts/dev/calendar-visual-qa.mjs cleanup \
  --origin http://localhost:3001 \
  --user-id YOUR_TEST_USER_UUID \
  --token-file /private/tmp/orvia-calendar-qa-token
```

Cleanup reads only IDs from the manifest, checks each available record's owner and title through the authenticated APIs, and calls the existing per-record DELETE routes. These are the product's soft-delete/lifecycle transitions: records leave the active Calendar, but this is **not** a physical database purge. Successful deletions are removed from the manifest one at a time, so cleanup can resume after an interruption; the manifest is deleted when all entries are handled. No table-wide delete is used. Remove the temporary token file when finished.

If a create request reaches the server but its response is lost before the returned ID can be saved, that record cannot be identified deterministically by this manifest. Stop and inspect that test user's records manually; do not use a broad delete or guess from a matching title. Do not delete the manifest until cleanup finishes.
