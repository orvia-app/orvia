# Orvia Roadmap

## Planning References

- `docs/PROJECT_OVERVIEW.md`: current MVP, product loops, and future direction.
- `docs/ARCHITECTURE_DECISIONS.md`: accepted architecture decisions and tradeoffs.
- `docs/BACKEND_PLAN.md`: backend/auth/sync phases.
- `docs/DATABASE_SCHEMA.md`: first cloud schema draft.
- `docs/SYNC_STRATEGY.md`: local-first sync migration plan.
- `docs/TELEGRAM_INTEGRATION_PLAN.md`: future Telegram quick capture roadmap.
- `docs/QA_CHECKLIST.md`: release and preview QA coverage.
- `docs/BRANDING_NAMING.md`: naming criteria and brand decision checklist before public infrastructure.

## Current Foundation Completed

- App shell with responsive navigation and theme support.
- Shared UI primitives and improved visual language.
- Local-first repository layer for current MVP domains.
- Command palette with route commands and action commands.
- Command action modal for Create Task and Create Note.
- Inbox deterministic parsing helpers.
- Universal entity model foundation.
- Deterministic search foundation over normalized entities.
- Activity/timeline event foundation.
- Daily Briefing aggregation foundation and Today preview.
- AI memory model, candidate helpers, and Dashboard Memory Preview.
- Dashboard Recent Activity preview.
- Local-only export/reset data foundation in Settings.
- Workspace and tag helper foundation for organization, search, and future AI context.
- Local onboarding v1 for the Orvia capture, organize, and retrieve loop.
- Production brand infrastructure for `useorvia.com`, `orvia-app/orvia`, and Vercel project `orvia`.
- Public landing MVP at `/landing` with private beta positioning and a UI-only waitlist form.
- Public/app split foundation: `/` is public, `/landing` remains available, and primary app navigation now uses `/app/*`.
- Central storage key registry and browser-safe storage adapter foundation.
- Generic local repository contracts for current local-first domains.
- Core backend-ready entity, relation, search, capture, activity, and memory seams.
- Sync metadata type foundation without network sync.
- Initial product, architecture, roadmap, and security docs.
- Teammate-facing project overview, development guide, ADR-style architecture decisions, Telegram integration plan, contributing guide, and QA checklist.

## Next UX/Product Phase

- Improve command actions:
  - task priority/workspace selection
  - note type selection
  - quick capture command
  - open entity commands
  - search results inside command palette
- Expand universal search to finance, cars, inbox captures, activity, and memory candidates.
- Add entity detail/open flows where appropriate.
- Build first timeline/activity UI beyond Dashboard preview.
- Improve Today workflow around planning, capture, and briefing.
- Add workspace filters across search, timeline, tasks, notes, and memory previews.
- Add tag capture/display in focused workflows where it improves retrieval.
- Improve onboarding with a sample capture, guided setup, and first-run checklist.
- Expand local data management:
  - import validation
  - clearer export schema docs
  - selective reset controls
  - user-facing data inventory
- Rewrite README into a fuller product/developer overview later.
- Keep production brand infrastructure documented and consistent across README, docs, Vercel, Cloudflare, and GitHub.
- Complete any remaining trademark, App Store, Telegram handle, and SEO/searchability checks before public beta.
- Connect the `/landing` waitlist form to an approved backend or email provider before using it for real collection.
- Future PR: Harden App Route Protection:
  - Replace the current client-side app gate with server-aware middleware protection when session handling supports it cleanly.
  - Current `middleware.ts` only matches `/app/*` as a foundation; it does not validate Supabase sessions because browser auth is still stored client-side.
  - Move Supabase auth to a server-readable cookie/session pattern before enforcing middleware redirects for authenticated users.
  - Legacy top-level app routes now temporarily redirect to `/app/*`; decide when to make those redirects permanent after beta route stability.
  - Signed-out `/app/*` access currently redirects to `/login` through the AppShell client gate after auth state resolves.

## AI Layer Phase

- Define AI data handling policy before real provider calls.
- Add server-side AI gateway only after backend boundaries exist.
- Introduce deterministic prompts and typed response contracts.
- Add AI memory generation from source-linked entities.
- Add semantic search with server-generated embeddings.
- Use workspace and tag context to scope AI recall, summaries, and action suggestions.
- Add source citations/references for memory and AI answers.
- Add user controls for memory deletion, regeneration, and exclusion.
- Add logging policy for AI requests that avoids storing unnecessary personal data.

## Backend/Auth/Sync Phase

