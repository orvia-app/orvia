import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ownerA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ownerB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const eventId = '11111111-1111-4111-8111-111111111111';
const taskId = '22222222-2222-4222-8222-222222222222';
const interval = { start: '2026-09-30T10:00:00.000Z', end: '2026-09-30T12:00:00.000Z' };
const timed = { kind: 'timed', title: 'Appointment', timezone: 'Europe/Kyiv', busy: false,
  startAt: '2026-09-30T09:00:00.000Z', endAt: '2026-09-30T11:00:00.000Z' };
const allDay = { kind: 'all-day', title: 'Holiday', timezone: 'Pacific/Auckland', busy: true,
  startDate: '2026-09-30', endDateExclusive: '2026-10-01' };

function load(path, dependencies = {}) {
  const filename = resolve(root, path);
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: filename,
  });
  const loaded = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    Date, Intl, RangeError, TypeError, Error, crypto, Request, Response, URL,
    exports: loaded.exports, module: loaded,
    require: (id) => {
      if (!(id in dependencies)) throw new Error(`Missing test dependency ${id}`);
      return dependencies[id];
    },
  }, { filename });
  return loaded.exports;
}

function database(seed = {}) {
  const rows = {
    orvia_events: structuredClone(seed.orvia_events ?? []),
    tasks: structuredClone(seed.tasks ?? []),
    task_plan_blocks: structuredClone(seed.task_plan_blocks ?? []),
    planning_preferences: structuredClone(seed.planning_preferences ?? []),
  };
  let fail = null;
  let ignoreOwner = false;
  const calls = [];
  function from(table) {
    let operation = 'select', payload, filters = [], page;
    const query = {
      select() { return query; }, order() { return query; },
      insert(value) { operation = 'insert'; payload = value; return query; },
      update(value) { operation = 'update'; payload = value; return query; },
      eq(key, value) { filters.push((row) => key === 'user_id' && ignoreOwner ? true : row[key] === value); calls.push({ table, key, value }); return query; },
      is(key, value) { filters.push((row) => row[key] === value); return query; },
      lt(key, value) { filters.push((row) => row[key] != null && row[key] < value); return query; },
      gt(key, value) { filters.push((row) => row[key] != null && row[key] > value); return query; },
      gte(key, value) { filters.push((row) => row[key] != null && row[key] >= value); return query; },
      lte(key, value) { filters.push((row) => row[key] != null && row[key] <= value); return query; },
      in(key, values) { filters.push((row) => values.includes(row[key])); return query; },
      range(start, end) { page = [start, end]; return query; },
      async result(single = false) {
        if (fail === table) return { data: null, error: { message: 'sensitive internal error' } };
        let selected = rows[table].filter((row) => filters.every((filter) => filter(row)));
        if (operation === 'insert') {
          const value = { ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
          rows[table].push(value); selected = [value];
        } else if (operation === 'update') {
          selected.forEach((row) => Object.assign(row, payload));
        }
        if (page) selected = selected.slice(page[0], page[1] + 1);
        return { data: single ? selected[0] ?? null : selected, error: null };
      },
      maybeSingle() { return query.result(true); },
      single() { return query.result(true); },
      then(resolve, reject) { return query.result().then(resolve, reject); },
    };
    return query;
  }
  return { from, rows, calls, setFailure(table) { fail = table; }, setIgnoreOwner(value) { ignoreOwner = value; } };
}

function harness(seed) {
  const db = database(seed);
  const domain = load('src/core/schedule/domain.ts');
  const projection = load('src/core/schedule/projection.ts', { './domain': domain });
  const input = load('src/server/api/schedule-input.ts', { '@/core/schedule/domain': domain });
  const preferences = load('src/server/api/planning-preferences.ts', {
    '@/core/schedule/domain': domain,
    '@/lib/supabase': { getSupabaseServerClient: () => db },
  });
  const events = load('src/server/api/events.ts', {
    '@/core/schedule/domain': domain, './schedule-input': input,
  });
  const source = load('src/server/api/schedule-source.ts', {
    '@/lib/supabase': { getSupabaseServerClient: () => db },
    '@/core/schedule/domain': domain,
    '@/core/schedule/projection': projection,
    './events': events,
  });
  const auth = { authenticateApiRequest: async (request) => {
    const token = request.headers.get('authorization');
    if (token !== 'Bearer A' && token !== 'Bearer B') return {
      ok: false, response: Response.json({ ok: false, error: 'Authentication is required.' }, { status: 401 }),
    };
    return { ok: true, userId: token === 'Bearer A' ? ownerA : ownerB };
  } };
  const shared = {
    'next/server': { NextResponse: { json: Response.json.bind(Response) } },
    '@/server/api/auth': auth,
    '@/lib/supabase': { getSupabaseServerClient: () => db },
    '@/server/api/events': events,
    '@/server/api/planning-preferences': preferences,
    '@/server/api/schedule-input': input,
    '@/server/api/schedule-source': source,
  };
  return {
    db, events, input, source,
    collection: load('src/app/api/events/route.ts', shared),
    query: load('src/app/api/events/query/route.ts', shared),
    detail: load('src/app/api/events/[id]/route.ts', shared),
    task: load('src/app/api/tasks/[id]/schedule/route.ts', shared),
    schedule: load('src/app/api/schedule/route.ts', shared),
  };
}
function req(method, body, token = 'A') {
  return new Request('https://orvia.test/api', {
    method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const ctx = (id) => ({ params: Promise.resolve({ id }) });
const json = async (response) => ({ status: response.status, body: await response.json() });
const eventRow = (overrides = {}) => ({ id: eventId, user_id: ownerA, title: timed.title,
  timezone: timed.timezone, busy: timed.busy, all_day: false, start_at: timed.startAt,
  end_at: timed.endAt, start_date: null, end_date_exclusive: null,
  lifecycle_status: 'active', created_at: '2026-09-30T00:00:00.000Z', updated_at: '2026-09-30T00:00:00.000Z', ...overrides });
const taskRow = (overrides = {}) => ({ id: taskId, user_id: ownerA, title: 'Task', status: 'todo',
  priority: 'medium', workspace_id: null, due_date: '2026-10-02', planned_start: null,
  estimated_duration_minutes: null, plan_day: null, deleted_at: null, created_at: '2026-09-30T00:00:00.000Z', ...overrides });
const blockRow = (overrides = {}) => ({
  id: '33333333-3333-4333-8333-333333333333', user_id: ownerA, task_id: taskId,
  start_at: '2026-09-30T10:00:00.000Z', end_at: '2026-09-30T11:00:00.000Z',
  version: 1, created_at: '2026-09-30T00:00:00.000Z', updated_at: '2026-09-30T00:00:00.000Z',
  ...overrides,
});

test('Event auth, validation, timed/all-day creation and owner assignment', async () => {
  const h = harness();
  assert.equal((await json(await h.collection.POST(req('POST', timed, null)))).status, 401);
  for (const body of [
    { ...timed, user_id: ownerB }, { ...timed, workspaceId: 'work' },
    { ...timed, startDate: '2026-09-30' }, { ...timed, timezone: 'Mars/Unknown' },
    { ...timed, endAt: timed.startAt }, { ...timed, startAt: 'bad' },
    { ...allDay, endDateExclusive: allDay.startDate }, { ...allDay, startDate: '2026-02-30' },
  ]) assert.equal((await json(await h.collection.POST(req('POST', body)))).status, 400);
  assert.equal((await json(await h.collection.POST(req('POST', timed)))).status, 201);
  assert.equal((await json(await h.collection.POST(req('POST', allDay)))).status, 201);
  assert.equal(h.db.rows.orvia_events[0].user_id, ownerA);
  assert.equal(h.db.rows.orvia_events[0].busy, false);
  assert.equal(h.db.rows.orvia_events[1].all_day, true);
});

test('Event range intersection, lifecycle, update and cross-owner IDs', async () => {
  const h = harness({ orvia_events: [
    eventRow(), eventRow({ id: crypto.randomUUID(), start_at: interval.end, end_at: '2026-09-30T13:00:00.000Z' }),
    eventRow({ id: crypto.randomUUID(), lifecycle_status: 'archived' }),
    eventRow({ id: crypto.randomUUID(), lifecycle_status: 'deleted' }),
    eventRow({ id: crypto.randomUUID(), user_id: ownerB }),
  ] });
  const listed = await json(await h.query.POST(req('POST', { range: interval })));
  assert.equal(listed.status, 200);
  assert.deepEqual(listed.body.events.map((event) => event.id), [eventId]);
  assert.equal((await json(await h.query.POST(req('POST', { range: { ...interval, end: '2028-01-01T00:00:00.000Z' } })))).status, 400);
  assert.equal((await json(await h.detail.GET(req('GET'), ctx(eventId)))).status, 200);
  assert.equal((await json(await h.detail.GET(req('GET'), ctx('invalid-id')))).status, 404);
  assert.equal((await json(await h.detail.GET(req('GET', undefined, 'B'), ctx(eventId)))).status, 404);
  for (const method of ['PATCH', 'POST', 'DELETE']) {
    const response = await h.detail[method](req(method, method === 'PATCH' ? { title: 'Other' } : undefined, 'B'), ctx(eventId));
    assert.equal(response.status, 404);
  }
  for (const patch of [{ user_id: ownerB }, { title: null }, { busy: null }, { endAt: null }]) {
    assert.equal((await json(await h.detail.PATCH(req('PATCH', patch), ctx(eventId)))).status, 400);
  }
  assert.equal((await json(await h.detail.PATCH(req('PATCH', { title: 'Changed', busy: true }), ctx(eventId)))).status, 200);
  assert.equal(h.db.rows.orvia_events[0].title, 'Changed');
  assert.equal(h.db.rows.orvia_events[0].busy, true);
  assert.equal((await json(await h.detail.POST(req('POST'), ctx(eventId)))).body.lifecycleStatus, 'archived');
  assert.equal((await json(await h.detail.DELETE(req('DELETE'), ctx(eventId)))).status, 404);
  const active = h.db.rows.orvia_events.find((event) => event.user_id === ownerB);
  assert.equal((await json(await h.detail.DELETE(req('DELETE', undefined, 'B'), ctx(active.id)))).body.lifecycleStatus, 'deleted');
  assert.equal(h.db.rows.orvia_events.some((event) => event.id === active.id), true);
  assert.equal(h.db.calls.filter((call) => call.key === 'user_id').every((call) => [ownerA, ownerB].includes(call.value)), true);
});

test('Task scheduling fields change independently, clear and preserve deadline/owner', async () => {
  const h = harness({ tasks: [taskRow(), taskRow({ id: crypto.randomUUID(), user_id: ownerB }), taskRow({ id: crypto.randomUUID(), user_id: null })] });
  for (const patch of [
    { plannedStart: timed.startAt }, { estimatedDurationMinutes: 60 }, { planDay: '2026-09-30' },
  ]) assert.equal((await json(await h.task.PATCH(req('PATCH', patch), ctx(taskId)))).status, 200);
  assert.equal(h.db.rows.tasks[0].due_date, '2026-10-02');
  assert.equal(h.db.rows.tasks[0].plan_day, '2026-09-30');
  assert.equal((await json(await h.task.PATCH(req('PATCH', { plannedStart: null, estimatedDurationMinutes: null, planDay: null }), ctx(taskId)))).status, 200);
  assert.equal(h.db.rows.tasks[0].planned_start, null);
  for (const patch of [{ estimatedDurationMinutes: 0 }, { planDay: '2026-02-30' }, { dueDate: '2026-10-04' }]) {
    assert.equal((await json(await h.task.PATCH(req('PATCH', patch), ctx(taskId)))).status, 400);
  }
  assert.equal((await json(await h.task.PATCH(req('PATCH', { planDay: '2026-09-30' }, 'B'), ctx(taskId)))).status, 404);
  assert.equal((await json(await h.task.PATCH(req('PATCH', { planDay: '2026-09-30' }), ctx(h.db.rows.tasks[2].id)))).status, 404);
  assert.equal(h.db.rows.tasks[2].user_id, null);
});

test('Schedule projection returns factual rows with honest incomplete privacy/source state', async () => {
  const h = harness({ tasks: [
    taskRow({ planned_start: '2026-09-30T10:30:00.000Z', estimated_duration_minutes: 60 }),
    taskRow({ id: crypto.randomUUID(), plan_day: '2026-09-30' }),
    taskRow({ id: crypto.randomUUID(), due_date: '2026-09-30' }),
    taskRow({ id: crypto.randomUUID(), user_id: ownerB, plan_day: '2026-09-30' }),
  ], orvia_events: [eventRow()] });
  const body = { range: interval, planningTimezone: 'Europe/Kyiv' };
  assert.equal((await json(await h.schedule.POST(req('POST', body, null)))).status, 401);
  assert.equal((await json(await h.schedule.POST(req('POST', { ...body, planningTimezone: 'bad/zone' })))).status, 400);
  assert.equal((await json(await h.schedule.POST(req('POST', { ...body, range: { start: interval.end, end: interval.start } })))).status, 400);
  const result = await json(await h.schedule.POST(req('POST', body)));
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.projection.items.map((item) => item.source), ['orvia-event', 'task']);
  assert.equal(result.body.projection.unplacedTasks.length, 1);
  assert.equal(result.body.projection.completeness, 'incomplete');
  assert.equal(result.body.projection.sources.events.state, 'unverified');
  assert.equal(result.body.projection.sources.tasks.state, 'unverified');
  assert.ok(result.body.projection.sources.tasks.observedAt);
  assert.equal(result.body.projection.items.every((item) => item.ownerId === ownerA && item.intelligenceEligible === false), true);
  assert.equal(result.body.privacy.recommendationProcessingAllowed, false);
  h.db.setFailure('orvia_events');
  const partial = await json(await h.schedule.POST(req('POST', body)));
  assert.equal(partial.status, 200);
  assert.equal(partial.body.projection.sources.events.state, 'unavailable');
  assert.equal(partial.body.projection.completeness, 'incomplete');
  assert.equal(partial.body.projection.items.some((item) => item.source === 'orvia-event'), false);
});

test('saved planning timezone overrides the client timezone for Schedule Projection', async () => {
  const h = harness({
    planning_preferences: [{ user_id: ownerA, planning_timezone: 'America/Toronto' }],
  });
  const result = await json(await h.schedule.POST(req('POST', {
    range: interval,
    planningTimezone: 'Europe/Kyiv',
  })));
  assert.equal(result.status, 200);
  assert.equal(result.body.projection.planningTimezone, 'America/Toronto');
});

test('client timezone remains the Schedule Projection fallback without saved preferences', async () => {
  const h = harness();
  const result = await json(await h.schedule.POST(req('POST', {
    range: interval,
    planningTimezone: 'Europe/Kyiv',
  })));
  assert.equal(result.status, 200);
  assert.equal(result.body.projection.planningTimezone, 'Europe/Kyiv');
});

test('Schedule source projects multiple blocks once and suppresses the legacy interval', async () => {
  const secondBlockId = '44444444-4444-4444-8444-444444444444';
  const h = harness({
    tasks: [taskRow({ planned_start: '2026-09-30T09:30:00.000Z', estimated_duration_minutes: 120 })],
    task_plan_blocks: [
      blockRow(),
      blockRow({ id: secondBlockId, start_at: '2026-09-30T11:00:00.000Z',
        end_at: '2026-09-30T12:00:00.000Z' }),
    ],
  });
  const result = await json(await h.schedule.POST(req('POST', {
    range: interval,
    planningTimezone: 'Europe/Kyiv',
  })));
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.projection.items.map((item) => item.key), [
    'task-block:33333333-3333-4333-8333-333333333333',
    `task-block:${secondBlockId}`,
  ]);
  assert.equal(result.body.projection.items.every((item) => item.sourceId === taskId), true);
  assert.equal(result.body.projection.items.some((item) => item.key === `task:${taskId}`), false);
});

test('all-day Event uses its own timezone for exact range intersection', async () => {
  const h = harness({ orvia_events: [eventRow({ all_day: true, timezone: 'Pacific/Auckland',
    start_at: null, end_at: null, start_date: '2026-09-30', end_date_exclusive: '2026-10-01' })] });
  const inside = { start: '2026-09-29T12:00:00.000Z', end: '2026-09-29T13:00:00.000Z' };
  const touching = { start: '2026-09-30T11:00:00.000Z', end: '2026-09-30T12:00:00.000Z' };
  assert.equal((await json(await h.query.POST(req('POST', { range: inside })))).body.events.length, 1);
  assert.equal((await json(await h.query.POST(req('POST', { range: touching })))).body.events.length, 0);
});

test('source failure hides raw persistence errors and never claims completeness', async () => {
  const h = harness({ orvia_events: [eventRow()] });
  h.db.setFailure('orvia_events');
  const result = await json(await h.query.POST(req('POST', { range: interval })));
  assert.equal(result.status, 500);
  assert.equal(JSON.stringify(result.body).includes('sensitive internal error'), false);
  const projection = await json(await h.schedule.POST(req('POST', { range: interval, planningTimezone: 'Europe/Kyiv' })));
  assert.equal(projection.body.projection.sources.events.state, 'unavailable');
  assert.equal(projection.body.projection.completeness, 'incomplete');
});

test('source adapter fails closed if database returns a different owner', async () => {
  const h = harness({
    orvia_events: [eventRow({ user_id: ownerB })],
    tasks: [taskRow({ user_id: ownerB, plan_day: '2026-09-30' })],
    task_plan_blocks: [blockRow({ user_id: ownerB })],
  });
  h.db.setIgnoreOwner(true);
  const response = await json(await h.schedule.POST(req('POST', { range: interval, planningTimezone: 'Europe/Kyiv' })));
  assert.equal(response.status, 200);
  assert.equal(response.body.projection.items.length, 0);
  assert.equal(response.body.projection.unplacedTasks.length, 0);
  assert.equal(response.body.projection.sources.events.state, 'unavailable');
  assert.equal(response.body.projection.sources.tasks.state, 'unavailable');
});
