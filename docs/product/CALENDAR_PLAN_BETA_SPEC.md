# Orvia — Calendar + Plan private-beta technical specification

**Status:** PARTIALLY IMPLEMENTED — beta scope and temporal foundation decisions approved; remaining §16 decisions stay OPEN; local implementation evidence is not a release claim
**Date:** 30 September 2026
**Last reconciled:** 2 October 2026

## 1. Purpose, authority, and evidence

The authority chain is **[Product Spec v1.3](PRODUCT_SPEC.md) → approved decisions in [UX Architecture v1.0](UX_ARCHITECTURE.md) → this feature/technical specification → Design Foundation → screen specification → implementation and acceptance evidence**. The approved private-beta scope originally supplied for this document resolved the Calendar slice that Product Spec v1.1 left open; Product Spec v1.3 now records that boundary canonically. The private beta is provider-free, Google read-only context is gated until after beta, and Outlook is later. This document does not settle other open Product Spec decisions. Calendar and Plan must remain useful with no external calendar connection.

**Target versus current:** Everything below labeled “shall” is intended behavior, not a claim that it exists. The repository has a pure, bounded Schedule Projection for active Tasks and Orvia Events, owner-scoped schedule/Event APIs, Calendar Day/Week/Month, a Plan UI, and local Event create/edit UI. Planning preferences and normalized Task plan blocks have forward migrations and owner-scoped APIs in the repository. Persisted blocks take precedence over legacy `planned_start`; legacy intervals remain readable only when a Task has no block. `plan_day` remains a compatibility/day-assignment field and does not determine a block's scheduled date. Sources still report unverified intelligence eligibility. Calendar reads saved planning preferences where available. Recurrence, reminders, notification delivery, Schedule Change Awareness, and Daily Review are not established by this batch. Live database/RLS and production behavior remain unverified. These are repository observations, not deployment claims.

Product Spec v1.3 lists Calendar in primary navigation, records the Calendar/Plan lead questions, and incorporates this specification's approved provider-free beta boundary. UX Architecture v1.0 remains a draft; this specification relies only on UX decisions already promoted to the Product Specification or explicitly approved for this feature. TARGET proposals elsewhere in that draft do not become requirements here.

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
| `task_plan_blocks` | **Authoritative planned intervals.** One Task owns zero, one, or many normalized blocks. Each block has its own identity and UTC instant bounds while retaining the parent Task identity. Blocks may occur on different local dates. |
| `planned_start` | Legacy compatibility field for existing records. It supplies one interval only when the Task has no persisted plan blocks; new block operations do not write or derive it. |
| `estimated_duration_minutes` | Nullable positive, bounded **total Task estimate**. This batch does not infer partial placement or remaining duration from the sum of block durations. |
| `plan_day` | Nullable compatibility/day-assignment field that may support Still to place. It is not authoritative for a persisted block's scheduled date and is never used to rewrite a block instant. |
| Still to place | Active Task selected for a day but without a valid planned block, or with remaining demand explicitly asserted by a future trusted source. A deadline alone is not placement. This foundation does not infer remaining demand from estimate-minus-block totals. |
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
| Archive / Delete state | **Private-beta decision:** `active`, `archived`, and `deleted` are distinct lifecycle states. Delete is soft deletion from normal product views, not physical erasure. No user-facing restore exists in this batch; permanent deletion and retention require a separate data-lifecycle/legal decision before public launch. |
| description | **Optional:** Event details preserve useful text from an Inbox capture; direct Calendar creation may leave them empty. |
| location, link, recurrence, reminders | **Approved beta target, not implemented by the temporal-foundation batch.** Fast creation keeps these behind optional/more controls where appropriate. |
| attendees, provider IDs | **Later.** Provider identifiers never turn an external record into an Orvia Event. |

Reminder is a separate domain that may target an Event, target a Task, or exist independently. Delivery channels remain decoupled from Reminder persistence. The reminder schema and delivery infrastructure belong to later batches. Event create, edit, archive, and soft-delete require explicit outcomes and appropriate destructive confirmation. Restore, permanent erasure, and retention remain separate work.

## 5. Timezone and interval rules

