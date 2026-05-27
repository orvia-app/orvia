export const CLIENT_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export type ClientEnvKey = (typeof CLIENT_ENV_KEYS)[number];

export type ClientEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

export type EnvValidationIssue = {
  key: ClientEnvKey;
  message: string;
};

export type EnvValidationResult =
  | { ok: true; env: ClientEnv }
  | { ok: false; issues: readonly EnvValidationIssue[] };

function cleanEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function readClientEnv(): ClientEnv {
  return {
    NEXT_PUBLIC_SUPABASE_URL: cleanEnvValue(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: cleanEnvValue(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}

export function validateClientEnv(env = readClientEnv()): EnvValidationResult {
  const issues: EnvValidationIssue[] = [];

  if (
    env.NEXT_PUBLIC_SUPABASE_URL &&
    !isValidHttpUrl(env.NEXT_PUBLIC_SUPABASE_URL)
  ) {
    issues.push({
      key: "NEXT_PUBLIC_SUPABASE_URL",
      message: "Must be a valid http(s) URL.",
    });
  }

  if (
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== undefined &&
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length < 20
  ) {
    issues.push({
      key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      message: "Must be a non-placeholder public anon key when configured.",
    });
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true, env };
}

export function getRequiredClientEnv(
  keys: readonly ClientEnvKey[],
  env = readClientEnv(),
): ClientEnv {
  const missing = keys.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required client env: ${missing.join(", ")}`);
  }

  const validation = validateClientEnv(env);

  if (!validation.ok) {
    throw new Error(
      `Invalid client env: ${validation.issues
        .map((issue) => `${issue.key}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  return env;
}
