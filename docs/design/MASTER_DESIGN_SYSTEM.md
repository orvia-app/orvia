# Orvia Master Design System

**Status:** DECIDED foundation; exact values and screen behavior remain open where labelled
**Date:** 1 October 2026
**Authority:** [Product Specification v1.3](../product/PRODUCT_SPEC.md) → approved UX Architecture decisions → feature/technical specifications → Design Foundation → screen specifications → implementation/evidence

## 1. Purpose

This is the entry point for designing and reviewing Orvia. It turns the product direction into reusable rules and routes details to the smallest relevant document. It does not declare the current UI visually accepted or production ready.

Orvia is a personal productivity workspace built around **Capture → Understand → Prioritize → Act**. Its interaction boundary is **Orvia suggests. You decide.** Its intended feeling is a quiet operating system for a person's life: calm, premium, trustworthy, focused, intelligent, and intentional.

“Premium” has no independent acceptance value. In Orvia it means clear hierarchy, disciplined density, precise alignment, coherent behavior, useful feedback, careful copy, accessible interaction, and real rendered quality across themes and viewports.

## 2. Canonical authority map

Higher rows constrain every row below them. A lower document may add detail inside an approved boundary; it cannot change a higher decision. Draft text, research, code, and historical documents do not acquire product authority through repetition.

| Decision or evidence type | Canonical location | Authority boundary |
| --- | --- | --- |
| Product vision, requirements, beta scope, priorities, product terminology, and product decisions | [Product Specification](../product/PRODUCT_SPEC.md) | Highest product authority. |
| Cross-product UX architecture | [UX Architecture](../product/UX_ARCHITECTURE.md) | Owns approved UX decisions only. It is currently a draft; TARGET proposals remain proposals until approved or promoted to the Product Specification. |
| Feature behavior, domain/technical boundaries, and feature acceptance criteria | Approved feature/technical specification, currently including [Calendar + Plan beta](../product/CALENDAR_PLAN_BETA_SPEC.md) | Must remain within Product and approved UX decisions. OPEN sections are not implementation authority. |
| Cross-product visual direction and design governance | This Master Design System | Governs design only within Product, UX, and feature boundaries. |
| Semantic visual tokens | [Design Tokens](DESIGN_TOKENS.md) | Current values and OPEN future choices remain explicitly separate. |
| Reusable component and interaction contracts | [Component System](COMPONENT_SYSTEM.md) and [Interaction Patterns](../ux/INTERACTION_PATTERNS.md) | Screens reuse these contracts; they do not invent product behavior. |
| Motion rules | [Motion System](MOTION_SYSTEM.md) | Constrained by Product Spec §58 and accessibility requirements. |
| Responsive rules | [Responsive System](RESPONSIVE_SYSTEM.md) | Exact screen composition belongs in an approved screen specification. |
| Accessibility rules | [Accessibility System](ACCESSIBILITY_SYSTEM.md) | Defines the target and evidence requirements; it does not claim conformance. |
| Content and EN/UA rules | [Content & i18n](CONTENT_AND_I18N.md) | Product terminology and feature meaning come from higher documents. |
| Screen-specific presentation and behavior | One specification per screen using the [Screen template](../screens/SCREEN_SPEC_TEMPLATE.md); status tracked in the [Screen inventory](../screens/SCREEN_INVENTORY.md) | Must cite and follow every applicable higher layer. |
| Global acceptance criteria | [UI Acceptance Criteria](../quality/UI_ACCEPTANCE_CRITERIA.md) plus feature/screen criteria | Automated evidence cannot establish visual acceptance. |
| Visual QA process and evidence requirements | [Visual QA](../quality/VISUAL_QA.md) | Defines the rendered review process and evidence record. |
| Final human visual approval | The target screen specification's **Human visual acceptance** record, linked to Visual QA evidence and naming reviewer/date | Approval is screen/release evidence, not a reusable design rule. Missing record means NOT REVIEWED. |
| Cross-discipline completion gates | [Definition of Done](../quality/DEFINITION_OF_DONE.md) | Engineering, UX, visual, accessibility, security, i18n, and production remain separate statuses. |
| External research | [Visual References](VISUAL_REFERENCES.md) | Evidence and inspiration only; never Orvia authority by itself. |
| Current implementation evidence | Source code, focused current-implementation records, and validation artifacts | Describes CURRENT behavior only. It cannot redefine TARGET product behavior. |
| Historical context | Documents explicitly marked historical/legacy | Context only; never current authority. |

### Status vocabulary

| Status | Meaning |
| --- | --- |
| **DECIDED** | Explicitly approved at the correct authority layer. |
| **CURRENT** | Directly evidenced in the present repository/validated environment; not automatically the target. |
| **TARGET** | Intended or proposed future behavior. It is authoritative only when its governing document/decision is approved. |
| **OPEN** | Unresolved; implementation must not choose silently. |
| **OUT OF SCOPE** | Excluded from the stated version or work item; it is not necessarily rejected forever. |

### Canonical terminology

