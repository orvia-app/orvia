import type { Task } from "@/types";

declare const localDateBrand: unique symbol;
declare const utcInstantBrand: unique symbol;
declare const timeZoneBrand: unique symbol;
declare const durationBrand: unique symbol;

export type LocalDate = string & { readonly [localDateBrand]: true };
export type UtcInstant = string & { readonly [utcInstantBrand]: true };
export type IanaTimeZone = string & { readonly [timeZoneBrand]: true };
export type PositiveDurationMinutes = number & { readonly [durationBrand]: true };

// A week is a domain safety bound, not a planning window or capacity assumption.
export const MAX_ESTIMATED_DURATION_MINUTES = 7 * 24 * 60;

export function isLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

export function requireLocalDate(value: unknown): LocalDate {
  if (!isLocalDate(value)) throw new RangeError("Invalid local date");
  return value;
}

export function isIanaTimeZone(value: unknown): value is IanaTimeZone {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch (error) {
    if (error instanceof RangeError) return false;
    throw error;
  }
}

export function requireIanaTimeZone(value: unknown): IanaTimeZone {
  if (!isIanaTimeZone(value)) throw new RangeError("Invalid IANA timezone");
  return value;
}

export function isUtcInstant(value: unknown): value is UtcInstant {
  if (typeof value !== "string") return false;
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  if (!match) return false;
  const milliseconds = (match[2] ?? "").padEnd(3, "0");
  const date = new Date(value);
  return Number.isFinite(date.getTime()) &&
    date.toISOString() === `${match[1]}.${milliseconds}Z`;
}

export function requireUtcInstant(value: unknown): UtcInstant {
  if (!isUtcInstant(value)) throw new RangeError("Invalid UTC instant");
  return value;
}

export function isPositiveDurationMinutes(value: unknown): value is PositiveDurationMinutes {
  return typeof value === "number" && Number.isInteger(value) &&
    value > 0 && value <= MAX_ESTIMATED_DURATION_MINUTES;
}

export function requirePositiveDurationMinutes(value: unknown): PositiveDurationMinutes {
  if (!isPositiveDurationMinutes(value)) throw new RangeError("Invalid estimated duration");
  return value;
}

export type TaskScheduling = Readonly<{
  dueDate: LocalDate | null;
  plannedStart: UtcInstant | null;
  estimatedDurationMinutes: PositiveDurationMinutes | null;
  planDay: LocalDate | null;
}>;

/** Validates each independent Task scheduling field without deriving or rewriting another. */
export function validateTaskScheduling(
  task: Pick<Task, "dueDate" | "plannedStart" | "estimatedDurationMinutes" | "planDay">,
): TaskScheduling {
  return {
    dueDate: task.dueDate == null ? null : requireLocalDate(task.dueDate),
    plannedStart: task.plannedStart == null ? null : requireUtcInstant(task.plannedStart),
    estimatedDurationMinutes: task.estimatedDurationMinutes == null ? null :
      requirePositiveDurationMinutes(task.estimatedDurationMinutes),
    planDay: task.planDay == null ? null : requireLocalDate(task.planDay),
  };
}

/** Every timed interval is half-open: [start, end). */
export type TimedInterval = Readonly<{ start: UtcInstant; end: UtcInstant }>;

export function timedInterval(start: unknown, end: unknown): TimedInterval {
  const validStart = requireUtcInstant(start);
  const validEnd = requireUtcInstant(end);
  if (Date.parse(validEnd) <= Date.parse(validStart)) {
    throw new RangeError("Interval end must follow start");
  }
  return { start: validStart, end: validEnd };
}

export function intervalsIntersect(a: TimedInterval, b: TimedInterval): boolean {
  return Date.parse(a.start) < Date.parse(b.end) &&
    Date.parse(b.start) < Date.parse(a.end);
}

export function intervalIntersection(a: TimedInterval, b: TimedInterval): TimedInterval | null {
  if (!intervalsIntersect(a, b)) return null;
  return {
    start: Date.parse(a.start) > Date.parse(b.start) ? a.start : b.start,
    end: Date.parse(a.end) < Date.parse(b.end) ? a.end : b.end,
  };
}

export function plannedTaskInterval(
  task: Pick<Task, "plannedStart" | "estimatedDurationMinutes">,
): TimedInterval | null {
  if (!isUtcInstant(task.plannedStart) ||
      !isPositiveDurationMinutes(task.estimatedDurationMinutes)) return null;

  const endMilliseconds = Date.parse(task.plannedStart) +
    task.estimatedDurationMinutes * 60_000;
  const end = new Date(endMilliseconds).toISOString();
  if (!isUtcInstant(end)) return null;
  return timedInterval(task.plannedStart, end);
}

