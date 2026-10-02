import {
  CALENDAR_VISUAL_QA_DATE,
  CALENDAR_VISUAL_QA_NOW,
  CALENDAR_VISUAL_QA_ZONE,
  events,
  tasks,
} from "../../scripts/dev/calendar-visual-qa-data.mjs";
import {
  requireIanaTimeZone,
  requireLocalDate,
  requireUtcInstant,
  type OrviaEvent,
  type ScheduleProjectionResult,
} from "@/core/schedule/domain";
import {
  localDateRange,
  projectSchedule,
  type ScheduleEventRecord,
  type ScheduleTaskRecord,
} from "@/core/schedule/projection";

type FixtureEvent = {
  fixtureId: string;
  kind: "timed" | "all-day";
  title: string;
  workspaceId: "Work" | "Personal" | "Side Project";
  timezone: string;
  busy: boolean;
  startAt?: string;
  endAt?: string;
  startDate?: string;
  endDateExclusive?: string;
};

type FixtureTask = {
  fixtureId: string;
  title: string;
  workspaceId: "Work" | "Personal" | "Side Project";
  plannedStart: string;
  estimatedDurationMinutes: number;
  planDay: string;
};

const planningTimezone = requireIanaTimeZone(CALENDAR_VISUAL_QA_ZONE);
const fixtureDate = requireLocalDate(CALENDAR_VISUAL_QA_DATE);
const fixtureNow = requireUtcInstant(CALENDAR_VISUAL_QA_NOW);
const fixtureRange = localDateRange("2026-09-28", "2026-11-09", planningTimezone);

function fixtureEvent(record: FixtureEvent, ownerId: string): OrviaEvent {
  const common = {
    id: `visual-qa-${record.fixtureId}`,
    userId: ownerId,
    title: record.title,
    workspaceId: record.workspaceId,
    timezone: planningTimezone,
    busy: record.busy,
  };
  if (record.kind === "timed") {
    return {
      ...common,
      kind: "timed",
      startAt: requireUtcInstant(record.startAt),
      endAt: requireUtcInstant(record.endAt),
    };
  }
  return {
    ...common,
    kind: "all-day",
    startDate: requireLocalDate(record.startDate),
    endDateExclusive: requireLocalDate(record.endDateExclusive),
  };
}

export function createCalendarVisualQaProjection(ownerId: string): ScheduleProjectionResult {
  const eventRecords: ScheduleEventRecord[] = (events as FixtureEvent[]).map((record) => ({
    event: fixtureEvent(record, ownerId),
    lifecycleStatus: "active",
    intelligenceEligible: false,
  }));
  const taskRecords: ScheduleTaskRecord[] = (tasks as FixtureTask[]).map((record) => ({
    ownerId,
    intelligenceEligible: false,
    task: {
      id: `visual-qa-${record.fixtureId}`,
      title: record.title,
      status: "todo",
      workspaceId: record.workspaceId,
      plannedStart: requireUtcInstant(record.plannedStart),
      estimatedDurationMinutes: record.estimatedDurationMinutes,
      planDay: requireLocalDate(record.planDay),
    },
  }));
  const source = { ownerId, coverage: fixtureRange, state: "complete" as const, observedAt: fixtureNow };
  return projectSchedule({ ownerId, range: fixtureRange, planningTimezone }, {
    events: { ...source, records: eventRecords },
    tasks: { ...source, records: taskRecords },
  });
}

export const calendarVisualQaDate = fixtureDate;
export const calendarVisualQaNow = new Date(fixtureNow);
export const calendarVisualQaZone = planningTimezone;
