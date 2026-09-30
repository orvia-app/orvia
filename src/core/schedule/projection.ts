import type { Task } from "@/types";
import {
  intervalsIntersect,
  plannedTaskInterval,
  requireIanaTimeZone,
  requireLocalDate,
  requireUtcInstant,
  timedEventInterval,
  timedInterval,
  validateOrviaEvent,
  type IanaTimeZone,
  type LocalDate,
  type OrviaEvent,
  type ScheduleItem,
  type ScheduleProjectionResult,
  type ScheduleSourceState,
  type TimedInterval,
  type UnplacedScheduleTask,
  type UtcInstant,
} from "./domain";

// Query safety bound only; this does not define a workday or planning window.
const MAX_RANGE_MILLISECONDS = 370 * 24 * 60 * 60 * 1000;

export type ScheduleProjectionRequest = Readonly<{
  /** A server caller must derive this identity from authentication. */
  ownerId: string;
  range: TimedInterval;
  planningTimezone: IanaTimeZone;
}>;

export type ScheduleSourceSnapshot<T> = Readonly<{
  /** Asserted by the owner-scoped source, never by arbitrary client input. */
  ownerId: string;
  records: readonly T[];
  /** Tasks: interval intersection and explicit plan days touching the range.
   * Events: interval intersection, including all-day bounds in the Event zone. */
  coverage: TimedInterval | null;
  state: ScheduleSourceState;
  observedAt?: UtcInstant;
}>;

export type ScheduleTaskRecord = Readonly<{
  ownerId: string;
  task: Pick<Task,
    "id" | "title" | "status" | "workspaceId" | "plannedStart" |
    "estimatedDurationMinutes" | "planDay">;
  /** Derived by a trusted source from current privacy controls. */
  intelligenceEligible: boolean;
}>;

export type ScheduleEventRecord = Readonly<{
  event: OrviaEvent;
  lifecycleStatus: "active" | "archived" | "deleted";
  /** Derived by a trusted source from current privacy controls. */
  intelligenceEligible: boolean;
}>;

export type ScheduleProjectionSources = Readonly<{
  tasks: ScheduleSourceSnapshot<ScheduleTaskRecord>;
  events: ScheduleSourceSnapshot<ScheduleEventRecord>;
}>;

function requiredOwner(value: string): string {
  if (typeof value !== "string" || !value.trim()) throw new TypeError("Invalid schedule owner");
  return value;
}

function dateInZone(milliseconds: number, formatter: Intl.DateTimeFormat): string {
  const parts = formatter.formatToParts(milliseconds);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
  return `${part("year")?.padStart(4, "0")}-${part("month")}-${part("day")}`;
}

/** Find the first instant of a local date, including 23/25-hour DST days. */
export function startOfLocalDate(date: unknown, timezone: unknown): UtcInstant {
  const localDate = requireLocalDate(date);
  const zone = requireIanaTimeZone(timezone);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
  });
  const midnightUtc = Date.parse(`${localDate}T00:00:00.000Z`);
  if (!Number.isFinite(midnightUtc)) throw new RangeError("Local date is outside supported range");
  let lower = midnightUtc - 72 * 60 * 60 * 1000;
  let upper = midnightUtc + 72 * 60 * 60 * 1000;
  if (dateInZone(lower, formatter) >= localDate ||
      dateInZone(upper, formatter) < localDate) {
    throw new RangeError("Local date cannot be resolved in timezone");
  }
  while (upper - lower > 1) {
    const middle = lower + Math.floor((upper - lower) / 2);
    if (dateInZone(middle, formatter) >= localDate) upper = middle;
    else lower = middle;
  }
  if (dateInZone(upper, formatter) !== localDate) {
    throw new RangeError("Local date does not exist in timezone");
  }
  return requireUtcInstant(new Date(upper).toISOString());
}

export function localDateRange(startDate: unknown, endDateExclusive: unknown,
  planningTimezone: unknown): TimedInterval {
  const start = requireLocalDate(startDate);
  const end = requireLocalDate(endDateExclusive);
  if (end <= start) throw new RangeError("Local range end must follow start");
  const zone = requireIanaTimeZone(planningTimezone);
  return timedInterval(startOfLocalDate(start, zone), startOfLocalDate(end, zone));
}

function nextLocalDate(date: LocalDate): LocalDate {
  const milliseconds = Date.parse(`${date}T00:00:00.000Z`) + 24 * 60 * 60 * 1000;
  return requireLocalDate(new Date(milliseconds).toISOString().slice(0, 10));
}

function checkedRequest(request: ScheduleProjectionRequest): ScheduleProjectionRequest {
  const ownerId = requiredOwner(request.ownerId);
  const range = timedInterval(request.range.start, request.range.end);
  if (Date.parse(range.end) - Date.parse(range.start) > MAX_RANGE_MILLISECONDS) {
    throw new RangeError("Schedule range exceeds query bound");
  }
  return { ownerId, range, planningTimezone: requireIanaTimeZone(request.planningTimezone) };
}

