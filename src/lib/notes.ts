import { createLocalEntityRepository } from "@/core/repositories/local-json-repository";
import { STORAGE_KEYS } from "@/lib/storage";

export type NoteType = "note" | "idea" | "book" | "course" | "link";

export type Note = {
  id: string;
  title: string;
  content: string;
  type: NoteType;
};

export const NOTE_TYPES: readonly NoteType[] = [
  "note",
  "idea",
  "book",
  "course",
  "link",
];

const LEGACY_DEMO_NOTES: readonly Note[] = [
  {
    id: "1",
    title: "Orvia idea",
    content: "Add AI weekly review and Telegram reminders.",
    type: "idea",
  },
  {
    id: "2",
    title: "DevOps course",
    content: "Track Docker, Kubernetes, CI/CD learning progress.",
    type: "course",
  },
  {
    id: "3",
    title: "Book list",
    content: "Atomic Habits, Deep Work, The Psychology of Money.",
    type: "book",
  },
];

export function isNote(value: unknown): value is Note {
  if (!value || typeof value !== "object") {
    return false;
  }

  const note = value as Partial<Note>;

  return (
    typeof note.id === "string" &&
    typeof note.title === "string" &&
    note.title.trim().length > 0 &&
    typeof note.content === "string" &&
    note.content.trim().length > 0 &&
    NOTE_TYPES.includes(note.type as NoteType)
  );
}

export const noteRepository = createLocalEntityRepository<Note>({
  key: STORAGE_KEYS.notes,
  validate: isNote,
});

function isLegacyDemoNote(note: Note): boolean {
  return LEGACY_DEMO_NOTES.some((demoNote) => {
    return (
      note.id === demoNote.id &&
      note.title === demoNote.title &&
      note.content === demoNote.content &&
      note.type === demoNote.type
    );
  });
}

function removeLegacyDemoNotes(notes: Note[]): Note[] {
  return notes.filter((note) => !isLegacyDemoNote(note));
}

export function getNotes(): Note[] {
  return removeLegacyDemoNotes(noteRepository.list());
}

export function getStoredNotes(): Note[] {
  return removeLegacyDemoNotes(noteRepository.list());
}

export function saveNotes(notes: Note[]): void {
  noteRepository.save(removeLegacyDemoNotes(notes));
}

export function createNote(note: Note): Note[] {
  const notes = getNotes();
  const nextNotes = [note, ...notes];

  saveNotes(nextNotes);

  return nextNotes;
}
