import type { CarRecord } from "@/lib/cars";
import type { Transaction } from "@/lib/finance";
import type { QuickCapture } from "@/lib/quick-captures";
import type { Note } from "@/lib/notes";
import type { Task } from "@/types";
import type {
  CarEntity,
  EntityId,
  EntityType,
  FinanceTransactionEntity,
  InboxItemEntity,
  NoteEntity,
  PersonalEntity,
  SearchableEntity,
  TaskEntity,
} from "@/lib/entities/types";

function makeEntityId<TType extends EntityType>(
  type: TType,
  id: string,
): EntityId<TType> {
  return `${type}:${id}`;
}

function compactText(parts: readonly (string | number | undefined)[]): string {
  return parts
    .filter((part): part is string | number => part !== undefined)
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join(" ");
}

export function getEntityTypeLabel(type: EntityType): string {
  switch (type) {
    case "task":
      return "Task";
    case "note":
      return "Note";
    case "finance_transaction":
      return "Finance";
    case "car":
      return "Car";
    case "inbox_item":
      return "Inbox";
  }
}

export function getEntityTitle(entity: PersonalEntity): string {
  return entity.title;
}

export function getEntitySubtitle(entity: PersonalEntity): string {
  return entity.subtitle ?? "";
}

export function getEntityUrl(entity: PersonalEntity): string {
  if (entity.metadata.url) {
    return entity.metadata.url;
  }

  switch (entity.type) {
    case "task":
      return "/tasks";
    case "note":
      return "/notes";
    case "finance_transaction":
      return "/finance";
    case "car":
      return "/cars";
    case "inbox_item":
      return "/inbox";
  }
}

export function taskToEntity(task: Task): TaskEntity {
  const subtitle = compactText([task.description, task.priority, task.status]);

  return {
    id: makeEntityId("task", task.id),
    type: "task",
    sourceId: task.id,
    title: task.title,
    subtitle,
    data: task,
    metadata: {
      createdAt: task.createdAt,
      workspaceId: task.workspaceId,
      source: "local",
      url: "/tasks",
      searchableText: compactText([
        task.title,
        task.description,
        task.priority,
        task.status,
        task.dueDate,
        task.workspaceId,
      ]),
    },
  };
}

export function noteToEntity(note: Note): NoteEntity {
  return {
    id: makeEntityId("note", note.id),
    type: "note",
    sourceId: note.id,
    title: note.title,
    subtitle: note.content,
    data: note,
    metadata: {
      source: "local",
      url: "/notes",
      searchableText: compactText([note.title, note.content, note.type]),
      memoryTags: [note.type],
    },
  };
}

export function transactionToEntity(
  transaction: Transaction,
): FinanceTransactionEntity {
  return {
    id: makeEntityId("finance_transaction", transaction.id),
    type: "finance_transaction",
    sourceId: transaction.id,
    title: transaction.category,
    subtitle: compactText([
      transaction.type,
      transaction.amount,
      transaction.currency,
      transaction.note,
    ]),
    data: transaction,
    metadata: {
      createdAt: transaction.createdAt,
      workspaceId: "finance",
      source: "local",
      url: "/finance",
      searchableText: compactText([
        transaction.category,
        transaction.type,
        transaction.amount,
        transaction.currency,
        transaction.note,
      ]),
    },
  };
}

export function carToEntity(car: CarRecord): CarEntity {
  return {
    id: makeEntityId("car", car.id),
    type: "car",
    sourceId: car.id,
    title: car.name,
    subtitle: compactText([car.owner, car.mileage, car.notes]),
    data: car,
    metadata: {
      workspaceId: "cars",
      source: "local",
      url: "/cars",
      searchableText: compactText([
        car.name,
        car.owner,
        car.mileage,
        car.notes,
      ]),
    },
  };
}

export function quickCaptureToEntity(capture: QuickCapture): InboxItemEntity {
  return {
    id: makeEntityId("inbox_item", capture.id),
    type: "inbox_item",
    sourceId: capture.id,
    title: capture.text,
    subtitle: capture.createdAt,
    data: capture,
    metadata: {
      createdAt: capture.createdAt,
      source: "local",
      url: "/inbox",
      searchableText: compactText([capture.text, capture.createdAt]),
    },
  };
}

export function toSearchableEntity(entity: PersonalEntity): SearchableEntity {
  return {
    id: entity.id,
    type: entity.type,
    title: getEntityTitle(entity),
    subtitle: getEntitySubtitle(entity),
    typeLabel: getEntityTypeLabel(entity.type),
    url: getEntityUrl(entity),
    searchableText: entity.metadata.searchableText.toLowerCase(),
    entity,
  };
}

export function filterSearchableEntities(
  entities: readonly SearchableEntity[],
  query: string,
): SearchableEntity[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return entities.filter((entity) =>
    entity.searchableText.includes(normalizedQuery),
  );
}
