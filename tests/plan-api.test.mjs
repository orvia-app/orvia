import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function load(path, dependencies = {}, globals = {}) {
  const filename = resolve(root, path);
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  const loaded = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    Date, Intl, RangeError, TypeError, Error, Response,
    exports: loaded.exports, module: loaded, ...globals,
    require: (id) => {
      if (!(id in dependencies)) throw new Error(`Missing test dependency ${id}`);
      return dependencies[id];
    },
  }, { filename });
  return loaded.exports;
}

const domain = load("src/core/schedule/domain.ts");
const domainBlock = (overrides = {}) => ({
  id: "block-1",
  ownerId: "owner-a",
  taskId: "task-1",
  interval: {
    start: "2026-10-02T09:00:00.000Z",
    end: "2026-10-02T10:00:00.000Z",
  },
  version: 1,
  ...overrides,
});

test("Plan Block client lists minimal fields and creates, moves, and resizes through existing routes", async () => {
  const calls = [];
  const responses = [
    Response.json({ ok: true, blocks: [{
      id: "block-1", taskId: "task-1", startAt: "2026-10-02T09:00:00.000Z",
      endAt: "2026-10-02T10:00:00.000Z", version: 1,
    }] }),
    Response.json({ ok: true, block: domainBlock() }, { status: 201 }),
    Response.json({ ok: true, block: domainBlock({
      interval: { start: "2026-10-03T11:00:00.000Z", end: "2026-10-03T12:30:00.000Z" },
      version: 2,
    }) }),
  ];
  const api = load("src/lib/task-plan-blocks-api.ts", {
    "@/core/schedule/domain": domain,
  }, { fetch: async (url, options = {}) => {
    calls.push({ url, options });
    return responses.shift();
  } });

  const listed = await api.fetchTaskPlanBlocks("token");
  assert.equal(listed.length, 1);
  assert.deepEqual(Object.keys(listed[0]).sort(), ["endAt", "id", "startAt", "taskId", "version"]);

  await api.createTaskPlanBlock("task-1", {
    startAt: "2026-10-02T09:00:00.000Z",
    endAt: "2026-10-02T10:00:00.000Z",
  }, "token");
  const updated = await api.updateTaskPlanBlock("task-1", "block-1", {
    startAt: "2026-10-03T11:00:00.000Z",
    endAt: "2026-10-03T12:30:00.000Z",
    expectedVersion: 1,
  }, "token");

  assert.equal(calls[0].url, "/api/task-plan-blocks");
  assert.equal(calls[1].url, "/api/tasks/task-1/blocks");
  assert.equal(calls[1].options.method, "POST");
  assert.equal(calls[2].url, "/api/tasks/task-1/blocks/block-1");
  assert.equal(calls[2].options.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[2].options.body), {
    startAt: "2026-10-03T11:00:00.000Z",
    endAt: "2026-10-03T12:30:00.000Z",
    expectedVersion: 1,
  });
  assert.equal(updated.id, "block-1");
  assert.equal(updated.version, 2);
});

test("Plan Block client reports optimistic concurrency conflicts", async () => {
  const api = load("src/lib/task-plan-blocks-api.ts", {
    "@/core/schedule/domain": domain,
  }, { fetch: async () => Response.json({ ok: false }, { status: 409 }) });
  await assert.rejects(
    api.updateTaskPlanBlock("task-1", "block-1", {
      startAt: "2026-10-03T11:00:00.000Z",
      endAt: "2026-10-03T12:00:00.000Z",
      expectedVersion: 1,
    }, "token"),
    (error) => error instanceof api.TaskPlanBlockApiError && error.kind === "conflict",
  );
});

function planApiWithPreference(preferences) {
  return load("src/lib/plan-api.ts", {
    "@/core/schedule/domain": domain,
    "@/core/schedule/projection": { localDateRange() { throw new Error("not used"); } },
    "@/lib/calendar-view": { addDays() { throw new Error("not used"); } },
    "@/lib/calendar-projection": { parseCalendarProjection() { throw new Error("not used"); } },
  }, { fetch: async () => Response.json({
    ok: true,
    preferences,
    defaults: {
      enabledWeekdays: [1, 2, 3, 4, 5],
      localStartTime: "09:00:00",
      localEndTime: "18:00:00",
    },
  }) });
}

test("saved planning timezone wins over the browser timezone", async () => {
  const api = planApiWithPreference({
    planningTimezone: "America/Toronto",
    enabledWeekdays: [1, 2, 3, 4, 5],
    localStartTime: "08:30:00",
    localEndTime: "17:00:00",
  });
  const result = await api.fetchPlanPreferences("token", "Europe/Kyiv");
  assert.equal(result.planningTimezone, "America/Toronto");
  assert.equal(result.persisted, true);
});

test("browser timezone is used only when no planning preference is saved", async () => {
  const api = planApiWithPreference(null);
  const result = await api.fetchPlanPreferences("token", "Europe/Kyiv");
  assert.equal(result.planningTimezone, "Europe/Kyiv");
  assert.equal(result.persisted, false);
  assert.deepEqual(Array.from(result.enabledWeekdays), [1, 2, 3, 4, 5]);
});

test("Plan schedule can request the selected day plus nearby mobile agenda days", async () => {
  let capturedRange;
  let capturedBody;
  const expected = { planningTimezone: "Europe/Kyiv", items: [] };
  const api = load("src/lib/plan-api.ts", {
    "@/core/schedule/domain": domain,
    "@/core/schedule/projection": {
      localDateRange(start, end, zone) {
        capturedRange = { start, end, zone };
        return {
          start: "2026-10-01T21:00:00.000Z",
          end: "2026-10-04T21:00:00.000Z",
        };
      },
    },
    "@/lib/calendar-view": {
      addDays(date, days) {
        assert.equal(date, "2026-10-02");
        assert.equal(days, 3);
        return "2026-10-05";
      },
    },
    "@/lib/calendar-projection": { parseCalendarProjection: () => expected },
  }, { fetch: async (_url, options) => {
    capturedBody = JSON.parse(options.body);
    return Response.json({ ok: true, projection: {
      planningTimezone: "Europe/Kyiv",
    } });
  } });

  const result = await api.fetchPlanSchedule(
    "token", "owner-a", "2026-10-02", "Europe/Kyiv", 3,
  );
  assert.equal(result, expected);
  assert.deepEqual(capturedRange, {
    start: "2026-10-02",
    end: "2026-10-05",
    zone: "Europe/Kyiv",
  });
  assert.deepEqual(capturedBody, {
    range: {
      start: "2026-10-01T21:00:00.000Z",
      end: "2026-10-04T21:00:00.000Z",
    },
    planningTimezone: "Europe/Kyiv",
  });
});
