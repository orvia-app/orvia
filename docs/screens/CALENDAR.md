# Calendar Screen Specification

## Document control

- **Status:** DECIDED for the stated TARGET screen contract; §23 decisions remain OPEN
- **Date:** 1 October 2026
- **Authority:** [Product Specification §§7–8, 54, 57–61](../product/PRODUCT_SPEC.md) → approved decisions in [UX Architecture §§8–9](../product/UX_ARCHITECTURE.md) → [Calendar + Plan beta technical specification](../product/CALENDAR_PLAN_BETA_SPEC.md) → this screen specification
- **Design contracts:** [Master Design System](../design/MASTER_DESIGN_SYSTEM.md), [Design Tokens](../design/DESIGN_TOKENS.md), [Component System](../design/COMPONENT_SYSTEM.md), [Motion](../design/MOTION_SYSTEM.md), [Responsive](../design/RESPONSIVE_SYSTEM.md), [Accessibility](../design/ACCESSIBILITY_SYSTEM.md), [Content & i18n](../design/CONTENT_AND_I18N.md), [Interaction Patterns](../ux/INTERACTION_PATTERNS.md)
- **Supporting UX references:** [Visual References](../design/VISUAL_REFERENCES.md), [UX Principles](../ux/UX_PRINCIPLES.md), [Information Architecture](../ux/INFORMATION_ARCHITECTURE.md), [Screen Spec Template](SCREEN_SPEC_TEMPLATE.md), [Screen Inventory](SCREEN_INVENTORY.md)
- **Quality contracts:** [UI Acceptance Criteria](../quality/UI_ACCEPTANCE_CRITERIA.md), [Visual QA](../quality/VISUAL_QA.md), [Definition of Done](../quality/DEFINITION_OF_DONE.md)
- **CURRENT evidence reviewed:** `src/app/app/calendar/`, `src/components/calendar/`, `src/lib/calendar-view.ts`, `src/app/globals.css`, `src/components/AppShell.tsx`, `src/lib/i18n.ts`
- **Human visual acceptance:** NOT REVIEWED — no final approval/evidence record

This document is the Calendar screen authority within the hierarchy above. It defines presentation and interaction only where higher documents provide a product or feature boundary. It does not authorize application, API, database, provider, or migration work.

## 1. Purpose

### Product role

Calendar is Orvia's **factual temporal surface**. It answers **“What does my time look like?”** by presenting user-owned Orvia Events and Tasks that have real planned intervals. Calendar provides schedule context to Plan without becoming Plan or storing Plan state.

The domain boundaries are DECIDED:

- **Calendar:** temporal reality and source completeness; what occupies or appears in time.
- **Plan:** intention, priorities, capacity, Still to place, and decisions about how to use time.
- **Task:** work object with deadline, optional `plan_day`, optional `planned_start`, and optional duration.
- **Event:** scheduled temporal object with timed or all-day bounds, timezone, busy/free meaning, and its own lifecycle.

### User jobs and questions

1. Understand the selected day, week, or month in the active planning timezone.
2. See when Events and planned Task intervals occur, including overlaps and cross-midnight intervals.
3. Distinguish commitments, free Events, and planned work without relying on color.
4. Inspect whether displayed schedule data is complete, partial, stale, unavailable, or unverified.
5. Move between periods and views without losing date, timezone, or source context.
6. Reach the source Task and, once its separate interaction is specified, inspect an Event.

### Relationship to adjacent areas

| Area | Supported relationship |
| --- | --- |
| Home | May consume the shared factual schedule projection for current context. Calendar does not define Home recommendations. |
| Plan | Uses the same schedule projection. Calendar shows factual intervals; Plan owns priorities, capacity, Still to place, manual planning, and proposals. Neither screen reads the other's component state. |
| Tasks | A Task appears in the time grid only when it has a valid planned interval. Calendar may link to the source Task. Deadline-only Tasks do not occupy time. |
| Inbox | A conflict may require attention, but the exact Calendar-to-Inbox handoff is not specified. Calendar does not become an attention queue. |
| Notes | Notes are not Calendar objects. A Note affects Calendar only through separately created/linked Tasks or Events. |
| Search / Ask Orvia | Search may retrieve permitted Events and Tasks. Calendar does not define retrieval ranking or natural-language behavior. |
| Orvia Intelligence | Factual owner-authorized display is separate from recommendation eligibility. Excluded content must not enter recommendations; Calendar may still display it when the user is authorized. |

### Actions

- **CURRENT primary actions:** previous/next range, Today, Day/Week/Month switching, date selection, opening Day from Week/Month, opening a source Task.
- **CURRENT secondary actions:** confirm/change the session planning timezone, inspect source status, retry a failed request.
- **TARGET beta actions supported by the feature specification:** inspect an Event and reach Event create/edit/archive/delete flows. Their entry points and form/detail composition remain OPEN and are not invented here.

Calendar is not responsible for prioritization, capacity calculation without an approved planning window, Still to place, silent scheduling, changing Task deadlines, resolving every conflict, provider management, or autonomous replanning.

## 2. Information hierarchy

| Level | Content | Visual prominence contract |
| --- | --- | --- |
| **Primary** | Selected temporal context plus the Day/Week/Month schedule surface and scheduled items | Occupies most usable content area; highest sustained information weight; remains visible when the schedule is empty. |
| **Secondary** | Current range, view selection, previous/next/Today controls | Easy to find and operate, but smaller and quieter than the calendar surface and items. |
| **Tertiary** | Time labels, weekday labels, all-day label, workspace/source/type metadata | Supports scanning; uses secondary/caption roles; never competes with title or item identity. |
| **Contextual** | Selected date/item, conflict or source limitation, Month detail, timezone editor | Appears near the affected scope; gains prominence only while action or recovery is required. |
| **Utility** | Planning timezone and source-detail disclosure | Compact and inspectable. It recedes when valid and becomes visible enough to resolve ambiguity or failure. |
| **Decorative** | None required | No decorative gradients, glow, illustration, or motion. Every line, fill, icon, and surface must communicate structure, state, or action. |

