import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  type SupabaseFeedbackRow,
} from "@/lib/supabase";
import { authenticateAdminApiRequest } from "@/server/admin";
import { logSupabaseQueryError } from "@/server/api/supabase-error";

export type AdminFeedbackResponseRow = Pick<
  SupabaseFeedbackRow,
  "created_at" | "id" | "message" | "status" | "type" | "user_id"
>;

export async function GET(request: Request) {
  const auth = await authenticateAdminApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);

  if (url.searchParams.get("probe") === "1") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("id,created_at,type,status,user_id,message")
    .order("created_at", { ascending: false })
    .returns<AdminFeedbackResponseRow[]>();

  if (error) {
    logSupabaseQueryError("Failed to fetch admin feedback.", error, {
      operation: "admin.feedback.GET",
      table: "feedback",
    });

    return NextResponse.json(
      { ok: false, error: "Failed to fetch feedback." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: true, feedback: data ?? [] },
    { status: 200 },
  );
}
