"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  getSupabaseBrowserReadiness,
  requireSupabaseBrowserConfig,
} from "@/lib/supabase/config";
import {
  getSupabaseAuthStorageKey,
  getSupabaseAuthStorageKeysToClear,
  getRecoverableCorruptSupabaseAuthStorageKeysToClear,
} from "@/lib/supabase/auth-storage";
export {
  isExpectedSupabaseSignedOutError,
  isInvalidSupabaseRefreshTokenError,
  isSupabaseAuthSessionMissingError,
} from "@/lib/supabase/auth-errors";

export type SupabaseBrowserAuthClient = SupabaseClient;

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
