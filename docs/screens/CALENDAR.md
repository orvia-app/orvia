# Calendar Screen Specification

**Status:** PARTIALLY DEFINED; CURRENT implementation exists; visual acceptance pending
**Authority:** [Product Specification §§7–8, 54, 57–61](../product/PRODUCT_SPEC.md), [UX Architecture §§8–9](../product/UX_ARCHITECTURE.md), [Calendar + Plan beta technical specification](../product/CALENDAR_PLAN_BETA_SPEC.md)
**Design contracts:** [Master Design System](../design/MASTER_DESIGN_SYSTEM.md), [Responsive](../design/RESPONSIVE_SYSTEM.md), [Accessibility](../design/ACCESSIBILITY_SYSTEM.md), [Content & i18n](../design/CONTENT_AND_I18N.md)
**Human visual acceptance:** NOT REVIEWED — no final approval/evidence record

## 1. Purpose, user goal, and product role

Calendar answers **“What does my time look like?”** It is a PRIMARY factual schedule surface. Plan answers how to use that time. Calendar is not a generic task board, event-creation-first app, or source of Plan state.

## 2. Current implementation

The local working tree currently provides:

- authenticated owner-scoped `/api/schedule` consumption;
- explicit planning-timezone confirmation/change;
- Day, Week, and Month views with previous/next/Today navigation;
- planned Task intervals and Orvia Event projection;
- busy/free Event and planned Task visual distinctions;
- all-day items, cross-midnight projection, current-time indication, and Month detail;
- loading, empty, unavailable, partial/stale/unverified source states;
- desktop week columns and a separate narrow/mobile adaptation.

This is source-reviewed implementation evidence. It does not prove live database completeness, final accessibility, production behavior, or visual acceptance. Event creation/editing is not in the current Calendar UI.

## 3. Design target

### Hierarchy

1. Calendar time surface and scheduled items.
2. Current date/range and view context.
3. Range navigation and Day/Week/Month control.
4. Timezone and source-completeness context.
5. Global application chrome.

The Calendar must feel like one product surface. The title is compact and unboxed. Navigation, range label, view switch, and quiet timezone affordance form a cohesive toolbar. Supporting status does not dominate factual data unless the schedule is unavailable.

### Shared visual language

- Day and Week use the same time scale, typography, item vocabulary, all-day treatment, and current-time language.
- Week shows seven readable columns on desktop. Day/date hierarchy is stronger than grid lines; today is identifiable but restrained.
- Month favors dates and item previews over boxed-cell chrome. A selected date exposes readable detail.
- Busy Event is a clear commitment. Free Event is softer and explicitly free. Planned Task differs through text/icon/treatment rather than color alone.
- Violet marks selection, focus, or deliberate Orvia action; it is not applied to every block.
- Grid structure uses quiet hairlines, spacing, and subtle surfaces. Empty Calendar retains the useful time/date structure.

## 4. Layout and actions

| Region | Contract |
| --- | --- |
| Header | Compact title; optional secondary context only when useful; no hero card |
| Toolbar | Previous/next + Today; centered/contextual range; Day/Week/Month; quiet confirmed timezone/change affordance |
| Source state | Quiet inspectable disclosure for unverified/partial; prominent scoped recovery for unavailable/error |
| Day | All-day lane when applicable; readable time gutter; focused timeline; restrained current-time indicator |
| Week | Seven desktop columns; aligned day headers/all-day lane/timeline; horizontal structure remains quiet |
| Month | Date grid/structure with today, previews, overflow, selection, and detail hierarchy |

Primary actions are date/range navigation and view selection. Timezone change is secondary. Event creation/editing and Task scheduling actions require their own approved interaction criteria before being added.

## 5. States

| State | Required presentation |
| --- | --- |
| Loading | Preserve Calendar geometry when useful; one accessible loading status; controls avoid duplicate requests |
| Empty | Keep time/date structure; restrained “Nothing scheduled…” message; no invented create flow |
| Unverified | Show factual returned data; quiet disclosure that source coverage/trust eligibility is unverified |
| Partial/stale | Identify affected source and limitation; no complete-day/capacity claim; retry/inspect path |
| Unavailable/error | Prominent within Calendar scope; selected range/timezone retained; clear Retry |
| Timezone unconfirmed | Explicit first-time confirmation; device zone is a suggestion, not silently persisted preference |
| Conflict | Calm visible relationship and readable explanation; no automatic mutation |
| Permission revoked (future provider) | Explain missing external context; Reconnect or Continue without it |

