import type { Note } from "@/lib/notes";
import type { Task } from "@/types";
import {
  filterSearchableEntities,
  noteToEntity,
  taskToEntity,
  toSearchableEntity,
} from "@/lib/entities/entity-utils";
import type { SearchableEntity } from "@/lib/entities/types";

export function createSearchableEntities(input: {
  tasks: readonly Task[];
  notes: readonly Note[];
}): SearchableEntity[] {
  return [
    ...input.tasks.map((task) => toSearchableEntity(taskToEntity(task))),
    ...input.notes.map((note) => toSearchableEntity(noteToEntity(note))),
  ];
}

export function searchEntities(
  entities: readonly SearchableEntity[],
  query: string,
): SearchableEntity[] {
  return filterSearchableEntities(entities, query);
}
