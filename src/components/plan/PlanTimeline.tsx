"use client";

import { CalendarDays, CheckSquare2, CircleDashed } from "lucide-react";
import { useMemo, type CSSProperties } from "react";

import { useI18n } from "@/components/i18n/I18nProvider";
import { blockingConflict, type IanaTimeZone, type LocalDate, type ScheduleItem,
  type UtcInstant } from "@/core/schedule/domain";
import { localDateRange } from "@/core/schedule/projection";
import { addDays, dateInZone, itemsOnDate, placeTimedItems } from "@/lib/calendar-view";

type Props = {
  blocksById: ReadonlySet<string>;
  date: LocalDate;
  items: readonly ScheduleItem[];
  locale: "en" | "ua";
  localEndTime: string;
  localStartTime: string;
  now: Date;
  onSelectBlock: (blockId: string) => void;
  onSelectInstant: (instant: UtcInstant) => void;
  selectedBlockId: string | null;
  slotMode: "move" | "place" | null;
  zone: IanaTimeZone;
};

function formatTime(instant: string | number, locale: "en" | "ua", zone: IanaTimeZone) {
  return new Intl.DateTimeFormat(locale === "ua" ? "uk-UA" : "en-US", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(typeof instant === "number" ? instant : new Date(instant));
}

function offset(instant: number, zone: IanaTimeZone) {
  return new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "shortOffset" })
    .formatToParts(instant).find((part) => part.type === "timeZoneName")?.value ?? "UTC";
}

