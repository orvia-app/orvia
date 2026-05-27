# Orvia Rebrand Plan

## Phase

Current phase: Rebrand Phase 1 plus production brand infrastructure update.

Goal: rename visible product branding from Archflow to Orvia without breaking local-first compatibility, storage continuity, routes, or backend preparation.

## Production Brand Infrastructure

Current production-facing brand setup:
- Product brand: Orvia
- Primary domain: `https://useorvia.com`
- `www` redirect: `https://www.useorvia.com` -> `https://useorvia.com`
- GitHub org/repo: `orvia-app/orvia`
- Vercel project name: `orvia`
- Domain registrar/DNS: Cloudflare
- Cloudflare account security: app-based 2FA enabled

The repository was made public because Vercel Hobby does not support private organization repositories. This is acceptable for the current frontend-only MVP only if secrets remain out of the repository and environment files stay untracked.

## What Was Renamed

Visible/product-facing surfaces were renamed to Orvia:
- app shell brand text
- mobile shell brand text
- Next.js metadata title
- onboarding and capture copy
- inbox heading and helper copy
- command center heading and action dialog copy
- settings reset/export-facing copy
- seed/demo titles shown in the UI
- export app name and downloaded export filename
- README title and overview
- project docs and teammate-facing docs

## What Intentionally Remains Unchanged

Compatibility and backend-preparation identifiers remain unchanged:
- `personal-os.*` localStorage keys
- package name `personal-os`
- existing routes such as `/tasks`, `/notes`, `/timeline`, `/inbox`
- Supabase migration filename
- Supabase SQL function names such as `archflow_set_updated_at`
- existing database/internal migration comments until a later migration phase
- technical folder names and module boundaries
- legacy references needed to explain the rebrand history

These identifiers should not be renamed casually because they affect persistence, migrations, build metadata, repo continuity, or future backend compatibility.

## Storage Compatibility Notes

Local data continuity depends on preserving the existing browser storage keys:
- `personal-os.tasks`
- `personal-os.notes`
- `personal-os.finance.transactions`
- `personal-os.cars`
- `personal-os.quick-captures`
- `personal-os.theme`
- `personal-os.local-reset-completed`
- `personal-os.onboarding.completed`
- `personal-os.command-history`

Do not rename these keys without a tested, idempotent migration. A future storage-key migration should support reading old keys, writing new keys, handling partial migrations, preserving export/reset behavior, and rolling back safely if needed.

## Future Migration Considerations

Future phases can consider:
- package rename from `personal-os` if it becomes worth the churn
- localStorage key migration from `personal-os.*` to an Orvia namespace
- export schema version update if app identity becomes part of import validation
- Supabase SQL function/comment rename in a new migration, not by mutating already-shared migration history
- private repository or paid/pro infrastructure once auth, users, payments, or sensitive server-side systems go live
- public auth/email template naming
- Telegram bot handle
- App Store/Play Store naming
- public website/domain/social handles

Each phase should keep compatibility explicit and avoid breaking existing local data.

## Future Infrastructure Rename Phases

Recommended sequence:
1. Keep current public repo secret-free while the app remains frontend-only and local-first.
2. Move to paid/pro private repository and production-grade infrastructure before auth, user accounts, payments, server-side AI, or sensitive integrations go live.
3. Keep existing development/local identifiers stable until migration work is explicitly scheduled.
4. If storage or database identifiers must change, create a migration plan with rollback and QA steps.
5. Re-check domain, trademark, App Store, Telegram handle, GitHub, and searchability before public beta.

## Rebrand QA Checklist

- Existing local data still loads.
- Theme persistence still works through the old theme key.
- Export downloads with Orvia visible naming.
- Reset clears the same known app-owned keys.
- Routes remain unchanged.
- No direct storage key rename was introduced.
- Supabase migration SQL remains untouched.
- UI visible brand reads Orvia.
