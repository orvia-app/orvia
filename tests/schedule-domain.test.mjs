import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(projectRoot, "src/core/schedule/domain.ts");
const source = readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: sourcePath,
});
const module = { exports: {} };
vm.runInNewContext(compiled.outputText, {
  Date,
  Intl,
  RangeError,
  TypeError,
  exports: module.exports,
  module,
});
const plain = (value) => JSON.parse(JSON.stringify(value));

const {
  blockingConflict,
  intervalIntersection,
  intervalsIntersect,
  isIanaTimeZone,
  isLocalDate,
  isPositiveDurationMinutes,
  isUtcInstant,
  plannedTaskInterval,
  timedEventInterval,
  timedInterval,
  validateOrviaEvent,
  validateTaskScheduling,
} = module.exports;

const at = (hour, minute = 0) => `2026-09-30T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
const interval = (startHour, endHour) => timedInterval(at(startHour), at(endHour));
const item = (key, span, busy = true) => ({
  key,
  ownerId: "owner",
  title: key,
  source: key.startsWith("task:") ? "task" : "orvia-event",
  kind: key.startsWith("task:") ? "planned-task" : "timed",
  busy,
  intelligenceEligible: true,
  interval: span,
});
const event = (overrides = {}) => ({
  id: "event-1",
  userId: "owner",
  title: "Appointment",
  kind: "timed",
  startAt: at(9),
  endAt: at(10),
  timezone: "Europe/Kyiv",
  busy: true,
  ...overrides,
});

test("Task interval requires both planned start and valid duration", () => {
  assert.deepEqual(
    plain(plannedTaskInterval({ plannedStart: at(9), estimatedDurationMinutes: 90 })),
    { start: at(9), end: at(10, 30) },
  );
  assert.equal(plannedTaskInterval({ dueDate: "2026-09-30" }), null);
  assert.equal(plannedTaskInterval({ planDay: "2026-09-30" }), null);
  assert.equal(plannedTaskInterval({ estimatedDurationMinutes: 30 }), null);
  assert.equal(plannedTaskInterval({ plannedStart: at(9) }), null);
  assert.equal(plannedTaskInterval({ plannedStart: at(9), estimatedDurationMinutes: 0 }), null);
  assert.equal(plannedTaskInterval({ plannedStart: at(9), estimatedDurationMinutes: 10081 }), null);
});

test("deadline and explicit plan day remain independent of timed scheduling", () => {
  const task = {
    dueDate: "2026-10-04",
    planDay: "2026-09-29",
    plannedStart: at(9),
    estimatedDurationMinutes: 60,
  };
  assert.deepEqual(plannedTaskInterval(task), interval(9, 10));
  assert.equal(task.dueDate, "2026-10-04");
  assert.equal(task.planDay, "2026-09-29");
  assert.deepEqual(plain(validateTaskScheduling(task)), task);
  assert.throws(() => validateTaskScheduling({ planDay: "2026-02-29" }), /local date/);
  assert.throws(() => validateTaskScheduling({ dueDate: "2026-02-29" }), /local date/);
  assert.throws(() => validateTaskScheduling({ estimatedDurationMinutes: 0 }), /duration/);
});

test("cross-midnight planned work remains one real instant interval", () => {
  assert.deepEqual(plain(plannedTaskInterval({
    plannedStart: "2026-09-30T23:30:00.000Z",
    estimatedDurationMinutes: 90,
  })), {
    start: "2026-09-30T23:30:00.000Z",
    end: "2026-10-01T01:00:00.000Z",
  });
});

test("half-open overlap handles partial, containment, identical, touching and separated intervals", () => {
  assert.equal(intervalsIntersect(interval(9, 11), interval(10, 12)), true);
  assert.equal(intervalsIntersect(interval(9, 12), interval(10, 11)), true);
  assert.equal(intervalsIntersect(interval(9, 11), interval(9, 11)), true);
  assert.equal(intervalsIntersect(interval(9, 10), interval(10, 11)), false);
  assert.equal(intervalsIntersect(interval(9, 10), interval(11, 12)), false);
  assert.deepEqual(intervalIntersection(interval(9, 11), interval(10, 12)), interval(10, 11));
});

test("busy Event and Task pairings conflict; free items and endpoint contact do not", () => {
  const a = item("orvia-event:a", interval(9, 11));
  const b = item("orvia-event:b", interval(10, 12));
  const taskA = item("task:a", interval(10, 12));
  const taskB = item("task:b", interval(11, 12));
  assert.deepEqual(plain(blockingConflict(a, b)), {
    keys: ["orvia-event:a", "orvia-event:b"], overlap: plain(interval(10, 11)),
  });
  assert.ok(blockingConflict(a, taskA));
  assert.ok(blockingConflict(taskA, taskB));
  assert.equal(blockingConflict(a, item("task:free", interval(10, 12), false)), null);
  assert.equal(blockingConflict(item("orvia-event:free", interval(9, 11), false), b), null);
  assert.equal(blockingConflict(a, item("task:touch", interval(11, 12))), null);
  assert.equal(blockingConflict(a, a), null);
  assert.equal(blockingConflict(a, { ...b, ownerId: "another-owner" }), null);
});

test("a resolved all-day busy interval participates in conflicts without converting its date bounds", () => {
  const allDay = {
    ...item("orvia-event:all-day", timedInterval(
      "2026-09-30T21:00:00.000Z", "2026-10-01T21:00:00.000Z",
    )),
    kind: "all-day",
    startDate: "2026-10-01",
    endDateExclusive: "2026-10-02",
    timezone: "Europe/Kyiv",
  };
  const planned = item("task:late", timedInterval(
    "2026-10-01T20:30:00.000Z", "2026-10-01T21:30:00.000Z",
  ));
  assert.deepEqual(plain(blockingConflict(allDay, planned)?.overlap), {
    start: "2026-10-01T20:30:00.000Z",
    end: "2026-10-01T21:00:00.000Z",
  });
  assert.equal(blockingConflict({ ...allDay, busy: false }, planned), null);
  assert.equal(allDay.startDate, "2026-10-01");
});

test("Event variants validate ordered bounds and exclude the other variant's fields", () => {
  const timed = validateOrviaEvent(event());
  assert.deepEqual(timedEventInterval(timed), interval(9, 10));
  assert.throws(() => validateOrviaEvent(event({ endAt: at(9) })), /end must follow/);
  assert.throws(() => validateOrviaEvent(event({ endAt: at(8) })), /end must follow/);
  assert.throws(() => validateOrviaEvent(event({ startDate: "2026-09-30" })), /all-day bounds/);
  const allDay = validateOrviaEvent(event({
    kind: "all-day", startAt: undefined, endAt: undefined,
    startDate: "2026-09-30", endDateExclusive: "2026-10-02",
  }));
  assert.equal(allDay.endDateExclusive, "2026-10-02");
  assert.throws(() => validateOrviaEvent(event({
    kind: "all-day", startAt: undefined, endAt: undefined,
    startDate: "2026-09-30", endDateExclusive: "2026-09-30",
  })), /end must follow/);
});

test("local dates, UTC instants, zones, titles and durations reject invalid values", () => {
  assert.equal(isLocalDate("2024-02-29"), true);
  assert.equal(isLocalDate("2026-02-29"), false);
  assert.equal(isLocalDate("2026-2-09"), false);
  assert.equal(isIanaTimeZone("Europe/Kyiv"), true);
  assert.equal(isIanaTimeZone("Invalid/Zone"), false);
  assert.equal(isUtcInstant(at(9)), true);
  assert.equal(isUtcInstant("2026-02-30T09:00:00.000Z"), false);
  assert.equal(isUtcInstant("2026-09-30T09:00:00+03:00"), false);
  assert.equal(isPositiveDurationMinutes(1), true);
  assert.equal(isPositiveDurationMinutes(10080), true);
  assert.equal(isPositiveDurationMinutes(1.5), false);
  assert.equal(isPositiveDurationMinutes(-1), false);
  assert.throws(() => validateOrviaEvent(event({ timezone: "Invalid/Zone" })), /timezone/);
  assert.throws(() => validateOrviaEvent(event({ title: "  " })), /title/);
  assert.throws(() => validateOrviaEvent(event({ title: "x".repeat(201) })), /title/);
  assert.throws(() => validateOrviaEvent(event({
    kind: "all-day", startAt: undefined, endAt: undefined,
    startDate: "2026-02-29", endDateExclusive: "2026-03-01",
  })), /local date/);
});
