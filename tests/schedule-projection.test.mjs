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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  const loaded = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    Date, Intl, RangeError, TypeError, exports: loaded.exports, module: loaded,
    require: (id) => dependencies[id] ?? {},
  });
  return loaded.exports;
}
const domain = load("src/core/schedule/domain.ts");
const { localDateRange, projectSchedule, startOfLocalDate } =
  load("src/core/schedule/projection.ts", { "./domain": domain });
const plain = (value) => JSON.parse(JSON.stringify(value));

const range = (start = "2026-09-30T09:00:00.000Z",
  end = "2026-09-30T12:00:00.000Z") => ({ start, end });
const request = (overrides = {}) => ({
  ownerId: "owner-a", range: range(), planningTimezone: "Europe/Kyiv", ...overrides,
});
const snapshot = (records = [], overrides = {}) => ({
  ownerId: "owner-a", records, coverage: range(), state: "complete",
  observedAt: "2026-09-30T08:00:00.000Z", ...overrides,
});
const task = (overrides = {}, wrapper = {}) => ({
  ownerId: "owner-a", intelligenceEligible: true,
  task: {
    id: "t1", title: "Work", status: "todo", workspaceId: "work",
    plannedStart: "2026-09-30T09:30:00.000Z", estimatedDurationMinutes: 60,
    planDay: "2026-09-29", ...overrides,
  }, ...wrapper,
});
const block = (id, start, end, overrides = {}) => ({
  id, ownerId: "owner-a", taskId: "t1", version: 1,
  interval: range(start, end), ...overrides,
});
const event = (overrides = {}, wrapper = {}) => ({
  lifecycleStatus: "active", intelligenceEligible: false,
  event: {
    id: "e1", userId: "owner-a", title: "Appointment", kind: "timed",
    startAt: "2026-09-30T10:00:00.000Z", endAt: "2026-09-30T11:00:00.000Z",
    timezone: "Europe/Kyiv", busy: true, ...overrides,
  }, ...wrapper,
});
const project = (taskRecords = [], eventRecords = [], overrides = {}, sourceOverrides = {}) =>
  projectSchedule(request(overrides), {
    tasks: snapshot(taskRecords, sourceOverrides.tasks),
    events: snapshot(eventRecords, sourceOverrides.events),
  });

test("scheduled Task becomes a minimal busy item and preserves independent plan day", () => {
  const result = project([task({ dueDate: "2026-10-04" })]);
  assert.equal(result.completeness, "complete");
  assert.deepEqual(plain(result.items[0]), {
    key: "task:t1", sourceId: "t1", source: "task", ownerId: "owner-a",
    title: "Work", workspaceId: "work", kind: "planned-task", busy: true,
    intelligenceEligible: true,
    interval: range("2026-09-30T09:30:00.000Z", "2026-09-30T10:30:00.000Z"),
    planDay: "2026-09-29", sourceState: "complete", observedAt: "2026-09-30T08:00:00.000Z",
  });
  assert.equal("dueDate" in result.items[0], false);
});

test("multiple persisted blocks project as distinct items under one Task identity", () => {
  const result = project([task({ plannedStart: "2026-09-30T09:00:00.000Z" }, {
    hasPlanBlocks: true,
    planBlocks: [
      block("b1", "2026-09-30T09:00:00.000Z", "2026-09-30T10:00:00.000Z"),
      block("b2", "2026-09-30T10:30:00.000Z", "2026-09-30T11:30:00.000Z"),
    ],
  })]);
  assert.deepEqual(plain(result.items.map((item) => [item.key, item.sourceId, item.blockId])), [
    ["task-block:b1", "t1", "b1"],
    ["task-block:b2", "t1", "b2"],
  ]);
  assert.equal(result.items.some((item) => item.key === "task:t1"), false);
});

test("persisted blocks are authoritative over the legacy Task interval", () => {
  const result = project([task({}, {
    hasPlanBlocks: true,
    planBlocks: [block("b1", "2026-09-30T10:00:00.000Z", "2026-09-30T11:00:00.000Z")],
  })]);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].key, "task-block:b1");
  assert.deepEqual(plain(result.items[0].interval),
    range("2026-09-30T10:00:00.000Z", "2026-09-30T11:00:00.000Z"));
});

