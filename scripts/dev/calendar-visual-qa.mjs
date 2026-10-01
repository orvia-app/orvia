#!/usr/bin/env node
/** Disposable local Calendar QA data. Never import this from application code. */
import { readFile, writeFile, rename, unlink, open, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DEFAULT_MANIFEST = resolve(ROOT, '.calendar-visual-qa.seed');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ZONE = 'Europe/Kyiv';

export const events = [
  { kind: 'timed', title: 'Product sync', timezone: ZONE, busy: true,
    startAt: '2026-10-01T06:30:00.000Z', endAt: '2026-10-01T07:15:00.000Z' },
  { kind: 'timed', title: 'Focus / optional', timezone: ZONE, busy: false,
    startAt: '2026-10-01T10:00:00.000Z', endAt: '2026-10-01T11:00:00.000Z' },
  { kind: 'all-day', title: 'Design review', timezone: ZONE, busy: true,
    startDate: '2026-10-02', endDateExclusive: '2026-10-03' },
  { kind: 'timed', title: 'Deep work block', timezone: ZONE, busy: true,
    startAt: '2026-10-03T19:30:00.000Z', endAt: '2026-10-03T21:30:00.000Z' },
];

export const tasks = [
  { title: 'Finish onboarding flow', plannedStart: '2026-10-01T07:30:00.000Z',
    estimatedDurationMinutes: 45, planDay: '2026-10-01' },
  { title: 'Review release checklist', plannedStart: '2026-10-02T11:00:00.000Z',
    estimatedDurationMinutes: 90, planDay: '2026-10-02' },
];

function usage() {
  return 'Usage: node scripts/dev/calendar-visual-qa.mjs seed|cleanup --origin http://localhost:3001 --user-id UUID --token-file /private/tmp/token-file [--manifest /path/to/file.seed] [--confirm-test-backend for seed]';
}

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (!['seed', 'cleanup'].includes(command)) throw new Error(usage());
  const options = {};
  for (let index = 0; index < rest.length;) {
    const key = rest[index];
    if (key === '--confirm-test-backend' && command === 'seed' && !options[key]) {
      options[key] = true;
      index += 1;
      continue;
    }
    if (!['--origin', '--user-id', '--token-file', '--manifest'].includes(key) || !rest[index + 1] || options[key]) {
      throw new Error(usage());
    }
    options[key] = rest[index + 1];
    index += 2;
  }
  if (!options['--origin'] || !options['--user-id'] || !options['--token-file']) throw new Error(usage());
  if (command === 'seed' && !options['--confirm-test-backend']) {
    throw new Error('Inspect the local app database target, then pass --confirm-test-backend.');
  }
  const origin = new URL(options['--origin']);
  if (origin.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) ||
      origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('Origin must be a plain local HTTP origin.');
  }
  if (!UUID.test(options['--user-id'])) throw new Error('A valid expected user UUID is required.');
  const tokenFile = resolve(options['--token-file']);
  if (tokenFile === ROOT || tokenFile.startsWith(`${ROOT}/`)) {
    throw new Error('Keep the access-token file outside the repository.');
  }
  const manifest = resolve(options['--manifest'] ?? DEFAULT_MANIFEST);
  if (!manifest.endsWith('.seed')) throw new Error('Manifest filename must end in .seed.');
  return { command, origin: origin.origin, userId: options['--user-id'],
    tokenFile, manifest };
}

function tokenSubject(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Access token must be a JWT.');
  let payload;
  try { payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')); }
  catch { throw new Error('Access token has an invalid JWT payload.'); }
  if (!payload || typeof payload.sub !== 'string' || !UUID.test(payload.sub)) {
    throw new Error('Access token has no valid user subject.');
  }
  return payload.sub;
}

function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }

function validateManifest(value, options) {
  if (!isRecord(value) || value.version !== 1 || value.origin !== options.origin ||
      value.userId !== options.userId || !['in-progress', 'complete'].includes(value.state) ||
      !Array.isArray(value.events) || !Array.isArray(value.tasks)) {
    throw new Error('Manifest is invalid or belongs to another origin/user.');
  }
  for (const collection of [value.events, value.tasks]) {
    if (collection.some((row) => !isRecord(row) || !UUID.test(row.id) || typeof row.title !== 'string')) {
      throw new Error('Manifest contains an invalid record ID.');
    }
  }
  return value;
}

