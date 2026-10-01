# Orvia Responsive System

**Status:** DECIDED principles; exact breakpoints and several screen compositions OPEN

Responsive Orvia preserves the user's job, hierarchy, state, and actions. It does not shrink a desktop arrangement until it fits.

## 1. Form-factor philosophy

| Context | Composition |
| --- | --- |
| Desktop | Supports simultaneous context and work: persistent navigation, primary surface, and secondary detail when it materially helps comparison or planning. |
| Tablet | Chooses which secondary region remains visible. Side-by-side layout is earned by task and available width, not device label. |
| Mobile | Uses focused single-column journeys, bottom navigation for primary destinations, and sheets/detail routes for secondary context. Primary action stays reachable. |

Breakpoints follow content stress, not named device models. Every screen spec defines the point at which its composition changes. Do not add arbitrary breakpoints to patch one label.

## 2. Global rules

- Content width follows the job: readable prose is bounded; comparison surfaces may use the viewport.
- Preserve logical DOM and reading order when regions move.
- Touch targets target 44×44 CSS px for primary/frequent mobile controls; never fall below WCAG 2.2 minimum without a documented exception or equivalent target.
- Account for safe-area insets, browser chrome, software keyboards, zoom, long email addresses, and Ukrainian expansion.
- Wrap labels or change composition before truncating meaning. Icon-only controls require accessible names and familiar meaning.
- Horizontal scrolling is acceptable for an intrinsically two-dimensional canvas only when an equivalent focused/readable mobile path exists.

## 3. Navigation transformation

The draft UX Architecture proposes a desktop emphasis on Home, Plan, Calendar, Capture, and Inbox, and a mobile bottom navigation of Home, Plan, Capture, Calendar, and Inbox. This device grouping remains TARGET pending approval. Product Spec primary destinations that sit outside the prominent sequence, including Settings, remain discoverable through a specified library/utility pattern; they are not reclassified as secondary product capabilities. The exact mobile secondary and utility containers remain OPEN.

CURRENT navigation differs: Dashboard, Today, Calendar, Inbox, Tasks, Notes, Search, Timeline, Settings, and Labs are exposed through the AppShell; mobile bottom navigation uses Dashboard, Today, Capture, Calendar, and Inbox. Do not change it until product/route reconciliation is specified.

## 4. Component adaptation

| Component/surface | Desktop | Narrow/mobile |
| --- | --- | --- |
| Toolbar | One aligned control surface where actions fit | Preserve primary action and context; move secondary actions into an approved disclosure |
| Form | Labels and related fields may align | Single column; native controls avoid keyboard zoom; action order stays predictable |
| Dialog | Centered bounded overlay | Sheet or near-full-width dialog when content/keyboard requires it |
| Table | Comparison columns remain visible | Prioritized rows/cards or detail disclosure; no silent column loss |
| List | Dense aligned metadata | Preserve title/action; move lower-priority metadata below or into detail |
| Calendar week | Seven columns where readable | Day list/focused day composition; never seven compressed columns |
| Timeline | Time and content can align in lanes | One readable chronology with time adjacent to item |
| Search/command | Keyboard-centric with shortcuts visible | Touch-centric results; software keyboard and dismissal remain usable |

## 5. Density and typography

Mobile reduces simultaneous information, not essential information. It may hide repeated labels when structure remains programmatically and visually clear. It must not reduce body text or targets to preserve desktop density. Desktop uses denser alignment where comparison benefits; empty states still occupy the same structural surface.

## 6. Overflow and resilience

- Test at 320, 375, 768, and 1440 CSS px as representative widths, plus content-driven intermediate widths.
- Test 200% zoom/reflow separately; viewport simulation is not equivalent.
- User content wraps and can expand vertically. Fixed-height containers require a clear scroll region and visible affordance.
- Sticky controls must not cover focused fields, last rows, or error messages.
- Overlays need a bounded scroll area and a reachable close/cancel action with software keyboard visible.

## 7. Responsive acceptance

A responsive screen passes only when the same core job can be completed, primary actions remain reachable, no essential content is clipped or silently removed, reading/focus order is coherent, and the composition has been rendered in both themes with representative EN/UA and state data.
