import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  type SupabasePlanningPreferencesRow,
} from "@/lib/supabase";
import { authenticateApiRequest } from "@/server/api/auth";
import {
  DEFAULT_ENABLED_WEEKDAYS,
  DEFAULT_LOCAL_END_TIME,
  DEFAULT_LOCAL_START_TIME,
  parsePlanningPreferencesInput,
  planningPreferencesFromRow,
} from "@/server/api/planning-preferences";

const failure = () => NextResponse.json(
  { ok: false, error: "Planning preferences persistence failed." },
  { status: 500 },
);

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const { data, error } = await getSupabaseServerClient()
      .from("planning_preferences")
      .select("*")
      .eq("user_id", auth.userId)
      .maybeSingle<SupabasePlanningPreferencesRow>();
    if (error) return failure();
    return NextResponse.json({
      ok: true,
      preferences: data ? planningPreferencesFromRow(data) : null,
      defaults: {
        enabledWeekdays: DEFAULT_ENABLED_WEEKDAYS,
        localStartTime: DEFAULT_LOCAL_START_TIME,
        localEndTime: DEFAULT_LOCAL_END_TIME,
      },
    });
  } catch {
    return failure();
  }
}

export async function PUT(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  const parsed = parsePlanningPreferencesInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    const db = getSupabaseServerClient();
    const { data: current, error: readError } = await db
      .from("planning_preferences")
      .select("*")
      .eq("user_id", auth.userId)
      .maybeSingle<SupabasePlanningPreferencesRow>();
    if (readError) return failure();

    if (!current) {
      if (parsed.expectedVersion !== undefined) {
        return NextResponse.json(
          { ok: false, error: "Planning preferences changed. Reload and try again." },
          { status: 409 },
        );
      }
      const { data, error } = await db
        .from("planning_preferences")
        .insert({ user_id: auth.userId, ...parsed.fields })
        .select("*")
        .single<SupabasePlanningPreferencesRow>();
      if (error || !data) return failure();
      return NextResponse.json(
        { ok: true, preferences: planningPreferencesFromRow(data) },
        { status: 201 },
      );
    }

    if (parsed.expectedVersion !== undefined && parsed.expectedVersion !== current.version) {
      return NextResponse.json(
        { ok: false, error: "Planning preferences changed. Reload and try again." },
        { status: 409 },
      );
    }
    const { data, error } = await db
      .from("planning_preferences")
      .update({ ...parsed.fields, version: current.version + 1 })
      .eq("user_id", auth.userId)
      .eq("version", current.version)
      .select("*")
      .maybeSingle<SupabasePlanningPreferencesRow>();
    if (error) return failure();
    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Planning preferences changed. Reload and try again." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, preferences: planningPreferencesFromRow(data) });
  } catch {
    return failure();
  }
}