function sourceMetadata<T>(source: ScheduleSourceSnapshot<T>, request: ScheduleProjectionRequest) {
  if (source.ownerId !== request.ownerId) throw new TypeError("Schedule source owner mismatch");
  const coverage = source.coverage == null ? null :
    timedInterval(source.coverage.start, source.coverage.end);
  const coversRequest = coverage !== null &&
    Date.parse(coverage.start) <= Date.parse(request.range.start) &&
    Date.parse(coverage.end) >= Date.parse(request.range.end);
  const state = source.state === "complete" && !coversRequest ? "partial" : source.state;
  if (!["complete", "partial", "stale", "unavailable", "unverified"].includes(state)) {
    throw new TypeError("Invalid schedule source state");
  }
  return {
    state,
    ...(source.observedAt === undefined ? {} : { observedAt: requireUtcInstant(source.observedAt) }),
  };
}

function requireEligibility(value: boolean): boolean {
  if (typeof value !== "boolean") throw new TypeError("Missing schedule privacy eligibility");
  return value;
}

/** Pure normalization. Sources must already enforce authenticated owner and query bounds. */
export function projectSchedule(
  input: ScheduleProjectionRequest,
  sources: ScheduleProjectionSources,
): ScheduleProjectionResult {
  const request = checkedRequest(input);
  const tasks = sourceMetadata(sources.tasks, request);
  const events = sourceMetadata(sources.events, request);
  const items: ScheduleItem[] = [];
  const unplacedTasks: UnplacedScheduleTask[] = [];
  const keys = new Set<string>();

  for (const record of sources.tasks.records) {
    if (record.ownerId !== request.ownerId) throw new TypeError("Task source owner mismatch");
    const task = record.task;
    if (task.status !== "todo" && task.status !== "in-progress" && task.status !== "done") {
      throw new TypeError("Invalid Task lifecycle state");
    }
    if (task.status !== "todo" && task.status !== "in-progress") continue;
    const interval = plannedTaskInterval(task);
    const planDay = task.planDay == null ? null : requireLocalDate(task.planDay);
    const intersectsRange = interval !== null && intervalsIntersect(interval, request.range);
    const unplacedInRange = interval === null && planDay !== null &&
      intervalsIntersect(localDateRange(planDay, nextLocalDate(planDay), request.planningTimezone),
        request.range);
    if (!intersectsRange && !unplacedInRange) continue;
    if (typeof task.id !== "string" || !task.id.trim() ||
        typeof task.title !== "string" || !task.title.trim()) {
      throw new TypeError("Invalid scheduled Task identity");
    }
    const key = `task:${task.id}` as const;
    if (keys.has(key)) throw new TypeError("Duplicate schedule source identity");
    keys.add(key);
    const common = {
      key, sourceId: task.id, ownerId: request.ownerId, title: task.title,
      ...(task.workspaceId ? { workspaceId: task.workspaceId } : {}),
      intelligenceEligible: requireEligibility(record.intelligenceEligible),
      sourceState: tasks.state,
      ...(tasks.observedAt ? { observedAt: tasks.observedAt } : {}),
    };
    if (unplacedInRange && planDay !== null) {
      unplacedTasks.push({ ...common, planDay });
      continue;
    }
    if (interval === null) continue;
    items.push({
      ...common, source: "task", kind: "planned-task", busy: true, interval, planDay,
    });
  }

  for (const record of sources.events.records) {
    if (record.event.userId !== request.ownerId) throw new TypeError("Event source owner mismatch");
    if (record.lifecycleStatus !== "active" && record.lifecycleStatus !== "archived" &&
        record.lifecycleStatus !== "deleted") {
      throw new TypeError("Invalid Event lifecycle state");
    }
    if (record.lifecycleStatus !== "active") continue;
    const event = validateOrviaEvent(record.event);
    const interval = event.kind === "timed" ? timedEventInterval(event) :
      localDateRange(event.startDate, event.endDateExclusive, event.timezone);
    if (!intervalsIntersect(interval, request.range)) continue;
    const key = `orvia-event:${event.id}` as const;
    if (keys.has(key)) throw new TypeError("Duplicate schedule source identity");
    keys.add(key);
    const common = {
      key, sourceId: event.id,
      source: "orvia-event" as const, ownerId: request.ownerId,
      title: event.title, busy: event.busy,
      ...(event.workspaceId ? { workspaceId: event.workspaceId } : {}),
      intelligenceEligible: requireEligibility(record.intelligenceEligible),
      interval, sourceState: events.state,
      ...(events.observedAt ? { observedAt: events.observedAt } : {}),
    };
    items.push(event.kind === "timed" ?
      { ...common, kind: "timed", timezone: event.timezone } :
      { ...common, kind: "all-day", timezone: event.timezone,
        startDate: event.startDate, endDateExclusive: event.endDateExclusive });
  }

  items.sort((a, b) => Date.parse(a.interval.start) - Date.parse(b.interval.start) ||
    a.key.localeCompare(b.key));
  unplacedTasks.sort((a, b) => a.planDay.localeCompare(b.planDay) || a.key.localeCompare(b.key));
  return {
    range: request.range, planningTimezone: request.planningTimezone,
    completeness: tasks.state === "complete" && events.state === "complete" ? "complete" : "incomplete",
    sources: { tasks, events }, items, unplacedTasks,
  };
}
