import type { BrowserOptions } from "@sentry/nextjs";

import { readClientEnv } from "@/env/client";
import {
  getCommonSentryOptions,
  getMonitoringEnvironment,
} from "@/lib/monitoring/sentry-shared";

export function getClientSentryOptions(): BrowserOptions | null {
  const env = readClientEnv();

  if (!env.NEXT_PUBLIC_SENTRY_DSN) {
    return null;
  }

  return {
    ...getCommonSentryOptions(),
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: getMonitoringEnvironment(
      env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
      env.NEXT_PUBLIC_VERCEL_ENV,
    ),
  };
}

export function isSentryClientConfigured(): boolean {
  return Boolean(readClientEnv().NEXT_PUBLIC_SENTRY_DSN);
}
