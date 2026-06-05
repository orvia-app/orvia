import { NextResponse, type NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  // Supabase auth is currently persisted by the browser client, so middleware
  // cannot validate sessions until auth moves to server-readable cookies.
  // AppShell keeps /app/* client-gated; this matcher is the route foundation
  // for the future server-aware auth gate.
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
