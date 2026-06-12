import { NextResponse } from "next/server";

import { readServerEnv } from "@/env/server";
import { authenticateApiRequest } from "@/server/api/auth";

type AdminAuthResult =
  | { ok: true; email: string; userId: string }
  | { ok: false; response: NextResponse };

function parseAdminEmails(value: string | undefined): Set<string> {
  if (!value) {
    return new Set();
  }

  return new Set(
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function getAdminEmails(): Set<string> {
  return parseAdminEmails(readServerEnv().ADMIN_EMAILS);
}

export function isAdminEmail(email: string | null | undefined): email is string {
  if (!email) {
    return false;
  }

  return getAdminEmails().has(email.trim().toLowerCase());
}

export async function authenticateAdminApiRequest(
  request: Request,
): Promise<AdminAuthResult> {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth;
  }

  if (!isAdminEmail(auth.email)) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Admin access is required." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    email: auth.email,
    userId: auth.userId,
  };
}
