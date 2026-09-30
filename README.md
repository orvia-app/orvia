# Orvia

Orvia is a personal system for managing attention, tasks, and time. Its product direction is to turn unstructured information into clear next actions through **Capture → Understand → Prioritize → Act**. Orvia is **pre-private-beta**; that loop describes the intended product experience, not a claim that autonomous understanding, planning, or action is implemented.

The current app has Dashboard, Today, Inbox, Tasks, Notes, Search, Timeline, and Settings. Supabase Auth and account-backed APIs support tasks, notes, Inbox captures, and activities, alongside browser-local data and user-scoped fallback caches. AI Chat is mock functionality. Finance, Cars, and Automation are experimental Labs. Current navigation and behavior differ from the target information architecture in the Product Specification.

## Stack and development

- Next.js App Router 16.3.6, React 19.2.4, strict TypeScript, and Tailwind CSS 4
- Supabase Auth and PostgreSQL-backed APIs, with RLS migrations and server-side ownership checks
- English and Ukrainian localization; light and dark themes
- Sentry integration with privacy filtering and environment-dependent enablement; repository configuration does not establish live monitoring

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Use `.env.example` and [environment guidance](docs/ENVIRONMENT.md) for configuration. Keep secrets out of the repository and browser code. The Git remote is [`orvia-app/orvia`](https://github.com/orvia-app/orvia); deployment state and domain configuration need separate verification.

## Product and documentation

The current work phase is **UX Architecture based on Product Specification v1.0**. The specification's header calls its own stage “Pre-private-beta / Product Architecture v2”; that label describes the approved specification, while UX Architecture describes the next work phase. The [Product Specification](docs/product/PRODUCT_SPEC.md) is the canonical source for intended product behavior, scope, beta requirements, and decisions; the [Ukrainian companion](docs/product/PRODUCT_SPEC_UA.md) follows it. Code describes the current implementation, and verification records describe checks already performed.

For product decisions, use this order: Product Specification → approved UX/design specifications → feature requirements and acceptance criteria → architecture and ADRs → implementation documentation → historical/archive documentation. Older roadmaps do not override the Product Specification.

- [Agent instructions](AGENTS.md) and [contributor guide](docs/CONTRIBUTING.md)
- [Engineering rules](docs/ENGINEERING_RULES.md) and [architecture decisions](docs/ARCHITECTURE_DECISIONS.md)
- [Security model and requirements](docs/SECURITY.md), [security verification evidence](docs/SECURITY_VERIFICATION.md), and [data boundaries](docs/DATA_BOUNDARY.md)
- [Analytics](docs/ANALYTICS.md) and [environment strategy](docs/ENVIRONMENT.md)
