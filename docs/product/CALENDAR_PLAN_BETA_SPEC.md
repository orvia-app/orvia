# Orvia — Calendar + Plan private-beta technical specification

**Status:** Draft for review; specification only, not an implementation or release claim
**Date:** 30 September 2026

## 1. Purpose, authority, and evidence

The authority chain is **[Product Spec v1.1](PRODUCT_SPEC.md) → [UX Architecture v1.0](UX_ARCHITECTURE.md) → this technical specification → implementation and acceptance validation**. The approved private-beta scope supplied for this document resolves the first-beta Calendar slice left open in Product Spec §54 and UX Architecture §21. Product Spec §8 describes Google/Outlook read-only access for broader v1; the approved beta scope here gates Google until after beta and leaves Outlook for later. This is a release-scope distinction, not a change to the read-only product boundary. This document does not settle other open Product Spec decisions. Calendar and Plan must remain useful with no external calendar connection.

**Target versus current:** Everything below labeled “shall” is intended behavior, not a claim that it exists. A focused source check found `tasks.due_date` is a SQL `date`. The Task type has optional `plannedStart`, `estimatedDurationMinutes`, and `planDay` alongside the existing deadline `dueDate`; Task scheduling, Event, Schedule Item/projection, and interval/conflict domain contracts and validation exist. Batch 2 adds a forward migration for nullable Task scheduling columns and a user-owned `orvia_events` table with temporal checks, lifecycle marker, owner RLS, and grants. Existing Task API reads use `select("*")`; the client mapper now retains scheduling values returned by the database. Task scheduling writes, Event API operations, Calendar and Plan routes/UI, capacity implementation, and external providers do not yet exist. Task APIs still expose no scheduling write input, reminder, or recurrence; `activities` records historical actions; and the current priority engine takes only a `todayDateKey`, with no availability input. Task APIs already authenticate and apply owner filters, while task RLS exists; the new Event migration has static and disposable PGlite checks, but no live Supabase ownership test. Current date parsing accepts timestamps for `dueDate` and converts them to a UTC date, which is inadequate for the planning timezone rules below. The focused source search found no external calendar provider/OAuth infrastructure. These are repository observations, not live database or production verification.

Product Spec v1.1 already lists Calendar in primary navigation. UX Architecture v1.0 §22 still describes that canonical update as pending; the newer Product Spec resolves that documentation discrepancy. The UX document also calls itself a draft for review; this specification uses its stated approved UX decisions and the explicit approved scope in the request, without treating its status line as a release approval.

## 2. Scope boundaries

| Stage | Included |
| --- | --- |
| **Beta required** | Separate primary Calendar; user-owned Orvia Events; Day/Week/Month; Orvia Events and planned Tasks in Calendar; daily Plan using the same schedule projection; Task deadline, planned time, and estimated duration kept distinct; manual placement/rearrangement and Still to place; basic conflict and capacity awareness; workspace and privacy boundaries; review before significant replanning; functional baseline without providers. |
| **Post-beta / gated follow-up** | Google Calendar read-only/busy-time context, subject to a separate provider, permissions, privacy, and feasibility decision. It is not a beta blocker. |
| **Later** | Outlook; bidirectional external writes; advanced provider sync; custom/advanced recurrence; travel and buffer intelligence; richer automatic replanning. |
| **Non-goals for this feature slice** | A unified Task/Event entity; deadline-as-calendar-block; optimization engine; provider OAuth design; team scheduling, attendees, locations, or event descriptions; autonomous rescheduling; offline editing or sync guarantees. Other Product Spec beta requirements, including common recurring Tasks and reminders, remain requirements of their own feature work and are not silently removed here. |

## 3. Domain model and Task semantics

**Task** is work to do, with status, priority, workspace/project context, optional deadline, optional intended work day/time, and optional estimated duration. **Event** is a time commitment owned and edited in Orvia. They need distinct lifecycle, validation, and meaning: completing a Task is not ending an Event, and moving a commitment is not changing a work deadline. Do not put both into one persistence entity.

