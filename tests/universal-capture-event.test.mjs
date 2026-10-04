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
const ids = {
  task: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  note: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  event: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  concurrentTask: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  concurrentMixed: "11111111-1111-4111-8111-111111111111",
  concurrentEvent: "22222222-2222-4222-8222-222222222222",
};

function source(path) { return readFileSync(resolve(root, path), "utf8"); }
function load(path, dependencies = {}) {
  const filename = resolve(root, path);
  const compiled = ts.transpileModule(source(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: filename,
  });
  const loaded = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    Date, Intl, RangeError, TypeError, Error, crypto, Request, Response, URL,
    fetch: dependencies.__fetch ?? globalThis.fetch,
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
  "@/core/schedule/domain": domain, "@/core/schedule/projection": projection,
});
const form = load("src/lib/event-form.ts", {
  "@/core/schedule/domain": domain,
  "@/core/plan/workspace": workspace,
  "@/lib/calendar-view": { addDays: (day, count) => new Date(Date.parse(`${day}T00:00:00.000Z`) + count * 86_400_000).toISOString().slice(0, 10) },
});
const captureInput = load("src/lib/capture-intent.ts");
const base = { title: "Dentist", description: "", timezone: "Europe/Kyiv", busy: true, allDay: false,
  startDate: "2026-10-04", startTime: "09:00", endDate: "2026-10-04", endTime: "10:00", exactStart: "", exactEnd: "" };

test("all four Capture intents remain reviewable and invalid input is refused", () => {
  for (const intent of ["auto", "task", "note", "event"]) {
    const result = captureInput.buildCaptureInput("  Call dentist  ", "  Ask about Monday  ", intent);
    assert.equal(result.ok, true);
    assert.equal(result.value.content, "Call dentist\n\nAsk about Monday");
    assert.equal(result.value.status, "inbox");
    assert.equal(result.value.metadata.intent, intent);
  }
  assert.equal(captureInput.buildCaptureInput("   ", "details", "auto").error, "required");
  assert.equal(captureInput.buildCaptureInput("title", "x".repeat(10000), "task").error, "tooLong");
});

test("Event capture details become an optional description", () => {
  const details = form.eventDetailsFromCapture("Doctor appointment\nBring insurance card\nBring previous X-rays");
  assert.equal(details.title, "Doctor appointment");
  assert.equal(details.description, "Bring insurance card\nBring previous X-rays");
  const payload = form.eventDraftToPayload({ ...base, title: details.title, description: details.description });
  assert.equal(payload.ok, true);
  assert.equal(payload.value.description, details.description);
  assert.equal(form.eventDraftToPayload(base).value.description, null);
  const longFirstLine = form.eventDetailsFromCapture(`${"A".repeat(201)}\nSecond line`);
  assert.equal(longFirstLine.title.length, 200);
  assert.equal(longFirstLine.description, "A\nSecond line");
});