Within an item, title precedes time/type/state metadata. Within the page, temporal context precedes controls, controls precede source metadata, and calendar content dominates global AppShell chrome. Error or unavailable state may temporarily interrupt this order because the primary content cannot be trusted.

## 3. Desktop page composition

### Page frame

- **TARGET:** Calendar uses the available authenticated content width rather than the standard narrow reading width. It remains inside AppShell gutters and does not create a second full-page shell.
- The page title is compact, unboxed, and aligned with the calendar frame. It orients; it is not a hero panel.
- Calendar is one coherent working surface. Avoid a card for every toolbar group, day, source message, or empty state.
- The calendar frame uses the primary surface. A boundary may distinguish it from the canvas; shadow is unnecessary unless a system elevation decision justifies it.

### Header and toolbar

1. Page header: `Calendar` plus a compact confirmed timezone affordance.
2. Toolbar: range navigation on the leading side, selected range as the central semantic anchor, view switch on the trailing side.
3. Source status: one scoped row/disclosure below the toolbar when incomplete, stale, unavailable, or unverified; absent when complete.
4. Calendar surface: view-specific header/all-day/timed or month structure.

The toolbar stays visually subordinate to the calendar content. The date/range label is stronger than individual control labels. The timezone control and normal source status use muted treatment. Source status never competes with the range unless the Calendar is unavailable.

### Relational geometry

- The time gutter is the narrowest timeline column and wide enough for localized time plus a repeated-offset disambiguator.
- All day columns share equal width in desktop Week.
- Day headers align with their day columns; all-day cells align with both.
- Grid separators are lower contrast than item boundaries and text.
- Internal control spacing is tighter than the separation between toolbar groups.
- Exact gutter width, row height, minimum item height, frame radius, and viewport threshold remain OPEN token/geometry decisions under §23.

### Scrolling

- Desktop Day and Week use one vertical schedule scroll region so time alignment remains stable.
- Week headers and the all-day region remain outside the timed vertical scroll when present.
- Page scrolling must not create competing nested horizontal and vertical scroll traps.
- Initial positioning may reveal current time when today is visible, otherwise the earliest scheduled interval; it must not hide earlier content or prevent reaching midnight.

## 4. Day view

### CURRENT

- One local day is rendered as a 23/24/25-hour timeline derived from real timezone instants.
- An all-day lane appears only when all-day items exist and is sticky within the Day scroll region.
- Hour labels form the time gutter; repeated DST labels include an offset.
- Timed overlaps use deterministic columns. The view initially scrolls near current time or the earliest interval.
- Cross-midnight items are clipped visually to the day while retaining one item identity.

### TARGET

- The full localized date is the Day identity in the toolbar/range position.
- All-day content appears before timed content in one clearly labelled region. Busy/free meaning remains explicit there.
- The timed grid covers the real local-day duration. Hour markers support scanning and remain subordinate to items.
- Event and planned Task geometry is proportional to the intersecting portion of the interval. A short item's treatment may protect legibility but must not imply a longer duration; its explicit time remains accessible.
- Empty periods remain visible as useful temporal structure. They are not filled with cards or encouragement.
- Current time uses a restrained line plus a non-color accessible label. It appears only when the displayed day contains the current instant.
- Cross-midnight items appear in each intersected day with consistent identity and clipped boundaries; accessible text communicates the actual full interval.
- If source data is partial, stale, unavailable, or unverified, the Day view follows §9 and never claims a complete day or available capacity.

### OPEN

- Exact minimum visual item height and label-collapse rules.
- Exact Day mobile representation: spatial timeline or chronological agenda when the gutter/content can no longer remain readable.
- Event detail/create/edit surface and direct manipulation.

## 5. Week view

Week is the primary dense Calendar surface on desktop.

### CURRENT

- Monday-start seven-day desktop grid; weekday/date buttons open Day.
- Shared all-day row appears only when needed.
- One vertically scrolling timed region contains seven equal columns at 48 current pixels per hour.
- Overlapping intervals receive stable side-by-side columns; current day has a soft accent background.
- Below the current 1150 px breakpoint, Week becomes a seven-day stacked agenda.

These measurements and breakpoints are implementation evidence, not target tokens.

### TARGET desktop contract

- Seven readable equal day columns remain visible together. The time gutter stays narrower than one day column.
- Day headers show localized weekday and date. Header identity is stronger than column separators. Activating a header opens that Day.
- Today is identifiable through date treatment and a restrained column cue. It does not tint every item or overpower selected state.
- **Weekend treatment:** no separate target treatment is approved. Until decided, weekends use the same structural weight as weekdays, except normal today/selection states.
- The all-day region aligns with the seven columns and appears only when at least one visible all-day item exists. It must not become an independently scrolling strip.
- Timed items preserve vertical time position. Intersecting items share width in stable, deterministic columns; they do not fully cover one another.
- Item title remains the first readable line. Metadata collapses before title; the full accessible label retains type, actual time, busy/free, source timezone when relevant, and workspace context.
- Exact minimum item height is OPEN. Any visual minimum must preserve actual time text and must not create false interval length.
- Titles may truncate visually in dense columns, with the full accessible name and an inspectable non-hover-only path. Clipped content must not be recoverable only through a tooltip.
- The timed region uses one vertical scroll. Day headings and all-day context remain aligned outside it.
- Empty days retain the same column and time structure. Do not render seven independent empty-state cards.
- Current-time treatment aligns across the visible current-day column without creating a global alarm line.
- Source state applies to the Week range as a whole and identifies affected sources; it is not repeated in each day column.

### Responsive boundary

