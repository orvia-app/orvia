import * as Sentry from "@sentry/nextjs";

import { getServerSentryOptions } from "@/lib/monitoring/sentry-server";

const sentryOptions = getServerSentryOptions();

if (sentryOptions) {
  Sentry.init(sentryOptions);
}
