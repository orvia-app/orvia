import type { EntityType } from "@/core/entities/types";

export type SyncStatus =
  | "local"
  | "queued"
  | "syncing"
  | "synced"
  | "conflict"
  | "failed"
  | "deleted";

export type SyncOperationType =
  | "create"
  | "update"
  | "delete"
  | "restore";

export type SyncOperationStatus =
  | "queued"
  | "acked"
  | "failed"
  | "conflict";

export type SyncOperationId = `syncop:${string}`;

export type SyncDeviceId = `device:${string}`;

export type SyncEntityRef = {
  entityType: EntityType;
  entityId: string;
};

export type SyncOperationPayload = Record<string, unknown>;

export type SyncOperation = {
  id: SyncOperationId;
  type: SyncOperationType;
  status: SyncOperationStatus;
  entity: SyncEntityRef;
  payload: SyncOperationPayload;
  baseVersion?: number;
  deviceId: SyncDeviceId;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  lastError?: string;
};

export type SyncQueueState = {
  operations: readonly SyncOperation[];
};

export type SyncConflictReason =
  | "version-mismatch"
  | "remote-deleted"
  | "local-deleted"
  | "concurrent-update";

export type SyncConflict<TLocal, TRemote> = {
  entity: SyncEntityRef;
  reason: SyncConflictReason;
  local: TLocal;
  remote: TRemote;
  detectedAt: string;
};

export type SyncConflictResolution<T> =
  | { strategy: "use-local"; value: T }
  | { strategy: "use-remote"; value: T }
  | { strategy: "manual"; reason: string };

export type VersionedSyncRecord = {
  version: number;
  updatedAt?: string;
  deletedAt?: string;
};
