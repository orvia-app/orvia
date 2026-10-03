import {
  MAX_ESTIMATED_DURATION_MINUTES,
  timedInterval,
  type TaskPlanBlock,
} from "@/core/schedule/domain";
import type { SupabaseTaskPlanBlockRow } from "@/lib/supabase";

export type ParsedTaskPlanBlockCreate =
  | { ok: true; startAt: string; endAt: string }
  | { ok: false; error: string };

export type ParsedTaskPlanBlockPatch =
  | { ok: true; startAt: string; endAt: string; expectedVersion: number }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizedInterval(startAt: unknown, endAt: unknown) {
  try {
    const interval = timedInterval(startAt, endAt);
    if (Date.parse(interval.end) - Date.parse(interval.start) >
        MAX_ESTIMATED_DURATION_MINUTES * 60_000) return null;
    return interval;
  } catch {
    return null;
  }
}

export function parseTaskPlanBlockCreate(value: unknown): ParsedTaskPlanBlockCreate {
  if (!isRecord(value)) return { ok: false, error: "Request body must be a JSON object." };
  const interval = normalizedInterval(value.startAt, value.endAt);
  if (!interval) {
    return { ok: false, error: "Block start and end must be valid UTC instants with end after start, up to seven days." };
  }
  return { ok: true, startAt: interval.start, endAt: interval.end };
}

export function parseTaskPlanBlockPatch(
  value: unknown,
  current: SupabaseTaskPlanBlockRow,
): ParsedTaskPlanBlockPatch {
  if (!isRecord(value)) return { ok: false, error: "Request body must be a JSON object." };
  const expectedVersion = value.expectedVersion;
  if (typeof expectedVersion !== "number" || !Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return { ok: false, error: "Expected version must be a positive integer." };
  }
  const interval = normalizedInterval(value.startAt ?? new Date(current.start_at).toISOString(),
    value.endAt ?? new Date(current.end_at).toISOString());
  if (!interval) {
    return { ok: false, error: "Block start and end must be valid UTC instants with end after start, up to seven days." };
  }
  return { ok: true, startAt: interval.start, endAt: interval.end, expectedVersion };
}

export function taskPlanBlockFromRow(row: SupabaseTaskPlanBlockRow): TaskPlanBlock {
  return {
    id: row.id,
    ownerId: row.user_id,
    taskId: row.task_id,
    interval: timedInterval(new Date(row.start_at).toISOString(), new Date(row.end_at).toISOString()),
    version: row.version,
  };
}
