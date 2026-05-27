import type { AuthSession } from "@/core/auth/types";

export const anonymousSession: AuthSession = {
  status: "anonymous",
  provider: "anonymous",
};

export function isAuthenticatedSession(
  session: AuthSession,
): session is AuthSession & { status: "authenticated" } {
  return session.status === "authenticated" && session.user !== undefined;
}

export function isSessionExpired(
  session: AuthSession,
  referenceIso: string,
): boolean {
  if (!session.expiresAt) {
    return false;
  }

  return Date.parse(session.expiresAt) <= Date.parse(referenceIso);
}