test("Event edit switches timed/all-day while preserving local dates and IANA zone", () => {
  const timedRecord = { id: ids.event, title: "Appointment", description: "Bring documents",
    timezone: "Pacific/Auckland", busy: true, all_day: false,
    start_at: "2026-10-03T20:00:00.000Z", end_at: "2026-10-03T21:00:00.000Z",
    start_date: null, end_date_exclusive: null };
  const timedDraft = form.eventDraftFromRecord(timedRecord);
  assert.equal(timedDraft.startDate, "2026-10-04");
  assert.equal(timedDraft.endDate, "2026-10-04");
  const allDayDraft = form.switchEventAllDay(timedDraft, true);
  assert.equal(allDayDraft.startDate, "2026-10-04");
  assert.equal(allDayDraft.endDate, "2026-10-04");
  assert.equal(allDayDraft.timezone, "Pacific/Auckland");
  assert.equal(allDayDraft.startTime, "");
  assert.equal(allDayDraft.endTime, "");
  assert.equal(allDayDraft.exactStart, "");
  assert.equal(allDayDraft.exactEnd, "");
  const allDayPayload = form.eventDraftToPayload(allDayDraft);
  assert.equal(allDayPayload.ok, true);
  assert.equal(allDayPayload.value.kind, "all-day");
  assert.equal(allDayPayload.value.startDate, "2026-10-04");
  assert.equal(allDayPayload.value.endDateExclusive, "2026-10-05");
  assert.equal(allDayPayload.value.timezone, "Pacific/Auckland");

  const allDayRecord = { ...timedRecord, all_day: true, start_at: null, end_at: null,
    start_date: "2026-10-04", end_date_exclusive: "2026-10-05" };
  const loadedAllDay = form.eventDraftFromRecord(allDayRecord);
  const timedAgain = form.switchEventAllDay(loadedAllDay, false);
  assert.equal(timedAgain.startDate, "2026-10-04");
  assert.equal(timedAgain.endDate, "2026-10-04");
  assert.equal(timedAgain.title, "Appointment");
  assert.equal(timedAgain.description, "Bring documents");
  assert.equal(timedAgain.timezone, "Pacific/Auckland");
  assert.equal(timedAgain.startTime, "09:00");
  assert.equal(timedAgain.endTime, "10:00");
  const timedPayload = form.eventDraftToPayload(timedAgain);
  assert.equal(timedPayload.ok, true);
  assert.equal(timedPayload.value.kind, "timed");
  assert.equal(timedPayload.value.startAt, "2026-10-03T20:00:00.000Z");
  assert.equal(timedPayload.value.endAt, "2026-10-03T21:00:00.000Z");

  const multiDay = form.eventDraftFromRecord({ ...allDayRecord,
    end_date_exclusive: "2026-10-07" });
  assert.equal(multiDay.endDate, "2026-10-06");
  assert.equal(form.switchEventAllDay(multiDay, false).endDate, "2026-10-06");
});

test("Event time validation handles overnight, all-day, and DST", () => {
  assert.equal(form.eventDraftToPayload(base).value.startAt, "2026-10-04T06:00:00.000Z");
  assert.equal(form.eventDraftToPayload({ ...base, startTime: "23:30", endDate: "2026-10-05", endTime: "00:30" }).value.endAt, "2026-10-04T21:30:00.000Z");
  const allDay = form.eventDraftToPayload({ ...base, allDay: true, busy: false, endDate: "2026-10-06" });
  assert.equal(allDay.value.endDateExclusive, "2026-10-07");
  assert.equal(allDay.value.busy, false);
  assert.equal(form.eventDraftToPayload({ ...base, endTime: "08:00" }).error, "range");
  assert.equal(form.eventDraftToPayload({ ...base, startDate: "2026-03-29", endDate: "2026-03-29", startTime: "03:30", endTime: "04:30" }).error, "time");
  assert.equal(form.eventDraftToPayload({ ...base, startDate: "2026-10-25", endDate: "2026-10-25", startTime: "03:30", endTime: "04:30" }).error, "ambiguous");
});

function claimedDb() {
  const captures = new Map(Object.values(ids).map((id) => [id, { owner: ownerA, status: "inbox", text: "Doctor appointment\nBring insurance card" }]));
  const claims = new Map();
  const destinations = { task: new Map(), note: new Map(), event: new Map() };
  const locks = new Map();
  const calls = [];
  return {
    captures, claims, destinations, calls,
    rpc(name, args) {
      assert.ok(["resolve_claimed_capture_to_item", "resolve_claimed_capture_to_event"].includes(name));
      calls.push({ name, args });
      const id = args.p_capture_id;
      const prior = locks.get(id) ?? Promise.resolve();
      let release;
      const current = new Promise((resolve) => { release = resolve; });
      locks.set(id, prior.then(() => current));
      return prior.then(() => {
        try {
          const target = name.endsWith("_event") ? "event" : args.p_target;
          const capture = captures.get(id);
          const claim = claims.get(id);
          if (!capture || capture.owner !== args.p_user_id) return { data: { status: "conflict" }, error: null };
          if (claim) {
            if (claim.target !== target || claim.owner !== args.p_user_id) return { data: { status: "conflict" }, error: null };
            return { data: { status: "existing", item: destinations[target].get(id) }, error: null };
          }
          if (capture.status !== "inbox") return { data: { status: "conflict" }, error: null };
          capture.status = "processed";
          claims.set(id, { owner: args.p_user_id, target });
          const item = { id, user_id: args.p_user_id, title: target === "event" ? args.p_title : capture.text.split("\n")[0],
            ...(target === "task" ? { description: capture.text } : target === "note" ? { content: capture.text } :
              { description: args.p_description, lifecycle_status: "active" }) };
          destinations[target].set(id, item);
          return { data: { status: "created", item }, error: null };
        } finally { release(); }
      });
    },
  };
}

