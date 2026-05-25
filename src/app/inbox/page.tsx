"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Inbox, Loader2, Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import {
  noteTypeFromInboxType,
  parseInboxInput,
  workspaceIdFromLabel,
  type InboxParseResult,
} from "@/lib/inbox";
import { createNote, type Note } from "@/lib/notes";
import { createTask } from "@/lib/tasks";
import type { Task } from "@/types";

const exampleLines = [
  "remind me to change Infiniti oil next week",
  "schedule QA interview prep tomorrow",
  "idea: rehab center referral system",
  "save course about DevOps",
];

export default function InboxPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InboxParseResult | null>(null);
  const [itemCreated, setItemCreated] = useState(false);

  const timeoutRef = useRef<number | null>(null);
  const processingRef = useRef(false);

  const handleProcess = useCallback(() => {
    const trimmedInput = input.trim();

    if (!trimmedInput || processingRef.current) {
      return;
    }

    processingRef.current = true;

    setLoading(true);
    setResult(null);
    setItemCreated(false);

    const parseResult = parseInboxInput(trimmedInput);

    timeoutRef.current = window.setTimeout(() => {
      setResult(parseResult);
      setLoading(false);
      processingRef.current = false;
    }, 1000);
  }, [input]);

  function handleCreateItem(): void {
    if (!result || itemCreated) {
      return;
    }

    try {
      if (result.type === "Task" || result.type === "Reminder") {
        const newTask: Task = {
          id: Date.now().toString(),
          title: result.suggestedTitle,
          description: result.aiSummary,
          priority: result.priority,
          status: "todo",
          workspaceId: workspaceIdFromLabel(result.workspace),
          createdAt: new Date().toISOString(),
        };

        createTask(newTask);
      } else {
        const newNote: Note = {
          id: Date.now().toString(),
          title: result.suggestedTitle,
          content: result.aiSummary,
          type: noteTypeFromInboxType(result.type),
        };

        createNote(newNote);
      }

      setItemCreated(true);
      setInput("");
    } catch {
      // ignore storage failures for now
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <AppShell>
      <main className="relative overflow-hidden p-6 sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.15),transparent_40%)]" />

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-10">
            <div className="mb-4 inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1 text-sm text-violet-300">
              AI Inbox
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
              Capture anything
            </h1>

            <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
              Drop thoughts, reminders, ideas, and tasks into your AI operating
              system.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-2xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="flex items-center gap-3">
              <Inbox className="h-5 w-5 text-violet-400" />

              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Quick capture
              </span>
            </div>

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Write anything..."
              rows={6}
              className="mt-4 w-full resize-none rounded-2xl border border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-950 outline-none transition focus:border-violet-500 dark:border-zinc-800 dark:bg-black dark:text-white"
            />

            <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-4 dark:border-zinc-800">
              <div className="space-y-2 font-mono text-sm text-zinc-500 dark:text-zinc-400">
                {exampleLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Created items will appear in Tasks or Notes.
              </p>

              <button
                type="button"
                onClick={handleProcess}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Process with AI
                  </>
                )}
              </button>
            </div>
          </div>

          {result ? (
            <div className="mt-8 rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-2xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
                  AI Result
                </h2>

                <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                  {result.type}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Suggested title
                  </div>

                  <div className="mt-2 text-sm font-medium text-zinc-900 dark:text-white">
                    {result.suggestedTitle}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Workspace
                  </div>

                  <div className="mt-2 text-sm font-medium text-zinc-900 dark:text-white">
                    {result.workspace}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Priority
                  </div>

                  <div className="mt-2 text-sm font-medium text-zinc-900 dark:text-white">
                    {result.priority}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    AI summary
                  </div>

                  <div className="mt-2 text-sm font-medium text-zinc-900 dark:text-white">
                    {result.aiSummary}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {itemCreated ? (
                  <div
                    role="status"
                    className="text-sm font-medium text-emerald-500"
                  >
                    Item created successfully.
                  </div>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  disabled={itemCreated}
                  onClick={handleCreateItem}
                  className="rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  Create item
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