Use one persisted, account-owned **user planning timezone** (IANA identifier) for Plan day boundaries, Task deadlines, daily capacity, and default Calendar display. Device/browser timezone is an initial suggestion only; after save, the account preference is authoritative. The default planning window is Monday–Friday, 09:00–18:00 local time, and the user may edit enabled days and start/end times. A block's displayed local day is always derived from its instant in the active planning timezone. `plan_day` does not rewrite or override that result. An Event retains its own IANA timezone for faithful wall-time editing; render its instant in the chosen Calendar display zone with the zone identifiable when relevant. Capacity remains unavailable until saved preferences and source coverage are trustworthy.

Store timed starts/ends as UTC instants and durations as positive minutes. Store all-day Event bounds and Task deadlines as local dates. Use half-open intervals **`[start, end)`** throughout querying, projection, occupancy, and conflict detection; intervals touching at an endpoint do not overlap. Translate all-day date bounds to instants only for a particular display/capacity query in the Event's IANA zone. Query by interval intersection, not only start date.

At DST gaps, reject a nonexistent entered wall time and offer a valid choice. At repeated wall times, require an explicit offset/instance choice or preserve the previously stored instant; never silently pick a different occurrence. Validate calendar dates, zones, and UTC round trips at API boundaries. A day may have 23 or 25 hours; compute using real instants, not a fixed 24-hour millisecond assumption. Changing the planning timezone changes local day grouping and should be visible, without rewriting persisted instants or date-only deadlines.

## 6. Shared schedule projection

Authenticated, owner-scoped repositories supply active Orvia Events and Tasks. A typed domain service normalizes them **before** Calendar and Plan presentation. Both consumers request the same projection for a bounded date range and planning timezone; neither reads the other's component state. It is derived on demand (with safe request caching if needed), not an extra table mirroring UI data.

Minimum projected item: namespaced stable key (`orvia-event:<id>`, normalized `task-block:<blockId>`, or compatibility `task:<taskId>`); source/type; parent Task identity where applicable; `[start,end)` instant bounds plus all-day local-date semantics where applicable; busy/free; owner and optional workspace context; title for authorized display; source freshness; and **intelligence eligibility** derived from current global/workspace privacy controls. Multiple block items may share one Task `sourceId`. Persisted blocks take precedence over the legacy Task interval so the projection never duplicates both representations. Eligibility for recommendation processing is separate from owner-authorized display. A selected workspace filters or labels views according to UX context, but access control always uses owner identity. Future external busy intervals use their own source key and may be opaque; they do not acquire an Orvia Event ID or owner-controlled edit operation.

Return completeness/freshness metadata alongside items (for example complete, partial, stale, unavailable by source). Conflict and capacity results must not claim a complete day when an included source failed. Future Home can consume the same domain projection without changing Calendar or Plan.

## 7. Calendar and Plan behavior

**Calendar:** Day shows timed and all-day Events plus planned Task intervals and their readable source/workspace cues. Week shows the same intersections across days; Month shows a legible date-level overview with a path to inspect details rather than compressing every interval. Date selection and previous/next/today navigation use the planning timezone. Event creation/editing validates temporal variants, ownership, busy/free, and conflict feedback; planned Tasks link to Task scheduling controls. Conflicts are visible and calmly explained with a manual resolution path. All views distinguish loading, genuinely empty, partial, stale, and failed queries; preserve selected date and in-progress edits.

**Plan:** For a selected day, combine schedule commitments, planned Tasks, visible free/available intervals, Still to place, and Focus/priorities. Focus is approximately 3–5 proposed important items, **not** a cap on all daily work. The user can place or move Tasks manually, edit estimates, keep a plan, and inspect suggestions. Suggestions need short reasons and must respect workspace privacy eligibility, flexible versus time-sensitive context, and personal/Protected Time. A significant planning or replanning proposal under default **Assist** shows what stays, what moves, and available-time impact; offer **Apply plan / Adjust / Not now** (or equivalent) and apply only after review. A conflict may be detected without the system solving it. No automatic significant change to the user's day, Focus, deadlines, or Protected Time.

