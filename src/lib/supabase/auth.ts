"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseBrowserConfig } from "@/lib/supabase/config";

export type SupabaseBrowserAuthClient = SupabaseClient;

let cachedBrowserAuthClient: SupabaseBrowserAuthClient | null = null;

function getErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return null;
}

export function isInvalidSupabaseRefreshTokenError(error: unknown): boolean {
  const message = getErrorMessage(error)?.toLowerCase();

  return (
    message?.includes("invalid refresh token") === true ||
    message?.includes("refresh token not found") === true
  );
}

export function getSupabaseBrowserAuthClient(): SupabaseBrowserAuthClient {
  if (cachedBrowserAuthClient) {
    return cachedBrowserAuthClient;
  }

  const config = requireSupabaseBrowserConfig();

  cachedBrowserAuthClient = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });

  return cachedBrowserAuthClient;
}

export async function clearSupabaseBrowserAuthSession(
  supabase: SupabaseBrowserAuthClient,
): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // If browser auth storage is already corrupt, keep rendering signed out.
  }
}
