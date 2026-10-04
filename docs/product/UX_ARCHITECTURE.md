# Orvia — UX Architecture v1.0

**Status:** Draft for product-owner review

**Date:** 30 September 2026
**Last reconciled:** 1 October 2026

**Language:** English working draft; the Product Specification is canonical
**Scope:** Intended desktop and mobile web experience; this document does not verify current implementation or approve a release.

## 1. Purpose and authority

This document translates approved product/UX decisions and proposes unresolved experience architecture for review. It defines user jobs, navigation, major flows, recovery behavior, and boundaries for later design and engineering work. It is not a visual design, route map, data model, provider choice, or implementation claim.

[Product Specification v1.3](PRODUCT_SPEC.md) remains the canonical product source of truth. This document is still a draft: only decisions already recorded in the Product Specification or an explicitly approved feature scope are DECIDED. Other device placement, grouping, and interaction descriptions are TARGET proposals for product-owner review. Product Spec v1.1 records Calendar placement and the Calendar/Plan lead questions; v1.2 adds the design/quality foundation; v1.3 records the provider-free Calendar beta boundary and the reconciled authority chain. Approval of this document alone does not silently edit the Product Specification.

**Reading convention:** “Target” describes a proposed intended UX and is not automatically approved. “Beta” identifies a Product Spec beta requirement or an explicitly approved beta scope. “Later” means the Product Spec or an approved feature specification defers it. “Open” marks a choice this document does not settle. None of these labels means the feature currently exists.

## 2. UX principles

- Move the user from what is in their head to an appropriate next action: **Capture → Understand → Prioritize → Act**.
- Keep the experience calm, premium, focused, and trustworthy. Show **what matters → why → what can I do**; avoid a noisy dashboard, guilt, streaks, and manufactured productivity.
- Use intelligence inside useful workflows. AI-first does not mean AI-only; manual capture, editing, finding, planning, and acting must remain useful when intelligence is unavailable.
- Reduce organizational overhead. Propose sensible structure and a small Focus set without making users maintain a complex hierarchy.
- Give short, concrete reasons for important recommendations. Keep important changes visible and within the selected autonomy boundary.
- Default to **Assist**. In beta, propose significant planning or replanning changes and let the user decide; do not silently apply them. Preserve Edit/Undo where safe.
- Respect personal and protected time. Plan realistically rather than filling every available minute or treating all free time as work capacity.
- Make security, privacy, workspace context, and the consequences of permissions understandable to users.
- Keep Orvia distinct from a Jira workflow, Notion database, standalone AI chat product, or autonomous agent running the user's life.

## 3. Global information architecture

| Area | User job | Placement |
| --- | --- | --- |
| Home | What matters for me now? | Primary |
| Plan | What am I going to do, and how should I use available time? | Primary |
| Calendar | What does my time look like? | Primary |
| Inbox | What needs clarification, approval, or another decision? | Primary |
| Tasks & Notes | Find and manage the user's work and information | Primary library area |
| Search + Ask Orvia | Retrieve information and move into relevant decisions | Primary area |
| Settings | Control account, preferences, intelligence, privacy, and access | Primary destination; may occupy a quieter utility position |
| Capture | Get an unstructured thought into Orvia quickly | Global action, not a destination |
| Projects | See lightweight goal/context groups | Secondary; also in the library |
| Workspaces | Set or filter context | Compact context control, not a large destination |
| History / Timeline | Review prior actions and recovery context | Secondary |
| Feedback | Report bugs, confusion, and suggestions | Secondary; part of beta |
| Help | Find product guidance | Secondary |

Plan and Calendar may share schedule and availability context, but they answer different questions. Calendar is the factual time view; Plan supports decisions about the use of that time. The product areas and Calendar/Plan responsibilities are DECIDED in the Product Specification. The exact desktop/mobile grouping described below remains TARGET while this document is under review. Experimental Finance, Cars, AI Chat, Automation, and Labs do not become core navigation because code exists for them.

## 4. Desktop navigation

The TARGET compact sequence emphasizes **Home → Plan → Calendar**, followed by a prominent global **+ Capture** action and **Inbox**. A **Library** group exposes Tasks & Notes, Projects, and Search without becoming a long module list. A compact workspace/account control makes the active context visible and allows switching or choosing All workspaces. History, Feedback, and Help sit in secondary navigation. Settings remains a Product Spec primary destination even if presented in a quieter utility/account position; it must not become undiscoverable secondary content.

