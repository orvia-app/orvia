import {
  isIanaTimeZone,
  isLocalDate,
  isUtcInstant,
  type IanaTimeZone,
  type ScheduleItem,
  type ScheduleProjectionResult,
} from "@/core/schedule/domain";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isCalendarScheduleItem(value: unknown): value is ScheduleItem {
  if (!isRecord(value) || !isRecord(value.interval)) return false;
  if (typeof value.key !== "string" || typeof value.sourceId !== "string" ||
      typeof value.title !== "string" || typeof value.ownerId !== "string" ||
      typeof value.busy !== "boolean" || !isUtcInstant(value.interval.start) ||
      !isUtcInstant(value.interval.end) ||
      Date.parse(value.interval.end) <= Date.parse(value.interval.start)) return false;
  if (value.source === "task") {
    if (value.kind !== "planned-task") return false;
    if (value.key === `task:${value.sourceId}`) return value.blockId === undefined;
    return typeof value.blockId === "string" && value.blockId.length > 0 &&
      value.key === `task-block:${value.blockId}`;
  }
  if (value.source !== "orvia-event" || value.key !== `orvia-event:${value.sourceId}` ||
      !isIanaTimeZone(value.timezone)) return false;
  return value.kind === "timed" || (value.kind === "all-day" &&
    isLocalDate(value.startDate) && isLocalDate(value.endDateExclusive));
}

export function parseCalendarProjection(
  value: unknown,
  ownerId: string,
  zone: IanaTimeZone,
): ScheduleProjectionResult | null {
  if (!isRecord(value) || !isRecord(value.sources) || !isRecord(value.sources.tasks) ||
      !isRecord(value.sources.events) || !isRecord(value.range) || !Array.isArray(value.items) ||
      value.planningTimezone !== zone || !isUtcInstant(value.range.start) ||
      !isUtcInstant(value.range.end) ||
      !["complete", "incomplete"].includes(String(value.completeness))) return null;
  const states = [value.sources.tasks.state, value.sources.events.state];
  if (states.some((state) =>
    !["complete", "partial", "stale", "unavailable", "unverified"].includes(String(state))) ||
      !value.items.every((item) => isCalendarScheduleItem(item) && item.ownerId === ownerId)) {
    return null;
  }
  return value as ScheduleProjectionResult;
}