**Schedule Item** is a normalized, computed view of an active Event or a planned Task interval; it is not a third persisted content entity. **Calendar** renders factual time and conflicts: “What does my time look like?” **Plan** combines that schedule with intended work, priorities/Focus and available time to answer “What am I going to do / how should I use my available time?” Neither UI is the other's data source.

Task fields and invariants for this slice:

| Concept | Meaning and rule |
| --- | --- |
| `deadline` / existing `due_date` | A valid **local date** by which work should be completed. Never reinterpret it as planned start, duration, or occupied time. Changing a significant deadline follows the Product Spec confirmation boundary. |
| `planned_start` | Nullable UTC instant for intended work start. Present only when a real time slot has been selected. |
| `estimated_duration_minutes` | Nullable positive, bounded estimate. It can exist without a planned start. A scheduled interval requires both start and duration; end is calculated, not an independently edited deadline. |
| `plan_day` | Nullable **explicit planning assignment**: “This is work I intend to address on this local planning date.” It may exist without `planned_start` and supports Still to place. It is neither a deadline nor a Calendar interval, and is never inferred solely from a deadline. A scheduled Task's displayed Calendar day is derived from `planned_start` in the active planning timezone; if that day differs from an existing explicit assignment, do not silently rewrite either value. Resolve the mismatch under a defined rule before implementation (open in §16). |
| Still to place | Active Task selected for the day but without a valid scheduled interval. A Task due that day may be surfaced as a candidate, clearly distinguished from an explicit day assignment; it is never silently placed. Missing duration calls for an estimate before timed placement. |
| Overdue | Calculated when an incomplete, non-cancelled Task's deadline precedes the current local date in the planning timezone. It is not a stored status or a Calendar interval. |
| Recurrence | Common recurring Tasks remain a beta requirement. Each materialized occurrence must retain its own deadline, planned state, and owner; schedule projection must avoid duplicates. Exact occurrence persistence/editor design belongs to the recurring-Task specification and remains open. |

Scheduling and deadline changes are separate operations even if one Task edit screen exposes both. Completed, cancelled, archived, and deleted Tasks leave active schedule/conflict/capacity views. A planned Task crossing midnight remains one interval and appears in each intersected day. Manual rearrangement updates intended work time after validation; it never changes the deadline implicitly. Do not silently copy a planned start into a deadline or vice versa.

## 4. Minimum Orvia Event model

The Event is owner-scoped and has **two validated temporal variants**: timed (`start_at`, `end_at` as UTC instants) or all-day (`start_date`, `end_date_exclusive` as local dates). The API can expose normalized `start`/`end` values, but persistence must not coerce an all-day date into a UTC-midnight timestamp. Both variants carry an IANA timezone and satisfy `end > start`; only the fields of their own variant may be populated.

| Field | Beta classification and rule |
| --- | --- |
| `id` | **Required:** stable Event identifier. |
| `user_id` | **Required:** authenticated owner, assigned server-side; never accepted from client input. |
| `title` | **Required:** nonblank, bounded user-visible text. |
| `start_at`, `end_at` or `start_date`, `end_date_exclusive` | **Required by variant:** valid ordered bounds. End is exclusive. |
| `all_day` | **Required:** discriminates the temporal variant. |
| `timezone` | **Required:** valid IANA zone used for entered wall time and all-day dates. |
| `busy` | **Required:** busy/free classification, default busy. Free Events remain visible but do not block capacity or trigger overlap conflicts. |
| `workspace_id` | **Optional for beta:** nullable user-owned workspace context, consistent with Orvia's existing optional workspace pattern. If supplied, verify ownership; a Personal Event need not have a project or new mandatory workspace. |
| `created_at`, `updated_at` | **Required:** server-managed audit timestamps. |
| Archive / Delete state | **Required beta behavior; persistence open:** Events support distinct Archive and Delete actions, and archived/deleted Events leave active schedule views as appropriate. The representation (timestamps, status, hard/soft delete, or another strategy) is not fixed. Settle it with recovery and data-retention rules before designing the migration. Delete must not be mislabeled as an irreversible purge if recoverable. |
| attendees, location, description, provider IDs, recurrence fields | **Later / not in beta Event minimum.** Add only through separate approved requirements. Provider identifiers never turn an external record into an Orvia Event. |