Capture is reachable from nearly anywhere. A keyboard shortcut is a target interaction; the exact key, conflict handling, and discoverability need design and technical assessment. Keyboard navigation and a visible focus state are required throughout. A contextual Search entry may also appear in relevant views.

## 5. Mobile navigation

The TARGET primary bottom navigation is **Home | Plan | + Capture | Calendar | Inbox**. Capture is the central global action. Tasks & Notes, Projects, Search, workspace switching, History, Feedback, and Help remain reachable through understandable secondary navigation; Search may additionally appear in headers or contextual actions. Settings remains a primary product destination reached through a clear utility/account entry on mobile. The exact secondary and utility navigation containers remain OPEN pending approval.

Mobile presents focused single-column flows, detail screens, and sheets or drawers where useful. It must preserve context and fast Capture without compressing a desktop sidebar or timeline into unreadable columns. For example, a desktop Plan can show timeline and Still to place together; mobile can prioritize the timeline and open Still to place separately. Workspace labels must remain visible or readily inspectable without a sidebar.

## 6. Workspace and time context

Workspaces are top-level user contexts. The default set is **Personal, Work, Business**; users can add, rename, or delete workspaces as the Product Spec defines. Items may belong to a workspace and optionally a Project. Home may show **All workspaces** by default, and the user can filter or switch context. An active workspace context constrains recommendations to that context. Every recommendation and item whose context matters should have a readable workspace label or equivalent text/icon cue; color alone is insufficient.

**Time context is separate from workspace.** A Personal item may be preferred during Daytime, Work hours, After work, or Evening. Preferences can evolve or be user defined. They are normally soft planning guidance: a user can schedule outside a preferred period. A basic work schedule may be asked during onboarding; learned timing preferences must remain visible and editable in Settings. The exact preference representation and learning mechanism are open technical/design questions.

## 7. Home

Home answers **“What matters for me now?”** with a familiar structure whose emphasis changes with time and context. It is not a generic metric dashboard.

| State | Main emphasis |
| --- | --- |
| Morning | Greeting/date, concise day summary, Focus, schedule, Keep in mind, Quick Capture |
| Daytime | “What should I do now?”, a recommended next action with estimated duration, priority/context, brief reason, Start, and alternatives |
| Evening | Calm day state and only remaining items that genuinely need attention |
| Clear | “You’re clear. Nothing needs your attention right now.” |

**Focus** is approximately 3–5 proposed high-value items to keep in mind, not a cap on the day's tasks or the full daily plan. The user can add, remove, or replace Focus items. Once proposed, Orvia does not silently change the day's main priorities; significant context changes lead to a proposal that the user can review. Home must still expose or link to all planned daily items beyond Focus. The recommended Next action may offer roughly 1–5 contextual options, such as Recommended, Quick win, and Alternative, with Start / Skip / Reschedule where relevant. **Start** changes a task to **In progress** as specified in the Product Spec. Optional Focus Mode may reduce surrounding UI while preserving critical context such as an upcoming meeting or important deadline.

Workspace context is clear on Home. An All-workspaces view may combine contexts, while a selected workspace narrows recommendations. The transition among morning, daytime, evening, and clear states is a presentation behavior; exact clock rules and ranking remain open.

If the user provides an energy/state signal, Home and Plan may adapt recommendations without diagnosing health conditions. Overdue work should appear as a small, actionable set (for example, Do / Reschedule / Still relevant? / Cancel or archive), not a stressful red dashboard. Repeated postponement can trigger a calm relevance check rather than escalating reminders indefinitely.

## 8. Plan

Plan is a decision surface for using time, not a plain todo list. Its primary Day experience combines calendar commitments, planned tasks, Focus/priorities, free or available time, time context, **Still to place**, and Orvia's planning suggestions. The user can edit the plan manually.

**Still to place** contains tasks belonging to the day without an appropriate planned slot. These tasks remain visible rather than being silently squeezed into the timeline. Orvia may suggest placements and explain why they fit. Deadline, planned time, and estimated duration retain different meanings (§14).

