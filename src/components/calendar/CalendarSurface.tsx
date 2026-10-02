"use client";

import Link from "next/link";
import { CalendarDays, CheckSquare2, CircleDashed } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { addDays, dateInZone, itemsOnDate, placeTimedItems, type CalendarView } from "@/lib/calendar-view";
import type { IanaTimeZone, LocalDate, ScheduleItem, ScheduleProjectionResult } from "@/core/schedule/domain";
import { localDateRange } from "@/core/schedule/projection";

type Props = {
  date: LocalDate;
  dates: LocalDate[];
  locale: "en" | "ua";
  now: Date;
  onSelectDate: (date: LocalDate) => void;
  onOpenDay: (date: LocalDate) => void;
  projection: ScheduleProjectionResult;
  view: CalendarView;
  zone: IanaTimeZone;
};

function formatDate(date: LocalDate, locale: "en" | "ua", options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale === "ua" ? "uk-UA" : "en-US", { timeZone: "UTC", ...options })
    .format(new Date(`${date}T12:00:00.000Z`));
}

function isWeekend(date: LocalDate) {
  const day = new Date(`${date}T12:00:00.000Z`).getUTCDay();
  return day === 0 || day === 6;
}

function formatTime(instant: string | number, locale: "en" | "ua", zone: IanaTimeZone) {
  return new Intl.DateTimeFormat(locale === "ua" ? "uk-UA" : "en-US", {
    timeZone: zone, hour: "numeric", minute: "2-digit", hourCycle: "h23",
  }).format(typeof instant === "string" ? new Date(instant) : instant);
}

function offsetLabel(instant: number, zone: IanaTimeZone) {
  const value = new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "shortOffset" })
    .formatToParts(instant).find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  return value === "GMT" ? "Z" : value.replace("GMT", "");
}

function timelineMetrics(date: LocalDate, locale: "en" | "ua", zone: IanaTimeZone) {
  const range = localDateRange(date, addDays(date, 1), zone);
  const start = Date.parse(range.start);
  const end = Date.parse(range.end);
  const durationHours = (end - start) / 3_600_000;
  const hours = Math.ceil(durationHours);
  const labels = Array.from({ length: hours }, (_, index) => ({
    instant: start + index * 3_600_000,
    text: formatTime(start + index * 3_600_000, locale, zone),
  }));
  return { start, end, durationHours, labels };
}

function ItemIcon({ item }: { item: ScheduleItem }) {
  const Icon = item.source === "task" ? CheckSquare2 : item.busy ? CalendarDays : CircleDashed;
  return <Icon className="h-3 w-3" aria-hidden />;
}

function ItemText({ item, locale, zone, displayDate }: {
  item: ScheduleItem; locale: "en" | "ua"; zone: IanaTimeZone; displayDate?: LocalDate;
}) {
  const { t } = useI18n();
  const type = item.source === "task" ? t("calendar.plannedTask") : t("calendar.event");
  const state = item.busy ? t("calendar.busy") : t("calendar.free");
  const dayRange = displayDate ? localDateRange(displayDate, addDays(displayDate, 1), zone) : null;
  const continuesBefore = dayRange ? Date.parse(item.interval.start) < Date.parse(dayRange.start) : false;
  const continuesAfter = dayRange ? Date.parse(item.interval.end) > Date.parse(dayRange.end) : false;
  const visibleStart = continuesBefore && dayRange ? dayRange.start : item.interval.start;
  const visibleEnd = continuesAfter && dayRange ? dayRange.end : item.interval.end;
  const continuation = [
    continuesBefore ? t("calendar.continuesFromPreviousDay") : null,
    continuesAfter ? t("calendar.continuesNextDay") : null,
  ].filter(Boolean).join(" · ");
  const time = item.kind === "all-day" ? t("calendar.allDay") :
    `${formatTime(visibleStart, locale, zone)}–${formatTime(visibleEnd, locale, zone)}`;
  const originZone = item.source === "orvia-event" && item.timezone !== zone ? ` · ${item.timezone}` : "";
  const label = `${type}: ${item.title}. ${time}${originZone}. ${state}${continuation ? `. ${continuation}` : ""}${item.workspaceId ? `. ${t("common.workspace")}: ${item.workspaceId}` : ""}`;
  const content = <>
    <span className="calendar-item-title"><ItemIcon item={item} /><span className="min-w-0 truncate">{item.title}</span></span>
    <span className="calendar-item-meta">{time}{originZone}{item.source === "orvia-event" && !item.busy ? ` · ${state}` : ""}{continuation ? ` · ${continuation}` : ""}</span>
    {item.workspaceId && <span className="calendar-item-workspace"><span aria-hidden />{item.workspaceId}</span>}
  </>;
  return item.source === "task" ?
    <Link className="calendar-item calendar-task" data-continues-before={continuesBefore || undefined} data-continues-after={continuesAfter || undefined} href={`/app/tasks?taskId=${encodeURIComponent(item.sourceId)}`} aria-label={label} title={label}>{content}</Link> :
    <div className={`calendar-item ${item.busy ? "calendar-event" : "calendar-free"}`} data-continues-before={continuesBefore || undefined} data-continues-after={continuesAfter || undefined} role="group" tabIndex={0} aria-label={label} title={label}>{content}</div>;
}

