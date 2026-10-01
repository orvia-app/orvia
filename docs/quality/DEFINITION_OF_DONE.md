# Orvia Definition of Done

**Status:** DECIDED quality gates
“Complete” must name the completed gate. Code merged or tests passing alone is insufficient.

For UI work, the required order is:

**SPECIFICATION → IMPLEMENTATION → AUTOMATED VALIDATION → RENDERED VISUAL QA → HUMAN VISUAL ACCEPTANCE → MERGE**

Merge occurs only after every required earlier gate has its own evidence or an explicitly authorized exception. Human visual acceptance is recorded in the affected screen specification with reviewer, date, decision, and linked evidence.

## 1. Engineering DoD

- Approved requirement and screen/component contracts are implemented without unrelated changes.
- Strict types, validation, ownership boundaries, storage/repository rules, and Next.js version guidance are followed.
- Loading/error/concurrency/retry behavior is implemented where applicable.
- Relevant focused tests, typecheck, build, security guard, RLS/static checks, and `git diff --check` pass as required by repository instructions.
- Failures, skipped checks, environment limits, and unrelated pre-existing issues are reported honestly.

## 2. UX DoD

- User goal, primary/secondary actions, state model, recovery, confirmation/Undo, and adjacent-screen relationship match approved specifications.
- Manual path remains usable when intelligence is unavailable where required.
- No open product decision was settled in code.
- Representative end-to-end journey was manually exercised with success and failure paths.

## 3. Visual DoD

- Screen meets observable hierarchy, consistency, density, typography, spacing, component, theme, and state criteria.
- Representative desktop/tablet/mobile, light/dark, EN/UA, and data/state matrix is rendered according to risk.
- Visual defects are recorded and resolved or explicitly accepted.
- Maksym has approved the required real rendered evidence.

## 4. Accessibility DoD

- Semantic structure, names/labels, keyboard path, visible/unobscured focus, focus management, announcements, color independence, and contrast are reviewed.
- 200% zoom/reflow, reduced motion, and representative screen-reader behavior are tested.
- Touch targets and non-drag alternatives meet the approved contract.
- WCAG conformance is claimed only after a scoped audit supports it.

## 5. Security and privacy DoD

- Authenticated identity and owner/workspace authorization are enforced at server/data boundaries.
- RLS and service-role route ownership are reviewed where affected; static checks are not reported as live isolation proof.
- Secrets remain server-side; user content and credentials do not enter logs, analytics, monitoring, fixtures, or artifacts.
- Permission, source completeness, intelligence eligibility, export/delete, and external-content behavior are truthful.
- Required runtime/live/deployment checks are completed or explicitly pending.

## 6. i18n and content DoD

- EN and UA keys exist and linguistic intent is reviewed.
- Long labels, pluralization, dates/times/numbers, errors, empty states, and destructive copy render correctly.
- No applicable user-facing English is hardcoded outside the i18n architecture.
- Copy does not overclaim intelligence, integrations, persistence, security, or release status.

## 7. Production DoD

- Approved migrations/configuration are applied to the intended target with separate authorization.
- Deployment uses the reviewed build and environment; secrets/bundles and monitoring behavior are verified.
- Production smoke, rollback/recovery, and data/authorization checks appropriate to risk are completed.
- Release decision records evidence from every required gate.

## 8. Completion report

Every handoff reports these separately:

| Gate | Allowed status |
| --- | --- |
| Implementation | COMPLETE / PARTIAL / NOT STARTED |
| Automated validation | COMPLETE / PARTIAL / FAILED / NOT RUN |
| Manual functional validation | COMPLETE / PARTIAL / FAILED / NOT RUN |
| Visual validation | ACCEPTED / REJECTED / PARTIAL / NOT REVIEWED |
| Accessibility validation | COMPLETE / PARTIAL / FAILED / NOT REVIEWED |
| Security validation | COMPLETE / PARTIAL / FAILED / NOT REVIEWED |
| Production validation | COMPLETE / PARTIAL / FAILED / NOT APPLICABLE / NOT RUN |

Do not collapse these into “done”, “ready”, “safe”, or “PASS.”
