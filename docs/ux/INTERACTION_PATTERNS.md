# Orvia Interaction Patterns

**Status:** DECIDED global patterns; feature-specific behavior belongs in screen specifications

## 1. Action hierarchy

Each decision area has one visually primary action. Secondary actions remain visible when frequent; tertiary actions may enter a disclosure. Destructive actions use explicit language and separation. Navigation uses links; mutations use buttons.

## 2. Progressive disclosure

Show the information needed to understand and take the next action. Reveal advanced fields, source detail, history, and destructive operations on demand. Disclosure controls expose state and remain keyboard accessible. Do not hide required status, privacy impact, or the only recovery action.

## 3. Selection and detail

Lists may open an inline detail, side panel, sheet, or route according to content length and viewport. Selection does not silently mutate. The selected state is visible and programmatic. Returning preserves list query, filters, and scroll where practical.

## 4. Create and edit

- Fast creation asks only for the minimum valid information.
- Secondary properties use progressive disclosure.
- High-confidence Capture may create with Edit/Undo under the Product Spec; ambiguous input routes to Inbox.
- Input survives recoverable failure.
- Prevent duplicate submission and distinguish local/account persistence honestly.
- Save labels describe the object or change when ambiguity exists.

## 5. Confirmation and Undo

Use Undo for a real, bounded, reversible action. Use confirmation for account/data deletion, irreversible or high-impact data loss, significant planning changes, external actions, and ambiguous consequential interpretations. Confirmation names scope, consequence, and recovery. Do not show an Undo that cannot restore the prior state.

## 6. Loading, optimistic state, and feedback

Keep stable context visible. Disable only the affected action. Optimistic UI needs a rollback/error path and must not claim persistence before the product can support it. Place feedback near its cause; use global notices only for global impact. Async status is accessible without stealing focus.

## 7. Empty, partial, unavailable, and permission states

| State | Pattern |
| --- | --- |
| Empty | Preserve useful structure; state what is absent; offer only supported next action |
| Partial/stale/unverified | Show factual available data; label limitation quietly but inspectably; prevent completeness-dependent claims |
| Unavailable/error | Explain affected scope; preserve context/input; offer retry or manual path |
| External permission revoked | Explain missing source and impact; reconnect or continue without it |
| Account authorization denied | Do not expose existence/content; route to the appropriate account/access recovery |
| Intelligence unavailable | Keep manual product path and data access where available; offer retry for intelligence only |

## 8. Search and command interaction

Typing remains uninterrupted. Arrow-key result movement is visible, Enter activates the selected result, Escape dismisses the transient surface, and focus returns appropriately. Filters/scopes are readable. Recent history, if stored, uses approved storage/privacy rules. Search content is not analytics metadata.

## 9. Direct manipulation

Drag/drop or resize may support planning only when the outcome is previewed, valid drop zones are clear, keyboard/non-drag alternatives exist, timezone and conflict rules are preserved, and the mutation can be confirmed/undone as required. Pointer movement alone never changes a deadline or consumes Protected Time.

## 10. Keyboard shortcuts

Shortcuts supplement visible actions. They avoid editable-field and assistive-technology conflicts, use platform conventions where applicable, are discoverable near the action, and can be escaped. Exact global shortcuts remain OPEN pending collision and localization review.

## 11. Overlays

Use popovers for short contextual choices, dialogs for consequential focused tasks, sheets for narrow contextual work, and routes for durable/deep content. Avoid nested overlays. If unavoidable, Escape closes the innermost surface and focus returns through the stack.

## 12. Intelligence and automation

Suggestions state what, why, and impact. Significant beta changes expose review and explicit apply/adjust/not-now paths. User corrections feed only approved learning mechanisms. No animated AI treatment substitutes for a reason. Workspace intelligence exclusion is a real processing boundary, not an interaction-only toggle.
