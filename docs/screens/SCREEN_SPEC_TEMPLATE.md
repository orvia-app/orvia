# Orvia Screen Specification Template

**Status:** TEMPLATE
Copy this structure only after the product role and authority are known. Delete instructional text in the completed specification.

## Document control

- **Screen:**
- **Status:** `DECIDED` / `PARTIALLY DEFINED` / `NEEDS PRODUCT DESIGN`, with `CURRENT` / `TARGET` / `OPEN` / `OUT OF SCOPE` boundaries below
- **Owner/date:**
- **Authority:** Product Spec sections → approved UX Architecture decisions → feature/technical specification → applicable Design Foundation contracts
- **Current implementation evidence reviewed:**
- **Related specifications:**
- **Human visual acceptance:** `NOT REVIEWED` or reviewer + date + accepted/rejected decision + evidence link

## 1. Purpose

One sentence describing why this screen exists.

## 2. User goal

The question/job the user is trying to complete.

## 3. Product role

Primary/secondary/contextual/utility; relationship to Capture → Understand → Prioritize → Act and adjacent screens.

## 4. Information hierarchy

Ordered list: primary work, primary action, supporting context, metadata, chrome. State what must visually dominate and recede.

## 5. Layout

Regions, alignment, width behavior, scrolling/sticky behavior, and reading order. Include a wireframe only when it reduces ambiguity.

## 6. Primary actions

Action, preconditions, result, feedback, failure/recovery, confirmation/Undo.

## 7. Secondary actions

Same contract; state whether visible or disclosed.

## 8. Components

Approved shared components and any justified screen-specific composition. No arbitrary tokens.

## 9. States

Default, selected, editing, success, pending, disabled, permission, source/completeness, and domain states.

## 10. Loading

What remains visible, announcement, duplicate-action prevention, timeout/retry behavior.

## 11. Empty

Structure retained, exact intent of message, and supported action. Do not invent features.

## 12. Error

Scope, retained input/context, safe action, logging/privacy boundary.

## 13. Partial / stale / unavailable

What can be shown factually, what cannot be claimed, and how the user inspects/recovers.

## 14. Interaction

Navigation, selection, direct manipulation, disclosure, confirmation, Undo, focus changes, preserved context.

## 15. Keyboard

Tab order, shortcuts, arrow behavior, Escape, Enter/Space, focus movement/restoration, drag alternative.

## 16. Motion

Applicable tier/pattern, causality, interruption, and reduced-motion result.

## 17. Responsive

Desktop, tablet, mobile compositions; content-driven transition points; overflow; touch targets; keyboard/safe areas.

## 18. Light mode

Surface hierarchy, contrast pairs, semantic state treatment, screenshots required.

## 19. Dark mode

Layering, contrast, saturation control, semantic state treatment, screenshots required.

## 20. English

Key labels/messages, wrapping assumptions, locale formatting.

## 21. Ukrainian

Translated intent, expansion risks, terminology decisions, rendered review.

## 22. Accessibility

Semantics, names, status announcements, color independence, contrast, zoom/reflow, screen-reader and keyboard checks.

## 23. Security and privacy

Authorization, ownership, sensitive content, source/permission state, logging/analytics exclusions, external-content trust.

## 24. Analytics

Approved event names and bounded fields, or `NONE`. Never add content, queries, exact schedule data, URLs, email, tokens, or raw errors.

## 25. Acceptance criteria

Observable and testable behavior/visual criteria with separate automated, functional, accessibility, visual, security, and production evidence.

## 26. Visual references

Principle-level references and exact lesson. State what is not copied.

## 27. Open decisions

Questions that block or constrain implementation. Do not resolve them through mockups or code.

## 28. Out of scope

Explicit non-goals for this screen/version.

## 29. Decision status summary

- **DECIDED:** approved contracts this screen applies.
- **CURRENT:** directly reviewed implementation facts, with evidence and limits.
- **TARGET:** intended future behavior supported by the cited authorities; identify any pending approval.
- **OPEN:** unresolved decisions that implementation must not settle silently.
- **OUT OF SCOPE:** behavior excluded from this screen/version.

## Implementation observations / follow-up

Record discovered code/document conflicts without fixing unrelated code.
