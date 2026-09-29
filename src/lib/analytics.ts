import {
  sendAnonymousAnalyticsEvent,
  type AnalyticsTransport,
} from "@/lib/analytics-transport";
import { betaAnalyticsEventNames, isAnalyticsUuid, type BetaAnalyticsEventName } from "@/lib/analytics-contract";
export { betaAnalyticsEventNames } from "@/lib/analytics-contract";
export type { BetaAnalyticsEventName } from "@/lib/analytics-contract";

import { safeReadStorage, safeWriteStorage, STORAGE_KEYS } from "@/lib/storage";

export const analyticsEventNames = [
  "landing_view",
  "landing_viewed",
  "signup_started",
  "signup_completed",
  "email_confirmed",
  "login_completed",
  "first_task_created",
  "feedback_submitted",
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
  emailConfirmedAt?: string | null;
  userId?: string;
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

let fallbackSession: { id: string; expiresAt: number } | null = null;
let anonymousFallbackId: string | null = null;
const observedConfirmedAccounts = new Set<string>();

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

function createLocalIdentifier(): string {
  // No fingerprint or weak random fallback. Unsupported browsers simply drop analytics.
  return globalThis.crypto.randomUUID();
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
    Object.keys(value).length === 6 &&
    isAnalyticsUuid(value.anonymousId) &&
    typeof value.authenticated === "boolean" &&
    typeof value.eventName === "string" &&
    isBetaAnalyticsEventName(value.eventName) &&
    isBetaAnalyticsLocale(value.locale) &&
    isAnalyticsUuid(value.sessionId) &&
    typeof value.timestamp === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.timestamp) &&
    Number.isFinite(Date.parse(value.timestamp))
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

  if (isAnalyticsUuid(existingId)) {
    anonymousFallbackId = null;
    return existingId;
  }

  const nextId = anonymousFallbackId ?? createLocalIdentifier();
  safeWriteStorage(STORAGE_KEYS.betaAnalyticsAnonymousId, nextId);
  anonymousFallbackId = safeReadStorage(STORAGE_KEYS.betaAnalyticsAnonymousId, null) === nextId
    ? null
    : nextId;

  return nextId;
}

function getOrCreateSessionId(): string {
  const saved = safeReadStorage<unknown>(STORAGE_KEYS.betaAnalyticsSession, null);
  const now = Date.now();
  const candidate = saved ?? fallbackSession;
  const valid = isRecord(candidate) && isAnalyticsUuid(candidate.id) &&
    typeof candidate.expiresAt === "number" && candidate.expiresAt > now &&
    candidate.expiresAt <= now + 30 * 60_000;
  const next = {
    id: valid ? candidate.id as string : createLocalIdentifier(),
    expiresAt: now + 30 * 60_000,
  };
  safeWriteStorage(STORAGE_KEYS.betaAnalyticsSession, next);
  fallbackSession = safeReadStorage(STORAGE_KEYS.betaAnalyticsSession, null) === null
    ? next
    : null;
  return next.id;
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
  const sessionId = getOrCreateSessionId();
  return readBetaAnalyticsEvents().some(
    (event) => event.eventName === eventName && event.sessionId === sessionId,
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
  fallbackSession = null;
  anonymousFallbackId = null;
  observedConfirmedAccounts.clear();
  safeWriteStorage(STORAGE_KEYS.betaAnalyticsSession, null);
  safeWriteStorage(STORAGE_KEYS.betaAnalyticsEvents, []);
  safeWriteStorage(STORAGE_KEYS.betaAnalyticsAnonymousId, "");
}

export function trackBetaEvent(
  eventName: BetaAnalyticsEventName,
  input: TrackBetaEventInput,
  transport?: AnalyticsTransport,
): void {
  try {
    if (typeof window === "undefined" || !isBetaAnalyticsEventName(eventName)) return;
    // Authoritative success events are emitted by database triggers, never clients.
    if (eventName === "first_task_created" || eventName === "feedback_submitted") return;
    if ((eventName === "login_completed" || eventName === "email_confirmed") && !transport) return;
    const event: BetaAnalyticsEventRecord = {
      anonymousId: getOrCreateAnonymousId(),
      authenticated: input.authenticated,
      eventName,
      locale: input.locale ?? getStoredLocale(),
      sessionId: getOrCreateSessionId(),
      timestamp: input.timestamp ?? new Date().toISOString(),
    };

    if (!isBetaAnalyticsEventRecord(event)) return;
    writeBetaAnalyticsEvents([...readBetaAnalyticsEvents(), event]);
    // No old-buffer uploads, retries or credentials in the event object.
    void (transport ?? sendAnonymousAnalyticsEvent)({
      id: createLocalIdentifier(),
      event_name: eventName,
      anonymous_id: event.anonymousId,
      session_id: event.sessionId,
      locale: event.locale,
    }).catch(() => { /* Telemetry must not interrupt the product. */ });
  } catch {
    // Analytics must never interrupt product behavior.
  }
}

export function trackBetaEventOnce(
  eventName: BetaAnalyticsEventName,
  input: TrackBetaEventInput,
  transport?: AnalyticsTransport,
): void {
  try {
    if (hasTrackedBetaEvent(eventName)) {
      return;
    }

    trackBetaEvent(eventName, input, transport);
  } catch {
    // Analytics must never interrupt product behavior.
  }
}

/** Confirmation is observed from an authenticated Supabase user, never URL text. */
export function trackEmailConfirmed(
  input: TrackBetaEventInput,
  transport: AnalyticsTransport | undefined,
): void {
  if (!input.authenticated || !transport || !input.emailConfirmedAt) return;
  if (input.userId && observedConfirmedAccounts.has(input.userId)) return;
  if (input.userId) {
    if (observedConfirmedAccounts.size >= 32) observedConfirmedAccounts.clear();
    observedConfirmedAccounts.add(input.userId);
  }
  // The database deduplicates per account across sessions and devices.
  trackBetaEvent("email_confirmed", input, transport);
}
