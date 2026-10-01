# ORVIA — PRODUCT SPECIFICATION v1.3

**Status:** Product Source of Truth<br>
**Date:** 1 October 2026<br>
**Stage:** Pre-private-beta / Product Architecture v2<br>
**Owner:** Maksym Andriienko

> This document is the product source of truth for Orvia. When older product/roadmap documentation conflicts with this specification, this specification takes precedence unless a newer approved version explicitly supersedes it.

## 1. Product Vision
Orvia is a personal system for managing attention, tasks, and time that turns unstructured information into clear next actions.

**Mission:** help people move from what is in their head to the right next action with less organizational work and more control over their time.

**Core user problem:** useful intentions arrive as incomplete thoughts across tasks, notes, commitments, and contexts. People must remember, classify, prioritize, schedule, and repeatedly re-evaluate them across disconnected tools.

**Product promise:** Orvia helps capture, understand, prioritize, and act while keeping consequential decisions visible and under the user's control. **Orvia suggests. You decide.**

Users should not have to constantly remember everything themselves, manually sort information, assign priority to every task, continually rebuild their day, check multiple places to understand what to do, or spend excessive time maintaining a productivity system.

**The level of Orvia autonomy is always controlled by the user.**

### Core outcome
**Less time organizing → more time for what matters, without losing results.**

Ideal user statement:
> “I pay for Orvia because it gives me more free time and lets me focus on what matters to me without losing results.”

## 2. Core Product Loop
**Capture → Understand → Prioritize → Act**

- **Capture:** a few words, task, note, idea, event, reminder, URL, and later voice/Telegram/mobile input.
- **Understand:** determine type, destination, deadline, timing, approximate duration, relationships, and missing information.
- **Prioritize:** consider deadline, importance, calendar, available time, estimated duration, workspace/project, postponements, behavior, learned preferences, context, and user-provided energy/state.
- **Act:** help answer **What should I do now?**

## 3. Product Principles
1. **AI-first ≠ AI-only.** Every core action remains possible manually.
2. **Reduce organizational overhead.** Do not make users maintain unnecessary structure.
3. **Calm over noisy.** Do not become Jira or a dashboard of equally prominent blocks.
4. **Explain important decisions.** Explanations are short, concrete, useful.
5. **User remains in control.** Important changes are transparent; Edit/Undo where appropriate; autonomy configurable.
6. **Do not manufacture productivity.** If nothing needs attention: **You're clear. Nothing needs your attention right now.**
7. **Privacy and security are product features.** Users understand and control how their information is used.

## 4. Information Architecture
### Primary navigation
- Home
- Plan
- Calendar
- Inbox
- Tasks & Notes
- Search
- Settings

### Secondary capabilities
- Projects
- Workspaces
- History / Timeline
- Feedback
- Help

Existing/experimental Finance, Cars, AI Chat, Automation, and Labs are not part of the new core simply because code exists for them.

## 5. Home
Home answers **What matters now?** and is not a conventional dashboard.

### Morning state
Informational: greeting/date, short day summary, Top 3–5 priorities, upcoming schedule, Keep in mind, Quick Capture.

### Daytime state
Decision-oriented, centered on **What should I do now?** with a recommended task, duration/priority, short reason, Start, and other options.

## 6. Daily Priorities
Orvia forms approximately **3–5 main priorities for the day**. They do not silently change. If context changes significantly, Orvia proposes rebuilding the plan and the user decides.

## 7. Plan
Plan answers **“What am I going to do / how should I use my available time?”** Its daily timeline combines meetings/events, planned tasks, free/available time, and priorities. Users can manually rearrange it, and Orvia may suggest placements and planning changes.

### Still to place
Show unscheduled work so it is not lost. Orvia may suggest where it fits.

## 8. Calendar
Calendar answers **“What does my time look like?”** It is the factual time and schedule view, showing Orvia events, personal events, and connected external-calendar events in its own **Day / Week / Month** calendar. Calendar provides time context to Plan.

### External calendars — v1
The approved private beta is provider-free: Calendar and Plan must work without an external calendar connection. Google Calendar read-only context is a gated post-beta follow-up; Outlook is later. When an external provider is introduced, Orvia reads permitted events as context and does not modify the source calendar. Exact provider, permission, refresh, and integration architecture remains **OPEN** until separately approved.

### Orvia events
Users can create personal events directly in Orvia.

### Conflicts
Orvia proactively detects calendar conflicts early enough for the user to reschedule, cancel, or resolve them.

