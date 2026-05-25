import { FilePlus2, Inbox, ListPlus } from "lucide-react";

import type { CommandItem } from "@/lib/commands/types";

export const actionCommands: readonly CommandItem[] = [
  {
    id: "action-create-task",
    title: "Create Task",
    subtitle: "Add a task without leaving the keyboard",
    keywords: ["new task", "todo", "quick add"],
    group: "Create",
    icon: ListPlus,
    action: { type: "create-task" },
  },
  {
    id: "action-create-note",
    title: "Create Note",
    subtitle: "Capture a note from the command palette",
    keywords: ["new note", "capture", "idea"],
    group: "Create",
    icon: FilePlus2,
    action: { type: "create-note" },
  },
  {
    id: "action-open-ai-inbox",
    title: "Open AI Inbox",
    subtitle: "/inbox",
    keywords: ["inbox", "capture", "process"],
    group: "AI",
    icon: Inbox,
    action: { type: "navigate", href: "/inbox" },
  },
];
