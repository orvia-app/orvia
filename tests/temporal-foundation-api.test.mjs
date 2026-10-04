import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ownerA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ownerB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const taskA = "11111111-1111-4111-8111-111111111111";
const taskB = "22222222-2222-4222-8222-222222222222";

function load(path, dependencies = {}) {
  const filename = resolve(root, path);
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  const loaded = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    Date, Intl, RangeError, TypeError, Error, Request, Response, crypto,
    fetch: dependencies.__fetch ?? globalThis.fetch,
    exports: loaded.exports, module: loaded,
    require: (id) => {
      if (!(id in dependencies)) throw new Error(`Missing test dependency ${id}`);
      return dependencies[id];
    },
  }, { filename });
  return loaded.exports;
}

function database() {
  const rows = {
    tasks: [
      { id: taskA, user_id: ownerA, deleted_at: null },
      { id: taskB, user_id: ownerB, deleted_at: null },
    ],
    planning_preferences: [],
    task_plan_blocks: [],
  };
  function from(table) {
    let operation = "select";
    let payload;
    const filters = [];
    let orderKey;
    const query = {
      select() { return query; },
      insert(value) { operation = "insert"; payload = value; return query; },
      update(value) { operation = "update"; payload = value; return query; },
      delete() { operation = "delete"; return query; },
      eq(key, value) { filters.push((row) => row[key] === value); return query; },
      is(key, value) { filters.push((row) => row[key] === value); return query; },
      order(key) { orderKey = key; return query; },
      async result(single = false) {
        let selected = rows[table].filter((row) => filters.every((filter) => filter(row)));
        if (operation === "insert") {
          const now = "2026-10-02T09:00:00.000Z";
          const value = { version: 1, created_at: now, updated_at: now, ...payload };
          rows[table].push(value);
          selected = [value];
        } else if (operation === "update") {
          selected.forEach((row) => Object.assign(row, payload, {
            updated_at: "2026-10-02T09:01:00.000Z",
          }));
        } else if (operation === "delete") {
          const selectedSet = new Set(selected);
          rows[table] = rows[table].filter((row) => !selectedSet.has(row));
        }
        if (orderKey) selected.sort((a, b) => String(a[orderKey]).localeCompare(String(b[orderKey])));
        return { data: single ? selected[0] ?? null : selected, error: null };
      },
      maybeSingle() { return query.result(true); },
      single() { return query.result(true); },
      then(resolve, reject) { return query.result().then(resolve, reject); },
    };
    return query;
  }
  return { from, rows };
}

function harness() {
  const db = database();
  const domain = load("src/core/schedule/domain.ts");
  const scheduleInput = load("src/server/api/schedule-input.ts", {
    "@/core/schedule/domain": domain,
  });
  const preferences = load("src/server/api/planning-preferences.ts", {
    "@/core/schedule/domain": domain,
    "@/lib/supabase": {},
  });
  const blocks = load("src/server/api/task-plan-blocks.ts", {
    "@/core/schedule/domain": domain,
    "@/lib/supabase": {},
  });
  const auth = { authenticateApiRequest: async (request) => {
    const token = request.headers.get("authorization");
    if (token !== "Bearer A" && token !== "Bearer B") {
      return { ok: false, response: Response.json({ ok: false }, { status: 401 }) };
    }
    return { ok: true, userId: token === "Bearer A" ? ownerA : ownerB };
  } };
  const shared = {
    "next/server": { NextResponse: { json: Response.json.bind(Response) } },
    "@/lib/supabase": { getSupabaseServerClient: () => db },
    "@/server/api/auth": auth,
    "@/server/api/schedule-input": scheduleInput,
    "@/server/api/task-plan-blocks": blocks,
    "@/server/api/planning-preferences": preferences,
  };
  return {
    db, domain,
    preferences,
    preferenceRoute: load("src/app/api/planning-preferences/route.ts", shared),
    blockIndex: load("src/app/api/task-plan-blocks/route.ts", shared),
    blockCollection: load("src/app/api/tasks/[id]/blocks/route.ts", shared),
    blockDetail: load("src/app/api/tasks/[id]/blocks/[blockId]/route.ts", shared),
  };
}

