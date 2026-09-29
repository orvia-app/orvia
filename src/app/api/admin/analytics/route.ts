import { NextResponse } from "next/server";
import { parseAnalyticsReport } from "@/lib/analytics-contract";
import { getSupabaseServerClient } from "@/lib/supabase";
import { authenticateAdminApiRequest } from "@/server/admin";
export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", Vary: "Authorization" };
  try {
    const auth = await authenticateAdminApiRequest(request);
    if (!auth.ok) {
      auth.response.headers.set("Cache-Control", "no-store");
      return auth.response;
    }
    const period = new URL(request.url).searchParams.get("days") ?? "7";
    if (period !== "7" && period !== "30")
      return NextResponse.json({ ok: false }, { status: 400, headers });
    const { data, error } = await getSupabaseServerClient().rpc("beta_analytics_report", { p_days: Number(period) });
    const report = error ? null : parseAnalyticsReport(data);
    if (!report)
      throw new Error("Analytics report unavailable");
    return NextResponse.json({ ok: true, report }, { headers });
  }
  catch {
    console.warn("Analytics report unavailable.");
    return NextResponse.json({ ok: false }, { status: 503, headers });
  }
}
