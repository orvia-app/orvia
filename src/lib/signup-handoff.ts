type SignupResult = {
  session: unknown | null;
  user: { identities?: unknown[]; email_confirmed_at?: string | null } | null;
};

export type SignupOutcome = "authenticated" | "confirmation" | "check-email" | "invalid";
export type SignupNotice = { email: string; outcome: "confirmation" | "check-email" };

/** Supabase may return an obfuscated user for an existing account. */
export function getSignupOutcome(data: SignupResult): SignupOutcome {
  if (data.session) return "authenticated";
  if (!data.user) return "invalid";
  if (data.user.identities?.length && !data.user.email_confirmed_at) return "confirmation";
  return "check-email";
}

// One client-side navigation only. Never put email in URLs, storage or analytics.
let pending: { notice: SignupNotice; expiresAt: number } | null = null;
export function rememberSignupNotice(notice: SignupNotice): void {
  if (typeof window === "undefined") return;
  pending = { notice: { email: notice.email.trim(), outcome: notice.outcome }, expiresAt: Date.now() + 300_000 };
}

export function consumeSignupNotice(): SignupNotice | null {
  if (typeof window === "undefined") return null;
  const saved = pending;
  pending = null;
  return saved && saved.expiresAt > Date.now() ? saved.notice : null;
}