The product's reminder requirement should be specified in the cross-feature reminder work; this Event minimum does not invent a reminder delivery schema. Event create, edit, archive, and delete require explicit outcomes and appropriate destructive confirmation.

## 5. Timezone and interval rules

Use one explicit **user planning timezone** (IANA identifier) for Plan day boundaries, Task deadlines, daily capacity, and default Calendar display. The user can inspect/change it; device timezone changes must not silently move the user's day or deadline. An explicitly assigned `plan_day` remains that local planning date when either the device or planning timezone changes; it is user intent, not a conversion of an instant. For a Task with `planned_start`, Calendar derives its displayed local day from that instant in the active planning timezone. If the derived day and explicit `plan_day` differ, surface the mismatch and apply a defined reconciliation rule rather than silently changing the assignment or scheduled instant; the exact rule remains open in §16. An Event retains its own IANA timezone for faithful wall-time editing; render its instant in the chosen Calendar display zone with the zone identifiable when relevant. A missing planning timezone must be resolved explicitly before trusting day/capacity calculations; do not silently use a server timezone.

Store timed starts/ends as UTC instants and durations as positive minutes. Store all-day Event bounds and Task deadlines as local dates. Use half-open intervals **`[start, end)`** throughout querying, projection, occupancy, and conflict detection; intervals touching at an endpoint do not overlap. Translate all-day date bounds to instants only for a particular display/capacity query in the Event's IANA zone. Query by interval intersection, not only start date.

At DST gaps, reject a nonexistent entered wall time and offer a valid choice. At repeated wall times, require an explicit offset/instance choice or preserve the previously stored instant; never silently pick a different occurrence. Validate calendar dates, zones, and UTC round trips at API boundaries. A day may have 23 or 25 hours; compute using real instants, not a fixed 24-hour millisecond assumption. Changing the planning timezone changes local day grouping and should be visible, without rewriting persisted instants or date-only deadlines.

## 6. Shared schedule projection

Authenticated, owner-scoped repositories supply active Orvia Events and Tasks. A typed domain service normalizes them **before** Calendar and Plan presentation. Both consumers request the same projection for a bounded date range and planning timezone; neither reads the other's component state. It is derived on demand (with safe request caching if needed), not an extra table mirroring UI data.

Minimum projected item: namespaced stable key (`orvia-event:<id>` or `task:<id>`); source/type; `[start,end)` instant bounds plus all-day local-date semantics where applicable; busy/free; owner and optional workspace context; title for authorized display; source freshness; and **intelligence eligibility** derived from current global/workspace privacy controls. Eligibility for recommendation processing is separate from owner-authorized display. A selected workspace filters or labels views according to UX context, but access control always uses owner identity. Future external busy intervals use their own source key and may be opaque; they do not acquire an Orvia Event ID or owner-controlled edit operation.

Return completeness/freshness metadata alongside items (for example complete, partial, stale, unavailable by source). Conflict and capacity results must not claim a complete day when an included source failed. Future Home can consume the same domain projection without changing Calendar or Plan.

## 7. Calendar and Plan behavior

**Calendar:** Day shows timed and all-day Events plus planned Task intervals and their readable source/workspace cues. Week shows the same intersections across days; Month shows a legible date-level overview with a path to inspect details rather than compressing every interval. Date selection and previous/next/today navigation use the planning timezone. Event creation/editing validates temporal variants, ownership, busy/free, and conflict feedback; planned Tasks link to Task scheduling controls. Conflicts are visible and calmly explained with a manual resolution path. All views distinguish loading, genuinely empty, partial, stale, and failed queries; preserve selected date and in-progress edits.

