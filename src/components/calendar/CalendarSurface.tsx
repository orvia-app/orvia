"use client";

import Link from "next/link";
import { CalendarDays, CheckSquare2, CircleDashed } from "lucide-react";
import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
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

function ItemText({ item, locale, zone, compact = false }: {
  item: ScheduleItem; locale: "en" | "ua"; zone: IanaTimeZone; compact?: boolean;
}) {
  const { t } = useI18n();
  const type = item.source === "task" ? t("calendar.plannedTask") : t("calendar.event");
  const state = item.busy ? t("calendar.busy") : t("calendar.free");
  const time = item.kind === "all-day" ? t("calendar.allDay") :
    `${formatTime(item.interval.start, locale, zone)}–${formatTime(item.interval.end, locale, zone)}`;
  const originZone = item.source === "orvia-event" && item.timezone !== zone ? ` · ${item.timezone}` : "";
  const label = `${type}: ${item.title}. ${time}${originZone}. ${state}${item.workspaceId ? `. ${t("common.workspace")}: ${item.workspaceId}` : ""}`;
  const CompactIcon = item.source === "task" ? CheckSquare2 : item.busy ? CalendarDays : CircleDashed;
  const content = <>
    <span className="calendar-item-title">{compact && <CompactIcon className="h-3 w-3" aria-hidden />}<span className="min-w-0 truncate">{item.title}</span></span>
    {!compact && <span className="calendar-item-meta">{type} · {time}{originZone}{item.source === "orvia-event" ? ` · ${state}` : ""}{item.workspaceId ? ` · ${item.workspaceId}` : ""}</span>}
  </>;
  return item.source === "task" ?
    <Link className="calendar-item calendar-task" href={`/app/tasks?taskId=${encodeURIComponent(item.sourceId)}`} aria-label={label} title={label}>{content}</Link> :
    <div className={`calendar-item ${item.busy ? "calendar-event" : "calendar-free"}`} role="group" tabIndex={0} aria-label={label} title={label}>{content}</div>;
}

function AllDay({ items, locale, zone }: { items: ScheduleItem[]; locale: "en" | "ua"; zone: IanaTimeZone }) {
  const { t } = useI18n();
  if (!items.length) return null;
  return <div className="calendar-all-day"><span className="calendar-all-day-label">{t("calendar.allDay")}</span><div className="calendar-all-day-items">{items.map((item) => <ItemText key={item.key} item={item} locale={locale} zone={zone} />)}</div></div>;
}

function Timeline({ date, items, locale, now, zone, compact = false }: {
  date: LocalDate; items: ScheduleItem[]; locale: "en" | "ua"; now: Date; zone: IanaTimeZone; compact?: boolean;
}) {
  const { t } = useI18n();
  const range = localDateRange(date, addDays(date, 1), zone);
  const start = Date.parse(range.start);
  const end = Date.parse(range.end);
  const durationHours = (end - start) / 3_600_000;
  const hours = Math.ceil(durationHours);
  const hourLabels = Array.from({ length: hours }, (_, index) => formatTime(start + index * 3_600_000, locale, zone));
  const placed = placeTimedItems(items, date, zone);
  const nowMs = now.getTime();
  return <div className={`calendar-timeline ${compact ? "calendar-timeline-compact" : ""}`} style={{ height: `${durationHours * (compact ? 48 : 60)}px` }}>
    {hourLabels.map((label, index) => <div key={index} className="calendar-hour" style={{ top: `${index / durationHours * 100}%` }}><span>{label}{hourLabels.indexOf(label) !== hourLabels.lastIndexOf(label) ? offsetLabel(start + index * 3_600_000, zone) : ""}</span></div>)}
    {nowMs >= start && nowMs < end && <div className="calendar-now" style={{ top: `${(nowMs - start) / (end - start) * 100}%` }}><span className="sr-only">{t("calendar.currentTime")}</span></div>}
    {placed.map(({ item, start: itemStart, end: itemEnd, column, columns }) => {
      const top = (itemStart - start) / (end - start) * 100;
      const style: CSSProperties = {
        top: `${top}%`,
        height: `${Math.min(Math.max((itemEnd - itemStart) / (end - start) * 100, 1.5), 100 - top)}%`,
        left: `calc(${column / columns * 100}% + ${3.6 * (1 - column / columns)}rem)`,
        width: `calc(${100 / columns}% - ${3.6 / columns}rem - 3px)`,
      };
      return <div key={item.key} className="calendar-timed-position" style={style}><ItemText item={item} locale={locale} zone={zone} compact={compact} /></div>;
    })}
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
    <Timeline date={date} items={items} locale={locale} now={now} zone={zone} />
  </section>;
}

