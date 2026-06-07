# Orvia Beta Feedback

## Purpose

Private beta users need a clear way to report bugs, suggest ideas, and explain
where the product feels confusing.

This is intentionally lightweight. Orvia does not run a feedback backend yet,
and this foundation does not create database tables, file uploads, analytics, or
support automation.

## Current Behavior

The Settings page includes a beta feedback card with three actions:

- Send Feedback
- Report a Bug
- Suggest an Idea

All actions can point to the same external form during private beta.

## Configuration

The feedback URL is configured in:

```ts
src/lib/feedback.ts
```

Replace the placeholder value:

```ts
export const FEEDBACK_URL = "https://forms.google.com/PLACEHOLDER";
```

with the real feedback form URL.

If the URL is empty or still uses the placeholder value, feedback actions are
disabled and the Settings page shows helper text instead of crashing or opening
a broken link.

## Why No Backend Yet

For private beta, an external form is lower risk and faster to operate than a
custom feedback system.

Deferring a backend keeps this PR out of:

- database schema design
- moderation and spam handling
- attachment security
- support queue workflows
- analytics/event routing

When beta volume requires it, feedback can move behind an owned support system
or product analytics workflow.
