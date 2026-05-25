# Personal OS Roadmap

## Current MVP

- App shell with core navigation.
- Dashboard overview.
- Today view with focus planning.
- Inbox capture with deterministic parsing.
- Task creation and local persistence.
- Note creation and local persistence.
- Finance transaction tracking.
- Car tracking.
- Global text search over normalized entities.
- Command palette for navigation and lightweight create actions.
- Theme support.
- Local-first repository layer.
- Entity model foundation.
- Daily briefing aggregation helpers.

## Next Milestones

- Improve command palette actions:
  - quick add task with priority/workspace
  - quick add note with type selection
  - open entity actions
  - command results from search
- Build Daily Briefing UI using deterministic briefing helpers.
- Expand universal search:
  - include finance, cars, and inbox captures
  - add result navigation
  - add highlighting and ranking
- Introduce timeline/activity feed primitives.
- Add structured workspaces and entity relations.
- Improve mobile capture flows.
- Add import/export foundation for user data portability.
- Replace mock AI language with clearly bounded deterministic or server-backed behavior.

## Future SaaS Milestones

- Authentication and user accounts.
- Cloud persistence and sync.
- Offline/local-first sync model.
- Secure backend API layer.
- AI memory service.
- Semantic search and embeddings.
- Calendar, email, messenger, and file integrations.
- Notification and reminder system.
- Mobile app or mobile-first capture companion.
- Billing, subscriptions, and plan limits.
- GDPR-grade export/delete workflows.
- Admin and observability foundation.

## AI Memory

AI memory should be built on explicit entity data, metadata, relations, and user-approved retrieval. It should avoid opaque hidden memory in early versions.

Initial direction:
- use normalized entities as memory candidates
- store source references
- distinguish user-authored data from generated summaries
- support deletion and regeneration
- run AI processing server-side only

## Semantic Search

Semantic search should extend the current normalized search model rather than replace it.

Future direction:
- text search remains available and debuggable
- embeddings are generated server-side
- vector results map back to typed entities
- permissions and ownership are enforced before retrieval

## Daily Briefing

The first briefing should be deterministic:
- overdue tasks
- today tasks
- recent notes
- recent captures

AI summarization can be added later as a server-side enhancement over this structured input.

## Timeline and Activity Feed

The activity feed should be entity-backed and append-only where possible. It can later power audit history, AI context, recency ranking, and user-facing memory inspection.

## Integrations

Future integrations may include:
- calendar
- email
- Telegram or messenger capture
- files and documents
- finance imports
- vehicle maintenance reminders

Integrations should be permission-scoped and avoid storing unnecessary tokens in the browser.

## Monetization Direction

Potential commercial tiers:
- local-only/free MVP
- synced personal plan
- AI memory plan
- integrations plan
- future family/team plan

Billing should not be introduced until auth, data ownership, and backend boundaries are stable.
