import { isIanaTimeZone, type IanaTimeZone } from "@/core/schedule/domain";

export type CalendarTimezonePreference = Readonly<{
  planningTimezone: IanaTimeZone;
  enabledWeekdays: readonly number[];
  localStartTime: string;
  localEndTime: string;
  version: number;
}>;

export function calendarTimezoneNeedsConfirmation(
  saved: CalendarTimezonePreference | null,
  editorOpen: boolean,
): boolean {
  return saved === null || editorOpen;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWeekdays(value: unknown): value is number[] {
  return Array.isArray(value) && value.length <= 7 &&
    value.every((day) => typeof day === "number" && Number.isInteger(day) && day >= 1 && day <= 7) &&
    new Set(value).size === value.length;
}

function parsePreference(value: unknown): CalendarTimezonePreference {
  if (!isRecord(value) || !isIanaTimeZone(value.planningTimezone) ||
      !isWeekdays(value.enabledWeekdays) ||
      typeof value.localStartTime !== "string" || typeof value.localEndTime !== "string" ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value.localStartTime) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value.localEndTime) ||
      typeof value.version !== "number" || !Number.isInteger(value.version) || value.version < 1) {
    throw new Error("Invalid planning timezone preference.");
  }
  return {
    planningTimezone: value.planningTimezone,
    enabledWeekdays: [...value.enabledWeekdays],
    localStartTime: value.localStartTime,
    localEndTime: value.localEndTime,
    version: value.version,
  };
}

export async function fetchCalendarTimezonePreference(
  accessToken: string,
  signal?: AbortSignal,
): Promise<CalendarTimezonePreference | null> {
  const response = await fetch("/api/planning-preferences", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
    signal,
  });
  const body: unknown = await response.json();
  if (!response.ok || !isRecord(body) || body.ok !== true || !("preferences" in body)) {
    throw new Error("Planning timezone unavailable.");
  }
  return body.preferences === null ? null : parsePreference(body.preferences);
}

export async function saveCalendarTimezonePreference(
  accessToken: string,
  planningTimezone: IanaTimeZone,
  current: CalendarTimezonePreference | null,
): Promise<CalendarTimezonePreference> {
  if (current?.planningTimezone === planningTimezone) return current;
  const response = await fetch("/api/planning-preferences", {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(current ? {
      planningTimezone,
      enabledWeekdays: current.enabledWeekdays,
      localStartTime: current.localStartTime,
      localEndTime: current.localEndTime,
      expectedVersion: current.version,
    } : { planningTimezone }),
    cache: "no-store",
  });
  const body: unknown = await response.json();
  if (!response.ok || !isRecord(body) || body.ok !== true || !("preferences" in body)) {
    throw new Error("Could not save planning timezone.");
  }
  const saved = parsePreference(body.preferences);
  if (saved.planningTimezone !== planningTimezone) {
    throw new Error("Saved planning timezone did not match.");
  }
  return saved;
}
