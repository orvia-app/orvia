import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function load(path, dependencies = {}) {
  const filename = resolve(root, path);
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  const loaded = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    Date, Intl, RangeError, TypeError, exports: loaded.exports, module: loaded,
    require: (id) => dependencies[id] ?? {},
  });
  return loaded.exports;
}

const domain = load("src/core/schedule/domain.ts");
const parser = load("src/lib/calendar-projection.ts", {
  "@/core/schedule/domain": domain,
});
const ownerId = "owner-a";
const zone = "Europe/Kyiv";
const interval = {
  start: "2026-10-02T09:00:00.000Z",
  end: "2026-10-02T10:00:00.000Z",
};
const base = {
  source: "task", kind: "planned-task", ownerId, sourceId: "task-1",
  title: "Task", busy: true, intelligenceEligible: false,
  sourceState: "unverified", interval,
};
const projection = (items) => ({
  range: interval,
  planningTimezone: zone,
  completeness: "incomplete",
  items,
  unplacedTasks: [],
  sources: {
    tasks: { state: "unverified" },
    events: { state: "unverified" },
  },
});

test("Calendar projection parser accepts normalized block and legacy Task identities", () => {
  const value = projection([
    { ...base, key: "task-block:block-1", blockId: "block-1" },
    { ...base, sourceId: "task-2", key: "task:task-2" },
  ]);
  assert.ok(parser.parseCalendarProjection(value, ownerId, zone));
});

test("Calendar projection parser rejects mismatched block and owner identities", () => {
  assert.equal(parser.parseCalendarProjection(projection([
    { ...base, key: "task-block:different", blockId: "block-1" },
  ]), ownerId, zone), null);
  assert.equal(parser.parseCalendarProjection(projection([
    { ...base, key: "task-block:block-1", blockId: "block-1", ownerId: "owner-b" },
  ]), ownerId, zone), null);
});
