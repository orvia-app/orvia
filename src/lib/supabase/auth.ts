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
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // If browser auth storage is already corrupt, keep rendering signed out.
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

export async function loadSupabaseBrowserAuthSession(
  supabase: SupabaseBrowserAuthClient = getSupabaseBrowserAuthClient(),
): Promise<SupabaseBrowserSessionResult> {
  try {
    const { error: initializeError } = await supabase.auth.initialize();

    if (initializeError) {
      if (await recoverExpectedSignedOutState(supabase, initializeError)) {
        return { ok: true, recovered: true, session: null };
      }

      return { ok: false, error: "Could not load auth session." };
    }

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      if (await recoverExpectedSignedOutState(supabase, error)) {
        return { ok: true, recovered: true, session: null };
      }

      return { ok: false, error: "Could not load auth session." };
    }

    return {
      ok: true,
      recovered: false,
      session: data.session ?? null,
    };
  } catch (error) {
    if (await recoverExpectedSignedOutState(supabase, error)) {
      return { ok: true, recovered: true, session: null };
    }

    return { ok: false, error: "Could not load auth session." };
  }
}

export async function clearExpectedSupabaseSignedOutSession(
  supabase: SupabaseBrowserAuthClient = getSupabaseBrowserAuthClient(),
): Promise<boolean> {
  const result = await loadSupabaseBrowserAuthSession(supabase);

  return result.ok && result.recovered;
}