**Plan:** For a selected day, combine schedule commitments, planned Tasks, visible free/available intervals, Still to place, and Focus/priorities. Focus is approximately 3–5 proposed important items, **not** a cap on all daily work. The user can place or move Tasks manually, edit estimates, keep a plan, and inspect suggestions. Suggestions need short reasons and must respect workspace privacy eligibility, flexible versus time-sensitive context, and personal/Protected Time. A significant planning or replanning proposal under default **Assist** shows what stays, what moves, and available-time impact; offer **Apply plan / Adjust / Not now** (or equivalent) and apply only after review. A conflict may be detected without the system solving it. No automatic significant change to the user's day, Focus, deadlines, or Protected Time.

**Protected Time boundary:** Busy personal commitments already reduce availability. Preserve a typed protected/strong-commitment signal in future schedule/replanning contracts, and never silently consume a known protected interval. The exact Protected flag, time-block storage/classification, Settings control, and first-beta interactive slice still need the design/feasibility decision explicitly left open by UX Architecture §10. This specification does not silently declare those controls implemented or required by the approved Calendar slice. Time preferences are soft guidance, not authorization to consume time.

## 8. Conflicts and minimum capacity

Detect overlaps independently of any resolution engine. For two active busy intervals `A` and `B`, conflict exists exactly when `A.start < B.end` **and** `B.start < A.end`. Compare Event↔Event, Event↔planned Task, and planned Task↔planned Task. When external busy intervals are later permitted, compare them with the same rule while preserving their read-only source. Busy all-day Events block every intersecting local day; free all-day/timed Events display but do not conflict or occupy capacity. Exact endpoint contact is not a conflict. Exclude archived/deleted Events and completed/cancelled/archived/deleted Tasks. A deadline alone never conflicts as an interval. Return involved item keys, overlap bounds, and a plain explanation; let users keep an intentional overlap or edit an Orvia-owned item. Do not claim read-only external items can be moved.

For minimum capacity, first obtain a trustworthy, user-visible **planning window** for the day. Its setup/default policy is an open prerequisite for the capacity portion of beta acceptance (§16); implementation must not invent a workday such as 09:00–18:00. Once a valid window and complete source data are available, union busy Event intervals and planned Task intervals within it so overlaps are not double-counted. Free intervals are the remainder; distinguish visible free time from realistically usable work capacity, and do not assume every minute should be filled. Planned workload is the total estimated duration of active Tasks assigned to that day, both scheduled and Still to place, without counting a Task twice. Still to place consumes *demand*, not an occupied interval. Compare remaining unscheduled demand with unoccupied, user-eligible time; flag over-capacity calmly and show the quantities/assumptions. Busy personal or known Protected Time stays unavailable unless the user explicitly overrides. Until an approved planning-window source is available, capacity status is **unknown/unavailable**: Calendar scheduling, manual Plan, and conflict detection still work, but Orvia must not claim spare capacity or overload from an invented window. Missing or partial source data likewise makes capacity unknown. Exact Priority Engine scoring, automatic placement, buffers, and a universal significance threshold remain separate decisions.

## 9. API and persistence boundaries

Use the repository's authenticated server API pattern at a conceptual operation level: list Events intersecting a bounded range; create/read/update/archive/delete one Orvia Event; update Task planned start, duration, and plan day without changing deadline; query a bounded shared schedule projection (or invoke its shared domain service from separately authorized Calendar/Plan handlers); and return conflict/capacity context for Plan. Avoid a second competing Task repository or a Calendar UI data API used as Plan's backend. Validate types, ranges, timezone, lengths, and interval invariants at the server boundary. For a multi-item planning proposal, validate ownership and current versions again when the user applies it; reject stale/conflicting writes with a reviewable response.

