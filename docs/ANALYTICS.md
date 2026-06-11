# Orvia Analytics Plan

## Status

Product analytics is not connected yet.

The current repository includes only a typed event taxonomy, a safe metadata
schema, and a no-op tracking helper. No PostHog, Vercel Analytics, or custom
analytics backend is installed. No product analytics events are sent anywhere.

Sentry is available only as DSN-gated error monitoring. It is not product
analytics, and it must not be used to track activation, funnels, or retention.

## Goals

Private beta analytics should answer:

- how many users reach the app
- how many users sign up and return
- whether users complete the core loop
- where users drop off
- where users see failures

Analytics must not become a shadow store of user content.

## Event Taxonomy

Current beta-critical event names:

- `landing_viewed`
- `signup_started`
- `signup_completed`
- `login_completed`
- `quick_capture_created`
- `inbox_opened`
- `capture_processed_to_task`
- `capture_processed_to_note`
- `task_created`
- `task_completed`
- `note_created`
- `today_opened`
- `search_used`
- `timeline_opened`
- `feedback_clicked`
- `error_seen`

## Safe Metadata

Only the following metadata keys are allowed:

- `route`
- `locale`
- `theme`
- `auth_state`
- `storage_mode`
- `source`
- `result_count_bucket`
- `capture_count_bucket`
- `task_count_bucket`
- `activity_count_bucket`
- `priority`
- `status`
- `note_type`
- `has_due_date`
- `has_top_priority`
- `area`
- `operation`
- `safe_error_code`

Safe metadata should be categorical, boolean, or bucketed. Prefer values such as
`signed_in`, `account`, `1-5`, `tasks`, or `api_500` over raw user or system
payloads.

## Banned Data

Never send analytics metadata containing:

- task titles
- note titles
- note content
- capture content
- search queries
- emails
- passwords
- access tokens
- refresh tokens
- Supabase sessions
- Authorization headers
- raw API responses
- raw error objects
- full user objects

## Activation Funnel

The first activation funnel is:

1. `landing_viewed`
2. `signup_started`
3. `signup_completed`
4. `login_completed`
5. `quick_capture_created`
6. `inbox_opened`
7. `capture_processed_to_task`
8. `task_created`
9. `today_opened`
10. `task_completed`

`capture_processed_to_note` and `note_created` are supporting activation events,
but the primary beta loop should prove that a capture can become an actionable
task.

## Retention Definitions

Active user:
A signed-in user who performs at least one meaningful product action in a day,
such as creating a capture, processing a capture, creating a note, completing a
task, opening Today, or using Search.

Activated user:
A user who signs up, creates a capture, processes it into a task or note, and
opens Today or Search.

Retained user:
An activated user who returns on a later day and performs a meaningful product
action.

Day 1 retention:
An activated or signed-up user performs a meaningful product action one calendar
day after signup or activation.

Day 7 retention:
An activated or signed-up user performs a meaningful product action around day 7
after signup or activation. For private beta, a day 6-8 window is acceptable.

## Current Helper

`src/lib/analytics.ts` exports:

- `analyticsEventNames`
- `analyticsMetadataKeys`
- `isAnalyticsEventName`
- `sanitizeAnalyticsMetadata`
- `trackEvent`

`trackEvent` is intentionally no-op today. It must never throw and must not make
network requests. Future providers should be connected behind this helper rather
than directly inside product components.

## Future PostHog Plan

Recommended private beta approach:

- add PostHog behind environment flags
- use explicit allowlisted events only
- disable autocapture initially
- disable session replay initially
- identify users by internal user ID only, not email
- keep user-created content out of event metadata
- update privacy policy before enabling real tracking

PostHog should be used for funnels, cohorts, activation, and retention.

## Sentry Error Monitoring

Sentry is configured as a minimal private-beta monitoring foundation when
`NEXT_PUBLIC_SENTRY_DSN` is present. If the DSN is missing, Sentry remains
disabled.

Track:

- JavaScript runtime errors
- unhandled promise rejections
- API failures
- auth failures
- Supabase failures
- task, note, capture, and activity failures

Private beta defaults:

- Session Replay disabled.
- tracing and performance monitoring disabled.
- profiling disabled.
- source-map upload disabled.
- default PII disabled.
- Sentry user identity is Supabase `user.id` only, never email.
- events and breadcrumbs pass through strict redaction before send.

Sentry configuration must redact sensitive data and avoid collecting request
bodies, response bodies, auth headers, cookies, tokens, sessions, emails, raw
Supabase session/user objects, raw errors, task titles/descriptions, note
titles/content, capture content, searchable text, or search queries.

## Review Checklist

Before adding or wiring a new event:

- confirm the event name is in the taxonomy
- confirm metadata uses only allowed keys
- confirm metadata contains no user-entered content
- confirm the event is useful for activation, retention, or reliability
- confirm analytics is disabled when provider env vars are missing