**Protected Time boundary:** Busy personal commitments already reduce availability. Preserve a typed protected/strong-commitment signal in future schedule/replanning contracts, and never silently consume a known protected interval. The exact Protected flag, time-block storage/classification, Settings control, and first-beta interactive slice still need the design/feasibility decision explicitly left open by UX Architecture §10. This specification does not silently declare those controls implemented or required by the approved Calendar slice. Time preferences are soft guidance, not authorization to consume time.

## 8. Conflicts and minimum capacity

Detect overlaps independently of any resolution engine. For two active busy intervals `A` and `B`, conflict exists exactly when `A.start < B.end` **and** `B.start < A.end`. Compare Event↔Event, Event↔planned Task, and planned Task↔planned Task. When external busy intervals are later permitted, compare them with the same rule while preserving their read-only source. Busy all-day Events block every intersecting local day; free all-day/timed Events display but do not conflict or occupy capacity. Exact endpoint contact is not a conflict. Exclude archived/deleted Events and completed/cancelled/archived/deleted Tasks. A deadline alone never conflicts as an interval. Return involved item keys, overlap bounds, and a plain explanation; let users keep an intentional overlap or edit an Orvia-owned item. Do not claim read-only external items can be moved.

For minimum capacity, obtain the persisted user-visible planning window for the day. Its approved default is Monday–Friday, 09:00–18:00, with editable days and local start/end times. Once a valid saved preference and complete source data are available, union busy Event intervals and planned Task blocks within it so overlaps are not double-counted. Free intervals are the remainder; distinguish visible free time from realistically usable work capacity, and do not assume every minute should be filled. Planned workload uses the Task's total estimate without automatically treating estimate-minus-block totals as remaining demand. Still to place consumes demand only when that demand is explicit. Missing preferences or partial/unverified source data makes capacity unknown. Exact Priority Engine scoring, automatic placement, buffers, and a universal significance threshold remain separate decisions.

## 9. API and persistence boundaries

Use the repository's authenticated server API pattern at a conceptual operation level: read/save planning preferences; list/create/update/delete individual Task plan blocks; list Events intersecting a bounded range; create/read/update/archive/delete one Orvia Event; query the bounded shared Schedule Projection; and return conflict/capacity context for Plan. The legacy Task scheduling patch may remain temporarily but is not the preferred block foundation. Avoid a second competing Task repository or a Calendar UI data API used as Plan's backend. Validate ownership, types, versions, ranges, timezone, lengths, and interval invariants at the server boundary.

The Batch 2 migration adds a user-owned Events table with temporal-variant checks, RLS, required authenticated CRUD grants, and owner/range indexes for active timed and all-day Events. It adds nullable Task `planned_start`, `estimated_duration_minutes`, and `plan_day` with a bounded duration check and owner/plan-day and owner/planned-start indexes; it does not change `due_date`. A single `lifecycle_status` marker (`active`, `archived`, `deleted`) supports active filtering without settling recovery, hard-delete timing, or retention. No `workspace_id` is stored because the repository has no cloud user-owned workspace relation to enforce. Batch 4 API work validates Event timezone identifiers and owner-scopes archive/lifecycle-delete; future export/account-deletion paths must include Events. Actual query shapes may warrant index review. Existing `tasks.user_id` is nullable for legacy rows; migration and API work must not accidentally claim those rows or expose them. New Events have non-null ownership. Migration file presence and static assertions do not prove a live database state.

Batch 4 local implementation adds authenticated Event create/read/update/archive and lifecycle-delete routes, an independent legacy Task scheduling patch route, and a bounded schedule projection read. `DELETE /api/events/[id]` sets `lifecycle_status='deleted'`; it does not hard-delete or establish recovery/retention. The temporal-foundation batch adds preferred block operations. A legacy Task patch may preserve `plan_day`, but normalized blocks are authoritative and their local dates come from their instants. The projection can return factual rows but marks sources `unverified` and recommendation processing disabled because a trusted intelligence-eligibility source is not implemented. These local routes have automated/mock and static checks only; migrations are not applied by this documentation, and live RLS, manual UI, and production behavior remain unverified.

All operations derive `user_id` from authenticated identity, never from client-supplied IDs. Existing service-role reads/writes bypass RLS, so each query and mutation must filter by that owner and validate any workspace relation; direct authenticated access additionally needs tested Event RLS and grants. Route visibility is not authorization. Do not use local fallback as an unreviewed cloud sync path, and do not claim offline write support.

