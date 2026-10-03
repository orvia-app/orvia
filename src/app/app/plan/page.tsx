"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, RotateCw, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { useI18n } from "@/components/i18n/I18nProvider";
import { PlanTimeline } from "@/components/plan/PlanTimeline";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Page } from "@/components/ui/Page";
import {
  findPlanConflicts,
  intervalFromDuration,
  localTimeCandidates,
  moveBlockDraftToInstant,
  selectStillToPlace,
  taskBlockCandidate,
  type PlanConflict,
  type PlanTaskBlockSummary,
} from "@/core/plan/workspace";
import { isIanaTimeZone, isLocalDate, type IanaTimeZone, type LocalDate,
  type ScheduleProjectionResult, type TimedInterval, type UtcInstant } from "@/core/schedule/domain";
import { addDays, dateInZone } from "@/lib/calendar-view";
import { fetchPlanPreferences, fetchPlanSchedule, type PlanPreferences } from "@/lib/plan-api";
import {
  createTaskPlanBlock,
  fetchTaskPlanBlocks,
  TaskPlanBlockApiError,
  updateTaskPlanBlock,
} from "@/lib/task-plan-blocks-api";
import { fetchTasksViaApi } from "@/lib/tasks-api";
import type { Task } from "@/types";
import "./plan.css";

type PlanData = {
  blocks: PlanTaskBlockSummary[];
  date: LocalDate;
  preferences: PlanPreferences;
  projection: ScheduleProjectionResult;
  tasks: Task[];
};

type PageStatus = "loading" | "ready" | "error";
type BlockDraft = {
  blockId: string;
  date: LocalDate;
  duration: string;
  exactStart: UtcInstant | null;
  original: PlanTaskBlockSummary;
  taskId: string;
  time: string;
};

type Confirmation = {
  conflicts: PlanConflict[];
  kind: "place" | "update";
  signature: string;
};

function formatDate(date: LocalDate, locale: "en" | "ua", options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale === "ua" ? "uk-UA" : "en-US", {
    timeZone: "UTC",
    ...options,
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function localTime(instant: string, zone: IanaTimeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(instant));
}

function offsetLabel(instant: string, zone: IanaTimeZone) {
  return new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "shortOffset" })
    .formatToParts(new Date(instant)).find((part) => part.type === "timeZoneName")?.value ?? "UTC";
}

function durationMinutes(block: PlanTaskBlockSummary) {
  return Math.round((Date.parse(block.endAt) - Date.parse(block.startAt)) / 60_000);
}

