# Orvia Screen Inventory

**Status:** CONTROLLED INVENTORY
**Purpose:** skeleton-level product and UX boundaries. A screen requires its own completed specification before meaningful redesign or new feature implementation.

## Status summary

| Screen | Spec status | Current evidence | Target role / required next design work |
| --- | --- | --- | --- |
| Landing | PARTIALLY DEFINED | Public route exists and has historical rendered coverage | Explain product truthfully and lead to auth; messaging/brand composition needs approved screen spec |
| Auth | PARTIALLY DEFINED | Login/register/recovery/reset routes exist | Account entry/recovery with privacy-safe errors; Google Sign-In beta requirement still needs feature verification/spec |
| Dashboard / Home | PARTIALLY DEFINED | `/app` Dashboard exists | Target is Home: “What matters for me now?”; route/name and state-driven composition need reconciliation |
| Today | NEEDS PRODUCT DESIGN | `/app/today` exists | Future relationship to Home and Plan is unresolved; do not preserve a competing day model by default |
| Inbox | PARTIALLY DEFINED | Account/local capture queue exists | Attention queue by reason, inline resolution, calm empty state; detailed states/interactions needed |
| Tasks | PARTIALLY DEFINED | Task library and API exist | Tasks & Notes library target; deadline/planned time/duration and recurrence UX need feature specs |
| Calendar | PARTIALLY DEFINED | Day/Week/Month read-only UI and authenticated schedule API exist locally | See [Calendar specification](CALENDAR.md); visual acceptance and several interactions remain open |
| Plan | NEEDS PRODUCT DESIGN | No dedicated Plan UI; Today is not accepted as equivalent | Shared schedule, priorities, capacity, Still to place, manual planning, proposals need full screen/feature spec |
| Notes | PARTIALLY DEFINED | Notes library/editor exists | Lightweight notes in shared library; related work and text-to-task flows need specs |
| AI Chat | NEEDS PRODUCT DESIGN / OUT OF CORE | Scripted preview route; no real AI | No separate core destination in target IA; future Search/Ask Orvia boundary remains open |
| Finance | LABS / OUT OF BETA | Local experimental route | Do not promote or expand without explicit product decision |
| Cars | LABS / OUT OF BETA | Local experimental route | Do not promote or expand without explicit product decision |
| Automation | LABS / OUT OF BETA | Placeholder route | Do not imply active automation or integrations |
| Search | PARTIALLY DEFINED | Keyword search exists | Search + Ask Orvia target; retrieval scope, reliability, privacy, and action confirmation need specs |
| Settings | PARTIALLY DEFINED | Settings route exists with current controls | Product Spec primary destination; draft target grouping/placement needs approval; only real capabilities may appear as active controls |

## Landing skeleton

- **Purpose/user goal:** understand Orvia’s value and decide whether to create/sign into an account.
- **Hierarchy:** product promise → concrete workflow/outcome → trust/context → auth action.
- **Required states:** normal, auth/config unavailable, legal/help navigation, responsive EN/UA and themes.
- **Security/content:** no unsupported AI, integration, privacy, beta, or production claims.
- **OPEN:** final brand identity, approved marketing copy, proof/visual assets, launch positioning.
- **OUT OF SCOPE:** authenticated product navigation and feature demonstrations presented as live when mock.

## Auth skeleton

- **Purpose/user goal:** securely create, access, recover, or leave an account.
- **Hierarchy:** task/title → fields → primary action → recovery/alternate path → status.
- **Required states:** loading, validation, invalid credentials, unconfirmed email, recovery sent, expired/reset token, provider/config unavailable, signed-in redirect.
- **Accessibility/security:** autocomplete, password-manager support, accessible authentication, privacy-safe enumeration behavior, session recovery.
- **OPEN:** Google identity-linking UX and final session-management capabilities.

## Dashboard / Home skeleton

- **Purpose/user goal:** answer “What matters for me now?”
- **Target content:** state-sensitive summary, Focus, schedule context, Next, Keep in mind, Capture.
- **Required states:** morning/day/evening/clear, intelligence unavailable, partial schedule, no attention, loading/error.
- **OPEN:** route/name migration, clock/state rules, ranking, first beta intelligence slice.
- **Avoid:** metric dashboard, equal card grid, silent priority reshuffle.

## Today skeleton

