# Orvia Priority Engine

Priority Engine v1 is deterministic and rule-based. It answers: "What should I do first?" using only data already available in Orvia.

## Available Signals

Current task data supports:

- `priority`: `critical`, `high`, `medium`, `low`
- `status`: `todo`, `in-progress`, `done`
- `dueDate`
- `createdAt`
- `workspaceId`

Current surrounding context supports:

- Inbox/capture count
- Recent activity feed
- Cloud/local/fallback source labels

V1 scoring only uses task fields plus today's date. Inbox count and recent activity remain visible context on Today but do not alter scores yet.

## Scoring Rules

Completed tasks are excluded.

Base priority score:

- Critical: `45`
- High: `32`
- Medium: `16`
- Low: `6`

Date/status boosts:

- Overdue: `+70`
- Due today: `+55`
- Already in progress: `+20`
- Recently created, within 2 days: `+5`
- Waiting too long, 14 days or older: `+8`

Tie breakers:

1. Higher score first.
2. Earlier due date first.
3. Newer created date first.

## Reason Labels

Scores are internal and should not be shown in normal user-facing task cards. The UI can show compact labels explaining why a task surfaced:

- Overdue
- Due today
- Critical priority
- High priority
- Already in progress
- Recently created
- Waiting too long

## What V1 Does

- Ranks active tasks deterministically.
- Surfaces one top priority on Today.
- Orders the Focus Queue by score.
- Shares the same priority helper with Dashboard focus buckets.
- Keeps local/cloud data boundaries unchanged.

## What V1 Does Not Do

- No AI or LLM scoring.
- No calendar or integration signals.
- No notifications.
- No hidden user profiling.
- No task dependency graph.
- No workspace weighting.
- No activity-based scoring yet because task `updatedAt` is not part of the current UI task model.

## Future Improvements

- Add `updatedAt` to the task UI model and use recent updates safely.
- Add workspace-specific weighting after workspace settings exist.
- Use activity density as a context signal.
- Include user preferences for daily planning style.
- Add calendar deadlines only after calendar integration and consent exist.
- Allow users to inspect and tune scoring rules.
