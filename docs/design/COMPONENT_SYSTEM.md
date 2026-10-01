# Orvia Component System

**Status:** DECIDED contracts; implementation coverage varies
**Rule:** a component earns a shared primitive when behavior or visual semantics recur. Similar controls must not diverge by screen.

## 1. Shared component contract

Every family defines purpose, hierarchy, variants, states, accessibility, responsive behavior, motion, content, and anti-patterns. All interactive components support default, hover where relevant, visible focus, active/selected, disabled, loading when asynchronous, error/invalid where applicable, and reduced motion.

## 2. Actions and fields

| Family | Contract |
| --- | --- |
| Buttons | **Purpose:** trigger an action. **Hierarchy:** one primary per local decision area; secondary, ghost, and danger support it. **States:** loading prevents duplicate action without changing width unexpectedly. **A11y:** native button, explicit type, visible focus, accessible name. **Responsive:** label may wrap or component recomposes; icon-only only when familiar. **Motion:** immediate/fast. **Content:** verb + object where needed. **Avoid:** several equal primary actions, color-only danger, links styled as buttons for navigation. |
| Inputs | Persistent label, optional helper, value, and associated error. Native semantics/autocomplete/input mode where possible. Mobile text fields retain readable size. Avoid placeholder-only labels and validation that erases input. |
| Textareas | Same field contract; resize or intentional auto-growth; preserve line breaks; character limits explained before failure. Avoid fixed height that hides user content. |
| Selects | Native select is preferred for a short fixed list. Preserve label, current value, keyboard, and platform behavior. Avoid custom select for styling alone. |
| Comboboxes | Use for searchable/large option sets. Define typed input, suggestion, no-result, loading, error, clear, and selection states. Keyboard and screen-reader behavior follows the combobox pattern. Avoid ambiguous free text when a valid option is required. |
| Date/time picker | Keep date-only, timed instant, timezone, deadline, and planned time semantics explicit. Support text/keyboard entry and validation; do not infer a timezone or rewrite a deadline. Mobile may use reliable native controls. |

## 3. Selection and navigation

| Family | Contract |
| --- | --- |
| Tabs | Switch peer content within one context. Selected state is text/shape plus programmatic state. Use automatic or manual activation deliberately. Avoid using tabs as unrelated route navigation without preserving expected browser behavior. |
| Segmented controls | Compact mutually exclusive view/mode switch, such as Day/Week/Month. Few short options only; selected state remains clear in both themes. On narrow screens, retain readable labels or use an approved disclosure. |
| Primary navigation | Stable product destinations. Active item is clear but quieter than the work surface. Desktop and mobile use the approved IA, accessible landmarks, and predictable order. Avoid long flat module lists. |
| Sidebar | Desktop orientation, context, library, and utility access. Group by user job, not implementation module. It recedes after navigation. Avoid equal visual weight for every row and oversized account cards. |
| Mobile navigation | The current UX Architecture proposes five prominent bottom destinations; that device grouping remains TARGET pending approval. Other Product Spec primary/secondary areas use a separate, discoverable pattern once specified. Respect safe areas and 44 px targets. Avoid compressing the desktop sidebar. |
| Breadcrumb/context navigation | Use where hierarchy would otherwise be unclear. Keep current location as text, not a redundant link. Avoid breadcrumbs for shallow routes. |

## 4. Containers and data display

| Family | Contract |
| --- | --- |
| Cards | Independent conceptual unit, optional selection, or focal summary. Variants: surface, subtle, interactive, selected. Responsive padding adjusts consistently. Avoid card-per-section, nested cards, and decorative shadows. |
| Lists | Default for collections and queues. Align title, essential metadata, and actions; use dividers/whitespace. Rows define hover/focus/selected/pending states. Mobile moves metadata, not meaning. |
| Tables | Use when users compare values across rows/columns. Headers, sorting, empty/loading/error, row actions, and responsive fallback are explicit. Avoid tables for simple title lists or unlabeled mobile truncation. |
| Badge | Short status/category/source label. Semantic variant plus text; never the only status cue. Avoid sentence-length badges and rainbow category systems. |
| Avatar | Identity or account context only. Alt/name treatment follows context; initials fallback is deterministic. Avoid decorative avatars or implying collaborators that do not exist. |
| Task item | Shows task identity, actionable status, relevant timing/context, and pending/error state. Deadline, planned time, and duration remain distinct. Completion is text/semantic state, not color alone. |
| Event item | Shows event identity, time/all-day, busy/free, source, and workspace where relevant. Busy/free differs by text/icon/treatment. External read-only state is clear. |
| Timeline | Preserves chronology and readable time hierarchy. Current time, conflicts, free/busy, and planned tasks have distinct accessible treatment. Mobile becomes one readable chronology. |
| Calendar primitives | Day header, time gutter, all-day lane, day column, event/task block, current-time indicator, month cell/detail. Shared geometry and item language across Day/Week/Month; empty structure remains visible. |

## 5. Overlays and transient feedback

| Family | Contract |
| --- | --- |
| Dialog | Consequential focused task. Labelled modal, focus containment/restoration, Escape where safe, bounded scroll, explicit cancel/confirm. Mobile may become a sheet. Avoid using a dialog for routine navigation. |
| Sheet | Mobile or contextual detail that benefits from visible origin. Same focus/background rules as dialog. Avoid stacking sheets. |
| Popover | Lightweight non-modal context anchored to a trigger. Outside/Escape dismissal and trigger restoration; content remains short. Avoid large forms or critical irreversible decisions. |
| Dropdown/menu | Compact action set with correct menu keyboard semantics when it is truly a menu. Destructive action is separated and labelled. Avoid hidden primary actions. |
| Tooltip | Supplemental label/help for hover/focus, never essential instructions or interactive content. Must not obscure trigger or trap pointer/focus. |
| Toast | Brief confirmation or recoverable failure; does not contain critical-only information. Pause/dismiss behavior is accessible. Use inline feedback when tied to a form or object. |
| Banner/notice | Cross-surface or high-impact state whose scope is larger than one field/item. Severity matches consequence. Unverified/partial data usually uses a quieter disclosure. |

## 6. State components

| Family | Contract |
| --- | --- |
| Empty state | Keep useful structure, state what is absent, and offer only a supported action. No oversized illustration or invented workflow. |
| Loading state | Preserve layout where useful, prevent duplicate actions, and expose one useful status. Do not show fake precision. |
| Error state | Explain failure, retained context, and retry/manual path. Place it at the scope of failure. Never expose raw errors. |
| Skeleton | Mirrors stable content geometry, remains quiet, and does not pulse under reduced motion. Avoid skeletons for very short operations or unknown layouts. |
| Inline validation | Appears with the field and summary/focus strategy when several fields fail. Preserve values. |

## 7. Search and command surfaces

Search accepts query, scopes/filters, loading, no-results, partial, error, and result states. Results expose type, relevant context, and safe action. Keyboard selection is visible and does not hijack text editing. Command surfaces show available actions and shortcuts without making hidden shortcuts the only path. Search queries and result content remain excluded from analytics/monitoring.

## 8. Current implementation inventory

CURRENT shared primitives include `Button`, `Card`, `Badge`, `Field`, `Page`, `Section`, `SectionHeader`, `EmptyState`, `Skeleton`, `ConfirmDialog`, `ActionPopover`, presence, and dialog-focus helpers. The AppShell provides current desktop/mobile navigation. Calendar has feature-specific primitives.

Missing families should be introduced only with an approved screen need. Existing components need audit against this contract before being treated as fully conforming; this document does not claim their visual or accessibility acceptance.