When seven columns can no longer preserve readable headers, item identity, focus visibility, and touch/keyboard targets, Week must recompose. The exact target transition width and choice between the CURRENT seven-day agenda and a focused-day Week navigator remain OPEN.

## 6. Month view

### CURRENT

- A six-row, 42-date grid begins on Monday and includes adjacent-month dates.
- Each cell shows up to two title previews plus an overflow count; narrow mobile replaces previews with semantic dots.
- Today has an accent date marker; selected date has a soft accent surface.
- Selecting a cell updates a detail section below; `Open day` switches to Day.

### TARGET

- The toolbar range label provides month/year identity; do not duplicate a decorative month hero.
- Seven localized weekday headers align to a compact date grid. Week-start behavior follows the approved preference; the current Monday behavior is CURRENT, while the target decision remains OPEN.
- Cells prioritize date number, then a bounded number of compact Event/Task previews, then a clear overflow count.
- The target maximum visible preview count is OPEN and must be selected through density testing. It remains consistent for cells with equivalent available space.
- Month previews communicate Event/Task and busy/free meaning using text, icon/shape, and border/fill where space allows. Color alone is insufficient.
- Month is a date-level overview, not a miniature Week timeline: no hour gutter, proportional duration height, or compressed overlap columns.
- Today and selected date are different states. Today is temporal context; selected date indicates user focus. Both remain distinguishable in both themes.
- Adjacent-month dates recede without becoming unreadable or appearing disabled.
- Selecting a date exposes a readable chronological detail region or focused detail surface and preserves access to Day. Exact placement by form factor remains OPEN.
- Empty dates retain cell structure without repeated “empty” messages.
- On mobile, Month may keep a compact seven-column date grid only while date targets and state cues remain usable; item details move to the selected-date region. Exact label-versus-dot treatment remains OPEN.

## 7. Event system

### Event anatomy

| Element | Contract |
| --- | --- |
| Type | Explicit Event identity in accessible text; a familiar event icon may supplement it. |
| Title | First visual text; never replaced by source or status. |
| Time/duration | Timed Event shows start–end in the active display zone; all-day Event says `All day`. Full interval stays in the accessible name. |
| Timezone | Shown when the Event's origin timezone differs from the active planning timezone or ambiguity otherwise matters. |
| Busy/free | Explicit text/icon/shape treatment; not color alone. |
| Source | Orvia source is factual; future external source must remain distinct and read-only. |
| All-day | Lives in the all-day region; remains one Event identity across intersected dates. |
| Lifecycle | Archived/deleted Events are absent from active Calendar. Recovery/retention remains OPEN. |
| Workspace | Shown or inspectable when present and useful; never treated as authorization. |

### Visual variants

- **Busy Event:** solid leading marker or boundary, quiet semantic fill, `Event`/`Busy` text in expanded contexts, and full accessible state. It reads as a commitment.
- **Free Event:** explicit `Free event` text in expanded contexts, dashed or otherwise non-solid boundary, quieter fill, and full accessible state. It remains visible but does not look like occupied capacity.
- **All-day Event:** compact horizontal item in the all-day region, labelled `All day`; it retains busy/free distinction using the same non-color vocabulary.

Accent violet is not the default fill for every Event. Selection/focus and important Orvia actions retain accent priority. Exact Event palette values remain governed by semantic tokens and rendered contrast review.

### Interaction states

| State | TARGET behavior |
| --- | --- |
| Default | Title and essential semantics are readable at the available density. |
| Hover | Fast surface/boundary feedback only; no displacement; reveals no essential hover-only content. |
| Focus | Immediate visible outline independent of item fill; full accessible name; not clipped by the item/container. |
| Pressed | Immediate restrained press feedback; no persistent semantic change. |
| Selected | Persistent non-color shape/outline treatment distinct from focus and today; exact detail surface is OPEN. |
| Unavailable/stale source | Factual cached/returned item may remain visible only with source limitation at the appropriate scope; do not imply freshness. |
| Disabled | Not a normal Event state. Read-only future-provider Events remain inspectable and explicitly read-only rather than visually disabled. |

Event create/edit/archive/delete is a beta feature requirement, but its Calendar entry point, form, confirmation, recovery, and detail composition are OPEN. Inline creation is not approved.

## 8. Task system

### Domain semantics

- A Task remains a work object even when projected into Calendar.
- A valid `planned_start` plus `estimated_duration_minutes` creates a planned interval and may appear in the timed grid.
- `plan_day` without a valid interval means **Still to place**. It consumes planning demand but no Calendar time.
- `dueDate` is a deadline. It never creates a Calendar interval, all-day item, or planned start.
- Moving a planned interval must never change the Task deadline implicitly.

### Calendar treatment

- Planned Task intervals use explicit Task icon/text vocabulary, a semantic boundary/fill distinct from busy and free Events, and the same proportional temporal geometry.
- Title is first; `Planned task`, start–end, duration where useful, and workspace context are secondary.
- Selecting a CURRENT planned Task opens its source Task through an ordinary link. The final target Task scheduling/detail destination follows its separate specification.
- Completed, cancelled, archived, or deleted Tasks are absent from active Calendar projection.
- Cross-midnight planned Tasks remain one Task identity and render in every intersected day.

### Unplaced and deadline-only Tasks

- They do **not** appear in timed or all-day Calendar lanes.
- Still to place belongs to Plan. If a future Calendar surface exposes assigned-but-unplaced Tasks, it must be a clearly labelled non-temporal region and requires an explicit product/screen decision.
- Deadline-only Tasks may be discoverable through Tasks, Home, Plan, Search, or reminders; Calendar must not imply that a deadline occupies time.

Direct Task placement, drag/drop, resize, estimate editing, and `plan_day` mismatch resolution from Calendar remain OPEN.

## 9. Source states

Source completeness applies to the requested range and identified sources, not to the account generally.

