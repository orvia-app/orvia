import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  type SupabaseNoteInsert,
  type SupabaseNoteRow,
} from "@/lib/supabase";
import { NOTE_TYPES, type NoteType } from "@/lib/notes";
import { createSupabaseServerAuthClient } from "@/server/supabase/auth";

const NOTE_TITLE_MAX_LENGTH = 240;
const NOTE_CONTENT_MAX_LENGTH = 20000;
const NOTE_TAG_MAX_COUNT = 25;
const NOTE_TAG_MAX_LENGTH = 64;

type CreateNoteBody = {
  title?: unknown;
  content?: unknown;
  type?: unknown;
  tags?: unknown;
  metadata?: unknown;
};

type AuthenticatedUser =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

type ParsedNotePayload =
  | { ok: true; payload: SupabaseNoteInsert }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token, ...extraParts] = authorizationHeader.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || !token || extraParts.length > 0) {
    return null;
  }

  return token;
}

async function authenticateRequest(request: Request): Promise<AuthenticatedUser> {
  const accessToken = parseBearerToken(request.headers.get("authorization"));

  if (!accessToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Authentication is required." },
        { status: 401 },
      ),
    };
  }

  const supabase = createSupabaseServerAuthClient({ accessToken });
  const { data, error } = await supabase.auth.getUser();
  const userId = data.user?.id;

  if (error || !userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Authentication is invalid." },
        { status: 401 },
      ),
    };
  }

  return { ok: true, userId };
}

function parseNoteTitle(body: CreateNoteBody): string | null {
  if (typeof body.title !== "string") {
    return null;
  }

  const title = body.title.trim();

  if (title.length === 0 || title.length > NOTE_TITLE_MAX_LENGTH) {
    return null;
  }

  return title;
}

function parseNoteContent(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const content = value.trim();

  if (content.length === 0) {
    return null;
  }

  if (content.length > NOTE_CONTENT_MAX_LENGTH) {
    return undefined;
  }

  return content;
}

function isNoteType(value: unknown): value is NoteType {
  return typeof value === "string" && NOTE_TYPES.includes(value as NoteType);
}

function parseTags(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.length > NOTE_TAG_MAX_COUNT) {
    return undefined;
  }

  const tags: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return undefined;
    }

    const tag = item.trim();

    if (tag.length === 0 || tag.length > NOTE_TAG_MAX_LENGTH) {
      return undefined;
    }

    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags;
}

function parseMetadata(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  return value;
}

function parseCreateNotePayload(body: CreateNoteBody): ParsedNotePayload {
  const title = parseNoteTitle(body);

  if (!title) {
    return {
      ok: false,
      error: `Title is required and must be ${NOTE_TITLE_MAX_LENGTH} characters or fewer.`,
    };
  }

  const content = parseNoteContent(body.content);

  if (content === undefined && body.content !== undefined) {
    return {
      ok: false,
      error: `Content must be a string, null, or ${NOTE_CONTENT_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (body.type !== undefined && !isNoteType(body.type)) {
    return {
      ok: false,
      error: "Type must be one of: note, idea, book, course, link.",
    };
  }

  const tags = parseTags(body.tags);

  if (tags === undefined && body.tags !== undefined) {
    return {
      ok: false,
      error: "Tags must be an array of non-empty strings.",
    };
  }

  const metadata = parseMetadata(body.metadata);

  if (metadata === undefined && body.metadata !== undefined) {
    return {
      ok: false,
      error: "Metadata must be a JSON object.",
    };
  }

  const payload: SupabaseNoteInsert = {
    title,
    content: content ?? null,
    type: isNoteType(body.type) ? body.type : "note",
    tags: tags ?? [],
    source: "api",
    metadata: metadata ?? {},
  };

  return { ok: true, payload };
}

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch notes from Supabase.", error.message);

    return NextResponse.json(
      { ok: false, error: "Failed to fetch notes." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, notes: data ?? [] }, { status: 200 });
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { ok: false, error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  const parsedPayload = parseCreateNotePayload(body);

  if (!parsedPayload.ok) {
    return NextResponse.json(
      { ok: false, error: parsedPayload.error },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .insert({ ...parsedPayload.payload, user_id: auth.userId })
    .select("*")
    .returns<SupabaseNoteRow>()
    .single();

  if (error) {
    console.error("Failed to create note in Supabase.", error.message);

    return NextResponse.json(
      { ok: false, error: "Failed to create note." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, note: data }, { status: 201 });
}
