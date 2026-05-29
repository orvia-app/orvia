import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .limit(1);

  return NextResponse.json({
    ok: !error,
    data,
    error: error?.message ?? null,
  });
}
