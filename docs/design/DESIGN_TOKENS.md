# Orvia Design Tokens

**Status:** DECIDED semantic model; CURRENT values recorded; future values OPEN where stated
**Authority:** [Master Design System](MASTER_DESIGN_SYSTEM.md)

## 1. Token contract

Components consume semantic roles, not raw palette values. A token name describes purpose rather than a hue or a particular screen. Light and dark values may differ while preserving the same role and hierarchy.

The current CSS is an implementation baseline. Recording a value here does not freeze it. Changing an adopted value requires representative contrast checks, affected-component review, both themes, and an updated decision record.

## 2. Color

| Semantic role | Required use | CURRENT implementation | Target rule |
| --- | --- | --- | --- |
| Canvas/background | App environment | `--canvas`; `#fafaf9` / `#191a1d` | Quieter than active content; never encode status |
| Surface | Main content/control surface | `--surface`; `#fff` / `#202125` | Clear separation from canvas without relying on shadow |
| Elevated surface | Menus, dialogs, floating layers | No dedicated global token | **OPEN:** add only when component audit justifies it |
| Subtle/hover | Grouping and transient hover | `--subtle`, `--hover` | Remain distinguishable in both themes; hover cannot be sole cue |
| Sidebar/chrome | Navigation environment | `--sidebar` | Recede behind active work |
| Foreground | Primary text/icons | `--foreground`; `#202124` / `#ededf0` | Meet contrast requirements on intended surfaces |
| Muted foreground | Secondary context | `--muted`; `#62636a` / `#a4a5ae` | Readable, never used to hide necessary information |
| Border | Boundaries/dividers | `--line`; `#dededb` / `#36373e` | Use sparingly; non-text contrast must be measured when meaningful |
| Accent | Selection, focus, primary Orvia action | `--accent`; `#6446c7` / `#a28aec` | Violet is deliberate and limited; not a general decoration color |
| Accent hover/soft/on-accent | Accent interaction states | Existing global variables | Preserve legible text and distinct interaction state |
| Success | Confirmed positive outcome | `--success`, `--success-soft` | Do not imply completion without factual success |
| Warning | Attention with recoverable risk | `--warning`, `--warning-soft` | Calibrated to consequence; avoid alarm for merely unverified data |
| Danger | Destructive/error state | `--danger`, `--danger-soft` | Reserved for destructive action, invalid state, or material failure |
| Info | Neutral information | Currently mapped to accent-soft in badges | **OPEN:** decide whether a distinct info role is needed |
| Focus | Keyboard focus indicator | Currently accent | Must remain visible across adjacent colors; do not remove |

## 3. Typography

| Role | Purpose | CURRENT fact | Target rule |
| --- | --- | --- | --- |
| Display | Public/editorial emphasis | No single shared token | Rare in authenticated product; exact scale OPEN |
| Page title | Route orientation | About 24–26 px in current system | Compact, unboxed, one primary title |
| Section title | Major content division | About 16–20 px | Stronger than body without card-title inflation |
| Body | Main reading/action content | About 14–16 px | Comfortable line length and wrapping |
| Secondary | Supporting context | Often 14 px muted | Must remain readable and semantically useful |
| Caption | Timestamps/compact metadata | Often 12 px | Avoid for essential actions or long prose |
| Label | Form/control identification | Shared field labels | Persistent where needed; placeholder is not a label |
| Code/data | IDs, time, numeric/tabular data | Geist Mono available | Use only when alignment or literal data benefits |

**CURRENT:** Geist Sans and Geist Mono with system fallbacks. **OPEN:** whether a distinct display face adds product value. Do not add a font solely to imitate a reference product.

## 4. Spacing and layout

The current implementation uses a 4 px base rhythm, typical control gaps of 8/12 px, section spacing of 16/20 px, and page gutters of 24/32 px. Existing content caps include approximately 1120 px for main content, 800 px for narrow pages, 720 px for reading, 384 px for auth, and 440–672 px for dialogs.

Target rules:

- Use a consistent base rhythm; exceptions need a component reason.
- Internal component spacing is tighter than spacing between conceptual groups.
- Page gutters respond to viewport and safe areas.
- Maximum width follows reading/comparison needs, not a universal card width.
- Dense surfaces reduce decoration before reducing legibility or hit area.
- **OPEN:** final named spacing scale and content-width tokens after representative screen stress tests.

## 5. Radius

| Role | CURRENT fact | Intended use |
| --- | --- | --- |
| Subtle | 6 px | Compact navigation, tags, small grouped controls |
| Standard | 8 px | Buttons, inputs, menus |
| Prominent | 12 px, with some current 16 px card usage | Dialogs or a deliberate focal surface |
| Pill | Fully rounded | Compact status/selection only |

The target requires fewer prominent rounded containers. **OPEN:** reconcile current 16 px cards with the role scale during component migration.

## 6. Elevation

| Role | Meaning |
| --- | --- |
| None | Canvas, inline sections, lists, static content |
| Subtle | Rare lifted control or surface where separation cannot be achieved by layout |
| Elevated | Popover/menu or temporary floating panel |
| Overlay | Dialog/sheet above an obscured background |

Current shadows are implementation facts (`0 8px 28px #0002` popover; `0 24px 80px #0003` dialog). Final elevation recipes are **OPEN** pending light/dark overlay review.

## 7. Motion tokens

| Role | Meaning | CURRENT fact |
| --- | --- | --- |
| Instant | State should not make the user wait | No duration token |
| Fast | Hover, press, focus, selection | About 140–160 ms |
| Normal | Small entrance/exit or local state change | About 180–200 ms |
| Emphasized | Rare causal transition | **OPEN**; ordinary UI should stay under Product Spec's 250 ms range |

Durations and easing rules are defined in [Motion System](MOTION_SYSTEM.md). Reduced motion is a behavior contract, not a second duration scale.

## 8. Token acceptance

A new or changed token is acceptable only when:

- a semantic role cannot be expressed by an existing token;
- at least three consumers or a strong cross-product need justify it, unless the role is inherently singular such as focus;
- light and dark mappings are specified;
- contrast and meaningful non-text boundaries are measured where applicable;
- responsive and state behavior is understood;
- representative screens are rendered before adoption;
- raw values are not duplicated into screen-specific styling.
