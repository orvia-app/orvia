import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");
const key = "sb-beta-auth-token";

function harness(response, stored = JSON.stringify({
  access_token: "test-access", refresh_token: "test-refresh", expires_at: 1,
  user: { id: "test-user" },
}), status = 400) {
  const entries = { [key]: stored, [`${key}-code-verifier`]: "test-verifier",
    "personal-os.tasks": "keep", "sb-other-auth-token": "keep",
    "supabase.auth.token": "keep", [`${key}-unrelated`]: "keep" };
  const storage = {
    getItem: (k) => entries[k] ?? null,
    setItem: (k, v) => { entries[k] = v; },
    removeItem: (k) => { delete entries[k]; },
  };
  const localStorage = new Proxy(storage, {
    ownKeys: () => Object.keys(entries),
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  });
  const logs = [];
  let requests = 0;
  const modules = new Map();
  function load(name) {
    if (modules.has(name)) return modules.get(name);
    const source = readFileSync(`src/lib/supabase/${name}.ts`, "utf8");
    const module = { exports: {} };
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    } }).outputText, {
      module, exports: module.exports, URL, Error, window: { localStorage },
      console: { error: (...args) => logs.push(args) },
      require: (id) => {
        if (id.endsWith("/config")) return {
          requireSupabaseBrowserConfig: () => ({ url: "https://beta.supabase.co", anonKey: "test-anon" }),
          getSupabaseBrowserReadiness: () => ({ ready: true, config: { url: "https://beta.supabase.co" } }),
        };
        if (id.startsWith("@/lib/supabase/")) return load(id.split("/").at(-1));
        if (id === "@supabase/supabase-js") return { createClient: (url, anon, options) => {
          assert.equal(options.auth.autoRefreshToken, true);
          return createClient(url, anon, { ...options,
            auth: { ...options.auth, storage },
            global: { fetch: async () => {
              requests++;
              return new Response(JSON.stringify(response), { status,
                headers: { "Content-Type": "application/json" } });
            } },
          });
        } };
        return require(id);
      },
    });
    modules.set(name, module.exports);
    return module.exports;
  }
  return { auth: load("auth"), entries, logs, requests: () => requests };
}

for (const message of ["Invalid Refresh Token: Refresh Token Not Found", "Invalid Refresh Token"]) {
  test(`real SDK recovers quietly and once: ${message}`, async () => {
    const h = harness({ code: "refresh_token_not_found", msg: message });
    const sdkLogs = [];
    const original = console.error;
    console.error = (...args) => sdkLogs.push(args);
    try {
      const first = h.auth.loadSupabaseBrowserAuthSession();
      assert.equal(first, h.auth.loadSupabaseBrowserAuthSession());
      const result = await first;
      assert.equal(result.ok, true);
      assert.equal(result.recovered, true);

      assert.equal(result.session, null);
      assert.equal(h.entries[key], undefined);
      assert.equal(h.entries[`${key}-code-verifier`], undefined);
      for (const k of ["personal-os.tasks", "sb-other-auth-token", "supabase.auth.token", `${key}-unrelated`]) {
        assert.equal(h.entries[k], "keep");
      }
      for (let i = 0; i < 3; i++) {
        assert.equal((await h.auth.loadSupabaseBrowserAuthSession()).session, null);
      }
      assert.equal(h.requests(), 1);
      assert.equal(h.logs.length, 0);
      assert.equal(sdkLogs.length, 0);
    } finally { console.error = original; }
  });
}

test("unexpected SDK errors remain observable", async () => {
  const h = harness({ msg: "Unexpected auth failure" });
  const logs = [];
  const original = console.error;
  console.error = (...args) => logs.push(args);
  try {
    await h.auth.loadSupabaseBrowserAuthSession();
    assert.ok(logs.length > 0);
    assert.equal(h.requests(), 1);
  } finally { console.error = original; }
});

test("unexpected returned and thrown errors reach sanitized diagnostics without retries", async () => {
  for (const throws of [false, true]) {
    const h = harness({});
    let calls = 0;
    const client = { auth: {
      initialize: async () => ({ error: null }),
      getSession: async () => {
        calls++;
        const error = new Error("sensitive response");
        if (throws) throw error;
        return { error, data: { session: null } };
      },
    } };
    const result = await h.auth.loadSupabaseBrowserAuthSession(client);
    assert.equal(result.ok, false);
    assert.equal(h.logs.length, 1);
    assert.equal(JSON.stringify(h.logs).includes("sensitive"), false);
    assert.equal(calls, 1);
  }
});

