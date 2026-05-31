import {
  noteTypeFromInboxType,
  parseInboxInput,
  workspaceIdFromLabel,
} from "@/lib/inbox";
import {
  removeQuickCapture,
  type QuickCapture,
} from "@/lib/quick-captures";
import {
  createQuickCaptureNote,
  createQuickCaptureTask,
} from "@/lib/quick-capture";
import type { Note } from "@/lib/notes";
import type { Task } from "@/types";

export type InboxProcessingOptions = {
  accessToken?: string;
};

export type InboxTaskProcessingResult = {
  action: "task";
  remainingCaptures: QuickCapture[];
  source: "api" | "local";
  task: Task;
};

export type InboxNoteProcessingResult = {
  action: "note";
  note: Note;
  remainingCaptures: QuickCapture[];
  source: "local";
};

export type InboxArchiveProcessingResult = {
  action: "archive";
  remainingCaptures: QuickCapture[];
};

export type InboxProcessingResult =
  | InboxTaskProcessingResult
  | InboxNoteProcessingResult
  | InboxArchiveProcessingResult;

export async function convertInboxItemToTask(
  capture: QuickCapture,
  options: InboxProcessingOptions = {},
): Promise<InboxTaskProcessingResult> {
  const preview = parseInboxInput(capture.text);
  const result = await createQuickCaptureTask({
    title: preview.suggestedTitle,
    description: preview.summary,
    priority: preview.priority,
    status: "todo",
    workspaceId: workspaceIdFromLabel(preview.suggestedWorkspace),
    accessToken: options.accessToken,
  });

  if (result.type !== "task") {
    throw new Error("Inbox task conversion returned an unexpected result.");
  }

  return {
    action: "task",
    task: result.task,
    source: result.source,
    remainingCaptures: removeQuickCapture(capture.id),
  };
}

export function convertInboxItemToNote(
  capture: QuickCapture,
): InboxNoteProcessingResult {
  const preview = parseInboxInput(capture.text);
  const result = createQuickCaptureNote({
    title: preview.suggestedTitle,
    content: preview.summary,
    type: noteTypeFromInboxType(preview.type),
  });

  if (result.type !== "note") {
    throw new Error("Inbox note conversion returned an unexpected result.");
  }

  return {
    action: "note",
    note: result.note,
    source: result.source,
    remainingCaptures: removeQuickCapture(capture.id),
  };
}

export function archiveInboxItem(
  capture: QuickCapture,
): InboxArchiveProcessingResult {
  return {
    action: "archive",
    remainingCaptures: removeQuickCapture(capture.id),
  };
}