The Batch 2 migration adds a user-owned Events table with temporal-variant checks, RLS, required authenticated CRUD grants, and owner/range indexes for active timed and all-day Events. It adds nullable Task `planned_start`, `estimated_duration_minutes`, and `plan_day` with a bounded duration check and owner/plan-day and owner/planned-start indexes; it does not change `due_date`. A single `lifecycle_status` marker (`active`, `archived`, `deleted`) supports active filtering without settling recovery, hard-delete timing, or retention. No `workspace_id` is stored because the repository has no cloud user-owned workspace relation to enforce. Future API work must validate Event timezone identifiers and ensure owner-scoped archive/delete/export/account-deletion paths include Events; actual query shapes may warrant index review. Existing `tasks.user_id` is nullable for legacy rows; migration and API work must not accidentally claim those rows or expose them. New Events have non-null ownership. Migration file presence and static assertions do not prove a live database state.

All operations derive `user_id` from authenticated identity, never from client-supplied IDs. Existing service-role reads/writes bypass RLS, so each query and mutation must filter by that owner and validate any workspace relation; direct authenticated access additionally needs tested Event RLS and grants. Route visibility is not authorization. Do not use local fallback as an unreviewed cloud sync path, and do not claim offline write support.

## 10. Privacy, security, and lifecycle

Calendar titles and exact times are sensitive personal data. Keep them out of analytics event fields, metadata, URLs, raw errors, and logs; analytics may use only approved bounded, content-free event contracts. Do not leak titles/descriptions/URLs to monitoring. Apply owner isolation to Events, Tasks, schedule projection, conflict results, export, and account deletion. Workspace exclusion from Orvia Intelligence must filter recommendation inputs **before** analysis, while authorized factual Calendar display can remain available under user controls; a workspace filter alone is not security. Future external-provider tokens belong server-side, outside ordinary Event rows, with least privilege and revocation.

`Export my data` must include owned Events and Task scheduling data with clear timezone meaning. `Delete account and data` must cover cloud Events and related schedule data, not merely local reset. The Batch 2 lifecycle marker does not define recovery, hard-delete timing, or retention; settle those rules before Event API/UI behavior and describe Archive and Delete accurately. Security and deletion claims require later database, API, and production validation.

## 11. Failure and recovery states

| Condition | Required behavior |
| --- | --- |
| Event create/update or Task scheduling write fails | Keep form values and selected date; show failure and retry/edit path; do not render the uncommitted change as saved. Prevent duplicate retries where possible. |
| Calendar/schedule query fails or returns partial sources | Show which context is unavailable, preserve navigation and safe manual routes, and mark conflict/capacity conclusions incomplete. |
| Stale projection or concurrent plan edit | Indicate freshness; refetch and ask for review before applying a proposal based on changed data. |
| Intelligence unavailable | Keep manual Event and Task scheduling usable when data access works; do not present stale suggestions as fresh. |
| Timezone ambiguity or invalid local time | Ask the user to resolve it; preserve entered values and do not guess an instant. |
| Conflict detected | Explain the overlapping items and times; offer review/edit/keep options without silent rescheduling. |
| Offline/network failure | Explain unavailable cloud operations; preserve unsent input where possible. Do not promise offline persistence, editing, or synchronization. |

## 12. Accessibility, responsive, and localization requirements

Desktop Day/Week/Month and Plan controls must be keyboard reachable with visible focus and named actions; dialogs restore focus and expose errors. Screen readers need ordered time/date labels, busy/free and conflict text, workspace cues, and an alternative to spatial drag-only rearrangement. Mobile uses focused single-column flows, usable touch targets, and a separately reachable Still to place surface; it must not shrink a desktop timeline into unreadable columns. Information must not depend on color alone. EN/UA strings must tolerate Ukrainian expansion and local date/time formatting in the chosen planning zone. Verify light/dark contrast and reduced-motion behavior on real rendered views.

## 13. Acceptance criteria

