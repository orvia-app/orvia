import type { EdgeOptions, NodeOptions } from "@sentry/nextjs";

import { readServerEnv } from "@/env/server";
import {
  getCommonSentryOptions,
  getMonitoringEnvironment,
} from "@/lib/monitoring/sentry-shared";

function getServerSentryEnvironment(): string {
  const env = readServerEnv();

  return getMonitoringEnvironment(
    env.SENTRY_ENVIRONMENT ?? env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    env.VERCEL_ENV ?? env.NEXT_PUBLIC_VERCEL_ENV,
  );
}

export function getServerSentryOptions(): NodeOptions | null {
  const env = readServerEnv();

  if (!env.NEXT_PUBLIC_SENTRY_DSN) {
    return null;
  }

  return {
    ...getCommonSentryOptions(),
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: getServerSentryEnvironment(),
  };
}

export function getEdgeSentryOptions(): EdgeOptions | null {
  const env = readServerEnv();

  if (!env.NEXT_PUBLIC_SENTRY_DSN) {
    return null;
  }

  return {
    ...getCommonSentryOptions(),
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: getServerSentryEnvironment(),
  };
}
