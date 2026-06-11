export const SERVER_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_ENVIRONMENT",
  "NEXT_PUBLIC_VERCEL_ENV",
  "SENTRY_ENVIRONMENT",
  "VERCEL_ENV",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "TELEGRAM_BOT_TOKEN",
] as const;

export type ServerEnvKey = (typeof SERVER_ENV_KEYS)[number];

export type ServerEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  NEXT_PUBLIC_SENTRY_ENVIRONMENT?: string;
  NEXT_PUBLIC_VERCEL_ENV?: string;
  SENTRY_ENVIRONMENT?: string;
  VERCEL_ENV?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENAI_API_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
};

export type ServerEnvValidationIssue = {
  key: ServerEnvKey;
  message: string;
};

export type ServerEnvValidationResult =
  | { ok: true; env: ServerEnv }
  | { ok: false; issues: readonly ServerEnvValidationIssue[] };

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

function validateSecretLength(
  env: ServerEnv,
  key: ServerEnvKey,
  minLength: number,
  issues: ServerEnvValidationIssue[],
): void {
  const value = env[key];

  if (value !== undefined && value.length < minLength) {
    issues.push({
      key,
      message: `Must be at least ${minLength} characters when configured.`,
    });
  }
}

function assertServerRuntime(): void {
  if (typeof window !== "undefined") {
    throw new Error("Server environment variables cannot be read in the browser.");
  }
}

export function readServerEnv(): ServerEnv {
  assertServerRuntime();

  return {
    NEXT_PUBLIC_SUPABASE_URL: cleanEnvValue(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: cleanEnvValue(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    NEXT_PUBLIC_SENTRY_DSN: cleanEnvValue(process.env.NEXT_PUBLIC_SENTRY_DSN),
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: cleanEnvValue(
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    ),
    NEXT_PUBLIC_VERCEL_ENV: cleanEnvValue(process.env.NEXT_PUBLIC_VERCEL_ENV),
    SENTRY_ENVIRONMENT: cleanEnvValue(process.env.SENTRY_ENVIRONMENT),
    VERCEL_ENV: cleanEnvValue(process.env.VERCEL_ENV),
    SUPABASE_SERVICE_ROLE_KEY: cleanEnvValue(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    OPENAI_API_KEY: cleanEnvValue(process.env.OPENAI_API_KEY),
    TELEGRAM_BOT_TOKEN: cleanEnvValue(process.env.TELEGRAM_BOT_TOKEN),
  };
}

export function validateServerEnv(
  env = readServerEnv(),
): ServerEnvValidationResult {
  const issues: ServerEnvValidationIssue[] = [];

  if (
    env.NEXT_PUBLIC_SUPABASE_URL &&
    !isValidHttpUrl(env.NEXT_PUBLIC_SUPABASE_URL)
  ) {
    issues.push({
      key: "NEXT_PUBLIC_SUPABASE_URL",
      message: "Must be a valid http(s) URL.",
    });
  }

  validateSecretLength(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY", 20, issues);
  validateSecretLength(env, "SUPABASE_SERVICE_ROLE_KEY", 20, issues);
  validateSecretLength(env, "OPENAI_API_KEY", 20, issues);
  validateSecretLength(env, "TELEGRAM_BOT_TOKEN", 20, issues);

  if (env.NEXT_PUBLIC_SENTRY_DSN && !isValidHttpUrl(env.NEXT_PUBLIC_SENTRY_DSN)) {
    issues.push({
      key: "NEXT_PUBLIC_SENTRY_DSN",
      message: "Must be a valid http(s) URL when configured.",
    });
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true, env };
}

export function getRequiredServerEnv(
  keys: readonly ServerEnvKey[],
  env = readServerEnv(),
): ServerEnv {
  const missing = keys.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required server env: ${missing.join(", ")}`);
  }

  const validation = validateServerEnv(env);

  if (!validation.ok) {
    throw new Error(
      `Invalid server env: ${validation.issues
        .map((issue) => `${issue.key}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  return env;
}
