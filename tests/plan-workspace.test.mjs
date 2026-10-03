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
    Date, Intl, RangeError, TypeError, Error,
    exports: loaded.exports, module: loaded,
    require: (id) => {
      if (!(id in dependencies)) throw new Error(`Missing test dependency ${id}`);
      return dependencies[id];
    },
  }, { filename });
  return loaded.exports;
}

const domain = load("src/core/schedule/domain.ts");
const projection = load("src/core/schedule/projection.ts", { "./domain": domain });
const workspace = load("src/core/plan/workspace.ts", {
  "@/core/schedule/domain": domain,
  "@/core/schedule/projection": projection,
});

const task = (id, overrides = {}) => ({
  id,
  title: id,
  status: "todo",
  priority: "medium",
  workspaceId: "work",
  createdAt: `2026-10-0${id.length}T00:00:00.000Z`,
  ...overrides,
});
const block = (id, taskId) => ({
  id,
  taskId,
  startAt: "2026-10-02T09:00:00.000Z",
  endAt: "2026-10-02T10:00:00.000Z",
  version: 1,
});

test("Still to place is deterministic and excludes blocks, legacy intervals, and inactive Tasks", () => {
  const tasks = [
    task("later", { createdAt: "2026-10-02T00:00:00.000Z" }),
    task("selected", { planDay: "2026-10-03", createdAt: "2026-10-03T00:00:00.000Z" }),
    task("blocked", { estimatedDurationMinutes: 120 }),
    task("legacy", {
      plannedStart: "2026-10-03T09:00:00.000Z",
      estimatedDurationMinutes: 60,
    }),
    task("done", { status: "done" }),
    task("progress", { status: "in-progress", createdAt: "2026-10-01T00:00:00.000Z" }),
  ];
  const result = workspace.selectStillToPlace(tasks, [block("block-1", "blocked")], "2026-10-03");
  assert.deepEqual(Array.from(result, ({ id }) => id), ["selected", "progress", "later"]);
});

test("an authoritative block removes the Task without estimate-minus-block arithmetic", () => {
  const tasks = [task("large-estimate", { estimatedDurationMinutes: 480 })];
  const result = workspace.selectStillToPlace(tasks, [block("short-block", "large-estimate")], "2026-10-03");
  assert.deepEqual(Array.from(result), []);
});

test("local wall times preserve DST gaps and repeated occurrences", () => {
  assert.equal(workspace.localTimeCandidates("2026-03-29", "02:30", "Europe/Berlin").length, 0);
  const repeated = workspace.localTimeCandidates("2026-10-25", "02:30", "Europe/Berlin");
  assert.equal(repeated.length, 2);
  assert.notEqual(repeated[0], repeated[1]);
  assert.equal(workspace.localTimeCandidates("2026-10-26", "09:15", "Europe/Berlin").length, 1);
});

test("duration and conflict helpers retain domain bounds and blocking semantics", () => {
  const interval = workspace.intervalFromDuration("2026-10-02T09:00:00.000Z", 90);
  assert.deepEqual({ ...interval }, {
    start: "2026-10-02T09:00:00.000Z",
    end: "2026-10-02T10:30:00.000Z",
  });
  assert.throws(() => workspace.intervalFromDuration(interval.start, 0), /duration/);

  const candidate = workspace.taskBlockCandidate(task("candidate"), "owner-a", interval);
  const busy = workspace.taskBlockCandidate(task("busy"), "owner-a", {
    start: "2026-10-02T10:00:00.000Z",
    end: "2026-10-02T11:00:00.000Z",
  });
  const free = { ...busy, key: "orvia-event:free", source: "orvia-event", kind: "timed", busy: false };
  const touching = workspace.taskBlockCandidate(task("touching"), "owner-a", {
    start: interval.end,
    end: "2026-10-02T11:00:00.000Z",
  });
  assert.deepEqual(workspace.findPlanConflicts(candidate, [busy, free, touching]).map(({ item }) => item.key),
    [busy.key]);
});

test("block edit slot selection moves the draft while preserving identity, duration, and version", () => {
  const original = block("block-1", "task-1");
  const draft = {
    blockId: original.id,
    taskId: original.taskId,
    date: "2026-10-02",
    time: "12:35",
    duration: "45",
    exactStart: original.startAt,
    original,
  };
  const moved = workspace.moveBlockDraftToInstant(
    draft,
    "2026-10-03T11:00:00.000Z",
    "Europe/Kyiv",
  );

  assert.equal(moved.blockId, draft.blockId);
  assert.equal(moved.taskId, draft.taskId);
  assert.equal(moved.duration, "45");
  assert.equal(moved.original.version, 1);
  assert.equal(moved.date, "2026-10-03");
  assert.equal(moved.time, "14:00");
  assert.equal(moved.exactStart, "2026-10-03T11:00:00.000Z");
  assert.equal(draft.time, "12:35");
});
