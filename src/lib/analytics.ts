import { safeReadStorage, safeWriteStorage, STORAGE_KEYS } from "@/lib/storage";

export const analyticsEventNames = [
  "landing_view",
  "landing_viewed",
  "signup_started",
  "signup_completed",
  "email_confirmed",
  "login_completed",
  "first_task_created",
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

export const betaAnalyticsEventNames = [
  "landing_view",
  "signup_started",
  "signup_completed",
  "email_confirmed",
  "login_completed",
  "first_task_created",
] as const;

export type BetaAnalyticsEventName = (typeof betaAnalyticsEventNames)[number];

export type BetaAnalyticsLocale = "en" | "ua";

export type BetaAnalyticsEventRecord = {
  anonymousId: string;
  authenticated: boolean;
  eventName: BetaAnalyticsEventName;
  locale: BetaAnalyticsLocale;
  sessionId: string;
  timestamp: string;
};

export type TrackBetaEventInput = {
  authenticated: boolean;
  locale?: BetaAnalyticsLocale;
  timestamp?: string;
};

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

const MAX_STORED_BETA_EVENTS = 200;

let betaAnalyticsSessionId: string | null = null;

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

function createLocalIdentifier(prefix: string): string {
  const randomId = globalThis.crypto?.randomUUID?.();

  if (randomId) {
    return `${prefix}_${randomId}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

function isBetaAnalyticsLocale(value: unknown): value is BetaAnalyticsLocale {
  return value === "en" || value === "ua";
}

function isBetaAnalyticsEventName(
  eventName: string,
): eventName is BetaAnalyticsEventName {
  return betaAnalyticsEventNames.includes(eventName as BetaAnalyticsEventName);
}

function isBetaAnalyticsEventRecord(
  value: unknown,
): value is BetaAnalyticsEventRecord {
  return (
    isRecord(value) &&
    typeof value.anonymousId === "string" &&
    typeof value.authenticated === "boolean" &&
    typeof value.eventName === "string" &&
    isBetaAnalyticsEventName(value.eventName) &&
    isBetaAnalyticsLocale(value.locale) &&
    typeof value.sessionId === "string" &&
    typeof value.timestamp === "string"
  );
}

function getStoredLocale(): BetaAnalyticsLocale {
  const locale = safeReadStorage<unknown>(STORAGE_KEYS.language, "en");

  return isBetaAnalyticsLocale(locale) ? locale : "en";
}

function getOrCreateAnonymousId(): string {
  const existingId = safeReadStorage<unknown>(
    STORAGE_KEYS.betaAnalyticsAnonymousId,
    null,
  );

  if (typeof existingId === "string" && existingId.trim().length > 0) {
    return existingId;
  }

  const nextId = createLocalIdentifier("anon");
  safeWriteStorage(STORAGE_KEYS.betaAnalyticsAnonymousId, nextId);

  return nextId;
}

function getOrCreateSessionId(): string {
  if (!betaAnalyticsSessionId) {
    betaAnalyticsSessionId = createLocalIdentifier("session");
  }

  return betaAnalyticsSessionId;
}

function readBetaAnalyticsEvents(): BetaAnalyticsEventRecord[] {
  const storedEvents = safeReadStorage<unknown>(
    STORAGE_KEYS.betaAnalyticsEvents,
    [],
  );

  return Array.isArray(storedEvents)
    ? storedEvents.filter(isBetaAnalyticsEventRecord)
    : [];
}

function writeBetaAnalyticsEvents(events: BetaAnalyticsEventRecord[]): void {
  safeWriteStorage(
    STORAGE_KEYS.betaAnalyticsEvents,
    events.slice(-MAX_STORED_BETA_EVENTS),
  );
}

function hasTrackedBetaEvent(eventName: BetaAnalyticsEventName): boolean {
  return readBetaAnalyticsEvents().some(
    (event) => event.eventName === eventName,
  );
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

export function getStoredBetaAnalyticsEvents(): BetaAnalyticsEventRecord[] {
  try {
    return readBetaAnalyticsEvents();
  } catch {
    return [];
  }
}

export function clearStoredBetaAnalyticsEventsForTests(): void {
  betaAnalyticsSessionId = null;
  safeWriteStorage(STORAGE_KEYS.betaAnalyticsEvents, []);
  safeWriteStorage(STORAGE_KEYS.betaAnalyticsAnonymousId, "");
}

export function trackBetaEvent(
  eventName: BetaAnalyticsEventName,
  input: TrackBetaEventInput,
): void {
  try {
    const event: BetaAnalyticsEventRecord = {
      anonymousId: getOrCreateAnonymousId(),
      authenticated: input.authenticated,
      eventName,
      locale: input.locale ?? getStoredLocale(),
      sessionId: getOrCreateSessionId(),
      timestamp: input.timestamp ?? new Date().toISOString(),
    };

    writeBetaAnalyticsEvents([...readBetaAnalyticsEvents(), event]);
  } catch {
    // Analytics must never interrupt product behavior.
  }
}

export function trackBetaEventOnce(
  eventName: BetaAnalyticsEventName,
  input: TrackBetaEventInput,
): void {
  try {
    if (hasTrackedBetaEvent(eventName)) {
      return;
    }

    trackBetaEvent(eventName, input);
  } catch {
    // Analytics must never interrupt product behavior.
  }
}

export function trackFirstTaskCreated(input: TrackBetaEventInput): void {
  trackBetaEventOnce("first_task_created", input);
}

export function trackEmailConfirmedFromUrl(
  input: TrackBetaEventInput,
): void {
  try {
    if (typeof window === "undefined") {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash,
    );
    const type = searchParams.get("type") ?? hashParams.get("type");

    if (type === "signup") {
      trackBetaEventOnce("email_confirmed", input);
    }
  } catch {
    // Analytics must never interrupt product behavior.
  }
}