## 9. Universal Capture
Capture is available from almost anywhere. Default: **What's on your mind?** with **Auto** mode and optional explicit Task / Note / Event. Orvia may split one capture into multiple objects.

## 10. Capture Confidence
- **High confidence:** Understand → execute → show result → Edit/Undo.
- **Low confidence:** do not guess; send to Inbox for clarification.

## 11. Capture Result
For multi-item input, show a compact parsed result. Depending on autonomy/confidence, use Approve all / Review or apply high-confidence results with Undo/Edit.

## 12. Voice and External Capture
Voice Capture is part of the target architecture. One spoken capture may create multiple objects. Architecture must not block Telegram/mobile capture.

Before beta, aim for at least **one convenient external/mobile-oriented capture channel**. Exact channel remains open.

## 13. Inbox
Inbox is an **attention queue**, not capture history. Reasons can include Needs clarification, Needs approval, Missing information, Possible duplicate, Needs decision, Conflict. Resolved items leave the active Inbox.

## 14. Tasks
Task v1 supports title, description, deadline, planned time, estimated duration, priority, workspace, project, status, reminder, recurrence, checklist.

Statuses: **To do / In progress / Done / Cancelled**. `Overdue` is calculated.

## 15. Notes
Notes stay simple: rich text, workspace, project, related tasks, links, attachments later. No Notion-style databases or complex constructors.

Selected note content can be converted into a linked task.

## 16. Reminders
A reminder is primarily a property of a task/event rather than a separate top-level object.

## 17. Recurring Tasks
Recurring tasks are a **beta requirement**. Support common recurrence and later custom recurrence. Exact editor UX is a design decision.

## 18. Projects
Projects are **lightweight groups of related work and information around a goal** with Tasks / Notes / Upcoming. No sprints, epics, story points, complex boards, or Jira workflows.

Orvia may suggest creating a project for related items, but does not silently create it without confirmation.

## 19. Workspaces
Default top-level workspaces: **Personal / Work / Business**. Users can rename, delete, or add them; Orvia may suggest new ones. Keep hierarchy shallow: Workspace → Projects is sufficient.

## 20. Search / Ask Orvia
Search evolves from keyword search toward retrieval over personal information, including natural-language questions about forgotten notes, postponed work, and plans.

## 21. History / Timeline
History is a secondary capability for audit, recovery/context, and understanding previous actions. It is not primary navigation.

## 22. Orvia Intelligence
May analyze deadlines, priority, duration, calendar, available time, meetings, postponements, workspace/project, previous behavior, preferences, and current context. May infer type, workspace, status, priority, and duration; users can correct these.

## 23. Explainability
Important recommendations need short explanations, not AI essays.

## 24. Orvia Next
Answers **What should I do next?** and may show roughly **1–5 relevant options** depending on context. Possible categories: Recommended / Quick win / Alternative. Actions: Start / Skip / Reschedule.

## 25. Start & Focus Mode
`Start` moves a task to **In progress**. Optional Focus Mode minimizes surrounding UI but still surfaces genuinely important context such as upcoming meetings or critical deadlines.

## 26. Behavioral Learning
Orvia learns preferred focus times, task-duration reality, postponement patterns, accepted/ignored recommendations, and other work patterns to improve future recommendations.

## 27. Repeatedly Postponed Tasks
Do not endlessly increase reminders. Orvia may ask Still relevant?, suggest rescheduling/archive/cancel, and learn from behavior. Real approaching deadlines may raise priority again.

## 28. User State / Energy
User-provided state/energy can affect planning. Orvia may suggest a lighter day, move non-essential work, suggest rest, while gently surfacing critical tasks. It may suggest seeking medical help where appropriate but must not diagnose or make independent medical conclusions.

## 29. Overdue UX
Avoid stressful red dashboards. Prefer **3 things need attention** with actions such as Do / Reschedule / Still relevant? / Cancel/archive.

## 30. Completion UX
Keep feedback calm and adult. No childish default gamification, confetti, streak fireworks, or productivity points.

## 31. Autonomy
- **Suggest:** I recommend. You organize.
- **Assist:** I prepare. You approve.
- **Auto-plan:** automatically perform allowed planning actions within user-defined boundaries, with transparency and Edit/Undo.

Default: **Assist**. For beta, significant replanning is proposed rather than silently applied.

## 32. Actions Without Confirmation
Within confidence/settings, Orvia may analyze, recommend, infer type/workspace, estimate priority/duration, read permitted calendar context, and structure high-confidence captures with Undo/Edit.

Require confirmation/permission for destructive actions, significant beta replanning, important deadline modification, external actions, and ambiguous interpretations.