When planning changes are significant in beta, Orvia presents a proposed result with **Apply plan / Adjust / Not now** or equivalent actions. The user can inspect what moves, what stays, and the effect on available time before applying. A plan that exceeds realistic capacity should say so and suggest what to keep or move. It should not force every task into the remaining day.

## 9. Calendar

Calendar is a separate primary destination for factual time context, future schedule, and conflicts. The target experience includes Day, Week, and Month views; Orvia-created personal events; connected external-calendar events; and visible conflicts. Users can create personal events in Orvia.

The private-beta Calendar/Plan experience is provider-free under Product Spec v1.3 and the Calendar + Plan beta specification. Google read-only context is a gated post-beta follow-up; Outlook is later. When a provider is approved, Orvia uses permitted events as context and does not modify the source calendar. Calendar can show a conflict and offer a path to resolve it without pretending Orvia can change an external event. Exact provider architecture, permission details, refresh behavior, and failure semantics remain OPEN.

## 10. Time preferences and Protected Time

Time preferences guide suggestions without becoming hard scheduling restrictions. Example combinations include **Work / Work hours** for a report, **Personal / Daytime** for a dentist call, **Personal / After work** for gym, and **Personal / Evening** for reading. The user may override the preferred time.

The target UX supports **Protected** on an appropriate task, event, or time block. Protected means Orvia does not treat it as the first replanning candidate, does not repeatedly propose sacrificing it for work, and treats it like a strong commitment for planning purposes. It is still user editable. Creating or protecting a time block should be available from Plan/Calendar, with a possible “Respect my personal time when replanning” preference in Settings. The exact storage/classification model and the first-beta scope for Protected Time require design and feasibility work.

## 11. Adaptive replanning

Orvia should recognize material changes such as a task taking longer than estimated, a new or moved calendar event, an urgent commitment, or workload exceeding available time. It should calmly identify the issue, compare planned workload with realistically available time when capacity is the problem, and propose actionable alternatives. Example: **“Your plan is running about 50 min behind. I can adjust the rest of your day.”**

The proposal should show what remains, what would move, and why. Actions include **Apply changes / Review / Keep my plan**. For a new conflict, users should see possible resolutions rather than only an error. In beta, significant changes are proposals under Assist, not silent edits. The user may manually override recommendations.

Replanning distinguishes **flexible** items (for example reading or research) from **time-sensitive commitments** (for example meetings, appointments, same-day deadlines, or closing times). It normally moves flexible work first. If work overruns into personal or Protected Time, it should prefer moving lower-priority, non-urgent work instead of automatically consuming that time. Exact classification and conflict-scoring models remain open.

## 12. Universal Capture

**Implementation note, 4 October 2026:** The local Capture dialog exposes Auto, Task, Note, and Event and routes each to Inbox for review. Auto is deliberately unresolved because the repository has no reliable interpretation backend. The high/mixed-confidence flow below remains target UX. The local Event editor is shared by Calendar and account-backed Inbox conversion. Device-only captures stay local; account-backed Task, Note, and Event resolution requires an account capture, and signing in does not silently upload local content.

Universal Capture opens quickly from nearly anywhere with **“What's on your mind?”**, **Auto** by default, and optional **Task / Note / Event** types. The user need not choose an object type before typing. One input may create several objects, including a mix of events, tasks, and notes. The result shows a compact, understandable account of what Orvia created or needs clarified.

- **High confidence:** Create immediately and show the interpreted objects with **Edit** and **Undo**. Do not require a redundant Save step. Respect the selected autonomy and Product Spec permission boundaries for consequential actions.
- **Low confidence:** Do not guess; send the ambiguous part to Inbox and ask for clarification.
- **Mixed confidence:** Create clear objects, show them, and route only ambiguous parts to Inbox. Do not make the user re-enter the whole capture.
- **Processing failure:** Preserve the typed input and offer **Try again** and a safe **Save to Inbox** recovery path where supported. No claim of offline persistence or sync is implied.

Capture is not itself an Inbox history. History/Timeline can support audit and recovery without changing Inbox's purpose. Voice and external/mobile capture are target architecture. At least one convenient external or mobile-oriented capture channel is an aim before beta; its selection is open. Captured URLs are untrusted input and must never cause blind execution of external instructions or unsafe automatic interaction.