export function CalendarSurface({ date, dates, locale, now, onSelectDate, onOpenDay, projection, view, zone }: Props) {
  const { t } = useI18n();
  const todayDate = dateInZone(now, zone);
  const dayScrollRef = useRef<HTMLElement>(null);
  const weekScrollRef = useRef<HTMLDivElement>(null);
  const lastScrolledRange = useRef("");
  useEffect(() => {
    if (view === "month") return;
    const key = `${view}:${dates[0]}:${zone}`;
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
    container.scrollTop = Math.max(0, hour * (view === "day" ? 60 : 48) - 150);
    lastScrolledRange.current = key;
  }, [dates, now, projection, todayDate, view, zone]);
  if (view === "day") return <Agenda date={date} items={itemsOnDate(projection.items, date, zone)} locale={locale} now={now} zone={zone} scrollRef={dayScrollRef} />;
  if (view === "week") {
    const days = dates.map((day) => ({ date: day, items: itemsOnDate(projection.items, day, zone) }));
    const hasAllDay = days.some((day) => day.items.some((item) => item.kind === "all-day"));
    return <>
      <div className="calendar-week-desktop" role="group" aria-label={t("calendar.week")}>
        <div className="calendar-week-headings">
          {days.map(({ date: day }) => (
            <button key={day} type="button" className="calendar-week-heading" data-today={day === todayDate} aria-current={day === todayDate ? "date" : undefined} onClick={() => onOpenDay(day)} aria-label={`${t("calendar.openDay")} ${formatDate(day, locale, { dateStyle: "full" })}`}>
              <span className="calendar-week-weekday">{formatDate(day, locale, { weekday: "short" })}</span>
              <span className="calendar-week-date">{Number(day.slice(-2))}</span>
            </button>
          ))}
        </div>
        {hasAllDay && <div className="calendar-week-all-day-row">{days.map(({ date: day, items }) => <div key={day} className="calendar-week-all-day-cell"><AllDay items={items.filter((item) => item.kind === "all-day")} locale={locale} zone={zone} /></div>)}</div>}
        <div ref={weekScrollRef} className="calendar-week-viewport"><div className="calendar-week-timelines">
          {days.map(({ date: day, items }) => <section key={day} className="calendar-week-column" data-today={day === todayDate} aria-label={formatDate(day, locale, { dateStyle: "full" })}><Timeline date={day} items={items} locale={locale} now={now} zone={zone} compact /></section>)}
        </div></div>
      </div>
      <div className="calendar-week-mobile">{days.map(({ date: day, items }) => (
        <section key={day} className="calendar-mobile-day" aria-label={formatDate(day, locale, { dateStyle: "full" })}>
          <button type="button" className="calendar-mobile-heading" data-today={day === todayDate} aria-current={day === todayDate ? "date" : undefined} onClick={() => onOpenDay(day)}>{formatDate(day, locale, { weekday: "long", month: "short", day: "numeric" })}</button>
          {items.length ? items.map((item) => <ItemText key={item.key} item={item} locale={locale} zone={zone} />) : <p className="calendar-mobile-empty">{t("calendar.emptyDay")}</p>}
        </section>
      ))}</div>
    </>;
  }
  const month = date.slice(0, 7);
  return <><div className="calendar-month" role="group" aria-label={formatDate(date, locale, { month: "long", year: "numeric" })}>
    {dates.slice(0, 7).map((day) => <div key={`heading-${day}`} className="calendar-month-weekday">{formatDate(day, locale, { weekday: "short" })}</div>)}
    {dates.map((day) => {
      const items = itemsOnDate(projection.items, day, zone);
      return <button key={day} type="button" className="calendar-month-day" data-outside={day.slice(0, 7) !== month} data-today={day === todayDate} aria-current={day === todayDate ? "date" : undefined} aria-pressed={day === date} onClick={() => onSelectDate(day)} aria-label={`${formatDate(day, locale, { dateStyle: "full" })}, ${items.length} ${t("calendar.items")}`}>
        <span className="calendar-month-number">{Number(day.slice(-2))}</span>
        <span className="calendar-month-previews">{items.slice(0, 2).map((item) => <span key={item.key} className={`calendar-month-preview ${item.source === "task" ? "calendar-preview-task" : item.busy ? "calendar-preview-event" : "calendar-preview-free"}`}>{item.title}</span>)}{items.length > 2 && <span className="calendar-month-more">+{items.length - 2} {t("calendar.more")}</span>}</span>
      </button>;
    })}
  </div><div className="calendar-month-detail"><h2>{formatDate(date, locale, { dateStyle: "full" })}</h2><button type="button" className="calendar-open-day" onClick={() => onOpenDay(date)}>{t("calendar.openDay")}</button><div className="calendar-detail-items">{itemsOnDate(projection.items, date, zone).length ? itemsOnDate(projection.items, date, zone).map((item) => <ItemText key={item.key} item={item} locale={locale} zone={zone} />) : <p className="text-sm text-muted">{t("calendar.emptyDay")}</p>}</div></div></>;
}