function AllDay({ items, locale, zone }: { items: ScheduleItem[]; locale: "en" | "ua"; zone: IanaTimeZone }) {
  const { t } = useI18n();
  if (!items.length) return null;
  return <div className="calendar-all-day"><span className="calendar-all-day-label">{t("calendar.allDay")}</span><div className="calendar-all-day-items">{items.map((item) => <ItemText key={item.key} item={item} locale={locale} zone={zone} />)}</div></div>;
}

function Timeline({ date, items, locale, now, zone, compact = false, showGutter = true, showNowLabel = false }: {
  date: LocalDate; items: ScheduleItem[]; locale: "en" | "ua"; now: Date; zone: IanaTimeZone;
  compact?: boolean; showGutter?: boolean; showNowLabel?: boolean;
}) {
  const { t } = useI18n();
  const { start, end, durationHours, labels } = timelineMetrics(date, locale, zone);
  const placed = placeTimedItems(items, date, zone);
  const nowMs = now.getTime();
  return <div className={`calendar-timeline ${compact ? "calendar-timeline-compact" : ""}`} data-gutter={showGutter} style={{ height: `${durationHours * (compact ? 56 : 60)}px` }}>
    {labels.map(({ instant, text }, index) => <div key={instant} className="calendar-hour" style={{ top: `${index / durationHours * 100}%` }}>{showGutter && <span>{text}{labels.filter((label) => label.text === text).length > 1 ? offsetLabel(instant, zone) : ""}</span>}</div>)}
    {nowMs >= start && nowMs < end && <div className="calendar-now" style={{ top: `${(nowMs - start) / (end - start) * 100}%` }}><span className={showNowLabel ? "calendar-now-label" : "sr-only"}>{t("calendar.currentTime")}</span></div>}
    {placed.map(({ item, start: itemStart, end: itemEnd, column, columns }) => {
      const top = (itemStart - start) / (end - start) * 100;
      const style: CSSProperties = {
        top: `${top}%`,
        height: `${Math.min(Math.max((itemEnd - itemStart) / (end - start) * 100, 1.5), 100 - top)}%`,
        left: showGutter ? `calc(${column / columns * 100}% + ${3.75 * (1 - column / columns)}rem)` : `calc(${column / columns * 100}% + 2px)`,
        width: showGutter ? `calc(${100 / columns}% - ${3.75 / columns}rem - 3px)` : `calc(${100 / columns}% - 4px)`,
      };
      const continuesBefore = Date.parse(item.interval.start) < start;
      const continuesAfter = Date.parse(item.interval.end) > end;
      return <div key={item.key} className="calendar-timed-position" data-columns={columns} data-overlap={columns > 1 || undefined} data-short={itemEnd - itemStart < 3_600_000 || undefined} data-continues-before={continuesBefore || undefined} data-continues-after={continuesAfter || undefined} style={style}><ItemText item={item} locale={locale} zone={zone} displayDate={date} /></div>;
    })}
  </div>;
}

function WeekTimeGutter({ date, locale, zone }: { date: LocalDate; locale: "en" | "ua"; zone: IanaTimeZone }) {
  const { durationHours, labels } = timelineMetrics(date, locale, zone);
  return <div className="calendar-week-time-gutter" aria-hidden style={{ height: `${durationHours * 56}px` }}>
    {labels.map(({ instant, text }, index) => <span key={instant} style={{ top: `${index / durationHours * 100}%` }}>{text}{labels.filter((label) => label.text === text).length > 1 ? offsetLabel(instant, zone) : ""}</span>)}
  </div>;
}

