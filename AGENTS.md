# Personal OS — Agent Instructions

## Product context
Personal OS is a future commercial AI productivity/life operating system for US/EU markets, not a demo project.

The product should become a local-first, privacy-first AI command center for:
- tasks
- notes
- inbox capture
- AI chat
- finance
- cars
- automation
- search
- daily planning
- future AI memory

## Tech stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- React client components where needed
- Vercel deployment
- GitHub repo: https://github.com/MaximAndriienko/personal-os

## Current architecture
- `src/components/AppShell.tsx` — layout, navigation, theme controls
- `src/components/ThemeProvider.tsx` — dark/light/system theme
- `src/components/ui/*` — shared UI primitives
- `src/lib/storage.ts` — safe localStorage access
- `src/lib/tasks.ts` — task repository
- `src/lib/notes.ts` — note repository
- `src/data/mock.ts` — seed/demo data
- `src/types/index.ts` — shared app types

## LocalStorage keys
- `personal-os.tasks`
- `personal-os.notes`
- `personal-os.finance.transactions`
- `personal-os.cars`
- `personal-os.theme`
- `personal-os.quick-captures`

## Engineering standards
Always write production-quality code that can be reviewed by senior developers.

Prioritize:
- type safety
- clean architecture
- small reusable components
- repository/service layer over direct localStorage calls
- SSR-safe browser access
- privacy/security
- readable naming
- maintainability
- minimal dependencies
- dark/light support
- responsive UI
- clear separation of concerns

Avoid:
- direct `localStorage` usage inside pages
- frontend API keys or secrets
- large messy page components
- duplicated UI classes when shared components exist
- unnecessary packages
- `any` unless absolutely justified
- fragile hardcoded business logic
- breaking existing routes
- changing unrelated files

## Workflow
Before changing code:
1. Inspect existing files.
2. Explain intended changes briefly.
3. Prefer small, safe commits.
4. Keep current functionality working.

After changing code:
1. Run `npm run build`.
2. Fix TypeScript/build errors.
3. Summarize changed files.
4. Mention manual QA steps.

## Current priority
We are cleaning architecture before adding major features.

Priority order:
1. Finish shared UI usage across Tasks, Notes, Inbox.
2. Refactor Inbox parsing into `src/lib/inbox.ts`.
3. Add command palette Cmd+K.
4. Add AI-ready abstraction under `src/lib/ai`.
5. Prepare for future backend/auth/sync without adding secrets yet.

## Security rules
- No frontend OpenAI keys.
- No secrets in repo.
- No unsafe browser-only APIs without guards.
- No external services unless explicitly approved.
- Treat user data as private by default.

## UX direction
The product should feel like:
- Linear
- Raycast
- Notion
- Mem
- Motion
- ChatGPT

But positioned as:
“Personal AI Operating System”
