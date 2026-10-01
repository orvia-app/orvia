# Orvia Information Architecture

**Status:** PARTIALLY DECIDED — Product Spec categories are DECIDED; device grouping is TARGET pending UX Architecture approval; route reconciliation is OPEN
**Authority:** [Product Specification](../product/PRODUCT_SPEC.md) and [UX Architecture](../product/UX_ARCHITECTURE.md)

## 1. Target hierarchy

| Category | Areas | Role |
| --- | --- | --- |
| PRIMARY DESTINATIONS | Home, Plan, Calendar, Inbox, Tasks & Notes, Search / Ask Orvia, Settings | Product Spec primary areas; visual placement may vary without changing product status |
| GLOBAL ACTION | Capture | Available from nearly anywhere; not a destination |
| SECONDARY | Projects, Workspaces/context switch, History/Timeline, Feedback, Help | Organization, context, audit/recovery, and support |
| UTILITY PLACEMENT | Account, Settings entry, theme/language, sign out | Presentation region for preferences, identity, privacy, security, and environment; Settings remains a primary destination |
| CONTEXTUAL | Object detail/edit, filters, conflict resolution, plan proposal, source status | Exists inside a primary/secondary job |
| EXPERIMENTAL / NON-CORE | Finance, Cars, and Automation in CURRENT Labs; separate CURRENT AI Chat mock | Experimental, local, mock, or placeholder surfaces outside core beta navigation |
| ADMIN | Analytics and feedback moderation | Separately authorized operational tools; never user navigation authority |

## 2. Relationship between areas

| Area | Lead question and relationship |
| --- | --- |
| Home | “What matters for me now?” Summarizes context and offers a next action; it is not the full plan or library. |
| Today | CURRENT route/label. Its future relationship to Home and Plan is OPEN; do not create a second competing day model. |
| Dashboard | CURRENT route/label for `/app`. Target product calls this Home. Route/name migration is OPEN. |
| Plan | “What am I going to do, and how should I use available time?” Uses the shared schedule plus intent, priorities, capacity, and Still to place. |
| Calendar | “What does my time look like?” Factual Events and planned Task intervals; feeds context to Plan but is not Plan. |
| Inbox | “What needs clarification, approval, or a decision?” Attention queue, not capture history. |
| Tasks | Work to do, with deadline/planned time/duration kept distinct; managed in the Tasks & Notes library. |
| Notes | Lightweight information, related work, and task creation; managed in the same library. |
| Search | Retrieves permitted Tasks, Notes, Events, and Projects; Ask Orvia is a future capability within this retrieval experience. |
| AI Chat | CURRENT scripted mock. OUT OF SCOPE as a separate core destination; real intelligence belongs in workflows or Search/Ask Orvia after approval. It is not reclassified as a Labs module by this document. |
| Finance / Cars / Automation | CURRENT Labs surfaces. They remain experimental/local or placeholder according to implementation evidence and do not shape core IA. |
| Settings | DECIDED primary destination controlling account, appearance, preferences, intelligence/privacy, notifications, integrations, data, and security as capabilities become real. Its quieter utility placement does not make it a secondary capability. |

## 3. Navigation

### Target desktop

TARGET sequence emphasizes **Home → Plan → Calendar**, a prominent **Capture**, and **Inbox**. A Library group contains Tasks & Notes, Projects, and Search. Workspace/account context stays compact. History, Feedback, and Help are secondary. Settings remains a primary destination in a quieter utility/account position. This grouping requires approval of the draft UX Architecture before implementation.

### Target mobile

TARGET bottom navigation is **Home | Plan | Capture | Calendar | Inbox**. Other primary and secondary areas remain reachable through understandable secondary/utility containers. The exact containers are **OPEN**, and the grouping requires approval before implementation.

### Current implementation

The AppShell currently exposes Dashboard, Today, Calendar; Inbox, Tasks, Notes, Search, Timeline; Settings; admin items when authorized; and a Labs group for Cars, Finance, and Automation. Mobile bottom navigation currently uses Dashboard, Today, Capture, Calendar, and Inbox. Route visibility is not authorization.

This mismatch is an implementation observation, not permission to redesign navigation in an unrelated screen batch.

## 4. Navigation rules

- Primary navigation contains durable destinations, not every object type or experiment.
- Secondary navigation remains discoverable without competing visually with primary work.
- Context switches show the active workspace and do not imply authorization.
- Global Capture remains reachable without forcing a destination first.
- Search can be globally reachable and contextually scoped, but query scope is explicit.
- Account/settings actions are grouped by user expectation, not backend service.
- Mobile preserves the same core jobs with an intentional composition.
- Admin and Labs never gain prominence merely because routes exist.

## 5. Global actions and contextual actions

Global actions affect the product broadly: Capture, Search, workspace context, account/settings. Contextual actions operate on the current item/view: complete task, change Calendar range, filter list, resolve Inbox item, inspect source state. Do not duplicate a contextual action globally unless it is a proven frequent cross-product need.

## 6. Open decisions

- Dashboard/Home naming and route migration.
- Today versus Plan responsibility and route transition.
- Exact Tasks & Notes combined-library route model.
- Projects entry point and feature-level UX.
- Mobile secondary-navigation container.
- Search versus Ask Orvia beta boundary.
- Exact workspace switcher placement and All-workspaces behavior.

These require the Product Spec/change-control sequence before implementation.