function Agenda({ date, items, locale, now, zone, scrollRef }: {
  date: LocalDate; items: ScheduleItem[]; locale: "en" | "ua"; now: Date; zone: IanaTimeZone;
  scrollRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useI18n();
  const allDay = items.filter((item) => item.kind === "all-day");
  return <section ref={scrollRef} className="calendar-agenda" aria-label={formatDate(date, locale, { dateStyle: "full" })}>
    <AllDay items={allDay} locale={locale} zone={zone} />
    {items.length === 0 && <p className="calendar-empty">{t("calendar.emptyDay")}</p>}
    <Timeline date={date} items={items} locale={locale} now={now} zone={zone} showNowLabel />
  </section>;
}

export function CalendarSurface({ date, dates, locale, now, onSelectDate, onOpenDay, projection, view, zone }: Props) {
  const { t } = useI18n();
  const todayDate = dateInZone(now, zone);
  const dayScrollRef = useRef<HTMLElement>(null);
  const weekScrollRef = useRef<HTMLDivElement>(null);
  const lastScrolledRange = useRef("");
  const [layoutRevision, setLayoutRevision] = useState(0);
  useEffect(() => {
    const weekLayout = window.matchMedia("(max-width: 1150px)");
    const handleLayoutChange = () => setLayoutRevision((revision) => revision + 1);
    weekLayout.addEventListener("change", handleLayoutChange);
    return () => weekLayout.removeEventListener("change", handleLayoutChange);
  }, []);
  useEffect(() => {
    if (view === "month") return;
    const key = `${view}:${dates[0]}:${zone}:${layoutRevision}`;
    if (lastScrolledRange.current === key) return;
    const container = view === "day" ? dayScrollRef.current : weekScrollRef.current;
    if (!container) return;
    const todayIsVisible = dates.includes(todayDate);
    const timedStartHours = dates.flatMap((day) => {
      const range = localDateRange(day, addDays(day, 1), zone);
      return itemsOnDate(projection.items, day, zone)
        .filter((item) => item.kind !== "all-day")
        .map((item) => (Math.max(Date.parse(item.interval.start), Date.parse(range.start)) - Date.parse(range.start)) / 3_600_000);
    });
    const earliestHour = timedStartHours.reduce((earliest, startHour) => Math.min(earliest, startHour), Infinity);
    const hour = todayIsVisible ? (() => {
      const range = localDateRange(todayDate, addDays(todayDate, 1), zone);
      return (now.getTime() - Date.parse(range.start)) / 3_600_000;
    })() : Number.isFinite(earliestHour) ? earliestHour : 0;
    container.scrollTop = Math.max(0, hour * (view === "day" ? 60 : 56) - 370);
    lastScrolledRange.current = key;
  }, [dates, layoutRevision, now, projection, todayDate, view, zone]);
  if (view === "day") return <Agenda date={date} items={itemsOnDate(projection.items, date, zone)} locale={locale} now={now} zone={zone} scrollRef={dayScrollRef} />;
  if (view === "week") {
    const days = dates.map((day) => ({ date: day, items: itemsOnDate(projection.items, day, zone) }));
    const hasAllDay = days.some((day) => day.items.some((item) => item.kind === "all-day"));
    const weekNowTop = dates.includes(todayDate) ? (() => {
      const range = localDateRange(todayDate, addDays(todayDate, 1), zone);
      return (now.getTime() - Date.parse(range.start)) / 3_600_000 * 56;
    })() : null;
    return <>
      <div className="calendar-week-desktop" role="group" aria-label={t("calendar.week")}>
        <div className="calendar-week-headings">
          <span className="calendar-week-gutter-spacer" aria-hidden />
          {days.map(({ date: day }) => (
            <button key={day} type="button" className="calendar-week-heading" data-selected={day === date} data-today={day === todayDate} data-weekend={isWeekend(day)} aria-current={day === todayDate ? "date" : undefined} aria-pressed={day === date} onClick={() => onOpenDay(day)} aria-label={`${t("calendar.openDay")} ${formatDate(day, locale, { dateStyle: "full" })}`}>
              <span className="calendar-week-weekday">{formatDate(day, locale, { weekday: "short" })}</span>
              <span className="calendar-week-date">{Number(day.slice(-2))}</span>
            </button>
          ))}
        </div>
        {hasAllDay && <div className="calendar-week-all-day-row"><span className="calendar-week-all-day-label">{t("calendar.allDay")}</span>{days.map(({ date: day, items }) => <div key={day} className="calendar-week-all-day-cell" data-weekend={isWeekend(day)}><AllDay items={items.filter((item) => item.kind === "all-day")} locale={locale} zone={zone} /></div>)}</div>}
        <div ref={weekScrollRef} className="calendar-week-viewport">
          {weekNowTop !== null && <div className="calendar-week-now" style={{ top: `${weekNowTop}px` }} aria-label={t("calendar.currentTime")}><span>{formatTime(now.getTime(), locale, zone)}</span></div>}
          <div className="calendar-week-timelines">
          <WeekTimeGutter date={dates[0]} locale={locale} zone={zone} />
          {days.map(({ date: day, items }) => <section key={day} className="calendar-week-column" data-selected={day === date} data-today={day === todayDate} data-weekend={isWeekend(day)} aria-label={formatDate(day, locale, { dateStyle: "full" })}><Timeline date={day} items={items} locale={locale} now={now} zone={zone} compact showGutter={false} /></section>)}
          </div>
        </div>
      </div>
      <div className="calendar-week-mobile">{days.map(({ date: day, items }) => (
        <section key={day} className="calendar-mobile-day" data-has-items={items.length > 0} data-weekend={isWeekend(day)} aria-label={formatDate(day, locale, { dateStyle: "full" })}>
          <button type="button" className="calendar-mobile-heading" data-selected={day === date} data-today={day === todayDate} aria-current={day === todayDate ? "date" : undefined} aria-pressed={day === date} onClick={() => onOpenDay(day)}>{formatDate(day, locale, { weekday: "long", month: "short", day: "numeric" })}</button>
          {items.length ? items.map((item) => <ItemText key={item.key} item={item} locale={locale} zone={zone} displayDate={day} />) : day === date && <p className="calendar-mobile-empty">{t("calendar.emptyDay")}</p>}
        </section>
      ))}</div>
    </>;
  }
  const month = date.slice(0, 7);
  return <><div className="calendar-month" role="group" aria-label={formatDate(date, locale, { month: "long", year: "numeric" })}>
    {dates.slice(0, 7).map((day) => <div key={`heading-${day}`} className="calendar-month-weekday">{formatDate(day, locale, { weekday: "short" })}</div>)}
    {dates.map((day) => {
      const items = itemsOnDate(projection.items, day, zone);
      const itemSummary = items.map((item) => `${item.source === "task" ? t("calendar.plannedTask") : item.busy ? t("calendar.busy") : t("calendar.free")}: ${item.title}${item.workspaceId ? `, ${t("common.workspace")}: ${item.workspaceId}` : ""}`).join("; ");
      return <button key={day} type="button" className="calendar-month-day" data-has-items={items.length > 0} data-outside={day.slice(0, 7) !== month} data-today={day === todayDate} data-weekend={isWeekend(day)} aria-current={day === todayDate ? "date" : undefined} aria-pressed={day === date} onClick={() => onSelectDate(day)} aria-label={`${formatDate(day, locale, { dateStyle: "full" })}, ${items.length} ${t("calendar.items")}${itemSummary ? `. ${itemSummary}` : ""}`}>
        <span className="calendar-month-number">{Number(day.slice(-2))}</span>
        <span className="calendar-month-previews">{items.slice(0, 2).map((item) => <span key={item.key} className={`calendar-month-preview ${item.source === "task" ? "calendar-preview-task" : item.busy ? "calendar-preview-event" : "calendar-preview-free"}`}><ItemIcon item={item} /><span>{item.title}{item.workspaceId && <span className="calendar-month-preview-workspace"> · {item.workspaceId}</span>}</span></span>)}{items.length > 2 && <span className="calendar-month-more"><span>+{items.length - 2}</span><span className="calendar-more-label"> {t("calendar.more")}</span></span>}</span>
      </button>;
    })}
  </div><div className="calendar-month-detail"><h2>{formatDate(date, locale, { dateStyle: "full" })}</h2><button type="button" className="calendar-open-day" onClick={() => onOpenDay(date)}>{t("calendar.openDay")}</button><div className="calendar-detail-items">{itemsOnDate(projection.items, date, zone).length ? itemsOnDate(projection.items, date, zone).map((item) => <ItemText key={item.key} item={item} locale={locale} zone={zone} displayDate={date} />) : <p className="text-sm text-muted">{t("calendar.emptyDay")}</p>}</div></div></>;
}
