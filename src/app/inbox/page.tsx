"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Inbox, Loader2, Tags } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
  "Remind me to call John tomorrow",
  "Research Infiniti suspension setup",
  "Idea for rehab center onboarding",
];

function confidenceBadgeVariant(confidence: InboxParseResult["confidence"]) {
  if (confidence.label === "high") {
    return "success";
  }

  if (confidence.label === "medium") {
    return "warning";
  }

  return "default";
}

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
      if (result.actionKind === "task") {
        const newTask: Task = {
          id: Date.now().toString(),
          title: result.suggestedTitle,
          description: result.summary,
          priority: result.priority,
          status: "todo",
          workspaceId: workspaceIdFromLabel(result.suggestedWorkspace),
          createdAt: new Date().toISOString(),
        };

        createTask(newTask);
      } else {
        const newNote: Note = {
          id: Date.now().toString(),
          title: result.suggestedTitle,
          content: result.summary,
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
      <main className="px-4 py-6 sm:p-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm shadow-zinc-950/[0.03] ring-1 ring-zinc-200/80 dark:bg-zinc-950 dark:text-zinc-400 dark:shadow-none dark:ring-zinc-800">
                Universal capture
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Archflow Inbox
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
                Drop anything into your second brain. Archflow can preview how a
                capture may become a task or note later, using local
                deterministic rules for now.
              </p>
            </div>

            <Badge>Local parser</Badge>
          </div>

          <Card className="p-0">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800">
                  <Inbox className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                    Capture
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                    Thoughts, reminders, research, car notes, finance context,
                    and loose ideas can start here.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Remind me to call John tomorrow"
                rows={7}
                className="w-full resize-y rounded-2xl bg-zinc-50 p-4 text-base leading-7 text-zinc-950 outline-none ring-1 ring-zinc-200/80 transition placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-300 dark:bg-black/70 dark:text-white dark:ring-zinc-800 dark:placeholder:text-zinc-600 dark:focus:ring-zinc-700"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {exampleLines.map((line) => (
                  <button
                    key={line}
                    type="button"
                    onClick={() => setInput(line)}
                    className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200/70 transition hover:bg-white hover:text-zinc-950 hover:ring-zinc-300 dark:bg-zinc-900/45 dark:text-zinc-400 dark:ring-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-white dark:hover:ring-zinc-700"
                  >
                    {line}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  Preview is local and deterministic. No AI call is made, and
                  you choose whether to create the task or note.
                </p>

                <Button
                  type="button"
                  onClick={handleProcess}
                  disabled={loading || input.trim().length === 0}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Analyzing
                    </>
                  ) : (
                    <>
                      Analyze capture
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {result ? (
            <Card className="mt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                    Capture preview
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    Structured by the deterministic parser. Review before
                    creating anything.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge>{result.source}</Badge>
                  <Badge variant={confidenceBadgeVariant(result.confidence)}>
                    {result.confidence.label} confidence ·{" "}
                    {result.confidence.score}%
                  </Badge>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-zinc-100/60 p-4 dark:bg-zinc-900/40">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                    Title
                  </p>
                  <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-white">
                    {result.suggestedTitle}
                  </p>
                </div>

                <div className="rounded-xl bg-zinc-100/60 p-4 dark:bg-zinc-900/40">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                    Detected type
                  </p>
                  <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-white">
                    {result.detectedType}
                  </p>
                </div>

                <div className="rounded-xl bg-zinc-100/60 p-4 dark:bg-zinc-900/40">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                    Suggested workspace
                  </p>
                  <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-white">
                    {result.suggestedWorkspace}
                  </p>
                </div>

                <div className="rounded-xl bg-zinc-100/60 p-4 dark:bg-zinc-900/40">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                    Suggested tags
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.suggestedTags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-zinc-100/60 p-4 dark:bg-zinc-900/40">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                  <Tags className="h-3.5 w-3.5" aria-hidden />
                  Summary
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  {result.summary}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {itemCreated ? (
                  <div
                    role="status"
                    className="text-sm font-medium text-emerald-600 dark:text-emerald-400"
                  >
                    Item created successfully.
                  </div>
                ) : (
                  <div />
                )}

                <Button
                  type="button"
                  variant="secondary"
                  disabled={itemCreated}
                  onClick={handleCreateItem}
                >
                  Create {result.actionKind}
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
