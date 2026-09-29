/** The only analytics schema accepted over the network. No metadata escape hatch. */
export const betaAnalyticsEventNames = [
  "landing_view", "signup_started", "signup_completed", "email_confirmed",
  "login_completed", "first_task_created", "feedback_submitted",
] as const;
export type BetaAnalyticsEventName = (typeof betaAnalyticsEventNames)[number];
export type BrowserAnalyticsEvent = {
  id: string;
  event_name: BetaAnalyticsEventName;
  anonymous_id: string;
  session_id: string;
  locale: "en" | "ua";
};
export function isAnalyticsUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
export function parseBrowserAnalyticsEvent(value: unknown): BrowserAnalyticsEvent | null {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return null;
  const row = value as Record<string, unknown>;
  const keys = ["id", "event_name", "anonymous_id", "session_id", "locale"];
  if (Object.keys(row).length !== keys.length || Object.keys(row).some((key) => !keys.includes(key)))
    return null;
  if (!isAnalyticsUuid(row.id) || !isAnalyticsUuid(row.anonymous_id) || !isAnalyticsUuid(row.session_id))
    return null;
  if (row.locale !== "en" && row.locale !== "ua")
    return null;
  const eventName = row.event_name;
  if (eventName !== "landing_view" && eventName !== "signup_started" && eventName !== "signup_completed" && eventName !== "email_confirmed" && eventName !== "login_completed")
    return null;
  return { id: row.id, event_name: eventName, anonymous_id: row.anonymous_id, session_id: row.session_id, locale: row.locale };
}
export const analyticsConversionNames = ["signup", "activation", "feedback"] as const;
export type AnalyticsReport = {
  counts: Record<BetaAnalyticsEventName, number>;
  daily: {
    date: string;
    count: number;
  }[];
  conversions: Record<(typeof analyticsConversionNames)[number], {
    numerator: number;
    denominator: number;
  }>;
};
export function conversionPercent(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Math.round(numerator / denominator * 1000) / 10 : null;
}
function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
export function parseAnalyticsReport(value: unknown): AnalyticsReport | null {
  if (!value || typeof value !== "object")
    return null;
  const report = value as Record<string, unknown>;
  if (!report.counts || typeof report.counts !== "object" || !report.conversions || typeof report.conversions !== "object" || !Array.isArray(report.daily))
    return null;
  const counts = report.counts as Record<string, unknown>;
  const conversions = report.conversions as Record<string, unknown>;
  if (!betaAnalyticsEventNames.every((name) => isCount(counts[name])))
    return null;
  if (!analyticsConversionNames.every((name) => {
    const item = conversions[name];
    if (!item || typeof item !== "object")
      return false;
    const pair = item as Record<string, unknown>;
    return isCount(pair.numerator) && isCount(pair.denominator) && pair.numerator <= pair.denominator;
  }))
    return null;
  if (report.daily.length > 30 || !report.daily.every((item: unknown) => {
    if (!item || typeof item !== "object")
      return false;
    const day = item as Record<string, unknown>;
    return typeof day.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day.date) && isCount(day.count);
  }))
    return null;
  // Construct the response rather than forwarding database fields to the browser.
  return {
    counts: Object.fromEntries(betaAnalyticsEventNames.map((name) => [name, counts[name]])) as AnalyticsReport["counts"],
    conversions: Object.fromEntries(analyticsConversionNames.map((name) => {
      const pair = conversions[name] as {
        numerator: number;
        denominator: number;
      };
      return [name, { numerator: pair.numerator, denominator: pair.denominator }];
    })) as AnalyticsReport["conversions"],
    daily: report.daily.map((item: {
      date: string;
      count: number;
    }) => ({ date: item.date, count: item.count })),
  };
}
