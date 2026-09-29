"use client";
import { ActionPopover } from "@/components/ui/ActionPopover";
import { Textarea } from "@/components/ui/Field";


import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowRight,
  CheckSquare,
  FileText,
  Inbox,
  Loader2,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Page, PageHeader, PageSection, PageSectionHeader } from "@/components/ui/Page";
import { inboxTypeLabelKeys, inboxWorkspaceLabelKeys } from "@/lib/inbox-presentation";
import { getWorkspaceKey } from "@/lib/workspaces/workspaces";
import {
  loadCapturesFromPrimarySourceWithBoundary,
  type CaptureSourceById,
  type PrimaryCaptureSource,
} from "@/lib/captures-api";
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
import type { QuickCapture } from "@/lib/quick-captures";
import {
  createQuickCaptureNote,
  createQuickCaptureTask,
} from "@/lib/quick-capture";
import { ORVIA_CAPTURE_CREATED_EVENT } from "@/lib/capture-events";

type ProcessingCaptureAction = {
  action: "archive" | "note" | "task";
  captureId: string;
};

function captureSourceLabel(
  source: PrimaryCaptureSource,
  t: ReturnType<typeof useI18n>["t"],
): string {
  if (source === "cloud") {
    return t("common.account");
  }

  if (source === "local-fallback") {
    return t("common.device");
  }

  return t("common.device");
}

