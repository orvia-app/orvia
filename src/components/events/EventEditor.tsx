"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDialogFocus } from "@/components/ui/useDialogFocus";
import { EventTimeField } from "@/components/events/EventTimeField";
import { isIanaTimeZone, isLocalDate } from "@/core/schedule/domain";
import { localTimeCandidates } from "@/core/plan/workspace";
import { createEvent, getEvent, resolveCaptureToEvent, transitionEvent, updateEvent, type EventRecord } from "@/lib/events-api";
import { eventDetailsFromCapture, eventDraftFromRecord, eventDraftToPayload, switchEventAllDay, type EventDraft } from "@/lib/event-form";

export type EventEditorResult =
  | { kind: "created" | "updated"; event: EventRecord }
  | { kind: "archived" | "deleted"; eventId: string };

type Props = {
  accessToken: string;
  date: string;
  eventId?: string;
  captureId?: string;
  captureText?: string;
  initialTitle?: string;
  zone: string;
  onClose: () => void;
  onSaved: (result: EventEditorResult) => void;
};

export function EventEditorLoadingState() {
  const { t } = useI18n();
  return <div role="status" aria-live="polite" className="mt-5 space-y-4">
    <span className="sr-only">{t("event.loading")}</span>
    <div aria-hidden="true" className="space-y-4">
      <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-11 w-full" /></div>
      <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-24 w-full" /></div>
      <Skeleton className="h-5 w-28" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-11 w-full" /></div>)}
      </div>
      <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-11 w-full" /></div>
      <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-11 w-full" /></div>
      <div className="flex justify-end gap-2 border-t border-line pt-4"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-20" /></div>
    </div>
  </div>;
}

export function EventEditorLoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return <div className="mt-5 space-y-4" role="alert">
    <p className="text-sm text-[var(--danger)]">{t("event.loadError")}</p>
    <Button type="button" variant="secondary" onClick={onRetry}>{t("calendar.retry")}</Button>
  </div>;
}