## 33. Notifications
Three conceptual levels:
- **Critical attention:** upcoming meeting, conflict, important deadline.
- **Useful:** planned task approaching, day changed, plan could be adjusted.
- **Ambient:** Keep in mind, low-urgency reminder.

Users control types and channels.

## 34. Notification Channels
Target: desktop/browser, mobile push, email, Telegram. Mobile/Telegram depend on available clients/integrations.

## 35. Email Policy
Service/Auth emails remain functional. **Productivity emails are OFF by default and require user opt-in.**

## 36. Quiet Hours
Configurable quiet hours are required, with explicit exceptions only where permitted.

## 37. Notification Learning
If a user repeatedly dismisses a notification type, Orvia may propose reducing it but does not silently disable it.

## 38. Morning Briefing
Optional/configurable notification summarizing meetings/priorities and opening Morning Home. User controls timing.

## 39. Evening Review
Optional/disable-able calm review such as completed/open items and planning tomorrow.

## 40. Personalization — “How Orvia knows me”
Settings exposes relevant learned context such as preferred focus time, typical workday, avoid-work-after time, typical lunch. Users can correct assumptions.

## 41. Learning Controls
Required: **Reset learned preferences** and **Disable behavioral learning**. These controls must not be hidden.

## 42. Sensitive Workspaces
A workspace may support **Use for AI recommendations: ON/OFF**. When OFF, protected workspace content must not be used for AI recommendations. This must be a real processing/data boundary.

## 43. Privacy Transparency
Settings clearly explains how Orvia uses tasks, notes, calendar, behavioral signals, integrations, and AI processing.

## 44. Links / URL Safety
Captured external URLs are **untrusted input**. Architecture must account for malicious content, phishing, unsafe redirects, prompt injection/malicious instructions in fetched content, and unsafe automatic interaction. Orvia must not blindly execute external instructions.

## 45. Attachments
PDF/images/files are **later**, not an initial beta requirement. Architecture should not block future linked-document flows.

## 46. Data Lifecycle
Support Archive and Delete. Archive preserves information for Search/Ask Orvia/history while removing it from active work.

Before beta: **Export my data** and **Delete account and data**.

## 47. Authentication
Beta authentication:
- **Continue with Google**
- **Email + Password**

Also support email confirmation, forgot/reset password, logout/session handling. Same-email password/Google identity linking must be handled safely without accidental duplicate data identities or loss.

## 48. Onboarding
Target flow when an approved provider connection exists: **Welcome → Basic preferences → Connect calendar (optional) → Notifications → Autonomy → First Capture**. The provider-free private beta omits the connection step. Orvia remains usable without an external calendar.

## 49. First Success / Activation
`signup_completed` is not activation. Activation means the user experiences the core value: **Capture → Understand → accept/correct → Prioritize → Act**.

## 50. Product Analytics
Privacy-safe events may include `next_shown`, `next_started`, `next_skipped`, `plan_change_suggested`, `plan_change_accepted`, `capture_auto_classified`, `capture_corrected`.

Do not send task titles, note text, capture content, personal URLs, tokens, auth/session data, or sensitive user content.

## 51. Recommendation Feedback
Occasionally ask whether a recommendation was useful (e.g. 👍 / 👎), not after every action.

## 52. Beta Feedback
Feedback Center remains part of beta for bugs, confusing UX, feature requests, recommendation problems, and general feedback.

## 53. Beta Scope
### Core beta
Authentication, Google Sign-In, EN/UA, Home, Plan, Universal Capture, Inbox, Tasks, Notes, recurring tasks, reminders, Search, lightweight Projects, Workspaces, manual control, privacy/security controls, privacy-safe behavioral analytics, feedback, onboarding, production-ready email/auth infrastructure, responsive web, light/dark, desktop/browser notifications where technically viable, Export/Delete account data.

### Beta intelligence
Beta does not need perfect intelligence, but must demonstrate **Capture → Understand → Prioritize → Act**.

## 54. Calendar Beta Decision
The private-beta Calendar scope is provider-free: a separate primary Orvia Calendar, Day/Week/Month, user-owned Orvia Events, planned Task intervals, the shared Calendar/Plan schedule projection, Plan integration, and basic conflict/capacity awareness subject to the prerequisites and open decisions in the [Calendar + Plan beta specification](CALENDAR_PLAN_BETA_SPEC.md). Google read-only context is a gated post-beta follow-up; Outlook is later. External calendar access is not a private-beta blocker. This scope decision does not claim that Calendar, Plan, conflict/capacity behavior, or release validation is complete.

