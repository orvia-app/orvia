import { parseAnalyticsReport, type AnalyticsReport } from "@/lib/analytics-contract";
export class AdminAnalyticsApiError extends Error {
  constructor(public readonly status: number) { super("Analytics unavailable"); }
}
export async function fetchAdminAnalytics(accessToken: string, days: 7 | 30, signal: AbortSignal): Promise<AnalyticsReport> {
  const response = await fetch(`/api/admin/analytics?days=${days}`, {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", signal,
  });
  if (!response.ok)
    throw new AdminAnalyticsApiError(response.status);
  const body: unknown = await response.json();
  const report = body && typeof body === "object" && "report" in body ? parseAnalyticsReport(body.report) : null;
  if (!report)
    throw new AdminAnalyticsApiError(502);
  return report;
}
