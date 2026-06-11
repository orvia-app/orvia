const REDACTED = "[redacted]";
const REMOVED = "[removed]";
const MAX_DEPTH = 8;

const SAFE_METADATA_KEYS = new Set([
  "activity_type",
  "auth_state",
  "entity_type",
  "environment",
  "locale",
  "method",
  "operation",
  "release",
  "route",
  "safe_error_code",
  "source",
  "status",
  "status_code",
  "storage_mode",
  "supabase_error_code",
  "table",
  "theme",
]);

const SAFE_TOP_LEVEL_CONTEXT_KEYS = new Set([
  "app",
  "browser",
  "device",
  "os",
  "react",
  "runtime",
  "trace",
]);

const SENSITIVE_KEY_PATTERNS = [
  /authorization/i,
  /bearer/i,
  /cookie/i,
  /password/i,
  /token/i,
  /session/i,
  /^email$/i,
  /userEmail/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /supabase.*session/i,
  /^body$/i,
  /requestBody/i,
  /responseBody/i,
  /rawRequest/i,
  /rawResponse/i,
  /rawError/i,
  /searchableText/i,
  /search[_-]?query/i,
  /^query$/i,
  /task.*title/i,
  /task.*description/i,
  /note.*title/i,
  /note.*content/i,
  /capture.*content/i,
  /capture.*text/i,
  /^content$/i,
  /^description$/i,
  /^text$/i,
  /^title$/i,
];

const SENSITIVE_TEXT_PATTERNS = [
  /authorization/i,
  /bearer\s+[a-z0-9._~+/=-]+/i,
  /cookie/i,
  /password/i,
  /refresh[_-]?token/i,
  /access[_-]?token/i,
  /session/i,
  /supabase/i,
  /search query/i,
  /search_query/i,
  /task title/i,
  /task description/i,
  /note title/i,
  /note content/i,
  /capture content/i,
  /request body/i,
  /response body/i,
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
];

type UnknownRecord = Record<string, unknown>;

export type MonitoringEventLike = {
  breadcrumbs?: unknown;
  contexts?: unknown;
  extra?: unknown;
  message?: unknown;
  request?: unknown;
  tags?: unknown;
  user?: unknown;
  [key: string]: unknown;
};

