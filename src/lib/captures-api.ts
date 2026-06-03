import type {
  SupabaseCaptureSource,
  SupabaseCaptureStatus,
} from "@/lib/supabase";
import {
  createQuickCapture,
  getQuickCaptures,
  saveQuickCaptures,
  type QuickCapture,
} from "@/lib/quick-captures";

export type Capture = {
  id: string;
  content: string;
  source: SupabaseCaptureSource;
  status: SupabaseCaptureStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CreateCaptureApiInput = {
  content: string;
  source?: SupabaseCaptureSource;
  status?: SupabaseCaptureStatus;
  metadata?: Record<string, unknown>;
};

export type UpdateCaptureApiInput = {
  status: SupabaseCaptureStatus;
};

export type CapturesApiRequestOptions = {
  accessToken?: string;
};

export type PrimaryCaptureSource = "cloud" | "local-fallback" | "local-only";

export type CaptureSourceById = Record<string, PrimaryCaptureSource>;

export type LoadCapturesResult = {
  captureSources: CaptureSourceById;
  captures: QuickCapture[];
  source: PrimaryCaptureSource;
};

export type CreateCaptureFromPrimarySourceResult = {
  capture: QuickCapture;
  source: PrimaryCaptureSource;
};

type ApiCaptureRow = {
  id?: unknown;
  content?: unknown;
  source?: unknown;
  status?: unknown;
  metadata?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

type ListCapturesApiResponse = {
  ok?: unknown;
  captures?: unknown;
  error?: unknown;
};

type CreateCaptureApiResponse = {
  ok?: unknown;
  capture?: unknown;
  error?: unknown;
};

type UpdateCaptureApiResponse = CreateCaptureApiResponse;

const CAPTURE_SOURCES = [
  "quick_capture",
  "manual",
  "import",
  "telegram",
  "system",
] as const satisfies readonly SupabaseCaptureSource[];
const CAPTURE_STATUSES = [
  "inbox",
  "processed",
  "archived",
] as const satisfies readonly SupabaseCaptureStatus[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function isCaptureSource(value: unknown): value is SupabaseCaptureSource {
  return (
    typeof value === "string" &&
    CAPTURE_SOURCES.includes(value as SupabaseCaptureSource)
  );
}

function isCaptureStatus(value: unknown): value is SupabaseCaptureStatus {
  return (
    typeof value === "string" &&
    CAPTURE_STATUSES.includes(value as SupabaseCaptureStatus)
  );
}

function getAuthorizationHeaders(
  options: CapturesApiRequestOptions = {},
): HeadersInit | undefined {
  const accessToken = options.accessToken?.trim();

  if (!accessToken) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function createCaptureSourceMap(
  captures: readonly QuickCapture[],
  source: PrimaryCaptureSource,
): CaptureSourceById {
  const sources: CaptureSourceById = {};

  for (const capture of captures) {
    sources[capture.id] = source;
  }

  return sources;
}

function createMergedCaptureSourceMap(
  apiCaptures: readonly QuickCapture[],
  mergedCaptures: readonly QuickCapture[],
): CaptureSourceById {
  const apiCaptureIds = new Set(apiCaptures.map((capture) => capture.id));
  const sources: CaptureSourceById = {};

  for (const capture of mergedCaptures) {
    sources[capture.id] = apiCaptureIds.has(capture.id)
      ? "cloud"
      : "local-only";
  }

  return sources;
}

function mapApiCaptureToCapture(row: ApiCaptureRow): Capture | null {
  const id = optionalString(row.id);
  const content = optionalString(row.content);
  const createdAt = optionalString(row.created_at);
  const updatedAt = optionalString(row.updated_at);

  if (
    !id ||
    !content ||
    !createdAt ||
    !updatedAt ||
    !isCaptureSource(row.source) ||
    !isCaptureStatus(row.status)
  ) {
    return null;
  }

  return {
    id,
    content,
    source: row.source,
    status: row.status,
    metadata: isRecord(row.metadata) ? row.metadata : {},
    createdAt,
    updatedAt,
  };
}

function parseListCapturesResponse(value: unknown): Capture[] | null {
  if (!isRecord(value)) {
    return null;
  }

  const response: ListCapturesApiResponse = value;

  if (response.ok !== true || !Array.isArray(response.captures)) {
    return null;
  }

  const mappedCaptures = response.captures.map((capture) =>
    isRecord(capture) ? mapApiCaptureToCapture(capture) : null,
  );

  if (mappedCaptures.some((capture) => capture === null)) {
    return null;
  }

  return mappedCaptures.filter((capture) => capture !== null);
}

function parseCreateCaptureResponse(value: unknown): Capture | null {
  if (!isRecord(value)) {
    return null;
  }

  const response: CreateCaptureApiResponse = value;

  if (response.ok !== true || !isRecord(response.capture)) {
    return null;
  }

  return mapApiCaptureToCapture(response.capture);
}

function parseUpdateCaptureResponse(value: unknown): Capture | null {
  if (!isRecord(value)) {
    return null;
  }

  const response: UpdateCaptureApiResponse = value;

  if (response.ok !== true || !isRecord(response.capture)) {
    return null;
  }

  return mapApiCaptureToCapture(response.capture);
}

export function mapCaptureToQuickCapture(capture: Capture): QuickCapture {
  return {
    id: capture.id,
    text: capture.content,
    createdAt: capture.createdAt,
  };
}

export function mergeApiCapturesWithLocalCaptures(
  apiCaptures: QuickCapture[],
  localCaptures: QuickCapture[],
): QuickCapture[] {
  const apiCaptureIds = new Set(apiCaptures.map((capture) => capture.id));
  const localOnlyCaptures = localCaptures.filter(
    (capture) => !apiCaptureIds.has(capture.id),
  );

  return [...apiCaptures, ...localOnlyCaptures];
}

function createLocalFallbackCapture(
  input: CreateCaptureApiInput,
): QuickCapture {
  const capture: QuickCapture = {
    id: crypto.randomUUID(),
    text: input.content,
    createdAt: new Date().toISOString(),
  };

  createQuickCapture(capture);

  return capture;
}

export async function fetchCapturesViaApi(
  options: CapturesApiRequestOptions = {},
): Promise<Capture[]> {
  const response = await fetch("/api/captures", {
    method: "GET",
    cache: "no-store",
    headers: getAuthorizationHeaders(options),
  });

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("Captures response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Captures request failed.");
  }

  const captures = parseListCapturesResponse(responseBody);

  if (!captures) {
    throw new Error("Captures response shape was invalid.");
  }

  return captures;
}

export async function createCaptureViaApi(
  input: CreateCaptureApiInput,
  options: CapturesApiRequestOptions = {},
): Promise<Capture> {
  const response = await fetch("/api/captures", {
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
    throw new Error("Capture create response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Capture create request failed.");
  }

  const capture = parseCreateCaptureResponse(responseBody);

  if (!capture) {
    throw new Error("Capture create response shape was invalid.");
  }

  return capture;
}

export async function updateCaptureStatusViaApi(
  captureId: string,
  input: UpdateCaptureApiInput,
  options: CapturesApiRequestOptions = {},
): Promise<Capture> {
  const response = await fetch(`/api/captures/${encodeURIComponent(captureId)}`, {
    method: "PATCH",
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
    throw new Error("Capture update response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Capture update request failed.");
  }

  const capture = parseUpdateCaptureResponse(responseBody);

  if (!capture) {
    throw new Error("Capture update response shape was invalid.");
  }

  return capture;
}

export async function loadCapturesFromPrimarySource(
  options: CapturesApiRequestOptions = {},
): Promise<QuickCapture[]> {
  const result = await loadCapturesFromPrimarySourceWithBoundary(options);

  return result.captures;
}

export async function loadCapturesFromPrimarySourceWithBoundary(
  options: CapturesApiRequestOptions = {},
): Promise<LoadCapturesResult> {
  if (!options.accessToken?.trim()) {
    const captures = getQuickCaptures();

    return {
      captureSources: createCaptureSourceMap(captures, "local-only"),
      captures,
      source: "local-only",
    };
  }

  try {
    const apiCaptures = (await fetchCapturesViaApi(options))
      .filter((capture) => capture.status === "inbox")
      .map(mapCaptureToQuickCapture);
    const mergedCaptures = mergeApiCapturesWithLocalCaptures(
      apiCaptures,
      getQuickCaptures(),
    );

    try {
      saveQuickCaptures(mergedCaptures);
    } catch {
      // Cache refresh is best-effort; the cloud read is still the source of truth.
    }

    return {
      captureSources: createMergedCaptureSourceMap(
        apiCaptures,
        mergedCaptures,
      ),
      captures: mergedCaptures,
      source: "cloud",
    };
  } catch {
    const captures = getQuickCaptures();

    return {
      captureSources: createCaptureSourceMap(captures, "local-fallback"),
      captures,
      source: "local-fallback",
    };
  }
}

export async function createCaptureFromPrimarySource(
  input: CreateCaptureApiInput,
  options: CapturesApiRequestOptions = {},
): Promise<CreateCaptureFromPrimarySourceResult> {
  if (!options.accessToken?.trim()) {
    return {
      capture: createLocalFallbackCapture(input),
      source: "local-only",
    };
  }

  try {
    const capture = await createCaptureViaApi(input, options);
    const quickCapture = mapCaptureToQuickCapture(capture);
    const nextCaptures = mergeApiCapturesWithLocalCaptures(
      [quickCapture],
      getQuickCaptures(),
    );

    try {
      saveQuickCaptures(nextCaptures);
    } catch {
      // Cache refresh is best-effort; the cloud write already succeeded.
    }

    return { capture: quickCapture, source: "cloud" };
  } catch {
    return {
      capture: createLocalFallbackCapture(input),
      source: "local-fallback",
    };
  }
}
