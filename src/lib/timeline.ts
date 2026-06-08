import type { Activity } from "@/lib/activities-api";
import { translations, type TranslationKey } from "@/lib/i18n";

export type TimelineEvent = {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
};

type TimelineTranslator = (key: TranslationKey) => string;

type KnownTimelineActivityType =
  | "task_created"
  | "task_updated"
  | "task_completed"
  | "task_deleted"
  | "note_created"
  | "note_updated"
  | "note_deleted"
  | "inbox_processed"
  | "quick_capture_created"
  | "local_import_completed"
  | "system_event";

const KNOWN_ACTIVITY_TYPES = [
  "task_created",
  "task_updated",
  "task_completed",
  "task_deleted",
  "note_created",
  "note_updated",
  "note_deleted",
  "inbox_processed",
  "quick_capture_created",
  "local_import_completed",
  "system_event",
] as const satisfies readonly KnownTimelineActivityType[];

const ACTIVITY_TEXT_KEYS: Record<
  KnownTimelineActivityType,
  { title: TranslationKey; description: TranslationKey }
> = {
  inbox_processed: {
    title: "timeline.inboxProcessedTitle",
    description: "timeline.inboxProcessedDescription",
  },
  local_import_completed: {
    title: "timeline.localImportTitle",
    description: "timeline.localImportDescription",
  },
  note_created: {
    title: "timeline.noteCreatedTitle",
    description: "timeline.noteCreatedDescription",
  },
  note_deleted: {
    title: "timeline.noteDeletedTitle",
    description: "timeline.noteDeletedDescription",
  },
  note_updated: {
    title: "timeline.noteUpdatedTitle",
    description: "timeline.noteUpdatedDescription",
  },
  quick_capture_created: {
    title: "timeline.quickCaptureCreatedTitle",
    description: "timeline.quickCaptureCreatedDescription",
  },
  system_event: {
    title: "timeline.systemEventTitle",
    description: "timeline.systemEventDescription",
  },
  task_completed: {
    title: "timeline.taskCompletedTitle",
    description: "timeline.taskCompletedDescription",
  },
  task_created: {
    title: "timeline.taskCreatedTitle",
    description: "timeline.taskCreatedDescription",
  },
  task_deleted: {
    title: "timeline.taskDeletedTitle",
    description: "timeline.taskDeletedDescription",
  },
  task_updated: {
    title: "timeline.taskUpdatedTitle",
    description: "timeline.taskUpdatedDescription",
  },
};

function defaultTranslate(key: TranslationKey): string {
  return translations.en[key];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isKnownActivityType(value: string): value is KnownTimelineActivityType {
  return KNOWN_ACTIVITY_TYPES.includes(value as KnownTimelineActivityType);
}

function getInboxProcessedDescriptionKey(
  metadata: Record<string, unknown>,
): TranslationKey {
  if (metadata.outcome === "archived") {
    return "timeline.inboxProcessedArchivedDescription";
  }

  if (metadata.outcome === "task") {
    return "timeline.inboxProcessedTaskDescription";
  }

  if (metadata.outcome === "note") {
    return "timeline.inboxProcessedNoteDescription";
  }

  return "timeline.inboxProcessedDescription";
}

function getLocalizedActivityText(
  activity: Activity,
  translate: TimelineTranslator,
): { title: string; description?: string } {
  if (!isKnownActivityType(activity.type)) {
    return {
      title: activity.title.trim() || translate("timeline.genericActivity"),
      description: activity.description?.trim() || undefined,
    };
  }

  const textKeys = ACTIVITY_TEXT_KEYS[activity.type];
  const metadata = isRecord(activity.metadata) ? activity.metadata : {};
  const descriptionKey =
    activity.type === "inbox_processed"
      ? getInboxProcessedDescriptionKey(metadata)
      : textKeys.description;

  return {
    title: translate(textKeys.title),
    description: translate(descriptionKey),
  };
}

function sortTimelineEventsNewestFirst(
  events: readonly TimelineEvent[],
): TimelineEvent[] {
  return [...events].sort((a, b) => {
    const timestampDifference =
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

    if (timestampDifference !== 0) {
      return timestampDifference;
    }

    return a.title.localeCompare(b.title);
  });
}

export function createTimelineEventsFromActivities(
  activities: readonly Activity[],
  translate: TimelineTranslator = defaultTranslate,
): TimelineEvent[] {
  const events = activities.map((activity) => {
    const text = getLocalizedActivityText(activity, translate);

    return {
      id: activity.id,
      type: activity.type,
      title: text.title,
      description: text.description,
      timestamp: activity.occurredAt,
    };
  });

  return sortTimelineEventsNewestFirst(events);
}
