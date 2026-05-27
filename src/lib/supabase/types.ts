import type { ClientEnv } from "@/env/client";

export type SupabaseBrowserConfig = {
  url: string;
  anonKey: string;
};

export type SupabaseBrowserReadiness =
  | { ready: true; config: SupabaseBrowserConfig }
  | { ready: false; reason: string };

export type SupabaseBrowserClientFactory<TClient> = (
  config: SupabaseBrowserConfig,
) => TClient;

export type SupabaseBrowserConfigInput = Pick<
  ClientEnv,
  "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
>;