**A. Event lifecycle** — An authenticated user can create, view, edit, archive, and delete their own timed or all-day Event with valid title, zone, ordered bounds, and busy/free state; invalid bounds are rejected without losing input. Archived/deleted Events leave active schedule views and follow the stated recovery policy.

**B. Task scheduling** — A Task can retain a deadline without a planned interval, a duration without a start, or a valid planned start plus duration. An explicit `plan_day` persists without a start and places unscheduled work in Still to place; a deadline alone does not create that assignment. Moving a planned Task changes its planned interval, never its deadline; a differing explicit assignment follows the approved reconciliation rule rather than being silently rewritten. Completed/cancelled work is excluded from active planning. Common recurring Task occurrences do not appear twice in the projection.

**C. Calendar Day** — For a chosen local day, all intersecting active Orvia Events and planned Tasks appear with source, time, busy/free, and workspace context; empty/loading/error/partial states are distinguishable and Event creation is reachable.

**D. Calendar Week** — Moving between weeks preserves the planning zone and selected context; intervals spanning midnight or week bounds appear on every intersected day, without duplicate identity.

**E. Calendar Month** — Each local date accurately indicates its active schedule, including all-day and cross-date items; selecting a date opens readable detail and does not imply an unscheduled deadline occupies time.

**F. Plan** — A day shows commitments, planned Tasks, Focus context, Still to place, and manual placement/rearrangement. With an approved planning window and complete source data, it shows free/available time and explains demand versus capacity on overloaded days. Without that prerequisite, capacity is unknown and no spare/overload claim is made; manual planning still works. Significant proposals show what moves/stays and require Apply/Adjust/Not now before persistence; declining leaves the day unchanged. Manual use works without intelligence or providers.

**G. Conflict detection** — The three busy pairings are detected with correct overlap bounds; free items, endpoint contact, inactive objects, and deadline-only Tasks do not create conflicts. Busy all-day Events conflict with intersecting planned intervals. Detection gives a calm resolution path and does not mutate items.

**H. Timezone behavior** — A device-zone or planning-zone change does not silently change an explicit `plan_day` or Task deadline. Calendar derives a planned interval's displayed day from its instant in the active planning zone; a mismatch with explicit `plan_day` follows the approved reconciliation rule. Timed UTC instants and local date-only values round-trip across zones; invalid DST gaps and repeated times require safe resolution. Where capacity inputs are valid, a 23/25-hour day has correct interval and capacity math.

**I. Ownership/security** — Cross-user Event/Task reads, writes, projection, conflict, and export attempts are denied under API and live RLS tests. Client `user_id` is ignored/rejected. Workspace intelligence exclusion prevents excluded content entering recommendation inputs. Analytics/monitoring contain no Calendar titles or exact sensitive content.

**J. Failure/recovery** — Failed writes retain edits and do not claim success; partial/stale queries identify uncertainty; offline and intelligence failures offer honest manual/retry paths; applying a stale proposal requires refreshed review.

**K. Responsive/accessibility** — Desktop keyboard and mobile touch users can inspect, create, edit, move, and resolve relevant items without drag-only controls; focus, screen-reader labels, readable order, and reduced motion are verified in rendered flows.

**L. EN/UA and light/dark** — The same primary journeys, states, time labels, and conflict/capacity messages work in English and Ukrainian and in both themes without clipping, lost meaning, or unreadable contrast.

## 14. Later validation strategy

No suite is run for this specification. Implementation should later use focused unit tests for date/interval rules, Task semantics, capacity and conflicts; projection tests for source normalization, lifecycle, workspaces and partial data; API/integration tests for CRUD, stale writes and failures; database/RLS tests with two authenticated users and service-role route ownership checks; timezone/DST and all-day boundary tests; and authenticated end-to-end manual review of Event, Calendar, and Plan journeys. Review responsive desktop/mobile rendering, keyboard/screen-reader accessibility, EN/UA expansion, light/dark contrast, reduced motion, privacy-safe analytics, export/deletion, and production configuration separately. Static RLS tests or automated tests alone do not establish a release.