| State | Meaning | TARGET presentation |
| --- | --- | --- |
| Complete | Every required source reports complete coverage for the range | No persistent success banner. Calendar content stands on its own. |
| Incomplete | Projection completeness is incomplete or a source is partial/unavailable | Quiet but visible scoped notice; name affected source/limitation; no complete-day, conflict-free, free-time, or capacity claim. |
| Stale | A source reports data that may not be current | Treat as incomplete; state staleness and offer an approved refresh/retry path without hiding factual returned data. |
| Unavailable | All required sources unavailable, or the request cannot provide trustworthy Calendar content | Replace the factual surface with a scoped unavailable state while retaining range, view, timezone, and Retry. Never render an empty Calendar as success. |
| Unverified | Factual rows exist, but source coverage or intelligence eligibility has not been verified | Quiet inspectable disclosure; display authorized factual data; disable completeness-dependent claims. |
| Loading | Request for the selected context is pending | Preserve stable toolbar and useful Calendar geometry; expose one accessible status; prevent duplicate requests. |
| Error | Request/validation failed independently of source metadata | Retain range/view/timezone; explain Calendar scope and Retry; do not expose raw errors or clear prior user context. |

Warning treatment is reserved for a real recoverable limitation. Unverified status uses neutral information treatment unless evidence supports higher severity. Source detail is disclosed once at range scope, not repeated on every item.

## 10. Empty and failure states

| Situation | TARGET content and composition |
| --- | --- |
| Completely empty Calendar | Preserve current view structure. State that no scheduled Events or planned Task intervals were returned for the selected range. Do not add an unapproved create action. |
| Empty Day | Keep the all-day/timed structure and time scale; use one quiet Day-scoped message outside item lanes. |
| Empty Week | Keep seven columns, headers, and time scale; use one range-scoped message rather than seven empty cards. |
| Empty Month | Keep weekday/date grid and selected-date detail; do not repeat messages in every date cell. |
| Unavailable source | Follow §9; absence must not look like a successful empty range. |
| Loading | Preserve range/view controls and stable geometry; announce loading once. |
| Error | Retain context and offer Retry; identify only the affected Calendar scope. |
| Partial data | Render factual available items plus a scoped limitation; never use `Nothing scheduled` as a completeness claim. |

Approved copy intent is **state → limitation/context → supported next action**. Avoid generic `No items`, celebratory emptiness, guilt, illustrations, or actions the current product cannot perform.

## 11. Toolbar and controls

| Control | Hierarchy and behavior |
| --- | --- |
| Date/range label | Primary toolbar context; localized; updates with view/range; announced politely after user navigation. |
| Previous / Next | Secondary frequent controls grouped together; move exactly one Day, Week, or Month; accessible names include direction/range meaning. |
| Today | Secondary frequent control; selects today in the planning timezone without changing the active view. |
| Day / Week / Month | Secondary segmented control with programmatic pressed/selected state; view names remain visible. |
| Timezone | Utility control; compact when confirmed; expands to a labelled field only when confirmation/change is needed. Device zone is a suggestion until persisted preferences exist. |
| Source state | Utility/status disclosure; absent when complete, quiet when unverified/partial, prominent when unavailable. |

No Calendar control is styled as a dominant mutation while the current screen is read-only. A future Event-create entry requires the OPEN decision in §23. Keyboard behavior uses native buttons and logical DOM order; exact grid arrow-key navigation remains OPEN.

## 12. Responsive composition

Breakpoints follow content stress. Current `1150/760/640 px` rules are CURRENT evidence, not target breakpoint decisions.

### Desktop

- Calendar uses the wide working area; Week shows seven columns simultaneously.
- Header, toolbar, source state, day headers/all-day region, and timed region form one aligned surface.
- Day and Week may use a spatial timeline; Month uses the date grid plus selected-date detail.
- Vertical schedule scrolling is contained and predictable. No page-level horizontal scroll is introduced.

### Tablet

- Toolbar may reflow into two rows while range context remains first in reading order.
- Week retains seven columns only while headers, item titles, focus, and targets remain readable. Otherwise it switches to the approved mobile/focused composition.
- Secondary metadata collapses before type/title/time meaning.
- Exact transition width and whether Month detail is adjacent or below remain OPEN.

### Mobile

- Page is a focused single-column journey inside the CURRENT AppShell; the Calendar specification does not redesign global navigation.
- Range context appears before previous/next/Today and view switching. Controls wrap/recompose; labels are not reduced below readable size.
- Day shows one chronological day with all-day items first. The exact agenda-versus-spatial timeline treatment is OPEN.
- Week never renders seven compressed columns. CURRENT behavior is a seven-day stacked agenda; the TARGET choice between that pattern and a focused-day Week navigator remains OPEN.
- Month may retain a compact seven-column date grid with selected-date detail only if targets and states remain usable; item previews may become semantic markers with accessible counts. Exact treatment remains OPEN.
- Time stays adjacent to item content; a separate narrow gutter is used only if it remains readable.
- Primary/frequent touch targets aim for 44×44 CSS px and satisfy the accessibility contract.
- Sticky regions respect safe areas and do not cover the final item, focus indicator, mobile navigation, or software keyboard.
- Intrinsic two-dimensional horizontal scrolling is allowed only with a readable focused alternative. It is not the default mobile Week solution.

## 13. Light and dark themes

Both themes preserve identical hierarchy and semantics; dark mode is not a numeric inversion.

