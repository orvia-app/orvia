import { NextResponse } from "next/server";

import { createSupabaseServerAuthClient } from "@/server/supabase/auth";

export type AuthenticatedUser =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

function parseBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token, ...extraParts] = authorizationHeader.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || !token || extraParts.length > 0) {
    return null;
  }

  return token;
}

export async function authenticateApiRequest(
  request: Request,
): Promise<AuthenticatedUser> {
  const accessToken = parseBearerToken(request.headers.get("authorization"));

  if (!accessToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Authentication is required." },
        { status: 401 },
      ),
    };
  }

  const supabase = createSupabaseServerAuthClient({ accessToken });
  const { data, error } = await supabase.auth.getUser();
  const userId = data.user?.id;

  if (error || !userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Authentication is invalid." },
        { status: 401 },
      ),
    };
  }

  return { ok: true, userId };
}