| Term | Canonical meaning and status |
| --- | --- |
| **Home** | DECIDED target product area answering “What matters now?” **Dashboard** is the CURRENT route/label; route migration remains OPEN. |
| **Plan** | DECIDED target decision surface answering how to use available time. **Today** is a CURRENT route/label; its retirement, rename, or distinct role remains OPEN. |
| **Calendar** | DECIDED primary factual schedule area answering “What does my time look like?” Its current read-only UI and unresolved target interactions remain separately labelled. |
| **Inbox** | DECIDED attention queue for clarification, approval, missing information, duplicates, decisions, and conflicts; not capture history. |
| **Tasks & Notes** | DECIDED primary product area/library. Tasks and Notes remain distinct domain objects; the exact combined route model is OPEN. |
| **Capture** | DECIDED global action available from almost anywhere; not a destination. |
| **Search / Ask Orvia** | DECIDED retrieval direction. Keyword Search is CURRENT; the Ask Orvia beta slice and implementation remain OPEN. |
| **Orvia Intelligence** | Product-wide intelligence capability and controls, not a destination label. Exact model/data architecture remains OPEN. |
| **Orvia Next** | Target recommendation experience answering “What should I do next?”, not a separate chat product. |
| **AI Chat** | CURRENT scripted mock evidence; OUT OF SCOPE as a separate core destination. |
| **Projects** | DECIDED lightweight goal/context grouping and beta capability; secondary in the Product Specification. Detailed UX remains OPEN. |
| **Workspaces** | DECIDED shallow top-level context with Personal/Work/Business defaults; secondary capability/context control. Exact switcher behavior remains OPEN. |
| **Settings** | DECIDED primary destination. It may use a quieter utility placement without being reclassified as secondary product scope. |

## 3. System principles

1. **The user's work leads.** The active task, plan, calendar, note, or decision has the strongest hierarchy. Navigation and metadata recede once orientation is established.
2. **Structure is felt before it is seen.** Use spacing, alignment, type, and grouping before adding borders, shadows, or containers.
3. **Density follows the job.** Calendars, lists, and search results can be information dense. Forms and consequential decisions need more breathing room. Empty space must still communicate structure.
4. **Progressive disclosure protects focus.** Frequent actions stay near the object; uncommon properties and destructive actions move into clear secondary surfaces.
5. **Every state is truthful.** Loading, empty, partial, stale, unavailable, permission denied, and error states must remain distinct. A visually calm state may not obscure material risk.
6. **Intelligence stays inside the workflow.** Suggestions include a reason and a decision path. AI styling, decorative sparkles, or anthropomorphic status do not establish intelligence.
7. **One language across screens.** Shared components, tokens, state patterns, and content rules apply everywhere. A screen may specialize composition, not invent a separate visual system.
8. **Light, dark, mobile, keyboard, and EN/UA are design inputs.** They are not cleanup tasks after desktop English light mode.

## 4. Visual personality

| Quality | Observable expression | Rejected expression |
| --- | --- | --- |
| Calm | One clear focal area; limited simultaneous emphasis; restrained status treatment | Equal emphasis, urgent red dashboards, decorative motion |
| Premium | Precise alignment, typography, state behavior, and finish | Large cards, gradients, or blur used as shortcuts to quality |
| Trustworthy | Explicit ownership/source state, predictable actions, recoverable input, honest limitations | Hidden automation, vague errors, fake completeness |
| Focused | Primary action near primary content; supporting chrome recedes | Toolbars and sidebars competing with work |
| Intelligent | Relevant suggestions with short reasons and control | AI branding applied to ordinary deterministic behavior |
| Intentional | Every border, surface, icon, and animation has a functional reason | Repeated ornament or arbitrary page-specific styling |

## 5. Visual hierarchy and composition

The default hierarchy is **primary work → primary action → supporting context → metadata → global chrome**. Screens must identify these layers before layout work begins.

- Page titles orient; they do not become hero panels inside the authenticated app.
- Toolbars group actions that operate on the same surface. They should read as one system, not unrelated buttons.
- Cards are reserved for genuinely independent or movable conceptual units. Do not place every section, row, metric, and empty state in a rounded card.
- Lists favor alignment, whitespace, and separators. Dense data uses columns or tables when comparison matters.
- Alerts match consequence. Unavailable or destructive states may interrupt; partial or unverified context is usually quieter and inspectable.
- Empty states keep the useful structure visible when that structure provides orientation, as in calendars and lists.

## 6. Surfaces, shape, and depth

- Use the canvas for the application environment, a primary surface for active work, and an elevated surface only when layering or temporary focus is real.
- Borders define boundaries or grouping. Avoid double borders, border-inside-card repetition, and separators with no information purpose.
- Shadows communicate elevation for overlays, menus, floating toolbars, and rare lifted surfaces. Static page sections should not need shadow stacks.
- Radius follows object scale and behavior: subtle for small controls, standard for components, prominent for overlays or a deliberate focal surface, pill only for compact statuses or segmented selection.
- Glass and blur are OUT OF SCOPE as a general product motif. A future platform-specific treatment requires an explicit design decision and accessibility review.

## 7. Typography and iconography