- **Status:** NEEDS PRODUCT DESIGN.
- **Current:** route and UI exist.
- **Conflict:** target architecture assigns daily decision work to Plan and current-context action to Home.
- **Required decision:** retire, rename, or define a distinct nonduplicative job before redesign.

## Inbox skeleton

- **Purpose:** resolve clarification, approval, missing information, duplicate, decision, and conflict items.
- **Hierarchy:** reason → captured context → resolution actions → metadata/history link.
- **Required states:** populated groups, expanded item, resolving/pending/error, snoozed, empty.
- **Acceptance direction:** resolved items leave active queue; no capture-history or gamified Inbox Zero behavior.

## Tasks skeleton

- **Purpose:** find, create, edit, plan, start, complete, archive, or delete work.
- **Hierarchy:** query/filter context → tasks → frequent actions → secondary properties.
- **Required states:** active/completed/cancelled, overdue calculation, recurring/reminder states when implemented, account/local source, loading/empty/error.
- **OPEN:** combined Tasks & Notes IA, recurring editor, reminder UX, checklist and scheduling composition.

## Calendar skeleton

See [Calendar](CALENDAR.md). Its current UI is implementation evidence, not final design authority.

## Plan skeleton

- **Purpose:** decide how to use a selected day.
- **Required regions:** schedule, Focus/priorities, available time/capacity, Still to place, suggestions/proposal.
- **Interactions:** manual placement/rearrangement, edit estimate, inspect conflict, apply/adjust/not-now significant proposal.
- **States:** no plan, partial/unverified schedule, over-capacity, conflict, intelligence unavailable, empty/clear.
- **OPEN:** planning window, protected-time model, capacity presentation, proposal thresholds, mobile composition.

## Notes skeleton

- **Purpose:** capture and retrieve lightweight information and connect it to work.
- **Required states:** list/editor, create/edit/pending/error, empty, archived, account/local source.
- **Interactions:** search/filter, related task/link, selected-text-to-task when specified.
- **OUT OF SCOPE:** Notion-style databases, page builders, deep nesting, beta attachments.

## AI Chat skeleton

- **CURRENT:** scripted mock that explicitly lacks account-data access.
- **TARGET:** intelligence belongs inside workflows and Search/Ask Orvia; a standalone core chat is not approved.
- **Required decision:** remove/retain Labs preview and specify any future conversational surface, model/data boundary, reliability, and privacy before implementation.

## Finance skeleton

- **CURRENT:** local experimental functionality under Labs.
- **STATUS:** OUT OF BETA / NEEDS PRODUCT DECISION.
- **Boundary:** no payments, bank integrations, cloud claims, or core navigation promotion.

## Cars skeleton

- **CURRENT:** local experimental functionality under Labs.
- **STATUS:** OUT OF BETA / NEEDS PRODUCT DECISION.
- **Boundary:** no automated reminders, vehicle integrations, or core navigation promotion.

## Automation skeleton

- **CURRENT:** placeholder under Labs.
- **STATUS:** OUT OF BETA / NEEDS PRODUCT DECISION.
- **Boundary:** no claim that workflows, Telegram, reminders, or integrations are active.

## Search skeleton

- **Purpose:** retrieve permitted Tasks, Notes, Events, and Projects and move into relevant decisions.
- **Hierarchy:** query → scope/filter → results → contextual action.
- **States:** initial, loading, results, no results, partial source, error, permission-safe absence.
- **Security/privacy:** ownership/workspace boundaries; no query/content analytics; untrusted URL safety.
- **OPEN:** Ask Orvia beta slice, ranking/explanations, supported natural-language actions.

## Settings skeleton

- **Purpose:** inspect/control account, appearance, preferences, intelligence/privacy, notifications, integrations, data, and security.
- **Hierarchy:** categories → real current controls → impact/help → destructive account/data actions.
- **States:** saved/pending/error, unavailable capability, permission denied/revoked, destructive confirmation.
- **Rule:** implementation-dependent capabilities are labelled unavailable/planned rather than decorative active controls.
- **OPEN:** exact grouping navigation on mobile, provider-dependent session controls, integration and deletion implementation.

## Inventory maintenance

When a screen moves to DECIDED, create a separate specification from the template and replace its skeleton here with a link and short status. New screens require a Product Spec decision; code or a route alone does not add them to target IA.
