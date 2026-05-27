import type {
  SyncConflict,
  SyncConflictResolution,
  SyncEntityRef,
  VersionedSyncRecord,
} from "@/core/sync/types";

function compareIsoDate(a?: string, b?: string): number {
  const aTime = a ? Date.parse(a) : 0;
  const bTime = b ? Date.parse(b) : 0;
  return aTime - bTime;
}

export function detectSyncConflict<
  TLocal extends VersionedSyncRecord,
  TRemote extends VersionedSyncRecord,
>(input: {
  entity: SyncEntityRef;
  local: TLocal;
  remote: TRemote;
  detectedAt: string;
}): SyncConflict<TLocal, TRemote> | null {
  if (input.remote.deletedAt && !input.local.deletedAt) {
    return {
      entity: input.entity,
      reason: "remote-deleted",
      local: input.local,
      remote: input.remote,
      detectedAt: input.detectedAt,
    };
  }

  if (input.local.deletedAt && !input.remote.deletedAt) {
    return {
      entity: input.entity,
      reason: "local-deleted",
      local: input.local,
      remote: input.remote,
      detectedAt: input.detectedAt,
    };
  }

  if (input.local.version !== input.remote.version) {
    return {
      entity: input.entity,
      reason: "version-mismatch",
      local: input.local,
      remote: input.remote,
      detectedAt: input.detectedAt,
    };
  }

  if (compareIsoDate(input.local.updatedAt, input.remote.updatedAt) !== 0) {
    return {
      entity: input.entity,
      reason: "concurrent-update",
      local: input.local,
      remote: input.remote,
      detectedAt: input.detectedAt,
    };
  }

  return null;
}

export function resolveLowRiskPreferenceConflict<T extends VersionedSyncRecord>(
  local: T,
  remote: T,
): SyncConflictResolution<T> {
  return compareIsoDate(local.updatedAt, remote.updatedAt) >= 0
    ? { strategy: "use-local", value: local }
    : { strategy: "use-remote", value: remote };
}

export function requireManualConflictResolution<T>(
  reason: string,
): SyncConflictResolution<T> {
  return {
    strategy: "manual",
    reason,
  };
}
