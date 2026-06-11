"use client";

import * as Sentry from "@sentry/nextjs";

import { isSentryClientConfigured } from "@/lib/monitoring/sentry-client";

export function setMonitoringUserId(userId: string | null): void {
  if (!isSentryClientConfigured()) {
    return;
  }

  Sentry.setUser(userId ? { id: userId } : null);
}
