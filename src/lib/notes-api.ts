import {
  createNote,
  getNotes,
  NOTE_TYPES,
  saveNotes,
  type Note,
  type NoteType,
} from "@/lib/notes";

type ApiNoteRow = {
  id?: unknown;
  title?: unknown;
  content?: unknown;
  type?: unknown;
};

type CreateNoteApiResponse = {
  ok?: unknown;
  note?: unknown;
  error?: unknown;
};

type DeleteNoteApiResponse = {
  ok?: unknown;
  error?: unknown;
};

type ListNotesApiResponse = {
  ok?: unknown;
  notes?: unknown;
  error?: unknown;
};

export type CreateNoteApiInput = {
  title: string;
  content?: string | null;
  type?: NoteType;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export type UpdateNoteApiInput = Partial<CreateNoteApiInput>;

export type NotesApiRequestOptions = {
  accessToken?: string;
};

export type PrimaryNoteSource = "cloud" | "local-fallback" | "local-only";

export type NoteSourceById = Record<string, PrimaryNoteSource>;

export type LoadNotesResult = {
  noteSources: NoteSourceById;
  notes: Note[];
  source: PrimaryNoteSource;
};

export type CreateNoteFromPrimarySourceResult = {
  note: Note;
  source: "api" | "local";
};

export function mergeApiNotesWithLocalNotes(
  apiNotes: Note[],
  localNotes: Note[],
): Note[] {
  const apiNoteIds = new Set(apiNotes.map((note) => note.id));
  const localOnlyNotes = localNotes.filter((note) => !apiNoteIds.has(note.id));

  return [...apiNotes, ...localOnlyNotes];
}

function createNoteSourceMap(
  notes: readonly Note[],
  source: PrimaryNoteSource,
): NoteSourceById {
  const sources: NoteSourceById = {};

  for (const note of notes) {
    sources[note.id] = source;
  }

  return sources;
}

function createMergedNoteSourceMap(
  apiNotes: readonly Note[],
  mergedNotes: readonly Note[],
): NoteSourceById {
  const apiNoteIds = new Set(apiNotes.map((note) => note.id));
  const sources: NoteSourceById = {};

  for (const note of mergedNotes) {
    sources[note.id] = apiNoteIds.has(note.id) ? "cloud" : "local-only";
  }

  return sources;
}

function createLocalFallbackNote(input: CreateNoteApiInput): Note {
  const note: Note = {
    id: crypto.randomUUID(),
    title: input.title,
    content: input.content?.trim() ?? "",
    type: input.type ?? "note",
  };

  createNote(note);

  return note;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNoteType(value: unknown): value is NoteType {
  return typeof value === "string" && NOTE_TYPES.includes(value as NoteType);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getAuthorizationHeaders(
  options: NotesApiRequestOptions = {},
): HeadersInit | undefined {
  const accessToken = options.accessToken?.trim();

  if (!accessToken) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function mapApiNoteToNote(row: ApiNoteRow): Note | null {
  const id = optionalString(row.id);
  const title = optionalString(row.title);

  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    content: optionalString(row.content) ?? "",
    type: isNoteType(row.type) ? row.type : "note",
  };
}

function parseNoteResponse(value: unknown): Note | null {
  if (!isRecord(value)) {
    return null;
  }

  const response: CreateNoteApiResponse = value;

  if (response.ok !== true || !isRecord(response.note)) {
    return null;
  }

  return mapApiNoteToNote(response.note);
}

function parseDeleteNoteResponse(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const response: DeleteNoteApiResponse = value;

  return response.ok === true;
}

function parseListNotesResponse(value: unknown): Note[] | null {
  if (!isRecord(value)) {
    return null;
  }

  const response: ListNotesApiResponse = value;

  if (response.ok !== true || !Array.isArray(response.notes)) {
    return null;
  }

  const mappedNotes = response.notes.map((note) =>
    isRecord(note) ? mapApiNoteToNote(note) : null,
  );

  if (mappedNotes.some((note) => note === null)) {
    return null;
  }

  const notesById = new Map<string, Note>();

  for (const note of mappedNotes) {
    if (note && !notesById.has(note.id)) {
      notesById.set(note.id, note);
    }
  }

  return Array.from(notesById.values());
}

export async function fetchNotesViaApi(
  options: NotesApiRequestOptions = {},
): Promise<Note[]> {
  const response = await fetch("/api/notes", {
    method: "GET",
    cache: "no-store",
    headers: getAuthorizationHeaders(options),
  });

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("Notes response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Notes request failed.");
  }

  const notes = parseListNotesResponse(responseBody);

  if (!notes) {
    throw new Error("Notes response shape was invalid.");
  }

  return notes;
}

export async function loadNotesFromPrimarySource(
  options: NotesApiRequestOptions = {},
): Promise<Note[]> {
  const result = await loadNotesFromPrimarySourceWithBoundary(options);

  return result.notes;
}

export async function loadNotesFromPrimarySourceWithBoundary(
  options: NotesApiRequestOptions = {},
): Promise<LoadNotesResult> {
  if (!options.accessToken?.trim()) {
    const notes = getNotes();

    return {
      noteSources: createNoteSourceMap(notes, "local-only"),
      notes,
      source: "local-only",
    };
  }

  try {
    const apiNotes = await fetchNotesViaApi(options);
    const mergedNotes = mergeApiNotesWithLocalNotes(apiNotes, getNotes());

    saveNotes(mergedNotes);

    return {
      noteSources: createMergedNoteSourceMap(apiNotes, mergedNotes),
      notes: mergedNotes,
      source: "cloud",
    };
  } catch {
    const notes = getNotes();

    return {
      noteSources: createNoteSourceMap(notes, "local-fallback"),
      notes,
      source: "local-fallback",
    };
  }
}

export async function createNoteViaApi(
  input: CreateNoteApiInput,
  options: NotesApiRequestOptions = {},
): Promise<Note> {
  const response = await fetch("/api/notes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthorizationHeaders(options),
    },
    body: JSON.stringify(input),
  });

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("Note create response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Note create request failed.");
  }

  const note = parseNoteResponse(responseBody);

  if (!note) {
    throw new Error("Note create response shape was invalid.");
  }

  return note;
}

