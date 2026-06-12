import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  type SupabaseFeedbackInsert,
  type SupabaseFeedbackType,
} from "@/lib/supabase";
import { authenticateApiRequest } from "@/server/api/auth";
import { logSupabaseQueryError } from "@/server/api/supabase-error";

const FEEDBACK_MESSAGE_MAX_LENGTH = 5000;
const FEEDBACK_TYPES = [
  "bug",
  "idea",
  "confusing",
  "missing_feature",
  "general",
] as const satisfies readonly SupabaseFeedbackType[];
const SAFE_METADATA_KEYS = new Set(["locale", "route", "source", "theme"]);
const SAFE_METADATA_VALUE_MAX_LENGTH = 160;

type CreateFeedbackBody = {
  type?: unknown;
  message?: unknown;
  metadata?: unknown;
};

type ParsedFeedbackPayload =
  | { ok: true; payload: SupabaseFeedbackInsert }
  | { ok: false; error: string };

type SafeFeedbackResponse = {
  id: string;
  type: SupabaseFeedbackType;
  status: "new" | "reviewed" | "planned" | "closed";
  created_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFeedbackType(value: unknown): value is SupabaseFeedbackType {
  return (
    typeof value === "string" &&
    FEEDBACK_TYPES.includes(value as SupabaseFeedbackType)
  );
}

function parseMessage(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const message = value.trim();

  return message.length > 0 && message.length <= FEEDBACK_MESSAGE_MAX_LENGTH
    ? message
    : null;
}

function parseMetadata(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  const metadata: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(value)) {
    if (
      !SAFE_METADATA_KEYS.has(key) ||
      typeof rawValue !== "string" ||
      rawValue.length === 0 ||
      rawValue.length > SAFE_METADATA_VALUE_MAX_LENGTH
    ) {
      continue;
    }

    metadata[key] = rawValue;
  }

  return metadata;
}

function parseCreateFeedbackPayload(
  body: CreateFeedbackBody,
): ParsedFeedbackPayload {
  const message = parseMessage(body.message);

  if (!message) {
    return {
      ok: false,
      error: `Message is required and must be ${FEEDBACK_MESSAGE_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (body.type !== undefined && !isFeedbackType(body.type)) {
    return {
      ok: false,
      error:
        "Type must be one of: bug, idea, confusing, missing_feature, general.",
    };
  }

  if (body.metadata !== undefined && !isRecord(body.metadata)) {
    return {
      ok: false,
      error: "Metadata must be a JSON object.",
    };
  }

  return {
    ok: true,
    payload: {
      type: isFeedbackType(body.type) ? body.type : "general",
      message,
      metadata: parseMetadata(body.metadata),
    },
  };
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

  const parsedPayload = parseCreateFeedbackPayload(body);

  if (!parsedPayload.ok) {
    return NextResponse.json(
      { ok: false, error: parsedPayload.error },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("feedback")
    .insert({ ...parsedPayload.payload, user_id: auth.userId })
    .select("id,type,status,created_at")
    .returns<SafeFeedbackResponse>()
    .single();

  if (error) {
    logSupabaseQueryError("Failed to create feedback in Supabase.", error, {
      operation: "feedback.POST",
      table: "feedback",
    });

    return NextResponse.json(
      { ok: false, error: "Failed to send feedback." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, feedback: data }, { status: 201 });
}
