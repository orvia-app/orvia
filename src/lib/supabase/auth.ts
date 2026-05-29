"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseBrowserConfig } from "@/lib/supabase/config";

export type SupabaseBrowserAuthClient = SupabaseClient;

let cachedBrowserAuthClient: SupabaseBrowserAuthClient | null = null;

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
