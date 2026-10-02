import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { events, tasks, parseArgs, run } from '../scripts/dev/calendar-visual-qa.mjs';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';
const token = `x.${Buffer.from(JSON.stringify({ sub: userId })).toString('base64url')}.x`;
const options = (manifest, command) => ({ command, origin: 'http://localhost:3001', userId,
  tokenFile: '/unused', manifest });

function localParts(instant) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Kyiv',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23' }).format(new Date(instant));
}

test('fixture represents the requested week, workspace identities and temporal variants', () => {
  assert.equal(events.length, 24);
  assert.equal(tasks.length, 2);
  assert.deepEqual(new Set([...events, ...tasks].map((item) => item.workspaceId)),
    new Set(['Work', 'Personal', 'Side Project']));

  const focus = events.find((item) => item.fixtureId === 'focus-time');
  assert.equal(localParts(focus.startAt), '29/09/2026, 09:30');
  assert.equal(localParts(focus.endAt), '29/09/2026, 11:00');
  assert.equal(focus.busy, false);

  const allDay = events.find((item) => item.fixtureId === 'kyiv-tech-meetup');
  assert.deepEqual([allDay.kind, allDay.startDate, allDay.endDateExclusive, allDay.workspaceId],
    ['all-day', '2026-10-01', '2026-10-02', 'Personal']);

  const crossMidnight = events.find((item) => item.fixtureId === 'release-monitoring');
  assert.equal(localParts(crossMidnight.startAt), '02/10/2026, 22:30');
  assert.equal(localParts(crossMidnight.endAt), '03/10/2026, 00:30');

  const overlap = events.filter((item) => ['deep-work-friday', 'marketing-sync'].includes(item.fixtureId));
  assert.equal(overlap.length, 2);
  assert.equal(Date.parse(overlap[0].startAt) < Date.parse(overlap[1].endAt) &&
    Date.parse(overlap[1].startAt) < Date.parse(overlap[0].endAt), true);

  assert.deepEqual(tasks.map((item) => [item.title, localParts(item.plannedStart),
    item.estimatedDurationMinutes, item.planDay, item.workspaceId]), [
    ['Review analytics', '02/10/2026, 13:30', 45, '2026-10-02', 'Work'],
    ['Finish landing copy', '02/10/2026, 15:30', 60, '2026-10-02', 'Side Project'],
  ]);
});

test('CLI refuses remote origins and seed without explicit test-backend acknowledgment', () => {
  const args = ['seed', '--origin', 'http://localhost:3001', '--user-id', userId,
    '--token-file', '/private/tmp/token'];
  assert.throws(() => parseArgs(args), /confirm-test-backend/);
  assert.throws(() => parseArgs([...args, '--confirm-test-backend', '--origin', 'https://example.com']), /Usage/);
  assert.throws(() => parseArgs(args.map((item) => item === 'http://localhost:3001' ? 'https://example.com' : item)
    .concat('--confirm-test-backend')), /local HTTP origin/);
});

test('seed records returned IDs; cleanup deletes only those IDs through owned APIs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'orvia-calendar-qa-'));
  const manifest = join(dir, 'calendar.seed');
  const eventRows = new Map();
  const taskRows = new Map();
  const calls = [];
  let nextId = 1;
  const id = () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`;
  const transport = async (url, init) => {
    const path = new URL(url).pathname;
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ method: init.method, path, body, authorization: init.headers.Authorization });
    const ok = (data) => Response.json({ ok: true, ...data });
    if (path === '/api/tasks' && init.method === 'GET') return ok({ tasks: [...taskRows.values()] });
    if (path === '/api/tasks' && init.method === 'POST') {
      const row = { id: id(), user_id: userId, title: body.title };
      taskRows.set(row.id, row);
      return ok({ task: row });
    }
    if (path === '/api/events' && init.method === 'POST') {
      const row = { id: id(), user_id: userId, title: body.title };
      eventRows.set(row.id, row);
      return ok({ event: row });
    }
    const [, , kind, recordId, action] = path.split('/');
    const rows = kind === 'events' ? eventRows : taskRows;
    if (action === 'schedule' && init.method === 'PATCH') return ok({ task: rows.get(recordId) });
    if (init.method === 'GET' && kind === 'events') {
      return rows.has(recordId) ? ok({ event: rows.get(recordId) }) : Response.json({ ok: false }, { status: 404 });
    }
    if (init.method === 'DELETE') {
      rows.delete(recordId);
      return ok({});
    }
    throw new Error(`Unexpected mocked route: ${init.method} ${path}`);
  };
  try {
    const seeded = await run(options(manifest, 'seed'), async () => token, transport);
    assert.deepEqual(seeded, { events: 24, tasks: 2 });
    const saved = JSON.parse(await readFile(manifest, 'utf8'));
    assert.equal(saved.userId, userId);
    assert.equal(saved.state, 'complete');
    assert.equal(saved.events.length, 24);
    assert.equal(saved.tasks.length, 2);
    assert.equal(calls.filter((call) => call.method === 'PATCH').length, 2);
    assert.equal(calls.every((call) => call.authorization === `Bearer ${token}`), true);
    assert.equal(calls.filter((call) => call.path === '/api/events' && call.method === 'POST')
      .every((call) => !Object.hasOwn(call.body, 'workspaceId') && !Object.hasOwn(call.body, 'fixtureId')), true);
    const allIds = [...saved.events, ...saved.tasks].map((row) => row.id).sort();
    await run(options(manifest, 'cleanup'), async () => token, transport);
    assert.deepEqual(calls.filter((call) => call.method === 'DELETE')
      .map((call) => call.path.split('/').at(-1)).sort(), allIds);
    assert.equal(eventRows.size, 0);
    assert.equal(taskRows.size, 0);
    await assert.rejects(readFile(manifest), { code: 'ENOENT' });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('seed rejects a different token subject before making requests', async () => {
  let called = false;
  const badToken = `x.${Buffer.from(JSON.stringify({ sub: otherUserId })).toString('base64url')}.x`;
  await assert.rejects(run(options('/unused/calendar.seed', 'seed'), async () => badToken,
    async () => { called = true; throw new Error('should not request'); }), /differs/);
  assert.equal(called, false);
});
