import type { NextConfig } from "next";

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

export default nextConfig;