## 13. Inbox

Inbox is one understandable **attention queue**, grouped or labeled by reason rather than fragmented into many required tabs. Reasons include **Needs clarification, Needs approval, Missing information, Possible duplicate, Needs decision, Conflict**. It is not a log of every capture.

Where practical, an item can be resolved inline with contextual actions such as **Today, Tomorrow, Choose time, Merge, Keep both, Create project, Not now**, or **Apply conflict resolution**. Project creation remains a confirmed decision. **Snooze** offers Tonight, Tomorrow, and Custom. A resolved item leaves the active Inbox; History can retain appropriate context. Empty state: **“You’re all caught up. Nothing needs your attention.”** No guilt, streaks, confetti, or gamified Inbox Zero.

## 14. Tasks & Notes

Tasks & Notes is one primary library area with **All / Tasks / Notes** views and useful filters such as workspace, project, status, and date. The library supports finding and editing items without exposing every property at once. Secondary fields use progressive disclosure.

**Task UX** must account for the Product Spec fields: title, description, deadline, planned time, estimated duration, priority, workspace/project, status, reminder, recurrence, and checklist. It also accounts for time preference/context and Protected state where relevant. The distinctions are explicit:

| Property | Meaning |
| --- | --- |
| Deadline | When the task must be completed |
| Planned time | When the user intends to work on it |
| Estimated duration | How long the work is expected to take |

Task statuses are **To do / In progress / Done / Cancelled**. **Overdue** is calculated, not another status. Recurring tasks are a **beta requirement**; common recurrence belongs in the beta behavior, while custom recurrence and the exact editor UX remain later/open as the Product Spec states. Reminders are primarily properties of tasks/events, not a new primary object type.

**Notes** stay simple: rich text, workspace, optional project, related tasks/links. Selected note text can become a linked Task. Attachments are later. No Notion-style databases, complex page builders, or deep nested content architecture.

Archive removes an item from active work while preserving it for appropriate Search/Ask Orvia/history. Delete is a separate destructive action. The exact lifecycle and recovery behavior need feature-level criteria.

## 15. Projects and hierarchy

The hierarchy is shallow: **Workspace → optional Project → Task / Note**. Every item does not need a Project. Projects are lightweight goal/context containers showing related tasks, notes, upcoming items, and simple progress/context. No sprints, epics, story points, velocity, complex boards, or Jira workflows.

Orvia may suggest that related items become a Project, but creation or organization requires user confirmation. **Areas** such as Health or Learning are explicitly outside beta. Design should leave conceptual room for an Areas-like layer if later validated, without adding it to the present hierarchy.

## 16. Search + Ask Orvia

Search and Ask Orvia form one coherent retrieval experience. Ordinary keyword search and natural-language/personal retrieval can search **Tasks, Notes, Events, Projects** within the user's permitted scope. Useful filters include type, workspace, date, and status; natural-language queries should not require manual filter setup. Examples include finding a dentist note, asking what has been postponed, or finding unfinished Work items.

Results may lead to a transparent decision flow. For repeatedly postponed tasks, Orvia might offer **Review them**, followed by **Keep / Reschedule / Cancel**. Important actions discovered through a query require appropriate confirmation. No separate core AI Chat destination is introduced. The Product Spec describes a progression from keyword search toward personal retrieval; the exact beta slice, model/data architecture, access boundaries, and reliability criteria remain open. Search results must respect workspace privacy settings and authorization.

## 17. Settings

Settings uses a concise information architecture; the named groups below are target UX, and availability of individual controls follows beta scope and technical feasibility.

| Group | Intended controls and boundaries |
| --- | --- |
| Account | Profile, EN/UA language, default workspace where useful, sign-in identity/methods, sign out |
| Appearance | System / Light / Dark, restrained display preferences, reduced motion/system preference |
| Preferences | Work hours, preferred personal time, quiet hours, week start, useful defaults |
| Orvia Intelligence | Suggest / Assist (default) / Auto-plan; “How Orvia knows me” with editable relevant preferences; behavioral learning control and Reset learned preferences |
| Notifications | Critical attention / Useful / Ambient; optional Morning briefing and Evening review; available channels and quiet-hour behavior |
| Calendars & Integrations | Connected services, read-only external-calendar access and its impact, connection status |
| Data & Privacy | Export my data; AI/intelligence and behavioral-learning controls; archive management; Delete account and data |
| Security | Sign-in methods and password management; session management where actually supported |

