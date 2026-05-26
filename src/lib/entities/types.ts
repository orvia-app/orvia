import type { CarRecord } from "@/lib/cars";
import type { Transaction } from "@/lib/finance";
import type { QuickCapture } from "@/lib/quick-captures";
import type { Note } from "@/lib/notes";
import type { Task } from "@/types";

export type EntityType =
  | "task"
  | "note"
  | "finance_transaction"
  | "car"
  | "inbox_item";

export type EntityId<TType extends EntityType = EntityType> = `${TType}:${string}`;

export type EntityMetadata = {
  createdAt?: string;
  updatedAt?: string;
  workspaceId?: string;
  workspaceLabel?: string;
  source: "local";
  url?: string;
  searchableText: string;
  relationIds?: readonly EntityId[];
  memoryTags?: readonly string[];
  tags?: readonly string[];
  relatedCount?: number;
  contextualScore?: number;
  status?: string;
  priority?: string;
};

export type BaseEntity<TType extends EntityType, TData> = {
  id: EntityId<TType>;
  type: TType;
  sourceId: string;
  title: string;
  subtitle?: string;
  data: TData;
  metadata: EntityMetadata;
};

export type TaskEntity = BaseEntity<"task", Task>;

export type NoteEntity = BaseEntity<"note", Note>;

export type FinanceTransactionEntity = BaseEntity<
  "finance_transaction",
  Transaction
>;

export type CarEntity = BaseEntity<"car", CarRecord>;

export type InboxItemEntity = BaseEntity<"inbox_item", QuickCapture>;

export type PersonalEntity =
  | TaskEntity
  | NoteEntity
  | FinanceTransactionEntity
  | CarEntity
  | InboxItemEntity;

export type SearchableEntity = {
  id: EntityId;
  type: EntityType;
  title: string;
  subtitle: string;
  typeLabel: string;
  url: string;
  searchableText: string;
  entity: PersonalEntity;
};
