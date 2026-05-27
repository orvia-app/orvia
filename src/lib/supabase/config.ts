import { readClientEnv, validateClientEnv } from "@/env/client";
import type {
  SupabaseBrowserConfig,
  SupabaseBrowserConfigInput,
  SupabaseBrowserReadiness,
} from "@/lib/supabase/types";

export function getSupabaseBrowserReadiness(
  env: SupabaseBrowserConfigInput = readClientEnv(),
): SupabaseBrowserReadiness {
  const validation = validateClientEnv(env);

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
        "Supabase browser config is not available. Local-first mode remains active.",
    };
  }

  return {
    ready: true,
    config: {
      url: env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  };
}

export function requireSupabaseBrowserConfig(
  env: SupabaseBrowserConfigInput = readClientEnv(),
): SupabaseBrowserConfig {
  const readiness = getSupabaseBrowserReadiness(env);

  if (!readiness.ready) {
    throw new Error(readiness.reason);
  }

  return readiness.config;
}
