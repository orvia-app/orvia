import type {
  SupabaseActivityEntityType,
  SupabaseActivityType,
} from "@/lib/supabase";

export type Activity = {
  id: string;
  type: SupabaseActivityType;
  entityType: SupabaseActivityEntityType;
  entityId?: string;
  title: string;
  description?: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
};

export type CreateActivityApiInput = {
  type: SupabaseActivityType;
  entityType: SupabaseActivityEntityType;
  entityId?: string | null;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
};

export type ActivitiesApiRequestOptions = {
  accessToken?: string;
};

type ApiActivityRow = {
  id?: unknown;
  type?: unknown;
  entity_type?: unknown;
  entity_id?: unknown;
  title?: unknown;
  description?: unknown;
  metadata?: unknown;
  occurred_at?: unknown;
  created_at?: unknown;
};

type ListActivitiesApiResponse = {
  ok?: unknown;
  activities?: unknown;
  error?: unknown;
};

type CreateActivityApiResponse = {
  ok?: unknown;
  activity?: unknown;
  error?: unknown;
};

const ACTIVITY_TYPES = [
  "task_created",
  "task_updated",
  "task_deleted",
  "note_created",
  "note_updated",
  "note_deleted",
  "inbox_processed",
  "quick_capture_created",
  "local_import_completed",
  "system_event",
] as const satisfies readonly SupabaseActivityType[];
const ACTIVITY_ENTITY_TYPES = [
  "task",
  "note",
  "inbox",
  "quick_capture",
  "sync",
  "system",
] as const satisfies readonly SupabaseActivityEntityType[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function isActivityType(value: unknown): value is SupabaseActivityType {
  return (
    typeof value === "string" &&
    ACTIVITY_TYPES.includes(value as SupabaseActivityType)
  );
}

function isActivityEntityType(
  value: unknown,
): value is SupabaseActivityEntityType {
  return (
    typeof value === "string" &&
    ACTIVITY_ENTITY_TYPES.includes(value as SupabaseActivityEntityType)
  );
}

function getAuthorizationHeaders(
  options: ActivitiesApiRequestOptions = {},
): HeadersInit | undefined {
  const accessToken = options.accessToken?.trim();

  if (!accessToken) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function mapApiActivityToActivity(row: ApiActivityRow): Activity | null {
  const id = optionalString(row.id);
  const title = optionalString(row.title);
  const occurredAt = optionalString(row.occurred_at);
  const createdAt = optionalString(row.created_at);

  if (
    !id ||
    !title ||
    !occurredAt ||
    !createdAt ||
    !isActivityType(row.type) ||
    !isActivityEntityType(row.entity_type)
  ) {
    return null;
  }

  return {
    id,
    type: row.type,
    entityType: row.entity_type,
    entityId: optionalString(row.entity_id),
    title,
    description: optionalString(row.description),
    metadata: isRecord(row.metadata) ? row.metadata : {},
    occurredAt,
    createdAt,
  };
}

function parseListActivitiesResponse(value: unknown): Activity[] | null {
  if (!isRecord(value)) {
    return null;
  }

  const response: ListActivitiesApiResponse = value;

  if (response.ok !== true || !Array.isArray(response.activities)) {
    return null;
  }

  const mappedActivities = response.activities.map((activity) =>
    isRecord(activity) ? mapApiActivityToActivity(activity) : null,
  );

  if (mappedActivities.some((activity) => activity === null)) {
    return null;
  }

  return mappedActivities.filter((activity) => activity !== null);
}

function parseCreateActivityResponse(value: unknown): Activity | null {
  if (!isRecord(value)) {
    return null;
  }

  const response: CreateActivityApiResponse = value;

  if (response.ok !== true || !isRecord(response.activity)) {
    return null;
  }

  return mapApiActivityToActivity(response.activity);
}

export async function fetchActivitiesViaApi(
  options: ActivitiesApiRequestOptions = {},
): Promise<Activity[]> {
  const response = await fetch("/api/activities", {
    method: "GET",
    cache: "no-store",
    headers: getAuthorizationHeaders(options),
  });

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("Activities response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Activities request failed.");
  }

  const activities = parseListActivitiesResponse(responseBody);

  if (!activities) {
    throw new Error("Activities response shape was invalid.");
  }

  return activities;
}

export async function createActivityViaApi(
  input: CreateActivityApiInput,
  options: ActivitiesApiRequestOptions = {},
): Promise<Activity> {
  const response = await fetch("/api/activities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthorizationHeaders(options),
    },
    body: JSON.stringify(input),
  });

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("Activity create response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Activity create request failed.");
  }

  const activity = parseCreateActivityResponse(responseBody);

  if (!activity) {
    throw new Error("Activity create response shape was invalid.");
  }

  return activity;
}
