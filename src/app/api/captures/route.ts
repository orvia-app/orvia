import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  type SupabaseCaptureInsert,
  type SupabaseCaptureRow,
  type SupabaseCaptureSource,
  type SupabaseCaptureStatus,
} from "@/lib/supabase";
import { authenticateApiRequest } from "@/server/api/auth";
import { logSupabaseQueryError } from "@/server/api/supabase-error";

const CAPTURE_CONTENT_MAX_LENGTH = 10000;
const CAPTURE_SOURCES = [
  "quick_capture",
  "manual",
  "import",
  "telegram",
  "system",
] as const satisfies readonly SupabaseCaptureSource[];
const CAPTURE_STATUSES = [
  "inbox",
  "processed",
  "archived",
] as const satisfies readonly SupabaseCaptureStatus[];

type CreateCaptureBody = {
  content?: unknown;
  source?: unknown;
  status?: unknown;
  metadata?: unknown;
};

type ParsedCapturePayload =
  | { ok: true; payload: SupabaseCaptureInsert }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseContent(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const content = value.trim();

  return content.length > 0 && content.length <= CAPTURE_CONTENT_MAX_LENGTH
    ? content
    : null;
}

function isCaptureSource(value: unknown): value is SupabaseCaptureSource {
  return (
    typeof value === "string" &&
    CAPTURE_SOURCES.includes(value as SupabaseCaptureSource)
  );
}

function isCaptureStatus(value: unknown): value is SupabaseCaptureStatus {
  return (
    typeof value === "string" &&
    CAPTURE_STATUSES.includes(value as SupabaseCaptureStatus)
  );
}

function parseMetadata(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }

  return isRecord(value) ? value : undefined;
}

function parseCreateCapturePayload(
  body: CreateCaptureBody,
): ParsedCapturePayload {
  const content = parseContent(body.content);

  if (!content) {
    return {
      ok: false,
      error: `Content is required and must be ${CAPTURE_CONTENT_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (body.source !== undefined && !isCaptureSource(body.source)) {
    return {
      ok: false,
      error:
        "Source must be one of: quick_capture, manual, import, telegram, system.",
    };
  }

  if (body.status !== undefined && !isCaptureStatus(body.status)) {
    return {
      ok: false,
      error: "Status must be one of: inbox, processed, archived.",
    };
  }

  const metadata = parseMetadata(body.metadata);

  if (metadata === undefined && body.metadata !== undefined) {
    return {
      ok: false,
      error: "Metadata must be a JSON object.",
    };
  }

  return {
    ok: true,
    payload: {
      content,
      source: isCaptureSource(body.source) ? body.source : "manual",
      status: isCaptureStatus(body.status) ? body.status : "inbox",
      metadata: metadata ?? {},
    },
  };
}

async function recordCaptureCreatedActivity(
  capture: SupabaseCaptureRow,
  userId: string,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("activities").insert({
    user_id: userId,
    type: "quick_capture_created",
    entity_type: "inbox",
    entity_id: capture.id,
    title: "Inbox item captured",
    description: "Captured an inbox item",
    metadata: {
      source: capture.source,
      status: capture.status,
    },
  });

  if (error) {
    console.error("Failed to record capture activity in Supabase.", error.message);
  }
}

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("captures")
    .select("*")
    .eq("user_id", auth.userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    logSupabaseQueryError("Failed to fetch captures from Supabase.", error, {
      operation: "captures.GET",
      table: "captures",
    });

    return NextResponse.json(
      { ok: false, error: "Failed to fetch captures." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: true, captures: data ?? [] },
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

  const parsedPayload = parseCreateCapturePayload(body);

  if (!parsedPayload.ok) {
    return NextResponse.json(
      { ok: false, error: parsedPayload.error },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("captures")
    .insert({ ...parsedPayload.payload, user_id: auth.userId })
    .select("*")
    .returns<SupabaseCaptureRow>()
    .single();

  if (error) {
    logSupabaseQueryError("Failed to create capture in Supabase.", error, {
      operation: "captures.POST",
      table: "captures",
    });

    return NextResponse.json(
      { ok: false, error: "Failed to create capture." },
      { status: 500 },
    );
  }

  await recordCaptureCreatedActivity(data, auth.userId);

  return NextResponse.json({ ok: true, capture: data }, { status: 201 });
}