## 6. Interaction and keyboard

- Range changes preserve active view and planning timezone.
- Today uses the planning timezone.
- Month-date activation opens readable date detail without implying deadline-only Tasks occupy time.
- Timed items expose title, type, local time, busy/free, source/workspace where relevant, and accessible interval labels.
- Cross-midnight items remain one identity and appear on each intersected day.
- Toolbar and view selection work by keyboard with visible focus; Calendar navigation does not require pixel/drag interaction.
- Future drag/resize requires keyboard/non-drag alternatives, valid previews, conflict feedback, and separate deadline semantics.
- Motion follows the global motion system; view changes remain prompt; reduced motion removes spatial movement.

## 7. Responsive

- Desktop Week: seven readable columns and quiet time gutter; the Calendar dominates the viewport.
- Tablet: retain multi-day view only while headers, blocks, and targets remain readable; otherwise move to a focused composition.
- Mobile: use a focused day/list composition or equivalent approved pattern. Do not compress seven columns. Preserve range context, view switch access, current day, source state, and item semantics.
- Sticky regions do not cover items or focus. Test software keyboard if timezone editing is present.

## 8. Themes, content, and accessibility

Light mode must avoid empty white spreadsheet appearance. Dark mode uses layered charcoal without violet glow or lost grid hierarchy. Both modes preserve busy/free/task distinction and current-time visibility.

EN/UA copy uses the centralized dictionary. Dates/times use active locale and explicit planning timezone. Ukrainian labels may wrap without pushing the Calendar below unnecessary chrome.

Use semantic headings/regions, accessible toolbar names, programmatic selected view, readable item labels, color-independent types/statuses, screen-reader status for loading/error, visible focus, and a non-grid mobile reading path. Full keyboard, screen-reader, contrast, zoom, and reduced-motion acceptance remains unverified.

## 9. Security, privacy, and analytics

Calendar reads authenticated owner-scoped data. UI visibility never authorizes access. Exact titles/times, task/event content, queries, tokens, email, URLs, source errors, and arbitrary metadata do not enter analytics or monitoring. Provider permission and intelligence eligibility are separate from owner-authorized display. Do not expose service-role credentials or claim source completeness without evidence.

## 10. Acceptance criteria

- The Calendar surface visually dominates global chrome and supporting metadata.
- Header plus toolbar use less vertical space than the working Calendar at representative desktop height.
- Previous/next, Today, range, view, and timezone read as one coherent control system.
- Day and Week share time/item/grid language; Month clearly belongs to the same system.
- Desktop Week contains seven readable columns; mobile uses an intentional noncompressed composition.
- Today, current time, busy/free, planned Task, all-day, different durations, and cross-midnight intervals remain distinguishable without color alone.
- Empty state retains Calendar structure and feels deliberate.
- Unverified/partial status is honest and restrained; unavailable state is prominent and recoverable.
- Selected date, view, timezone, and user context survive loading/retry as specified.
- EN/UA, light/dark, desktop/mobile, loading/empty/populated/partial/error, keyboard/focus, contrast, zoom, and reduced motion are reviewed with recorded evidence.
- Automated correctness does not establish visual acceptance; Maksym approves representative real renders.

## 11. Open design decisions

- Final Calendar geometry, density scale, and exact token adoption after rendered review.
- Week start preference and locale/settings behavior.
- Event create/edit entry, form composition, conflict resolution, archive/delete recovery.
- Task scheduling manipulation and mismatch resolution between `plan_day` and derived day.
- Month overflow/detail interaction on each form factor.
- Accessible keyboard model for dense desktop time grids.
- Provider/source status UI after external calendars are approved.

## 12. Out of scope

Provider OAuth, Google/Outlook writes, advanced sync, attendees, locations, event descriptions, travel/buffer intelligence, autonomous replanning, and redesign of unrelated AppShell surfaces.

## Implementation observations / follow-up

- The current Calendar visual correction has automated validation but no completed human desktop light/dark and mobile light/dark acceptance.
- The Calendar currently exposes read-only viewing; UX Architecture's Event creation target is not implemented in this UI.
- Source state is intentionally unverified because live completeness/privacy eligibility has not been established.
