import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function load(path, dependencies = {}) {
  const filename = resolve(root, path);
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: filename,
  });
  const loaded = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    Date, Intl, RangeError, TypeError, exports: loaded.exports, module: loaded,
    require: (id) => {
      if (!(id in dependencies)) throw new Error(`Missing dependency ${id}`);
      return dependencies[id];
    },
  }, { filename });
  return loaded.exports;
}
const domain = load("src/core/schedule/domain.ts");
const projection = load("src/core/schedule/projection.ts", { "./domain": domain });
const view = load("src/lib/calendar-view.ts", {
  "@/core/schedule/domain": domain,
  "@/core/schedule/projection": projection,
});
const zone = "Europe/Kyiv";
const item = (key, start, end, extra = {}) => ({
  key, sourceId: key.slice(5), ownerId: "owner", source: "task", kind: "planned-task",
  title: key, busy: true, interval: { start, end }, sourceState: "complete",
  ...extra,
});

test("day, week, and month navigation use local dates with month clamp", () => {
  assert.equal(view.startOfWeek("2026-10-04"), "2026-09-28");
  assert.equal(view.moveView("2026-01-31", "month", 1), "2026-02-28");
  assert.equal(view.moveView("2024-01-31", "month", 1), "2024-02-29");
  assert.equal(view.moveView("2026-10-01", "day", -1), "2026-09-30");
  assert.equal(view.viewDates("2026-10-04", "week").length, 7);
  assert.equal(view.viewDates("2026-10-04", "month").length, 42);
});

test("half-open cross-midnight placement follows planning timezone and DST day length", () => {
  const crossing = item("task:one", "2026-10-24T22:30:00.000Z", "2026-10-25T01:30:00.000Z");
  assert.equal(view.itemsOnDate([crossing], "2026-10-25", zone).length, 1);
  assert.equal(view.itemsOnDate([crossing], "2026-10-26", zone).length, 0);
  const day = projection.localDateRange("2026-10-25", "2026-10-26", zone);
  assert.equal((Date.parse(day.end) - Date.parse(day.start)) / 3_600_000, 25);
  assert.equal(view.placeTimedItems([crossing], "2026-10-25", zone).length, 1);
  const touching = item("task:two", day.end, "2026-10-26T01:00:00.000Z");
  assert.equal(view.itemsOnDate([touching], "2026-10-25", zone).length, 0);
});

test("23:00 to 01:00 Event occupies the last and first local hours", () => {
  const crossing = item("event:midnight", "2026-10-04T20:00:00.000Z", "2026-10-04T22:00:00.000Z", {
    source: "orvia-event", kind: "timed", title: "Cross-midnight Event",
  });
  const first = view.placeTimedItems([crossing], "2026-10-04", zone);
  const second = view.placeTimedItems([crossing], "2026-10-05", zone);
  const firstDay = projection.localDateRange("2026-10-04", "2026-10-05", zone);
  const secondDay = projection.localDateRange("2026-10-05", "2026-10-06", zone);
  assert.equal(first.length, 1);
  assert.equal(second.length, 1);
  assert.equal(first[0].start, Date.parse(firstDay.end) - 3_600_000);
  assert.equal(first[0].end, Date.parse(firstDay.end));
  assert.equal(second[0].start, Date.parse(secondDay.start));
  assert.equal(second[0].end, Date.parse(secondDay.start) + 3_600_000);
  assert.equal(view.placeTimedItems([crossing], "2026-10-06", zone).length, 0);
});

test("overlap columns are stable and endpoint contact reuses a column", () => {
  const a = item("task:a", "2026-09-30T08:00:00.000Z", "2026-09-30T10:00:00.000Z");
  const b = item("task:b", "2026-09-30T09:00:00.000Z", "2026-09-30T11:00:00.000Z");
  const c = item("task:c", "2026-09-30T10:00:00.000Z", "2026-09-30T11:00:00.000Z");
  const placed = view.placeTimedItems([c, b, a], "2026-09-30", zone);
  assert.deepEqual(JSON.parse(JSON.stringify(placed.map(({ item, column, columns }) => [item.key, column, columns]))), [
    ["task:a", 0, 2], ["task:b", 1, 2], ["task:c", 0, 2],
  ]);
});

test("source state distinguishes unavailable, partial, unverified, and complete", () => {
  const withStates = (tasks, events, completeness = "incomplete") => ({
    sources: { tasks: { state: tasks }, events: { state: events } }, completeness,
  });
  assert.equal(view.sourceNotice(withStates("unavailable", "unavailable")), "unavailable");
  assert.equal(view.sourceNotice(withStates("complete", "unavailable")), "incomplete");
  assert.equal(view.sourceNotice(withStates("stale", "complete")), "incomplete");
  assert.equal(view.sourceNotice(withStates("unverified", "unverified")), "unverified");
  assert.equal(view.sourceNotice(withStates("complete", "complete", "complete")), null);
});