export async function updateNoteViaApi(
  noteId: string,
  input: UpdateNoteApiInput,
  options: NotesApiRequestOptions = {},
): Promise<Note> {
  const response = await fetch(`/api/notes/${encodeURIComponent(noteId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthorizationHeaders(options),
    },
    body: JSON.stringify(input),
  });

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("Note update response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Note update request failed.");
  }

  const note = parseNoteResponse(responseBody);

  if (!note) {
    throw new Error("Note update response shape was invalid.");
  }

  return note;
}

export async function deleteNoteViaApi(
  noteId: string,
  options: NotesApiRequestOptions = {},
): Promise<void> {
  const response = await fetch(`/api/notes/${encodeURIComponent(noteId)}`, {
    method: "DELETE",
    headers: getAuthorizationHeaders(options),
  });

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("Note delete response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Note delete request failed.");
  }

  if (!parseDeleteNoteResponse(responseBody)) {
    throw new Error("Note delete response shape was invalid.");
  }
}

export async function createNoteFromPrimarySource(
  input: CreateNoteApiInput,
  options: NotesApiRequestOptions = {},
): Promise<CreateNoteFromPrimarySourceResult> {
  if (!options.accessToken?.trim()) {
    const note = createLocalFallbackNote(input);

    return { note, source: "local" };
  }

  try {
    const note = await createNoteViaApi(input, options);
    const nextNotes = mergeApiNotesWithLocalNotes([note], getNotes());

    saveNotes(nextNotes);

    return { note, source: "api" };
  } catch {
    const note = createLocalFallbackNote(input);

    return { note, source: "local" };
  }
}