function isoWeekday(date: LocalDate) {
  const weekday = new Date(`${date}T12:00:00.000Z`).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

function selectedCandidate(
  date: LocalDate,
  time: string,
  zone: IanaTimeZone,
  exactStart: UtcInstant | null,
): { candidates: UtcInstant[]; start: UtcInstant | null } {
  const candidates = localTimeCandidates(date, time, zone);
  const start = exactStart && candidates.includes(exactStart) ? exactStart :
    candidates.length === 1 ? candidates[0] : null;
  return { candidates, start };
}

function signature(kind: "place" | "update", taskId: string, interval: TimedInterval) {
  return `${kind}:${taskId}:${interval.start}:${interval.end}`;
}

function errorKey(error: unknown, action: "place" | "update") {
  if (!(error instanceof TaskPlanBlockApiError)) return "plan.error.api" as const;
  if (error.kind === "invalid") return "plan.error.invalid" as const;
  if (error.kind === "conflict") {
    return action === "place" ? "plan.error.duplicate" as const : "plan.error.stale" as const;
  }
  if (error.kind === "missing") return "plan.error.missing" as const;
  return "plan.error.api" as const;
}

export default function PlanPage() {
  const { session } = useAuthSession();
  const { locale, t } = useI18n();
  const [status, setStatus] = useState<PageStatus>("loading");
  const [data, setData] = useState<PlanData | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [placementTime, setPlacementTime] = useState("");
  const [placementDuration, setPlacementDuration] = useState("");
  const [placementExactStart, setPlacementExactStart] = useState<UtcInstant | null>(null);
  const [blockDraft, setBlockDraft] = useState<BlockDraft | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<LocalDate | null>(null);
  const blockEditorRef = useRef<HTMLFormElement | null>(null);
  const accessToken = session?.access_token;
  const ownerId = session?.user.id;
  const editingBlockId = blockDraft?.blockId ?? null;

  useEffect(() => {
    if (!accessToken || !ownerId) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setStatus("loading");
      setActionError(null);
      try {
        const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!isIanaTimeZone(browserZone)) throw new Error("Browser timezone unavailable");
        let preferences = await fetchPlanPreferences(accessToken, browserZone);
        const date = selectedDate ?? dateInZone(new Date(), preferences.planningTimezone);
        const [tasks, blocks, firstProjection] = await Promise.all([
          fetchTasksViaApi({ accessToken }),
          fetchTaskPlanBlocks(accessToken),
          fetchPlanSchedule(accessToken, ownerId, date, preferences.planningTimezone, 3),
        ]);
        let projection = firstProjection;
        if (projection.planningTimezone !== preferences.planningTimezone) {
          preferences = { ...preferences, planningTimezone: projection.planningTimezone, persisted: true };
          projection = await fetchPlanSchedule(accessToken, ownerId, date,
            preferences.planningTimezone, 3);
        }
        if (cancelled) return;
        setData({ blocks, date, preferences, projection, tasks });
        setNow(new Date());
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [accessToken, ownerId, revision, selectedDate]);

  useEffect(() => {
    if (!editingBlockId) return;
    const frame = window.requestAnimationFrame(() => {
      blockEditorRef.current?.scrollIntoView({ block: "center" });
      blockEditorRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editingBlockId]);

  const stillToPlace = useMemo(() => data ?
    selectStillToPlace(data.tasks, data.blocks, data.date) : [], [data]);
  const selectedTask = data?.tasks.find((task) => task.id === selectedTaskId) ?? null;
  const blocksById = useMemo(() => new Set(data?.blocks.map((block) => block.id) ?? []), [data]);
  const placementChoice = useMemo(() => data && placementTime ? selectedCandidate(
    data.date, placementTime, data.preferences.planningTimezone, placementExactStart,
  ) : { candidates: [], start: null }, [data, placementExactStart, placementTime]);
  const placementInterval = useMemo(() => {
    if (!placementChoice.start || !placementDuration) return null;
    try { return intervalFromDuration(placementChoice.start, Number(placementDuration)); } catch { return null; }
  }, [placementChoice.start, placementDuration]);
  const placementConflicts = data && selectedTask && placementInterval ? findPlanConflicts(
    taskBlockCandidate(selectedTask, session?.user.id ?? "", placementInterval),
    data.projection.items,
  ) : [];

  function chooseTask(task: Task) {
    setSelectedTaskId(task.id);
    setPlacementDuration(task.estimatedDurationMinutes ? String(task.estimatedDurationMinutes) : "");
    setPlacementTime("");
    setPlacementExactStart(null);
    setBlockDraft(null);
    setConfirmation(null);
    setFeedback(null);
    setActionError(null);
  }

  function chooseSlot(instant: UtcInstant) {
    if (!data) return;
    if (blockDraft) {
      setBlockDraft(moveBlockDraftToInstant(
        blockDraft,
        instant,
        data.preferences.planningTimezone,
      ));
      setConfirmation(null);
      setActionError(null);
      return;
    }
    if (!selectedTask) return;
    setPlacementExactStart(instant);
    setPlacementTime(localTime(instant, data.preferences.planningTimezone));
    setConfirmation(null);
    setActionError(null);
  }

  function chooseBlock(blockId: string) {
    if (!data) return;
    const block = data.blocks.find((candidate) => candidate.id === blockId);
    if (!block) return;
    const zone = data.preferences.planningTimezone;
    setSelectedTaskId(null);
    setBlockDraft({
      blockId,
      taskId: block.taskId,
      date: dateInZone(block.startAt, zone),
      time: localTime(block.startAt, zone),
      duration: String(durationMinutes(block)),
      exactStart: block.startAt,
      original: block,
    });
    setConfirmation(null);
    setFeedback(null);
    setActionError(null);
  }

  function refreshAfterMutation(message: string) {
    setFeedback(message);
    setConfirmation(null);
    setSelectedTaskId(null);
    setBlockDraft(null);
    setRevision((value) => value + 1);
  }

  async function placeTask() {
    if (!data || !selectedTask || !placementInterval || !session?.access_token) {
      setActionError(t("plan.error.completePlacement"));
      return;
    }
    const operationSignature = signature("place", selectedTask.id, placementInterval);
    if (placementConflicts.length > 0 && confirmation?.signature !== operationSignature) {
      setConfirmation({ kind: "place", signature: operationSignature, conflicts: placementConflicts });
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await createTaskPlanBlock(selectedTask.id, {
        startAt: placementInterval.start,
        endAt: placementInterval.end,
      }, session.access_token);
      refreshAfterMutation(t("plan.success.placed"));
    } catch (error) {
      setActionError(t(errorKey(error, "place")));
      if (error instanceof TaskPlanBlockApiError && error.kind === "conflict") {
        setSelectedTaskId(null);
        setConfirmation(null);
        setRevision((value) => value + 1);
      }
    } finally {
      setSaving(false);
    }
  }

  const draftTask = blockDraft && data ? data.tasks.find((task) => task.id === blockDraft.taskId) ?? null : null;
  const draftChoice = useMemo(() => blockDraft && data ? selectedCandidate(
    blockDraft.date,
    blockDraft.time,
    data.preferences.planningTimezone,
    blockDraft.exactStart,
  ) : { candidates: [], start: null }, [blockDraft, data]);
  const draftInterval = useMemo(() => {
    if (!blockDraft || !draftChoice.start || !blockDraft.duration) return null;
    try { return intervalFromDuration(draftChoice.start, Number(blockDraft.duration)); } catch { return null; }
  }, [blockDraft, draftChoice.start]);
  const draftChanged = Boolean(blockDraft && draftInterval &&
    (draftInterval.start !== blockDraft.original.startAt ||
      draftInterval.end !== blockDraft.original.endAt));

  async function updateBlock() {
    if (!data || !blockDraft || !draftTask || !draftInterval || !session?.access_token || !session.user.id) {
      setActionError(t("plan.error.completeUpdate"));
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      const targetProjection = blockDraft.date === data.date ? data.projection :
        await fetchPlanSchedule(session.access_token, session.user.id, blockDraft.date,
          data.preferences.planningTimezone);
      const conflicts = findPlanConflicts(
        taskBlockCandidate(draftTask, session.user.id, draftInterval, blockDraft.blockId),
        targetProjection.items.filter((item) => item.key !== `task-block:${blockDraft.blockId}`),
      );
      const operationSignature = signature("update", draftTask.id, draftInterval);
      if (conflicts.length > 0 && confirmation?.signature !== operationSignature) {
        setConfirmation({ kind: "update", signature: operationSignature, conflicts });
        return;
      }
      await updateTaskPlanBlock(blockDraft.taskId, blockDraft.blockId, {
        startAt: draftInterval.start,
        endAt: draftInterval.end,
        expectedVersion: blockDraft.original.version,
      }, session.access_token);
      const moved = draftInterval.start !== blockDraft.original.startAt;
      const resized = durationMinutes(blockDraft.original) !== Number(blockDraft.duration);
      refreshAfterMutation(t(moved && resized ? "plan.success.updated" :
        moved ? "plan.success.moved" : "plan.success.resized"));
    } catch (error) {
      setActionError(t(errorKey(error, "update")));
      if (error instanceof TaskPlanBlockApiError && error.kind === "conflict") {
        setBlockDraft(null);
        setConfirmation(null);
        setRevision((value) => value + 1);
      }
    } finally {
      setSaving(false);
    }
  }

  function changeDate(date: LocalDate) {
    setFeedback(null);
    setConfirmation(null);
    setSelectedTaskId(null);
    setBlockDraft(null);
    setSelectedDate(date);
  }

  return <AppShell><Page className="plan-page">
    <header className="plan-header">
      <div><p className="plan-eyebrow">{t("plan.eyebrow")}</p><h1>{t("plan.title")}</h1>
        <p>{t("plan.description")}</p></div>
      {data && <div className="plan-zone"><CalendarClock className="h-4 w-4" aria-hidden />
        <span>{data.preferences.planningTimezone}</span></div>}
    </header>

    {status === "loading" && <div className="plan-state" role="status">{t("plan.loading")}</div>}
    {status === "error" && <div className="plan-state plan-state-error" role="alert">
      <p>{t("plan.error.preferences")}</p><Button variant="secondary" onClick={() => setRevision((value) => value + 1)}>
        <RotateCw className="h-4 w-4" aria-hidden />{t("calendar.retry")}</Button></div>}

    {status === "ready" && data && now && <>
      <div className="plan-day-nav">
        <button type="button" aria-label={t("calendar.previous")} onClick={() => changeDate(addDays(data.date, -1))}><ChevronLeft className="h-4 w-4" /></button>
        <div><strong>{formatDate(data.date, locale, { weekday: "long", month: "long", day: "numeric" })}</strong>
          <span>{data.preferences.localStartTime.slice(0, 5)}–{data.preferences.localEndTime.slice(0, 5)}</span></div>
        <button type="button" onClick={() => changeDate(dateInZone(new Date(), data.preferences.planningTimezone))}>{t("calendar.today")}</button>
        <button type="button" aria-label={t("calendar.next")} onClick={() => changeDate(addDays(data.date, 1))}><ChevronRight className="h-4 w-4" /></button>
      </div>
      {!data.preferences.persisted && <p className="plan-notice">{t("plan.timezoneFallback")}</p>}
      {!data.preferences.enabledWeekdays.includes(isoWeekday(data.date)) &&
        <p className="plan-notice">{t("plan.outsidePlanningDay")}</p>}
      {feedback && <p className="orvia-feedback" role="status">{feedback}</p>}
      {actionError && <p className="plan-action-error" role="alert">{actionError}</p>}

      <div className="plan-workspace">
        <aside className="plan-demand" aria-label={t("plan.stillToPlace") }>
          <div className="plan-section-heading"><div><p>{t("plan.demandEyebrow")}</p><h2>{t("plan.stillToPlace")}</h2></div>
            <span>{stillToPlace.length}</span></div>
          <p className="plan-section-description">{t("plan.stillDescription")}</p>
          <div className="plan-task-list">
            {stillToPlace.length ? stillToPlace.map((task) => <button key={task.id} type="button"
              className="plan-task-row" data-selected={task.id === selectedTaskId || undefined}
              onClick={() => chooseTask(task)}>
              <span className="plan-task-title">{task.title}</span>
              <span className="plan-task-meta">{task.estimatedDurationMinutes ?
                t("plan.minutes").replace("{count}", String(task.estimatedDurationMinutes)) : t("plan.durationRequired")}
                {task.planDay === data.date ? ` · ${t("plan.assignedToday")}` : ""}</span>
            </button>) : <div className="plan-empty"><strong>{t("plan.nothingToPlace")}</strong>
              <span>{t("plan.nothingToPlaceDescription")}</span></div>}
          </div>

          {selectedTask && <form className="plan-place-form" onSubmit={(event) => { event.preventDefault(); void placeTask(); }}>
            <h3>{t("plan.placeTask")}</h3><p>{selectedTask.title}</p>
            <label>{t("plan.startTime")}<Input type="time" value={placementTime}
              onChange={(event) => { setPlacementTime(event.target.value); setPlacementExactStart(null); setConfirmation(null); }} required /></label>
            {placementChoice.candidates.length > 1 && <label>{t("plan.timeOccurrence")}<Select
              value={placementExactStart ?? ""} onChange={(event) => {
                setPlacementExactStart(event.target.value as UtcInstant); setConfirmation(null);
              }} required><option value="">{t("plan.chooseOccurrence")}</option>
              {placementChoice.candidates.map((candidate) => <option key={candidate} value={candidate}>{localTime(candidate, data.preferences.planningTimezone)} · {offsetLabel(candidate, data.preferences.planningTimezone)}</option>)}</Select></label>}
            <label>{t("plan.duration")}<Input type="number" min="1" max="10080" inputMode="numeric"
              value={placementDuration} onChange={(event) => { setPlacementDuration(event.target.value); setConfirmation(null); }} required /></label>
            {placementTime && placementChoice.candidates.length === 0 && <p className="plan-field-error">{t("plan.error.nonexistentTime")}</p>}
            {placementConflicts.length > 0 && <ConflictNotice conflicts={placementConflicts} />}
            {confirmation?.kind === "place" && <p className="plan-confirmation"><TriangleAlert className="h-4 w-4" />{t("plan.confirmOverlap")}</p>}
            <Button type="submit" disabled={saving || !placementInterval}>{saving ? t("common.working") :
              confirmation?.kind === "place" ? t("plan.placeAnyway") : t("plan.place")}</Button>
          </form>}
        </aside>

        <section className="plan-day" aria-label={t("plan.daySchedule") }>
          <div className="plan-section-heading"><div><p>{t("plan.scheduleEyebrow")}</p><h2>{t("plan.daySchedule")}</h2></div></div>
          <p className="plan-section-description">{blockDraft ? t("plan.blockEditHint") :
            selectedTask ? t("plan.clickTimeline") : t("plan.selectTaskHint")}</p>
          {blockDraft && draftTask && <form ref={blockEditorRef} tabIndex={-1}
            aria-label={t("plan.editBlockAction").replace("{task}", draftTask.title)}
            className="plan-block-editor" onSubmit={(event) => { event.preventDefault(); void updateBlock(); }}>
            <div><h3>{t("plan.editBlock")}</h3><p>{draftTask.title}</p></div>
            <label>{t("plan.date")}<Input type="date" value={blockDraft.date}
              onChange={(event) => {
                if (isLocalDate(event.target.value)) {
                  setBlockDraft({ ...blockDraft, date: event.target.value, exactStart: null });
                  setConfirmation(null);
                }
              }} required /></label>
            <label>{t("plan.startTime")}<Input type="time" value={blockDraft.time}
              onChange={(event) => {
                setBlockDraft({ ...blockDraft, time: event.target.value, exactStart: null });
                setConfirmation(null);
              }} required /></label>
            {draftChoice.candidates.length > 1 && <label>{t("plan.timeOccurrence")}<Select value={blockDraft.exactStart ?? ""}
              onChange={(event) => {
                setBlockDraft({ ...blockDraft, exactStart: event.target.value as UtcInstant });
                setConfirmation(null);
              }} required>
              <option value="">{t("plan.chooseOccurrence")}</option>{draftChoice.candidates.map((candidate) =>
                <option key={candidate} value={candidate}>{localTime(candidate, data.preferences.planningTimezone)} · {offsetLabel(candidate, data.preferences.planningTimezone)}</option>)}</Select></label>}
            <label>{t("plan.duration")}<Input type="number" min="1" max="10080" inputMode="numeric" value={blockDraft.duration}
              onChange={(event) => {
                setBlockDraft({ ...blockDraft, duration: event.target.value });
                setConfirmation(null);
              }} required /></label>
            {blockDraft.time && draftChoice.candidates.length === 0 && <p className="plan-field-error">{t("plan.error.nonexistentTime")}</p>}
            {confirmation?.kind === "update" && <><ConflictNotice conflicts={confirmation.conflicts} />
              <p className="plan-confirmation"><TriangleAlert className="h-4 w-4" />{t("plan.confirmOverlap")}</p></>}
            <div className="plan-editor-actions"><Button type="submit" disabled={saving || !draftInterval || !draftChanged}>{saving ? t("common.working") :
              confirmation?.kind === "update" ? t("plan.updateAnyway") : t("common.save")}</Button>
              <Button type="button" variant="ghost" onClick={() => { setBlockDraft(null); setConfirmation(null); }}>{t("common.cancel")}</Button></div>
          </form>}
          <PlanTimeline blocksById={blocksById} date={data.date} items={data.projection.items}
            locale={locale} localStartTime={data.preferences.localStartTime}
            localEndTime={data.preferences.localEndTime} now={now}
            onSelectBlock={chooseBlock} onSelectInstant={chooseSlot}
            selectedBlockId={blockDraft?.blockId ?? null}
            slotMode={blockDraft ? "move" : selectedTask ? "place" : null}
            zone={data.preferences.planningTimezone} />
        </section>
      </div>
    </>}
  </Page></AppShell>;
}

function ConflictNotice({ conflicts }: { conflicts: readonly PlanConflict[] }) {
  const { t } = useI18n();
  const titles = [...new Set(conflicts.map(({ item }) => item.title))].join(", ");
  return <div className="plan-conflict-notice" role="status"><TriangleAlert className="h-4 w-4" aria-hidden />
    <p><strong>{t("plan.conflictTitle")}</strong><span>{t("plan.conflictWith").replace("{items}", titles)}</span></p></div>;
}
