import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const source = (path) => readFileSync(resolve(root, path), "utf8");

function load(path, dependencies = {}) {
  const filename = resolve(root, path);
  const compiled = ts.transpileModule(source(path), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  const loaded = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    Date, Intl, RangeError, TypeError, Error,
    exports: loaded.exports, module: loaded,
    require: (id) => {
      if (!(id in dependencies)) throw new Error(`Missing test dependency ${id}`);
      return dependencies[id];
    },
  }, { filename });
  return loaded.exports;
}

const { translations } = load("src/lib/i18n.ts");
const domain = load("src/core/schedule/domain.ts");
const projectionDomain = load("src/core/schedule/projection.ts", { "./domain": domain });
const calendarView = load("src/lib/calendar-view.ts", {
  "@/core/schedule/domain": domain,
  "@/core/schedule/projection": projectionDomain,
});
const mutation = load("src/lib/calendar-event-mutation.ts", {
  "@/core/schedule/domain": domain,
  "@/core/schedule/projection": projectionDomain,
});
let locale = "en";
const skeleton = load("src/components/ui/Skeleton.tsx", {
  "react/jsx-runtime": require("react/jsx-runtime"),
});
const timeField = load("src/components/events/EventTimeField.tsx", {
  react: React,
  "react-dom": require("react-dom"),
  "react/jsx-runtime": require("react/jsx-runtime"),
  "lucide-react": require("lucide-react"),
  "@/components/i18n/I18nProvider": { useI18n: () => ({ t: (key) => translations[locale][key] }) },
  "@/components/ui/Field": { Input: "input", Select: "select" },
});
const ui = load("src/components/events/EventEditor.tsx", {
  react: React,
  "react/jsx-runtime": require("react/jsx-runtime"),
  "lucide-react": require("lucide-react"),
  "@/components/i18n/I18nProvider": { useI18n: () => ({ t: (key) => translations[locale][key] }) },
  "@/components/ui/Button": { Button: ({ children, ...props }) => React.createElement("button", props, children) },
  "@/components/ui/Field": { Input: "input", Select: "select", Textarea: "textarea" },
  "@/components/ui/Skeleton": skeleton,
  "@/components/ui/useDialogFocus": { useDialogFocus: () => React.useRef(null) },
  "@/components/events/EventTimeField": timeField,
  "@/core/schedule/domain": domain,
  "@/core/plan/workspace": { localTimeCandidates: () => [] },
  "@/lib/events-api": {},
  "@/lib/event-form": { eventDetailsFromCapture: () => ({ description: "" }) },
});
const calendarSurface = load("src/components/calendar/CalendarSurface.tsx", {
  react: React,
  "react/jsx-runtime": require("react/jsx-runtime"),
  "next/link": ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children),
  "lucide-react": require("lucide-react"),
  "@/components/i18n/I18nProvider": { useI18n: () => ({ t: (key) => translations[locale][key] }) },
  "@/lib/calendar-view": calendarView,
  "@/core/schedule/projection": projectionDomain,
});

test("Calendar grid renders the full local day and both cross-midnight Event segments", () => {
  locale = "en";
  const event = {
    key: "orvia-event:midnight", sourceId: "midnight", source: "orvia-event", ownerId: "owner",
    title: "[QA] Placement task qa", busy: true, kind: "timed", timezone: "Europe/Kyiv",
    interval: { start: "2026-10-04T20:00:00.000Z", end: "2026-10-04T22:00:00.000Z" },
  };
  const calendar = (date) => renderToStaticMarkup(React.createElement(calendarSurface.CalendarSurface, {
    date, dates: [date], locale, now: new Date("2026-10-06T10:00:00.000Z"),
    onSelectDate: () => {}, onOpenDay: () => {}, onOpenEvent: () => {},
    projection: { items: [event] }, view: "day", zone: "Europe/Kyiv",
  }));
  const first = calendar("2026-10-04");
  const second = calendar("2026-10-05");
  assert.match(first, /height:1440px/);
  assert.match(second, /height:1440px/);
  assert.match(first, /top:95\.83333333333334%/);
  assert.match(second, /top:0%/);
  assert.match(first, /23:00–00:00/);
  assert.match(second, /00:00–01:00/);
  assert.match(first, /↦/);
  assert.match(second, /↤/);
  assert.ok(first.includes(event.title) && second.includes(event.title));
  assert.doesNotMatch(first, /class="min-w-0 truncate"/);
  assert.match(first, /<button type="button" class="calendar-item calendar-event"/);
  const week = (date) => renderToStaticMarkup(React.createElement(calendarSurface.CalendarSurface, {
    date, dates: calendarView.viewDates(date, "week"), locale,
    now: new Date("2026-10-06T10:00:00.000Z"),
    onSelectDate: () => {}, onOpenDay: () => {}, onOpenEvent: () => {},
    projection: { items: [event] }, view: "week", zone: "Europe/Kyiv",
  }));
  const firstWeek = week("2026-10-04");
  const secondWeek = week("2026-10-05");
  assert.equal((firstWeek.match(/height:1344px/g) ?? []).length, 8);
  assert.equal((secondWeek.match(/height:1344px/g) ?? []).length, 8);
  assert.match(firstWeek, /23:00–00:00/);
  assert.match(secondWeek, /00:00–01:00/);
});

