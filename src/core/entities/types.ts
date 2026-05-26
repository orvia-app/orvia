export type EntityType =
  | "task"
  | "note"
  | "memory"
  | "activity"
  | "capture"
  | "finance"
  | "car"
  | "automation";

export type EntityId<TType extends EntityType = EntityType> =
  `${TType}:${string}`;

export type SyncStatus =
  | "local"
  | "pending"
  | "synced"
  | "conflict"
  | "deleted";

export type SyncSource = "local" | "backend" | "sync" | "generated";

export type SyncMetadata = {
  version: number;
  syncStatus: SyncStatus;
  source: SyncSource;
  lastSyncedAt?: string;
  deviceId?: string;
  deletedAt?: string;
};

export type EntityMetadata = {
  url?: string;
  workspaceId?: string;
  workspaceLabel?: string;
  tags?: readonly string[];
  status?: string;
  priority?: string;
  searchableText?: string;
  contextScore?: number;
  relatedCount?: number;
  sourceId?: string;
  sourceType?: string;
  extra?: Record<string, unknown>;
};

export type EntityRelationType =
  | "related"
  | "same_workspace"
  | "shared_tag"
  | "similar_title"
  | "nearby_activity"
  | "source_link";

export type EntityRelation = {
  id: string;
  fromEntityId: EntityId;
  toEntityId: EntityId;
  type: EntityRelationType;
  score: number;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

export type BaseEntity<TType extends EntityType = EntityType> = {
  id: EntityId<TType>;
  type: TType;
  title: string;
  subtitle?: string;
  createdAt?: string;
  updatedAt?: string;
  workspaceId?: string;
  tags: readonly string[];
  status?: string;
  metadata: EntityMetadata;
  relations: readonly EntityRelation[];
  sync: SyncMetadata;
};

export type EntityFilter = {
  types?: readonly EntityType[];
  workspaceIds?: readonly string[];
  tags?: readonly string[];
  status?: string;
};