## 15. Future Google boundary and later capabilities

After a separate gated decision, a Google adapter may provide **read-only** external busy-time intervals to the same projection under user permission. Keep provider records and identity distinct from Orvia Events and Tasks; do not copy provider IDs into Event ownership or allow Orvia edit operations to write back. Provider failure or revocation marks external context incomplete while Orvia Events and manual Plan continue working. Request least-privilege scopes, store tokens server-side outside Event rows, support disconnect/revocation and data-lifecycle handling, and honor workspace/intelligence privacy boundaries. This is an architectural seam, not an OAuth or sync design.

Outlook, bidirectional writes, advanced provider refresh/sync and recurrence, travel/buffer intelligence, and richer automatic replanning are later capabilities. No external calendar connection is required for Calendar or Plan beta acceptance.

## 16. Open technical decisions

1. Exact persisted representation and UX for **Protected** on Tasks, Events, or separate time blocks, including the first-beta interactive slice. Until decided, never silently use known busy personal time.
2. Planning-window preferences and their initial user-visible setup/default policy. This is a **prerequisite for the capacity portion of beta acceptance**; until an approved, trustworthy window exists, capacity reports unknown while Calendar, manual Plan, and conflicts remain usable.
3. Recurring-Task occurrence representation and exact editor UX, coordinated with the separate beta recurrence requirement; custom recurrence remains later.
4. Exact significance threshold and Priority Engine scoring/classification for flexible versus time-sensitive suggestions. The review requirement itself is settled.
5. Event Archive/Delete persistence, recovery, and retention details consistent with Export/Delete account behavior, plus reminder delivery details in the cross-feature spec.
6. The reconciliation rule and user experience when a Task's explicit local `plan_day` differs from the day derived from `planned_start` in the active planning timezone; neither value may be silently rewritten.

These do **not** reopen Calendar placement, Task/Event separation, the shared projection, Calendar/Plan responsibilities, or provider independence. Other Product Spec open decisions remain open outside this feature scope.

## 17. Suggested implementation sequence

1. Define Task/Event/timezone contracts and settle only the open prerequisites needed for beta acceptance.
2. Design migrations, ownership rules, RLS/grants, lifecycle, export and account deletion; verify against the actual target before deployment.
3. Build and test the shared schedule projection, interval/conflict primitives, and completeness metadata.
4. Add authenticated Event operations and Task scheduling updates with server validation and owner filters.
5. Build Calendar Day, Week, Month, Event editing, and responsive accessible navigation.
6. Build daily Plan using the same projection: Still to place, manual planning, Focus context, capacity, and reviewable proposals.
7. Complete conflict/capacity behavior and the separate acceptance, security, rendered visual, and production verification gates.

This is a dependency order, not authorization to code, migrate, or deploy.

## 18. Definition of Done for private beta

Each gate must be evidenced separately before claiming release readiness:

| Gate | Required evidence |
| --- | --- |
| **Functional PASS** | Event/Task/Calendar/Plan acceptance criteria demonstrated manually and by relevant automated checks, including provider-free use and failure paths. |
| **Security/Data PASS** | Live ownership/RLS and server-filter verification, privacy boundaries, analytics minimization, export/delete and lifecycle checks. |
| **UX PASS** | New-user and replanning journeys are understandable, calm, reviewable, and usable without intelligence. |
| **Responsive PASS** | Real desktop and mobile workflows tested at representative sizes. |
| **Accessibility PASS** | Keyboard, focus, screen-reader, touch, contrast and reduced-motion review with issues resolved. |
| **i18n PASS** | English/Ukrainian content and timezone formatting verified in representative flows. |
| **Visual PASS** | Product owner explicitly approves representative rendered desktop/mobile, light/dark screens under Product Spec §61. |
| **Production PASS** | Authorized deployment/migration state and production smoke checks verified separately; no source-only or local build result substitutes for this. |

This draft satisfies none of those implementation or release gates by itself.