for (const stored of ["{broken", JSON.stringify({ refresh_token: "missing-fields" }),
  JSON.stringify({ access_token: "test", refresh_token: "test", expires_at: 4102444800, user: {} })]) {
  test(`corrupt local session is cleared before SDK initialization: ${stored}`, async () => {
    const h = harness({}, stored);
    const result = await h.auth.loadSupabaseBrowserAuthSession();
    assert.equal(result.ok, true);
    assert.equal(result.session, null);
    assert.equal(h.entries[key], undefined);
    assert.equal(h.entries["personal-os.tasks"], "keep");
    assert.equal(h.requests(), 0);
  });
}

test("valid stored session survives initialization and refresh reads", async () => {
  const h = harness({}, JSON.stringify({ access_token: "test-access",
    refresh_token: "test-refresh", expires_at: 4102444800, user: { id: "test-user" } }));
  const result = await h.auth.loadSupabaseBrowserAuthSession();
  assert.equal(result.ok, true);
  assert.equal(result.recovered, false);
  assert.equal(result.session.user.id, "test-user");
  assert.ok(h.entries[key]);
  assert.equal(h.requests(), 0);
});

test("returned or thrown missing-session errors recover once without recursive retries", async () => {
  for (const throws of [false, true]) {
    const h = harness({});
    let reads = 0;
    let signOuts = 0;
    const client = { auth: {
      initialize: async () => ({ error: null }),
      getSession: async () => {
        reads++;
        const error = { name: "AuthSessionMissingError", message: "Auth session missing!" };
        if (throws) throw error;
        return { error, data: { session: null } };
      },
      signOut: async ({ scope }) => {
        assert.equal(scope, "local");
        signOuts++;
        return { error: { code: "session_not_found" } };
      },
    } };
    const result = await h.auth.loadSupabaseBrowserAuthSession(client);
    assert.equal(result.ok, true);
    assert.equal(result.recovered, true);
    assert.equal(result.session, null);
    assert.equal(reads, 1);
    assert.equal(signOuts, 1);
    assert.equal(h.entries[key], undefined);
    assert.equal(h.logs.length, 0);
  }
});

test("unexpected cleanup failures remain observable and scoped storage is still removed", async () => {
  const h = harness({});
  await h.auth.clearSupabaseBrowserAuthSession({ auth: {
    signOut: async () => { throw new Error("unexpected cleanup failure"); },
  } });
  assert.equal(h.logs.length, 1);
  assert.equal(h.entries[key], undefined);
  assert.equal(h.entries["personal-os.tasks"], "keep");
});

test("SDK initial-session listener independently handles a stale token quietly", async () => {
  const { AuthClient } = require("@supabase/auth-js");
  let value = JSON.stringify({ access_token: "test", refresh_token: "stale",
    expires_at: 1, user: { id: "test-user" } });
  let requests = 0;
  const client = new AuthClient({ url: "https://beta.supabase.co/auth/v1",
    autoRefreshToken: false, skipAutoInitialize: true, detectSessionInUrl: false,
    storage: { getItem: () => value, setItem: (_key, v) => { value = v; },
      removeItem: () => { value = null; } },
    fetch: async () => {
      requests++;
      return new Response(JSON.stringify({ msg: "Invalid Refresh Token: Refresh Token Not Found" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    },
  });
  const original = console.error;
  const logs = [];
  console.error = (...args) => logs.push(args);
  let subscription;
  try {
    await new Promise((resolve) => {
      subscription = client.onAuthStateChange((event, session) => {
        if (event === "INITIAL_SESSION") {
          assert.equal(session, null);
          resolve();
        }
      }).data.subscription;
    });
    await new Promise(setImmediate);
    assert.equal(requests, 1);
    assert.equal(value, null);
    assert.equal(logs.length, 0);
  } finally {
    subscription?.unsubscribe();
    console.error = original;
  }
});


test("normal expired session refresh succeeds and stays authenticated", async () => {
  const h = harness({ access_token: "new-access", refresh_token: "new-refresh",
    expires_in: 3600, token_type: "bearer", user: { id: "test-user" } }, undefined, 200);
  const result = await h.auth.loadSupabaseBrowserAuthSession();
  assert.equal(result.ok, true);
  assert.equal(result.recovered, false);
  assert.equal(result.session.access_token, "new-access");
  assert.ok(h.entries[key]);
  assert.equal(h.requests(), 1);
  assert.equal(h.logs.length, 0);
});