## 55. External/Mobile Capture Beta Decision
Aim for at least one more convenient capture channel beyond standard web flow. Candidates: voice in web/PWA, Telegram, PWA/mobile shortcut, or another lightweight channel. **Decision remains open.**

## 56. Explicitly Later
Do not block initial beta on native iOS/Android, full Telegram if another capture channel is selected, attachments, complex file intelligence, bidirectional Google/Outlook sync, team collaboration, enterprise functionality, complex PM, Notion-like databases, Jira-like boards, or full autonomous-agent behavior.

## 57. Design Direction
Orvia should feel **calm / premium / trustworthy / focused / intelligent**.

Avoid AI hype, cyberpunk, gaming aesthetics, neon, excessive violet, generic Tailwind SaaS, giant white cards everywhere, excessive rounded containers, glassmorphism for its own sake, and noisy dashboards.

Reference premium-software principles similar to Linear/Raycast/Arc without cloning their UI.

UI hierarchy: **What matters → Why → What can I do**.

The approved system-level design contract is [Master Design System](../design/MASTER_DESIGN_SYSTEM.md), with supporting token, component, motion, responsive, accessibility, content, screen, and quality specifications. It defines “premium” through observable hierarchy, restraint, consistency, feedback, and rendered quality rather than subjective styling. Existing code values remain implementation facts unless that documentation explicitly adopts them as decisions.

## 58. Motion
Motion is restrained, functional, roughly 120–250 ms for ordinary transitions, and compatible with reduced-motion preferences.

## 59. Responsive Experience
First-class desktop and mobile web, light and dark. Mobile is not merely compressed desktop.

## 60. Languages
**English + Ukrainian.** Ukrainian is a beta requirement.

## 61. Visual Release Gate
**Automated PASS ≠ Visual PASS ≠ Release PASS.**

Before production UI release, the product owner explicitly approves representative real rendered desktop/mobile and light/dark screens. Visual smoke checks layout, spacing, typography, surfaces, navigation proportions, responsive behavior, and overall integrity.

## 62. Product Success
Main question: **Does the user return to Orvia because it genuinely makes their day easier?**

Useful signals: activation, repeat usage, recommendation acceptance, capture corrections, Next usage, plan acceptance, retention, qualitative feedback, and reduced organizational overhead.

## 63. Non-Goals
Orvia is not a Jira replacement, Notion replacement, enterprise PM suite, team collaboration platform, AI chatbot with a todo list, gamified productivity app, or maximum-feature-count suite. Do not position it as an autonomous agent that independently runs the user's life.

## 64. Product Test
For every major feature ask: **Does this help the user move faster from what is in their head to the right next action?** If not, it needs a strong separate reason to exist.

## 65. Core UX Test
A new user without assistance should complete: **Create account → First Capture → Understand result → Inbox if necessary → Task/Note/Event → Plan/Home → Start → Complete → understand what happens next**.

## 66. Security Principle
Because Orvia may contain personal tasks, work information, calendar data, behavioral data, notes, and external links, security/privacy are part of Definition of Done for every relevant feature. New intelligence capabilities must not weaken ownership, isolation, privacy, or security guarantees.

## 67. Source-of-Truth Hierarchy
1. **Orvia Product Specification v1.x** — canonical product vision, requirements, scope, priorities, and product decisions.
2. **Approved UX Architecture** — translates approved product decisions into cross-product experience architecture. Draft material has no independent authority over the Product Specification.
3. **Feature and technical specifications** — define feature behavior, domain contracts, technical boundaries, and feature acceptance criteria within the first two layers.
4. **Design Foundation** — defines cross-product visual, component, interaction, motion, responsive, accessibility, and content/i18n rules within product, UX, and feature boundaries.
5. **Screen specifications** — define one screen's composition, states, interactions, and screen-level acceptance criteria within every higher layer.
6. **Implementation and implementation evidence** — must follow the approved specifications and accurately label current behavior.
7. **Historical/archive documentation** — context only; it cannot override a current layer above it.

Old roadmaps cannot override this Product Specification. README does not independently define product strategy. Code describes what is implemented; it does not by itself define what the product should become.

## 68. Change Control
When a meaningful product decision changes:

**Decision → update Product Spec → update affected feature spec/AC → implementation**

Versioning:
- `v1.0` — approved current product architecture
- `v1.1` — minor product decisions
- `v1.2` — product, UX, design, and quality foundation
- `v1.3` — source-of-truth and private-beta scope reconciliation
- `v2.0` — fundamental product-model change