test("one Task can project blocks on different local days", () => {
  const selected = range("2026-09-30T00:00:00.000Z", "2026-10-02T00:00:00.000Z");
  const result = project([task({}, {
    hasPlanBlocks: true,
    planBlocks: [
      block("day-one", "2026-09-30T09:00:00.000Z", "2026-09-30T10:00:00.000Z"),
      block("day-two", "2026-10-01T15:00:00.000Z", "2026-10-01T17:00:00.000Z"),
    ],
  })], [], { range: selected }, {
    tasks: { coverage: selected }, events: { coverage: selected },
  });
  assert.deepEqual(plain(result.items.map((item) => item.key)),
    ["task-block:day-one", "task-block:day-two"]);
});

test("explicit remaining demand can coexist with blocks without estimating a remainder", () => {
  const result = project([task({ planDay: "2026-09-30" }, {
    hasPlanBlocks: true,
    hasUnplacedDemand: true,
    planBlocks: [block("b1", "2026-09-30T09:00:00.000Z", "2026-09-30T10:00:00.000Z")],
  })]);
  assert.equal(result.items[0].key, "task-block:b1");
  assert.equal(result.unplacedTasks[0].key, "task:t1");
});

test("duplicate block identity and block ownership mismatches fail closed", () => {
  assert.throws(() => project([task({}, {
    planBlocks: [
      block("duplicate", "2026-09-30T09:00:00.000Z", "2026-09-30T10:00:00.000Z"),
      block("duplicate", "2026-09-30T10:00:00.000Z", "2026-09-30T11:00:00.000Z"),
    ],
  })]), /Duplicate .*identity/);
  assert.throws(() => project([task({}, {
    planBlocks: [block("foreign", "2026-09-30T09:00:00.000Z",
      "2026-09-30T10:00:00.000Z", { ownerId: "owner-b" })],
  })]), /ownership mismatch/);
});

test("deadline, plan day, start alone, and invalid duration never occupy time", () => {
  const records = [
    task({ id: "due", plannedStart: null, estimatedDurationMinutes: null,
      dueDate: "2026-09-30", planDay: null }),
    task({ id: "day", plannedStart: null, estimatedDurationMinutes: null,
      planDay: "2026-09-30" }),
    task({ id: "no-duration", estimatedDurationMinutes: null,
      planDay: "2026-09-30" }),
    task({ id: "bad-duration", estimatedDurationMinutes: 0 }),
  ];
  const result = project(records);
  assert.equal(result.items.length, 0);
  assert.equal(result.unplacedTasks.length, 2);
  assert.equal(result.unplacedTasks.every((entry) => entry.planDay === "2026-09-30"), true);
  assert.equal(result.unplacedTasks.every((entry) => !("interval" in entry)), true);
});

test("only explicitly assigned unscheduled Tasks enter the unplaced list for the requested day", () => {
  const assigned = task({ id: "assigned", plannedStart: null, planDay: "2026-09-30" });
  const differentDay = task({ id: "other", plannedStart: null, planDay: "2026-10-01" });
  const deadlineOnly = task({ id: "deadline", plannedStart: null, planDay: null,
    dueDate: "2026-09-30" });
  const result = project([assigned, differentDay, deadlineOnly]);
  assert.deepEqual(plain(result.unplacedTasks.map((entry) => entry.key)), ["task:assigned"]);
  assert.equal(result.items.length, 0);
});

test("timed and all-day Events share the contract without losing local dates or zone", () => {
  const allDay = event({ id: "all", kind: "all-day", startAt: undefined, endAt: undefined,
    startDate: "2026-09-30", endDateExclusive: "2026-10-01", busy: false });
  const result = project([], [event(), allDay]);
  const timed = result.items.find((item) => item.sourceId === "e1");
  const day = result.items.find((item) => item.sourceId === "all");
  assert.equal(timed.kind, "timed");
  assert.equal(timed.timezone, "Europe/Kyiv");
  assert.deepEqual(plain(timed.interval), range("2026-09-30T10:00:00.000Z", "2026-09-30T11:00:00.000Z"));
  assert.equal(day.kind, "all-day");
  assert.equal(day.startDate, "2026-09-30");
  assert.equal(day.endDateExclusive, "2026-10-01");
  assert.equal(day.timezone, "Europe/Kyiv");
  assert.equal(day.busy, false);
  assert.deepEqual(plain(day.interval), range("2026-09-29T21:00:00.000Z", "2026-09-30T21:00:00.000Z"));
  assert.equal(domain.blockingConflict(day, timed), null);
});

test("inactive Events and completed Tasks leave the active projection", () => {
  const result = project([task({ status: "done" })], [
    event({}, { lifecycleStatus: "archived" }),
    event({}, { lifecycleStatus: "deleted" }),
  ]);
  assert.equal(result.items.length, 0);
});

