import type { TranslationKey } from "@/lib/i18n";
import type { EntityType } from "@/lib/entities/types";
import type { ContextLabel } from "@/lib/memory/context";

const entityKeys: Record<EntityType, TranslationKey> = {
  task: "inbox.type.task", note: "inbox.type.note", inbox_item: "common.inbox",
  car: "inbox.type.car", finance_transaction: "inbox.type.finance",
};
const labelKeys: Record<ContextLabel, TranslationKey> = {
  Active: "context.active", "Recently updated": "context.recent",
  Connected: "context.connected", "Repeated topic": "context.repeated", Pending: "context.pending",
};
export const relatedTypeKey = (type: EntityType): TranslationKey => entityKeys[type];
export const contextLabelKey = (label: ContextLabel): TranslationKey => labelKeys[label];
