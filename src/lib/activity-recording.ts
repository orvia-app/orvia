import {
  createActivityViaApi,
  type CreateActivityApiInput,
} from "@/lib/activities-api";
import type { Note } from "@/lib/notes";
import type { Task, TaskStatus } from "@/types";

type ActivityRecordingOptions = {
  accessToken?: string;
};

type TaskUpdatedActivityDetails = {
  previousStatus?: TaskStatus;
};

type LocalImportCompletedActivityDetails = {
  importedTasks: number;
  importedNotes: number;
  skippedTasks: number;
  skippedNotes: number;
  errorCount: number;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIVITY_TITLE_MAX_LENGTH = 240;
const ACTIVITY_DESCRIPTION_MAX_LENGTH = 5000;

function getAccessToken(options: ActivityRecordingOptions): string | null {
  const accessToken = options.accessToken?.trim();

  return accessToken ? accessToken : null;
}

function getUuidEntityId(id: string): string | null {
  return UUID_PATTERN.test(id) ? id : null;
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function getActivityTitle(prefix: string, title: string): string {
  return truncate(`${prefix}: ${title}`, ACTIVITY_TITLE_MAX_LENGTH);
}

function getActivityDescription(value: string | undefined): string | null {
  return value ? truncate(value, ACTIVITY_DESCRIPTION_MAX_LENGTH) : null;
}

async function recordActivity(
  input: CreateActivityApiInput,
  options: ActivityRecordingOptions,
): Promise<void> {
  const accessToken = getAccessToken(options);

  if (!accessToken) {
    return;
  }

  try {
    await createActivityViaApi(input, { accessToken });
  } catch {
    // Activity recording is intentionally best-effort.
  }
}

export function recordTaskCreatedActivity(
  task: Task,
  options: ActivityRecordingOptions,
): Promise<void> {
  return recordActivity(
    {
      type: "task_created",
      entityType: "task",
      entityId: getUuidEntityId(task.id),
      title: getActivityTitle("Created task", task.title),
      description: getActivityDescription(task.description),
      metadata: {
        priority: task.priority,
        status: task.status,
        workspaceId: task.workspaceId,
      },
    },
    options,
  );
}

export function recordTaskUpdatedActivity(
  task: Task,
  details: TaskUpdatedActivityDetails,
  options: ActivityRecordingOptions,
): Promise<void> {
  return recordActivity(
    {
      type: "task_updated",
      entityType: "task",
      entityId: getUuidEntityId(task.id),
      title: getActivityTitle("Updated task", task.title),
      description: getActivityDescription(task.description),
      metadata: {
        nextStatus: task.status,
        previousStatus: details.previousStatus,
        priority: task.priority,
        workspaceId: task.workspaceId,
      },
    },
    options,
  );
}

export function recordTaskDeletedActivity(
  task: Task,
  options: ActivityRecordingOptions,
): Promise<void> {
  return recordActivity(
    {
      type: "task_deleted",
      entityType: "task",
      entityId: getUuidEntityId(task.id),
      title: getActivityTitle("Deleted task", task.title),
      description: getActivityDescription(task.description),
      metadata: {
        priority: task.priority,
        status: task.status,
        workspaceId: task.workspaceId,
      },
    },
    options,
  );
}

export function recordNoteCreatedActivity(
  note: Note,
  options: ActivityRecordingOptions,
): Promise<void> {
  return recordActivity(
    {
      type: "note_created",
      entityType: "note",
      entityId: getUuidEntityId(note.id),
      title: getActivityTitle("Created note", note.title),
      description: getActivityDescription(note.content),
      metadata: {
        type: note.type,
      },
    },
    options,
  );
}

export function recordNoteUpdatedActivity(
  note: Note,
  options: ActivityRecordingOptions,
): Promise<void> {
  return recordActivity(
    {
      type: "note_updated",
      entityType: "note",
      entityId: getUuidEntityId(note.id),
      title: getActivityTitle("Updated note", note.title),
      description: getActivityDescription(note.content),
      metadata: {
        type: note.type,
      },
    },
    options,
  );
}

export function recordNoteDeletedActivity(
  note: Note,
  options: ActivityRecordingOptions,
): Promise<void> {
  return recordActivity(
    {
      type: "note_deleted",
      entityType: "note",
      entityId: getUuidEntityId(note.id),
      title: getActivityTitle("Deleted note", note.title),
      description: getActivityDescription(note.content),
      metadata: {
        type: note.type,
      },
    },
    options,
  );
}

export function recordLocalImportCompletedActivity(
  details: LocalImportCompletedActivityDetails,
  options: ActivityRecordingOptions,
): Promise<void> {
  return recordActivity(
    {
      type: "local_import_completed",
      entityType: "sync",
      entityId: null,
      title: "Imported local data to cloud",
      description: "Completed a local-to-cloud import for tasks and notes.",
      metadata: details,
    },
    options,
  );
}