| Element | Light target | Dark target | Shared rule |
| --- | --- | --- | --- |
| Canvas/frame | Soft neutral canvas; clear primary surface | Layered charcoal canvas/surface | Calendar working surface is distinct without heavy shadow. |
| Grid/borders | Quiet neutral separators | Quiet separators visible against adjacent layers | Grid is weaker than item boundary, focus, text, and current-time cue. |
| Primary text | High-contrast neutral | High-contrast light neutral | Title/time meaning remains readable at dense sizes. |
| Muted text | Readable secondary neutral | Readable secondary neutral | Never hides essential type, source, or failure meaning. |
| Accent | Restrained selection/focus/today/action | Restrained, nonsaturated selection/focus/today/action | No violet glow; accent is not the universal Event color. |
| Busy/free/Task | Semantic surfaces plus text/icon/shape | Equivalent semantic hierarchy on dark surfaces | Distinction does not depend on hue. |
| Today | Restrained date/context treatment | Same prominence, adjusted for dark surface | Separate from selected state. |
| Hover | Local surface/boundary feedback | Local surface/boundary feedback | No layout movement. |
| Focus | Measured visible indicator | Measured visible indicator | Must remain visible next to each item/control fill. |

Exact future palette, elevation, and contrast pair values follow Design Tokens and remain OPEN until measured in representative renders.

## 14. Motion

Calendar uses the global motion tiers; it introduces no independent duration values.

| Trigger | Purpose | TARGET motion | Tier | Reduced motion |
| --- | --- | --- | --- | --- |
| Day/Week/Month switch | Confirm view change while preserving orientation | Immediate content replacement or restrained fade; no full-page slide required | Instant/Fast | Instant replacement; no transform |
| Previous/next period | Show updated temporal context | Optional short directional transition only if it measurably aids orientation | Fast; exact recipe OPEN | Instant replacement |
| Hover/press | Confirm targetability/action | Surface/border change and restrained press feedback | Fast/Instant | Color/border change only |
| Focus | Make keyboard position explicit | Focus indicator appears immediately | Instant | Same behavior |
| Event/Task state change | Preserve identity when data refreshes | No animation unless a later mutation flow defines causal insertion/removal | Instant or Normal when approved | Instant replacement |
| Loading → content/error | Communicate resolved request | Stable geometry with local status/content replacement; no staged item cascade | Normal maximum | Instant/short opacity only |
| Source status change | Make limitation visible at correct scope | Local disclosure/content update; no pulsing warning | Fast | Instant update |

Motion never delays navigation, continuously animates the current-time line, animates every item on range change, or carries meaning alone.

## 15. Accessibility

- Calendar uses a named page/region, labelled toolbar, meaningful headings, and native buttons/links before custom roles.
- Previous/next/Today, view switch, timezone, source disclosure, date cells/headers, and item links/controls are keyboard reachable in logical reading order.
- Focus is immediate, visible, unobscured, and restored when any future transient detail surface closes.
- View selection exposes programmatic selected state. Today uses `aria-current="date"`; selected date remains a separate programmatic state.
- Item accessible names include type, title, full time/all-day state, busy/free, relevant timezone, source/read-only state, and workspace when useful.
- Screen readers receive one useful loading/error/source-status announcement, not every grid line or skeleton.
- The spatial grid has an ordered reading alternative on mobile and must not require pixel navigation. Exact desktop grid arrow-key model remains OPEN; Tab access through every dense item must be usability-tested before acceptance.
- Busy/free/Event/Task/today/selected/conflict/source states use text, icon/shape, or programmatic state in addition to color.
- Text, meaningful non-text boundaries, and focus indicators require measured contrast in both themes.
- Core inspection remains usable at 200% zoom/reflow. Intrinsically spatial two-dimensional behavior requires a focused alternative.
- Frequent mobile controls aim for 44×44 CSS px and meet the WCAG 2.2 target-size contract or document a valid exception/equivalent.
- Reduced-motion behavior follows §14. No compliance claim is made until rendered keyboard, screen-reader, contrast, zoom, touch, and motion verification completes.

## 16. Content and i18n

- All user-facing strings use the central EN/UA dictionary. English and Ukrainian keys ship together.
- Weekday and month names, full dates, range labels, counts, and times use locale-aware formatting in the active planning timezone.
- Time format follows locale/user preference when implemented; the screen does not hardcode an English-only 12/24-hour convention.
- DST repeated times include sufficient offset/zone distinction. Different Event-origin timezone is visible when relevant.
- `Event`, `Busy`, `Free event`, `All day`, and `Planned task` retain consistent domain meaning in both languages.
- Source states distinguish complete, partial/incomplete, stale, unavailable, unverified, loading, and request error. Do not translate them into one generic failure.
- Empty copy names the temporal scope: selected day, week, month, or range. It does not say only `No items`.
- Ukrainian expansion may wrap toolbar, source, item metadata, Month detail, and state copy. Layout changes before meaning is truncated.
- User titles are not translated, altered to fit chrome, or included in telemetry.
- Screen-level linguistic and rendered review remains required; dictionary-key parity is insufficient.

## 17. Interaction model

### DECIDED / TARGET

- Previous/next moves one unit of the active view; Today returns to today in the planning timezone without changing view.
- Day/Week/Month switching preserves the selected date and planning timezone.
- Week day-header activation opens that Day. Month date selection exposes detail; `Open day` enters Day.
- Cross-midnight segments activate the same source identity.
- Planned Task activation reaches the source Task. Future Event activation must inspect the Event without treating it as a Task.
- Source disclosure opens/closes without moving focus unexpectedly. Retry repeats only the affected request.

### CURRENT limitations

- Events are focusable groups but have no detail/edit action.
- Planned Tasks link to Tasks.
- Calendar has no create, edit, archive, delete, drag/drop, resize, recurrence, or provider-management UI.
- Timezone confirmation is session-level rather than a persisted preference.

### OPEN / not implementation authority

- Event create/edit entry and detail container.
- Direct manipulation: drag/drop, resize, keyboard move, and confirmation/Undo behavior.
- Inline creation.
- Task scheduling manipulation from Calendar.
- Recurrence inspection/editing and occurrence identity UI.
- Provider connection/permission management.
- Dense-grid arrow-key navigation and selection model.

