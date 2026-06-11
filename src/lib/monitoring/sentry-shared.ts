import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";

import {
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
  type MonitoringBreadcrumbLike,
  type MonitoringEventLike,
} from "@/lib/monitoring/sentry-redaction";

const DEFAULT_ENVIRONMENT = "development";

export function getMonitoringEnvironment(
  configuredEnvironment: string | undefined,
  fallbackEnvironment: string | undefined,
): string {
  return configuredEnvironment ?? fallbackEnvironment ?? DEFAULT_ENVIRONMENT;
}

export function beforeSend(
  event: ErrorEvent,
): ErrorEvent | null {
  return sanitizeSentryEvent(
    event as unknown as MonitoringEventLike,
  ) as ErrorEvent | null;
}

export function beforeBreadcrumb(
  breadcrumb: Breadcrumb,
): Breadcrumb | null {
  return sanitizeSentryBreadcrumb(
    breadcrumb as MonitoringBreadcrumbLike,
  ) as Breadcrumb | null;
}

export function getCommonSentryOptions() {
  return {
    beforeBreadcrumb,
    beforeSend,
    maxBreadcrumbs: 20,
    profilesSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,
    sendDefaultPii: false,
    tracesSampleRate: 0,
  } as const;
}