function routes(db) {
  const auth = { authenticateApiRequest: async (request) => {
    const token = request.headers.get("Authorization");
    if (!token) return { ok: false, response: Response.json({ ok: false }, { status: 401 }) };
    return { ok: true, userId: token === "Bearer A" ? ownerA : ownerB };
  } };
  const input = load("src/server/api/schedule-input.ts", { "@/core/schedule/domain": domain });
  const events = load("src/server/api/events.ts", { "@/core/schedule/domain": domain, "./schedule-input": input });
  const dependencies = {
    "next/server": { NextResponse: { json: Response.json.bind(Response) } },
    "@/server/api/auth": auth,
    "@/lib/supabase": { getSupabaseServerClient: () => db },
    "@/server/api/schedule-input": input,
    "@/server/api/events": events,
  };
  const item = load("src/app/api/captures/[id]/resolve-item/route.ts", dependencies);
  const event = load("src/app/api/captures/[id]/resolve-event/route.ts", dependencies);
  const invoke = (route, id, body, owner = "A") => route.POST(new Request("https://orvia.test/api", {
    method: "POST", headers: { Authorization: `Bearer ${owner}` }, body: JSON.stringify(body),
  }), { params: Promise.resolve({ id }) });
  const eventBody = { kind: "timed", title: "Doctor appointment", description: "Bring insurance card",
    timezone: "Europe/Kyiv", busy: true, startAt: "2026-10-04T06:00:00.000Z", endAt: "2026-10-04T07:00:00.000Z" };
  return { item, event, invoke, eventBody };
}

test("one owner-scoped claim handles Task/Note/Event retries and cross-target conflict", async () => {
  const db = claimedDb();
  const { item, event, invoke, eventBody } = routes(db);
  assert.equal((await invoke(item, ids.task, { target: "task" }, "B")).status, 409);
  assert.equal((await invoke(event, ids.event, { ...eventBody, userId: ownerB })).status, 400);
  assert.equal((await invoke(item, ids.task, { target: "task" })).status, 201);
  const retry = await invoke(item, ids.task, { target: "task" });
  assert.equal(retry.status, 200); // The first committed response may have been lost.
  assert.equal((await retry.json()).task.id, ids.task);
  assert.equal((await invoke(item, ids.task, { target: "note" })).status, 409);
  assert.equal((await invoke(item, ids.note, { target: "note" })).status, 201);
  assert.equal((await invoke(item, ids.note, { target: "note" })).status, 200);
  assert.equal((await invoke(event, ids.event, eventBody)).status, 201);
  const eventRetry = await invoke(event, ids.event, eventBody);
  assert.equal(eventRetry.status, 200);
  assert.equal((await eventRetry.json()).event.description, "Bring insurance card");
  assert.equal((await invoke(item, ids.event, { target: "task" })).status, 409);
  assert.equal((await invoke(event, ids.event, eventBody, "B")).status, 409);
  assert.equal(db.destinations.task.size, 1);
  assert.equal(db.destinations.note.size, 1);
  assert.equal(db.destinations.event.size, 1);
  assert.ok(db.calls.every(({ args }) => args.p_user_id === ownerA || args.p_user_id === ownerB));
});

test("concurrent same-target and mixed-target requests choose one destination", async () => {
  const db = claimedDb();
  const { item, event, invoke, eventBody } = routes(db);
  const same = await Promise.all([invoke(item, ids.concurrentTask, { target: "task" }), invoke(item, ids.concurrentTask, { target: "task" })]);
  assert.deepEqual(same.map((response) => response.status).sort(), [200, 201]);
  const mixed = await Promise.all([invoke(item, ids.concurrentMixed, { target: "task" }), invoke(item, ids.concurrentMixed, { target: "note" })]);
  assert.deepEqual(mixed.map((response) => response.status).sort(), [201, 409]);
  const events = await Promise.all([invoke(event, ids.concurrentEvent, eventBody), invoke(event, ids.concurrentEvent, eventBody)]);
  assert.deepEqual(events.map((response) => response.status).sort(), [200, 201]);
  assert.equal(db.destinations.task.has(ids.concurrentTask), true);
  assert.equal(db.destinations.task.has(ids.concurrentMixed) && db.destinations.note.has(ids.concurrentMixed), false);
  assert.equal(db.destinations.event.size, 1);
});

