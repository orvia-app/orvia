# Orvia Accessibility System

**Status:** DECIDED requirements; conformance UNVERIFIED until audited
**External baseline:** [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

Orvia targets WCAG 2.2 AA for the web product. This target does not constitute a conformance claim. Each release needs evidence for the affected journeys, components, content, themes, and viewports.

## 1. Global expectations

| Area | Requirement |
| --- | --- |
| Semantics | Use native elements first; landmarks and headings follow meaningful structure; name, role, value, and state are programmatic. |
| Keyboard | Every core action works without a pointer; order follows visual/logical flow; no trap outside a modal; shortcuts avoid input/assistive-technology conflicts. |
| Focus | Visible in both themes; not obscured by sticky UI; moved only when context changes; restored after transient surfaces close. |
| Labels | Inputs have persistent programmatic labels; icon-only controls have names; visible labels match accessible names. |
| Status | Async success/error/status changes are announced at an appropriate politeness level without stealing focus. |
| Color | Meaning is never color-only; selected, error, busy/free, priority, and source states use text/icon/shape as appropriate. |
| Contrast | Text targets WCAG AA minimum; meaningful component boundaries and focus indicators are measured on actual adjacent colors. |
| Motion | Honor reduced motion; motion is optional and never the sole carrier of meaning. |
| Touch | Aim for 44×44 CSS px for frequent mobile targets; meet WCAG 2.2 target-size minimum or document a valid exception/equivalent. |
| Zoom/reflow | Core journeys remain usable at 200% zoom and required reflow conditions without two-dimensional scrolling except intrinsically spatial surfaces. |

## 2. Component expectations

- **Dialogs/sheets:** labelled modal semantics, described purpose where useful, initial focus chosen deliberately, containment, Escape unless an irreversible operation is in progress, background inertness, and trigger restoration.
- **Menus/popovers:** use the interaction model matching the component. A simple disclosure region must not imitate a menu without menu keyboard behavior.
- **Forms:** identify errors in text, associate them with fields, retain user input, focus or summarize errors appropriately, and prevent duplicate submission.
- **Tabs/segmented controls:** expose selected state, correct relationships, keyboard operation appropriate to the pattern, and a visible focus position.
- **Tables:** preserve headers and relationships; responsive transformation must retain labels.
- **Calendars/timelines:** provide accessible names including date/time/type, keyboard routes that do not require pixel navigation, text alternatives for conflicts/current time, and a readable mobile representation.
- **Drag/reorder:** provide a keyboard and non-drag alternative as required by WCAG 2.2.
- **Skeleton/loading:** do not announce every visual placeholder; expose one useful loading status and prevent accidental duplicate actions.

## 3. Content and cognitive load

Use plain language, consistent labels, stable placement, and short recovery steps. Avoid countdown pressure, shame, unexplained scoring, and attention competition. Destructive confirmations state the object and consequence. Authentication must not require a cognitive-function test without an accessible alternative.

## 4. Verification

For affected journeys, use automated checks as defect detection, then perform keyboard-only review, screen-reader review, focus-order inspection, contrast measurement, 200% zoom/reflow, reduced-motion review, and touch/device checks. Test loading, error, partial, validation, and destructive states, not only the settled screen.

Record browser, operating system, assistive technology, viewport, theme, locale, and data state. Report NOT REVIEWED rather than PASS when evidence is absent.

## 5. Current evidence and gaps

CURRENT code includes visible focus CSS, native fields, focus helpers for dialogs, explicit button types in shared components, and a global reduced-motion rule. Historical rendered checks covered representative focus behavior. Full screen-reader output, WCAG contrast measurement, 200% zoom, native mobile keyboard, and exhaustive route coverage remain unverified.

Primary external guidance: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WCAG 2.2 Understanding documents](https://www.w3.org/WAI/WCAG22/Understanding/), and [Apple motion guidance](https://developer.apple.com/design/human-interface-guidelines/motion).
