# Personal OS — Agent Instructions

## Product Vision

Personal OS is a future commercial AI productivity/life operating system for US/EU markets.

Treat this project as a real SaaS product, not a demo or toy app.

The product direction:
- local-first
- privacy-first
- AI-native
- mobile-friendly
- secure by default
- scalable toward multi-user SaaS
- designed for future backend, auth, sync, payments, AI memory, and integrations

Positioning:
- “Personal AI Operating System”
- “Your second brain that actually takes action”

The product should help users capture, organize, retrieve, and act on personal/work/life information across:
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
- future calendar/email/messenger integrations

---

## Tech Stack

Current stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- React client components where needed
- Vercel deployment

GitHub repo:
- https://github.com/MaximAndriienko/personal-os

Current storage:
- localStorage only for MVP
- local-first architecture
- future backend expected

Do not add new dependencies unless clearly necessary and justified.

---

## Current Architecture

Important files/directories:
- `src/app/*` — route pages
- `src/components/AppShell.tsx` — layout/navigation/theme
- `src/components/ThemeProvider.tsx`
- `src/components/ui/*` — reusable UI primitives
- `src/lib/storage.ts` — safe localStorage access
- `src/lib/tasks.ts`
- `src/lib/notes.ts`
- `src/data/mock.ts`
- `src/types/index.ts`

Current localStorage keys:
- `personal-os.tasks`
- `personal-os.notes`
- `personal-os.finance.transactions`
- `personal-os.cars`
- `personal-os.theme`
- `personal-os.quick-captures`

---

## Engineering Standards

Always write production-quality code that can be reviewed by senior developers or CTOs.

Prioritize:
- type safety
- readability
- maintainability
- scalability
- security
- privacy
- reusable components
- SSR-safe browser handling
- clean architecture
- small focused functions
- responsive UI
- dark/light support

Avoid:
- `any`
- duplicated logic
- duplicated storage access
- duplicated validation
- direct localStorage usage inside pages
- giant messy page files
- frontend secrets
- API keys in client code
- unsafe browser APIs
- unrelated file changes
- overengineering too early

---

## Architecture Rules

Pages should mostly orchestrate UI/state only.

Business/domain logic belongs in:
- `src/lib/*`
- repositories
- services
- typed helpers

Storage access must go through:
- `src/lib/storage.ts`
- repositories like:
  - `tasks.ts`
  - `notes.ts`
  - future `finance.ts`
  - future `cars.ts`

Prefer:
```ts
getTasks()
saveTasks(tasks)
createTask(task)
````

Avoid:

```ts
localStorage.getItem(...)
localStorage.setItem(...)
JSON.parse(...)
```

Always guard browser APIs:

```ts
typeof window !== "undefined"
```

---

## Future SaaS Readiness

Design code so localStorage can later be replaced with:

* API routes
* Supabase
* PostgreSQL
* server actions
* sync engine

Future architecture must support:

* multiple users
* auth
* cloud sync
* offline/local-first mode
* AI memory
* payments
* GDPR/privacy requests
* export/delete data
* mobile capture

Do not implement these yet unless requested, but avoid decisions that block them later.

---

## Security Rules

Security is high priority.

Never:

* expose API/OpenAI keys in frontend
* commit secrets
* store sensitive tokens in localStorage
* add random third-party packages casually
* add remote scripts without approval
* send user data to external services without explicit approval

Future AI/API calls must be:

* server-side only
* routed through backend/API routes
* privacy-aware

Validate all parsed storage data before use.

Handle:

* corrupted storage
* invalid JSON
* missing values

---

## Privacy / GDPR Direction

Because the product may target Europe:

* user data should be exportable later
* user data should be deletable later
* avoid unnecessary tracking
* avoid hidden analytics
* keep data structures understandable
* prefer privacy-first defaults

Do not make architecture decisions that would block GDPR compliance later.

---

## UI / UX Standards

Target feel:

* Linear
* Raycast
* Notion
* Mem
* Vercel
* Cursor
* ChatGPT

Rules:

* support dark/light mode
* keep layouts responsive
* reuse UI primitives from `src/components/ui`
* avoid duplicated Tailwind blocks
* maintain spacing consistency
* keep accessibility reasonable
* buttons must have proper `type`
* avoid low contrast
* avoid unreadable text

---

## TypeScript Standards

Use strict TypeScript.

Prefer:

* explicit domain types
* reusable validators
* type guards
* union types
* `unknown` before validation

Avoid:

* unsafe casts
* broad `any`
* assuming JSON shape blindly

---

## Data Model Direction

Prefer:

```ts
crypto.randomUUID()
```

Prefer stable enums/unions:

```ts
type WorkspaceKey =
  | "personal"
  | "work"
  | "cars"
  | "business"
  | "knowledge";
```

Avoid magic IDs:

```ts
"1"
"2"
"3"
```

---

## AI Architecture Direction

Future AI logic should live in:

* `src/lib/ai/*`
* `src/lib/inbox.ts`
* backend/API routes

Avoid mixing:

* UI
* parsing
* storage
* AI provider logic

inside one page file.

Mock AI is acceptable for MVP if architecture stays replaceable.

---

## Workflow Rules

Before coding:

1. Read `AGENTS.md`
2. Inspect relevant files
3. Explain intended changes briefly
4. Keep changes focused

When coding:

1. Preserve existing behavior unless requested otherwise
2. Keep build green
3. Keep dark/light mode working
4. Reuse existing architecture/components

After coding:

1. Run `npm run build`
2. Fix build/type errors
3. Summarize changed files
4. Mention remaining technical debt

---

## Git Standards

Use small meaningful commits.

Good:

* `Add finance repository`
* `Refactor dashboard storage access`
* `Add shared UI primitives`

Bad:

* `fix`
* `changes`
* `stuff`
* `final`

Do not commit broken builds.

---

## Current Priority

Priority order:

1. Fix repo hygiene issues
2. Finish shared UI usage
3. Add repositories for Finance/Cars/QuickCaptures
4. Refactor Dashboard/Today to shared typed accessors
5. Refactor Inbox parsing into `src/lib/inbox.ts`
6. Add Cmd+K command palette
7. Prepare AI abstraction layer
8. Prepare future backend/auth/sync safely

---

## Review Mindset

Assume experienced senior developers and CTOs will review the code.

Code should show:

* clear architecture
* clean naming
* scalability awareness
* safe browser handling
* no obvious AI-generated spaghetti
* no secret leaks
* strong engineering discipline

When unsure:
choose the simpler, safer, more maintainable option.

```
```
