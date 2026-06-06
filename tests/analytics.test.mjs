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

function loadAnalytics() {
  const sourcePath = resolve(projectRoot, "src/lib/analytics.ts");
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
    Set,
  });

  return module.exports;
}

const {
  analyticsEventNames,
  isAnalyticsEventName,
  sanitizeAnalyticsMetadata,
  trackEvent,
} = loadAnalytics();

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("beta-critical event names are accepted", () => {
  assert.ok(isAnalyticsEventName("quick_capture_created"));
  assert.ok(isAnalyticsEventName("task_completed"));
  assert.ok(isAnalyticsEventName("error_seen"));
  assert.equal(isAnalyticsEventName("task_title_viewed"), false);
  assert.equal(analyticsEventNames.includes("search_used"), true);
});

test("unsafe metadata keys are ignored", () => {
  const sanitized = sanitizeAnalyticsMetadata({
    accessToken: "token",
    auth_state: "signed_in",
    email: "user@example.com",
    note_content: "private note",
    raw_error: { message: "secret" },
    route: "/app/inbox",
    search_query: "private query",
    session: "session",
    task_title: "private task",
  });

  assert.deepEqual(plain(sanitized), {
    auth_state: "signed_in",
    route: "/app/inbox",
  });
});

test("metadata values must have safe primitive types", () => {
  const sanitized = sanitizeAnalyticsMetadata({
    has_due_date: true,
    has_top_priority: "yes",
    result_count_bucket: "1-5",
    route: ["/app/search"],
  });

  assert.deepEqual(plain(sanitized), {
    has_due_date: true,
    result_count_bucket: "1-5",
  });
});

test("analytics helper never throws", () => {
  assert.doesNotThrow(() => trackEvent("landing_viewed"));
  assert.doesNotThrow(() =>
    trackEvent("error_seen", {
      area: "api",
      operation: "fetch",
      safe_error_code: "api_500",
    }),
  );
  assert.doesNotThrow(() => sanitizeAnalyticsMetadata(null));
  assert.doesNotThrow(() => sanitizeAnalyticsMetadata("not metadata"));
});
