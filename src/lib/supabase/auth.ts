"use client";

import {
  createClient,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";

import {
  getSupabaseBrowserReadiness,
  requireSupabaseBrowserConfig,
} from "@/lib/supabase/config";
import {
  getSupabaseAuthStorageKey,
  getSupabaseAuthStorageKeysToClear,
  getRecoverableCorruptSupabaseAuthStorageKeysToClear,
} from "@/lib/supabase/auth-storage";
import { isExpectedSupabaseSignedOutError } from "@/lib/supabase/auth-errors";
export {
  isExpectedSupabaseSignedOutError,
  isInvalidSupabaseRefreshTokenError,
  isSupabaseAuthSessionMissingError,
} from "@/lib/supabase/auth-errors";

export type SupabaseBrowserAuthClient = SupabaseClient;

export type SupabaseBrowserSessionResult =
  | { ok: true; recovered: boolean; session: Session | null }
  | { ok: false; error: string };

const pendingSessionLoads = new WeakMap<
  SupabaseBrowserAuthClient,
  Promise<SupabaseBrowserSessionResult>
>();

let cachedBrowserAuthClient: SupabaseBrowserAuthClient | null = null;

function removeSupabaseBrowserAuthStorageKeys(keys: readonly string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    for (const key of keys) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Browser storage can be unavailable in private or restricted contexts.
  }
}

function getBrowserLocalStorageEntries(): [string, string | null][] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return Object.keys(window.localStorage).map((key) => [
      key,
      window.localStorage.getItem(key),
    ]);
  } catch {
    return [];
  }
}

function clearRecoverableCorruptSupabaseBrowserAuthStorage(
  supabaseUrl: string,
): void {
  const keysToClear = getRecoverableCorruptSupabaseAuthStorageKeysToClear(
    getBrowserLocalStorageEntries(),
    supabaseUrl,
  );

  removeSupabaseBrowserAuthStorageKeys(keysToClear);
}

export function getSupabaseBrowserAuthClient(): SupabaseBrowserAuthClient {
  if (cachedBrowserAuthClient) {
    return cachedBrowserAuthClient;
  }

  const config = requireSupabaseBrowserConfig();
  const storageKey = getSupabaseAuthStorageKey(config.url);

  clearRecoverableCorruptSupabaseBrowserAuthStorage(config.url);

  cachedBrowserAuthClient = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      skipAutoInitialize: true,
      storageKey: storageKey ?? undefined,
    },
  });

  return cachedBrowserAuthClient;
}

function clearSupabaseBrowserAuthStorage(): void {
  const readiness = getSupabaseBrowserReadiness();

  if (!readiness.ready) {
    return;
  }

  removeSupabaseBrowserAuthStorageKeys(
    getSupabaseAuthStorageKeysToClear(
      getBrowserLocalStorageEntries().map(([key]) => key),
      readiness.config.url,
    ),
  );
}

export async function clearSupabaseBrowserAuthSession(
  supabase: SupabaseBrowserAuthClient,
): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error && !isExpectedSupabaseSignedOutError(error)) {
      reportUnexpectedSupabaseAuthError("local-sign-out", error);
    }
  } catch (error) {
    if (!isExpectedSupabaseSignedOutError(error)) {
      reportUnexpectedSupabaseAuthError("local-sign-out", error);
    }
  } finally {
    clearSupabaseBrowserAuthStorage();
  }
}

async function recoverExpectedSignedOutState(
  supabase: SupabaseBrowserAuthClient,
  error: unknown,
): Promise<boolean> {
  if (!isExpectedSupabaseSignedOutError(error)) {
    return false;
  }

  await clearSupabaseBrowserAuthSession(supabase);
  return true;
}

// Never log raw SDK errors: messages can contain credentials or response content.
export function reportUnexpectedSupabaseAuthError(
  operation: string,
  error: unknown,
): void {
  const status =
    typeof error === "object" && error !== null && "status" in error &&
    typeof error.status === "number" ? error.status : undefined;
  console.error("Unexpected Supabase auth failure", { operation, status });
}

export function loadSupabaseBrowserAuthSession(
  supabase: SupabaseBrowserAuthClient = getSupabaseBrowserAuthClient(),
): Promise<SupabaseBrowserSessionResult> {
  const pending = pendingSessionLoads.get(supabase);
  if (pending) {
    return pending;
  }
  const request = loadSession(supabase).finally(() => {
    pendingSessionLoads.delete(supabase);
  });
  pendingSessionLoads.set(supabase, request);
  return request;
}

async function loadSession(
  supabase: SupabaseBrowserAuthClient,
): Promise<SupabaseBrowserSessionResult> {
  const readiness = getSupabaseBrowserReadiness();
  const storageKey = readiness.ready
    ? getSupabaseAuthStorageKey(readiness.config.url)
    : null;
  const hadStoredSession = getBrowserLocalStorageEntries().some(
    ([key, value]) => key === storageKey && value !== null,
  );
  try {
    const { error: initializeError } = await supabase.auth.initialize();

    if (initializeError) {
      if (await recoverExpectedSignedOutState(supabase, initializeError)) {
        return { ok: true, recovered: true, session: null };
      }

      reportUnexpectedSupabaseAuthError("load-session", initializeError);
      return { ok: false, error: "Could not load auth session." };
    }

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      if (await recoverExpectedSignedOutState(supabase, error)) {
        return { ok: true, recovered: true, session: null };
      }

      reportUnexpectedSupabaseAuthError("load-session", error);
      return { ok: false, error: "Could not load auth session." };
    }

    // SDK initialization can recover internally and return no error. Finish
    // scoped companion-key cleanup when that stored session has disappeared.
    const recovered = hadStoredSession && !data.session;
    if (recovered) {
      clearSupabaseBrowserAuthStorage();
    }
    return {
      ok: true,
      recovered,
      session: data.session ?? null,
    };
  } catch (error) {
    if (await recoverExpectedSignedOutState(supabase, error)) {
      return { ok: true, recovered: true, session: null };
    }

    reportUnexpectedSupabaseAuthError("load-session", error);
    return { ok: false, error: "Could not load auth session." };
  }
}

export async function clearExpectedSupabaseSignedOutSession(
  supabase: SupabaseBrowserAuthClient = getSupabaseBrowserAuthClient(),
): Promise<boolean> {
  const result = await loadSupabaseBrowserAuthSession(supabase);

  return result.ok && result.recovered;
}
