"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowRight,
  CheckSquare,
  FileText,
  Inbox,
  Loader2,
  Tags,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  noteTypeFromInboxType,
  parseInboxInput,
  workspaceIdFromLabel,
  type InboxParseResult,
} from "@/lib/inbox";
import {
  archiveInboxItem,
  convertInboxItemToNote,
  convertInboxItemToTask,
  type InboxProcessingResult,
} from "@/lib/inbox-processing";
import {
  getQuickCaptures,
  type QuickCapture,
} from "@/lib/quick-captures";
import {
  createQuickCaptureNote,
  createQuickCaptureTask,
} from "@/lib/quick-capture";

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
  const { session } = useAuthSession();
  const signedIn = Boolean(session?.access_token);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InboxParseResult | null>(null);
  const [itemCreated, setItemCreated] = useState(false);
  const [captures, setCaptures] = useState<QuickCapture[]>([]);
  const [processingCaptureId, setProcessingCaptureId] = useState<string | null>(
    null,
  );
  const [queueError, setQueueError] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<string | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const processingRef = useRef(false);

  const queuedCaptures = useMemo(
    () =>
      captures.map((capture) => ({
        capture,
        preview: parseInboxInput(capture.text),
      })),
    [captures],
  );

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

  async function handleCreateItem(): Promise<void> {
    if (!result || itemCreated) {
      return;
    }

    try {
      if (result.actionKind === "task") {
        await createQuickCaptureTask({
          title: result.suggestedTitle,
          description: result.summary,
          priority: result.priority,
          status: "todo",
          workspaceId: workspaceIdFromLabel(result.suggestedWorkspace),
          accessToken: session?.access_token,
        });
      } else {
        createQuickCaptureNote({
          title: result.suggestedTitle,
          content: result.summary,
          type: noteTypeFromInboxType(result.type),
        });
      }

      setItemCreated(true);
      setInput("");
    } catch {
      // ignore storage failures for now
    }
  }

  async function handleProcessQueuedCapture(
    capture: QuickCapture,
    action: "task" | "note" | "archive",
  ): Promise<void> {
    if (processingCaptureId) {
      return;
    }

    setProcessingCaptureId(capture.id);
    setQueueError(null);
    setQueueStatus(null);

    try {
      let processingResult: InboxProcessingResult;

      if (action === "task") {
        processingResult = await convertInboxItemToTask(capture, {
          accessToken: session?.access_token,
        });
      } else if (action === "note") {
        processingResult = convertInboxItemToNote(capture);
      } else {
        processingResult = archiveInboxItem(capture);
      }

      setCaptures(processingResult.remainingCaptures);

      if (processingResult.action === "task") {
        setQueueStatus(
          processingResult.source === "api"
            ? "Converted to task."
            : "Converted to local task.",
        );
      } else if (processingResult.action === "note") {
        setQueueStatus("Converted to note.");
      } else {
        setQueueStatus("Archived.");
      }
    } catch {
      setQueueError("Could not process this inbox item. Please try again.");
    } finally {
      setProcessingCaptureId(null);
    }
  }

  useEffect(() => {
    setCaptures(getQuickCaptures());

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
                Orvia Inbox
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
                Drop anything into your second brain. Orvia can preview how a
                capture may become a task or note later, using local
                deterministic rules for now.
              </p>
            </div>

            <Badge>Local-only queue</Badge>
          </div>

          <Card
            variant="ghost"
            className="mb-6 p-3 text-sm text-zinc-600 dark:text-zinc-400"
          >
            Inbox captures are local-only on this browser. Cloud sync is not
            enabled for Inbox yet.
            {signedIn
              ? " Converting to a task can use your cloud account; notes and the queue remain local for now."
              : " Sign in before converting captures you want saved as cloud tasks."}
          </Card>

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
                rows={4}
                className="min-h-32 w-full resize-y rounded-2xl bg-zinc-50 p-4 text-base leading-7 text-zinc-950 outline-none ring-1 ring-zinc-200/80 transition placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-300 dark:bg-black/70 dark:text-white dark:ring-zinc-800 dark:placeholder:text-zinc-600 dark:focus:ring-zinc-700"
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

          <section className="mt-8">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                  Processing queue
                </h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  Convert captured thoughts into tasks or notes, or archive
                  what no longer needs action. Queue storage is local-only.
                </p>
              </div>
              <Badge>{queuedCaptures.length} waiting</Badge>
            </div>

            {queueError ? (
              <div
                role="alert"
                className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200/70 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20"
              >
                {queueError}
              </div>
            ) : null}

            {queueStatus ? (
              <div
                role="status"
                className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
              >
                {queueStatus}
              </div>
            ) : null}

            {queuedCaptures.length === 0 ? (
              <EmptyState
                icon={Inbox}
                size="sm"
                title="Inbox zero"
                description="No captures are waiting. Drop a thought here or use + Capture when something needs a home."
              />
            ) : (
              <div className="space-y-3">
                {queuedCaptures.map(({ capture, preview }) => {
                  const processing = processingCaptureId === capture.id;
                  const disabled = processingCaptureId !== null;

                  return (
                    <Card key={capture.id} className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge>{preview.detectedType}</Badge>
                            <Badge variant={confidenceBadgeVariant(preview.confidence)}>
                              {preview.confidence.label} confidence
                            </Badge>
                            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">
                              {capture.createdAt.slice(0, 10)}
                            </span>
                          </div>

                          <h3 className="mt-3 text-base font-semibold text-zinc-950 dark:text-white">
                            {preview.suggestedTitle}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                            {capture.text}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge>{preview.suggestedWorkspace}</Badge>
                            {preview.suggestedTags.slice(0, 4).map((tag) => (
                              <Badge key={tag}>{tag}</Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                          <Button
                            type="button"
                            variant="secondary"
                            className="gap-2"
                            disabled={disabled}
                            onClick={() =>
                              void handleProcessQueuedCapture(capture, "task")
                            }
                          >
                            {processing ? (
                              <Loader2
                                className="h-4 w-4 animate-spin"
                                aria-hidden
                              />
                            ) : (
                              <CheckSquare className="h-4 w-4" aria-hidden />
                            )}
                            Convert to Task
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="gap-2"
                            disabled={disabled}
                            onClick={() =>
                              void handleProcessQueuedCapture(capture, "note")
                            }
                          >
                            <FileText className="h-4 w-4" aria-hidden />
                            Convert to Note
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="gap-2"
                            disabled={disabled}
                            onClick={() =>
                              void handleProcessQueuedCapture(
                                capture,
                                "archive",
                              )
                            }
                          >
                            <Archive className="h-4 w-4" aria-hidden />
                            Archive
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