test("short Event cards reserve a readable time line and scroll viewports expose the day end", () => {
  const shortEvent = {
    key: "orvia-event:short", sourceId: "short", source: "orvia-event", ownerId: "owner",
    title: "A long enough Event title to need a compact card", busy: true, kind: "timed",
    timezone: "Europe/Kyiv",
    interval: { start: "2026-10-04T20:00:00.000Z", end: "2026-10-04T21:30:00.000Z" },
  };
  const short = renderToStaticMarkup(React.createElement(calendarSurface.CalendarSurface, {
    date: "2026-10-05", dates: ["2026-10-05"], locale: "en",
    now: new Date("2026-10-06T10:00:00.000Z"),
    onSelectDate: () => {}, onOpenDay: () => {}, onOpenEvent: () => {},
    projection: { items: [shortEvent] }, view: "day", zone: "Europe/Kyiv",
  }));
  assert.match(short, /data-short="true"/);
  assert.match(short, /00:00–00:30/);
  assert.match(short, /calendar-item-continuation-short" aria-hidden="true"> ↤/);
  assert.match(short, /--calendar-title-lines:1/);
  const css = source("src/app/app/calendar/calendar.css");
  assert.match(css, /\.calendar-timed-position\[data-short="true"\] \.calendar-item:is\(\.calendar-event, \.calendar-free\) \{[^}]*padding-block: 1px/);
  assert.match(css, /\.calendar-timed-position\[data-short="true"\] \.calendar-item:is\(\.calendar-event, \.calendar-free\) \.calendar-item-continuation-short \{ display: inline; \}/);
  assert.match(css, /\.calendar-agenda \{[^}]*padding-bottom: \.75rem/);
  assert.match(css, /\.calendar-week-timelines \{ padding-block: \.75rem; \}/);
  assert.match(css, /\.calendar-agenda > \.calendar-timeline \{ margin-top: \.75rem; \}/);
  assert.match(css, /\.calendar-timed-position > \.calendar-item:is\(button\) \{ width: 100%; \}/);
  assert.doesNotMatch(css, /max-height: max\(40rem, calc\(100dvh/);
  assert.doesNotMatch(css, /overscroll-behavior: contain/);
});

test("single Events fill their placement column while overlaps keep separate widths", () => {
  locale = "en";
  const first = {
    key: "orvia-event:first", sourceId: "first", source: "orvia-event", ownerId: "owner",
    title: "[QA] Placement task qa", busy: true, kind: "timed", timezone: "Europe/Kyiv",
    interval: { start: "2026-10-04T21:00:00.000Z", end: "2026-10-04T22:00:00.000Z" },
  };
  const second = {
    ...first, key: "orvia-event:second", sourceId: "second", title: "A longer overlapping Event title",
    interval: { start: "2026-10-04T21:15:00.000Z", end: "2026-10-04T22:15:00.000Z" },
  };
  const render = (view, items) => renderToStaticMarkup(React.createElement(calendarSurface.CalendarSurface, {
    date: "2026-10-05", dates: calendarView.viewDates("2026-10-05", view), locale,
    now: new Date("2026-10-06T10:00:00.000Z"),
    onSelectDate: () => {}, onOpenDay: () => {}, onOpenEvent: () => {},
    projection: { items }, view, zone: "Europe/Kyiv",
  }));
  const singleDay = render("day", [first]);
  const overlapDay = render("day", [first, second]);
  const singleWeek = render("week", [first]);
  const overlapWeek = render("week", [first, second]);
  assert.match(singleDay, /data-columns="1"[^>]*width:calc\(100% - 3\.75rem - 3px\)/);
  assert.equal((overlapDay.match(/data-columns="2"/g) ?? []).length, 2);
  assert.equal((overlapDay.match(/width:calc\(50% - 1\.875rem - 3px\)/g) ?? []).length, 2);
  assert.match(singleWeek, /data-columns="1"[^>]*width:calc\(100% - 4px\)/);
  assert.equal((overlapWeek.match(/data-columns="2"/g) ?? []).length, 2);
  assert.equal((overlapWeek.match(/width:calc\(50% - 4px\)/g) ?? []).length, 2);
  assert.match(overlapWeek, /A longer overlapping Event title/);
  assert.match(overlapWeek, /00:15–01:15/);
});

test("Event time fields keep a compact input with one shared selector and exact typed values", () => {
  for (const language of ["en", "ua"]) {
    locale = language;
    const html = renderToStaticMarkup(React.createElement(timeField.EventTimeField, {
      id: "start-time", label: translations[language]["event.startTime"], value: "09:37",
      fallback: "09:00", disabled: false, open: false, onOpen: () => {}, onClose: () => {}, onToggle: () => {}, onChange: () => {},
    }));
    assert.match(html, /type="text"/);
    assert.match(html, /inputMode="numeric"|inputmode="numeric"/);
    assert.match(html, /value="09:37"/);
    assert.match(html, /aria-expanded="false"/);
    assert.ok(html.includes(translations[language]["event.chooseTime"]));
    assert.doesNotMatch(html, /type="time"/);
  }
  const selector = source("src/components/events/EventTimeField.tsx");
  assert.match(selector, /createPortal\(/);
  assert.match(selector, /role="group"/);
  assert.match(selector, /onFocus=\{onOpen\}/);
  assert.match(selector, /onClick=\{\(\) => \{ focusPickerRef\.current = false; onOpen\(\); \}\}/);
  assert.match(selector, /<Select ref=\{hourRef\}/);
  assert.doesNotMatch(selector, /size=\{6\}|h-36|scrollIntoView/);
  assert.equal(timeField.timePopoverPosition({ top: 380, bottom: 424, left: 280 }, 320, 480).top, 276);
  assert.equal(timeField.timePopoverPosition({ top: 180, bottom: 224, left: 20 }, 320, 480).top, 228);
  assert.equal(timeField.timePopoverPosition({ top: 380, bottom: 424, left: 280 }, 320, 480).left, 88);
  assert.equal(timeField.withSelectedTimePart("09:37", "minute", "05", "09:00"), "09:05");
  assert.equal(timeField.withSelectedTimePart("09:37", "hour", "23", "09:00"), "23:37");
  assert.equal(timeField.withSelectedTimePart("09:37", "hour", "14", "09:00"), "14:37");
  assert.equal(timeField.withSelectedTimePart("14:37", "minute", "35", "09:00"), "14:35");
  assert.equal(timeField.withSelectedTimePart("", "hour", "08", "09:00"), "08:00");
  assert.equal(timeField.withSelectedTimePart("", "minute", "45", "10:00"), "10:45");
  const editor = renderToStaticMarkup(React.createElement(ui.EventEditor, {
    accessToken: "test", date: "2026-10-04", zone: "Europe/Kyiv",
    onClose: () => {}, onSaved: () => {},
  }));
  assert.match(editor, /id="event-start-time"/);
  assert.match(editor, /id="event-end-time"/);
  assert.doesNotMatch(editor, /type="time"/);
});

test("Event details open immediately with an accessible structural skeleton and no actions", () => {
  for (const language of ["en", "ua"]) {
    locale = language;
    const html = renderToStaticMarkup(React.createElement(ui.EventEditor, {
      accessToken: "test", date: "2026-10-04", eventId: "event-1", zone: "Europe/Kyiv",
      onClose: () => {}, onSaved: () => {},
    }));
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
    assert.match(html, /role="status"/);
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /min-h-\[min\(44rem/);
    assert.ok((html.match(/animate-pulse/g) ?? []).length >= 10);
    assert.match(html, /class="sr-only"/);
    assert.doesNotMatch(html, /<form/);
    assert.doesNotMatch(html, new RegExp(`>${translations[language]["event.edit"]}<`));
  }
});

test("Event loading failure has localized error and working Retry control", () => {
  for (const language of ["en", "ua"]) {
    locale = language;
    let retries = 0;
    const tree = ui.EventEditorLoadError({ onRetry: () => { retries += 1; } });
    const html = renderToStaticMarkup(tree);
    assert.match(html, /role="alert"/);
    assert.ok(html.includes(translations[language]["event.loadError"]));
    assert.ok(html.includes(translations[language]["calendar.retry"]));
    tree.props.children[1].props.onClick();
    assert.equal(retries, 1);
  }
  const editor = source("src/components/events/EventEditor.tsx");
  assert.match(editor, /setLoadRevision\(\(value\) => value \+ 1\)/);
  assert.match(editor, /loadFailed \? <EventEditorLoadError/);
  assert.doesNotMatch(editor, /error === t\("event.loadError"\)/);
});

const ownerId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const record = {
  id: "event-1", title: "Before edit", description: null, timezone: "Europe/Kyiv", busy: true,
  all_day: false, start_at: "2026-10-04T07:00:00.000Z", end_at: "2026-10-04T08:00:00.000Z",
  start_date: null, end_date_exclusive: null,
};
const initialProjection = {
  range: { start: "2026-10-04T00:00:00.000Z", end: "2026-10-11T00:00:00.000Z" },
  planningTimezone: "Europe/Kyiv", completeness: "complete",
  sources: { events: { state: "complete" }, tasks: { state: "complete" } },
  unplacedTasks: [],
  items: [
    { key: "orvia-event:event-1", sourceId: "event-1", source: "orvia-event", ownerId,
      title: "Before edit", busy: true, intelligenceEligible: false, sourceState: "complete",
      kind: "timed", timezone: "Europe/Kyiv",
      interval: { start: record.start_at, end: record.end_at } },
    { key: "task:task-1", sourceId: "task-1", source: "task", ownerId,
      title: "Keep task", busy: true, intelligenceEligible: false, sourceState: "complete",
      kind: "planned-task", interval: { start: "2026-10-05T09:00:00.000Z", end: "2026-10-05T10:00:00.000Z" } },
  ],
};

test("saved Event replaces its visible Calendar item before background refresh", () => {
  const edited = mutation.withSavedEvent(initialProjection, {
    ...record, title: "After edit", start_at: "2026-10-04T11:00:00.000Z",
    end_at: "2026-10-04T12:00:00.000Z",
  }, ownerId);
  assert.equal(edited.items.find((item) => item.sourceId === "event-1").title, "After edit");
  assert.equal(edited.items.find((item) => item.sourceId === "event-1").interval.start, "2026-10-04T11:00:00.000Z");
  assert.equal(edited.items.filter((item) => item.sourceId === "event-1").length, 1);
  assert.equal(edited.items.find((item) => item.sourceId === "task-1").title, "Keep task");
  assert.equal(initialProjection.items[0].title, "Before edit");
  const created = mutation.withSavedEvent(edited, { ...record, id: "event-2", title: "New event" }, ownerId);
  assert.equal(created.items.find((item) => item.sourceId === "event-2").title, "New event");
  const allDay = mutation.withSavedEvent(created, {
    ...record, id: "event-3", title: "All-day event", all_day: true,
    start_at: null, end_at: null, start_date: "2026-10-06", end_date_exclusive: "2026-10-07",
  }, ownerId);
  assert.equal(allDay.items.find((item) => item.sourceId === "event-3").kind, "all-day");
  assert.equal(mutation.withoutEvent(created, "event-2").items.some((item) => item.sourceId === "event-2"), false);
});

test("failed background refresh retains the saved Event and rendered Calendar", () => {
  const edited = mutation.withSavedEvent(initialProjection, { ...record, title: "Saved title" }, ownerId);
  const load = { status: "loaded", key: "week:owner", projection: edited };
  assert.equal(mutation.retainCalendarAfterRefreshFailure(load, "week:owner"), load);
  assert.equal(load.projection.items.find((item) => item.sourceId === "event-1").title, "Saved title");
  assert.equal(mutation.retainCalendarAfterRefreshFailure({ status: "idle" }, "week:owner").status, "error");
  const page = source("src/app/app/calendar/page.tsx");
  assert.match(page, /retainCalendarAfterRefreshFailure\(current, requestKey\)/);
  assert.match(page, /withSavedEvent\(current\.projection, result\.event, sessionUserId\)/);
  assert.doesNotMatch(page, /\$\{retry\}:/);
  assert.match(page, /key=\{`\$\{view\}:\$\{dates\[0\]\}:\$\{motion\.revision\}`\}/);
});

test("Calendar has one shared success toast and exact create/edit EN/UA copy", () => {
  assert.equal(translations.en["event.status.created"], "Event created");
  assert.equal(translations.en["event.status.updated"], "Event updated");
  assert.equal(translations.ua["event.status.created"], "Подію створено");
  assert.equal(translations.ua["event.status.updated"], "Подію оновлено");
  const page = source("src/app/app/calendar/page.tsx");
  assert.match(page, /<SuccessToast toast=\{toast\}/);
  assert.doesNotMatch(page, /eventStatus|event\.status\.saved/);
  assert.equal(translations.en["event.status.saved"], undefined);
  assert.equal(translations.ua["event.status.saved"], undefined);
});

test("Event edit exposes All day only in edit mode and Calendar waits for preference loading", () => {
  const editor = source("src/components/events/EventEditor.tsx");
  const calendar = source("src/app/app/calendar/page.tsx");
  assert.match(editor, /disabled=\{readOnly \|\| saving\} onChange=\{\(event\) => \{ setDraft\(\(current\) => switchEventAllDay/);
  assert.doesNotMatch(editor, /saving \|\| Boolean\(eventId\)/);
  assert.match(calendar, /timezoneReady && planningTimezone\.status === "ready" &&\s+calendarTimezoneNeedsConfirmation/);
  assert.match(calendar, /saveCalendarTimezonePreference\(/);
});