export type MonitoringBreadcrumbLike = {
  category?: unknown;
  data?: unknown;
  message?: unknown;
  type?: unknown;
  [key: string]: unknown;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function hasSensitiveText(value: string): boolean {
  return SENSITIVE_TEXT_PATTERNS.some((pattern) => pattern.test(value));
}

function redactString(value: string): string {
  if (!hasSensitiveText(value)) {
    return value;
  }

  return REDACTED;
}

function sanitizePrimitive(value: unknown): unknown {
  if (typeof value === "string") {
    return redactString(value);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  return undefined;
}

function sanitizeMetadata(value: unknown): UnknownRecord | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const sanitized: UnknownRecord = {};

  for (const [key, metadataValue] of Object.entries(value)) {
    if (!SAFE_METADATA_KEYS.has(key)) {
      continue;
    }

    const primitive = sanitizePrimitive(metadataValue);

    if (primitive !== undefined) {
      sanitized[key] = primitive;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function sanitizeUser(value: unknown): UnknownRecord | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = value.id;

  if (typeof id !== "string" || id.trim().length === 0) {
    return undefined;
  }

  return { id: id.trim() };
}

function sanitizeHeaders(value: unknown): UnknownRecord | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const sanitized: UnknownRecord = {};

  for (const [key, headerValue] of Object.entries(value)) {
    if (hasSensitiveKey(key)) {
      sanitized[key] = REDACTED;
      continue;
    }

    const primitive = sanitizePrimitive(headerValue);

    if (primitive !== undefined) {
      sanitized[key] = primitive;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function sanitizeRequest(value: unknown): UnknownRecord | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const sanitized: UnknownRecord = {};

  for (const [key, requestValue] of Object.entries(value)) {
    if (key === "headers") {
      const headers = sanitizeHeaders(requestValue);

      if (headers) {
        sanitized.headers = headers;
      }

      continue;
    }

    if (key === "method" || key === "url" || key === "route") {
      const primitive = sanitizePrimitive(requestValue);

      if (primitive !== undefined) {
        sanitized[key] = primitive;
      }

      continue;
    }

    if (hasSensitiveKey(key)) {
      sanitized[key] = REMOVED;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function sanitizeContexts(value: unknown): UnknownRecord | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const sanitized: UnknownRecord = {};

  for (const [key, contextValue] of Object.entries(value)) {
    if (!SAFE_TOP_LEVEL_CONTEXT_KEYS.has(key)) {
      continue;
    }

    const nextValue = sanitizeValue(contextValue, 0);

    if (nextValue !== undefined) {
      sanitized[key] = nextValue;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function sanitizeException(value: unknown): unknown {
  if (!isRecord(value)) {
    return undefined;
  }

  const values = Array.isArray(value.values)
    ? value.values
        .map((exceptionValue) => {
          if (!isRecord(exceptionValue)) {
            return undefined;
          }

          const sanitized: UnknownRecord = {};

          if (typeof exceptionValue.type === "string") {
            sanitized.type = redactString(exceptionValue.type);
          }

          if (exceptionValue.value !== undefined) {
            sanitized.value = REDACTED;
          }

          const stacktrace = sanitizeValue(exceptionValue.stacktrace, 0);

          if (stacktrace !== undefined) {
            sanitized.stacktrace = stacktrace;
          }

          return sanitized;
        })
        .filter((exceptionValue): exceptionValue is UnknownRecord =>
          Boolean(exceptionValue),
        )
    : undefined;

  return values && values.length > 0 ? { values } : undefined;
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) {
    return REMOVED;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeValue(item, depth + 1))
      .filter((item) => item !== undefined);
  }

  if (!isRecord(value)) {
    return sanitizePrimitive(value);
  }

  const sanitized: UnknownRecord = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (key === "metadata") {
      const metadata = sanitizeMetadata(nestedValue);

      if (metadata) {
        sanitized.metadata = metadata;
      }

      continue;
    }

    if (hasSensitiveKey(key)) {
      sanitized[key] = REMOVED;
      continue;
    }

    const nextValue = sanitizeValue(nestedValue, depth + 1);

    if (nextValue !== undefined) {
      sanitized[key] = nextValue;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function sanitizeSentryEvent(
  event: MonitoringEventLike | null | undefined,
): MonitoringEventLike | null {
  if (!event || !isRecord(event)) {
    return null;
  }

  const sanitized: MonitoringEventLike = {};

  for (const [key, value] of Object.entries(event)) {
    if (key === "request") {
      const request = sanitizeRequest(value);

      if (request) {
        sanitized.request = request;
      }

      continue;
    }

    if (key === "user") {
      const user = sanitizeUser(value);

      if (user) {
        sanitized.user = user;
      }

      continue;
    }

    if (key === "extra") {
      const extra = sanitizeValue(value, 0);

      if (extra !== undefined) {
        sanitized.extra = extra;
      }

      continue;
    }

    if (key === "contexts") {
      const contexts = sanitizeContexts(value);

      if (contexts) {
        sanitized.contexts = contexts;
      }

      continue;
    }

    if (key === "exception") {
      const exception = sanitizeException(value);

      if (exception !== undefined) {
        sanitized.exception = exception;
      }

      continue;
    }

    if (key === "breadcrumbs") {
      if (Array.isArray(value)) {
        const breadcrumbs = value
          .map((breadcrumb) => sanitizeSentryBreadcrumb(breadcrumb))
          .filter((breadcrumb): breadcrumb is MonitoringBreadcrumbLike =>
            Boolean(breadcrumb),
          );

        if (breadcrumbs.length > 0) {
          sanitized.breadcrumbs = breadcrumbs;
        }
      }

      continue;
    }

    if (key === "metadata") {
      const metadata = sanitizeMetadata(value);

      if (metadata) {
        sanitized.metadata = metadata;
      }

      continue;
    }

    if (hasSensitiveKey(key)) {
      sanitized[key] = REMOVED;
      continue;
    }

    const nextValue = sanitizeValue(value, 0);

    if (nextValue !== undefined) {
      sanitized[key] = nextValue;
    }
  }

  return sanitized;
}

export function sanitizeSentryBreadcrumb(
  breadcrumb: unknown,
): MonitoringBreadcrumbLike | null {
  if (!isRecord(breadcrumb)) {
    return null;
  }

  if (breadcrumb.category === "console") {
    return null;
  }

  const serialized = JSON.stringify(breadcrumb);

  if (hasSensitiveText(serialized)) {
    return null;
  }

  const sanitized = sanitizeValue(breadcrumb, 0);

  return isRecord(sanitized) ? sanitized : null;
}
