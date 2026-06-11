import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const legacyAppRoutes = [
  "ai-chat",
  "automation",
  "cars",
  "finance",
  "inbox",
  "notes",
  "search",
  "settings",
  "tasks",
  "timeline",
  "today",
] as const;

const nextConfig: NextConfig = {
  async redirects() {
    return legacyAppRoutes.map((route) => ({
      source: `/${route}`,
      destination: `/app/${route}`,
      permanent: false,
    }));
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: {
    disable: true,
  },
  suppressOnRouterTransitionStartWarning: true,
  telemetry: false,
  webpack: {
    treeshake: {
      excludeReplayIframe: true,
      excludeReplayShadowDOM: true,
      removeDebugLogging: true,
      removeTracing: true,
    },
  },
});
