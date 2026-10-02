/** Shared, deterministic Calendar visual-QA records. No persistence or credentials. */
export const CALENDAR_VISUAL_QA_ZONE = 'Europe/Kyiv';
export const CALENDAR_VISUAL_QA_DATE = '2026-10-02';
export const CALENDAR_VISUAL_QA_NOW = '2026-10-02T11:15:00.000Z';

export const events = [
  { fixtureId: 'design-sync', kind: 'timed', title: 'Design sync', workspaceId: 'Work', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-09-28T06:00:00.000Z', endAt: '2026-09-28T07:00:00.000Z' },
  { fixtureId: 'prepare-release', kind: 'timed', title: 'Prepare release', workspaceId: 'Work', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-09-28T08:30:00.000Z', endAt: '2026-09-28T09:30:00.000Z' },
  { fixtureId: 'build-prototype', kind: 'timed', title: 'Build prototype', workspaceId: 'Work', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-09-28T11:00:00.000Z', endAt: '2026-09-28T12:30:00.000Z' },
  { fixtureId: 'gym', kind: 'timed', title: 'Gym', workspaceId: 'Personal', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-09-28T14:00:00.000Z', endAt: '2026-09-28T15:00:00.000Z' },

  { fixtureId: 'focus-time', kind: 'timed', title: 'Focus time', workspaceId: 'Work', timezone: CALENDAR_VISUAL_QA_ZONE, busy: false,
    startAt: '2026-09-29T06:30:00.000Z', endAt: '2026-09-29T08:00:00.000Z' },
  { fixtureId: 'lunch', kind: 'timed', title: 'Lunch', workspaceId: 'Personal', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-09-29T09:00:00.000Z', endAt: '2026-09-29T10:00:00.000Z' },
  { fixtureId: 'dinner-with-friends', kind: 'timed', title: 'Dinner with friends', workspaceId: 'Personal', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-09-29T15:00:00.000Z', endAt: '2026-09-29T16:30:00.000Z' },

  { fixtureId: 'customer-interview', kind: 'timed', title: 'Customer interview', workspaceId: 'Work', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-09-30T07:00:00.000Z', endAt: '2026-09-30T08:00:00.000Z' },
  { fixtureId: 'design-review', kind: 'timed', title: 'Design review', workspaceId: 'Work', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-09-30T08:30:00.000Z', endAt: '2026-09-30T10:00:00.000Z' },
  { fixtureId: 'deep-work-wednesday', kind: 'timed', title: 'Deep work', workspaceId: 'Side Project', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-09-30T11:00:00.000Z', endAt: '2026-09-30T14:00:00.000Z' },

  { fixtureId: 'kyiv-tech-meetup', kind: 'all-day', title: 'Kyiv Tech Meetup', workspaceId: 'Personal', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startDate: '2026-10-01', endDateExclusive: '2026-10-02' },
  { fixtureId: 'product-planning', kind: 'timed', title: 'Product planning', workspaceId: 'Work', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-10-01T06:00:00.000Z', endAt: '2026-10-01T07:30:00.000Z' },
  { fixtureId: 'cross-team-review', kind: 'timed', title: 'Cross-team review', workspaceId: 'Work', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-10-01T08:00:00.000Z', endAt: '2026-10-01T09:00:00.000Z' },

  { fixtureId: 'team-planning', kind: 'timed', title: 'Team planning', workspaceId: 'Work', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-10-02T06:00:00.000Z', endAt: '2026-10-02T07:00:00.000Z' },
  { fixtureId: 'write-docs', kind: 'timed', title: 'Write docs', workspaceId: 'Work', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-10-02T08:00:00.000Z', endAt: '2026-10-02T09:00:00.000Z' },
  { fixtureId: 'product-sync', kind: 'timed', title: 'Product sync', workspaceId: 'Work', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-10-02T09:30:00.000Z', endAt: '2026-10-02T10:30:00.000Z' },
  { fixtureId: 'deep-work-friday', kind: 'timed', title: 'Deep work', workspaceId: 'Side Project', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-10-02T11:15:00.000Z', endAt: '2026-10-02T12:30:00.000Z' },
  { fixtureId: 'marketing-sync', kind: 'timed', title: 'Marketing sync', workspaceId: 'Work', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-10-02T11:30:00.000Z', endAt: '2026-10-02T12:30:00.000Z' },
  { fixtureId: 'call-with-parents-friday', kind: 'timed', title: 'Call with parents', workspaceId: 'Personal', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-10-02T13:00:00.000Z', endAt: '2026-10-02T14:00:00.000Z' },
  { fixtureId: 'plan-next-week', kind: 'timed', title: 'Plan next week', workspaceId: 'Side Project', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-10-02T14:00:00.000Z', endAt: '2026-10-02T15:00:00.000Z' },
  { fixtureId: 'release-monitoring', kind: 'timed', title: 'Release monitoring', workspaceId: 'Work', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-10-02T19:30:00.000Z', endAt: '2026-10-02T21:30:00.000Z' },

  { fixtureId: 'call-with-parents-saturday', kind: 'timed', title: 'Call with parents', workspaceId: 'Personal', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-10-03T07:00:00.000Z', endAt: '2026-10-03T08:00:00.000Z' },
  { fixtureId: 'side-project-review', kind: 'timed', title: 'Side Project review', workspaceId: 'Side Project', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-10-03T11:00:00.000Z', endAt: '2026-10-03T12:30:00.000Z' },

  { fixtureId: 'family-day', kind: 'timed', title: 'Family day', workspaceId: 'Personal', timezone: CALENDAR_VISUAL_QA_ZONE, busy: true,
    startAt: '2026-10-04T08:00:00.000Z', endAt: '2026-10-04T12:00:00.000Z' },
];

export const tasks = [
  { fixtureId: 'review-analytics', title: 'Review analytics', workspaceId: 'Work',
    plannedStart: '2026-10-02T10:30:00.000Z', estimatedDurationMinutes: 45, planDay: '2026-10-02' },
  { fixtureId: 'finish-landing-copy', title: 'Finish landing copy', workspaceId: 'Side Project',
    plannedStart: '2026-10-02T12:30:00.000Z', estimatedDurationMinutes: 60, planDay: '2026-10-02' },
];