No OPEN interaction may be inferred from common calendar products or added during visual implementation.

## 18. Security and privacy

- Calendar is authenticated and consumes owner-scoped schedule data. UI route visibility is never authorization.
- Server operations derive owner identity from validated authentication; client-supplied owner identity is rejected/ignored according to the feature specification.
- Event, Task, projection, conflict, export, and account-deletion paths retain owner isolation. Service-role access requires explicit owner filters.
- Source completeness and owner authorization are distinct. A workspace filter or hidden item is not an authorization boundary.
- Factual display permission is distinct from Orvia Intelligence eligibility. Workspace-excluded content must be removed before recommendation processing.
- Titles, exact times, task/event content, search queries, email, URLs, tokens, raw errors, and arbitrary metadata remain out of analytics, monitoring, and visual QA artifacts.
- Future provider tokens remain server-side. The provider-free beta has no public seed/provider endpoint or client credential path.
- This screen specification references the feature security contract rather than replacing RLS, API ownership, lifecycle, export, deletion, or production validation.

## 19. Visual target

These are observable implementation rules, not a request to imitate another product.

### Hierarchy and rhythm

- The schedule occupies the largest continuous surface and has greater sustained visual weight than the page title, toolbar, timezone, or source notice.
- Range identity anchors the controls. Day headers, time labels, grid lines, item surfaces, and metadata step down predictably from it.
- Repeated columns and time rows establish rhythm. Spacing changes mark conceptual boundaries; extra cards do not.
- Toolbar groups read as one system through alignment and spacing, not separate floating pills.

### Density

- Week favors scan density: compact headers, concise item labels, aligned time, and low-chrome columns.
- Day can expose more item metadata because one column has more width.
- Month limits previews and uses overflow instead of compressing every item.
- Metadata collapses before title/type/time semantics. Target size, focus, and readable body/caption roles are never sacrificed for density.

### Surfaces and borders

- Canvas, Calendar surface, and temporary/elevated surfaces have distinct roles. The Calendar does not become a stack of inset cards.
- Grid lines communicate time alignment at lower contrast than item boundaries.
- Item fills are quiet semantic surfaces. Busy/free/Task distinction combines boundary style, icon/text, and semantic fill.
- Border radius follows the system's subtle/standard roles; time blocks do not become large rounded cards.
- Shadows are reserved for real layering or a future selected overlay, not every Event.

### Typography and controls

- Page title uses the shared compact page-title role. Range uses section-title emphasis. Day/date header and item title use stronger weight before color.
- Time labels and metadata use readable secondary/caption roles with tabular alignment where useful.
- Previous/next/Today and view selection are visible but visually quieter than the range and schedule.
- Timezone and normal source status recede. Error/unavailable state becomes prominent only because primary data cannot be trusted.

### Accent and whitespace

- Accent identifies keyboard focus, selection, today, and deliberate Orvia action. It is not applied to every Event, header, or separator.
- Empty space communicates unscheduled time. It is not filled with decorative copy or containers.
- Whitespace between toolbar and schedule establishes hierarchy; whitespace inside dense Week remains economical and consistent.

## 20. CURRENT versus TARGET

| Area | CURRENT | TARGET | Status |
| --- | --- | --- | --- |
| Page composition | Wide page, compact title, bordered Calendar frame | One dominant working surface with aligned header/toolbar/status/view regions | TARGET DECIDED; exact geometry OPEN |
| Toolbar | Three-column desktop; reflows at current breakpoints | Range is semantic anchor; navigation/view secondary; timezone/source utility | TARGET DECIDED |
| Week | Seven-column desktop grid; below 1150 px becomes seven-day agenda | Seven readable desktop columns; focused noncompressed narrow composition | Desktop TARGET DECIDED; mobile pattern OPEN |
| Day | Spatial timeline with all-day lane and auto-scroll | Same factual structure with explicit density, state, accessibility, and responsive contracts | TARGET DECIDED; mobile form OPEN |
| Month | 42-date Monday grid, two previews, overflow, detail below | Compact scannable date overview with bounded previews and readable selected-date detail | TARGET DECIDED; week start/max previews/detail placement OPEN |
| Events | Busy/free/all-day visual cues; Events are focusable, not actionable | Explicit anatomy and non-color semantics; beta detail/CRUD entry after separate interaction decision | Visual TARGET DECIDED; interaction OPEN |
| Tasks | Planned intervals shown; Task links to Tasks | Planned interval only; explicit work-object identity; deadline/planDay semantics protected | TARGET DECIDED; manipulation OPEN |
| Source states | Loading/error panels; partial/unverified disclosure; unavailable suppresses surface | Seven-state contract preserving context and preventing completeness claims | TARGET DECIDED |
| Empty states | Range/Day copy plus retained grid | Scope-specific intentional empty treatment; no invented action | TARGET DECIDED |
| Responsive | Current CSS uses 1150/760/640 px; Week agenda; Month markers | Content-stress transitions; desktop/tablet/mobile preserve job and semantics | Principles DECIDED; exact breakpoints/patterns OPEN |
| Dark mode | Semantic variables and Calendar styles exist | Equal hierarchy/meaning with measured contrast and no violet glow | TARGET DECIDED; acceptance NOT REVIEWED |
| Motion | Global page/control motion; no Calendar-specific transition system | Global tiers only; restrained view/status changes; explicit reduced motion | TARGET DECIDED; directional recipe OPEN |
| Accessibility | Native controls, labels, focusable Events, Task links, status roles | Full keyboard/read-order/item-label/contrast/zoom/touch contract | TARGET DECIDED; grid key model and verification OPEN |
| Interaction model | Read-only Calendar; date/range/view/timezone/source/Task navigation | Preserve these; add approved Event lifecycle entry later; no inferred direct manipulation | Current factual; additions OPEN where listed |

