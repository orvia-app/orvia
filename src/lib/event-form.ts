import { isIanaTimeZone, isLocalDate, isUtcInstant, requireLocalDate, requireUtcInstant, type IanaTimeZone } from "@/core/schedule/domain";
import { localTimeCandidates } from "@/core/plan/workspace";
import { addDays } from "@/lib/calendar-view";
import type { EventRecord } from "@/lib/events-api";

export type EventDraft = {
  title: string;
  description: string;
  timezone: string;
  busy: boolean;
  allDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  exactStart: string;
  exactEnd: string;
};

export type EventPayload =
  | { kind: "timed"; title: string; description: string | null; timezone: IanaTimeZone; busy: boolean; startAt: string; endAt: string }
  | { kind: "all-day"; title: string; description: string | null; timezone: IanaTimeZone; busy: boolean; startDate: string; endDateExclusive: string };

export type EventDraftError = "title" | "description" | "timezone" | "date" | "time" | "ambiguous" | "range";

function localParts(instant: string, zone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return { date: `${part("year")}-${part("month")}-${part("day")}`, time: `${part("hour")}:${part("minute")}` };
}

export function eventDraftFromRecord(record: EventRecord): EventDraft {
  if (record.all_day) {
    return {
      title: record.title, description: record.description ?? "", timezone: record.timezone,
      busy: record.busy, allDay: true, startDate: requireLocalDate(record.start_date),
      startTime: "", endDate: addDays(requireLocalDate(record.end_date_exclusive), -1),
      endTime: "", exactStart: "", exactEnd: "",
    };
  }
  const start = localParts(record.start_at ?? "", record.timezone);
  const end = localParts(record.end_at ?? "", record.timezone);
  return {
    title: record.title, description: record.description ?? "", timezone: record.timezone,
    busy: record.busy, allDay: false, startDate: start.date, startTime: start.time,
    endDate: end.date, endTime: end.time,
    exactStart: new Date(record.start_at ?? "").toISOString(),
    exactEnd: new Date(record.end_at ?? "").toISOString(),
  };
}

export function switchEventAllDay(draft: EventDraft, allDay: boolean): EventDraft {
  if (draft.allDay === allDay) return draft;
  return {
    ...draft,
    allDay,
    startTime: allDay ? "" : "09:00",
    endTime: allDay ? "" : "10:00",
    exactStart: "",
    exactEnd: "",
  };
}

export function eventDetailsFromCapture(content: string): { title: string; description: string } {
  const lines = content.split(/\r?\n/);
  const first = lines.findIndex((line) => line.trim().length > 0);
  const firstLine = (lines[first] ?? "").trim();
  const overflow = firstLine.slice(200);
  const rest = lines.slice(first + 1).join("\n").trim();
  return { title: firstLine.slice(0, 200), description: [overflow, rest].filter(Boolean).join("\n") };
}

function selectInstant(candidates: string[], exact: string): string | undefined {
  if (isUtcInstant(exact) && candidates.some((candidate) => Math.floor(Date.parse(candidate) / 60000) === Math.floor(Date.parse(exact) / 60000))) {
    return exact;
  }
  return candidates.length === 1 ? candidates[0] : undefined;
}

export function eventDraftToPayload(draft: EventDraft): { ok: true; value: EventPayload } | { ok: false; error: EventDraftError; startCandidates?: string[]; endCandidates?: string[] } {
  const title = draft.title.trim();
  if (!title || title.length > 200) return { ok: false, error: "title" };
  if (draft.description.length > 10000) return { ok: false, error: "description" };
  if (!isIanaTimeZone(draft.timezone)) return { ok: false, error: "timezone" };
  if (!isLocalDate(draft.startDate) || !isLocalDate(draft.endDate)) return { ok: false, error: "date" };
  const common = { title, description: draft.description.trim() || null, timezone: draft.timezone, busy: draft.busy };
  if (draft.allDay) {
    if (draft.endDate < draft.startDate) return { ok: false, error: "range" };
    return { ok: true, value: { ...common, kind: "all-day", startDate: draft.startDate, endDateExclusive: addDays(draft.endDate, 1) } };
  }
  const startCandidates = localTimeCandidates(draft.startDate, draft.startTime, draft.timezone);
  const endCandidates = localTimeCandidates(draft.endDate, draft.endTime, draft.timezone);
  if (!startCandidates.length || !endCandidates.length) return { ok: false, error: "time", startCandidates, endCandidates };
  const startAt = selectInstant(startCandidates, draft.exactStart);
  const endAt = selectInstant(endCandidates, draft.exactEnd);
  if (!startAt || !endAt) return { ok: false, error: "ambiguous", startCandidates, endCandidates };
  if (Date.parse(endAt) <= Date.parse(startAt)) return { ok: false, error: "range", startCandidates, endCandidates };
  return { ok: true, value: { ...common, kind: "timed", startAt: requireUtcInstant(startAt), endAt: requireUtcInstant(endAt) } };
}
