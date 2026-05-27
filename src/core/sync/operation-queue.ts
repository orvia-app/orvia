import type {
  SyncDeviceId,
  SyncEntityRef,
  SyncOperation,
  SyncOperationId,
  SyncOperationPayload,
  SyncOperationType,
  SyncQueueState,
} from "@/core/sync/types";

export const emptySyncQueue: SyncQueueState = {
  operations: [],
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function hashString(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

export function createSyncOperationId(input: {
  type: SyncOperationType;
  entity: SyncEntityRef;
  payload: SyncOperationPayload;
  deviceId: SyncDeviceId;
  createdAt: string;
  baseVersion?: number;
}): SyncOperationId {
  return `syncop:${hashString(stableStringify(input))}`;
}

export function createSyncOperation(input: {
  type: SyncOperationType;
  entity: SyncEntityRef;
  payload?: SyncOperationPayload;
  deviceId: SyncDeviceId;
  createdAt: string;
  baseVersion?: number;
}): SyncOperation {
  const payload = input.payload ?? {};
  const id = createSyncOperationId({
    type: input.type,
    entity: input.entity,
    payload,
    deviceId: input.deviceId,
    createdAt: input.createdAt,
    baseVersion: input.baseVersion,
  });

  return {
    id,
    type: input.type,
    status: "queued",
    entity: input.entity,
    payload,
    baseVersion: input.baseVersion,
    deviceId: input.deviceId,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    retryCount: 0,
  };
}

export function enqueueSyncOperation(
  queue: SyncQueueState,
  operation: SyncOperation,
): SyncQueueState {
  const existing = queue.operations.some((item) => item.id === operation.id);

  if (existing) {
    return queue;
  }

  return {
    operations: [...queue.operations, operation],
  };
}

export function markSyncOperationAcked(
  queue: SyncQueueState,
  operationId: SyncOperationId,
  updatedAt: string,
): SyncQueueState {
  return {
    operations: queue.operations.map((operation) =>
      operation.id === operationId
        ? { ...operation, status: "acked", updatedAt, lastError: undefined }
        : operation,
    ),
  };
}

export function markSyncOperationFailed(
  queue: SyncQueueState,
  operationId: SyncOperationId,
  error: string,
  updatedAt: string,
): SyncQueueState {
  return {
    operations: queue.operations.map((operation) =>
      operation.id === operationId
        ? {
            ...operation,
            status: "failed",
            updatedAt,
            retryCount: operation.retryCount + 1,
            lastError: error,
          }
        : operation,
    ),
  };
}

export function removeSyncOperation(
  queue: SyncQueueState,
  operationId: SyncOperationId,
): SyncQueueState {
  return {
    operations: queue.operations.filter(
      (operation) => operation.id !== operationId,
    ),
  };
}

export function listQueuedSyncOperations(
  queue: SyncQueueState,
): readonly SyncOperation[] {
  return queue.operations.filter((operation) => operation.status === "queued");
}
