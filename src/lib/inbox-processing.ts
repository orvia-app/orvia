import {
  noteTypeFromInboxType,
  parseInboxInput,
  workspaceIdFromLabel,
} from "@/lib/inbox";
import {
  recordNoteCreatedActivity,
  recordTaskCreatedActivity,
} from "@/lib/activity-recording";
import {
  getCachedCapturesForOwner,
  removeCachedCaptureForOwner,
  updateCaptureStatusViaApi,
  type PrimaryCaptureSource,
} from "@/lib/captures-api";
import {
  getQuickCaptures,
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
  captureSource?: PrimaryCaptureSource;
  ownerId?: string;
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
  source: "api" | "local";
};

export type InboxArchiveProcessingResult = {
  action: "archive";
  remainingCaptures: QuickCapture[];
};

export type InboxProcessingResult =
  | InboxTaskProcessingResult
  | InboxNoteProcessingResult
  | InboxArchiveProcessingResult;

async function removeProcessedCapture(
  capture: QuickCapture,
  status: "processed" | "archived",
  options: InboxProcessingOptions,
): Promise<QuickCapture[]> {
  if (options.captureSource === "cloud") {
    if (!options.accessToken?.trim()) {
      throw new Error("Cloud capture processing requires an access token.");
    }

    await updateCaptureStatusViaApi(
      capture.id,
      { status },
      { accessToken: options.accessToken, ownerId: options.ownerId },
    );

    return removeCachedCaptureForOwner(options.ownerId, capture.id);
  }

  return removeQuickCapture(capture.id);
}

async function maybeRemoveConvertedCapture(
  capture: QuickCapture,
  conversionSource: "api" | "local",
  options: InboxProcessingOptions,
): Promise<QuickCapture[]> {
  if (options.captureSource === "cloud" && conversionSource !== "api") {
    return getCachedCapturesForOwner(options.ownerId);
  }

  return removeProcessedCapture(capture, "processed", options);
}

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
    ownerId: options.ownerId,
  });

  if (result.type !== "task") {
    throw new Error("Inbox task conversion returned an unexpected result.");
  }

  if (result.source === "api") {
    await recordTaskCreatedActivity(result.task, {
      accessToken: options.accessToken,
    });
  }

  return {
    action: "task",
    task: result.task,
    source: result.source,
    remainingCaptures: await maybeRemoveConvertedCapture(
      capture,
      result.source,
      options,
    ),
  };
}

export async function convertInboxItemToNote(
  capture: QuickCapture,
  options: InboxProcessingOptions = {},
): Promise<InboxNoteProcessingResult> {
  const preview = parseInboxInput(capture.text);
  const result = await createQuickCaptureNote({
    accessToken: options.accessToken,
    ownerId: options.ownerId,
    title: preview.suggestedTitle,
    content: preview.summary,
    type: noteTypeFromInboxType(preview.type),
  });

  if (result.type !== "note") {
    throw new Error("Inbox note conversion returned an unexpected result.");
  }

  if (result.source === "api") {
    await recordNoteCreatedActivity(result.note, {
      accessToken: options.accessToken,
    });
  }

  return {
    action: "note",
    note: result.note,
    source: result.source,
    remainingCaptures: await maybeRemoveConvertedCapture(
      capture,
      result.source,
      options,
    ),
  };
}

export async function archiveInboxItem(
  capture: QuickCapture,
  options: InboxProcessingOptions = {},
): Promise<InboxArchiveProcessingResult> {
  return {
    action: "archive",
    remainingCaptures: await removeProcessedCapture(
      capture,
      "archived",
      options,
    ),
  };
}
