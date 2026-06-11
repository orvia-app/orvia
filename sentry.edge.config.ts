import * as Sentry from "@sentry/nextjs";

import { getEdgeSentryOptions } from "@/lib/monitoring/sentry-server";

const sentryOptions = getEdgeSentryOptions();

if (sentryOptions) {
  Sentry.init(sentryOptions);
}
