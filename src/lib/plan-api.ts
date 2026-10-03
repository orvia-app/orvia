import {
  isIanaTimeZone,
  type IanaTimeZone,
  type LocalDate,
  type ScheduleProjectionResult,
} from "@/core/schedule/domain";
import { localDateRange } from "@/core/schedule/projection";
import { addDays } from "@/lib/calendar-view";
import { parseCalendarProjection } from "@/lib/calendar-projection";

export type PlanPreferences = Readonly<{
  planningTimezone: IanaTimeZone;
  persisted: boolean;
  enabledWeekdays: readonly number[];
  localStartTime: string;
  localEndTime: string;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLocalTime(value: unknown): value is string {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
}

function seconds(value: string): number {
  const [hour, minute, second = 0] = value.split(":").map(Number);
  return hour * 3600 + minute * 60 + second;
}

function weekdays(value: unknown): number[] | null {
  if (!Array.isArray(value) || !value.every((day) =>
    typeof day === "number" && Number.isInteger(day) && day >= 1 && day <= 7)) return null;
  return [...value];
}

export async function fetchPlanPreferences(
  accessToken: string,
  browserTimezone: string,
): Promise<PlanPreferences> {
  const response = await fetch("/api/planning-preferences", {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  let value: unknown;
  try { value = await response.json(); } catch { value = null; }
  if (!response.ok || !isRecord(value) || value.ok !== true ||
      !isRecord(value.defaults)) throw new Error("Planning preferences unavailable");

  const preference = value.preferences;
  if (preference !== null && !isRecord(preference)) {
    throw new Error("Planning preferences unavailable");
  }
  const persisted = preference !== null;
  const source = persisted ? preference : value.defaults;
  const zoneValue = persisted ? preference.planningTimezone : browserTimezone;
  const enabledWeekdays = weekdays(source.enabledWeekdays);
  if (!isIanaTimeZone(zoneValue) || !enabledWeekdays ||
      !isLocalTime(source.localStartTime) || !isLocalTime(source.localEndTime) ||
      seconds(source.localEndTime) <= seconds(source.localStartTime)) {
    throw new Error("Planning preferences unavailable");
  }
  return {
    planningTimezone: zoneValue,
    persisted,
    enabledWeekdays,
    localStartTime: source.localStartTime,
    localEndTime: source.localEndTime,
  };
}

export async function fetchPlanSchedule(
  accessToken: string,
  ownerId: string,
  date: LocalDate,
  planningTimezone: IanaTimeZone,
  days = 1,
): Promise<ScheduleProjectionResult> {
  const range = localDateRange(date, addDays(date, days), planningTimezone);
  const response = await fetch("/api/schedule", {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ range, planningTimezone }),
  });
  let value: unknown;
  try { value = await response.json(); } catch { value = null; }
  if (!response.ok || !isRecord(value) || value.ok !== true ||
      !isRecord(value.projection) || !isIanaTimeZone(value.projection.planningTimezone)) {
    throw new Error("Schedule unavailable");
  }
  const projection = parseCalendarProjection(
    value.projection,
    ownerId,
    value.projection.planningTimezone,
  );
  if (!projection) throw new Error("Schedule unavailable");
  return projection;
}
