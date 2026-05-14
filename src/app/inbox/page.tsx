"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Inbox, Loader2, Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import type { Task, TaskPriority, TaskStatus } from "@/types";

const TASKS_STORAGE_KEY = "personal-os.tasks";
const NOTES_STORAGE_KEY = "personal-os.notes";

const TASK_STATUSES: TaskStatus[] = ["todo", "in-progress", "done"];
const TASK_PRIORITIES: TaskPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

type NoteType = "note" | "idea" | "book" | "course" | "link";

type PersistedNote = {
  id: string;
  title: string;
  content: string;
  type: NoteType;
};

const NOTE_TYPES: NoteType[] = ["note", "idea", "book", "course", "link"];

type InboxItemType = "Reminder" | "Idea" | "Task" | "Note" | "Inbox item";

type ParseResult = {
  type: InboxItemType;
  suggestedTitle: string;
  priority: TaskPriority;
  workspace: string;
  aiSummary: string;
};

function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    (TASK_STATUSES as readonly string[]).includes(value)
  );
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return (
    typeof value === "string" &&
    (TASK_PRIORITIES as readonly string[]).includes(value)
  );
}

function isTaskRecord(value: unknown): value is Task {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.title !== "string") return false;
  if (!isTaskStatus(o.status) || !isTaskPriority(o.priority)) return false;
  if (typeof o.workspaceId !== "string" || typeof o.createdAt !== "string") {
    return false;
  }
  if (
    o.description !== undefined &&
    typeof o.description !== "string"
  ) {
    return false;
  }
  if (o.dueDate !== undefined && typeof o.dueDate !== "string") {
    return false;
  }
  return true;
}

function isNoteType(value: unknown): value is NoteType {
  return (
    typeof value === "string" &&
    (NOTE_TYPES as readonly string[]).includes(value)
  );
}

function isNoteRecord(value: unknown): value is PersistedNote {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.content === "string" &&
    isNoteType(o.type)
  );
}

function readTasksFromLocalStorage(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isTaskRecord);
  } catch {
    return [];
  }
}

function readNotesFromLocalStorage(): PersistedNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isNoteRecord);
  } catch {
    return [];
  }
}

function workspaceIdFromLabel(workspace: string): string {
  switch (workspace) {
    case "Personal":
      return "1";
    case "Work":
      return "2";
    case "Cars":
      return "3";
    case "Business":
      return "4";
    case "Knowledge":
      return "5";
    default:
      return "1";
  }
}

function noteTypeFromInboxType(
  inboxType: InboxItemType,
): Extract<NoteType, "idea" | "note"> {
  if (inboxType === "Idea") return "idea";
  return "note";
}

const exampleLines = [
  "remind me to change Infiniti oil next week",
  "schedule QA interview prep tomorrow",
  "idea: rehab center referral system",
  "save course about DevOps",
];

function detectItemType(text: string): InboxItemType {
  const t = text.toLowerCase();
  if (t.includes("remind")) return "Reminder";
  if (t.includes("idea")) return "Idea";
  if (t.includes("schedule")) return "Task";
  if (t.includes("save")) return "Note";
  return "Inbox item";
}

function detectWorkspace(text: string): string {
  if (/\binfiniti\b/i.test(text)) return "Cars";
  if (/\bqa\b/i.test(text)) return "Work";
  if (/\brehab\b/i.test(text)) return "Business";
  if (/\bdevops\b/i.test(text)) return "Knowledge";
  return "Personal";
}

function inferPriority(type: InboxItemType): TaskPriority {
  if (type === "Reminder" || type === "Task") return "high";
  if (type === "Idea" || type === "Note") return "medium";
  return "low";
}

function buildSuggestedTitle(raw: string): string {
  let s = raw.trim().replace(/\s+/g, " ");
  if (!s) return "Untitled capture";
  s = s
    .replace(/^(remind me to|remind me|reminder:?|remind:?)\s*/i, "")
    .replace(/^idea:?\s*/i, "")
    .replace(/^schedule:?\s*/i, "")
    .replace(/^save:?\s*/i, "")
    .replace(/^save\s+/i, "")
    .trim();
  if (!s) s = raw.trim();
  const shortened = s.length > 88 ? `${s.slice(0, 85)}…` : s;
  return (
    shortened.charAt(0).toUpperCase() + shortened.slice(1)
  );
}

function buildSummary(
  type: InboxItemType,
  workspace: string,
  title: string,
): string {
  const clip = title.length > 48 ? `${title.slice(0, 45)}…` : title;
  return `Interpreted as a ${type.toLowerCase()} and routed to your ${workspace} workspace from context signals. “${clip}” is structured and ready when you choose to create it.`;
}

function parseInboxInput(raw: string): ParseResult {
  const type = detectItemType(raw);
  const workspace = detectWorkspace(raw);
  const suggestedTitle = buildSuggestedTitle(raw);
  const priority = inferPriority(type);
  const aiSummary = buildSummary(type, workspace, suggestedTitle);
  return { type, suggestedTitle, priority, workspace, aiSummary };
}

