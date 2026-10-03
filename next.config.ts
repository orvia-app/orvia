import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import path from "node:path";

const legacyAppRoutes = [
  "ai-chat",
  "automation",
  "cars",
  "finance",
  "inbox",
  "notes",
  "plan",
  "search",
  "settings",
  "tasks",
  "timeline",
  "today",
] as const;

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === "production" ? {
    turbopack: {
      resolveAlias: {
        "@/dev/calendar-visual-qa-fixture": "./src/dev/calendar-visual-qa-fixture.production.ts",
      },
    },
  } : {}),
  async redirects() {
    return legacyAppRoutes.map((route) => ({
      source: `/${route}`,
      destination: `/app/${route}`,
      permanent: false,
    }));
  },
  webpack(config, { dev, webpack }) {
    if (!dev) {
      config.plugins.push(new webpack.IgnorePlugin({
        resourceRegExp: /^@\/dev\/calendar-visual-qa-fixture$/,
      }));
      config.resolve.alias["@/dev/calendar-visual-qa-fixture"] = path.resolve(
        process.cwd(),
        "src/dev/calendar-visual-qa-fixture.production.ts",
      );
    }
    return config;
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