export default function InboxPage() {
  const { loading: authLoading, session } = useAuthSession();
  const { t } = useI18n();
  const accessToken = session?.access_token;
  const ownerId = session?.user.id;
  const signedIn = Boolean(accessToken);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InboxParseResult | null>(null);
  const [itemCreated, setItemCreated] = useState(false);
  const [captures, setCaptures] = useState<QuickCapture[]>([]);
  const [captureSource, setCaptureSource] =
    useState<PrimaryCaptureSource>("local-only");
  const [captureSourcesById, setCaptureSourcesById] =
    useState<CaptureSourceById>({});
  const [processingCaptureAction, setProcessingCaptureAction] =
    useState<ProcessingCaptureAction | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<string | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const processingRef = useRef(false);

  const queuedCaptures = useMemo(
    () =>
      captures.map((capture) => ({
        capture,
        preview: parseInboxInput(capture.text),
        source: captureSourcesById[capture.id] ?? captureSource,
      })),
    [captureSource, captureSourcesById, captures],
  );
  const hasLocalFallbackCaptures = useMemo(
    () =>
      Object.values(captureSourcesById).some(
        (source) => source === "local-fallback",
      ),
    [captureSourcesById],
  );
  const exampleLines = [
    t("inbox.example1"),
    t("inbox.example2"),
    t("inbox.example3"),
  ];

  const inboxBoundaryMessage = signedIn
    ? hasLocalFallbackCaptures
      ? t("inbox.deviceOnlyWarning")
      : captureSource === "local-fallback"
      ? t("source.inboxFallback")
      : t("source.savedAccount")
    : t("source.inboxDevice");

  const queueDescription =
    hasLocalFallbackCaptures
      ? t("inbox.queueDeviceOnly")
      : captureSource === "local-fallback"
      ? t("inbox.queueFallback")
      : signedIn
        ? t("inbox.queueCloud")
        : t("inbox.queueDevice");

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
          accessToken,
          ownerId,
        });
      } else {
        await createQuickCaptureNote({
          accessToken,
          ownerId,
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
    if (processingCaptureAction) {
      return;
    }

    setProcessingCaptureAction({ action, captureId: capture.id });
    setQueueError(null);
    setQueueStatus(null);

    try {
      let processingResult: InboxProcessingResult;
      const selectedCaptureSource =
        captureSourcesById[capture.id] ?? captureSource;

      if (action === "task") {
        processingResult = await convertInboxItemToTask(capture, {
          accessToken,
          captureSource: selectedCaptureSource,
          ownerId,
        });
      } else if (action === "note") {
        processingResult = await convertInboxItemToNote(capture, {
          accessToken,
          captureSource: selectedCaptureSource,
          ownerId,
        });
      } else {
        processingResult = await archiveInboxItem(capture, {
          accessToken,
          captureSource: selectedCaptureSource,
          ownerId,
        });
      }

      setCaptures(processingResult.remainingCaptures);

      if (processingResult.action === "task") {
        setQueueStatus(
          processingResult.source === "api"
            ? t("inbox.convertedTask")
            : selectedCaptureSource === "cloud"
              ? t("inbox.convertedTaskFallback")
              : t("inbox.convertedTaskDevice"),
        );
      } else if (processingResult.action === "note") {
        setQueueStatus(
          processingResult.source === "api"
            ? t("inbox.convertedNote")
            : selectedCaptureSource === "cloud"
              ? t("inbox.convertedNoteFallback")
              : t("inbox.convertedNoteDevice"),
        );
      } else {
        setQueueStatus(t("inbox.archived"));
      }
    } catch {
      setQueueError(t("inbox.processError"));
    } finally {
      setProcessingCaptureAction(null);
    }
  }

  useEffect(() => {
    if (authLoading) {
      return undefined;
    }

    let active = true;

    async function loadCaptures(): Promise<void> {
      const result = await loadCapturesFromPrimarySourceWithBoundary({
        accessToken,
        ownerId,
      });

      if (!active) {
        return;
      }

      setCaptures(result.captures);
      setCaptureSource(result.source);
      setCaptureSourcesById(result.captureSources);
    }

    void loadCaptures();

    function handleCaptureCreated(): void {
      void loadCaptures();
    }

    window.addEventListener(ORVIA_CAPTURE_CREATED_EVENT, handleCaptureCreated);

    return () => {
      active = false;
      window.removeEventListener(
        ORVIA_CAPTURE_CREATED_EVENT,
        handleCaptureCreated,
      );

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [accessToken, authLoading, ownerId]);

  useEffect(() => {
    if (!queueStatus) return;
    const timer = window.setTimeout(() => setQueueStatus(null), 6000);
    return () => window.clearTimeout(timer);
  }, [queueStatus]);

  return (
    <AppShell>
      <Page>
        <PageHeader
          icon={Inbox}
          title={t("inbox.title")}
          description={t("inbox.workflow")}
        />

        <Card
          variant="ghost"
          className="mt-3 px-0 py-1 text-xs leading-5 text-muted"
        >
          {inboxBoundaryMessage}
          {signedIn
            ? ` ${t("inbox.processingMoves")}`
            : ` ${t("inbox.signInBeforeProcessing")}`}
        </Card>

        <PageSection>
          <PageSectionHeader
            title={t("inbox.waitingToProcess")}
            description={queueDescription}
            actions={<Badge>{t("inbox.waitingCount").replace("{count}", String(queuedCaptures.length))}</Badge>}
          />

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
              className="orvia-feedback mb-3"
            >
              {queueStatus}
            </div>
          ) : null}

          {queuedCaptures.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={t("inbox.zeroTitle")}
              description={t("inbox.zeroDescription")}
            />
          ) : (
            <div className="space-y-3">
              {queuedCaptures.map(({ capture, preview, source }) => {
                const processingTask =
                  processingCaptureAction?.captureId === capture.id &&
                  processingCaptureAction.action === "task";
                const processingNote =
                  processingCaptureAction?.captureId === capture.id &&
                  processingCaptureAction.action === "note";
                const processingArchive =
                  processingCaptureAction?.captureId === capture.id &&
                  processingCaptureAction.action === "archive";
                const disabled = processingCaptureAction !== null;

                return (
                  <Card variant="row" key={capture.id} className="orvia-item px-3 py-4" data-pending={processingTask || processingNote || processingArchive}>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <details className="group">
                          <summary className="cursor-pointer text-base font-semibold text-foreground marker:text-muted">{preview.suggestedTitle}</summary>
                          {capture.text !== preview.suggestedTitle && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted">{capture.text}</p>}
                          <p className="mt-2 text-xs text-muted">{t(inboxTypeLabelKeys[preview.detectedType])} · {captureSourceLabel(source, t)} · {capture.createdAt.slice(0, 10)} · {t(inboxWorkspaceLabelKeys[getWorkspaceKey(preview.suggestedWorkspace)])}</p>
                        </details>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
                        <Button
                          type="button"
                          variant="secondary"
                          className="gap-2"
                          disabled={disabled}
                          onClick={() =>
                            void handleProcessQueuedCapture(capture, "task")
                          }
                        >
                          {processingTask ? (
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden
                            />
                          ) : (
                            <CheckSquare className="h-4 w-4" aria-hidden />
                          )}
                          {t("inbox.convertTask")}
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
                          {processingNote ? (
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden
                            />
                          ) : (
                            <FileText className="h-4 w-4" aria-hidden />
                          )}
                          {t("inbox.convertNote")}
                        </Button>
                        <ActionPopover label={`${t("common.actions")}: ${preview.suggestedTitle}`}>
                          {(close) => <button type="button" className="orvia-menu-action" disabled={disabled} onClick={() => { close(); void handleProcessQueuedCapture(capture, "archive"); }}><Archive className="h-4 w-4" aria-hidden />{t("inbox.archive")}</button>}
                        </ActionPopover>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </PageSection>

        <details className="mt-7 border-t border-line py-4">
          <summary className="cursor-pointer text-sm font-medium text-muted marker:text-accent">{t("inbox.addTitle")}</summary>
          <div className="pt-4">
          <p className="mb-3 text-sm text-muted">{t("inbox.addDescription")}</p>
          <div>
            <Textarea
              aria-label={t("inbox.addTitle")}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("inbox.example1")}
              rows={4}
              className="min-h-32 w-full"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {exampleLines.map((line) => (
                <button
                  key={line}
                  type="button"
                  onClick={() => setInput(line)}
                  className="rounded-full bg-subtle px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-line transition hover:bg-surface hover:text-zinc-950 hover:ring-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white dark:hover:ring-zinc-700"
                >
                  {line}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-sm leading-6 text-muted">
                {t("inbox.previewNote")}
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
                    {t("inbox.previewing")}
                  </>
                ) : (
                  <>
                    {t("inbox.previewCapture")}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </Button>
            </div>
          </div>
          </div>
        </details>

        {result ? (
          <Card className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {t("inbox.capturePreview")}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {t("inbox.capturePreviewDescription")}
                </p>
              </div>

              <p className="text-xs text-muted">{t("inbox.ruleBased")}</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="min-w-0 rounded-xl bg-subtle p-4">
                <p className="text-xs font-medium text-muted">
                  {t("common.title")}
                </p>
                <p className="mt-2 break-words text-sm font-medium text-foreground">
                  {result.suggestedTitle}
                </p>
              </div>

              <div className="min-w-0 rounded-xl bg-subtle p-4">
                <p className="text-xs font-medium text-muted">
                  {t("inbox.detectedType")}
                </p>
                <p className="mt-2 break-words text-sm font-medium text-foreground">
                  {t(inboxTypeLabelKeys[result.detectedType])}
                </p>
              </div>

              <div className="min-w-0 rounded-xl bg-subtle p-4">
                <p className="text-xs font-medium text-muted">
                  {t("inbox.suggestedWorkspace")}
                </p>
                <p className="mt-2 break-words text-sm font-medium text-foreground">
                  {t(inboxWorkspaceLabelKeys[getWorkspaceKey(result.suggestedWorkspace)])}
                </p>
              </div>

            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {itemCreated ? (
                <div
                  role="status"
                  className="text-sm font-medium text-emerald-600 dark:text-emerald-400"
                >
                  {t("inbox.itemCreated")}
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
                {t(result.actionKind === "task" ? "inbox.createTask" : "inbox.createNote")}
              </Button>
            </div>
          </Card>
        ) : null}

      </Page>
    </AppShell>
  );
}
