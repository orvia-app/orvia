"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Globe2, Info, RotateCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { CalendarSurface } from "@/components/calendar/CalendarSurface";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Page } from "@/components/ui/Page";
import { isIanaTimeZone, isLocalDate, isUtcInstant, type IanaTimeZone, type LocalDate, type ScheduleItem, type ScheduleProjectionResult } from "@/core/schedule/domain";
import { localDateRange } from "@/core/schedule/projection";
import { addDays, dateInZone, moveView, sourceNotice, viewDates, type CalendarView } from "@/lib/calendar-view";
import "./calendar.css";

type LoadState = { status: "idle" } | { status: "error"; key: string } | { status: "loaded"; key: string; projection: ScheduleProjectionResult };
type CalendarMotionIntent = "initial" | "view" | "previous" | "next" | "selection";
type CalendarVisualQaFixture = typeof import("@/dev/calendar-visual-qa-fixture");

function CalendarLoadingState({ label }: { label: string }) {
  return (
    <div className="calendar-loading-state" role="status">
      <p>{label}</p>
      <div className="calendar-loading-head" aria-hidden>
        {Array.from({ length: 7 }, (_, index) => <span key={index} />)}
      </div>
      <div className="calendar-loading-grid" aria-hidden>
        {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
      </div>
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isScheduleItem(value: unknown): value is ScheduleItem {
  if (!isRecord(value) || !isRecord(value.interval)) return false;
  if (typeof value.key !== "string" || typeof value.sourceId !== "string" ||
      typeof value.title !== "string" || typeof value.ownerId !== "string" ||
      typeof value.busy !== "boolean" || !isUtcInstant(value.interval.start) ||
      !isUtcInstant(value.interval.end) || Date.parse(value.interval.end) <= Date.parse(value.interval.start)) return false;
  if (value.source === "task") return value.kind === "planned-task" && value.key === `task:${value.sourceId}`;
  if (value.source !== "orvia-event" || value.key !== `orvia-event:${value.sourceId}` || !isIanaTimeZone(value.timezone)) return false;
  return value.kind === "timed" || (value.kind === "all-day" && isLocalDate(value.startDate) && isLocalDate(value.endDateExclusive));
}

function parseProjection(value: unknown, ownerId: string, zone: IanaTimeZone): ScheduleProjectionResult | null {
  if (!isRecord(value) || !isRecord(value.sources) || !isRecord(value.sources.tasks) ||
      !isRecord(value.sources.events) || !isRecord(value.range) || !Array.isArray(value.items) ||
      value.planningTimezone !== zone || !isUtcInstant(value.range.start) || !isUtcInstant(value.range.end) ||
      !["complete", "incomplete"].includes(String(value.completeness))) return null;
  const states = [value.sources.tasks.state, value.sources.events.state];
  if (states.some((state) => !["complete", "partial", "stale", "unavailable", "unverified"].includes(String(state))) ||
      !value.items.every((item) => isScheduleItem(item) && item.ownerId === ownerId)) return null;
  return value as ScheduleProjectionResult;
}

function formatRange(date: LocalDate, dates: LocalDate[], view: CalendarView, locale: "en" | "ua") {
  const language = locale === "ua" ? "uk-UA" : "en-US";
  const format = (day: LocalDate, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(language, { timeZone: "UTC", ...options }).format(new Date(`${day}T12:00:00.000Z`));
  if (view === "day") return format(date, { dateStyle: "full" });
  if (view === "month") return format(date, { month: "long", year: "numeric" });
  return `${format(dates[0], { month: "short", day: "numeric" })} – ${format(dates[6], { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function CalendarPage() {
  const { session } = useAuthSession();
  const { locale, t } = useI18n();
  const [zoneInput, setZoneInput] = useState("");
  const [zone, setZone] = useState<IanaTimeZone | null>(null);
  const [zoneEditorOpen, setZoneEditorOpen] = useState(false);
  const [date, setDate] = useState<LocalDate | null>(null);
  const [view, setView] = useState<CalendarView>("week");
  const [now, setNow] = useState<Date | null>(null);
  const [load, setLoad] = useState<LoadState>({ status: "idle" });
  const [retry, setRetry] = useState(0);
  const [motion, setMotion] = useState<{ intent: CalendarMotionIntent; revision: number }>({ intent: "initial", revision: 0 });
  const [visualQaFixture, setVisualQaFixture] = useState<CalendarVisualQaFixture | null>(null);

  useEffect(() => {
    const useVisualQaFixture = process.env.NODE_ENV === "development" &&
      new URLSearchParams(window.location.search).get("calendarQa") === "rich";
    let cancelled = false;
    const initialize = window.setTimeout(() => {
      if (useVisualQaFixture) {
        void import("@/dev/calendar-visual-qa-fixture").then((fixture) => {
          if (cancelled) return;
          setVisualQaFixture(fixture);
          setNow(new Date(fixture.calendarVisualQaNow));
          setZoneInput(fixture.calendarVisualQaZone);
          setZone(fixture.calendarVisualQaZone);
          setDate(fixture.calendarVisualQaDate);
        });
        return;
      }
      setNow(new Date());
      setZoneInput(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    }, 0);
    const timer = useVisualQaFixture ? null : window.setInterval(() => setNow(new Date()), 60_000);
    return () => {
      cancelled = true;
      window.clearTimeout(initialize);
      if (timer !== null) window.clearInterval(timer);
    };
  }, []);

  const dates = useMemo(() => date ? viewDates(date, view) : [], [date, view]);
  const sessionUserId = session?.user.id;
  const requestKey = zone && date ? `${zone}:${dates[0]}:${dates[dates.length - 1]}:${retry}:${sessionUserId ?? ""}` : "";
  const visualQaProjection = useMemo(() => visualQaFixture && sessionUserId ?
    visualQaFixture.createCalendarVisualQaProjection(sessionUserId) : null, [sessionUserId, visualQaFixture]);
  const activeLoad = visualQaProjection ?
    { status: "loaded" as const, key: `visual-qa:${sessionUserId}`, projection: visualQaProjection } :
    load.status !== "idle" && load.key === requestKey ? load : { status: "loading" as const };
  useEffect(() => {
    if (visualQaFixture || !session?.access_token || !zone || !date || !dates.length) return;
    const controller = new AbortController();
    const first = dates[0];
    const lastExclusive = addDays(dates[dates.length - 1], 1);
    const range = localDateRange(first, lastExclusive, zone);
    void (async () => {
      try {
        const response = await fetch("/api/schedule", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ range, planningTimezone: zone }),
          cache: "no-store",
          signal: controller.signal,
        });
        const body: unknown = await response.json();
        const projection = isRecord(body) && body.ok === true ? parseProjection(body.projection, session.user.id, zone) : null;
        if (!response.ok || !projection) throw new Error("Calendar schedule unavailable");
        if (!controller.signal.aborted) setLoad({ status: "loaded", key: requestKey, projection });
      } catch {
        if (!controller.signal.aborted) setLoad({ status: "error", key: requestKey });
      }
    })();
    return () => controller.abort();
  }, [session?.access_token, session?.user.id, zone, date, dates, requestKey, visualQaFixture]);

  function applyZone() {
    const candidate = zoneInput.trim();
    if (!isIanaTimeZone(candidate)) return;
    setZone(candidate);
    if (!date) setDate(dateInZone(now ?? new Date(), candidate));
    setZoneEditorOpen(false);
  }

  function transition(intent: CalendarMotionIntent, update: () => void) {
    setMotion((current) => ({ intent, revision: current.revision + 1 }));
    update();
  }

  function selectDate(nextDate: LocalDate) {
    transition("selection", () => setDate(nextDate));
  }

  function openDay(nextDate: LocalDate) {
    transition("view", () => {
      setDate(nextDate);
      setView("day");
    });
  }

  const source = activeLoad.status === "loaded" ? sourceNotice(activeLoad.projection) : null;
  const allEmpty = activeLoad.status === "loaded" && activeLoad.projection.items.length === 0;
  return (
    <AppShell>
      <Page className="calendar-page">
        <header className="calendar-page-heading">
          <div>
            <h1>{t("calendar.title")}</h1>
            <p>{t("calendar.description")}</p>
          </div>
          {zone && (
            <button
              type="button"
              className="calendar-timezone-trigger"
              aria-expanded={zoneEditorOpen}
              aria-controls={zoneEditorOpen ? "calendar-zone-editor" : undefined}
              aria-label={`${t("calendar.timezone")}: ${zone}. ${t("calendar.applyZone")}`}
              onClick={() => setZoneEditorOpen((open) => !open)}
            >
              <Globe2 className="h-3.5 w-3.5" aria-hidden />
              <span><span className="calendar-timezone-prefix">{t("calendar.showingZone")}</span>{zone}</span>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </header>

        <section className="calendar-frame" aria-label={t("calendar.title")}>
          {zone && date && (
            <div className="calendar-toolbar">
              <h2 className="calendar-range-title" aria-live="polite">{formatRange(date, dates, view, locale)}</h2>
              <div className="calendar-toolbar-navigation">
                <button type="button" className="calendar-period-arrow" aria-label={t("calendar.previous")} onClick={() => transition("previous", () => setDate(moveView(date, view, -1)))}><ChevronLeft className="h-4 w-4" aria-hidden /></button>
                <button type="button" className="calendar-today-button" onClick={() => now && transition("selection", () => setDate(dateInZone(now, zone)))}>{t("calendar.today")}</button>
                <button type="button" className="calendar-period-arrow" aria-label={t("calendar.next")} onClick={() => transition("next", () => setDate(moveView(date, view, 1)))}><ChevronRight className="h-4 w-4" aria-hidden /></button>
              </div>
              <div className="calendar-view-switch" role="group" aria-label={t("calendar.view")}>
                {(["day", "week", "month"] as const).map((option) => (
                  <button key={option} type="button" aria-pressed={view === option} onClick={() => transition("view", () => setView(option))}>{t(`calendar.${option}`)}</button>
                ))}
              </div>
            </div>
          )}

          {(!zone || zoneEditorOpen) && (
            <form id="calendar-zone-editor" className="calendar-zone-editor" onSubmit={(event) => { event.preventDefault(); applyZone(); }}>
              <div className="calendar-zone-copy">
                <label htmlFor="calendar-zone">{t("calendar.timezone")}</label>
                {!zone && <p>{t("calendar.chooseZone")}</p>}
              </div>
              <div className="calendar-zone-entry">
                <input id="calendar-zone" className="orvia-field" value={zoneInput} onChange={(event) => setZoneInput(event.target.value)} placeholder="Europe/Kyiv" autoComplete="off" aria-invalid={zoneInput.length > 0 && !isIanaTimeZone(zoneInput.trim())} />
                <Button type="submit" variant="secondary" disabled={!isIanaTimeZone(zoneInput.trim())}>{zone ? t("calendar.applyZone") : t("calendar.confirmZone")}</Button>
              </div>
            </form>
          )}

          {zone && activeLoad.status === "loading" && <CalendarLoadingState label={t("calendar.loading")} />}
          {zone && activeLoad.status === "error" && (
            <div className="calendar-state-panel calendar-state-error" role="alert">
              <p>{t("calendar.unavailable")}</p>
              <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}><RotateCw className="h-4 w-4" aria-hidden />{t("calendar.retry")}</Button>
            </div>
          )}
          {zone && activeLoad.status === "loaded" && date && now && (
            <>
              {source === "unavailable" ? (
                <div className="calendar-state-panel calendar-state-error" role="alert">
                  <p>{t("calendar.unavailable")}</p>
                  <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}><RotateCw className="h-4 w-4" aria-hidden />{t("calendar.retry")}</Button>
                </div>
              ) : (
                <div className="calendar-canvas" data-empty={allEmpty} data-view={view}>
                  {(source || allEmpty) && (
                    <div className="calendar-context-rail">
                      {allEmpty && <p className="calendar-empty-context" role="status">{t("calendar.emptyRange")}</p>}
                      {source && (
                        <details className="calendar-source-status" data-level={source}>
                          <summary><Info className="h-3.5 w-3.5" aria-hidden />{source === "incomplete" ? t("calendar.sourcesPartial") : t("calendar.sourcesUnverified")}</summary>
                          <p>{t("calendar.sourceDetail")}: {(["events", "tasks"] as const).map((key) => `${t(key === "events" ? "calendar.events" : "calendar.tasks")}: ${t(`calendar.state.${activeLoad.projection.sources[key].state}`)}`).join(" · ")}</p>
                        </details>
                      )}
                    </div>
                  )}
                  <div key={`${view}:${dates[0]}:${motion.revision}`} className="calendar-transition" data-motion={motion.intent}>
                    <CalendarSurface date={date} dates={dates} locale={locale} now={now} onSelectDate={selectDate} onOpenDay={openDay} projection={activeLoad.projection} view={view} zone={zone} />
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </Page>
    </AppShell>
  );
}
