# Contributing To Archflow

## Development Rules

- Read `AGENTS.md` before making changes.
- Keep changes focused and reviewable.
- Preserve current behavior unless the task explicitly changes it.
- Prefer existing architecture patterns over new one-off systems.
- No new dependencies without a strong reason.
- No backend, AI, payment, or integration calls unless explicitly requested.

## Branch Naming

- Use short descriptive branch names.
- Codex-created branches should use `codex/` when creating a branch.
- Examples:
  - `codex/mobile-shell-fix`
  - `feature/search-filters`
  - `fix/task-filter-flicker`

## Commit Style

Use clear imperative commits:
- `Add Telegram integration plan`
- `Refactor storage adapter`
- `Fix command center keyboard state`

Avoid vague commits:
- `fix`
- `update`
- `misc`
- `final`

## Pull Request Checklist

- Scope is clear.
- Product behavior is described.
- Architecture impact is described if relevant.
- Screenshots or notes included for UI changes.
- Security/privacy impact considered.
- Docs updated when architecture, product direction, setup, or QA changes.
- No unrelated refactors.

## Validation Requirements

Before merge or handoff:

```bash
npm run typecheck
npm run build
git diff --check
```

Also verify:
- no direct `localStorage` in pages/components
- no frontend secrets
- no extensionless TypeScript files
- no stale duplicate modules after renames
- no hydration warnings introduced

## UI/UX Rules

- Reuse shared UI primitives.
- Keep `AppShell` thin.
- Maintain dark/light/system support.
- Check mobile width behavior.
- Use explicit button `type`.
- Use accessible labels for icon buttons.
- Use confirmation for destructive actions.
- Avoid debug-looking UI, fake AI claims, and heavy nested cards.

## Security Rules

- No API keys or secrets in frontend code.
- No provider calls from UI unless explicitly approved and safe.
- Future AI, Telegram, Stripe, and integration work must use server-side routes.
- Treat browser storage as local convenience, not secure storage.
- Keep export/delete implications in mind for new data types.

## Docs Expectations

Update docs when changing:
- product scope
- architecture
- storage/repositories
- backend/auth/sync direction
- security or environment assumptions
- QA expectations
- onboarding or contributor workflow
