# ORVIA — PRODUCT SPECIFICATION v1.0

**Status:** Product Source of Truth  
**Date:** 30 September 2026  
**Stage:** Pre-private-beta / Product Architecture v2  
**Owner:** Maksym Andriienko

> This document is the product source of truth for Orvia. When older product/roadmap documentation conflicts with this specification, this specification takes precedence unless a newer approved version explicitly supersedes it.

## 1. Product Vision
Orvia is a personal system for managing attention, tasks, and time that turns unstructured information into clear next actions.

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
- Inbox
- Tasks & Notes
- Search
- Settings

### Secondary capabilities
- Calendar
- Projects
- Workspaces
- History / Timeline
- Feedback
- Help

Calendar may be accessible through Plan and/or secondary navigation. Exact placement is a UX-design decision.

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
Plan answers **How does my day look?** as a timeline combining meetings, Orvia events, planned tasks, free time, and priorities. Users can manually change it.

### Still to place
Show unscheduled work so it is not lost. Orvia may suggest where it fits.

## 8. Calendar
Orvia has its own **Day / Week / Month** calendar showing Orvia events, personal events, and connected external-calendar events.

### External calendars — v1
Google Calendar / Outlook are initially **read-only**. Orvia reads them as context and does not modify them.

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
Short flow: **Welcome → Basic preferences → Connect calendar (optional) → Notifications → Autonomy → First Capture**. Calendar has clear Skip. Orvia remains usable without external calendar.

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
Calendar is part of the product architecture. Exact first-beta implementation scope requires technical effort assessment: Orvia Calendar, Day/Week/Month, external read-only connection, conflict detection, Plan integration. Do not remove Calendar from the vision solely because implementation is non-trivial.

## 55. External/Mobile Capture Beta Decision
Aim for at least one more convenient capture channel beyond standard web flow. Candidates: voice in web/PWA, Telegram, PWA/mobile shortcut, or another lightweight channel. **Decision remains open.**

## 56. Explicitly Later
Do not block initial beta on native iOS/Android, full Telegram if another capture channel is selected, attachments, complex file intelligence, bidirectional Google/Outlook sync, team collaboration, enterprise functionality, complex PM, Notion-like databases, Jira-like boards, or full autonomous-agent behavior.

## 57. Design Direction
Orvia should feel **calm / premium / trustworthy / focused / intelligent**.

Avoid AI hype, cyberpunk, gaming aesthetics, neon, excessive violet, generic Tailwind SaaS, giant white cards everywhere, excessive rounded containers, glassmorphism for its own sake, and noisy dashboards.

Reference premium-software principles similar to Linear/Raycast/Arc without cloning their UI.

UI hierarchy: **What matters → Why → What can I do**.

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
1. **Orvia Product Specification v1.x**
2. Approved UX/design specifications
3. Feature-specific requirements / acceptance criteria
4. Technical architecture / ADRs
5. Implementation documentation
6. Historical/archive documentation

Old roadmaps cannot override this Product Specification. README does not independently define product strategy. Code describes what is implemented; it does not by itself define what the product should become.

## 68. Change Control
When a meaningful product decision changes:

**Decision → update Product Spec → update affected feature spec/AC → implementation**

Versioning:
- `v1.0` — approved current product architecture
- `v1.1` — minor product decisions
- `v2.0` — fundamental product-model change

Maintain a Decision Log.

## 69. Current Open Decisions
Do not invent these without explicit product decisions:
- exact Calendar placement in navigation;
- which external/mobile capture channel enters beta;
- exact Priority Engine scoring rules;
- intelligence confidence thresholds;
- exact recurring-task editor UX;
- exact notification timing/escalation rules;
- Google OAuth account-linking implementation;
- Calendar provider/integration architecture;
- exact AI/model/data architecture;
- monetization/pricing;
- final visual system and logo.

## 70. Decision Log — v1.0
**2026-09-30**
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
Next: **UX Architecture** for desktop + mobile structures of Home, Plan, Calendar, Capture, Inbox, Tasks & Notes, Projects, Search, Settings.

Only after UX architecture is approved should repository documentation be reconciled using **KEEP / UPDATE / REPLACE / ARCHIVE / DELETE**.

Old documents must not remain active if they contradict this source of truth.

After repository reconciliation, implementation agents such as Codex should be instructed to read this specification before product/design work.
