# Archflow Engineering Rules

These rules protect the project from repeated parser, build, storage, and architecture regressions. Treat them as mandatory for all code changes.

## File And Module Rules

- Never create extensionless TypeScript modules.
- All TypeScript files must use `.ts` or `.tsx` extensions.
- Never leave duplicate extensionless files such as `src/lib/storage` or `src/lib/tasks`.
- After moving or renaming files, check for stale extensionless duplicates.
- Prefer `rg --files` to verify the final file list after renames.
- Do not keep two importable modules with the same logical name.

## Required Verification

Before finishing any code change:
- Run `git diff --check`.
- Run `npm run build`.
- Do not stop after edits if the build is red.
- Fix TypeScript, parser, hydration, and build errors before handing work back.
- If a change only touches docs, `npm run build` is still the default verification unless explicitly waived.

Use `npm run typecheck` for a faster TypeScript-only pass when diagnosing errors. Use `npm run check` when a full local gate is needed.

## Git And Deployment Safety

- Keep `main` deployable.
- Run the required local checks before pushing meaningful changes.
- Do not merge or hand off code with conflict markers, broken builds, or known parser errors.
- Future team workflow should use pull requests, protected main, required checks, code review, and Vercel preview deployments before production.
- Production environment variables should be managed in the deployment platform and limited to trusted maintainers.

## Next.js And Turbopack Notes

- This project uses a modern Next.js version; read relevant local docs before relying on old framework assumptions.
- If weird parser, module resolution, or fetch/cache errors happen after file renames, clear the local build cache with:

```bash
rm -rf .next
```

- Clearing `.next` is a local cache reset, not an app behavior change.

## Architecture Boundaries

- Keep `AppShell` thin: navigation, theme controls, and top-level mounts only.
- Page components should orchestrate UI/state, not own domain/storage logic.
- Business/domain logic belongs in `src/lib/*`, repositories, services, and typed helpers.
- Avoid broad rewrites unless the task explicitly requires them.
- Keep changes scoped to the requested behavior.
- Avoid large page-level JSX duplication.
- Prefer shared UI primitives from `src/components/ui`.

## UI And Dialog Rules

- Modals should use an icon-only X close button in the top-right.
- Close buttons must have `aria-label="Close"`.
- Destructive actions must require confirmation.
- Dialogs should use `role="dialog"` and `aria-modal="true"` where applicable.
- Buttons must have explicit `type`.
- Forms should validate required fields.
- Empty, loading, and error states should be consistent.
- Dark/light contrast must be checked.
- Mobile width must be considered for every modal and major layout.

## Storage And Data Safety

- No direct `localStorage` access in pages or components.
- Browser storage access must go through `src/lib/storage.ts` and domain repositories.
- Validate parsed storage before use.
- Keep repository APIs typed and future-backend-friendly.
- Do not clear unrelated browser storage.

## Security Rules

- No frontend secrets.
- No API keys in client code.
- `.env` files must remain untracked; commit only `.env.example` placeholders.
- Treat every `NEXT_PUBLIC_*` variable as public browser-visible data.
- Server-only secrets must stay in server-side runtime code and deployment environment settings.
- No direct AI provider calls from UI.
- No API calls from UI unless explicitly approved for the task.
- Future AI and privileged integrations must go through server-side gateways.
- Do not log secrets, tokens, full AI prompts, payment data, or unnecessary personal content.
- Verify webhook signatures server-side before trusting provider events.
- Backend records must eventually enforce user ownership and workspace authorization server-side.
- Admin/debug tooling must not bypass user isolation without explicit, logged, reviewed controls.

## AI Rules

- AI Chat is mock-only until a server-side AI route exists.
- No OpenAI or provider API keys in frontend code.
- Future AI calls must go through backend/API routes only.
- AI features must be privacy-aware.
- Do not overclaim current AI capability in UI or docs.
- AI suggestions are assistive, not authoritative.
- Destructive AI actions and high-impact recommendations require explicit user confirmation.
- UI should distinguish AI suggestions from AI-executed actions when real AI actions exist.

## SSR And Hydration Safety

- Initial render must be deterministic.
- Browser-backed data should load after mount in client components.
- Guard browser APIs with `typeof window !== "undefined"`.
- Avoid locale/time-dependent render output during SSR.
- Use stable ISO/date strings or client-only hydration for dynamic dates.
- Do not use `suppressHydrationWarning` unless there is a clearly documented reason.
