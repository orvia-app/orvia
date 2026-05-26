# Archflow Roadmap

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
- Local onboarding v1 for the Archflow capture, organize, and retrieve loop.
- Initial product, architecture, roadmap, and security docs.

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
- Run naming and branding pass before public launch materials.

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

- Choose backend architecture and environment strategy.
- Introduce authentication and secure sessions.
- Add user/workspace ownership to persisted data.
- Add `user_id` ownership to every user-owned record.
- Support user-created workspaces and backend-owned tag records.
- Add workspace-level permissions and server-side authorization checks.
- Migrate repositories from browser-only storage to backend-compatible adapters.
- Evaluate Supabase/PostgreSQL with row-level security or equivalent authorization.
- Design offline/local-first sync and conflict handling.
- Add export/delete account data workflows.
- Ensure backups, sync queues, derived memory, and embeddings respect deletion requests.
- Add auditable deletion records for backend account/data deletion flows.
- Replace local-only export/reset with authenticated cloud export/delete workflows.
- Define migration/versioning strategy for stored data.

## Security Hardening Phase

- Keep security checklist current for releases.
- Re-audit `.gitignore`, repository contents, and generated artifacts before public launch.
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
- Avoid storing integration tokens in browser storage.
- Add integration-specific export/delete behavior.
- Log integration actions in activity timeline where useful.

## Documentation Backlog

- Fuller README rewrite.
- Architecture diagrams after backend choice.
- Security checklist.
- Threat model.
- Data classification policy.
- AI data handling policy.
- Logging policy.
- Stripe/payment data policy.
- Environment and secrets management guide.
- Public privacy/security posture before launch.