export type EventBase = Readonly<{
  id: string;
  userId: string;
  title: string;
  timezone: IanaTimeZone;
  busy: boolean;
  workspaceId?: string | null;
}>;

export type TimedEvent = EventBase & Readonly<{
  kind: "timed";
  startAt: UtcInstant;
  endAt: UtcInstant;
  startDate?: never;
  endDateExclusive?: never;
}>;

export type AllDayEvent = EventBase & Readonly<{
  kind: "all-day";
  startDate: LocalDate;
  endDateExclusive: LocalDate;
  startAt?: never;
  endAt?: never;
}>;

export type OrviaEvent = TimedEvent | AllDayEvent;

function requiredText(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new RangeError(`Invalid ${name}`);
  }
  return value;
}

/** Validates a domain record; ownership must still be established at the server boundary. */
export function validateOrviaEvent(value: unknown): OrviaEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Event must be an object");
  }
  const input = value as Record<string, unknown>;
  const base = {
    id: requiredText(input.id, "event id", 200),
    userId: requiredText(input.userId, "event owner", 200),
    title: requiredText(input.title, "event title", 200),
    timezone: requireIanaTimeZone(input.timezone),
    busy: input.busy,
    workspaceId: input.workspaceId,
  };
  if (typeof base.busy !== "boolean") throw new TypeError("Invalid busy state");
  const workspaceId = base.workspaceId == null ? undefined :
    requiredText(base.workspaceId, "workspace id", 200);
  const common = {
    id: base.id,
    userId: base.userId,
    title: base.title,
    timezone: base.timezone,
    busy: base.busy,
    ...(workspaceId === undefined ? {} : { workspaceId }),
  };

  if (input.kind === "timed") {
    if (input.startDate != null || input.endDateExclusive != null) {
      throw new TypeError("Timed Event cannot have all-day bounds");
    }
    const interval = timedInterval(input.startAt, input.endAt);
    return { ...common, kind: "timed", startAt: interval.start, endAt: interval.end };
  }
  if (input.kind === "all-day") {
    if (input.startAt != null || input.endAt != null) {
      throw new TypeError("All-day Event cannot have timed bounds");
    }
    const startDate = requireLocalDate(input.startDate);
    const endDateExclusive = requireLocalDate(input.endDateExclusive);
    if (endDateExclusive <= startDate) throw new RangeError("All-day end must follow start");
    return { ...common, kind: "all-day", startDate, endDateExclusive };
  }
  throw new TypeError("Invalid Event kind");
}

export function timedEventInterval(event: TimedEvent): TimedInterval {
  return timedInterval(event.startAt, event.endAt);
}

type ScheduleItemBase = Readonly<{
  key: `orvia-event:${string}` | `task:${string}`;
  ownerId: string;
  title: string;
  workspaceId?: string | null;
  busy: boolean;
  /** Factual display and recommendation processing have separate privacy gates. */
  intelligenceEligible: boolean;
  interval: TimedInterval;
}>;

export type ScheduleItem =
  | (ScheduleItemBase & Readonly<{ source: "orvia-event"; kind: "timed" }>)
  | (ScheduleItemBase & Readonly<{
      source: "orvia-event";
      kind: "all-day";
      startDate: LocalDate;
      endDateExclusive: LocalDate;
      timezone: IanaTimeZone;
    }>)
  | (ScheduleItemBase & Readonly<{
      source: "task";
      kind: "planned-task";
      planDay?: LocalDate | null;
    }>);

// Later projection code must resolve all-day local bounds in the Event's zone
// before constructing an all-day ScheduleItem. DST wall-time conversion is not
// attempted here, and a date-only value is never treated as UTC midnight.
export type ScheduleProjection = Readonly<{
  items: readonly ScheduleItem[];
  sources: Readonly<{
    events: "complete" | "partial" | "stale" | "unavailable";
    tasks: "complete" | "partial" | "stale" | "unavailable";
  }>;
}>;

export type BlockingConflict = Readonly<{
  keys: readonly [ScheduleItem["key"], ScheduleItem["key"]];
  overlap: TimedInterval;
}>;

export function blockingConflict(a: ScheduleItem, b: ScheduleItem): BlockingConflict | null {
  if (a.key === b.key || a.ownerId !== b.ownerId || !a.busy || !b.busy) return null;
  const overlap = intervalIntersection(a.interval, b.interval);
  return overlap ? { keys: [a.key, b.key], overlap } : null;
}