Batch 5 adds a local read-only `/app/calendar` UI backed by `POST /api/schedule`. Day and desktop Week use timed grids with deterministic overlap columns; mobile Week uses a seven-day agenda, and Month uses date-level previews with day detail. Events, free Events, and occupied planned Tasks have distinct textual and visual cues. Batch 1 of the subsequent beta foundation adds persisted planning preferences, normalized Task blocks, block-aware projection identity, and owner-scoped block APIs locally; it does not add Plan UI, recurrence, reminders, notification delivery, or Daily Review. Calendar still uses its existing session timezone flow until a later UI batch consumes the saved preference. Live migration/RLS, authenticated UI behavior, and production validation remain pending.

**Local Event UI update, 4 October 2026:** Calendar now exposes restrained Event creation and opens owned Event details/editing from schedule items. The form supports timed/all-day bounds, busy/free, optional details, the account planning-zone default, Event-zone editing, DST gap/repeated-time review, cross-midnight ranges, and archive/soft-delete confirmation. Calendar refreshes its projection after a successful write; Plan continues to consume the same schedule source. The additive `202610040001_atomic_capture_resolution.sql` and `202610040002_capture_resolution_claims_event_details.sql` migrations provide an owner-scoped transactional claim for Inbox-to-Task/Note/Event conversion and preserve Event details. These migrations have not been applied by this work. Device-only captures stay local and cannot resolve to account objects without a new account capture. `DELETE` remains a soft lifecycle transition, not permanent erasure; no user-facing restore exists in this batch. Physical deletion/retention and account export/deletion remain separate requirements. Automated checks do not verify live RLS, authenticated UX, or production behavior.

## 10. Privacy, security, and lifecycle

Calendar titles and exact times are sensitive personal data. Keep them out of analytics event fields, metadata, URLs, raw errors, and logs; analytics may use only approved bounded, content-free event contracts. Do not leak titles/descriptions/URLs to monitoring. Apply owner isolation to Events, Tasks, schedule projection, conflict results, export, and account deletion. Workspace exclusion from Orvia Intelligence must filter recommendation inputs **before** analysis, while authorized factual Calendar display can remain available under user controls; a workspace filter alone is not security. Future external-provider tokens belong server-side, outside ordinary Event rows, with least privilege and revocation.

`Export my data` must include owned Events and Task scheduling data with clear timezone meaning. `Delete account and data` must cover cloud Events and related schedule data, not merely local reset. These remain separate beta requirements and are not completed by the Event UI or soft-delete action. No user-facing restore is provided in this batch. Physical erasure and retention policy require a separate data-lifecycle/legal decision before public launch. Security and deletion claims require later database, API, and production validation.

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

**A. Event lifecycle** — An authenticated user can create, view, edit, archive, and soft-delete their own timed or all-day Event with valid title, zone, ordered bounds, and busy/free state; invalid bounds are rejected without losing input. Archived/deleted Events leave normal active schedule views. Restore is unavailable in this batch; this does not waive the separate account export/deletion beta requirements.

**B. Task scheduling** — A Task can retain a deadline without a planned interval, a total duration without a block, or zero/multiple valid blocks. Each block has independent identity and may occur on a different day while remaining part of one Task. A block's local date comes from its instant in the planning timezone; `plan_day` cannot override it. Persisted blocks take precedence over legacy `planned_start`, avoiding duplicate projection items. Explicitly day-assigned work without a valid block can enter Still to place; a deadline alone does not create that assignment. Completed/cancelled work is excluded from active planning.

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
2. Recurring-Task occurrence representation and exact editor UX, coordinated with the separate beta recurrence requirement; custom recurrence remains later.
3. Exact significance threshold and Priority Engine scoring/classification for flexible versus time-sensitive suggestions. The review requirement itself is settled.
4. Permanent Event erasure and retention details consistent with Export/Delete account behavior, plus reminder delivery details in the cross-feature spec. The private-beta Active → Archived → Deleted (soft delete) behavior is settled above.
5. How future product flows explicitly represent remaining unplaced demand when a Task already has one or more blocks. This foundation does not derive it from estimate-minus-block totals.

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
