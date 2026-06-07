import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  type SupabaseActivityEntityType,
  type SupabaseActivityInsert,
  type SupabaseActivityRow,
  type SupabaseActivityType,
} from "@/lib/supabase";
import { authenticateApiRequest } from "@/server/api/auth";

const ACTIVITY_TITLE_MAX_LENGTH = 240;
const ACTIVITY_DESCRIPTION_MAX_LENGTH = 5000;
const ACTIVITY_TYPES = [
  "task_created",
  "task_updated",
  "task_completed",
  "task_deleted",
  "note_created",
  "note_updated",
  "note_deleted",
  "inbox_processed",
  "quick_capture_created",
  "local_import_completed",
  "system_event",
] as const satisfies readonly SupabaseActivityType[];
const ACTIVITY_ENTITY_TYPES = [
  "task",
  "note",
  "inbox",
  "quick_capture",
  "sync",
  "system",
] as const satisfies readonly SupabaseActivityEntityType[];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CreateActivityBody = {
  type?: unknown;
  entityType?: unknown;
  entityId?: unknown;
  title?: unknown;
  description?: unknown;
  metadata?: unknown;
  occurredAt?: unknown;
};

type ParsedActivityPayload =
  | { ok: true; payload: SupabaseActivityInsert }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isActivityType(value: unknown): value is SupabaseActivityType {
  return (
    typeof value === "string" &&
    ACTIVITY_TYPES.includes(value as SupabaseActivityType)
  );
}

function isActivityEntityType(
  value: unknown,
): value is SupabaseActivityEntityType {
  return (
    typeof value === "string" &&
    ACTIVITY_ENTITY_TYPES.includes(value as SupabaseActivityEntityType)
  );
}

function parseTitle(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const title = value.trim();

  return title.length > 0 && title.length <= ACTIVITY_TITLE_MAX_LENGTH
    ? title
    : null;
}

function parseDescription(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const description = value.trim();

  if (description.length === 0) {
    return null;
  }

  return description.length <= ACTIVITY_DESCRIPTION_MAX_LENGTH
    ? description
    : undefined;
}

function parseEntityId(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const entityId = value.trim();

  return UUID_PATTERN.test(entityId) ? entityId : undefined;
}

function parseMetadata(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }

  return isRecord(value) ? value : undefined;
}

function parseOccurredAt(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return new Date(timestamp).toISOString();
}

function parseCreateActivityPayload(
  body: CreateActivityBody,
): ParsedActivityPayload {
  if (!isActivityType(body.type)) {
    return {
      ok: false,
      error: "Type must be a supported activity type.",
    };
  }

  if (!isActivityEntityType(body.entityType)) {
    return {
      ok: false,
      error: "Entity type must be a supported activity entity type.",
    };
  }

  const title = parseTitle(body.title);

  if (!title) {
    return {
      ok: false,
      error: `Title is required and must be ${ACTIVITY_TITLE_MAX_LENGTH} characters or fewer.`,
    };
  }

  const description = parseDescription(body.description);

  if (description === undefined && body.description !== undefined) {
    return {
      ok: false,
      error: `Description must be a string, null, or ${ACTIVITY_DESCRIPTION_MAX_LENGTH} characters or fewer.`,
    };
  }

  const entityId = parseEntityId(body.entityId);

  if (entityId === undefined && body.entityId !== undefined) {
    return {
      ok: false,
      error: "Entity id must be a valid UUID, null, or empty.",
    };
  }

  const metadata = parseMetadata(body.metadata);

  if (metadata === undefined && body.metadata !== undefined) {
    return {
      ok: false,
      error: "Metadata must be a JSON object.",
    };
  }

  const occurredAt = parseOccurredAt(body.occurredAt);

  if (occurredAt === undefined && body.occurredAt !== undefined) {
    return {
      ok: false,
      error: "Occurred at must be a valid ISO/date string.",
    };
  }

  const payload: SupabaseActivityInsert = {
    type: body.type,
    entity_type: body.entityType,
    entity_id: entityId ?? null,
    title,
    description: description ?? null,
    metadata: metadata ?? {},
    occurred_at: occurredAt,
  };

  return { ok: true, payload };
}

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", auth.userId)
    .is("deleted_at", null)
    .order("occurred_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch activities from Supabase.", error.message);

    return NextResponse.json(
      { ok: false, error: "Failed to fetch activities." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: true, activities: data ?? [] },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { ok: false, error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  const parsedPayload = parseCreateActivityPayload(body);

  if (!parsedPayload.ok) {
    return NextResponse.json(
      { ok: false, error: parsedPayload.error },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("activities")
    .insert({ ...parsedPayload.payload, user_id: auth.userId })
    .select("*")
    .returns<SupabaseActivityRow>()
    .single();

  if (error) {
    console.error("Failed to create activity in Supabase.", error.message);

    return NextResponse.json(
      { ok: false, error: "Failed to create activity." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, activity: data }, { status: 201 });
}
