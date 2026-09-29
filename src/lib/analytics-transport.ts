import {
  parseBrowserAnalyticsEvent,
  type BrowserAnalyticsEvent,
} from "@/lib/analytics-contract";

export type AnalyticsTransport = (event: BrowserAnalyticsEvent) => Promise<void>;

async function sendEvent(
  event: BrowserAnalyticsEvent,
  accessToken?: string,
): Promise<void> {
  try {
    // Validate and reconstruct even typed input: never serialize arbitrary objects.
    const payload = parseBrowserAnalyticsEvent(event);
    if (!payload) return;

    await fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(payload),
      keepalive: true,
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // No errors/headers/payloads logged or returned; telemetry is best effort.
  }
}

export const sendAnonymousAnalyticsEvent: AnalyticsTransport = (event) =>
  sendEvent(event);

/** Credential-only boundary. No credential enters an analytics event object. */
export function createAuthenticatedAnalyticsTransport(
  accessToken: string | undefined,
): AnalyticsTransport | undefined {
  if (!accessToken) return undefined;
  return (event) => sendEvent(event, accessToken);
}
