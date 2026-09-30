import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/server/api/auth";
import { parsePlanningQuery } from "@/server/api/schedule-input";
import { readOwnedSchedule } from "@/server/api/schedule-source";

/** POST body avoids putting exact schedule times in the browser URL. */
export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = parsePlanningQuery(body);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  try {
    const projection = await readOwnedSchedule(auth.userId, parsed.value.range,
      parsed.value.planningTimezone);
    return NextResponse.json({ ok: true, projection,
      privacy: { intelligenceEligibility: "unverified", recommendationProcessingAllowed: false },
    }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to read schedule." }, { status: 500 });
  }
}