test("cross-midnight intervals intersect either day and endpoint contact is excluded", () => {
  const crossing = task({ plannedStart: "2026-09-30T23:30:00.000Z", estimatedDurationMinutes: 90 });
  const before = range("2026-09-30T22:00:00.000Z", "2026-10-01T00:00:00.000Z");
  const after = range("2026-10-01T00:00:00.000Z", "2026-10-01T02:00:00.000Z");
  const touch = range("2026-10-01T01:00:00.000Z", "2026-10-01T02:00:00.000Z");
  for (const selected of [before, after]) {
    const result = project([crossing], [], { range: selected }, {
      tasks: { coverage: selected }, events: { coverage: selected },
    });
    assert.equal(result.items.length, 1);
    assert.deepEqual(plain(result.items[0].interval), range(
      "2026-09-30T23:30:00.000Z", "2026-10-01T01:00:00.000Z"));
  }
  assert.equal(project([crossing], [], { range: touch }, {
    tasks: { coverage: touch }, events: { coverage: touch },
  }).items.length, 0);
  const startsAtEnd = event({ startAt: "2026-09-30T12:00:00.000Z",
    endAt: "2026-09-30T13:00:00.000Z" });
  assert.equal(project([], [startsAtEnd]).items.length, 0);
});

test("owner contamination fails closed before returning any personal item", () => {
  assert.throws(() => project([{ ...task(), ownerId: "owner-b" }]), /owner mismatch/);
  assert.throws(() => project([], [event({ userId: "owner-b" })]), /owner mismatch/);
  assert.throws(() => project([], [], {}, { tasks: { ownerId: "owner-b" } }), /owner mismatch/);
});

test("request timezone and DST-sensitive planning and Event dates use real instants", () => {
  const spring = localDateRange("2026-03-29", "2026-03-30", "Europe/Kyiv");
  const autumn = localDateRange("2026-10-25", "2026-10-26", "Europe/Kyiv");
  assert.equal((Date.parse(spring.end) - Date.parse(spring.start)) / 3_600_000, 23);
  assert.equal((Date.parse(autumn.end) - Date.parse(autumn.start)) / 3_600_000, 25);
  assert.equal(startOfLocalDate("2026-03-29", "Europe/Kyiv"), "2026-03-28T22:00:00.000Z");
  const selected = range("2026-03-28T22:30:00.000Z", "2026-03-29T00:00:00.000Z");
  const result = project([], [event({ kind: "all-day", startAt: undefined, endAt: undefined,
    startDate: "2026-03-29", endDateExclusive: "2026-03-30" })],
  { range: selected, planningTimezone: "America/New_York" },
  { tasks: { coverage: selected }, events: { coverage: selected } });
  assert.equal(result.planningTimezone, "America/New_York");
  assert.deepEqual(plain(result.items[0].interval), plain(spring));
  assert.throws(() => localDateRange("2026-03-29", "2026-03-30", "Invalid/Zone"), /timezone/);
});

test("source coverage and freshness are explicit, with no invented complete state", () => {
  const partial = project([task()], [event()], {}, {
    tasks: { state: "complete", coverage: null },
    events: { state: "stale", observedAt: undefined },
  });
  assert.equal(partial.completeness, "incomplete");
  assert.equal(partial.sources.tasks.state, "partial");
  assert.equal(partial.sources.events.state, "stale");
  assert.equal("observedAt" in partial.sources.events, false);
  assert.equal(partial.items.find((item) => item.source === "task").sourceState, "partial");
  assert.equal(partial.items.find((item) => item.source === "orvia-event").sourceState, "stale");
  assert.equal(project([], [], {}, { events: { state: "unavailable", coverage: null } }).completeness,
    "incomplete");
});

test("projected busy pairings reuse the Batch 1 conflict rule", () => {
  const result = project([task()], [event()]);
  assert.deepEqual(plain(domain.blockingConflict(result.items[0], result.items[1])?.overlap),
    range("2026-09-30T10:00:00.000Z", "2026-09-30T10:30:00.000Z"));
  assert.throws(() => project([], [], { range: range("2026-09-30T12:00:00.000Z",
    "2026-09-30T12:00:00.000Z") }), /end must follow/);
});

test("duplicate source identities and unknown lifecycle states cannot claim a complete result", () => {
  assert.throws(() => project([task(), task()]), /Duplicate schedule source identity/);
  assert.throws(() => project([], [event(), event()]), /Duplicate schedule source identity/);
  assert.throws(() => project([], [event({}, { lifecycleStatus: "unknown" })]),
    /Invalid Event lifecycle state/);
});
