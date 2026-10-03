import { requireIanaTimeZone, type IanaTimeZone } from "@/core/schedule/domain";
import {
  getSupabaseServerClient,
  type SupabasePlanningPreferencesRow,
} from "@/lib/supabase";

export const DEFAULT_ENABLED_WEEKDAYS = [1, 2, 3, 4, 5] as const;
export const DEFAULT_LOCAL_START_TIME = "09:00:00";
export const DEFAULT_LOCAL_END_TIME = "18:00:00";

export type PlanningPreferences = Readonly<{
  planningTimezone: IanaTimeZone;
  enabledWeekdays: readonly number[];
  localStartTime: string;
  localEndTime: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}>;

type PlanningPreferencesFields = Readonly<{
  planning_timezone: IanaTimeZone;
  enabled_weekdays: number[];
  local_start_time: string;
  local_end_time: string;
}>;

export type ParsedPlanningPreferences =
  | { ok: true; fields: PlanningPreferencesFields; expectedVersion?: number }
  | { ok: false; error: string };

function normalizeLocalTime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? "0");
  if (hour > 23 || minute > 59 || second > 59) return null;
  return `${match[1]}:${match[2]}:${String(second).padStart(2, "0")}`;
}

function seconds(value: string): number {
  const [hour, minute, second] = value.split(":").map(Number);
  return hour * 3600 + minute * 60 + second;
}

function parseWeekdays(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length > 7) return null;
  if (!value.every((day) => Number.isInteger(day) && day >= 1 && day <= 7)) return null;
  const unique = [...new Set(value as number[])].sort((a, b) => a - b);
  return unique.length === value.length ? unique : null;
}

export function parsePlanningPreferencesInput(
  value: unknown,
): ParsedPlanningPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const input = value as Record<string, unknown>;
  let planningTimezone: IanaTimeZone;
  try {
    planningTimezone = requireIanaTimeZone(input.planningTimezone);
  } catch {
    return { ok: false, error: "Planning timezone must be a valid IANA timezone." };
  }
  const enabledWeekdays = input.enabledWeekdays === undefined ?
    [...DEFAULT_ENABLED_WEEKDAYS] : parseWeekdays(input.enabledWeekdays);
  if (!enabledWeekdays) {
    return { ok: false, error: "Enabled weekdays must be unique ISO weekdays from 1 through 7." };
  }
  const localStartTime = input.localStartTime === undefined ? DEFAULT_LOCAL_START_TIME :
    normalizeLocalTime(input.localStartTime);
  const localEndTime = input.localEndTime === undefined ? DEFAULT_LOCAL_END_TIME :
    normalizeLocalTime(input.localEndTime);
  if (!localStartTime || !localEndTime || seconds(localEndTime) <= seconds(localStartTime)) {
    return { ok: false, error: "Planning end time must be later than start time on the same local day." };
  }
  const expectedVersion = input.expectedVersion;
  if (expectedVersion !== undefined &&
      (typeof expectedVersion !== "number" || !Number.isInteger(expectedVersion) || expectedVersion < 1)) {
    return { ok: false, error: "Expected version must be a positive integer." };
  }
  return {
    ok: true,
    fields: {
      planning_timezone: planningTimezone,
      enabled_weekdays: enabledWeekdays,
      local_start_time: localStartTime,
      local_end_time: localEndTime,
    },
    ...(expectedVersion === undefined ? {} : { expectedVersion }),
  };
}

export function planningPreferencesFromRow(
  row: SupabasePlanningPreferencesRow,
): PlanningPreferences {
  return {
    planningTimezone: requireIanaTimeZone(row.planning_timezone),
    enabledWeekdays: [...row.enabled_weekdays],
    localStartTime: row.local_start_time,
    localEndTime: row.local_end_time,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function readAuthoritativePlanningTimezone(
  ownerId: string,
  fallback: IanaTimeZone,
): Promise<IanaTimeZone> {
  const { data, error } = await getSupabaseServerClient()
    .from("planning_preferences")
    .select("planning_timezone")
    .eq("user_id", ownerId)
    .maybeSingle<Pick<SupabasePlanningPreferencesRow, "planning_timezone">>();
  if (error) throw new Error("Planning timezone lookup failed");
  return data ? requireIanaTimeZone(data.planning_timezone) : fallback;
}