Maintain a Decision Log.

## 69. Current Open Decisions
Do not invent these without explicit product decisions:
- which external/mobile capture channel enters beta;
- exact Priority Engine scoring rules;
- intelligence confidence thresholds;
- exact recurring-task editor UX;
- exact notification timing/escalation rules;
- Google OAuth account-linking implementation;
- future Calendar provider/permission/refresh/integration architecture;
- exact AI/model/data architecture;
- monetization/pricing;
- final brand identity/logo and any token values explicitly marked open in the design foundation.

## 70. Decision Log
**v1.3 — 2026-10-01**
- Reconciled the authority chain as Product Specification → approved UX Architecture → feature/technical specifications → Design Foundation → screen specifications → implementation/evidence → historical documentation.
- Incorporated the already approved provider-free private-beta Calendar boundary from the Calendar + Plan specification: Google read-only context is post-beta and gated; Outlook is later. Broader provider architecture remains open.
- Clarified that a provider connection appears in onboarding only when an approved provider capability exists.

**v1.2 — 2026-10-01**
- Established the Orvia product, UX, visual, component, responsive, accessibility, content, screen-specification, visual-QA, and Definition of Done documentation system.
- Confirmed **“Orvia suggests. You decide.”** as the interaction boundary for consequential intelligence and planning behavior.
- Defined the visual direction through observable rules: the working surface leads; supporting chrome recedes; structure is quiet; violet is restrained; states are honest; mobile is intentionally recomposed; light/dark and EN/UA are first-class review dimensions.
- Kept exact undecided token values and final brand identity/logo open. Current implementation values are evidence, not automatic future requirements.

**v1.1 — 2026-09-30**
- Calendar is a separate primary destination alongside Plan; its navigation placement is decided.
- Calendar answers **“What does my time look like?”**; Plan answers **“What am I going to do / how should I use my available time?”** Plan retains its daily timeline, meetings/events, planned tasks, free/available time, priorities, Still to place, manual rearrangement, and Orvia planning suggestions.

**v1.0 — 2026-09-30**
- Product core: **Capture → Understand → Prioritize → Act**.
- Home informational in morning, decision-oriented during day.
- Daily Top 3–5 stable unless user approves replanning.
- Plan is a daily timeline with `Still to place`.
- Own Day/Week/Month Calendar.
- External Google/Outlook calendars read-only for v1.
- Universal Capture: Auto + manual Task/Note/Event.
- High-confidence: execute with Edit/Undo; low-confidence: Inbox.
- Inbox is attention queue, not history.
- Voice/external capture is target architecture.
- Task statuses: To do / In progress / Done / Cancelled.
- Recurring tasks beta-required.
- Reminders primarily properties of tasks/events.
- Notes lightweight and can create linked tasks.
- Projects lightweight; AI-suggested project creation requires confirmation.
- Default workspaces: Personal / Work / Business.
- History/Timeline secondary.
- Behavioral learning required.
- User-provided energy/state can affect planning.
- Orvia Next: roughly 1–5 contextual options.
- Focus Mode target UX.
- Autonomy: Suggest / Assist / Auto-plan; default **Assist**.
- Significant beta replanning proposed, not silently applied.
- Notifications: Critical / Useful / Ambient.
- Quiet hours configurable.
- Morning briefing/evening review optional.
- Productivity emails **OFF by default**.
- “How Orvia knows me”, reset learning, disable learning required.
- Sensitive workspaces can be excluded from AI recommendations.
- External URL content is untrusted input.
- Attachments later.
- Archive + Delete supported.
- Export data and Delete account/data beta-required.
- Beta auth includes email/password + **Google Sign-In**.
- Short onboarding; calendar optional.
- Activation = experiencing core value, not signup.
- Behavioral analytics allowed without user content.
- EN/UA beta-required.
- Visual owner approval is a release gate.
- This specification supersedes conflicting older product/roadmap documentation.

## 71. Next Product Phase
Next: product-owner review of the remaining draft UX Architecture, then **feature specifications and acceptance criteria** for approved decisions covering desktop + mobile structures of Home, Plan, Calendar, Capture, Inbox, Tasks & Notes, Projects, Search, and Settings. Only UX decisions already recorded in this Product Specification or an explicitly approved higher-scope decision are authoritative before that review.

Only after UX architecture is approved should repository documentation be reconciled using **KEEP / UPDATE / REPLACE / ARCHIVE / DELETE**.

Old documents must not remain active if they contradict this source of truth.

After repository reconciliation, implementation agents such as Codex should be instructed to read this specification before product/design work.
