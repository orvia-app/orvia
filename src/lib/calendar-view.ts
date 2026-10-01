import { intervalsIntersect, requireLocalDate, type IanaTimeZone, type LocalDate, type ScheduleItem, type ScheduleProjectionResult } from "@/core/schedule/domain";
import { localDateRange } from "@/core/schedule/projection";

export type CalendarView = "day" | "week" | "month";
const DAY = 86_400_000;

export function addDays(date: LocalDate, amount: number): LocalDate {
  return requireLocalDate(new Date(Date.parse(`${date}T12:00:00.000Z`) + amount * DAY).toISOString().slice(0, 10));
}

export function startOfWeek(date: LocalDate): LocalDate {
  const weekday = new Date(`${date}T12:00:00.000Z`).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}

export function viewDates(date: LocalDate, view: CalendarView): LocalDate[] {
  if (view === "day") return [date];
  const start = view === "week" ? startOfWeek(date) :
    startOfWeek(requireLocalDate(`${date.slice(0, 7)}-01`));
  const count = view === "week" ? 7 : 42;
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

export function moveView(date: LocalDate, view: CalendarView, direction: -1 | 1): LocalDate {
  if (view === "day") return addDays(date, direction);
  if (view === "week") return addDays(date, direction * 7);
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + direction, 1));
  const targetMonth = target.toISOString().slice(0, 7);
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return requireLocalDate(`${targetMonth}-${String(Math.min(day, lastDay)).padStart(2, "0")}`);
}

export function dateInZone(instant: Date | string, zone: IanaTimeZone): LocalDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(typeof instant === "string" ? new Date(instant) : instant);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
  return requireLocalDate(`${part("year")}-${part("month")}-${part("day")}`);
}

export function itemsOnDate(items: readonly ScheduleItem[], date: LocalDate, zone: IanaTimeZone): ScheduleItem[] {
  const range = localDateRange(date, addDays(date, 1), zone);
  return items.filter((item) => intervalsIntersect(item.interval, range));
}

export function sourceNotice(projection: ScheduleProjectionResult): "unavailable" | "incomplete" | "unverified" | null {
  const states = Object.values(projection.sources).map((source) => source.state);
  if (states.every((state) => state === "unavailable")) return "unavailable";
  if (states.some((state) => state === "unavailable" || state === "partial" || state === "stale")) return "incomplete";
  if (states.some((state) => state === "unverified")) return "unverified";
  if (projection.completeness !== "complete") return "incomplete";
  return null;
}

export type PlacedItem = { item: ScheduleItem; start: number; end: number; column: number; columns: number };

/** Positions only factual intervals. Each connected overlap cluster uses stable columns. */
export function placeTimedItems(items: readonly ScheduleItem[], date: LocalDate, zone: IanaTimeZone): PlacedItem[] {
  const range = localDateRange(date, addDays(date, 1), zone);
  const dayStart = Date.parse(range.start);
  const dayEnd = Date.parse(range.end);
  const candidates = items.filter((item) => item.kind !== "all-day")
    .map((item) => ({ item, start: Math.max(Date.parse(item.interval.start), dayStart), end: Math.min(Date.parse(item.interval.end), dayEnd) }))
    .filter((entry) => entry.start < entry.end)
    .sort((a, b) => a.start - b.start || b.end - a.end || a.item.key.localeCompare(b.item.key));
  const result: PlacedItem[] = [];
  let cluster: typeof candidates = [];
  let clusterEnd = -Infinity;
  function flush() {
    const endings: number[] = [];
    const placed = cluster.map((entry) => {
      let column = endings.findIndex((end) => end <= entry.start);
      if (column < 0) column = endings.length;
      endings[column] = entry.end;
      return { ...entry, column, columns: 0 };
    });
    placed.forEach((entry) => { entry.columns = endings.length; result.push(entry); });
  }
  for (const entry of candidates) {
    if (cluster.length && entry.start >= clusterEnd) { flush(); cluster = []; clusterEnd = -Infinity; }
    cluster.push(entry);
    clusterEnd = Math.max(clusterEnd, entry.end);
  }
  if (cluster.length) flush();
  return result;
}
