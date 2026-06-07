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
function getAccessToken(options: ActivityRecordingOptions): string | null {
  const accessToken = options.accessToken?.trim();

  return accessToken ? accessToken : null;
}

function getUuidEntityId(id: string): string | null {
  return UUID_PATTERN.test(id) ? id : null;
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
      title: "Task created",
      description: "Created a task",
      metadata: {
        has_due_date: Boolean(task.dueDate),
        priority: task.priority,
        status: task.status,
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
      title: "Task updated",
      description: "Updated a task",
      metadata: {
        has_due_date: Boolean(task.dueDate),
        nextStatus: task.status,
        previousStatus: details.previousStatus,
        priority: task.priority,
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
      title: "Task deleted",
      description: "Deleted a task",
      metadata: {
        has_due_date: Boolean(task.dueDate),
        priority: task.priority,
        status: task.status,
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
      title: "Note created",
      description: "Created a note",
      metadata: {
        note_type: note.type,
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
      title: "Note updated",
      description: "Updated a note",
      metadata: {
        note_type: note.type,
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
      title: "Note deleted",
      description: "Deleted a note",
      metadata: {
        note_type: note.type,
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
