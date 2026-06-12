import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  type SupabaseFeedbackRow,
  type SupabaseFeedbackStatus,
} from "@/lib/supabase";
import { authenticateAdminApiRequest } from "@/server/admin";
import { logSupabaseQueryError } from "@/server/api/supabase-error";

const FEEDBACK_STATUSES = [
  "new",
  "reviewed",
  "planned",
  "closed",
] as const satisfies readonly SupabaseFeedbackStatus[];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateFeedbackBody = {
  status?: unknown;
};

type AdminFeedbackUpdateResponseRow = Pick<
  SupabaseFeedbackRow,
  "created_at" | "id" | "message" | "status" | "type" | "user_id"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFeedbackStatus(value: unknown): value is SupabaseFeedbackStatus {
  return (
    typeof value === "string" &&
    FEEDBACK_STATUSES.includes(value as SupabaseFeedbackStatus)
  );
}

async function getFeedbackId(context: RouteContext): Promise<string | null> {
  const { id } = await context.params;

  return UUID_PATTERN.test(id) ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authenticateAdminApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const feedbackId = await getFeedbackId(context);

  if (!feedbackId) {
    return NextResponse.json(
      { ok: false, error: "Feedback not found." },
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

  const requestedStatus = (body as UpdateFeedbackBody).status;

  if (!isFeedbackStatus(requestedStatus)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Status must be one of: new, reviewed, planned, closed.",
      },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("feedback")
    .update({ status: requestedStatus })
    .eq("id", feedbackId)
    .select("id,created_at,type,status,user_id,message")
    .returns<AdminFeedbackUpdateResponseRow>()
    .maybeSingle();

  if (error) {
    logSupabaseQueryError("Failed to update admin feedback.", error, {
      operation: "admin.feedback.PATCH",
      table: "feedback",
    });

    return NextResponse.json(
      { ok: false, error: "Failed to update feedback." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Feedback not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, feedback: data }, { status: 200 });
}
