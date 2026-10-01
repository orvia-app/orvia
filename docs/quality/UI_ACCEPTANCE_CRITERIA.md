# Orvia UI Acceptance Criteria

**Status:** DECIDED global framework
**Use:** add screen-specific criteria; do not replace them with this checklist

Automated checks establish code evidence. They do not establish UX quality, accessibility conformance, rendered visual quality, security, production behavior, or release readiness.

Required UI delivery sequence:

**SPECIFICATION → IMPLEMENTATION → AUTOMATED VALIDATION → RENDERED VISUAL QA → HUMAN VISUAL ACCEPTANCE → MERGE**

## 1. Criterion format

Write observable outcomes:

> Given **context/state**, when **user action or viewport condition**, then **observable result**, including **recovery/constraint** where relevant.

Avoid “clean”, “premium”, “intuitive”, “looks good”, “responsive”, or “accessible” without measurable evidence.

Examples:

- **Hierarchy:** “At 1440 px in a populated Week view, the schedule surface has greater visual weight and area than navigation, timezone, and source metadata.”
- **Mobile:** “At 375 px, all primary actions remain reachable without page-level horizontal overflow; Week uses the focused mobile composition in the approved screen specification.”
- **Failure:** “When the Event source fails, returned Task data remains labelled partial, the selected range is retained, and Retry is keyboard reachable.”

## 2. Global criteria

### Hierarchy and composition

- The screen's lead user job and primary content are identifiable within the settled state.
- Exactly one local primary action dominates each decision area.
- Supporting navigation, metadata, and informational state do not compete with primary work.
- Grouping remains understandable without excessive cards, borders, or shadows.

### Consistency and component use

- Repeated actions use approved shared components and state behavior.
- No arbitrary raw color, spacing, radius, typography, elevation, or motion value is introduced without a system decision.
- The screen does not create a visual language that conflicts with adjacent surfaces.

### Density, typography, and spacing

- Information required for comparison remains aligned and scannable.
- Essential labels/actions are not truncated; user content wraps or exposes a deliberate expansion path.
- Type roles and spacing groups express hierarchy consistently in EN and UA.
- Empty states retain useful structure and do not appear unfinished.

### States and recovery

- Loading, empty, success, validation, partial/stale/unverified, unavailable/error, permission, and destructive states are defined where applicable.
- User input, selection, and context survive recoverable failure.
- Status wording states what happened and the next safe action without raw error or unsupported claims.

### Interaction

- Hover, focus, active, selected, pending, and disabled states are distinguishable.
- Mutation feedback is placed at the correct scope and duplicate actions are prevented.
- Confirmation and Undo match actual consequence/reversibility.
- Direct manipulation has a non-drag alternative and never silently changes unrelated domain fields.

### Accessibility

- Core journey works by keyboard with visible, unobscured focus and correct restoration.
- Names, roles, values, states, labels, status announcements, and reading order are programmatically meaningful.
- Text and meaningful non-text contrast are measured; status does not rely on color.
- 200% zoom/reflow, reduced motion, and representative screen-reader behavior are reviewed.
- Frequent mobile targets aim for 44×44 CSS px and satisfy WCAG 2.2 minimum or a documented exception.

### Responsive

- Desktop, tablet, and mobile compositions preserve the same core job and essential information.
- Mobile is intentionally recomposed; no essential desktop region is merely squeezed or silently removed.
- No unintended horizontal overflow, covered content, unreachable bottom action, or software-keyboard obstruction.

### Theme and content

- Light and dark modes preserve hierarchy, contrast, source/status meaning, and focus.
- EN and UA render representative long copy, dates, counts, errors, and empty states.
- Copy is direct, consistent, privacy safe, and does not imply unimplemented intelligence/integrations.

### Security and privacy

- UI state does not substitute for authorization.
- Sensitive content is excluded from analytics/monitoring/logs according to contracts.
- Ownership, workspace context, source completeness, and permission impact are represented honestly.

## 3. Required evidence labels

Use only:

- **PASS:** required evidence was executed and met the criterion.
- **FAIL:** evidence found a criterion violation.
- **PARTIAL:** only stated subsets were checked; list them.
- **NOT REVIEWED:** no adequate evidence.
- **NOT APPLICABLE:** criterion genuinely does not apply, with reason.

Do not infer PASS from a prior build, another viewport, a component test, or source inspection.

## 4. Acceptance record template

| Criterion | Evidence type | Environment/state | Result | Evidence/link | Limit |
| --- | --- | --- | --- | --- | --- |
| Primary surface dominates | Rendered visual | 1440 light, populated |  |  |  |
| Mobile core action reachable | Rendered + functional | 375 dark, long UA |  |  |  |
| Keyboard journey | Manual interaction | Desktop, error + success |  |  |  |
| Contrast/focus | Measurement/manual | Both themes |  |  |  |
| Owner isolation | API/live security | Two test users |  |  |  |

## 5. Release rule

A screen may have implementation and automated validation complete while visual, accessibility, security, or production validation remains pending. Product-owner visual acceptance is a separate release gate and must be recorded in the screen specification with representative real rendered evidence.
