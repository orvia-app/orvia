import type { ServerEnv } from "@/env/server";

export type SupabaseServerConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
};

export type SupabaseServerReadiness =
  | { ready: true; config: SupabaseServerConfig }
  | { ready: false; reason: string };

export type SupabaseServerClientFactory<TClient> = (
  config: SupabaseServerConfig,
) => TClient;

export type SupabaseServerBootstrap = {
  packageName: "@supabase/supabase-js";
  installCommand: "npm install @supabase/supabase-js";
  requiredEnv: readonly [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  serverOnlyEnv: readonly ["SUPABASE_SERVICE_ROLE_KEY"];
};

export type SupabaseServerConfigInput = Pick<
  ServerEnv,
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
>;