**Productivity email is off by default** and requires opt-in. Auth/service emails are separate. Browser/desktop notification availability depends on permission and technical viability; mobile and Telegram channels depend on later clients/integrations. Notification timing and escalation remain open. If a notification permission is denied, the product remains usable.

Beta privacy controls include **global and workspace-level** intelligence choices, not per-task/per-note AI toggles. If a workspace is excluded from Orvia Intelligence, its content must actually be excluded from recommendation processing; a decorative switch is unacceptable. Users must understand how tasks, notes, calendar context, behavioral signals, integrations, and AI processing are used. **Reset learned preferences** and **Disable behavioral learning** are required and discoverable. Account/data deletion must describe its actual scope; local reset is not equivalent to cloud account deletion. Security controls that depend on auth/provider capabilities, especially session management, must be labeled as implementation-dependent until supported.

## 18. System states and recovery

Every major flow should define loading, empty, error, offline, permission-denied, intelligence-unavailable, success, and destructive-confirmation states as applicable. State messaging should say what happened, whether user input is retained, and the next safe action. Do not promise offline editing or sync before it is technically confirmed.

| Situation | Target response |
| --- | --- |
| Intelligence unavailable | “Orvia Intelligence is temporarily unavailable. Your tasks and notes are still available. You can continue manually.” Offer retry for the affected intelligent action. |
| Capture processing fails | Keep the input visible and recoverable; offer Try again or Save to Inbox where supported. |
| Calendar permission revoked | Explain which schedule context is missing; offer Reconnect or Continue without it. |
| Notification permission denied | Explain the limitation without blocking core use; preserve other available channels. |
| No current attention | Use the calm Home or Inbox empty messages in §§7 and 13. |
| Loading or request error | Preserve context, avoid duplicate actions, show a useful retry or manual route. |
| Successful action | Confirm the result concisely, with Edit/Undo where safe. |

Permission-denied states must distinguish missing external-service permission from account authorization. A hidden navigation link is not permission enforcement. Recovery behavior requires implementation-level validation for storage, auth, and failure modes.

## 19. Destructive actions

Prefer **Undo** for small reversible actions where safe, such as a task deletion with a real recovery path. Require explicit, clear confirmation for **Delete account and data**, destructive project/data deletion where applicable, disconnecting an important integration when data or behavior changes, and **Reset learned preferences**. The confirmation must describe scope and consequences accurately. Do not use dark patterns, obscure the cancel path, or present an unavailable Undo.

## 20. Accessibility, responsive behavior, and EN/UA

Desktop flows support keyboard navigation, visible focus, clear control names, and a conceptual Capture shortcut that does not conflict with input or assistive-technology behavior. Mobile flows use usable touch targets, focused reading order, and accessible sheets/detail screens. Important workspace, status, priority, and time-context distinctions use text or labels, not only color.

All major states and controls require screen-reader labels, sufficient contrast, reduced-motion behavior, and light/dark parity. Responsive layouts should be designed for the actual task on each screen size. EN/UA copy must remain understandable when Ukrainian labels expand; avoid layouts whose meaning depends on fixed English text length. These are acceptance criteria for future rendered reviews, not claims that existing UI passes them.

## 21. Beta versus target UX boundaries

