# Orvia Beta Feedback

## Purpose

Private beta users need a clear way to report bugs, suggest ideas, and explain
where the product feels confusing.

Feedback is now collected in-product for signed-in users. The implementation is
intentionally small: it stores feedback rows, but it does not include an admin
dashboard, email notifications, file uploads, anonymous/public feedback, or
support automation.

## Current Behavior

The AppShell sidebar/mobile drawer includes a Feedback entry. Settings also has
a feedback card with three actions:

- Send Feedback
- Report a Bug
- Suggest an Idea

All actions open the same in-product feedback dialog. Users choose a feedback
type, write a message, and submit it to `POST /api/feedback` with their current
Supabase access token.

## Data Model

Feedback is stored in `public.feedback`.

The table is user-owned:

- `user_id` references `auth.users(id)`
- authenticated users can insert their own feedback
- authenticated users can select their own feedback
- normal authenticated users cannot update or delete feedback
- anon has no table access
- service role can manage feedback for future internal review tooling

## Privacy Rules

Feedback messages are user-entered content.

Do not copy feedback messages into:

- Sentry events or breadcrumbs
- analytics events
- activity/timeline records
- console logs
- support metadata

The API returns only a safe acknowledgement shape: id, type, status, and
created time. It does not echo the submitted message back to the client.

Allowed feedback metadata is limited to small operational context such as route,
locale, theme, and source. Unknown or non-string metadata is ignored.

## Deferred

The following are intentionally not implemented yet:

- admin feedback review dashboard
- email or Slack notifications
- anonymous/public feedback
- attachments/screenshots
- moderation/spam controls
- feedback analytics