export default function InboxPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [itemCreated, setItemCreated] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);

  const process = useCallback(() => {
    const text = input.trim();
    if (!text || processingRef.current) return;
    processingRef.current = true;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setLoading(true);
    setResult(null);
    setItemCreated(false);

    timeoutRef.current = setTimeout(() => {
      setResult(parseInboxInput(text));
      setLoading(false);
      processingRef.current = false;
      timeoutRef.current = null;
    }, 1000);
  }, [input]);

  function handleCreateItem() {
    if (typeof window === "undefined" || !result || itemCreated) return;

    const id = Date.now().toString();
    const createdAt = new Date().toISOString();

    try {
      if (result.type === "Task" || result.type === "Reminder") {
        const task: Task = {
          id,
          title: result.suggestedTitle,
          description: result.aiSummary,
          status: "todo",
          priority: result.priority,
          workspaceId: workspaceIdFromLabel(result.workspace),
          createdAt,
        };
        const tasks = readTasksFromLocalStorage();
        tasks.push(task);
        window.localStorage.setItem(
          TASKS_STORAGE_KEY,
          JSON.stringify(tasks),
        );
      } else if (
        result.type === "Idea" ||
        result.type === "Note" ||
        result.type === "Inbox item"
      ) {
        const note: PersistedNote = {
          id,
          title: result.suggestedTitle,
          content: result.aiSummary,
          type: noteTypeFromInboxType(result.type),
        };
        const notes = readNotesFromLocalStorage();
        notes.push(note);
        window.localStorage.setItem(
          NOTES_STORAGE_KEY,
          JSON.stringify(notes),
        );
      }

      setItemCreated(true);
      setInput("");
    } catch {
      /* ignore storage errors */
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      processingRef.current = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="relative overflow-hidden p-6 sm:p-10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.15),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-300/50 bg-violet-100 dark:border-violet-500/20 dark:bg-violet-500/10">
              <Inbox className="h-6 w-6 text-violet-700 dark:text-violet-300" aria-hidden />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                AI Inbox
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
                Dump thoughts, tasks, reminders, and ideas. Personal OS will
                organize them.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-zinc-200 bg-white/90 p-1 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03)] dark:backdrop-blur-sm">
            <div className="rounded-[calc(1rem-2px)] border border-zinc-200 bg-zinc-50/90 p-5 dark:border-zinc-800 dark:bg-black/40 sm:p-6">
              <label
                htmlFor="inbox-input"
                className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
                Capture
              </label>
              <textarea
                id="inbox-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={8}
                placeholder="Drop anything here — one thought per line is fine."
                className="mt-3 w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-950 placeholder:text-zinc-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-violet-500/40 dark:focus:ring-violet-500/20 sm:text-[15px]"
              />
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-500">
                <span className="font-medium text-zinc-700 dark:text-zinc-400">
                  Examples:
                </span>
              </p>
              <ul className="mt-2 space-y-1.5 font-mono text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-500 sm:text-xs">
                {exampleLines.map((line) => (
                  <li key={line} className="pl-1">
                    <span className="text-violet-600/80 dark:text-violet-500/80">
                      —
                    </span>{" "}
                    {line}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-zinc-600 dark:text-zinc-600">
                  Local preview — no data leaves your browser.
                </p>
                <button
                  type="button"
                  onClick={process}
                  disabled={loading || !input.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/25 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:pointer-events-none disabled:opacity-40 dark:shadow-violet-950/40"
                >
                  {loading ? (
                    <>
                      <Loader2
                        className="h-4 w-4 shrink-0 animate-spin"
                        aria-hidden
                      />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                      Process with AI
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div
              className="mt-8 rounded-2xl border border-dashed border-violet-300/60 bg-violet-50 px-6 py-10 text-center dark:border-violet-500/25 dark:bg-violet-950/10"
              aria-live="polite"
            >
              <Loader2
                className="mx-auto h-8 w-8 animate-spin text-violet-600 dark:text-violet-400"
                aria-hidden
              />
              <p className="mt-4 text-sm font-medium text-zinc-800 dark:text-zinc-300">
                Parsing intent and entities…
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-500">
                Building routing, workspace, and summary.
              </p>
            </div>
          ) : null}

          {!loading && result ? (
            <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 shadow-lg ring-1 ring-zinc-200 dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-950 dark:shadow-xl dark:ring-white/5">
              <div className="border-b border-zinc-200 bg-zinc-100/80 px-5 py-4 dark:border-zinc-800/80 dark:bg-zinc-900/50 sm:px-6">
                <p className="text-xs font-medium uppercase tracking-wider text-violet-700 dark:text-violet-400/90">
                  AI result
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Review before creating anything in your graph.
                </p>
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                <ResultRow label="Type" value={result.type} />
                <ResultRow
                  label="Suggested title"
                  value={result.suggestedTitle}
                />
                <ResultRow label="Priority" value={result.priority} />
                <ResultRow label="Workspace" value={result.workspace} />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    AI summary
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {result.aiSummary}
                  </p>
                </div>
              </div>
              <div className="border-t border-zinc-200 bg-zinc-50/80 px-5 py-4 dark:border-zinc-800/80 dark:bg-black/20 sm:px-6">
                <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-500">
                  Created items will appear in Tasks or Notes.
                </p>
                {itemCreated ? (
                  <p
                    className="mb-3 text-sm font-medium text-emerald-600 dark:text-emerald-400"
                    role="status"
                  >
                    Item created successfully
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handleCreateItem}
                  disabled={itemCreated}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white sm:w-auto sm:px-8"
                >
                  Create item
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
      <p className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 sm:w-36">
        {label}
      </p>
      <p className="text-sm font-medium text-zinc-950 dark:text-white">{value}</p>
    </div>
  );
}
