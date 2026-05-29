import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseServerConfig } from "@/server/supabase/config";

export type SupabaseServerAuthClient = SupabaseClient;

export type SupabaseServerAuthClientOptions = {
  accessToken?: string;
};

export function createSupabaseServerAuthClient(
  options: SupabaseServerAuthClientOptions = {},
): SupabaseServerAuthClient {
  const config = requireSupabaseServerConfig();

  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: options.accessToken
      ? {
          headers: {
            Authorization: `Bearer ${options.accessToken}`,
          },
        }
      : undefined,
  });
}
