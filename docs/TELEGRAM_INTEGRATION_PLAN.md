# Archflow Telegram Integration Plan

## Purpose

Telegram is a future quick capture channel for Archflow. Users should be able to send a message to a bot and have it appear as an Inbox capture in Archflow.

This is not implemented yet.

## Why Backend/Auth Comes First

Telegram requires:
- server-side bot token storage
- webhook validation
- account linking between Telegram users and Archflow users
- rate limiting and abuse protection
- secure capture creation
- deletion/export behavior for imported messages

None of these should happen in frontend code.

## Token Rule

Never put a Telegram bot token in frontend code, browser storage, `NEXT_PUBLIC_*`, or committed files. The token belongs only in server-side environment variables.

## Webhook Vs Polling

Recommended MVP approach: webhook.

Why webhook:
- better fit for serverless deployments
- lower latency
- no long-running polling worker required
- easier to connect to request validation, rate limiting, and logging

Polling may be useful for local development or debugging, but should not be the production default.

## Recommended MVP Flow

Telegram message -> backend webhook -> validate Telegram user/account link -> create capture -> classify/enrich -> sync to app

Details:
1. Telegram sends an update to a server-side webhook.
2. Backend validates request source and bot secret configuration.
3. Backend maps Telegram user ID to an Archflow user account.
4. Backend creates a capture row for that user.
5. Deterministic capture pipeline classifies and enriches the capture.
6. The app receives it through normal repository/sync behavior.

## User Linking Strategy

Initial linking direction:
- user signs into Archflow
- user opens Telegram linking flow from Settings or Integrations
- backend creates a short-lived linking code
- user sends the code to the Telegram bot
- backend verifies code and stores Telegram account mapping server-side

Do not trust Telegram display names or usernames as identity. Use Telegram user ID plus verified linking.

## Security Risks

- Bot token leakage.
- Spoofed or replayed webhook requests.
- Incorrect account linking.
- Spam or message flooding.
- Sensitive data captured unintentionally.
- Deleted Archflow account leaving Telegram mappings behind.
- Logs retaining message content unnecessarily.

## Rate Limiting And Abuse

Future implementation should include:
- per-Telegram-user rate limits
- per-Archflow-account rate limits
- message length limits
- attachment limits before file support exists
- blocked account handling
- operational logging without excessive message content

## Phased Roadmap

### Phase A: Backend/Auth Ready

- Supabase/Auth is live.
- User ownership and RLS exist.
- Capture table exists.
- Local-to-cloud migration direction is settled.

### Phase B: Bot Token In Server Env

- Add `TELEGRAM_BOT_TOKEN` server-only environment variable.
- Keep token out of frontend and repo.
- Document rotation process.

### Phase C: Webhook Endpoint

- Add server-side webhook route.
- Validate payload shape.
- Keep logs minimal and redacted.

### Phase D: Account Linking

- Add linking code generation.
- Store Telegram user mapping server-side.
- Add unlink behavior.

### Phase E: Capture Creation

- Convert messages into captures.
- Run deterministic classification/enrichment.
- Persist under the linked Archflow user.

### Phase F: Error Handling And Logging

- Handle unlinked users.
- Handle invalid messages.
- Add retry-safe behavior.
- Add operational metrics without storing unnecessary personal content.

### Phase G: Production Hardening

- Add rate limits.
- Review webhook security.
- Add account deletion cleanup.
- Add export/delete coverage for Telegram-origin captures.
- Add monitoring and incident response path.
