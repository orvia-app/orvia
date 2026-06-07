const LEGACY_SUPABASE_AUTH_STORAGE_KEYS = new Set(["supabase.auth.token"]);

type StorageEntry = readonly [key: string, value: string | null];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getSupabaseAuthStorageKey(supabaseUrl: string): string | null {
  try {
    const hostname = new URL(supabaseUrl).hostname;
    const projectRef = hostname.split(".")[0]?.trim();

    return projectRef ? `sb-${projectRef}-auth-token` : null;
  } catch {
    return null;
  }
}

export function shouldClearSupabaseAuthStorageKey(
  key: string,
  supabaseUrl: string,
): boolean {
  if (LEGACY_SUPABASE_AUTH_STORAGE_KEYS.has(key)) {
    return true;
  }

  const storageKey = getSupabaseAuthStorageKey(supabaseUrl);

  if (!storageKey) {
    return false;
  }

  return key === storageKey || key.startsWith(`${storageKey}-`);
}

export function getSupabaseAuthStorageKeysToClear(
  keys: readonly string[],
  supabaseUrl: string,
): string[] {
  return keys.filter((key) =>
    shouldClearSupabaseAuthStorageKey(key, supabaseUrl),
  );
}

export function isRecoverablyCorruptSupabaseAuthStorageValue(
  value: string | null,
): boolean {
  if (!value) {
    return false;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return true;
  }

  if (!isRecord(parsed)) {
    return true;
  }

  const session =
    "currentSession" in parsed && isRecord(parsed.currentSession)
      ? parsed.currentSession
      : parsed;

  const accessToken = session.access_token;
  const refreshToken = session.refresh_token;
  const expiresAt = session.expires_at;

  if (
    typeof accessToken !== "string" ||
    accessToken.trim().length === 0 ||
    typeof refreshToken !== "string" ||
    refreshToken.trim().length === 0 ||
    typeof expiresAt !== "number" ||
    !Number.isFinite(expiresAt)
  ) {
    return true;
  }

  return !isRecord(session.user);
}

export function getRecoverableCorruptSupabaseAuthStorageKeysToClear(
  entries: readonly StorageEntry[],
  supabaseUrl: string,
): string[] {
  const storageKey = getSupabaseAuthStorageKey(supabaseUrl);

  if (!storageKey) {
    return [];
  }

  const authStorageEntry = entries.find(([key]) => key === storageKey);

  if (!authStorageEntry) {
    return [];
  }

  if (!isRecoverablyCorruptSupabaseAuthStorageValue(authStorageEntry[1])) {
    return [];
  }

  return getSupabaseAuthStorageKeysToClear(
    entries.map(([key]) => key),
    supabaseUrl,
  );
}
