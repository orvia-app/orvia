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
  const storage = new Map();

  function safeReadStorage(key, fallback) {
    return storage.has(key) ? storage.get(key) : fallback;
  }

  function safeWriteStorage(key, value) {
    storage.set(key, value);
  }

  function stubbedRequire(id) {
    if (id === "@/lib/storage") {
      return {
        safeReadStorage,
        safeWriteStorage,
        STORAGE_KEYS: {
          betaAnalyticsAnonymousId: "personal-os.beta-analytics.anonymous-id",
          betaAnalyticsEvents: "personal-os.beta-analytics.events",
          language: "personal-os.language",
        },
      };
    }

    return require(id);
  }
  const testWindow = {
    location: {
      hash: "",
      search: "",
    },
  };

  vm.runInNewContext(transpiled.outputText, {
    console,
    crypto: {
      randomUUID: () => `uuid-${Math.random().toString(36).slice(2)}`,
    },
    Date,
    exports: module.exports,
    module,
    Math,
    require: stubbedRequire,
    Set,
    URLSearchParams,
    window: testWindow,
  });

  return { ...module.exports, __testWindow: testWindow };
}

const {
  __testWindow,
  analyticsEventNames,
  betaAnalyticsEventNames,
  clearStoredBetaAnalyticsEventsForTests,
  getStoredBetaAnalyticsEvents,
  isAnalyticsEventName,
  sanitizeAnalyticsMetadata,
  trackBetaEvent,
  trackEmailConfirmedFromUrl,
  trackEvent,
  trackFirstTaskCreated,
} = loadAnalytics();

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("beta-critical event names are accepted", () => {
  assert.ok(isAnalyticsEventName("landing_view"));
  assert.ok(isAnalyticsEventName("email_confirmed"));
  assert.ok(isAnalyticsEventName("first_task_created"));
  assert.ok(isAnalyticsEventName("quick_capture_created"));
  assert.ok(isAnalyticsEventName("task_completed"));
  assert.ok(isAnalyticsEventName("error_seen"));
  assert.equal(isAnalyticsEventName("task_title_viewed"), false);
  assert.equal(analyticsEventNames.includes("search_used"), true);
  assert.deepEqual(plain(betaAnalyticsEventNames), [
    "landing_view",
    "signup_started",
    "signup_completed",
    "email_confirmed",
    "login_completed",
    "first_task_created",
  ]);
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

test("beta analytics stores only the approved event schema", () => {
  clearStoredBetaAnalyticsEventsForTests();

  trackBetaEvent("landing_view", {
    authenticated: false,
    locale: "ua",
    timestamp: "2026-06-12T10:00:00.000Z",
  });

  assert.deepEqual(
    Object.keys(getStoredBetaAnalyticsEvents()[0]).sort(),
    [
      "anonymousId",
      "authenticated",
      "eventName",
      "locale",
      "sessionId",
      "timestamp",
    ],
  );
  assert.deepEqual(plain(getStoredBetaAnalyticsEvents()[0]), {
    anonymousId: getStoredBetaAnalyticsEvents()[0].anonymousId,
    authenticated: false,
    eventName: "landing_view",
    locale: "ua",
    sessionId: getStoredBetaAnalyticsEvents()[0].sessionId,
    timestamp: "2026-06-12T10:00:00.000Z",
  });
});

test("beta analytics never stores supplied personal content metadata", () => {
  clearStoredBetaAnalyticsEventsForTests();

  trackBetaEvent("signup_started", {
    authenticated: false,
    locale: "en",
    timestamp: "2026-06-12T10:00:00.000Z",
    email: "user@example.com",
    task_title: "private task",
    note_content: "private note",
    capture_content: "private capture",
    search_query: "private search",
  });

  const serialized = JSON.stringify(getStoredBetaAnalyticsEvents());

  assert.equal(serialized.includes("user@example.com"), false);
  assert.equal(serialized.includes("private task"), false);
  assert.equal(serialized.includes("private note"), false);
  assert.equal(serialized.includes("private capture"), false);
  assert.equal(serialized.includes("private search"), false);
});

test("first task and email confirmation events are recorded once", () => {
  clearStoredBetaAnalyticsEventsForTests();

  trackFirstTaskCreated({
    authenticated: true,
    locale: "en",
    timestamp: "2026-06-12T10:00:00.000Z",
  });
  trackFirstTaskCreated({
    authenticated: true,
    locale: "en",
    timestamp: "2026-06-12T10:01:00.000Z",
  });

  __testWindow.location.hash = "#access_token=redacted&type=signup";
  __testWindow.location.search = "";
  trackEmailConfirmedFromUrl({
    authenticated: true,
    locale: "en",
    timestamp: "2026-06-12T10:02:00.000Z",
  });
  trackEmailConfirmedFromUrl({
    authenticated: true,
    locale: "en",
    timestamp: "2026-06-12T10:03:00.000Z",
  });

  assert.deepEqual(
    plain(getStoredBetaAnalyticsEvents().map((event) => event.eventName)),
    ["first_task_created", "email_confirmed"],
  );
});