## 21. Acceptance criteria

The 48 criteria below require separate evidence. Automated validation alone cannot establish visual, accessibility, security, or human acceptance.

### Visual — 8

- **V1:** At representative desktop height, the Calendar working surface occupies more area and visual weight than global chrome, page title, toolbar, timezone, and normal source status.
- **V2:** Range identity is visually stronger than navigation buttons, view-switch labels, time labels, and source metadata.
- **V3:** Day headers are stronger than grid separators; item surfaces are stronger than grid separators in both themes.
- **V4:** Busy Event, free Event, planned Task, and all-day Event remain distinguishable in grayscale and without relying on color.
- **V5:** Today and selected date remain distinct states in Day/Week/Month and both themes.
- **V6:** Empty Day/Week/Month retains useful temporal structure and does not resemble a broken or unfinished screen.
- **V7:** Accent is limited to focus, selection, today, and approved Orvia actions rather than every Event or control.
- **V8:** Repeated spacing, alignment, typography, borders, and item geometry use system roles without page-specific arbitrary values.

### Functional — 8

- **F1:** Previous/next moves exactly one active-view period while preserving view and planning timezone.
- **F2:** Today selects the current planning-zone date without changing the active view.
- **F3:** Day/Week/Month switching preserves selected date and planning timezone and updates the localized range label.
- **F4:** Every active interval intersecting the range appears on each intersected day without duplicate source identity.
- **F5:** Planned Task intervals appear; `plan_day`-only and `dueDate`-only Tasks do not occupy timed/all-day lanes.
- **F6:** Month date selection exposes readable detail and a path to Day without implying deadline-only occupancy.
- **F7:** Planned Task activation reaches the correct owned Task; Event activation is not claimed until its interaction is implemented.
- **F8:** Timezone changes regroup displayed instants without rewriting stored instants, deadlines, or explicit `plan_day`.

### States — 6

- **S1:** Complete sources show no persistent success banner.
- **S2:** Loading preserves range/view controls and useful geometry, announces once, and prevents duplicate requests.
- **S3:** Partial/stale/unverified data identifies the limitation and never makes a complete-day, conflict-free, free-time, or capacity claim.
- **S4:** Total source unavailability cannot be mistaken for a successful empty Calendar; context and Retry remain available.
- **S5:** Request error retains range, view, timezone, and safe retry while exposing no raw error.
- **S6:** Empty range/day/week/month messages identify scope and add no unsupported create action.

### Responsive — 6

- **R1:** Desktop Week preserves seven readable aligned columns without page-level horizontal overflow.
- **R2:** Tablet recomposes before headers, item identity, focus, or targets become unreadable.
- **R3:** Mobile Week never displays seven compressed timeline columns and provides a readable focused/agenda alternative.
- **R4:** Mobile toolbar preserves range context and reachable previous/next/Today/view controls without clipping in EN or UA.
- **R5:** Month remains scannable on mobile, with selected-date details readable outside compact cells.
- **R6:** At 320, 375, 768, and 1440 CSS px, no sticky region covers items, focus, source recovery, or final content.

### Accessibility — 7

- **A1:** Every Calendar control and actionable item is keyboard reachable with visible, unobscured focus.
- **A2:** View, today, selected date, expanded source detail, loading, and error states are programmatically exposed.
- **A3:** Item accessible names include type, title, actual interval/all-day state, busy/free, relevant timezone, and source/read-only context.
- **A4:** Spatial information has a coherent DOM/reading order and a non-pixel-dependent narrow-screen path.
- **A5:** Text, meaningful boundaries, current time, and focus meet measured contrast requirements in both themes.
- **A6:** Core inspection remains usable at 200% zoom/reflow, with any intrinsic two-dimensional surface providing a focused alternative.
- **A7:** Screen-reader, keyboard, touch-target, and reduced-motion evidence is recorded; no compliance claim is made from source inspection.

### Content and i18n — 4

- **I1:** All applicable Calendar strings have EN and UA keys with reviewed meaning, pluralization, dates, times, and source states.
- **I2:** Long Ukrainian labels and long user titles wrap/recompose without hiding actions or schedule meaning.
- **I3:** Dates/times use active locale and planning timezone; ambiguous repeated times expose offset/zone context.
- **I4:** Empty/error/source messages distinguish absence, partial data, unverified coverage, unavailability, and request failure.

### Motion — 4

- **M1:** View and period changes complete within the approved global motion tiers and do not delay interaction.
- **M2:** Hover, press, focus, loading, and source changes use only the Calendar-specific purposes defined in §14.
- **M3:** Reduced motion removes spatial transitions, item cascades, transform feedback, and smooth scrolling while retaining state meaning.
- **M4:** No continuous, decorative, attention-seeking, or meaning-only animation appears.

### Privacy and security — 5

- **P1:** Calendar displays only data returned through authenticated owner-scoped boundaries; client owner identity does not authorize access.
- **P2:** Partial/hidden/workspace-filtered UI never substitutes for API/RLS ownership enforcement.
- **P3:** Recommendation eligibility remains separate from authorized factual Calendar display.
- **P4:** Analytics, monitoring, logs, and QA artifacts contain no titles, exact sensitive schedule content, email, URLs, tokens, raw errors, or arbitrary metadata.
- **P5:** Provider-free beta behavior works with no provider credentials or external connection and makes no provider completeness claim.

## 22. Calendar visual QA checklist

Use synthetic, non-sensitive fixtures and record route/build, viewport, theme, locale, state, reviewer, date, result, evidence link, and limitation. Final acceptance is recorded in this document's **Human visual acceptance** field.

### Required render matrix

| Form factor/theme | Day | Week | Month |
| --- | --- | --- | --- |
| Desktop Light | Required | Required | Required |
| Desktop Dark | Required | Required | Required |
| Mobile Light | Required | Required | Required |
| Mobile Dark | Required | Required | Required |

