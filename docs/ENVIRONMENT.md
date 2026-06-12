# Orvia Environment Strategy

## Current State

Orvia currently has no backend, production AI provider, authentication provider, payment provider, or server-side secret usage.

Environment documentation exists now so future backend, AI, auth, sync, and payments work can start with safe defaults.

Environment access is centralized in:
- `src/env/server.ts` for server-only and public variables.
- `src/env/client.ts` for browser-safe `NEXT_PUBLIC_*` variables only.

Do not read `process.env` outside these modules. Future backend code should import typed env helpers instead of accessing runtime variables directly.

## Local Environment Files

Use local `.env` files only for developer-specific configuration. These files must stay untracked:

- `.env`
- `.env.local`
- `.env.development.local`
- `.env.production.local`
- any `.env.*` file except `.env.example`

Commit only `.env.example` with blank placeholders and comments. Never commit real keys, tokens, webhook secrets, database URLs, or service-role credentials.

## Vercel Environment Variables

Future deployed environments should store secrets in Vercel project settings, separated by environment:

- Development
- Preview
- Production

Production secrets should not be copied into preview or local environments unless explicitly required and approved. Rotate any secret that may have been exposed in logs, screenshots, commits, or client bundles.

Future Vercel preview deployments should use preview-scoped variables and test providers where possible. Production variables should be limited to production deployments from reviewed main-branch changes.

Access to production variables should be limited to trusted maintainers. Teammates should receive the minimum environment access needed for their role.

## Server-Only Secrets

Secrets must be read only by server-side code such as API routes, server actions, background jobs, or backend services.

Examples of server-only secrets:

- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- integration refresh tokens
- private webhook signing secrets

Do not expose server-only secrets to React components, client hooks, browser storage, bundled JavaScript, or `NEXT_PUBLIC_*` variables.

## Public Variables

Next.js exposes variables prefixed with `NEXT_PUBLIC_` to browser JavaScript. Treat `NEXT_PUBLIC_*` as public information.

Allowed uses:

- public app URLs
- public analytics IDs after privacy review
- public Supabase anon key if protected by Row Level Security
- non-sensitive feature flags

Never put API keys, service-role keys, Stripe secrets, OpenAI keys, integration tokens, or private webhook secrets in `NEXT_PUBLIC_*`.

## Sentry Error Monitoring

Minimal Sentry error monitoring is controlled by:

- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`
- `SENTRY_ENVIRONMENT` for an optional server-side environment override

Sentry is disabled when `NEXT_PUBLIC_SENTRY_DSN` is blank. The DSN is browser
visible and must be treated as public configuration, not a secret.

For the private beta foundation:
- Session Replay is disabled.
- tracing and performance monitoring are disabled.
- profiling is disabled.
- source-map upload is disabled.
- Sentry user context is Supabase `user.id` only.
- emails, tokens, cookies, sessions, request bodies, response bodies, task text,
  note text, capture text, and search queries must not be sent.

## Future OpenAI Handling

OpenAI or other AI provider keys must be server-side only.

Future AI calls should go through a backend route or server action that enforces authentication, authorization, rate limits, input validation, data minimization, logging policy, and source reference handling.

## Future Supabase Handling

Expected future variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The anon key may be browser-visible only after Row Level Security is configured and reviewed. The service-role key must remain server-only and must not be used in normal user request paths unless strictly scoped.

## Admin Allowlist

Internal beta admin access is controlled by:

- `ADMIN_EMAILS`

`ADMIN_EMAILS` is server-only and contains a comma-separated list of exact email
addresses allowed to access internal admin routes such as
`/app/admin/feedback` and `/api/admin/feedback`.

Do not create `NEXT_PUBLIC_ADMIN_EMAILS`. Admin checks must happen server-side
after Supabase Auth validates the bearer token.

Current Supabase preparation files:
- `src/server/supabase/*`: server-side config readiness and typed factory seams.
- `src/lib/supabase/*`: browser-safe public config readiness and typed factory seams.

These files do not install Supabase, open network connections, query data, or replace local-first repositories. They exist so a future `@supabase/supabase-js` installation can be introduced intentionally behind typed boundaries.

## Future Stripe Handling

Expected future variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Stripe secret and webhook variables must stay server-side. The app must not store card data. Billing state should come from verified server-side Stripe events, not client-provided values.

## Example Template

Use `.env.example` as a placeholder template only. Leave values blank in the repository.

## Production Safety Checklist

Before connecting production services:
- keep main deployable
- require local build before push
- add protected main branch and required checks before teammates join
- validate Vercel preview deployments before production merges
- verify that no server-only secret appears in client bundles, browser logs, or committed files