test("device-only resolution is refused and Event cache cleanup prevents fallback resurrection", async () => {
  const capture = { id: ids.event, text: "Doctor appointment\nBring insurance card", createdAt: "2026-10-04T00:00:00.000Z" };
  const otherCapture = { ...capture, id: ids.note };
  const saved = new Map([[ownerA, [capture]], [ownerB, [otherCapture]]]);
  const capturesApi = load("src/lib/captures-api.ts", {
    __fetch: async () => { throw new Error("cloud read failed"); },
    "@/lib/quick-captures": { createQuickCapture: () => {}, getQuickCaptures: () => [capture], isQuickCapture: () => true },
    "@/lib/user-scoped-cache": {
      readUserScopedList: ({ userId }) => saved.get(userId) ?? [],
      writeUserScopedList: ({ userId, items }) => saved.set(userId, items),
    },
    "@/lib/local-fallback-cache": {
      getUserScopedFallbackIds: () => [], getUserScopedHiddenIds: () => [],
      markUserScopedFallbackId: () => {}, markUserScopedHiddenId: () => {},
    },
  });
  let ui = [capture];
  const processing = load("src/lib/inbox-processing.ts", {
    "@/lib/activity-recording": { recordTaskCreatedActivity: async () => {}, recordNoteCreatedActivity: async () => {}, recordInboxProcessedActivity: async () => {} },
    "@/lib/captures-api": capturesApi,
    "@/lib/quick-captures": { removeQuickCapture: () => [] },
    "@/lib/tasks-api": { parseResolvedCaptureTask: () => ({}), upsertCachedTaskForOwner: () => {} },
    "@/lib/notes-api": { parseResolvedCaptureNote: () => ({}), upsertCachedNoteForOwner: () => {} },
  });
  await assert.rejects(processing.convertInboxItemToTask(capture, { captureSource: "local-only" }), /Account-backed/);
  await assert.rejects(processing.convertInboxItemToNote(capture, { captureSource: "local-fallback", accessToken: "token" }), /Account-backed/);
  assert.equal(processing.canResolveCaptureToAccount("local-only", "token"), false);
  assert.equal(processing.canResolveCaptureToAccount("local-fallback", "token"), false);
  assert.equal(processing.canResolveCaptureToAccount("cloud", undefined), false);
  assert.equal(processing.canResolveCaptureToAccount("cloud", "token"), true);
  assert.equal(capturesApi.getCachedCapturesForOwner(ownerA).length, 1);
  const { event, invoke, eventBody } = routes(claimedDb());
  assert.equal((await invoke(event, ids.event, eventBody)).status, 201);
  processing.completeInboxEventResolution(capture, { captureSource: "cloud", accessToken: "token", ownerId: ownerA });
  ui = ui.filter((item) => item.id !== capture.id);
  assert.equal(ui.length, 0);
  assert.equal(capturesApi.getCachedCapturesForOwner(ownerA).length, 0);
  assert.equal(capturesApi.getCachedCapturesForOwner(ownerB)[0].id, ids.note);
  const cloudReadFailedFallback = await capturesApi.loadCapturesFromPrimarySourceWithBoundary({ accessToken: "token", ownerId: ownerA });
  assert.equal(cloudReadFailedFallback.source, "local-fallback");
  assert.equal(cloudReadFailedFallback.captures.length, 0);
});

test("claim migration declares transactional owner and service-role boundaries", () => {
  const sql = source("supabase/migrations/202610040002_capture_resolution_claims_event_details.sql");
  assert.match(sql, /primary key \(user_id, capture_id\)/);
  assert.match(sql, /alter table public\.capture_resolution_claims enable row level security/);
  assert.match(sql, /revoke all on public\.capture_resolution_claims from public, anon, authenticated/);
  assert.match(sql, /where id = p_capture_id and user_id = p_user_id\s+and status = 'inbox' and deleted_at is null/g);
  assert.match(sql, /insert into public\.capture_resolution_claims/g);
  assert.match(sql, /grant execute on function public\.resolve_claimed_capture_to_event/);
  assert.match(sql, /grant execute on function public\.resolve_claimed_capture_to_item/);
});
