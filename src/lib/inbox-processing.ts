import {
  recordInboxProcessedActivity,
  recordNoteCreatedActivity,
  recordTaskCreatedActivity,
} from "@/lib/activity-recording";
import {
  removeCachedCaptureForOwner,
  resolveCaptureItemViaApi,
  updateCaptureStatusViaApi,
  type PrimaryCaptureSource,
} from "@/lib/captures-api";
import {
  removeQuickCapture,
  type QuickCapture,
} from "@/lib/quick-captures";
import { parseResolvedCaptureTask, upsertCachedTaskForOwner } from "@/lib/tasks-api";
import { parseResolvedCaptureNote, upsertCachedNoteForOwner } from "@/lib/notes-api";
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

export function canResolveCaptureToAccount(source: PrimaryCaptureSource, accessToken?: string): boolean {
  return source === "cloud" && Boolean(accessToken?.trim());
}

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

  if (options.captureSource === "local-fallback") {
    return removeCachedCaptureForOwner(options.ownerId, capture.id);
  }

  return removeQuickCapture(capture.id);
}

export async function convertInboxItemToTask(
  capture: QuickCapture,
  options: InboxProcessingOptions = {},
): Promise<InboxTaskProcessingResult> {
  if (capture.text.length > 5000) throw new Error("Capture is too long for a Task description.");
  if (!canResolveCaptureToAccount(options.captureSource ?? "local-only", options.accessToken)) throw new Error("Account-backed capture required.");
  const task = parseResolvedCaptureTask(await resolveCaptureItemViaApi(capture.id, "task", options));
  upsertCachedTaskForOwner(options.ownerId, task);
  const remainingCaptures = removeCachedCaptureForOwner(options.ownerId, capture.id);
  try {
    await recordTaskCreatedActivity(task, { accessToken: options.accessToken });
    await recordInboxProcessedActivity("task", { accessToken: options.accessToken });
  } catch { /* Activity is best-effort after the atomic conversion. */ }
  return { action: "task", task, source: "api", remainingCaptures };
}

export async function convertInboxItemToNote(
  capture: QuickCapture,
  options: InboxProcessingOptions = {},
): Promise<InboxNoteProcessingResult> {
  if (!canResolveCaptureToAccount(options.captureSource ?? "local-only", options.accessToken)) throw new Error("Account-backed capture required.");
  const note = parseResolvedCaptureNote(await resolveCaptureItemViaApi(capture.id, "note", options));
  upsertCachedNoteForOwner(options.ownerId, note);
  const remainingCaptures = removeCachedCaptureForOwner(options.ownerId, capture.id);
  try {
    await recordNoteCreatedActivity(note, { accessToken: options.accessToken });
    await recordInboxProcessedActivity("note", { accessToken: options.accessToken });
  } catch { /* Activity is best-effort after the atomic conversion. */ }
  return { action: "note", note, source: "api", remainingCaptures };
}

/** Call only after the Event RPC has committed; removes the stale fallback copy. */
export function completeInboxEventResolution(capture: QuickCapture, options: InboxProcessingOptions): QuickCapture[] {
  if (!canResolveCaptureToAccount(options.captureSource ?? "local-only", options.accessToken) || !options.ownerId) throw new Error("Account-backed capture required.");
  return removeCachedCaptureForOwner(options.ownerId, capture.id);
}

export async function archiveInboxItem(
  capture: QuickCapture,
  options: InboxProcessingOptions = {},
): Promise<InboxArchiveProcessingResult> {
  const remainingCaptures = await removeProcessedCapture(
    capture,
    "archived",
    options,
  );

  if (options.captureSource === "cloud") {
    await recordInboxProcessedActivity("archived", {
      accessToken: options.accessToken,
    });
  }

  return {
    action: "archive",
    remainingCaptures,
  };
}
