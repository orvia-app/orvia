import type {
  ActivityEventType,
  ActivityId,
  ActivityItem,
} from "@/lib/activity/types";
import type {
  EntityId,
  EntityType,
  PersonalEntity,
} from "@/lib/entities/types";

export type MemorySourceType =
  | "task"
  | "note"
  | "inbox"
  | "activity"
  | "manual";

export type MemoryImportance = "low" | "medium" | "high" | "critical";

export type MemoryId = `memory:${MemorySourceType}:${string}`;

export type MemoryOwnerRef = {
  userId?: string;
  workspaceId?: string;
};

export type MemoryEntityRef = {
  id: EntityId;
  type: EntityType;
  sourceId: string;
  title: string;
  url: string;
};

export type MemoryVectorRef = {
  embeddingId?: string;
  model?: string;
  indexName?: string;
  dimensions?: number;
  contentHash?: string;
};

export type MemorySourceRef =
  | {
      type: "task" | "note" | "inbox";
      entity: MemoryEntityRef;
    }
  | {
      type: "activity";
      activityId: ActivityId;
      eventType: ActivityEventType;
      entity: MemoryEntityRef;
    }
  | {
      type: "manual";
      label?: string;
    };

export type MemoryMetadata = MemoryOwnerRef & {
  createdAt?: string;
  updatedAt?: string;
  capturedAt?: string;
  relationIds?: readonly EntityId[];
  tags?: readonly string[];
  vector?: MemoryVectorRef;
  source: "local" | "backend" | "sync" | "generated";
};

export type MemoryItem = {
  id: MemoryId;
  sourceType: MemorySourceType;
  source: MemorySourceRef;
  title: string;
  content: string;
  importance: MemoryImportance;
  metadata: MemoryMetadata;
};

export type MemoryCandidate = MemoryItem & {
  candidateReason: string;
};

export type MemoryIndexEntry = {
  id: MemoryId;
  title: string;
  content: string;
  searchableText: string;
  importance: MemoryImportance;
  sourceType: MemorySourceType;
  entity?: MemoryEntityRef;
  vector?: MemoryVectorRef;
  memory: MemoryItem;
};

export type MemoryCandidateSource = PersonalEntity | ActivityItem;
