# Archflow Environment Strategy

## Current State

Archflow currently has no backend, production AI provider, authentication provider, payment provider, or server-side secret usage.

Environment documentation exists now so future backend, AI, auth, sync, and payments work can start with safe defaults.

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

## Future OpenAI Handling

OpenAI or other AI provider keys must be server-side only.

Future AI calls should go through a backend route or server action that enforces authentication, authorization, rate limits, input validation, data minimization, logging policy, and source reference handling.

## Future Supabase Handling

Expected future variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The anon key may be browser-visible only after Row Level Security is configured and reviewed. The service-role key must remain server-only and must not be used in normal user request paths unless strictly scoped.

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