- Typography establishes hierarchy before color or containers. Use a small, named role set; avoid page-specific sizes.
- Body and data text prioritize readability. Display typography is for public/editorial surfaces, not routine product chrome.
- Numerical and time data must align and scan consistently; use the code/data role when tabular behavior is required.
- Icons clarify a recognized action, source, or state. Provide visible text when the meaning is unfamiliar or consequential.
- Use one coherent outline icon family in a surface. Match stroke, optical size, and corner language. Do not use icons as decoration or as the only carrier of status.

## 8. Color and themes

- Neutral surfaces carry most of the product. Restrained violet identifies selection, focus, and important Orvia actions.
- Semantic colors communicate meaning and never replace text, icons, or structure.
- Light mode uses soft neutral canvas and clear content surfaces; avoid vast harsh white areas and low-contrast gray text.
- Dark mode uses layered charcoal with readable separation; avoid pure-black panel stacking and saturated violet glow.
- Theme parity means equal hierarchy and state clarity, not direct numeric inversion.
- Exact future palette values remain **OPEN** until contrast measurement and representative rendered review. Current values are catalogued in [Design Tokens](DESIGN_TOKENS.md).

## 9. Design states

Every applicable screen and component specifies: default, hover, focus, active/selected, disabled, loading, success, empty, partial/stale, unavailable/error, validation, and destructive confirmation. State design must answer:

1. What happened?
2. Is the user's input/data retained?
3. What can the user do next?
4. Is the information complete and current?

## 10. Current implementation and target

**CURRENT:** The local app has semantic light/dark colors, Geist/system typography, shared buttons/cards/fields/badges/page primitives, visible focus, reduced-motion CSS, a desktop sidebar, a mobile drawer/bottom navigation, EN/UA dictionaries, and a Calendar-specific visual implementation. The exact implemented values are evidence in [Design Tokens](DESIGN_TOKENS.md) and the [implemented snapshot](../ORVIA_DESIGN_SYSTEM.md).

**DESIGN TARGET:** Apply this system coherently to approved product areas through screen specifications and shared primitives. The primary working surface should dominate, responsive layouts should recompose, and state/content behavior should be explicit before implementation.

**OPEN:** Final logo/brand identity; any token value marked open; Dashboard→Home route migration; Today disposition relative to Home/Plan; device-specific navigation grouping while UX Architecture remains draft; mobile secondary/utility-navigation containers; detailed UX for incomplete screens; exhaustive accessibility conformance.

## 11. Design change control

Required delivery sequence:

**SPECIFICATION → IMPLEMENTATION → AUTOMATED VALIDATION → RENDERED VISUAL QA → HUMAN VISUAL ACCEPTANCE → MERGE**

1. Identify the proposed product, component, token, or screen change.
2. Locate the highest source-of-truth rule it affects.
3. If it changes a product decision, update the Product Spec and decision log first.
4. Update the relevant foundation/component/screen contract and record the reason.
5. Implement with existing primitives and semantic tokens where applicable.
6. Run engineering, accessibility, content, theme, and responsive checks appropriate to the change.
7. Perform visual QA against the screen spec with representative real states.
8. Record human visual acceptance in the screen specification with reviewer, date, decision, and linked evidence before merge/release where the gate applies.

Screen-specific CSS or components must not introduce new token values or interaction patterns merely to make one screen look finished. If the shared system cannot express a legitimate need, change the system deliberately and assess downstream screens.

## 12. How Codex/AI agents must use this documentation

1. Read the Product Spec, relevant approved UX decisions, applicable feature/technical specification, this foundation, and the target screen specification before implementation.
2. Distinguish DECIDED, CURRENT, OPEN, and OUT OF SCOPE statements.
3. Do not invent unresolved product decisions, arbitrary tokens, or new component patterns.
4. Reuse the component, interaction, content, responsive, motion, and accessibility contracts that apply.
5. Do not interpret “premium”, “clean”, or “modern” subjectively; translate them into the observable criteria here and in the screen spec.
6. Do not redesign unrelated screens or promote Labs/mock functionality into core scope.
7. If requirements conflict, identify the conflict and follow the authority chain; do not silently merge interpretations.
8. Update documentation before implementation when an approved change alters the contract.
9. Separate source facts, target behavior, assumptions, and unknown production state.
10. Treat automated, functional, accessibility, visual, security, and production validation as separate evidence.
11. Treat human visual acceptance as a required gate.
12. Stop before commit, push, PR, migration, or deployment unless the task explicitly authorizes it.

## 13. Implementation observations / follow-up

- The current Calendar is implemented but its visual result has not received final human acceptance. [Calendar screen specification](../screens/CALENDAR.md) separates current behavior from its design target.
- Current navigation labels/routes differ from the target IA: Dashboard and Today exist; a dedicated Plan route does not. This requires product/UX reconciliation before navigation implementation.
- The existing UI primitives do not yet cover every component family in the target system. Absence of a primitive is not permission to choose arbitrary styling.
- Existing rendered review is representative rather than exhaustive; it does not prove WCAG conformance, production behavior, or all light/dark/mobile/UA states.
