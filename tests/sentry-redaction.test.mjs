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

function loadSentryRedaction() {
  const sourcePath = resolve(
    projectRoot,
    "src/lib/monitoring/sentry-redaction.ts",
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
  const testModule = { exports: {} };

  vm.runInNewContext(transpiled.outputText, {
    Array,
    Boolean,
    JSON,
    Object,
    RegExp,
    Set,
    String,
    URL,
    exports: testModule.exports,
    module: testModule,
    require,
  });

  return testModule.exports;
}

const { sanitizeSentryBreadcrumb, sanitizeSentryEvent } = loadSentryRedaction();

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("redacts authorization headers", () => {
  const event = sanitizeSentryEvent({
    request: {
      headers: {
        Authorization: "Bearer secret-token",
        "x-operation": "fetch_tasks",
      },
      method: "GET",
      route: "/api/tasks",
    },
  });

  assert.deepEqual(plain(event), {
    request: {
      headers: {
        Authorization: "[redacted]",
        "x-operation": "fetch_tasks",
      },
      method: "GET",
      route: "/api/tasks",
    },
  });
});

test("redacts cookie headers", () => {
  const event = sanitizeSentryEvent({
    request: {
      headers: {
        cookie: "sb-auth-token=secret",
        "set-cookie": "session=secret",
      },
    },
  });

  assert.deepEqual(plain(event), {
    request: {
      headers: {
        cookie: "[redacted]",
        "set-cookie": "[redacted]",
      },
    },
  });
});

test("removes access and refresh tokens", () => {
  const event = sanitizeSentryEvent({
    extra: {
      access_token: "access",
      nested: {
        refreshToken: "refresh",
      },
      operation: "login",
    },
  });

  assert.deepEqual(plain(event), {
    extra: {
      access_token: "[removed]",
      nested: {
        refreshToken: "[removed]",
      },
      operation: "login",
    },
  });
});

test("removes Supabase session-like objects", () => {
  const event = sanitizeSentryEvent({
    extra: {
      supabaseSession: {
        access_token: "access",
        refresh_token: "refresh",
        user: { email: "user@example.com", id: "user-id" },
      },
    },
  });

  assert.deepEqual(plain(event), {
    extra: {
      supabaseSession: "[removed]",
    },
  });
});

test("removes email and password fields", () => {
  const event = sanitizeSentryEvent({
    user: {
      email: "user@example.com",
      id: "user-id",
    },
    extra: {
      email: "user@example.com",
      password: "secret-password",
    },
  });

  assert.deepEqual(plain(event), {
    extra: {
      email: "[removed]",
      password: "[removed]",
    },
    user: {
      id: "user-id",
    },
  });
});

test("removes request and response bodies", () => {
  const event = sanitizeSentryEvent({
    request: {
      body: {
        title: "private task",
      },
      method: "POST",
    },
    extra: {
      requestBody: { content: "private capture" },
      responseBody: { note_content: "private note" },
    },
  });

  assert.deepEqual(plain(event), {
    extra: {
      requestBody: "[removed]",
      responseBody: "[removed]",
    },
    request: {
      body: "[removed]",
      method: "POST",
    },
  });
});

test("removes task, note, capture, and search content", () => {
  const event = sanitizeSentryEvent({
    extra: {
      capture_content: "private capture",
      note_content: "private note",
      note_title: "private note title",
      search_query: "private search",
      searchableText: "private indexed text",
      task_description: "private task description",
      task_title: "private task",
    },
  });

  assert.deepEqual(plain(event), {
    extra: {
      capture_content: "[removed]",
      note_content: "[removed]",
      note_title: "[removed]",
      search_query: "[removed]",
      searchableText: "[removed]",
      task_description: "[removed]",
      task_title: "[removed]",
    },
  });
});

test("allows safe operational fields", () => {
  const event = sanitizeSentryEvent({
    metadata: {
      operation: "fetch",
      route: "/api/tasks",
      safe_error_code: "api_500",
      status: 500,
      table: "tasks",
    },
  });

  assert.deepEqual(plain(event), {
    metadata: {
      operation: "fetch",
      route: "/api/tasks",
      safe_error_code: "api_500",
      status: 500,
      table: "tasks",
    },
  });
});

test("redaction does not throw on null, arrays, or nested objects", () => {
  assert.doesNotThrow(() => sanitizeSentryEvent(null));
  assert.doesNotThrow(() =>
    sanitizeSentryEvent({
      extra: {
        nested: [
          null,
          {
            body: {
              content: "private",
            },
          },
        ],
      },
    }),
  );
});

test("drops console breadcrumbs and sensitive breadcrumbs", () => {
  assert.equal(
    sanitizeSentryBreadcrumb({
      category: "console",
      message: "debug",
    }),
    null,
  );
  assert.equal(
    sanitizeSentryBreadcrumb({
      data: {
        Authorization: "Bearer secret",
      },
      message: "request failed",
    }),
    null,
  );
});
