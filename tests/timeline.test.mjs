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

function loadI18n() {
  const sourcePath = resolve(projectRoot, "src/lib/i18n.ts");
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

function loadTimeline(i18nModule) {
  const sourcePath = resolve(projectRoot, "src/lib/timeline.ts");
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
    if (id === "@/lib/i18n") {
      return i18nModule;
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

const i18n = loadI18n();
const { createTimelineEventsFromActivities } = loadTimeline(i18n);

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function translate(locale) {
  return (key) => i18n.translations[locale][key];
}

function activity(overrides) {
  return {
    createdAt: "2026-06-08T10:00:00.000Z",
    description: "Private stored description",
    entityId: null,
    entityType: "system",
    id: "activity-id",
    metadata: {},
    occurredAt: "2026-06-08T10:00:00.000Z",
    title: "Private stored title",
    type: "system_event",
    ...overrides,
  };
}

test("known activity type returns English system copy by default", () => {
  const [event] = createTimelineEventsFromActivities([
    activity({ type: "task_created" }),
  ]);

  assert.equal(event.title, "Task created");
  assert.equal(event.description, "Created a task");
});

test("known activity type returns Ukrainian system copy", () => {
  const [event] = createTimelineEventsFromActivities(
    [activity({ type: "task_completed" })],
    translate("ua"),
  );

  assert.equal(event.title, "Завдання виконано");
  assert.equal(event.description, "Завдання позначено як виконане");
});

test("inbox processed outcomes return safe localized text", () => {
  const events = createTimelineEventsFromActivities(
    [
      activity({
        id: "task-outcome",
        metadata: { outcome: "task", raw: "Private capture" },
        type: "inbox_processed",
      }),
      activity({
        id: "note-outcome",
        metadata: { outcome: "note", raw: "Private capture" },
        type: "inbox_processed",
      }),
      activity({
        id: "archive-outcome",
        metadata: { outcome: "archived", raw: "Private capture" },
        type: "inbox_processed",
      }),
    ],
    translate("ua"),
  );

  assert.deepEqual(
    plain(
    events.map((event) => event.description),
    ),
    [
      "Запис перетворено на завдання",
      "Запис перетворено на нотатку",
      "Запис у Вхідних архівовано",
    ],
  );
  assert.equal(JSON.stringify(events).includes("Private capture"), false);
});

test("unknown activity type falls back safely to stored copy", () => {
  const [event] = createTimelineEventsFromActivities(
    [
      activity({
        description: "Stored future description",
        title: "Stored future title",
        type: "future_event",
      }),
    ],
    translate("ua"),
  );

  assert.equal(event.title, "Stored future title");
  assert.equal(event.description, "Stored future description");
});

test("known activity type ignores raw stored user content", () => {
  const [event] = createTimelineEventsFromActivities(
    [
      activity({
        description: "Private note body",
        title: "Private note title",
        type: "note_created",
      }),
    ],
    translate("en"),
  );

  const serialized = JSON.stringify(event);

  assert.equal(serialized.includes("Private note title"), false);
  assert.equal(serialized.includes("Private note body"), false);
  assert.equal(event.title, "Note created");
  assert.equal(event.description, "Created a note");
});
