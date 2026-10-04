import type { EventPayload } from "@/lib/event-form";

export type EventRecord = {
  id: string;
  title: string;
  description: string | null;
  timezone: string;
  busy: boolean;
  all_day: boolean;
  start_at: string | null;
  end_at: string | null;
  start_date: string | null;
  end_date_exclusive: string | null;
};

function parseRecord(value: unknown): EventRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid Event response.");
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.title !== "string" ||
      (row.description !== null && typeof row.description !== "string") ||
      typeof row.timezone !== "string" || typeof row.busy !== "boolean" ||
      typeof row.all_day !== "boolean") throw new Error("Invalid Event response.");
  const optional = (value: unknown) => value === null || typeof value === "string";
  if (!optional(row.start_at) || !optional(row.end_at) || !optional(row.start_date) || !optional(row.end_date_exclusive)) {
    throw new Error("Invalid Event response.");
  }
  return row as EventRecord;
}

async function request(path: string, accessToken: string, method: string, payload?: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(path, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, ...(payload === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    cache: "no-store",
  });
  const body: unknown = await response.json();
  if (!response.ok || !body || typeof body !== "object" || Array.isArray(body) || !("ok" in body) || body.ok !== true) {
    throw new Error("Event request failed.");
  }
  return body as Record<string, unknown>;
}

export async function createEvent(payload: EventPayload, accessToken: string): Promise<EventRecord> {
  return parseRecord((await request("/api/events", accessToken, "POST", payload)).event);
}

export async function getEvent(id: string, accessToken: string): Promise<EventRecord> {
  return parseRecord((await request(`/api/events/${encodeURIComponent(id)}`, accessToken, "GET")).event);
}

export async function updateEvent(id: string, payload: EventPayload, accessToken: string): Promise<EventRecord> {
  return parseRecord((await request(`/api/events/${encodeURIComponent(id)}`, accessToken, "PATCH", payload)).event);
}

export async function transitionEvent(id: string, status: "archived" | "deleted", accessToken: string): Promise<void> {
  await request(`/api/events/${encodeURIComponent(id)}`, accessToken, status === "archived" ? "POST" : "DELETE");
}

export async function resolveCaptureToEvent(id: string, payload: EventPayload, accessToken: string): Promise<EventRecord> {
  return parseRecord((await request(`/api/captures/${encodeURIComponent(id)}/resolve-event`, accessToken, "POST", payload)).event);
}
