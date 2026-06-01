import { getStoredNotes, type Note } from "@/lib/notes";
import {
  createNoteViaApi,
  fetchNotesViaApi,
  type CreateNoteApiInput,
} from "@/lib/notes-api";
import { getStoredTasks } from "@/lib/tasks";
import {
  createTaskViaApi,
  fetchTasksViaApi,
  type CreateTaskApiInput,
} from "@/lib/tasks-api";
import type { Task } from "@/types";

export type LocalCloudImportPlan =
  | {
      status: "needs-auth";
      taskCandidateIds: [];
      noteCandidateIds: [];
      taskCount: 0;
      noteCount: 0;
    }
  | {
      status: "ready";
      taskCandidateIds: string[];
      noteCandidateIds: string[];
      taskCount: number;
      noteCount: number;
    }
  | {
      status: "error";
      error: string;
      taskCandidateIds: [];
      noteCandidateIds: [];
      taskCount: 0;
      noteCount: 0;
    };

export type LocalCloudImportSummary = {
  importedTasks: number;
  importedNotes: number;
  skippedTasks: number;
  skippedNotes: number;
  errors: string[];
};

type LocalCloudSyncOptions = {
  accessToken?: string;
};

type ImportCandidates = {
  cloudNotes: Note[];
  cloudTasks: Task[];
  noteCandidates: Note[];
  taskCandidates: Task[];
};

function hasAccessToken(accessToken?: string): accessToken is string {
  return typeof accessToken === "string" && accessToken.trim().length > 0;
}

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function taskSignature(task: Task): string {
  return [
    normalize(task.title),
    normalize(task.description),
    task.status,
    task.priority,
    normalize(task.workspaceId),
    normalize(task.dueDate),
  ].join("|");
}

function noteSignature(note: Note): string {
  return [
    normalize(note.title),
    normalize(note.content),
    note.type,
  ].join("|");
}

function findLocalOnlyTasks(localTasks: Task[], cloudTasks: Task[]): Task[] {
  const cloudIds = new Set(cloudTasks.map((task) => task.id));
  const cloudSignatures = new Set(cloudTasks.map(taskSignature));

  return localTasks.filter(
    (task) => !cloudIds.has(task.id) && !cloudSignatures.has(taskSignature(task)),
  );
}

function findLocalOnlyNotes(localNotes: Note[], cloudNotes: Note[]): Note[] {
  const cloudIds = new Set(cloudNotes.map((note) => note.id));
  const cloudSignatures = new Set(cloudNotes.map(noteSignature));

  return localNotes.filter(
    (note) => !cloudIds.has(note.id) && !cloudSignatures.has(noteSignature(note)),
  );
}

async function getImportCandidates(
  accessToken: string,
): Promise<ImportCandidates> {
  const [cloudTasks, cloudNotes] = await Promise.all([
    fetchTasksViaApi({ accessToken }),
    fetchNotesViaApi({ accessToken }),
  ]);
  const localTasks = getStoredTasks();
  const localNotes = getStoredNotes();

  return {
    cloudNotes,
    cloudTasks,
    noteCandidates: findLocalOnlyNotes(localNotes, cloudNotes),
    taskCandidates: findLocalOnlyTasks(localTasks, cloudTasks),
  };
}

function toCreateTaskInput(task: Task): CreateTaskApiInput {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    workspaceId: task.workspaceId,
    dueDate: task.dueDate,
  };
}

function toCreateNoteInput(note: Note): CreateNoteApiInput {
  return {
    title: note.title,
    content: note.content,
    type: note.type,
  };
}

export async function buildLocalCloudImportPlan({
  accessToken,
}: LocalCloudSyncOptions): Promise<LocalCloudImportPlan> {
  if (!hasAccessToken(accessToken)) {
    return {
      status: "needs-auth",
      taskCandidateIds: [],
      noteCandidateIds: [],
      taskCount: 0,
      noteCount: 0,
    };
  }

  try {
    const { noteCandidates, taskCandidates } =
      await getImportCandidates(accessToken);

    return {
      status: "ready",
      taskCandidateIds: taskCandidates.map((task) => task.id),
      noteCandidateIds: noteCandidates.map((note) => note.id),
      taskCount: taskCandidates.length,
      noteCount: noteCandidates.length,
    };
  } catch {
    return {
      status: "error",
      error: "Could not prepare local import plan.",
      taskCandidateIds: [],
      noteCandidateIds: [],
      taskCount: 0,
      noteCount: 0,
    };
  }
}

export async function importLocalItemsToCloud({
  accessToken,
}: LocalCloudSyncOptions): Promise<LocalCloudImportSummary> {
  if (!hasAccessToken(accessToken)) {
    return {
      importedTasks: 0,
      importedNotes: 0,
      skippedTasks: 0,
      skippedNotes: 0,
      errors: ["Sign in before importing local data."],
    };
  }

  let candidates: ImportCandidates;

  try {
    candidates = await getImportCandidates(accessToken);
  } catch {
    return {
      importedTasks: 0,
      importedNotes: 0,
      skippedTasks: 0,
      skippedNotes: 0,
      errors: ["Could not load cloud data before import."],
    };
  }

  const summary: LocalCloudImportSummary = {
    importedTasks: 0,
    importedNotes: 0,
    skippedTasks: 0,
    skippedNotes: 0,
    errors: [],
  };
  const importedTaskSignatures = new Set(candidates.cloudTasks.map(taskSignature));
  const importedNoteSignatures = new Set(candidates.cloudNotes.map(noteSignature));

  for (const task of candidates.taskCandidates) {
    const signature = taskSignature(task);

    if (importedTaskSignatures.has(signature)) {
      summary.skippedTasks += 1;
      continue;
    }

    try {
      const importedTask = await createTaskViaApi(toCreateTaskInput(task), {
        accessToken,
      });

      importedTaskSignatures.add(taskSignature(importedTask));
      summary.importedTasks += 1;
    } catch {
      summary.skippedTasks += 1;
      summary.errors.push(`Could not import task: ${task.title}`);
    }
  }

  for (const note of candidates.noteCandidates) {
    const signature = noteSignature(note);

    if (importedNoteSignatures.has(signature)) {
      summary.skippedNotes += 1;
      continue;
    }

    try {
      const importedNote = await createNoteViaApi(toCreateNoteInput(note), {
        accessToken,
      });

      importedNoteSignatures.add(noteSignature(importedNote));
      summary.importedNotes += 1;
    } catch {
      summary.skippedNotes += 1;
      summary.errors.push(`Could not import note: ${note.title}`);
    }
  }

  return summary;
}