function formatDate(date: LocalDate, locale: "en" | "ua") {
  return new Intl.DateTimeFormat(locale === "ua" ? "uk-UA" : "en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function ItemIcon({ item }: { item: ScheduleItem }) {
  const Icon = item.source === "task" ? CheckSquare2 : item.busy ? CalendarDays : CircleDashed;
  return <Icon className="h-3.5 w-3.5" aria-hidden />;
}

function itemClass(item: ScheduleItem) {
  return item.source === "task" ? "plan-item-task" : item.busy ? "plan-item-event" : "plan-item-free";
}

function AgendaItem({ conflict, item, locale, onSelectBlock, selected, zone }: {
  conflict: boolean;
  item: ScheduleItem;
  locale: "en" | "ua";
  onSelectBlock: (blockId: string) => void;
  selected: boolean;
  zone: IanaTimeZone;
}) {
  const { t } = useI18n();
  const content = <>
    <span className="plan-item-title"><ItemIcon item={item} /><span>{item.title}</span></span>
    <span className="plan-item-time">{item.kind === "all-day" ? t("calendar.allDay") :
      `${formatTime(item.interval.start, locale, zone)}–${formatTime(item.interval.end, locale, zone)}`}</span>
    {conflict && <span className="plan-item-conflict">{t("plan.conflictBadge")}</span>}
  </>;
  return item.source === "task" && item.blockId ? (
    <button type="button" className={`plan-agenda-item ${itemClass(item)}`}
      data-conflict={conflict || undefined} data-selected={selected || undefined}
      onClick={() => onSelectBlock(item.blockId!)}>{content}</button>
  ) : (
    <div className={`plan-agenda-item ${itemClass(item)}`} data-conflict={conflict || undefined}>{content}</div>
  );
}

export function PlanTimeline({ blocksById, date, items, locale, localEndTime, localStartTime,
  now, onSelectBlock, onSelectInstant, selectedBlockId, slotMode, zone }: Props) {
  const { t } = useI18n();
  const dayItems = itemsOnDate(items, date, zone);
  const conflicts = useMemo(() => {
    const keys = new Set<string>();
    for (let left = 0; left < items.length; left += 1) {
      for (let right = left + 1; right < items.length; right += 1) {
        if (blockingConflict(items[left], items[right])) {
          keys.add(items[left].key);
          keys.add(items[right].key);
        }
      }
    }
    return keys;
  }, [items]);
  const range = localDateRange(date, addDays(date, 1), zone);
  const dayStart = Date.parse(range.start);
  const dayEnd = Date.parse(range.end);
  const slots = Array.from({ length: Math.ceil((dayEnd - dayStart) / 1_800_000) }, (_, index) =>
    dayStart + index * 1_800_000);
  const timed = dayItems.filter((item) => item.kind !== "all-day");
  const allDay = dayItems.filter((item) => item.kind === "all-day");
  const placed = placeTimedItems(timed, date, zone);
  const height = slots.length * 36;
  const nowMs = now.getTime();
  const mobileDates = [date, addDays(date, 1), addDays(date, 2)];
  const today = dateInZone(now, zone);

  return <div className="plan-schedule" data-editing={slotMode === "move" || undefined}>
    {slotMode === "move" && <p className="plan-timeline-mode" role="status">
      {t("plan.blockEditMode")}
    </p>}
    {allDay.length > 0 && <div className="plan-all-day">
      {allDay.map((item) => <AgendaItem key={item.key} item={item} locale={locale} zone={zone}
        conflict={conflicts.has(item.key)} selected={false} onSelectBlock={onSelectBlock} />)}
    </div>}
    <div className="plan-timeline-desktop" style={{ height }}>
      {slots.map((instant) => {
        const time = formatTime(instant, locale, zone);
        const insideWindow = time >= localStartTime.slice(0, 5) && time < localEndTime.slice(0, 5);
        return <button key={instant} type="button" className="plan-slot"
          data-hour={time.endsWith(":00") || undefined} data-window={insideWindow || undefined}
          data-mode={slotMode ?? undefined} disabled={slotMode === null}
          aria-label={slotMode === "move" ?
            t("plan.moveBlockTo").replace("{time}", time).replace("{offset}", offset(instant, zone)) :
            `${time}, ${offset(instant, zone)}`}
          onClick={() => onSelectInstant(new Date(instant).toISOString() as UtcInstant)}>
          {time.endsWith(":00") && <span>{time}</span>}
        </button>;
      })}
      {nowMs >= dayStart && nowMs < dayEnd && <div className="plan-now"
        style={{ top: `${(nowMs - dayStart) / (dayEnd - dayStart) * height}px` }} aria-label={t("calendar.currentTime")} />}
      {placed.map(({ item, start, end, column, columns }) => {
        const style: CSSProperties = {
          top: `${(start - dayStart) / (dayEnd - dayStart) * height}px`,
          height: `${Math.max(34, (end - start) / (dayEnd - dayStart) * height)}px`,
          left: `calc(4rem + ${(column / columns) * 100}% - ${(column / columns) * 4}rem)`,
          width: `calc(${100 / columns}% - ${4 / columns}rem - 6px)`,
        };
        const blockEditable = item.source === "task" && item.blockId && blocksById.has(item.blockId);
        const content = <><span className="plan-item-title"><ItemIcon item={item} /><span>{item.title}</span></span>
          <span className="plan-item-time">{formatTime(item.interval.start, locale, zone)}–{formatTime(item.interval.end, locale, zone)}</span>
          {conflicts.has(item.key) && <span className="plan-item-conflict">{t("plan.conflictBadge")}</span>}</>;
        return blockEditable ? <button key={item.key} type="button" style={style}
          className={`plan-timed-item ${itemClass(item)}`} data-conflict={conflicts.has(item.key) || undefined}
          data-selected={item.blockId === selectedBlockId || undefined}
          aria-label={t("plan.editBlockAction").replace("{task}", item.title)}
          onClick={() => onSelectBlock(item.blockId!)}>{content}</button> :
          <div key={item.key} style={style} className={`plan-timed-item ${itemClass(item)}`}
            data-conflict={conflicts.has(item.key) || undefined}>{content}</div>;
      })}
    </div>
    <div className="plan-agenda-mobile">
      {mobileDates.map((mobileDate, index) => {
        const agendaItems = itemsOnDate(items, mobileDate, zone).sort((a, b) =>
          Date.parse(a.interval.start) - Date.parse(b.interval.start) || a.key.localeCompare(b.key));
        if (index > 0 && agendaItems.length === 0) return null;
        return <section className="plan-agenda-day" key={mobileDate}>
          <h3>{mobileDate === today ? t("calendar.today") : formatDate(mobileDate, locale)}</h3>
          {agendaItems.length > 0 ? agendaItems.map((item) => <AgendaItem key={item.key} item={item}
            locale={locale} zone={zone} conflict={conflicts.has(item.key)}
            selected={item.source === "task" && item.blockId === selectedBlockId}
            onSelectBlock={onSelectBlock} />) : <p className="plan-empty-day">{t("plan.emptyDay")}</p>}
        </section>;
      })}
    </div>
  </div>;
}
