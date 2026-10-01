# Orvia Visual QA

**Status:** DECIDED process
**Purpose:** verify the rendered experience against approved screen and system contracts

## 1. Before rendering

- Identify the Product Spec, foundation, component, and screen criteria under review.
- Record commit/worktree state and separate unrelated pre-existing changes.
- Use an approved test account and synthetic/non-sensitive data representative of real shapes.
- Do not place production secrets or service-role credentials in preview/client code.
- Define the state matrix before judging a settled happy path.

## 2. Minimum matrix

For each meaningful screen change, cover as applicable:

| Dimension | Representative coverage |
| --- | --- |
| Viewport | 1440 desktop, 768 tablet, 375 mobile; add 320/content-stress width where relevant |
| Theme | Light and dark |
| Locale | EN and UA, including long labels/content |
| Data | Empty, populated, long content, dense/overflow |
| System | Loading, success, validation, partial/stale/unverified, unavailable/error, permission denied |
| Interaction | Hover, focus, active, selected, disabled, pending, overlay open/close |
| Preferences | Reduced motion; system theme when relevant |

The matrix can be risk-based, but omitted cells are NOT REVIEWED. One desktop screenshot never establishes responsive or theme acceptance.

## 3. Review order

1. **Product truth:** correct job, actions, states, scope, and no misleading capability.
2. **Hierarchy:** primary work, action, support, metadata, chrome.
3. **Composition:** alignment, width, density, whitespace, scroll, overlay layering.
4. **Typography/content:** roles, wrapping, dates/times, EN/UA, errors and empty state.
5. **Components/states:** consistency, interaction feedback, focus, loading/error behavior.
6. **Themes:** surface separation, saturation, contrast, semantic meaning.
7. **Responsive:** intentional transformation, reachability, overflow, safe areas, keyboard.
8. **Motion:** causality, timing, interruption, reduced-motion result.
9. **Accessibility:** keyboard, focus, zoom/reflow, screen reader, contrast measurement.

## 4. Comparison method

Compare against the approved screen specification and acceptance criteria, not another company's screenshot or an unspecified feeling. A before/after comparison can reveal regression but does not make the older screen the target. Record exact defects: component, viewport/state, rule violated, and desired observable outcome.

## 5. Evidence handling

- Store screenshots/artifacts in an approved non-secret location and label route, viewport, theme, locale, state, date, and build/worktree identity.
- Synthetic fixtures are labelled. Preview-only substitutions do not enter production source.
- Do not expose real user content, tokens, email, URLs, or credentials in artifacts.
- A local render is not production validation; a static screenshot is not interaction/accessibility evidence.
- Record reviewer and decision: accepted, rejected, or accepted with explicit follow-up.
- Store the final human decision in the target screen specification's **Human visual acceptance** field, including reviewer, date, result, and a link to the evidence record. Missing or incomplete fields mean **NOT REVIEWED**.

## 6. Defect severity

| Severity | Examples |
| --- | --- |
| Blocker | Misleading/destructive action, inaccessible core journey, content/controls unreachable, cross-user exposure, false source completeness |
| Major | Broken hierarchy, mobile composition failure, unreadable theme/locale, missing error/empty state, focus loss |
| Moderate | Inconsistent component, spacing/type drift, overflow in secondary content, unclear metadata |
| Minor | Optical alignment or polish issue that does not impair task or system coherence |

## 7. Exit criteria

Visual acceptance requires representative matrix evidence, all blocker/major defects resolved, remaining limitations recorded, required accessibility interaction checks completed, and explicit Maksym approval where the Product Spec requires it. The decision is valid only when recorded in the screen specification with its evidence link. Automated build/test output is reported separately.
