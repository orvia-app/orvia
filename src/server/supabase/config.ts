import { readServerEnv, validateServerEnv } from "@/env/server";
import type {
  SupabaseServerBootstrap,
  SupabaseServerConfig,
  SupabaseServerConfigInput,
  SupabaseServerReadiness,
} from "@/server/supabase/types";

export const supabaseServerBootstrap: SupabaseServerBootstrap = {
  packageName: "@supabase/supabase-js",
  installCommand: "npm install @supabase/supabase-js",
  requiredEnv: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ],
  serverOnlyEnv: ["SUPABASE_SERVICE_ROLE_KEY"],
};

export function getSupabaseServerReadiness(
  env: SupabaseServerConfigInput = readServerEnv(),
): SupabaseServerReadiness {
  const validation = validateServerEnv({ ...readServerEnv(), ...env });

  if (!validation.ok) {
    return {
      ready: false,
      reason: validation.issues
        .map((issue) => `${issue.key}: ${issue.message}`)
        .join("; "),
    };
  }

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      ready: false,
      reason:
        "Supabase URL and anon key are not configured. Local-first mode remains active.",
    };
  }

  return {
    ready: true,
    config: {
      url: env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
  };
}

export function requireSupabaseServerConfig(
  env: SupabaseServerConfigInput = readServerEnv(),
): SupabaseServerConfig {
  const readiness = getSupabaseServerReadiness(env);

  if (!readiness.ready) {
    throw new Error(readiness.reason);
  }

  return readiness.config;
}
