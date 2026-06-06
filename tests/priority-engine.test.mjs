import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadPriorityEngine() {
  const sourcePath = resolve(projectRoot, "src/lib/priority-engine.ts");
  const source = readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  });
  const module = { exports: {} };

  vm.runInNewContext(transpiled.outputText, {
    console,
    exports: module.exports,
    module,
    require,
  });

  return module.exports;
}

const {
  calculateTaskPriorityScore,
  getPrioritizedTasks,
  getPriorityReason,
} = loadPriorityEngine();

const context = { todayDateKey: "2026-06-06" };

function task(overrides = {}) {
  return {
    createdAt: "2026-06-01T09:00:00.000Z",
    id: "task",
    priority: "medium",
    status: "todo",
    title: "Task",
    workspaceId: "personal",
    ...overrides,
  };
}

test("overdue tasks rank above normal active tasks", () => {
  const prioritizedTasks = getPrioritizedTasks(
    [
      task({
        id: "normal",
        priority: "medium",
        title: "Normal active task",
      }),
      task({
        dueDate: "2026-06-05",
        id: "overdue",
        priority: "medium",
        title: "Overdue task",
      }),
    ],
    context,
  );

  assert.equal(prioritizedTasks[0].task.id, "overdue");
});

test("tasks due today rank above future tasks", () => {
  const prioritizedTasks = getPrioritizedTasks(
    [
      task({
        dueDate: "2026-06-20",
        id: "future",
        priority: "critical",
        title: "Future critical task",
      }),
      task({
        dueDate: "2026-06-06",
        id: "today",
        priority: "low",
        title: "Due today task",
      }),
    ],
    context,
  );

  assert.equal(prioritizedTasks[0].task.id, "today");
});

test("completed tasks are excluded from prioritized output", () => {
  const prioritizedTasks = getPrioritizedTasks(
    [
      task({
        id: "done",
        priority: "critical",
        status: "done",
        title: "Completed task",
      }),
      task({ id: "active", title: "Active task" }),
    ],
    context,
  );

  assert.deepEqual(
    prioritizedTasks.map((prioritizedTask) => prioritizedTask.task.id),
    ["active"],
  );
});

test("critical and high priorities increase task scores", () => {
  const mediumTask = task({ id: "medium", priority: "medium" });
  const highTask = task({ id: "high", priority: "high" });
  const criticalTask = task({ id: "critical", priority: "critical" });

  assert.ok(
    calculateTaskPriorityScore(highTask, context) >
      calculateTaskPriorityScore(mediumTask, context),
  );
  assert.ok(
    calculateTaskPriorityScore(criticalTask, context) >
      calculateTaskPriorityScore(highTask, context),
  );
});

test("recommendation reasons are generated from task signals", () => {
  const reasons = getPriorityReason(
    task({
      createdAt: "2026-05-01T09:00:00.000Z",
      dueDate: "2026-06-05",
      priority: "critical",
      status: "in-progress",
    }),
    context,
  );

  assert.deepEqual(Array.from(reasons), [
    "Overdue",
    "Critical priority",
    "Already in progress",
    "Waiting too long",
  ]);
});

test("prioritized output ordering is deterministic for tied scores", () => {
  const prioritizedTasks = getPrioritizedTasks(
    [
      task({
        createdAt: "2026-06-01T09:00:00.000Z",
        id: "older",
        title: "Older task",
      }),
      task({
        createdAt: "2026-06-02T09:00:00.000Z",
        id: "newer",
        title: "Newer task",
      }),
    ],
    context,
  );

  assert.deepEqual(
    prioritizedTasks.map((prioritizedTask) => prioritizedTask.task.id),
    ["newer", "older"],
  );
});