export function EventEditor({ accessToken, date, eventId, captureId, captureText, initialTitle = "", zone, onClose, onSaved }: Props) {
  const { t } = useI18n();
  const dialogRef = useDialogFocus(true);
  const submittingRef = useRef(false);
  const [draft, setDraft] = useState<EventDraft>({ title: initialTitle, description: captureText ? eventDetailsFromCapture(captureText).description : "", timezone: zone, busy: true, allDay: false,
    startDate: date, startTime: "", endDate: date, endTime: "", exactStart: "", exactEnd: "" });
  const [mode, setMode] = useState<"view" | "edit">(eventId ? "view" : "edit");
  const [loading, setLoading] = useState(Boolean(eventId));
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadRevision, setLoadRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [openTimeField, setOpenTimeField] = useState<"start" | "end" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"archived" | "deleted" | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let active = true;
    void getEvent(eventId, accessToken).then((record) => {
      if (active) { setDraft(eventDraftFromRecord(record)); setLoadFailed(false); setLoading(false); }
    }).catch(() => { if (active) { setLoadFailed(true); setLoading(false); } });
    return () => { active = false; };
  }, [accessToken, eventId, loadRevision]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || saving) return;
      if (openTimeField) setOpenTimeField(null);
      else onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, openTimeField, saving]);

  function update<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(key === "timezone" || key === "startTime" || key === "startDate" ? { exactStart: "" } : {}),
      ...(key === "timezone" || key === "endTime" || key === "endDate" ? { exactEnd: "" } : {}),
    }));
    setError(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    const parsed = eventDraftToPayload(draft);
    if (!parsed.ok) { setError(t(`event.error.${parsed.error}`)); return; }
    submittingRef.current = true;
    setSaving(true);
    setOpenTimeField(null);
    setError(null);
    try {
      if (eventId) {
        const saved = await updateEvent(eventId, parsed.value, accessToken);
        onSaved({ kind: "updated", event: saved });
      } else {
        const saved = captureId ?
          await resolveCaptureToEvent(captureId, parsed.value, accessToken) :
          await createEvent(parsed.value, accessToken);
        onSaved({ kind: "created", event: saved });
      }
    } catch { setError(t("event.saveError")); }
    finally { submittingRef.current = false; setSaving(false); }
  }

  async function lifecycle() {
    if (!eventId || !confirmAction || submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    try { await transitionEvent(eventId, confirmAction, accessToken); onSaved({ kind: confirmAction, eventId }); }
    catch { setError(t("event.saveError")); setConfirmAction(null); }
    finally { submittingRef.current = false; setSaving(false); }
  }

  const startCandidates = useMemo(() => isIanaTimeZone(draft.timezone) && isLocalDate(draft.startDate) && draft.startTime ?
    localTimeCandidates(draft.startDate, draft.startTime, draft.timezone) : [], [draft.timezone, draft.startDate, draft.startTime]);
  const endCandidates = useMemo(() => isIanaTimeZone(draft.timezone) && isLocalDate(draft.endDate) && draft.endTime ?
    localTimeCandidates(draft.endDate, draft.endTime, draft.timezone) : [], [draft.timezone, draft.endDate, draft.endTime]);
  const readOnly = mode === "view";
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-zinc-950/55 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="event-editor-title" aria-owns={openTimeField ? `event-${openTimeField}-time-options` : undefined} className={`orvia-dialog max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-2xl sm:p-6 ${eventId ? "min-h-[min(44rem,calc(100dvh-2rem))]" : ""}`} onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-4"><h2 id="event-editor-title" className="text-lg font-semibold text-foreground">{t(eventId ? "event.details" : "event.new")}</h2><button type="button" aria-label={t("common.close")} onClick={onClose} disabled={saving} className="rounded-lg p-2 text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X className="h-4 w-4" aria-hidden /></button></div>
      {loading ? <EventEditorLoadingState /> : loadFailed ? <EventEditorLoadError onRetry={() => { setLoadFailed(false); setLoading(true); setLoadRevision((value) => value + 1); }} /> : <form onSubmit={(event) => void save(event)} className="mt-5 space-y-4">
        {captureText && <details className="text-sm text-muted"><summary className="cursor-pointer font-medium">{t("event.originalCapture")}</summary><p className="mt-2 whitespace-pre-wrap break-words">{captureText}</p></details>}
        <label className="block text-sm font-medium text-foreground">{t("event.title")}<Input required maxLength={200} value={draft.title} disabled={readOnly || saving} onChange={(event) => update("title", event.target.value)} className="mt-1.5 w-full" /></label>
        <label className="block text-sm font-medium text-foreground">{t("event.description")}<Textarea maxLength={10000} rows={3} value={draft.description} disabled={readOnly || saving} onChange={(event) => update("description", event.target.value)} className="mt-1.5 w-full" /></label>
        <label className="flex items-center gap-3 text-sm text-foreground"><input type="checkbox" checked={draft.allDay} disabled={readOnly || saving} onChange={(event) => { setDraft((current) => switchEventAllDay(current, event.target.checked)); setOpenTimeField(null); setError(null); }} />{t("event.allDay")}</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-foreground">{t("event.startDate")}<Input type="date" required value={draft.startDate} disabled={readOnly || saving} onChange={(event) => update("startDate", event.target.value)} className="mt-1.5 w-full" /></label>
          <label className="text-sm font-medium text-foreground">{t("event.endDate")}<Input type="date" required value={draft.endDate} disabled={readOnly || saving} onChange={(event) => update("endDate", event.target.value)} className="mt-1.5 w-full" /></label>
          {!draft.allDay && <><EventTimeField id="event-start-time" label={t("event.startTime")} value={draft.startTime} fallback="09:00" disabled={readOnly || saving} open={openTimeField === "start"} onOpen={() => setOpenTimeField("start")} onClose={() => setOpenTimeField(null)} onToggle={() => setOpenTimeField((current) => current === "start" ? null : "start")} onChange={(value) => update("startTime", value)} /><EventTimeField id="event-end-time" label={t("event.endTime")} value={draft.endTime} fallback="10:00" disabled={readOnly || saving} open={openTimeField === "end"} onOpen={() => setOpenTimeField("end")} onClose={() => setOpenTimeField(null)} onToggle={() => setOpenTimeField((current) => current === "end" ? null : "end")} onChange={(value) => update("endTime", value)} /></>}
        </div>
        {!draft.allDay && startCandidates.length > 1 && <label className="block text-sm font-medium text-foreground">{t("event.startOccurrence")}<Select required value={draft.exactStart} disabled={readOnly || saving} onChange={(event) => update("exactStart", event.target.value)} className="mt-1.5 w-full"><option value="">{t("event.chooseOccurrence")}</option>{startCandidates.map((value) => <option key={value} value={value}>{value}</option>)}</Select></label>}
        {!draft.allDay && endCandidates.length > 1 && <label className="block text-sm font-medium text-foreground">{t("event.endOccurrence")}<Select required value={draft.exactEnd} disabled={readOnly || saving} onChange={(event) => update("exactEnd", event.target.value)} className="mt-1.5 w-full"><option value="">{t("event.chooseOccurrence")}</option>{endCandidates.map((value) => <option key={value} value={value}>{value}</option>)}</Select></label>}
        <label className="block text-sm font-medium text-foreground">{t("event.timezone")}<Input required value={draft.timezone} disabled={readOnly || saving} onChange={(event) => update("timezone", event.target.value)} className="mt-1.5 w-full" autoComplete="off" /></label>
        <label className="block text-sm font-medium text-foreground">{t("event.availability")}<Select value={draft.busy ? "busy" : "free"} disabled={readOnly || saving} onChange={(event) => update("busy", event.target.value === "busy")} className="mt-1.5 w-full"><option value="busy">{t("calendar.busy")}</option><option value="free">{t("calendar.free")}</option></Select></label>
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {confirmAction ? <div className="rounded-lg border border-red-300 p-3 dark:border-red-800"><p className="text-sm text-foreground">{t(confirmAction === "archived" ? "event.confirmArchive" : "event.confirmDelete")}</p><div className="mt-3 flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setConfirmAction(null)}>{t("common.cancel")}</Button><Button type="button" disabled={saving} onClick={() => void lifecycle()}>{t(confirmAction === "archived" ? "event.archive" : "event.delete")}</Button></div></div> :
          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">{eventId && readOnly && <><Button type="button" variant="secondary" onClick={() => setConfirmAction("archived")}>{t("event.archive")}</Button><Button type="button" variant="secondary" onClick={() => setConfirmAction("deleted")}>{t("event.delete")}</Button><Button type="button" onClick={() => setMode("edit")}>{t("event.edit")}</Button></>}{(!eventId || !readOnly) && <><Button type="button" variant="secondary" onClick={eventId ? () => { setOpenTimeField(null); setMode("view"); } : onClose}>{t("common.cancel")}</Button><Button type="submit" disabled={saving}>{saving ? t("event.saving") : t("event.save")}</Button></>}</div>}
      </form>}
    </div>
  </div>;
}
