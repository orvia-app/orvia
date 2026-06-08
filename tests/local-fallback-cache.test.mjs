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

function loadModule(relativePath, stubs = {}) {
  const sourcePath = resolve(projectRoot, relativePath);
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
    if (id in stubs) {
      return stubs[id];
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

const sharedStubs = {
  "@/lib/local-fallback-cache": {
    getUserScopedFallbackIds: () => [],
    getUserScopedHiddenIds: () => [],
    markUserScopedFallbackId: () => {},
    markUserScopedHiddenId: () => {},
    unmarkUserScopedFallbackId: () => {},
  },
  "@/lib/supabase": {},
  "@/lib/user-scoped-cache": {
    readUserScopedList: () => [],
    writeUserScopedList: () => {},
  },
};

const tasksApi = loadModule("src/lib/tasks-api.ts", {
  ...sharedStubs,
  "@/lib/tasks": {
    getTasks: () => [],
    isTask: () => true,
    TASK_PRIORITIES: ["low", "medium", "high", "critical"],
    TASK_STATUSES: ["todo", "in-progress", "done"],
  },
});

const notesApi = loadModule("src/lib/notes-api.ts", {
  ...sharedStubs,
  "@/lib/notes": {
    createNote: () => ({}),
    getNotes: () => [],
    isNote: () => true,
    NOTE_TYPES: ["note", "idea", "book", "course", "link"],
  },
});

const capturesApi = loadModule("src/lib/captures-api.ts", {
  ...sharedStubs,
  "@/lib/quick-captures": {
    createQuickCapture: () => ({}),
    getQuickCaptures: () => [],
    isQuickCapture: () => true,
  },
});

const i18n = loadModule("src/lib/i18n.ts");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("cloud task refresh preserves explicitly marked local fallback tasks", () => {
  const merged = tasksApi.mergeApiTasksWithLocalFallbackTasks(
    [
      { id: "cloud-1", title: "Cloud task updated" },
      { id: "cloud-2", title: "Cloud task new" },
    ],
    [
      { id: "cloud-1", title: "Cached stale task" },
      { id: "fallback-1", title: "Device-only task" },
      { id: "stale-1", title: "Unmarked stale task" },
    ],
    ["fallback-1"],
  );

  assert.deepEqual(
    plain(merged.map((task) => task.id)),
    ["fallback-1", "cloud-1", "cloud-2"],
  );
  assert.equal(merged.find((task) => task.id === "cloud-1").title, "Cloud task updated");
});

test("cloud note refresh preserves explicitly marked local fallback notes", () => {
  const merged = notesApi.mergeApiNotesWithLocalFallbackNotes(
    [
      { id: "cloud-1", title: "Cloud note updated" },
      { id: "cloud-2", title: "Cloud note new" },
    ],
    [
      { id: "cloud-1", title: "Cached stale note" },
      { id: "fallback-1", title: "Device-only note" },
      { id: "stale-1", title: "Unmarked stale note" },
    ],
    ["fallback-1"],
  );

  assert.deepEqual(
    plain(merged.map((note) => note.id)),
    ["fallback-1", "cloud-1", "cloud-2"],
  );
  assert.equal(merged.find((note) => note.id === "cloud-1").title, "Cloud note updated");
});

test("cloud capture refresh preserves explicitly marked local fallback captures", () => {
  const merged = capturesApi.mergeApiCapturesWithLocalFallbackCaptures(
    [
      { id: "cloud-1", title: "Cloud capture updated" },
      { id: "cloud-2", title: "Cloud capture new" },
    ],
    [
      { id: "cloud-1", title: "Cached stale capture" },
      { id: "fallback-1", title: "Device-only capture" },
      { id: "stale-1", title: "Unmarked stale capture" },
    ],
    ["fallback-1"],
  );

  assert.deepEqual(
    plain(merged.map((capture) => capture.id)),
    ["fallback-1", "cloud-1", "cloud-2"],
  );
  assert.equal(
    merged.find((capture) => capture.id === "cloud-1").title,
    "Cloud capture updated",
  );
});

test("local fallback copy exists in English and Ukrainian", () => {
  assert.equal(i18n.translations.en["source.localFallback"], "Device only");
  assert.equal(i18n.translations.ua["source.localFallback"], "Лише на пристрої");
  assert.match(
    i18n.translations.en["tasks.deviceOnlyWarning"],
    /saved on this device only/,
  );
  assert.match(
    i18n.translations.ua["tasks.deviceOnlyWarning"],
    /лише на цьому пристрої/,
  );
});
