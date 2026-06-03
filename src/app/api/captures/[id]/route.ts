import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  type SupabaseCaptureRow,
  type SupabaseCaptureStatus,
} from "@/lib/supabase";
import { authenticateApiRequest } from "@/server/api/auth";

const CAPTURE_STATUSES = [
  "inbox",
  "processed",
  "archived",
] as const satisfies readonly SupabaseCaptureStatus[];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateCaptureBody = {
  status?: unknown;
};

type ParsedCaptureUpdate =
  | { ok: true; status: SupabaseCaptureStatus }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCaptureStatus(value: unknown): value is SupabaseCaptureStatus {
  return (
    typeof value === "string" &&
    CAPTURE_STATUSES.includes(value as SupabaseCaptureStatus)
  );
}

function parseUpdateCapturePayload(
  body: UpdateCaptureBody,
): ParsedCaptureUpdate {
  if (!isCaptureStatus(body.status)) {
    return {
      ok: false,
      error: "Status must be one of: inbox, processed, archived.",
    };
  }

  return { ok: true, status: body.status };
}

async function getCaptureId(context: RouteContext): Promise<string | null> {
  const { id } = await context.params;

  return UUID_PATTERN.test(id) ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const captureId = await getCaptureId(context);

  if (!captureId) {
    return NextResponse.json(
      { ok: false, error: "Capture not found." },
      { status: 404 },
    );
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

  const parsedPayload = parseUpdateCapturePayload(body);

  if (!parsedPayload.ok) {
    return NextResponse.json(
      { ok: false, error: parsedPayload.error },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("captures")
    .update({ status: parsedPayload.status })
    .eq("id", captureId)
    .eq("user_id", auth.userId)
    .is("deleted_at", null)
    .select("*")
    .returns<SupabaseCaptureRow>()
    .maybeSingle();

  if (error) {
    console.error("Failed to update capture in Supabase.", error.message);

    return NextResponse.json(
      { ok: false, error: "Failed to update capture." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Capture not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, capture: data }, { status: 200 });
}