Add Tablet Light/Dark when composition differs materially from either desktop or mobile.

### Fixture/state coverage

For every applicable view, cover:

- completely empty range and empty individual day;
- populated ordinary density and dense/overlap density;
- busy timed Event;
- free timed Event;
- planned Task interval;
- all-day Event;
- different durations, including the shortest supported interval;
- cross-midnight Event and planned Task;
- overlap cluster with deterministic readable ordering;
- today, selected date, and today+selected combination;
- long title and long Ukrainian title/toolbar/source copy;
- complete source state;
- partial and stale source state;
- unverified source state;
- unavailable source state;
- loading and request error;
- timezone unconfirmed/change state and different-origin Event timezone;
- DST 23-hour and 25-hour days where supported by fixtures;
- keyboard focus across toolbar, dates, items, source disclosure, and Retry;
- 200% zoom/reflow and representative screen-reader reading order;
- normal motion and reduced motion.

### Review checks

- **Desktop Light/Dark:** hierarchy, seven-column readability, gutter alignment, grid contrast, overlap width, all-day alignment, source scope, vertical scroll, range/control balance.
- **Mobile Light/Dark:** intentional Week/Day composition, touch reachability, toolbar wrapping, Month detail, safe areas, no compressed desktop grid, no covered focus/content.
- **Day:** real-day duration, current time, empty periods, all-day lane, short/cross-midnight items.
- **Week:** seven aligned columns on desktop, today, overlap, empty days, shared scroll and source range.
- **Month:** weekday/date scan, adjacent month, today versus selected, bounded previews, overflow, empty dates, selected-date detail.
- **Themes:** equivalent hierarchy, readable muted text, semantic state parity, no glow, measured contrast.
- **Human gate:** all Blocker/Major defects resolved, remaining limits recorded, and Maksym decision linked above. Until then visual status remains NOT REVIEWED.

## 23. Open decisions

Only the following unresolved decisions may block or constrain implementation. They must not be settled through CSS or component code:

1. Final Calendar density scale, time-row rhythm, gutter width, minimum visual item height, label-collapse rules, frame geometry, and adoption of still-OPEN tokens.
2. Week-start preference and locale/settings behavior. Monday is CURRENT implementation only.
3. Whether weekends receive distinct treatment; the interim target uses equal structural weight.
4. Event inspect/create/edit entry point, detail/form composition, conflict resolution, archive/delete confirmation, recovery, and retention behavior.
5. Selection detail surface for Events and Month dates by form factor.
6. Drag/drop, resize, keyboard move, inline creation, confirmation, and Undo behavior.
7. Task scheduling manipulation from Calendar and reconciliation when explicit `plan_day` differs from the planned instant's local day.
8. Exact narrow/mobile Day and Week architecture, including stacked seven-day agenda versus focused-day Week navigation.
9. Month preview maximum, label-versus-marker treatment, overflow/detail placement, and tablet composition.
10. Dense desktop grid arrow-key/selection model and acceptable Tab-stop density.
11. Recurring Task occurrence representation and editor UX; custom recurrence remains later.
12. Planning-window setup/default, Protected Time representation, and capacity presentation. Until decided, Calendar makes no capacity claim.
13. Post-beta Google provider, permissions, refresh, revocation, source-status UI, and data lifecycle. Outlook remains later.
14. Exact directional period-transition recipe, if rendered evidence shows it improves orientation.
15. Final light/dark semantic mappings, measured contrast, and human visual acceptance.

## 24. Out of scope

- Changing Calendar, Plan, Event, Task, API, database, RLS, migration, or AppShell implementation in this documentation batch.
- Provider OAuth or external-calendar connection in private beta.
- Google/Outlook writes, bidirectional sync, advanced refresh/sync, and Outlook integration.
- Team scheduling, attendees, locations, Event descriptions, travel time, buffer intelligence, and autonomous replanning.
- A unified Task/Event entity or rendering deadline-only Tasks as occupied time.
- Plan priorities, Focus, Still to place, free-capacity calculation, and planning proposals inside Calendar.
- Full provider management, recurrence editing, reminder delivery, or notification settings.
- Offline Calendar editing or synchronization guarantees.
- Redesign of AppShell, Home, Plan, Tasks, Inbox, Notes, Search, or other screens.
- Custom/advanced recurrence. Common recurring Tasks remain a separate beta requirement and must avoid duplicate projected occurrences.
- Production, accessibility-conformance, security-isolation, or visual-acceptance claims based on this specification alone.

## Decision status summary

- **DECIDED:** Calendar/Plan responsibility; Task/Event separation; provider-free beta; shared factual projection; Day/Week/Month; hierarchy, visual invariants, source-state behavior, semantic item distinctions, theme/responsive/accessibility/content/motion requirements, acceptance and QA gates.
- **CURRENT:** Read-only Day/Week/Month UI; session timezone confirmation; owner-scoped schedule request; planned Task and Event projection; deterministic overlap columns; Week agenda below the current breakpoint; Month previews/detail; source states; EN/UA strings; semantic themes.
- **TARGET:** The implementation-oriented screen contract in §§1–22, subject to the cited authority and OPEN decisions.
- **OPEN:** Only the decisions collected in §23.
- **OUT OF SCOPE:** §24.

## Implementation observations / follow-up

- CURRENT Calendar visual behavior has source and automated validation evidence but no completed human desktop/mobile light/dark acceptance.
- CURRENT AppShell navigation still uses Dashboard/Today terminology. This screen specification does not resolve or redesign global navigation.
- CURRENT Events are keyboard focusable but not actionable; planned Tasks link to Tasks. Do not claim Event inspection/editing until its separate interaction is implemented and validated.
- CURRENT source coverage remains unverified; factual display does not establish completeness or recommendation eligibility.
