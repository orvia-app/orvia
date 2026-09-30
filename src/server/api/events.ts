import {
  isIanaTimeZone, isLocalDate, isUtcInstant, validateOrviaEvent,
  type OrviaEvent,
} from "@/core/schedule/domain";
import { isRecord, invalid, type Parsed } from "./schedule-input";
import type { SupabaseEventRow } from "@/lib/supabase";

type EventFields = {
  title: string; timezone: string; busy: boolean; all_day: boolean;
  start_at: string | null; end_at: string | null;
  start_date: string | null; end_date_exclusive: string | null;
};

const CLIENT_KEYS = ["kind", "title", "timezone", "busy", "startAt", "endAt", "startDate", "endDateExclusive"];

export function eventToFields(event: OrviaEvent): EventFields {
  return {
    title: event.title, timezone: event.timezone, busy: event.busy,
    all_day: event.kind === "all-day",
    start_at: event.kind === "timed" ? event.startAt : null,
    end_at: event.kind === "timed" ? event.endAt : null,
    start_date: event.kind === "all-day" ? event.startDate : null,
    end_date_exclusive: event.kind === "all-day" ? event.endDateExclusive : null,
  };
}

export function rowToEvent(row: SupabaseEventRow): OrviaEvent {
  const common = {
    id: row.id, userId: row.user_id, title: row.title,
    timezone: row.timezone, busy: row.busy,
  };
  // PostgREST may serialize timestamptz with +00:00 rather than Z.
  const utc = (value: string | null): string | null => value == null ? null : new Date(value).toISOString();
  return validateOrviaEvent(row.all_day ? {
    ...common, kind: "all-day", startDate: row.start_date,
    endDateExclusive: row.end_date_exclusive,
  } : {
    ...common, kind: "timed", startAt: utc(row.start_at), endAt: utc(row.end_at),
  });
}

/** Strict public input: ownership, lifecycle and workspace cannot be chosen by a client. */
export function parseEventInput(body: unknown, ownerId: string, existing?: OrviaEvent): Parsed<OrviaEvent> {
  if (!isRecord(body)) return invalid("Request body must be a JSON object.");
  if (Object.keys(body).some((key) => !CLIENT_KEYS.includes(key))) return invalid("Unsupported Event field.");
  if (existing && Object.keys(body).length === 0) return invalid("At least one Event field is required.");
  if (existing && body.kind !== undefined && body.kind !== existing.kind) {
    return invalid("Changing Event temporal kind requires explicit replacement.");
  }
  const supplied = (key: string, fallback: unknown): unknown =>
    Object.hasOwn(body, key) ? body[key] : fallback;
  const kind = supplied("kind", existing?.kind);
  const title = supplied("title", existing?.title);
  const timezone = supplied("timezone", existing?.timezone);
  const busy = supplied("busy", existing?.busy);
  if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
    return invalid("Event title must contain 1 to 200 characters.");
  }
  if (typeof timezone !== "string" || timezone.length > 200 || !isIanaTimeZone(timezone)) {
    return invalid("Valid IANA Event timezone is required.");
  }
  if (typeof busy !== "boolean") return invalid("Event busy must be boolean.");
  if (kind !== "timed" && kind !== "all-day") return invalid("Event kind must be timed or all-day.");
  if (kind === "timed") {
    if (Object.hasOwn(body, "startDate") || Object.hasOwn(body, "endDateExclusive")) {
      return invalid("Timed Event cannot contain all-day dates.");
    }
    const startAt = supplied("startAt", existing?.kind === "timed" ? existing.startAt : undefined);
    const endAt = supplied("endAt", existing?.kind === "timed" ? existing.endAt : undefined);
    if (!isUtcInstant(startAt) || !isUtcInstant(endAt)) return invalid("Timed Event requires valid UTC instants.");
    if (Date.parse(endAt) <= Date.parse(startAt)) return invalid("Event end must follow start.");
    return { ok: true, value: validateOrviaEvent({
      id: existing?.id ?? crypto.randomUUID(), userId: ownerId, title: title.trim(), timezone, busy,
      kind, startAt, endAt,
    }) };
  }
  if (Object.hasOwn(body, "startAt") || Object.hasOwn(body, "endAt")) {
    return invalid("All-day Event cannot contain UTC instants.");
  }
  const startDate = supplied("startDate", existing?.kind === "all-day" ? existing.startDate : undefined);
  const endDateExclusive = supplied("endDateExclusive", existing?.kind === "all-day" ? existing.endDateExclusive : undefined);
  if (!isLocalDate(startDate) || !isLocalDate(endDateExclusive)) {
    return invalid("All-day Event requires valid local dates.");
  }
  if (endDateExclusive <= startDate) return invalid("Event end must follow start.");
  return { ok: true, value: validateOrviaEvent({
    id: existing?.id ?? crypto.randomUUID(), userId: ownerId, title: title.trim(), timezone, busy,
    kind, startDate, endDateExclusive,
  }) };
}
