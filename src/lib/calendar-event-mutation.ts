import {
  intervalsIntersect,
  timedEventInterval,
  validateOrviaEvent,
  type OrviaEvent,
  type ScheduleItem,
  type ScheduleProjectionResult,
} from "@/core/schedule/domain";
import { localDateRange } from "@/core/schedule/projection";
import type { EventRecord } from "@/lib/events-api";

export type CalendarLoadState =
  | { status: "idle" }
  | { status: "error"; key: string }
  | { status: "loaded"; key: string; projection: ScheduleProjectionResult };

export function retainCalendarAfterRefreshFailure(
  current: CalendarLoadState,
  key: string,
): CalendarLoadState {
  return current.status === "loaded" && current.key === key ?
    current : { status: "error", key };
}

export function withSavedEvent(
  projection: ScheduleProjectionResult,
  record: EventRecord,
  ownerId: string,
): ScheduleProjectionResult {
  const previous = projection.items.find((item) =>
    item.source === "orvia-event" && item.sourceId === record.id);
  let event: OrviaEvent;
  try {
    event = validateOrviaEvent(record.all_day ? {
      id: record.id, userId: ownerId, title: record.title,
      description: record.description, timezone: record.timezone, busy: record.busy,
      kind: "all-day", startDate: record.start_date,
      endDateExclusive: record.end_date_exclusive,
    } : {
      id: record.id, userId: ownerId, title: record.title,
      description: record.description, timezone: record.timezone, busy: record.busy,
      kind: "timed", startAt: record.start_at, endAt: record.end_at,
    });
  } catch {
    // The successful write still stands; keep the rendered projection until reconciliation.
    return projection;
  }
  const interval = event.kind === "timed" ? timedEventInterval(event) :
    localDateRange(event.startDate, event.endDateExclusive, event.timezone);
  const items = projection.items.filter((item) =>
    item.source !== "orvia-event" || item.sourceId !== record.id);
  if (intervalsIntersect(interval, projection.range)) {
    const common = {
      key: `orvia-event:${event.id}` as const,
      sourceId: event.id,
      source: "orvia-event" as const,
      ownerId,
      title: event.title,
      busy: event.busy,
      intelligenceEligible: previous?.intelligenceEligible ?? false,
      sourceState: previous?.sourceState ?? ("unverified" as const),
      ...(previous?.workspaceId ? { workspaceId: previous.workspaceId } : {}),
      ...(previous?.observedAt ? { observedAt: previous.observedAt } : {}),
      interval,
    };
    items.push(event.kind === "timed" ?
      { ...common, kind: "timed", timezone: event.timezone } :
      { ...common, kind: "all-day", timezone: event.timezone,
        startDate: event.startDate, endDateExclusive: event.endDateExclusive });
  }
  items.sort((a: ScheduleItem, b: ScheduleItem) =>
    Date.parse(a.interval.start) - Date.parse(b.interval.start) || a.key.localeCompare(b.key));
  return { ...projection, items };
}

export function withoutEvent(
  projection: ScheduleProjectionResult,
  eventId: string,
): ScheduleProjectionResult {
  return { ...projection, items: projection.items.filter((item) =>
    item.source !== "orvia-event" || item.sourceId !== eventId) };
}
