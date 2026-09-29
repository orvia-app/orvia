import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createLoader } from "./helpers/load-typescript.mjs";

const plain = (value) => JSON.parse(JSON.stringify(value));
const valid = () => ({ id: randomUUID(), event_name: "landing_view", anonymous_id: randomUUID(), session_id: randomUUID(), locale: "en" });
function fixture({ user = null, error = null, rpcData = true, rpcError = null, throws = false } = {}) {
  const calls = [], logs = [];
  const load = createLoader({
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/server/supabase/auth": { createSupabaseServerAuthClient: () => ({ auth: { getUser: async () => ({ data: { user }, error }) } }) },
    "@/env/server": { readServerEnv: () => ({ ADMIN_EMAILS: " Owner@Example.com " }) },
    "@/lib/supabase": { getSupabaseServerClient: () => ({ rpc: async (...args) => { calls.push(args); if (throws) throw new Error("secret-provider-error"); return { data: rpcData, error: rpcError }; } }) },
  }, { console: { warn: (...args) => logs.push(args) } });
  const ingest = load("src/app/api/analytics/route.ts").POST;
  const admin = load("src/app/api/admin/analytics/route.ts").GET;
  function request(body = valid(), headers = {}) {
    return new Request("https://orvia.test/api/analytics", { method: "POST", headers: { origin: "https://orvia.test", "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  }
  return { ingest, admin, calls, request, logs, load };
}

test("valid anonymous event accepted with server-derived signed-out identity", async () => {
  const f = fixture(); const event = valid();
  assert.equal((await f.ingest(f.request(event))).status, 202);
  assert.deepEqual(plain(f.calls[0]), ["ingest_beta_analytics", { p_id: event.id, p_event_name: "landing_view", p_anonymous_id: event.anonymous_id, p_session_id: event.session_id, p_locale: "en", p_user_id: null }]);
});

test("unknown/server-owned names, metadata, sensitive content and spoofed identity are rejected before database access", async () => {
  const f = fixture();
  const invalid = [
    { event_name: "unknown" }, { event_name: "first_task_created" }, { event_name: "feedback_submitted" },
    { metadata: {} }, { user_id: randomUUID() }, { authenticated: true }, { email: "private@example.com" },
    { task_title: "secret" }, { note_content: "secret" }, { feedback: "secret" }, { access_token: "secret" },
    { created_at: new Date().toISOString() }, { locale: "<script>" }, { anonymous_id: "private@example.com" },
    { session_id: "https://example.com/?token=secret" },
  ];
  for (const extra of invalid) assert.equal((await f.ingest(f.request({ ...valid(), ...extra }))).status, 400);
  assert.equal(f.calls.length, 0);
});

test("actual streamed size, origin and content type are enforced", async () => {
  const f = fixture();
  assert.equal((await f.ingest(f.request({ padding: "x".repeat(2048) }))).status, 400);
  assert.equal((await f.ingest(f.request(valid(), { origin: "https://evil.test" }))).status, 403);
  assert.equal((await f.ingest(f.request(valid(), { "content-type": "text/plain" }))).status, 415);
  const req = new Request("https://orvia.test/api/analytics", { method: "POST", headers: { origin: "https://orvia.test", "content-type": "application/json" }, body: "{" });
  assert.equal((await f.ingest(req)).status, 400);
  assert.equal(f.calls.length, 0);
});

test("identity comes from verified Supabase user and confirmation requires evidence", async () => {
  const user = { id: randomUUID(), email: "ordinary@example.com", email_confirmed_at: "2026-09-25T00:00:00Z" };
  const f = fixture({ user });
  assert.equal((await f.ingest(f.request({ ...valid(), event_name: "email_confirmed" }, { authorization: "Bearer test-token" }))).status, 202);
  assert.equal(f.calls[0][1].p_user_id, user.id);
  assert.equal(JSON.stringify(f.calls).includes(user.email), false);
  const unconfirmed = fixture({ user: { ...user, email_confirmed_at: null } });
  assert.equal((await unconfirmed.ingest(unconfirmed.request({ ...valid(), event_name: "email_confirmed" }, { authorization: "Bearer test-token" }))).status, 400);
  const anonymous = fixture();
  assert.equal((await anonymous.ingest(anonymous.request({ ...valid(), event_name: "login_completed" }))).status, 401);
  assert.equal((await anonymous.ingest(anonymous.request(valid(), { authorization: "Bearer invalid" }))).status, 401);
  assert.equal(anonymous.calls.length, 0);
});

test("ingestion failure returns bounded generic response without leaking raw errors", async () => {
  for (const options of [{ rpcError: { message: "secret-provider-error" } }, { throws: true }]) {
    const f = fixture(options); const response = await f.ingest(f.request());
    assert.equal(response.status, 503);
    assert.equal(JSON.stringify([await response.json(), f.logs]).includes("secret-provider-error"), false);
  }
  const limited = fixture({ rpcData: false });
  assert.equal((await limited.ingest(limited.request())).status, 429);
});

const report = {
  counts: Object.fromEntries(["landing_view", "signup_started", "signup_completed", "email_confirmed", "login_completed", "first_task_created", "feedback_submitted"].map((name) => [name, 0])),
  daily: [{ date: "2026-09-25", count: 0 }],
  conversions: { signup: { numerator: 0, denominator: 0 }, activation: { numerator: 0, denominator: 0 }, feedback: { numerator: 0, denominator: 0 } },
};
test("admin endpoint reuses real admin authorization: unauthenticated 401, ordinary 403, allowlisted 200", async () => {
  for (const [user, expected] of [[null, 401], [{ id: randomUUID(), email: "other@example.com" }, 403], [{ id: randomUUID(), email: "owner@example.com" }, 200]]) {
    const f = fixture({ user, rpcData: { ...report, secret: "must-not-forward" } });
    const response = await f.admin(new Request("https://orvia.test/api/admin/analytics?days=7", { headers: user ? { authorization: "Bearer verified" } : {} }));
    assert.equal(response.status, expected);
    assert.ok(response.headers.get("cache-control").includes("no-store"));
    assert.equal(f.calls.length, expected === 200 ? 1 : 0);
    assert.equal(JSON.stringify(await response.json()).includes("must-not-forward"), false);
  }
});
test("admin accepts only bounded periods; zero denominator has no percentage", async () => {
  const f = fixture({ user: { id: randomUUID(), email: "owner@example.com" }, rpcData: report });
  assert.equal((await f.admin(new Request("https://orvia.test/api/admin/analytics?days=9999", { headers: { authorization: "Bearer verified" } }))).status, 400);
  assert.equal(f.calls.length, 0);
  const contract = f.load("src/lib/analytics-contract.ts");
  assert.equal(contract.conversionPercent(0, 0), null);
  assert.equal(contract.conversionPercent(1, 4), 25);
  assert.equal(contract.parseAnalyticsReport({ ...report, counts: {} }), null);
  assert.equal(contract.parseAnalyticsReport({ ...report, conversions: { ...report.conversions, signup: { numerator: 2, denominator: 1 } } }), null);
});

test("browser failures never reject product flow, tokens stay in transport, and refresh reuses random IDs", async () => {
  const storage = new Map(), sent = [];
  const stub = { safeReadStorage: (key, fallback) => storage.get(key) ?? fallback, safeWriteStorage: (key, value) => storage.set(key, value), STORAGE_KEYS: { betaAnalyticsAnonymousId: "anonymous", betaAnalyticsSession: "session", betaAnalyticsEvents: "events", language: "language" } };
  const loadBrowser = () => {
    const load = createLoader({ "@/lib/storage": stub }, { window: {}, fetch: async (...args) => { sent.push(args); throw new Error("offline"); } });
    return { ...load("src/lib/analytics.ts"), ...load("src/lib/analytics-transport.ts") };
  };
  const first = loadBrowser();
  assert.doesNotThrow(() => first.trackBetaEventOnce("landing_view", { authenticated: false }));
  first.trackBetaEventOnce("landing_view", { authenticated: false });
  const refreshed = loadBrowser();
  refreshed.trackBetaEventOnce("landing_view", { authenticated: false });
  refreshed.trackBetaEvent("login_completed", { authenticated: true }, refreshed.createAuthenticatedAnalyticsTransport("test-sensitive-token"));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(sent.length, 2);
  const [landing, login] = sent.map(([, options]) => JSON.parse(options.body));
  assert.equal(landing.anonymous_id, login.anonymous_id);
  assert.equal(landing.session_id, login.session_id);
  assert.equal(JSON.stringify([...storage.values()]).includes("test-sensitive-token"), false);
  assert.equal(sent[1][1].body.includes("test-sensitive-token"), false);
  assert.equal(sent[1][1].headers.Authorization, "Bearer test-sensitive-token");
});

test("credentials are excluded from event data through transport, ingestion, errors and persistence", async () => {
  const secret = "credential-only-test-marker";
  const calls = [], logs = [];
  const user = { id: randomUUID(), email: "account@example.com", email_confirmed_at: "2026-09-25T00:00:00Z" };
  const server = fixture({ user });
  const load = createLoader({}, {
    console: { warn: (...args) => logs.push(args), error: (...args) => logs.push(args) },
    fetch: async (url, options) => {
      calls.push({ url, options });
      const response = await server.ingest(server.request(JSON.parse(options.body), options.headers));
      assert.equal(response.status, 202);
      assert.equal((await response.text()).includes(secret), false);
      throw new Error(secret); // Transport must not return or log a credential-bearing error.
    },
  });
  const { createAuthenticatedAnalyticsTransport, sendAnonymousAnalyticsEvent } = load("src/lib/analytics-transport.ts");
  const transport = createAuthenticatedAnalyticsTransport(secret);
  await transport({ ...valid(), event_name: "login_completed" });
  await sendAnonymousAnalyticsEvent({ ...valid(), event_name: "signup_completed" });
  assert.equal(calls[0].options.headers.Authorization, `Bearer ${secret}`);
  assert.equal(calls[1].options.headers.Authorization, undefined);
  assert.equal(calls.some(({ options }) => options.body.includes(secret)), false);
  assert.equal(JSON.stringify([server.calls, server.logs, logs]).includes(secret), false);
  const before = calls.length;
  await transport({ ...valid(), accessToken: secret });
  await transport({ ...valid(), metadata: { token: secret } });
  assert.equal(calls.length, before, "transport also rejects credential fields rather than serializing them");
});

test("repeated auth listeners deduplicate confirmation without merging accounts or storing identity", () => {
  const requests = [], storage = new Map();
  const load = createLoader({ "@/lib/storage": {
    safeReadStorage: (key, fallback) => storage.get(key) ?? fallback,
    safeWriteStorage: (key, value) => storage.set(key, value),
    STORAGE_KEYS: { betaAnalyticsAnonymousId: "anonymous", betaAnalyticsSession: "session", betaAnalyticsEvents: "events", language: "language" },
  } }, { window: {}, fetch: async (...args) => { requests.push(args); return { ok: true }; } });
  const analytics = load("src/lib/analytics.ts");
  const transport = load("src/lib/analytics-transport.ts").createAuthenticatedAnalyticsTransport("transport-only");
  const input = { authenticated: true, userId: randomUUID(), emailConfirmedAt: "2026-09-25T00:00:00Z" };
  analytics.trackEmailConfirmed(input, transport);
  analytics.trackEmailConfirmed(input, transport);
  analytics.trackEmailConfirmed({ ...input, userId: randomUUID() }, transport);
  assert.equal(requests.length, 2);
  const stored = JSON.stringify([...storage.values()]);
  assert.equal(stored.includes(input.userId), false);
  assert.equal(stored.includes("transport-only"), false);
  assert.equal(JSON.stringify(requests.map(([, options]) => JSON.parse(options.body))).includes(input.userId), false);
});

test("local reset rotates identifiers and corrupt local records cannot retain extra content", () => {
  const storage = new Map(), sent = [];
  const load = createLoader({ "@/lib/storage": {
    safeReadStorage: (key, fallback) => storage.get(key) ?? fallback,
    safeWriteStorage: (key, value) => storage.set(key, value),
    STORAGE_KEYS: { betaAnalyticsAnonymousId: "anonymous", betaAnalyticsSession: "session", betaAnalyticsEvents: "events", language: "language" },
  } }, { window: {}, fetch: async (...args) => { sent.push(args); return { ok: true }; } });
  const analytics = load("src/lib/analytics.ts");
  analytics.trackBetaEvent("landing_view", { authenticated: false });
  const first = JSON.parse(sent[0][1].body);
  storage.clear();
  analytics.trackBetaEvent("landing_view", { authenticated: false });
  const second = JSON.parse(sent[1][1].body);
  assert.notEqual(first.anonymous_id, second.anonymous_id);
  assert.notEqual(first.session_id, second.session_id);
  storage.set("events", [{ ...storage.get("events")[0], accessToken: "secret" }]);
  analytics.trackBetaEvent("signup_started", { authenticated: false });
  analytics.trackBetaEvent("signup_completed", { authenticated: false, timestamp: "secret" });
  assert.equal(JSON.stringify(storage.get("events")).includes("secret"), false);
  assert.equal(sent.length, 3);
});
