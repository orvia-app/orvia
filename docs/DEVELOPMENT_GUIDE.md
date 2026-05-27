# Archflow Development Guide

## Run Locally

Install dependencies once:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build production output:

```bash
npm run build
```

## Required Commands

Use these before handing off meaningful work:

```bash
npm run typecheck
npm run build
git diff --check
```

Use the combined check when appropriate:

```bash
npm run check
```

## Workflow

1. Read `AGENTS.md`.
2. Read the relevant docs in `docs/`.
3. Inspect existing code patterns before editing.
4. Keep changes focused.
5. Preserve local-first behavior unless the task explicitly changes it.
6. Run typecheck, build, and diff hygiene checks.

## Folder Structure

- `src/app/*`: route pages and page-level UI orchestration.
- `src/components/AppShell.tsx`: shell, navigation, mobile drawer, theme controls, command center mount.
- `src/components/ui/*`: shared UI primitives.
- `src/components/command-palette/*`: Command Center UI and hooks.
- `src/core/*`: backend-ready contracts and adapters for storage, repositories, entities, relations, search, capture, activity, and memory.
- `src/lib/*`: domain repositories, helpers, command registries, local-first foundations.
- `src/types/index.ts`: shared domain types.
- `src/data/mock.ts`: local seed data for first-time MVP experience.
- `docs/*`: product, architecture, security, backend, QA, and contributor guidance.

## Branch Workflow

- Keep `main` deployable.
- Use short feature branches.
- Recommended prefix for Codex-created branches: `codex/`.
- Prefer pull requests before merging once teammates are active.
- Future protected main should require typecheck, build, and review.

## Commit Guidance

Good commit names:
- `Add backend planning docs`
- `Refactor task repository`
- `Fix command palette hydration`

Avoid:
- `fix`
- `changes`
- `final`
- unrelated mixed changes

## Working With Codex Or Cursor Safely

- Give scoped tasks and explicit constraints.
- Ask the agent to read `AGENTS.md` and relevant docs first.
- Require `npm run typecheck`, `npm run build`, and `git diff --check`.
- Review diffs before accepting broad edits.
- Do not allow agents to add dependencies casually.
- Do not allow agents to put secrets, API keys, or provider calls in frontend code.
- Watch for duplicated modules, direct storage access, and one-off UI patterns.

## Adding A New Module Safely

1. Decide whether the module belongs in `src/core`, `src/lib`, `src/components`, or `src/app`.
2. Add explicit TypeScript types.
3. Keep domain logic out of page components.
4. Add validators for persisted data.
5. Reuse repository and storage adapters.
6. Reuse shared UI primitives for visible surfaces.
7. Update docs if the module changes architecture, security, product scope, or QA.

## Storage Rules

- Do not read or write `localStorage` in pages/components.
- Use repository helpers such as `getTasks`, `createTask`, `getNotes`, or equivalent domain functions.
- Keep storage keys in `src/core/storage/keys.ts`.
- Validate parsed data.
- Preserve existing key names unless a migration is explicitly designed.
- Use local reset/export helpers for data management behavior.

## Secrets Rules

- No frontend secrets.
- No OpenAI, Supabase service-role, Stripe secret, Telegram bot, or integration tokens in client code.
- Treat `NEXT_PUBLIC_*` as public.
- Use `.env.example` only for blank placeholders.
- Future AI, Telegram, Stripe, and privileged backend work must run server-side.

## Manual QA Before Push

- App loads on Dashboard.
- Desktop sidebar and mobile drawer work.
- Dark, light, and system themes persist.
- Command Center opens, searches, navigates, and executes create actions.
- Tasks create, filter, and highlight from URL query.
- Notes create and persist.
- Inbox capture preview and create flows work.
- Search returns expected local results.
- Timeline shows tasks, notes, captures, finance, and cars where data exists.
- Settings export/reset behaves as expected.
- No console React errors or hydration warnings.
- No horizontal overflow on mobile.
