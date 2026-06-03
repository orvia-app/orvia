import { fetchActivitiesViaApi } from "@/lib/activities-api";
import {
  loadCapturesFromPrimarySourceWithBoundary,
  type CaptureSourceById,
  type PrimaryCaptureSource,
} from "@/lib/captures-api";
import { getNotes, type Note } from "@/lib/notes";
import type { QuickCapture } from "@/lib/quick-captures";
import {
  loadTasksFromPrimarySourceWithBoundary,
  type PrimaryTaskSource,
  type TaskSourceById,
  type TasksApiRequestOptions,
} from "@/lib/tasks-api";
import {
  createTimelineEventsFromActivities,
  type TimelineEvent,
} from "@/lib/timeline";
import type { Task } from "@/types";

export type UnifiedSearchResultType = "task" | "note" | "inbox" | "timeline";

export type UnifiedSearchResult = {
  id: string;
  type: UnifiedSearchResultType;
  title: string;
  description: string;
  source: string;
  createdAt?: string;
  href?: string;
  searchableText: string;
};

export type UnifiedSearchGroup = {
  key: UnifiedSearchResultType;
  label: string;
};

export type UnifiedSearchDataset = {
  captureSources: CaptureSourceById;
  tasks: Task[];
  taskSources: TaskSourceById;
  notes: Note[];
  inboxCaptures: QuickCapture[];
  timelineEvents: TimelineEvent[];
};

export type UnifiedSearchCounts = Record<UnifiedSearchResultType, number>;

export const UNIFIED_SEARCH_GROUPS: readonly UnifiedSearchGroup[] = [
  { key: "task", label: "Tasks" },
  { key: "note", label: "Notes" },
  { key: "inbox", label: "Inbox" },
  { key: "timeline", label: "Timeline" },
] as const;

function compactText(parts: readonly (string | undefined)[]): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function taskHref(task: Task): string {
  return `/app/tasks?filter=${task.status}&taskId=${encodeURIComponent(task.id)}`;
}

function taskSourceLabel(source: PrimaryTaskSource | undefined): string {
  if (source === "cloud") {
    return "Cloud task";
  }

  if (source === "local-fallback") {
    return "Local fallback task";
  }

  return "Local task";
}

function captureSourceLabel(source: PrimaryCaptureSource | undefined): string {
  if (source === "cloud") {
    return "Cloud inbox";
  }

  if (source === "local-fallback") {
    return "Local fallback";
  }

  return "Local inbox";
}

function timelineEventDescription(event: TimelineEvent): string {
  if (event.description) {
    return event.description;
  }

  return event.type
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Activity";
}

function taskToSearchResult(
  task: Task,
  source: PrimaryTaskSource | undefined,
): UnifiedSearchResult {
  const description = compactText([
    task.description,
    task.status,
    task.priority,
    task.dueDate ? `Due ${task.dueDate}` : undefined,
  ]);

  return {
    id: `task:${task.id}`,
    type: "task",
    title: task.title,
    description,
    source: taskSourceLabel(source),
    createdAt: task.createdAt,
    href: taskHref(task),
    searchableText: normalizeSearchText(
      compactText([
        task.title,
        task.description,
        task.status,
        task.priority,
        task.workspaceId,
        task.dueDate,
      ]),
    ),
  };
}

function noteToSearchResult(note: Note): UnifiedSearchResult {
  return {
    id: `note:${note.id}`,
    type: "note",
    title: note.title,
    description: note.content,
    source: "Local note",
    href: "/app/notes",
    searchableText: normalizeSearchText(
      compactText([note.title, note.content, note.type]),
    ),
  };
}

function inboxCaptureToSearchResult(
  capture: QuickCapture,
  source: PrimaryCaptureSource | undefined,
): UnifiedSearchResult {
  return {
    id: `inbox:${capture.id}`,
    type: "inbox",
    title: capture.text,
    description: "Inbox capture",
    source: captureSourceLabel(source),
    createdAt: capture.createdAt,
    href: "/app/inbox",
    searchableText: normalizeSearchText(capture.text),
  };
}

function timelineEventToSearchResult(
  event: TimelineEvent,
): UnifiedSearchResult {
  return {
    id: `timeline:${event.id}`,
    type: "timeline",
    title: event.title,
    description: timelineEventDescription(event),
    source: "Activity",
    createdAt: event.timestamp,
    href: "/app/timeline",
    searchableText: normalizeSearchText(
      compactText([event.title, event.type, timelineEventDescription(event)]),
    ),
  };
}

function sortResultsNewestFirst(
  results: readonly UnifiedSearchResult[],
): UnifiedSearchResult[] {
  return [...results].sort((a, b) => {
    const leftTimestamp = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const rightTimestamp = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    if (leftTimestamp !== rightTimestamp) {
      return rightTimestamp - leftTimestamp;
    }

    return a.title.localeCompare(b.title);
  });
}

export async function loadUnifiedSearchDataset(
  options: TasksApiRequestOptions = {},
): Promise<UnifiedSearchDataset> {
  const taskResult = await loadTasksFromPrimarySourceWithBoundary(options);
  const captureResult = await loadCapturesFromPrimarySourceWithBoundary(options);
  const timelineEvents = options.accessToken
    ? createTimelineEventsFromActivities(
        await fetchActivitiesViaApi(options).catch(() => []),
      )
    : [];

  return {
    captureSources: captureResult.captureSources,
    taskSources: taskResult.taskSources,
    tasks: taskResult.tasks,
    notes: getNotes(),
    inboxCaptures: captureResult.captures,
    timelineEvents,
  };
}

export function createUnifiedSearchResults(
  dataset: UnifiedSearchDataset,
): UnifiedSearchResult[] {
  return sortResultsNewestFirst([
    ...dataset.tasks.map((task) =>
      taskToSearchResult(task, dataset.taskSources[task.id]),
    ),
    ...dataset.notes.map(noteToSearchResult),
    ...dataset.inboxCaptures.map((capture) =>
      inboxCaptureToSearchResult(capture, dataset.captureSources[capture.id]),
    ),
    ...dataset.timelineEvents.map(timelineEventToSearchResult),
  ]);
}

export function searchUnifiedResults(
  results: readonly UnifiedSearchResult[],
  query: string,
): UnifiedSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  const queryTokens = normalizedQuery.split(" ");

  return results.filter((result) => {
    if (result.searchableText.includes(normalizedQuery)) {
      return true;
    }

    return queryTokens.every((token) => result.searchableText.includes(token));
  });
}

export function groupUnifiedSearchResults(
  results: readonly UnifiedSearchResult[],
): Record<UnifiedSearchResultType, UnifiedSearchResult[]> {
  return {
    task: results.filter((result) => result.type === "task"),
    note: results.filter((result) => result.type === "note"),
    inbox: results.filter((result) => result.type === "inbox"),
    timeline: results.filter((result) => result.type === "timeline"),
  };
}

export function getUnifiedSearchCounts(
  dataset: UnifiedSearchDataset,
): UnifiedSearchCounts {
  return {
    task: dataset.tasks.length,
    note: dataset.notes.length,
    inbox: dataset.inboxCaptures.length,
    timeline: dataset.timelineEvents.length,
  };
}
