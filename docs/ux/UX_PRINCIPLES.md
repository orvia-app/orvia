# Orvia UX Principles

**Status:** DECIDED foundation
**Authority:** [Product Specification](../product/PRODUCT_SPEC.md) and [UX Architecture](../product/UX_ARCHITECTURE.md)

| Principle | Why | Concrete UI implication | Anti-pattern |
| --- | --- | --- | --- |
| Start from the user's job | Screens exist to help a person decide or act, not expose modules. | Name the screen's lead question and dominant work surface before choosing components. | Dashboard blocks with equal weight and no clear next step. |
| Clarity before decoration | Trust depends on understanding state and action. | Use type, language, alignment, and state labels before ornament. | Gradient, icon, or card used to compensate for unclear meaning. |
| Hierarchy before density | Dense tools stay calm when visual weight matches relevance. | Primary work dominates; chrome and metadata recede. | Navigation, alerts, toolbar, and content all at equal contrast. |
| Calm by default | Productivity software should reduce cognitive load. | Neutral surfaces; one local primary action; warnings match consequence. | Urgent colors, guilt, streaks, noisy counters. |
| Progressive disclosure | Users need common actions quickly without maintaining every property. | Keep frequent fields/actions visible; move uncommon options to detail/disclosure. | Huge default forms or important action hidden in a menu. |
| Predictable interaction | Consistency lets users move quickly and safely. | Same component, label, placement, keyboard, and state behavior for the same action. | Page-specific controls that look or behave differently. |
| Direct manipulation when it clarifies | Moving an item can be the clearest planning action. | Drag/drop may supplement explicit Move/Schedule actions with preview and Undo. | Drag-only interaction, silent mutation, or ambiguous drop target. |
| Fast path for frequent actions | Capture, navigation, search, and status changes should have little friction. | Primary action is close, keyboard-accessible, and does not require redundant confirmation. | Extra Save gate after a clear high-confidence capture. |
| Meaningful feedback | Users must know what changed and whether it persisted. | Show concise local outcome; preserve input; offer Edit/Undo when real. | Toast-only critical error or optimistic state without failure recovery. |
| Graceful empty states | Absence is a product state, not unfinished UI. | Keep useful structure; explain the state; offer only supported actions. | Giant empty card, illustration, or invented creation flow. |
| Honest system states | Partial, stale, unavailable, and unauthorized have different consequences. | Name scope/completeness and provide inspect/retry/manual path. | Present unverified data as complete or as a catastrophic error. |
| User control over intelligence | Orvia proposes; the user owns consequential decisions. | Short reason, impact, Apply/Adjust/Not now; correction path and autonomy boundary. | Silent replanning, fake certainty, or unexplained recommendation. |
| No surprise automation | Predictability is a privacy and trust property. | Confirm destructive/external/significant changes and state data use. | Hidden background behavior or decorative privacy switches. |
| Preserve context through failure | Failure should not make the user repeat thought or navigation. | Retain input, selected date/filter/context, and safe retry/manual route. | Clearing a capture or resetting a view after an API error. |
| Accessibility is interaction quality | Core work must not depend on a specific input, sense, or motion tolerance. | Semantic controls, keyboard, focus, text cues, contrast, reduced motion, reflow. | Color-only status, pointer-only reorder, inaccessible custom control. |
| Design the mobile job | Mobile context and reach differ from desktop. | Recompose into focused flows and sheets/detail views. | Seven compressed calendar columns or a scaled-down sidebar. |

## Decision test

For a proposed interaction, answer:

1. Which user job and core-loop step does it serve?
2. What is primary, secondary, and contextual?
3. What state, consequence, and recovery does the user see?
4. Can the same job be completed manually, on mobile, by keyboard, in EN/UA, and with reduced motion where applicable?
5. Does intelligence stay within the user's approved boundary?

If these answers are missing, the feature needs product/interaction design before UI implementation.
