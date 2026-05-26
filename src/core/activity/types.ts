import type {
  ActivityEventType,
  ActivityId,
} from "@/lib/activity/types";
import type { EntityId, EntityType, SyncMetadata } from "@/core/entities/types";

export type ActivityEventSource = "local" | "backend" | "sync" | "system";

export type ActivityEvent = {
  eventId: ActivityId;
  entityId: EntityId;
  entityType: EntityType;
  action: ActivityEventType;
  timestamp?: string;
  source: ActivityEventSource;
  actorId?: string;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
  sync: SyncMetadata;
};
