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

function loadActivityRecording(calls) {
  const sourcePath = resolve(projectRoot, "src/lib/activity-recording.ts");
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

  function stubbedRequire(id) {
    if (id === "@/lib/activities-api") {
      return {
        createActivityViaApi: async (input) => {
          calls.push(JSON.parse(JSON.stringify(input)));
          return {
            createdAt: "2026-06-07T00:00:00.000Z",
            id: "activity-id",
            metadata: {},
            occurredAt: "2026-06-07T00:00:00.000Z",
            title: input.title,
            type: input.type,
            entityType: input.entityType,
          };
        },
      };
    }

    return require(id);
  }

  vm.runInNewContext(transpiled.outputText, {
    console,
    exports: module.exports,
    module,
    require: stubbedRequire,
  });

  return module.exports;
}

const task = {
  createdAt: "2026-06-07T00:00:00.000Z",
  description: "Private task description that must not be copied",
  dueDate: "2026-06-08",
  id: "11111111-1111-4111-8111-111111111111",
  priority: "critical",
  status: "todo",
  title: "Private task title",
  workspaceId: "private-workspace",
};

const note = {
  content: "Private note body that must not be copied",
  createdAt: "2026-06-07T00:00:00.000Z",
  id: "22222222-2222-4222-8222-222222222222",
  title: "Private note title",
  type: "note",
  updatedAt: "2026-06-07T00:00:00.000Z",
};

test("task activity payloads do not include raw task content", async () => {
  const calls = [];
  const {
    recordTaskCreatedActivity,
    recordTaskDeletedActivity,
    recordTaskUpdatedActivity,
  } = loadActivityRecording(calls);

  await recordTaskCreatedActivity(task, { accessToken: "token" });
  await recordTaskUpdatedActivity(
    { ...task, status: "done" },
    { previousStatus: "todo" },
    { accessToken: "token" },
  );
  await recordTaskDeletedActivity(task, { accessToken: "token" });

  assert.equal(calls.length, 3);

  for (const call of calls) {
    const serialized = JSON.stringify(call);

    assert.equal(serialized.includes(task.title), false);
    assert.equal(serialized.includes(task.description), false);
    assert.equal(serialized.includes(task.workspaceId), false);
    assert.match(call.title, /^Task (created|updated|deleted)$/);
    assert.match(call.description, /^(Created|Updated|Deleted) a task$/);
  }

  assert.deepEqual(calls[0].metadata, {
    has_due_date: true,
    priority: "critical",
    status: "todo",
  });
});

test("note activity payloads do not include raw note content", async () => {
  const calls = [];
  const {
    recordNoteCreatedActivity,
    recordNoteDeletedActivity,
    recordNoteUpdatedActivity,
  } = loadActivityRecording(calls);

  await recordNoteCreatedActivity(note, { accessToken: "token" });
  await recordNoteUpdatedActivity(note, { accessToken: "token" });
  await recordNoteDeletedActivity(note, { accessToken: "token" });

  assert.equal(calls.length, 3);

  for (const call of calls) {
    const serialized = JSON.stringify(call);

    assert.equal(serialized.includes(note.title), false);
    assert.equal(serialized.includes(note.content), false);
    assert.match(call.title, /^Note (created|updated|deleted)$/);
    assert.match(call.description, /^(Created|Updated|Deleted) a note$/);
    assert.deepEqual(call.metadata, { note_type: "note" });
  }
});

test("capture activity route does not copy capture content into activity descriptions", () => {
  const routePath = resolve(projectRoot, "src/app/api/captures/route.ts");
  const source = readFileSync(routePath, "utf8");

  assert.equal(source.includes("description: capture.content"), false);
  assert.match(source, /description:\s*"Captured an inbox item"/);
});