| Capability | Boundary |
| --- | --- |
| Core loop, Home, Plan, Universal Capture, Inbox, Tasks, Notes, recurring tasks, reminders, Search, lightweight Projects, Workspaces, onboarding, EN/UA, responsive web, light/dark, feedback | Product Spec core beta. Intelligence need not be perfect, but beta must demonstrate Capture → Understand → Prioritize → Act. |
| Default Assist; significant beta replanning | Explicit beta behavior: proposed for user review, not silently applied. |
| Auth and privacy | Beta includes Google Sign-In, email/password, account recovery/session handling, privacy/security controls, privacy-safe analytics, Export my data, and Delete account and data. |
| Calendar | Primary destination. The [Calendar + Plan beta specification](CALENDAR_PLAN_BETA_SPEC.md) defines the provider-free first-beta slice; external Google context is gated until after beta and Outlook is later. Local implementation progress does not establish release acceptance. |
| External/mobile capture | Aim for one convenient channel beyond the standard web flow before beta; channel selection remains open. Voice is target architecture, not a promise for the first beta. |
| Notifications | Conceptual levels, quiet hours, user controls, productivity email opt-in; desktop/browser where technically viable. Mobile/Telegram channels depend on clients/integrations. |
| Adaptive intelligence, Protected Time, natural-language retrieval, Focus Mode | Target experience and approved UX behavior. Exact first-beta slices, dependencies, and testable thresholds need feature specifications and feasibility assessment; do not imply the full target exists in beta. |
| Attachments, custom recurrence, bidirectional calendar sync, native mobile apps, full Telegram if another channel is chosen, team/enterprise PM, full autonomous agents | Explicitly later or outside initial beta under the Product Spec. |

The beta plan must not quietly drop a Product Spec beta requirement because a target experience is difficult. Equally, this UX architecture does not declare Calendar, Plan, channel, or intelligence implementation/release validation complete.

## 22. Product Spec reconciliation and unresolved decisions

### Reconciliation completed in Product Spec v1.1

**Calendar placement and lead questions:** Calendar is a separate **primary** area on desktop and mobile. Calendar answers **“What does my time look like?”**; Plan answers **“What am I going to do / how should I use my available time?”** Product Spec v1.1 records both decisions.

### Reconciliation completed in Product Spec v1.3

**Private-beta provider boundary:** Calendar and Plan beta are provider-free. Google read-only context is a gated post-beta follow-up; Outlook is later. Exact future provider, permission, refresh, revocation, and integration architecture remains OPEN.

### Clarifications consistent with the Product Spec

- Plan retains the Product Spec's timeline behavior: meetings/events, planned tasks, available/free time, priorities, and Still to place.
- The Product Spec's approximately 3–5 daily priorities are **Focus**, not a cap on all planned tasks. User edits are explicit; Orvia does not silently reshuffle the main priorities.
- The desktop/mobile navigation placement of Tasks & Notes, Search, and Settings changes their presentation, not their availability as product areas.
- High-confidence Capture creates with Edit/Undo under §§10 and 32. Product Spec §11's Approve all / Review remains relevant where autonomy, confidence, or a consequential action calls for it; it is not a redundant Save gate for a clear capture.
- Time context, Protected Time, flexible versus time-sensitive commitments, and global/workspace privacy controls add UX detail. They do not settle a data model or silently expand the committed beta implementation.

### Product Spec decisions that remain open

The following remain open: which external/mobile capture channel enters beta; exact Priority Engine scoring; confidence thresholds; recurring-task editor UX; notification timing/escalation; Google OAuth account linking; future Calendar provider/integration architecture; AI/model/data architecture; monetization/pricing; final brand identity/logo; and design-token choices explicitly marked open in the design foundation. None should be inferred from examples in this document.

### Implementation and interaction design questions for later assessment

- How are workspace filtering, cross-workspace search, excluded-workspace intelligence boundaries, and user authorization enforced consistently?
- What data and UX model distinguish deadline, planned time, duration, time preference, flexible commitment, and Protected Time without excessive task-form clutter?
- How are conflicts, capacity, travel/buffer time if applicable, and replanning proposals computed and explained reliably? What constitutes a “significant” change?
- How are multi-object Capture, partial confidence, Undo, duplicate handling, input preservation, and safe URL handling implemented and tested?
- What provider, permission, refresh/error, and revocation model should govern the gated post-beta Google read-only capability?
- What is the first-beta Search/Ask Orvia scope, retrieval quality bar, and confirmation model for suggested actions?
- Which keyboard shortcut, mobile secondary-navigation pattern, and recurring-task editor serve accessibility and discoverability best?
- Which notification channels and quiet-hour exceptions are feasible at beta, and how are denied/revoked permissions handled?
- What are the exact account/data export, deletion, archive, and session-management capabilities and user-visible consequences?
- What recovery can be guaranteed when intelligence, network access, or capture processing fails? Offline editing/sync remains unpromised.

