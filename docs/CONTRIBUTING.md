# Contributing to Orvia

## Before making changes

- Read [AGENTS.md](../AGENTS.md) and the relevant [engineering rules](ENGINEERING_RULES.md).
- For product, UX, feature, navigation, onboarding, AI behavior, prioritization, notification, calendar, capture, privacy-control, or beta-scope changes, read the relevant sections of the [Product Specification](product/PRODUCT_SPEC.md) first. It is the canonical product source of truth and takes precedence over conflicting historical roadmaps and product documents. Code is evidence of current implementation, not product authority.
- Keep decisions marked open in the Product Specification open until an explicit product decision is made. Follow **Decision → Product Specification update → affected UX/feature specification or acceptance criteria → implementation**.
- Keep changes focused; avoid unrelated refactors and broad audits that the touched scope does not justify. Reuse existing repositories, UI primitives, authentication, and API boundaries. Do not add dependencies without a strong reason.

## Engineering and security

- Preserve account isolation: validate credentials and authorization server-side, derive ownership from the authenticated user, and keep service-role credentials and other secrets server-side. UI visibility is not authorization. See [Security](SECURITY.md) and [data boundaries](DATA_BOUNDARY.md).
- Consider security and privacy impact for relevant features, especially new data collection, AI processing, integrations, logging, export, and deletion. Real AI/provider calls and new external integrations need explicit scope and server-side boundaries.
- Use centralized storage helpers; do not add direct domain `localStorage` access in pages or components. Browser storage is not a secure vault, and local reset/export is not cloud account deletion.
- Keep English and Ukrainian copy, responsive desktop/mobile behavior, accessibility, and light/dark themes usable where applicable. Use explicit button types, accessible labels, keyboard/focus behavior, and confirmation for destructive actions.
- Update affected documentation when architecture, product decisions, data boundaries, setup, security, or QA expectations change.

## Review and validation

For code changes, run relevant tests, `npm run typecheck`, `npm run build`, `npm run security:guard`, and `git diff --check`; investigate task-related failures. Documentation-only changes default to the build requirement in [engineering rules](ENGINEERING_RULES.md) unless explicitly waived.

Report these separately, claiming only what was checked: implementation complete; automated validation complete; manual functional validation complete; visual validation complete; security validation complete; production validation complete. An automated pass does not establish visual quality or release readiness.

UI changes require representative rendered review of relevant desktop/mobile and light/dark states, including layout, typography, navigation, and accessibility behavior. Product-owner visual approval is required before a production UI release. Record skipped checks and remaining risks.

## Branches and handoff

Use short descriptive branch names; Codex-created branches use `codex/` by default. Keep commits and review descriptions specific. A handoff should state scope, product behavior, security/privacy impact, evidence, limitations, and screenshots or visual notes for UI work. Do not include secrets, tokens, or real user records.
