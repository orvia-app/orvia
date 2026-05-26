import type { NoteType } from "@/lib/notes";
import { getLegacyWorkspaceId } from "@/lib/workspaces/workspaces";
import type { TaskPriority } from "@/types";

export type InboxItemType = "Reminder" | "Idea" | "Task" | "Note" | "Inbox item";

export type InboxParseResult = {
  type: InboxItemType;
  suggestedTitle: string;
  priority: TaskPriority;
  workspace: string;
  aiSummary: string;
};

export function detectItemType(text: string): InboxItemType {
  const normalizedText = text.toLowerCase();

  if (normalizedText.includes("remind")) {
    return "Reminder";
  }

  if (normalizedText.includes("idea")) {
    return "Idea";
  }

  if (normalizedText.includes("schedule")) {
    return "Task";
  }

  if (normalizedText.includes("save")) {
    return "Note";
  }

  return "Inbox item";
}

export function detectWorkspace(text: string): string {
  const normalizedText = text.toLowerCase();

  if (normalizedText.includes("infiniti")) {
    return "Cars";
  }

  if (normalizedText.includes("qa")) {
    return "Work";
  }

  if (normalizedText.includes("rehab")) {
    return "Business";
  }

  if (normalizedText.includes("devops")) {
    return "Knowledge";
  }

  return "Personal";
}

export function buildSuggestedTitle(text: string): string {
  return text
    .replace(/^idea:/i, "")
    .replace(/^remind me to/i, "")
    .replace(/^schedule/i, "")
    .replace(/^save/i, "")
    .trim();
}

export function priorityFromType(type: InboxItemType): TaskPriority {
  switch (type) {
    case "Reminder":
    case "Task":
      return "high";

    case "Idea":
    case "Note":
      return "medium";

    default:
      return "low";
  }
}

export function workspaceIdFromLabel(workspace: string): string {
  return getLegacyWorkspaceId(workspace);
}

export function noteTypeFromInboxType(
  inboxType: InboxItemType,
): Extract<NoteType, "idea" | "note"> {
  if (inboxType === "Idea") {
    return "idea";
  }

  return "note";
}

export function parseInboxInput(text: string): InboxParseResult {
  const type = detectItemType(text);
  const workspace = detectWorkspace(text);
  const suggestedTitle = buildSuggestedTitle(text);

  return {
    type,
    workspace,
    suggestedTitle,
    priority: priorityFromType(type),
    aiSummary: `${type} for ${workspace}: ${suggestedTitle}`,
  };
}