function request(method, body, token = "A") {
  return new Request("https://orvia.test/api", {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const taskContext = (id) => ({ params: Promise.resolve({ id }) });
const blockContext = (id, blockId) => ({ params: Promise.resolve({ id, blockId }) });
const json = async (response) => ({ status: response.status, body: await response.json() });

test("planning preference defaults are explicit and timezone persists per owner", async () => {
  const h = harness();
  assert.deepEqual(Array.from(h.preferences.DEFAULT_ENABLED_WEEKDAYS), [1, 2, 3, 4, 5]);
  assert.equal(h.preferences.DEFAULT_LOCAL_START_TIME, "09:00:00");
  assert.equal(h.preferences.DEFAULT_LOCAL_END_TIME, "18:00:00");

  const created = await json(await h.preferenceRoute.PUT(request("PUT", {
    planningTimezone: "America/Toronto",
    userId: ownerB,
  })));
  assert.equal(created.status, 201);
  assert.equal(created.body.preferences.planningTimezone, "America/Toronto");
  assert.equal(h.db.rows.planning_preferences[0].user_id, ownerA);
  assert.deepEqual(Array.from(h.db.rows.planning_preferences[0].enabled_weekdays), [1, 2, 3, 4, 5]);

  const own = await json(await h.preferenceRoute.GET(request("GET")));
  const other = await json(await h.preferenceRoute.GET(request("GET", undefined, "B")));
  assert.equal(own.body.preferences.planningTimezone, "America/Toronto");
  assert.equal(other.body.preferences, null);
});

test("Calendar timezone confirmation persists across remounts without duplicate writes or owner leakage", async () => {
  const h = harness();
  const requests = [];
  const fetchRoute = (path, options = {}) => {
    const method = options.method ?? "GET";
    requests.push({ method, body: options.body ? JSON.parse(options.body) : null });
    return h.preferenceRoute[method](new Request(`https://orvia.test${path}`, {
      method, headers: options.headers, ...(options.body ? { body: options.body } : {}),
    }));
  };
  const client = load("src/lib/calendar-timezone-preference.ts", {
    "@/core/schedule/domain": h.domain,
    __fetch: fetchRoute,
  });

  const firstVisit = await client.fetchCalendarTimezonePreference("A");
  assert.equal(firstVisit, null);
  assert.equal(client.calendarTimezoneNeedsConfirmation(firstVisit, false), true);
  const confirmed = await client.saveCalendarTimezonePreference("A", "Europe/Kyiv", firstVisit);
  assert.equal(confirmed.planningTimezone, "Europe/Kyiv");
  assert.equal(h.db.rows.planning_preferences[0].user_id, ownerA);
  assert.equal(requests.filter((call) => call.method === "PUT").length, 1);

  const remounted = await client.fetchCalendarTimezonePreference("A");
  assert.equal(remounted.planningTimezone, "Europe/Kyiv");
  assert.equal(client.calendarTimezoneNeedsConfirmation(remounted, false), false);
  assert.equal(client.calendarTimezoneNeedsConfirmation(remounted, true), true);
  await client.saveCalendarTimezonePreference("A", "Europe/Kyiv", remounted);
  assert.equal(requests.filter((call) => call.method === "PUT").length, 1);
  assert.equal(await client.fetchCalendarTimezonePreference("B"), null);

  await h.preferenceRoute.PUT(request("PUT", {
    planningTimezone: "Europe/Kyiv", enabledWeekdays: [1, 3, 5],
    localStartTime: "08:30", localEndTime: "17:30", expectedVersion: remounted.version,
  }));
  const custom = await client.fetchCalendarTimezonePreference("A");
  const changed = await client.saveCalendarTimezonePreference("A", "America/Toronto", custom);
  assert.equal(changed.planningTimezone, "America/Toronto");
  assert.deepEqual(Array.from(changed.enabledWeekdays), [1, 3, 5]);
  assert.equal(changed.localStartTime, "08:30:00");
  assert.equal(changed.localEndTime, "17:30:00");
  assert.equal(h.db.rows.planning_preferences.length, 1);
  assert.equal(h.db.rows.planning_preferences[0].user_id, ownerA);
  assert.equal(requests.at(-1).body.expectedVersion, custom.version);
  assert.equal("userId" in requests.at(-1).body, false);

  await client.saveCalendarTimezonePreference("B", "America/Los_Angeles", null);
  assert.equal(h.db.rows.planning_preferences.length, 2);
  assert.equal((await client.fetchCalendarTimezonePreference("A")).planningTimezone, "America/Toronto");
  assert.equal((await client.fetchCalendarTimezonePreference("B")).planningTimezone, "America/Los_Angeles");
});

test("Task block create/read derives owner and rejects another user's Task", async () => {
  const h = harness();
  const body = {
    startAt: "2026-10-02T09:00:00.000Z",
    endAt: "2026-10-02T10:00:00.000Z",
    userId: ownerB,
  };
  const created = await json(await h.blockCollection.POST(request("POST", body), taskContext(taskA)));
  assert.equal(created.status, 201);
  assert.equal(created.body.block.ownerId, ownerA);
  assert.equal(created.body.block.taskId, taskA);
  assert.equal(h.db.rows.task_plan_blocks[0].user_id, ownerA);

  const listed = await json(await h.blockCollection.GET(request("GET"), taskContext(taskA)));
  assert.equal(listed.body.blocks.length, 1);
  const forbiddenTask = await json(await h.blockCollection.POST(
    request("POST", body), taskContext(taskB),
  ));
  assert.equal(forbiddenTask.status, 404);
});

test("Plan block index derives ownership from auth and returns only Plan workspace fields", async () => {
  const h = harness();
  h.db.rows.task_plan_blocks.push(
    {
      id: "33333333-3333-4333-8333-333333333333",
      user_id: ownerA,
      task_id: taskA,
      start_at: "2026-10-02T09:00:00.000Z",
      end_at: "2026-10-02T10:00:00.000Z",
      version: 1,
      created_at: "2026-10-02T08:00:00.000Z",
      updated_at: "2026-10-02T08:00:00.000Z",
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      user_id: ownerB,
      task_id: taskB,
      start_at: "2026-10-02T11:00:00.000Z",
      end_at: "2026-10-02T12:00:00.000Z",
      version: 1,
      created_at: "2026-10-02T08:00:00.000Z",
      updated_at: "2026-10-02T08:00:00.000Z",
    },
  );

  const response = await h.blockIndex.GET(new Request(
    `https://orvia.test/api/task-plan-blocks?user_id=${ownerB}`,
    { headers: { Authorization: "Bearer A" } },
  ));
  const result = await json(response);
  assert.equal(result.status, 200);
  assert.equal(result.body.blocks.length, 1);
  assert.equal(result.body.blocks[0].taskId, taskA);
  assert.deepEqual(Object.keys(result.body.blocks[0]).sort(),
    ["endAt", "id", "startAt", "taskId", "version"]);
});

test("Task block update/delete are owner scoped and version checked", async () => {
  const h = harness();
  const created = await json(await h.blockCollection.POST(request("POST", {
    startAt: "2026-10-02T09:00:00.000Z",
    endAt: "2026-10-02T10:00:00.000Z",
  }), taskContext(taskA)));
  const blockId = created.body.block.id;

  const foreignUpdate = await json(await h.blockDetail.PATCH(request("PATCH", {
    expectedVersion: 1,
    startAt: "2026-10-02T10:00:00.000Z",
  }, "B"), blockContext(taskA, blockId)));
  const foreignDelete = await json(await h.blockDetail.DELETE(
    request("DELETE", undefined, "B"), blockContext(taskA, blockId),
  ));
  assert.equal(foreignUpdate.status, 404);
  assert.equal(foreignDelete.status, 404);

  const stale = await json(await h.blockDetail.PATCH(request("PATCH", {
    expectedVersion: 2,
    startAt: "2026-10-02T10:00:00.000Z",
    endAt: "2026-10-02T11:00:00.000Z",
  }), blockContext(taskA, blockId)));
  assert.equal(stale.status, 409);

  const updated = await json(await h.blockDetail.PATCH(request("PATCH", {
    expectedVersion: 1,
    startAt: "2026-10-02T10:00:00.000Z",
    endAt: "2026-10-02T11:00:00.000Z",
  }), blockContext(taskA, blockId)));
  assert.equal(updated.status, 200);
  assert.equal(updated.body.block.version, 2);

  const deleted = await json(await h.blockDetail.DELETE(
    request("DELETE"), blockContext(taskA, blockId),
  ));
  assert.equal(deleted.status, 200);
  assert.equal(h.db.rows.task_plan_blocks.length, 0);
});

test("Task block API rejects invalid intervals", async () => {
  const h = harness();
  const invalid = await json(await h.blockCollection.POST(request("POST", {
    startAt: "2026-10-02T10:00:00.000Z",
    endAt: "2026-10-02T09:00:00.000Z",
  }), taskContext(taskA)));
  assert.equal(invalid.status, 400);
  assert.match(invalid.body.error, /end after start/);
  assert.equal(h.db.rows.task_plan_blocks.length, 0);
});