async function saveManifest(path, value) {
  const temporary = `${path}.${process.pid}.seed`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
  try { await rename(temporary, path); }
  catch (error) { await unlink(temporary); throw error; }
}

async function request(options, token, transport, method, path, body, allowMissing = false) {
  const response = await transport(`${options.origin}${path}`, {
    method, redirect: 'error',
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let result;
  try { result = await response.json(); } catch { throw new Error(`${method} ${path}: non-JSON response (${response.status}).`); }
  if (allowMissing && response.status === 404) return null;
  if (!response.ok || !isRecord(result) || result.ok !== true) {
    // Do not echo server error bodies: they may include private content.
    throw new Error(`${method} ${path}: HTTP ${response.status}.`);
  }
  return result;
}

function assertOwnedRow(row, options, title) {
  if (!isRecord(row) || !UUID.test(row.id) || row.user_id !== options.userId || row.title !== title) {
    throw new Error('API response did not confirm the expected owner, ID and title. Stop and inspect manually.');
  }
  return row.id;
}

export async function run(options, fetchToken, transport = fetch) {
  const token = (await fetchToken()).trim();
  if (tokenSubject(token) !== options.userId) throw new Error('Token subject differs from --user-id.');
  // This existing API validates the bearer with Supabase getUser before any writes.
  await request(options, token, transport, 'GET', '/api/tasks');

  if (options.command === 'seed') {
    const handle = await open(options.manifest, 'wx', 0o600);
    const manifest = { version: 1, origin: options.origin, userId: options.userId,
      state: 'in-progress', events: [], tasks: [] };
    try { await handle.writeFile(`${JSON.stringify(manifest, null, 2)}\n`); }
    finally { await handle.close(); }
    for (const event of events) {
      const result = await request(options, token, transport, 'POST', '/api/events', event);
      const id = assertOwnedRow(result.event, options, event.title);
      manifest.events.push({ id, title: event.title });
      await saveManifest(options.manifest, manifest);
    }
    for (const task of tasks) {
      const result = await request(options, token, transport, 'POST', '/api/tasks', { title: task.title });
      const id = assertOwnedRow(result.task, options, task.title);
      manifest.tasks.push({ id, title: task.title });
      await saveManifest(options.manifest, manifest);
      const scheduled = await request(options, token, transport, 'PATCH', `/api/tasks/${id}/schedule`, {
        plannedStart: task.plannedStart, estimatedDurationMinutes: task.estimatedDurationMinutes,
        planDay: task.planDay,
      });
      assertOwnedRow(scheduled.task, options, task.title);
    }
    manifest.state = 'complete';
    await saveManifest(options.manifest, manifest);
    return { events: manifest.events.length, tasks: manifest.tasks.length };
  }

  const manifest = validateManifest(JSON.parse(await readFile(options.manifest, 'utf8')), options);
  for (const record of [...manifest.events]) {
    const found = await request(options, token, transport, 'GET', `/api/events/${record.id}`, undefined, true);
    if (found) assertOwnedRow(found.event, options, record.title);
    if (found) await request(options, token, transport, 'DELETE', `/api/events/${record.id}`);
    manifest.events = manifest.events.filter((row) => row.id !== record.id);
    await saveManifest(options.manifest, manifest);
  }
  for (const record of [...manifest.tasks]) {
    const listed = await request(options, token, transport, 'GET', '/api/tasks');
    if (!Array.isArray(listed.tasks)) throw new Error('Task API returned an invalid list; cleanup stopped.');
    const found = listed.tasks.find((row) => row.id === record.id);
    if (found) {
      assertOwnedRow(found, options, record.title);
      await request(options, token, transport, 'DELETE', `/api/tasks/${record.id}`);
    }
    manifest.tasks = manifest.tasks.filter((row) => row.id !== record.id);
    await saveManifest(options.manifest, manifest);
  }
  await unlink(options.manifest);
  return { events: 0, tasks: 0 };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const tokenStat = await lstat(options.tokenFile);
  if (!tokenStat.isFile() || (tokenStat.mode & 0o077) !== 0) {
    throw new Error('Token file must be a regular file readable only by its owner (chmod 600).');
  }
  const result = await run(options, () => readFile(options.tokenFile, 'utf8'));
  process.stdout.write(options.command === 'seed'
    ? `Created ${result.events} Events and ${result.tasks} Tasks. IDs saved in ${options.manifest}.\n`
    : 'Seeded records removed from active Calendar; manifest deleted.\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'Calendar QA seed failed.'}\n`);
    process.exitCode = 1;
  });
}