## 23. UX acceptance principles

A feature-level specification can be accepted for implementation only when a new user can understand **what happened, why it matters, and what they can do next** without relying on hidden AI behavior or documentation. For the core experience, review against these principles:

1. **Fast first value:** The user can capture before choosing Task/Note/Event, see what was understood, correct or undo it, and reach an actionable item.
2. **No lost attention:** Ambiguous parts reach Inbox; resolved items leave it; Still to place and non-Focus daily work remain discoverable.
3. **Realistic planning:** Plan distinguishes commitments from flexible work, shows available time, identifies over-capacity days, and proposes changes without silently taking personal/Protected Time.
4. **Control and trust:** Significant beta replanning is reviewable; important changes, privacy boundaries, and integration access are understandable. Actions requiring confirmation get it.
5. **Useful without intelligence:** Manual task, note, calendar-context, search, and plan paths remain navigable when intelligent features fail, subject to the actual supported offline/network behavior.
6. **Accessible on both form factors:** A mobile user can complete the same core job without desktop layout compression; keyboard and assistive-technology users can reach actions and understand context.
7. **Both languages and themes:** EN/UA and light/dark preserve hierarchy, labels, states, and contrast in actual rendered screens.
8. **Evidence before release:** Automated checks, manual functional checks, accessibility review, representative rendered visual review, security/privacy validation, and production verification are separate gates. No one gate substitutes for another.

These are architecture-level criteria. Each implemented flow still needs explicit behavior, failure cases, measurable acceptance criteria, and validation against real rendered UI. Product-owner visual approval remains the release gate described in Product Spec §61.

## 24. Core end-to-end UX journeys

### A. First useful loop

**Capture → Understand → Task/Note/Event → Plan/Home → Start → Complete → Next.** A new user enters an unstructured thought, sees the interpretation and any correction path, finds the resulting object in the relevant context, and receives an appropriate next action. Start moves a task to In progress. Completion feedback is calm and the next recommendation is relevant, or Home honestly says the user is clear. This journey is the activation experience; signup alone is not activation.

For a new account, the provider-free private-beta flow remains short: **Welcome → Basic preferences → Notifications → Autonomy → First Capture**. When an approved provider connection exists, the TARGET flow may add **Connect calendar (optional, with Skip)** after Basic preferences. The product remains usable without a connected external calendar.

### B. Ambiguous capture

**Capture → low confidence → Inbox → clarify → object created → leaves Inbox.** The ambiguous part is preserved and presented with a concise question. A mixed-confidence capture may create clear objects immediately while only unresolved parts appear in Inbox. The user resolves inline where practical; the active Inbox then clears that item.

### C. Day replanning

**Plan disruption → detect conflict or capacity issue → explain → propose changes → user reviews/accepts → Plan updates.** The proposal shows the realistic capacity comparison, what stays, what moves, and why. **Keep my plan** is available. A significant beta change is never silently applied.

### D. Protected personal time

**Work overruns → intersects personal/Protected Time → prefer moving flexible work → user can override.** Orvia keeps a strong commitment visible, explains the tradeoff, and does not repeatedly suggest sacrificing it. The user may manually choose to use personal time.

### E. Intelligence unavailable

**Intelligence fails → manual product remains useful → input is preserved where relevant → retry/recovery.** A failed Capture attempt retains the text and offers Try again or Save to Inbox where supported. Existing tasks and notes remain usable when their underlying data access is available. The UI does not falsely promise offline editing or synchronization.

### F. Calendar permission revoked

**Permission revoked → impact explained → Reconnect or Continue without it.** The Calendar and Plan indicate missing external context, avoid presenting stale context as current, and keep supported manual planning available.

## 25. Approval and next specification work

This remains an English UX architecture draft for broader product-owner review. Calendar placement and Calendar/Plan wording are recorded in Product Spec v1.1; Product Spec v1.3 records the provider-free beta slice from the Calendar + Plan specification. Device-specific grouping and other TARGET proposals in this draft require approval before they become UX authority. Future changes follow Product Specification → approved UX Architecture → feature/technical specification → Design Foundation → screen specification → implementation. A Ukrainian companion remains future documentation work.
