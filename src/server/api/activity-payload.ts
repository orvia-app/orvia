import type {
  SupabaseActivityEntityType,
  SupabaseActivityInsert,
  SupabaseActivityType,
} from "@/lib/supabase";

const ACTIVITY_TYPES = [
  "task_created",
  "task_updated",
  "task_completed",
  "task_deleted",
  "note_created",
  "note_updated",
  "note_deleted",
  "inbox_processed",
  "quick_capture_created",
  "local_import_completed",
  "system_event",
] as const satisfies readonly SupabaseActivityType[];

const TASK_STATUSES = ["todo", "in-progress", "done"] as const;
const TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const;
const NOTE_TYPES = ["note", "idea", "book", "course", "link"] as const;
const ACTIVITY_SOURCES = [
  "api",
  "import",
  "inbox",
  "local",
  "manual",
  "quick_capture",
  "sync",
  "system",
  "telegram",
] as const;
const INBOX_OUTCOMES = ["task", "note", "archived"] as const;
const STORAGE_MODES = ["account", "cloud", "fallback", "local"] as const;
const SAFE_METADATA_KEYS = [
  "errorCount",
  "has_due_date",
  "importedNotes",
  "importedTasks",
  "nextStatus",
  "note_type",
  "operation",
  "outcome",
  "previousStatus",
  "priority",
  "safe_error_code",
  "skippedNotes",
  "skippedTasks",
  "source",
  "status",
  "storage_mode",
] as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_TOKEN_PATTERN = /^[a-z0-9_-]{1,80}$/i;
const MAX_SAFE_COUNT = 100000;

type SafeMetadataKey = (typeof SAFE_METADATA_KEYS)[number];

type CreateActivityBody = {
  type?: unknown;
  entityId?: unknown;
  metadata?: unknown;
  occurredAt?: unknown;
};

export type ParsedActivityPayload =
  | { ok: true; payload: SupabaseActivityInsert }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function includesString<const T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

function isActivityType(value: unknown): value is SupabaseActivityType {
  return includesString(ACTIVITY_TYPES, value);
}

function parseEntityId(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const entityId = value.trim();

  return UUID_PATTERN.test(entityId) ? entityId : undefined;
}

function parseOccurredAt(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return new Date(timestamp).toISOString();
}

function parseSafeCount(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return undefined;
  }

  return value >= 0 && value <= MAX_SAFE_COUNT ? value : undefined;
}

function parseSafeToken(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const token = value.trim();

  return SAFE_TOKEN_PATTERN.test(token) ? token : undefined;
}

function parseSafeMetadataValue(
  key: SafeMetadataKey,
  value: unknown,
): boolean | number | string | undefined {
  switch (key) {
    case "has_due_date":
      return typeof value === "boolean" ? value : undefined;

    case "errorCount":
    case "importedNotes":
    case "importedTasks":
    case "skippedNotes":
    case "skippedTasks":
      return parseSafeCount(value);

    case "nextStatus":
    case "previousStatus":
    case "status":
      return includesString(TASK_STATUSES, value) ? value : undefined;

    case "priority":
      return includesString(TASK_PRIORITIES, value) ? value : undefined;

    case "note_type":
      return includesString(NOTE_TYPES, value) ? value : undefined;

    case "outcome":
      return includesString(INBOX_OUTCOMES, value) ? value : undefined;

    case "source":
      return includesString(ACTIVITY_SOURCES, value) ? value : undefined;

    case "storage_mode":
      return includesString(STORAGE_MODES, value) ? value : undefined;

    case "operation":
    case "safe_error_code":
      return parseSafeToken(value);
  }
}

export function sanitizeActivityMetadata(
  value: unknown,
): Record<string, boolean | number | string> | undefined {
  if (value === undefined) {
    return {};
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const sanitized: Record<string, boolean | number | string> = {};

  for (const key of SAFE_METADATA_KEYS) {
    const parsedValue = parseSafeMetadataValue(key, value[key]);

    if (parsedValue !== undefined) {
      sanitized[key] = parsedValue;
    }
  }

  return sanitized;
}

function getActivityEntityType(
  type: SupabaseActivityType,
): SupabaseActivityEntityType {
  switch (type) {
    case "task_created":
    case "task_updated":
    case "task_completed":
    case "task_deleted":
      return "task";

    case "note_created":
    case "note_updated":
    case "note_deleted":
      return "note";

    case "inbox_processed":
      return "inbox";

    case "quick_capture_created":
      return "quick_capture";

    case "local_import_completed":
      return "sync";

    case "system_event":
      return "system";
  }
}

function getActivityText(
  type: SupabaseActivityType,
  metadata: Record<string, unknown>,
): { title: string; description: string } {
  switch (type) {
    case "task_created":
      return { title: "Task created", description: "Created a task" };

    case "task_updated":
      return { title: "Task updated", description: "Updated a task" };

    case "task_completed":
      return { title: "Task completed", description: "Completed a task" };

    case "task_deleted":
      return { title: "Task deleted", description: "Deleted a task" };

    case "note_created":
      return { title: "Note created", description: "Created a note" };

    case "note_updated":
      return { title: "Note updated", description: "Updated a note" };

    case "note_deleted":
      return { title: "Note deleted", description: "Deleted a note" };

    case "inbox_processed":
      return {
        title: "Inbox item processed",
        description:
          metadata.outcome === "archived"
            ? "Archived an inbox item"
            : "Processed an inbox item",
      };

    case "quick_capture_created":
      return {
        title: "Inbox item captured",
        description: "Captured an inbox item",
      };

    case "local_import_completed":
      return {
        title: "Imported local data to cloud",
        description: "Completed a local-to-cloud import for tasks and notes.",
      };

    case "system_event":
      return {
        title: "System event",
        description: "Recorded a system event",
      };
  }
}

export function parseCreateActivityPayload(
  body: CreateActivityBody,
): ParsedActivityPayload {
  if (!isActivityType(body.type)) {
    return {
      ok: false,
      error: "Type must be a supported activity type.",
    };
  }

  const entityId = parseEntityId(body.entityId);

  if (entityId === undefined && body.entityId !== undefined) {
    return {
      ok: false,
      error: "Entity id must be a valid UUID, null, or empty.",
    };
  }

  const metadata = sanitizeActivityMetadata(body.metadata);

  if (metadata === undefined) {
    return {
      ok: false,
      error: "Metadata must be a JSON object.",
    };
  }

  const occurredAt = parseOccurredAt(body.occurredAt);

  if (occurredAt === undefined && body.occurredAt !== undefined) {
    return {
      ok: false,
      error: "Occurred at must be a valid ISO/date string.",
    };
  }

  const activityText = getActivityText(body.type, metadata);

  return {
    ok: true,
    payload: {
      type: body.type,
      entity_type: getActivityEntityType(body.type),
      entity_id: entityId ?? null,
      title: activityText.title,
      description: activityText.description,
      metadata,
      occurred_at: occurredAt,
    },
  };
}
