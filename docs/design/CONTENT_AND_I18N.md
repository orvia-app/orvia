# Orvia Content and i18n

**Status:** DECIDED foundation; screen copy requires screen-level review
**Locales:** English (`en`) and Ukrainian (`ua`) are beta requirements

## 1. Voice

Orvia is calm, direct, adult, and specific. It helps without performing intelligence or judging productivity. Prefer a useful verb and concrete object over slogans, exclamation, or personality filler.

| Situation | Rule | Avoid |
| --- | --- | --- |
| Action | Use the result: “Save task”, “Apply plan”, “Try again” | “Continue”, “Submit”, “Do magic” when the outcome is unclear |
| Success | Confirm what changed and offer Edit/Undo only when real | Celebration, confetti language, vague “Success!” |
| Error | Say what failed, what was retained, and the next safe action | Raw errors, blame, false reassurance |
| Empty | Explain the state; add an action only when supported | Giant illustrations, guilt, invented creation flow |
| Intelligence | State suggestion, reason, and user choice | Human-like certainty, hype, opaque “AI decided” |
| Destructive | Name scope and consequence in title/body/action | Euphemisms, ambiguous “Remove”, hidden cancel |
| Partial/unavailable | Distinguish incomplete context from total failure | Treating unverified data as an emergency or as complete |

## 2. EN/UA implementation contract

- User-facing product strings use the existing centralized i18n architecture. Do not hardcode English in new UI where translation applies.
- Add the English and Ukrainian keys in the same change. Missing translation is a failed implementation state, not a fallback design.
- Translate meaning and action, not English word order. Ukrainian copy may expand; layouts wrap without hiding the action or data.
- Keep product names and domain terms consistent with approved glossary decisions. **OPEN:** maintain a formal EN/UA terminology glossary before large new feature work.
- User content is never translated automatically or truncated to accommodate chrome.

**CURRENT documentation debt:** `docs/product/PRODUCT_SPEC_UA.md` remains a v1.0 companion and is explicitly marked unsynchronized with canonical English v1.3. Translating and product-owner reviewing v1.1–v1.3 decisions is required before claiming Product Spec parity.

## 3. Dates, times, and numbers

- Format with the active locale and an explicit relevant timezone. Do not rely on server locale or implicit device zone when planning semantics require the planning timezone.
- Date-only values remain date-only. Timed instants display with zone context when ambiguity matters.
- Relative dates (“Today”, “Tomorrow”) need an absolute/readable date where misunderstanding has consequence.
- Week start, 12/24-hour choice, and detailed locale behavior follow product/user settings when implemented. Do not invent defaults in a screen spec.
- Use plural-aware formatting rather than string concatenation. Counts, durations, currency, and decimal separators follow locale.

## 4. Forms and validation

Labels describe the value. Helper text explains format or consequence before failure. Error text identifies the field/problem and correction without exposing internal details. Preserve entered data after recoverable errors. Placeholder text is an example or hint, never the only label.

## 5. State templates

| State | Content order |
| --- | --- |
| Loading | What is loading, if delay is material; avoid fake progress |
| Empty | State → useful context → supported action, if any |
| Partial | What is present → what may be missing → inspect/retry path |
| Error | What failed → retained state → next action |
| Permission denied | Which permission/boundary → impact → request/recovery/manual path |
| Intelligence unavailable | Manual capability remains → retry path; do not imply data loss |
| Destructive confirmation | Object/scope → consequence/recovery → explicit destructive verb |

## 6. Accessibility and privacy

Visible labels and accessible names use the same action wording. Status text is concise enough for announcement. Do not place task titles, note content, captures, search queries, email, personal URLs, tokens, raw errors, or arbitrary metadata in analytics/monitoring copy or event payloads.

## 7. Content acceptance

Review EN and UA in real rendered states with long labels, long user content, plurals, dates, validation, empty/error/partial states, and narrow layouts. A dictionary consistency test does not prove linguistic quality or layout acceptance.
