import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  type SupabaseActivityRow,
} from "@/lib/supabase";
import { authenticateApiRequest } from "@/server/api/auth";
import { parseCreateActivityPayload } from "@/server/api/activity-payload";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
