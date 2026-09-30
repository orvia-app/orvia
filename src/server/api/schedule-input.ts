import {
  isIanaTimeZone, isLocalDate, isPositiveDurationMinutes, isUtcInstant,
  timedInterval, type TimedInterval, type IanaTimeZone,
} from "@/core/schedule/domain";

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const MAX_RANGE_MILLISECONDS = 370 * 24 * 60 * 60 * 1000;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };
export const invalid = (error: string): Parsed<never> => ({ ok: false, error });

export function parseRange(value: unknown): Parsed<TimedInterval> {
  if (!isRecord(value) || !isUtcInstant(value.start) || !isUtcInstant(value.end)) {
    return invalid("Range requires valid UTC start and end instants.");
  }
  if (Date.parse(value.end) <= Date.parse(value.start)) return invalid("Range end must follow start.");
  if (Date.parse(value.end) - Date.parse(value.start) > MAX_RANGE_MILLISECONDS) {
    return invalid("Range must not exceed 370 days.");
  }
  return { ok: true, value: timedInterval(value.start, value.end) };
}

export function parsePlanningQuery(value: unknown): Parsed<{
  range: TimedInterval; planningTimezone: IanaTimeZone;
}> {
  if (!isRecord(value)) return invalid("Request body must be a JSON object.");
  const range = parseRange(value.range);
  if (!range.ok) return range;
  if (!isIanaTimeZone(value.planningTimezone)) return invalid("Valid IANA planningTimezone is required.");
  return { ok: true, value: { range: range.value, planningTimezone: value.planningTimezone } };
}

/** Scheduling fields are independent; no deadline or day inference is performed. */
export function parseTaskSchedulingPatch(body: Record<string, unknown>): Parsed<{
  planned_start?: string | null;
  estimated_duration_minutes?: number | null;
  plan_day?: string | null;
}> {
  const fields = ["plannedStart", "estimatedDurationMinutes", "planDay"];
  if (Object.keys(body).some((key) => !fields.includes(key)) ||
      !fields.some((key) => Object.hasOwn(body, key))) {
    return invalid("Provide only Task scheduling fields, with at least one field present.");
  }
  const result: { planned_start?: string | null; estimated_duration_minutes?: number | null; plan_day?: string | null } = {};
  if (Object.hasOwn(body, "plannedStart")) {
    if (body.plannedStart !== null && !isUtcInstant(body.plannedStart)) return invalid("Invalid plannedStart UTC instant.");
    result.planned_start = body.plannedStart as string | null;
  }
  if (Object.hasOwn(body, "estimatedDurationMinutes")) {
    if (body.estimatedDurationMinutes !== null && !isPositiveDurationMinutes(body.estimatedDurationMinutes)) {
      return invalid("Invalid estimatedDurationMinutes; use an integer from 1 to 10080 or null.");
    }
    result.estimated_duration_minutes = body.estimatedDurationMinutes as number | null;
  }
  if (Object.hasOwn(body, "planDay")) {
    if (body.planDay !== null && !isLocalDate(body.planDay)) return invalid("Invalid planDay local date.");
    result.plan_day = body.planDay as string | null;
  }
  return { ok: true, value: result };
}
