import { FilePlus2, Inbox, ListPlus } from "lucide-react";

import type { CommandItem } from "@/lib/commands/types";

export const actionCommands: readonly CommandItem[] = [
  {
    id: "action-create-task",
    title: "Quick Task",
    subtitle: "Capture a task without leaving the keyboard",
    keywords: ["new task", "todo", "quick add", "create task"],
    group: "Capture",
    icon: ListPlus,
    action: { type: "create-task" },
    metadata: { priority: "primary", contextualScore: 100 },
  },
  {
    id: "action-create-note",
    title: "Quick Note",
    subtitle: "Capture a note for later recall",
    keywords: ["new note", "capture", "idea", "create note"],
    group: "Capture",
    icon: FilePlus2,
    action: { type: "create-note" },
    metadata: { priority: "primary", contextualScore: 90 },
  },
  {
    id: "action-open-inbox",
    title: "Open Inbox",
    subtitle: "Review captures waiting for action",
    keywords: ["inbox", "capture", "process"],
    group: "Actions",
    icon: Inbox,
    action: { type: "navigate", href: "/inbox" },
    metadata: { priority: "normal", recentLabel: "Open Inbox" },
  },
];