- Use `docs/BACKEND_PLAN.md`, `docs/DATABASE_SCHEMA.md`, and `docs/SYNC_STRATEGY.md` as the backend planning baseline before implementation.
- Complete Orvia external validation before creating production Supabase project names or public auth/email templates.
- Create Supabase project and environment separation for local, preview, and production.
- Review and apply the first migration set in `supabase/migrations/202605270001_initial_schema.sql` for profiles, workspaces, tasks, notes, captures, activity events, entity relations, memory candidates, finance transactions, cars, and preferences.
- Include optional module preferences and integration registry/state tables in the first migration set.
- Enable and verify Row Level Security on all user-owned tables before exposing browser access.
- Introduce email/password authentication and secure sessions.
- Preserve anonymous/local-only mode and add an explicit local-to-cloud migration flow.
- Add user/workspace ownership to persisted data.
- Add `user_id` ownership to every user-owned record.
- Support user-created workspaces and backend-owned tag records.
- Add Settings -> Modules after auth/backend foundations so users can enable, disable, pin, and order modules.
- Add workspace-level permissions and server-side authorization checks.
- Migrate repositories from browser-only storage to backend-compatible adapters.
- Add a second storage adapter target, likely IndexedDB or server-backed sync, behind the existing repository contracts.
- Evaluate Supabase/PostgreSQL with row-level security or equivalent authorization.
- Design offline/local-first sync and conflict handling.
- Use core entity sync metadata for versioning, soft delete, device provenance, and conflict resolution.
- Add export/delete account data workflows.
- Ensure backups, sync queues, derived memory, and embeddings respect deletion requests.
- Add auditable deletion records for backend account/data deletion flows.
- Replace local-only export/reset with authenticated cloud export/delete workflows.
- Define migration/versioning strategy for stored data.

Safe implementation phases:
- Phase A: environment setup and secret handling.
- Phase B: Supabase schema and RLS policies. Initial migration SQL now exists, but it has not been applied and the app is not connected.
- Phase C: auth and local-only/cloud account boundary.
- Phase D: cloud repository adapter behind existing contracts.
- Phase E: sync queue and conflict handling.
- Phase F: server-side AI route with consent, scoping, and retention controls.

## Security Hardening Phase

- Keep security checklist current for releases.
- Re-audit `.gitignore`, repository contents, and generated artifacts before public launch.
- Treat `orvia-app/orvia` as public while on Vercel Hobby; never commit secrets or production credentials.
- Move repo/private infrastructure to paid/pro setup before auth, users, payments, server-side AI, or sensitive integrations go live.
- Keep main deployable and add protected-branch workflow before teammates join.
- Add required checks before merge:
  - build
  - typecheck
  - diff/format hygiene
  - security checks where applicable
- Use Vercel preview deployments for PR validation.
- Expand secrets management policy after backend provider choice.
- Validate environment variable strategy for local, preview, and production.
- Expand threat model for MVP SaaS scope.
- Expand data classification policy into implementation requirements.
- Define data retention windows for product data, backups, logs, AI prompts, embeddings, and derived memory.
- Define AI safety review rules for high-impact and destructive actions.
- Create dependency audit workflow.
- Create incident response basics:
  - triage owner
  - severity levels
  - user notification criteria
  - credential rotation procedure
  - post-incident review
- Add privacy review for AI memory, integrations, and sync.

## Mobile Capture Phase

- Improve mobile responsive capture flows.
- Add share-sheet-friendly capture direction.
- Use `docs/TELEGRAM_INTEGRATION_PLAN.md` when backend/auth is ready for external capture channels.
- Complete Orvia brand and handle validation before creating a public Telegram bot or App Store listing.
- Explore PWA or native companion after core data model stabilizes.
- Support fast capture for notes, tasks, inbox, links, and voice-derived text.
- Keep mobile sync/auth assumptions aligned with backend phase.

## Monetization And Payment Phase

- Define paid plan packaging only after auth and data ownership are stable.
- Add Stripe through server-side integration only.
- Do not store card data in the app.
- Store only required billing references and subscription state.
- Define Stripe/payment data policy.
- Add plan limits for sync, AI memory, integrations, or storage only when technically enforceable.

## Integrations Phase

- Define permission scopes and token storage requirements.
- Add calendar/email/messenger/file integrations behind authenticated backend endpoints.
- Use the global integrations registry plus per-user integration state; do not store provider secrets in user-owned integration rows.
- Avoid storing integration tokens in browser storage.
- Add integration-specific export/delete behavior.
- Log integration actions in activity timeline where useful.

## Documentation Backlog

- Fuller README rewrite.
- Orvia validation notes and final public brand decision record.
- Architecture diagrams after backend choice.
- Security checklist tied to backend launch gates.
- Threat model expanded for Supabase, RLS, auth sessions, service-role usage, AI routes, and Stripe webhooks.
- Data classification policy with implementation rules for AI, sync, logs, and integrations.
- AI data handling policy with consent, provider retention assumptions, embeddings, and deletion behavior.
- Logging policy with redaction, access controls, and retention windows.
- Stripe/payment data policy with no card data stored by Orvia.
- Environment and secrets management guide.
- Public privacy/security posture before launch.
