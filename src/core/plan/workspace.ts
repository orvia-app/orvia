import {
  blockingConflict,
  plannedTaskInterval,
  requireIanaTimeZone,
  requireLocalDate,
  requirePositiveDurationMinutes,
  requireUtcInstant,
  timedInterval,
  type BlockingConflict,
  type IanaTimeZone,
  type LocalDate,
  type ScheduleItem,
  type TimedInterval,
  type UtcInstant,
} from "@/core/schedule/domain";
import { localDateRange } from "@/core/schedule/projection";
import type { Task } from "@/types";

export type PlanTaskBlockSummary = Readonly<{
  id: string;
  taskId: string;
  startAt: UtcInstant;
  endAt: UtcInstant;
  version: number;
}>;

function nextLocalDate(date: LocalDate): LocalDate {
  return requireLocalDate(new Date(Date.parse(`${date}T12:00:00.000Z`) + 86_400_000)
    .toISOString().slice(0, 10));
}

export function selectStillToPlace(
  tasks: readonly Task[],
  blocks: readonly PlanTaskBlockSummary[],
  selectedDate: LocalDate,
): Task[] {
  const blockedTaskIds = new Set(blocks.map((block) => block.taskId));
  return tasks
    .filter((task) => (task.status === "todo" || task.status === "in-progress") &&
      !blockedTaskIds.has(task.id) && plannedTaskInterval(task) === null)
    .sort((a, b) => {
      const selectedRank = (task: Task) => task.planDay === selectedDate ? 0 : 1;
      return selectedRank(a) - selectedRank(b) ||
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
    });
}

function localMinute(instant: number, zone: IanaTimeZone): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function moveBlockDraftToInstant<T extends Readonly<{
  date: LocalDate;
  duration: string;
  exactStart: UtcInstant | null;
  time: string;
}>>(
  draft: T,
  instant: unknown,
  timezone: unknown,
): T {
  const start = requireUtcInstant(instant);
  const zone = requireIanaTimeZone(timezone);
  const local = localMinute(Date.parse(start), zone);
  return {
    ...draft,
    date: requireLocalDate(local.slice(0, 10)),
    time: local.slice(11),
    exactStart: start,
  };
}

export function localTimeCandidates(
  date: unknown,
  time: unknown,
  timezone: unknown,
): UtcInstant[] {
  const day = requireLocalDate(date);
  const zone = requireIanaTimeZone(timezone);
  if (typeof time !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return [];
  const range = localDateRange(day, nextLocalDate(day), zone);
  const target = `${day}T${time}`;
  const result: UtcInstant[] = [];
  for (let instant = Date.parse(range.start); instant < Date.parse(range.end); instant += 60_000) {
    if (localMinute(instant, zone) === target) {
      result.push(requireUtcInstant(new Date(instant).toISOString()));
    }
  }
  return result;
}

export function intervalFromDuration(start: unknown, durationMinutes: unknown): TimedInterval {
  const startAt = requireUtcInstant(start);
  const duration = requirePositiveDurationMinutes(durationMinutes);
  return timedInterval(startAt, requireUtcInstant(
    new Date(Date.parse(startAt) + duration * 60_000).toISOString(),
  ));
}

export type PlanConflict = Readonly<{
  conflict: BlockingConflict;
  item: ScheduleItem;
}>;

export function findPlanConflicts(
  candidate: ScheduleItem,
  items: readonly ScheduleItem[],
): PlanConflict[] {
  return items.flatMap((item) => {
    const conflict = blockingConflict(candidate, item);
    return conflict ? [{ conflict, item }] : [];
  });
}

export function taskBlockCandidate(
  task: Pick<Task, "id" | "title" | "workspaceId">,
  ownerId: string,
  interval: TimedInterval,
  blockId = `preview-${task.id}`,
): ScheduleItem {
  return {
    key: `task-block:${blockId}`,
    sourceId: task.id,
    ownerId,
    title: task.title,
    ...(task.workspaceId ? { workspaceId: task.workspaceId } : {}),
    busy: true,
    intelligenceEligible: false,
    sourceState: "unverified",
    source: "task",
    kind: "planned-task",
    blockId,
    interval,
  };
}
