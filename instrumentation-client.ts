import * as Sentry from "@sentry/nextjs";

import { getClientSentryOptions } from "@/lib/monitoring/sentry-client";

const sentryOptions = getClientSentryOptions();

if (sentryOptions) {
  Sentry.init(sentryOptions);
}
