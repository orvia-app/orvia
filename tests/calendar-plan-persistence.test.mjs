import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migration = readFileSync(
  resolve(root, "supabase/migrations/202609300001_calendar_plan_persistence.sql"),
  "utf8",
);

test("forward migration adds independent nullable Task scheduling fields", () => {
  assert.match(migration, /alter table public\.tasks\s+add column planned_start timestamptz,\s+add column estimated_duration_minutes integer,\s+add column plan_day date,/);
  assert.match(migration, /estimated_duration_minutes between 1 and 10080/);
  assert.doesNotMatch(migration, /\bupdate\s+public\.tasks\b/i);
  assert.doesNotMatch(migration, /\b(?:alter|add|drop|rename)\s+(?:column\s+)?due_date\b/i);
  assert.doesNotMatch(migration, /\bset\s+user_id\b/i);
});

test("Events have exclusive ordered temporal variants and required ownership", () => {
  assert.match(migration, /create table public\.orvia_events\s*\(/);
  assert.match(migration, /user_id uuid not null references auth\.users\(id\) on delete cascade/);
  assert.match(migration, /title text not null/);
  assert.match(migration, /length\(btrim\(title\)\) between 1 and 200/);
  assert.match(migration, /timezone text not null/);
  assert.match(migration, /length\(btrim\(timezone\)\) between 1 and 200/);
  assert.match(migration, /all_day = false and start_at is not null and end_at is not null\s+and end_at > start_at and start_date is null and end_date_exclusive is null/);
  assert.match(migration, /all_day = true and start_at is null and end_at is null\s+and start_date is not null and end_date_exclusive is not null\s+and end_date_exclusive > start_date/);
  assert.match(migration, /lifecycle_status in \('active', 'archived', 'deleted'\)/);
  assert.doesNotMatch(migration, /\bworkspace_id\b/);
});

test("Events grant CRUD only to authenticated owners and service role", () => {
  assert.match(migration, /alter table public\.orvia_events enable row level security;/);
  for (const operation of ["select", "insert", "update", "delete"]) {
    assert.match(migration, new RegExp(`create policy orvia_events_${operation}_own on public\\.orvia_events\\s+for ${operation} to authenticated`));
  }
  assert.match(migration, /create policy orvia_events_update_own[\s\S]*?using \(user_id = auth\.uid\(\)\)\s+with check \(user_id = auth\.uid\(\)\)/);
  assert.match(migration, /revoke all on table public\.orvia_events from public, anon, authenticated;/);
  assert.match(migration, /grant select, insert, update, delete on table public\.orvia_events to authenticated;/);
  assert.doesNotMatch(migration, /grant\s+[^;]*\bon\s+(?:table\s+)?public\.orvia_events\s+to\s+(?:public|anon)\b/i);
});

function loadTaskApi(fetch) {
  const path = resolve(root, "src/lib/tasks-api.ts");
  const source = readFileSync(path, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: path,
  });
  const exports = {};
  vm.runInNewContext(compiled.outputText, {
    exports,
    fetch,
    require: (id) => {
      if (id === "@/lib/tasks") return {
        TASK_STATUSES: ["todo", "in-progress", "done"],
        TASK_PRIORITIES: ["low", "medium", "high", "critical"],
      };
      if (id === "@/core/schedule/domain") return {
        isLocalDate: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value),
        isPositiveDurationMinutes: (value) => Number.isInteger(value) && value > 0 && value <= 10080,
      };
      return {};
    },
  });
  return exports;
}

const row = {
  id: "task-1",
  title: "Review",
  status: "todo",
  priority: "medium",
  workspace_id: "1",
  due_date: "2026-10-04",
  created_at: "2026-09-30T00:00:00Z",
};

test("Task API response mapping preserves scheduling fields and deadline separately", async () => {
  const api = loadTaskApi(async () => ({
    ok: true,
    json: async () => ({ ok: true, tasks: [{
      ...row,
      planned_start: "2026-09-30T09:00:00+00:00",
      estimated_duration_minutes: 90,
      plan_day: "2026-09-29",
    }] }),
  }));
  const [task] = await api.fetchTasksViaApi();
  assert.equal(task.plannedStart, "2026-09-30T09:00:00.000Z");
  assert.equal(task.estimatedDurationMinutes, 90);
  assert.equal(task.planDay, "2026-09-29");
  assert.equal(task.dueDate, "2026-10-04");
});

test("Task API mapping accepts legacy absent and current null schedule fields", async () => {
  const api = loadTaskApi(async () => ({
    ok: true,
    json: async () => ({ ok: true, tasks: [row, {
      ...row,
      id: "task-2",
      planned_start: null,
      estimated_duration_minutes: null,
      plan_day: null,
    }] }),
  }));
  const [legacy, current] = await api.fetchTasksViaApi();
  assert.equal(legacy.plannedStart, undefined);
  assert.equal(legacy.estimatedDurationMinutes, undefined);
  assert.equal(legacy.planDay, undefined);
  assert.equal(current.plannedStart, null);
  assert.equal(current.estimatedDurationMinutes, null);
  assert.equal(current.planDay, null);
});
