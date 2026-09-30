import { getSupabaseServerClient, type SupabaseEventRow, type SupabaseTaskRow } from "@/lib/supabase";
import {
  intervalsIntersect, plannedTaskInterval, requireUtcInstant, timedEventInterval,
  type TimedInterval, type IanaTimeZone, type ScheduleProjectionResult,
} from "@/core/schedule/domain";
import {
  localDateRange, projectSchedule,
  type ScheduleSourceSnapshot, type ScheduleTaskRecord, type ScheduleEventRecord,
} from "@/core/schedule/projection";
import { rowToEvent } from "./events";

const PAGE_SIZE = 500;
const MAX_PAGES = 200;
const DAY = 24 * 60 * 60 * 1000;

async function pages<T>(query: (from: number, to: number) => PromiseLike<{
  data: T[] | null; error: unknown;
}>): Promise<T[] | null> {
  const rows: T[] = [];
  for (let index = 0; index < MAX_PAGES; index += 1) {
    const { data, error } = await query(index * PAGE_SIZE, (index + 1) * PAGE_SIZE - 1);
    if (error || !data) return null;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
  return null;
}

function dateAt(ms: number): string { return new Date(ms).toISOString().slice(0, 10); }

/** Candidate bounds include every IANA offset; exact local-day intersection is checked below. */
function candidateDates(range: TimedInterval) {
  return {
    lower: dateAt(Date.parse(range.start) - 2 * DAY),
    upper: dateAt(Date.parse(range.end) + 2 * DAY),
  };
}

export async function fetchOwnedEvents(ownerId: string, range: TimedInterval): Promise<SupabaseEventRow[] | null> {
  const db = getSupabaseServerClient();
  const { lower, upper } = candidateDates(range);
  const timed = await pages<SupabaseEventRow>((from, to) => db.from("orvia_events")
    .select("*").eq("user_id", ownerId).eq("lifecycle_status", "active")
    .eq("all_day", false).lt("start_at", upper).gt("end_at", lower)
    .order("id").range(from, to));
  if (!timed) return null;
  const allDay = await pages<SupabaseEventRow>((from, to) => db.from("orvia_events")
    .select("*").eq("user_id", ownerId).eq("lifecycle_status", "active")
    .eq("all_day", true).lt("start_date", upper).gt("end_date_exclusive", lower)
    .order("id").range(from, to));
  if (!allDay) return null;
  try {
    return [...timed, ...allDay].filter((row) => {
      if (row.user_id !== ownerId) throw new TypeError("Event owner mismatch");
      const event = rowToEvent(row);
      const interval = event.kind === "timed" ? timedEventInterval(event) :
        localDateRange(event.startDate, event.endDateExclusive, event.timezone);
      return intervalsIntersect(interval, range);
    });
  } catch {
    return null;
  }
}

async function fetchOwnedTasks(ownerId: string, range: TimedInterval, zone: IanaTimeZone): Promise<SupabaseTaskRow[] | null> {
  const db = getSupabaseServerClient();
  // A valid estimate cannot start more than seven days before the requested range.
  const earliest = dateAt(Date.parse(range.start) - 8 * DAY);
  const upperInstantDate = dateAt(Date.parse(range.end) + 2 * DAY);
  const planned = await pages<SupabaseTaskRow>((from, to) => db.from("tasks")
    .select("*").eq("user_id", ownerId).is("deleted_at", null)
    .in("status", ["todo", "in-progress"])
    .gte("planned_start", earliest).lt("planned_start", upperInstantDate)
    .order("id").range(from, to));
  if (!planned) return null;
  const { lower, upper } = candidateDates(range);
  const assigned = await pages<SupabaseTaskRow>((from, to) => db.from("tasks")
    .select("*").eq("user_id", ownerId).is("deleted_at", null)
    .in("status", ["todo", "in-progress"])
    .gte("plan_day", lower).lte("plan_day", upper)
    .order("id").range(from, to));
  if (!assigned) return null;
  const unique = new Map([...planned, ...assigned].map((row) => [row.id, row]));
  try {
    return [...unique.values()].filter((row) => {
      if (row.user_id !== ownerId) throw new TypeError("Task owner mismatch");
      const plannedStart = row.planned_start == null ? null : requireUtcInstant(new Date(row.planned_start).toISOString());
      const interval = plannedTaskInterval({ plannedStart, estimatedDurationMinutes: row.estimated_duration_minutes });
      if (interval && intervalsIntersect(interval, range)) return true;
      if (!interval && row.plan_day) {
        const next = dateAt(Date.parse(`${row.plan_day}T00:00:00.000Z`) + DAY);
        return intervalsIntersect(localDateRange(row.plan_day, next, zone), range);
      }
      return false;
    });
  } catch {
    return null;
  }
}

function snapshot<T>(ownerId: string, range: TimedInterval, records: T[] | null): ScheduleSourceSnapshot<T> {
  return records === null ? { ownerId, records: [], coverage: null, state: "unavailable" } : {
    ownerId, records, coverage: range,
    // Factual rows were observed now. Intelligence eligibility has no trusted source yet.
    state: "unverified", observedAt: requireUtcInstant(new Date().toISOString()),
  };
}

/** Factual display is allowed; recommendation processing remains disabled until privacy controls are sourced. */
export async function readOwnedSchedule(ownerId: string, range: TimedInterval,
  planningTimezone: IanaTimeZone): Promise<ScheduleProjectionResult> {
  const [tasks, events] = await Promise.all([
    fetchOwnedTasks(ownerId, range, planningTimezone).catch(() => null),
    fetchOwnedEvents(ownerId, range).catch(() => null),
  ]);
  let taskRecords: ScheduleTaskRecord[] | null = null;
  let eventRecords: ScheduleEventRecord[] | null = null;
  try {
    taskRecords = tasks?.map((row) => ({
      ownerId: row.user_id!, intelligenceEligible: false,
      task: {
        id: row.id, title: row.title, status: row.status,
        workspaceId: row.workspace_id ?? "", planDay: row.plan_day,
        plannedStart: row.planned_start == null ? null : requireUtcInstant(new Date(row.planned_start).toISOString()),
        estimatedDurationMinutes: row.estimated_duration_minutes,
      },
    })) ?? null;
  } catch { taskRecords = null; }
  try {
    eventRecords = events?.map((row) => ({
      event: rowToEvent(row), lifecycleStatus: row.lifecycle_status,
      intelligenceEligible: false,
    })) ?? null;
  } catch { eventRecords = null; }
  return projectSchedule({ ownerId, range, planningTimezone }, {
    tasks: snapshot(ownerId, range, taskRecords),
    events: snapshot(ownerId, range, eventRecords),
  });
}
