import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// Exercise the real page handler with isolated persistence boundaries.
const source = readFileSync(new URL('../src/app/tasks/page.tsx', import.meta.url), 'utf8');
const handler = source.slice(source.indexOf('  async function updateTaskDetails('), source.indexOf('  async function confirmDeleteTask('));
const compiled = ts.transpileModule(handler, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
function setup({ fail = false } = {}) {
  const task = { id: 'fixture', title: 'Synthetic task', status: 'todo', priority: 'medium' };
  const calls = [];
  const pending = new Set();
  const dependencies = {
    pendingTaskIds: pending, accessToken: 'synthetic-test-credential', ownerId: 'fixture-owner', tasks: [task],
    t: key => key,
    setTaskActionError: value => calls.push(['error', value]),
    setTaskPending: (id, value) => value ? pending.add(id) : pending.delete(id),
    updateTaskViaApi: async (id, patch) => { calls.push(['patch', patch]); if (fail) throw new Error('fixture unavailable'); return { ...task, ...patch }; },
    clearLocalFallbackTaskForOwner: () => calls.push(['clearFallback']),
    markLocalFallbackTaskForOwner: () => calls.push(['fallback']),
    syncTasks: (tasks, sources) => calls.push(['sync', tasks, sources]),
    recordTaskCompletedActivity: () => calls.push(['completed']),
    recordTaskUpdatedActivity: () => calls.push(['updated']),
  };
  const update = new Function(...Object.keys(dependencies), `${compiled}; return updateTaskDetails;`)(...Object.values(dependencies));
  return { update, task, calls, pending };
}

test('row priority change preserves status and does not record task completion', async () => {
  const { update, task, calls, pending } = setup();
  await update(task, { priority: 'high' });
  assert.deepEqual(calls.find(c => c[0] === 'patch')[1], { priority: 'high' });
  assert.equal(calls.find(c => c[0] === 'sync')[1][0].status, 'todo');
  assert.ok(calls.some(c => c[0] === 'updated'));
  assert.ok(!calls.some(c => c[0] === 'completed'));
  assert.equal(pending.size, 0);
});

test('row completion retains the existing completion activity path', async () => {
  const { update, task, calls } = setup();
  await update(task, { status: 'done' });
  assert.ok(calls.some(c => c[0] === 'completed'));
  assert.equal(calls.find(c => c[0] === 'sync')[1][0].priority, 'medium');
});

test('row update failure retains scoped fallback and releases pending state', async () => {
  const { update, task, calls, pending } = setup({ fail: true });
  await update(task, { priority: 'critical' });
  const sync = calls.find(c => c[0] === 'sync');
  assert.equal(sync[1][0].priority, 'critical');
  assert.equal(sync[2].fixture, 'local-fallback');
  assert.ok(calls.some(c => c[0] === 'fallback'));
  assert.ok(calls.some(c => c[0] === 'error' && c[1] === 'tasks.updateFallback'));
  assert.equal(pending.size, 0);
});

test('unchanged or pending row actions do not make duplicate requests', async () => {
  const { update, task, calls, pending } = setup();
  await update(task, { priority: 'medium' });
  pending.add(task.id);
  await update(task, { status: 'done' });
  assert.equal(calls.length, 0);
});
