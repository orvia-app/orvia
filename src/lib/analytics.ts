export const analyticsEventNames = [
  "landing_viewed",
  "signup_started",
  "signup_completed",
  "login_completed",
  "quick_capture_created",
  "inbox_opened",
  "capture_processed_to_task",
  "capture_processed_to_note",
  "task_created",
  "task_completed",
  "note_created",
  "today_opened",
  "search_used",
  "timeline_opened",
  "feedback_clicked",
  "error_seen",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export type AnalyticsAuthState = "signed_in" | "signed_out";
export type AnalyticsStorageMode = "account" | "device" | "fallback";
export type AnalyticsResultCountBucket = "0" | "1-5" | "6-20" | "20+";
export type AnalyticsPriority = "low" | "medium" | "high" | "critical";
export type AnalyticsStatus = "todo" | "in-progress" | "done";
export type AnalyticsTheme = "light" | "dark" | "system";

export type AnalyticsMetadata = Partial<{
  activity_count_bucket: AnalyticsResultCountBucket;
  area: string;
  auth_state: AnalyticsAuthState;
  capture_count_bucket: AnalyticsResultCountBucket;
  has_due_date: boolean;
  has_top_priority: boolean;
  locale: "en" | "ua";
  note_type: string;
  operation: string;
  priority: AnalyticsPriority;
  result_count_bucket: AnalyticsResultCountBucket;
  route: string;
  safe_error_code: string;
  source: string;
  status: AnalyticsStatus;
  storage_mode: AnalyticsStorageMode;
  task_count_bucket: AnalyticsResultCountBucket;
  theme: AnalyticsTheme;
}>;

const allowedMetadataKeys = [
  "activity_count_bucket",
  "area",
  "auth_state",
  "capture_count_bucket",
  "has_due_date",
  "has_top_priority",
  "locale",
  "note_type",
  "operation",
  "priority",
  "result_count_bucket",
  "route",
  "safe_error_code",
  "source",
  "status",
  "storage_mode",
  "task_count_bucket",
  "theme",
] as const satisfies readonly (keyof AnalyticsMetadata)[];

export const analyticsMetadataKeys = allowedMetadataKeys;

const stringMetadataKeys = new Set<keyof AnalyticsMetadata>([
  "activity_count_bucket",
  "area",
  "auth_state",
  "capture_count_bucket",
  "locale",
  "note_type",
  "operation",
  "priority",
  "result_count_bucket",
  "route",
  "safe_error_code",
  "source",
  "status",
  "storage_mode",
  "task_count_bucket",
  "theme",
]);

const booleanMetadataKeys = new Set<keyof AnalyticsMetadata>([
  "has_due_date",
  "has_top_priority",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAllowedMetadataKey(key: string): key is keyof AnalyticsMetadata {
  return allowedMetadataKeys.includes(key as keyof AnalyticsMetadata);
}

export function isAnalyticsEventName(
  eventName: string,
): eventName is AnalyticsEventName {
  return analyticsEventNames.includes(eventName as AnalyticsEventName);
}

export function sanitizeAnalyticsMetadata(
  metadata?: unknown,
): AnalyticsMetadata {
  if (!isRecord(metadata)) {
    return {};
  }

  const sanitized: Record<string, string | boolean> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (!isAllowedMetadataKey(key)) {
      continue;
    }

    if (stringMetadataKeys.has(key) && typeof value === "string") {
      sanitized[key] = value;
      continue;
    }

    if (booleanMetadataKeys.has(key) && typeof value === "boolean") {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function trackEvent(
  eventName: AnalyticsEventName,
  metadata?: AnalyticsMetadata,
): void {
  try {
    sanitizeAnalyticsMetadata(metadata);
    void eventName;
  } catch {
    // Analytics must never interrupt product behavior.
  }
}
