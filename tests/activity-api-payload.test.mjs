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

function loadActivityPayload() {
  const sourcePath = resolve(
    projectRoot,
    "src/server/api/activity-payload.ts",
  );
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

const { parseCreateActivityPayload, sanitizeActivityMetadata } =
  loadActivityPayload();

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("activity API payload ignores raw client title and description", () => {
  const parsed = parseCreateActivityPayload({
    description: "Private task description that must not be stored",
    entityId: "11111111-1111-4111-8111-111111111111",
    entityType: "note",
    metadata: {
      has_due_date: true,
      priority: "critical",
      raw_task_title: "Private task title",
      status: "todo",
    },
    title: "Private task title",
    type: "task_created",
  });

  assert.equal(parsed.ok, true);
  assert.equal(parsed.payload.title, "Task created");
  assert.equal(parsed.payload.description, "Created a task");
  assert.equal(parsed.payload.entity_type, "task");

  const serialized = JSON.stringify(parsed.payload);

  assert.equal(serialized.includes("Private task title"), false);
  assert.equal(serialized.includes("Private task description"), false);
  assert.deepEqual(plain(parsed.payload.metadata), {
    has_due_date: true,
    priority: "critical",
    status: "todo",
  });
});

test("activity API payload removes unsafe metadata keys and values", () => {
  const metadata = sanitizeActivityMetadata({
    accessToken: "secret",
    errorCount: 2,
    has_due_date: true,
    importedNotes: 1,
    importedTasks: 3,
    note_content: "Private note body",
    note_type: "idea",
    operation: "local_import",
    outcome: "task",
    priority: "high",
    raw_error: { message: "private stack" },
    safe_error_code: "api_500",
    search_query: "private query",
    session: "secret-session",
    skippedNotes: 0,
    skippedTasks: 1,
    source: "inbox",
    status: "done",
    storage_mode: "account",
    unsafe_array: ["private"],
  });

  assert.deepEqual(plain(metadata), {
    errorCount: 2,
    has_due_date: true,
    importedNotes: 1,
    importedTasks: 3,
    note_type: "idea",
    operation: "local_import",
    outcome: "task",
    priority: "high",
    safe_error_code: "api_500",
    skippedNotes: 0,
    skippedTasks: 1,
    source: "inbox",
    status: "done",
    storage_mode: "account",
  });
});

test("activity API payload rejects unsupported activity types", () => {
  const parsed = parseCreateActivityPayload({
    metadata: {},
    type: "task_title_recorded",
  });

  assert.equal(parsed.ok, false);
  assert.match(parsed.error, /supported activity type/);
});

test("activity API payload generates safe inbox processed descriptions", () => {
  const archived = parseCreateActivityPayload({
    metadata: {
      outcome: "archived",
      source: "inbox",
    },
    title: "Archive private capture",
    type: "inbox_processed",
  });
  const processed = parseCreateActivityPayload({
    metadata: {
      outcome: "note",
      source: "inbox",
    },
    title: "Convert private capture",
    type: "inbox_processed",
  });

  assert.equal(archived.ok, true);
  assert.equal(processed.ok, true);
  assert.equal(archived.payload.title, "Inbox item processed");
  assert.equal(archived.payload.description, "Archived an inbox item");
  assert.equal(processed.payload.description, "Processed an inbox item");
});
