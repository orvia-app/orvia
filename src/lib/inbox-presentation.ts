import type { TranslationKey } from "@/lib/i18n";
import type { InboxItemType } from "@/lib/inbox";
import type { WorkspaceKey } from "@/lib/workspaces/types";

export const inboxTypeLabelKeys: Record<InboxItemType, TranslationKey> = {
  Reminder: "inbox.type.reminder",
  Idea: "inbox.type.idea",
  Task: "inbox.type.task",
  Note: "inbox.type.note",
  Finance: "inbox.type.finance",
  Car: "inbox.type.car",
  "Inbox item": "inbox.type.capture",
};

export const inboxWorkspaceLabelKeys: Record<WorkspaceKey, TranslationKey> = {
  personal: "workspace.personal",
  work: "workspace.work",
  cars: "inbox.workspace.cars",
  business: "inbox.workspace.business",
  knowledge: "inbox.workspace.knowledge",
};
