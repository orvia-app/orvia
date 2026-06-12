# Feedback Admin Inbox

## Purpose

The feedback admin inbox is an internal private-beta operations surface for
reviewing in-product feedback submitted by signed-in beta users.

It exists at:

- `/app/admin/feedback`

The v1 scope is intentionally small:

- list feedback newest first
- filter by feedback type
- update feedback status
- no comments
- no assignments
- no notifications
- no public or anonymous access

## Admin Workflow

1. Add beta operator emails to `ADMIN_EMAILS`.
2. Sign in with an allowlisted account.
3. Open `/app/admin/feedback` or the Admin -> Feedback sidebar item.
4. Review new feedback.
5. Change status to `Reviewed`, `Planned`, or `Closed`.

The page shows feedback fields needed for beta triage:

- date
- type
- status
- user id
- message

## Security Model

Admin access uses a server-side email allowlist.

Required environment variable:

```env
ADMIN_EMAILS=email1@example.com,email2@example.com
```

Rules:

- `/api/admin/feedback` requires a valid Supabase bearer token.
- `/api/admin/feedback/:id` requires a valid Supabase bearer token.
- The server derives the user identity from Supabase Auth.
- Client-provided roles, user IDs, or emails are not trusted.
- The authenticated user's email must match `ADMIN_EMAILS`.
- Normal users receive `403`.
- The admin API uses the server-only service-role client only after the
  allowlist check passes.
- The service-role key is never exposed to browser code.

Feedback messages are user-entered text. Do not copy feedback messages into:

- logs
- analytics
- activities
- monitoring metadata
- error messages

## Environment Variables

`ADMIN_EMAILS`

- server-only
- comma-separated
- exact email allowlist
- blank means no admin users

Example:

```env
ADMIN_EMAILS=founder@example.com,beta-ops@example.com
```

Do not use `NEXT_PUBLIC_ADMIN_EMAILS`.
