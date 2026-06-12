import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function fail(message) {
  throw new Error(message);
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    fail(`${label}: missing ${expected}`);
  }
}

function assertMatches(content, pattern, label) {
  if (!pattern.test(content)) {
    fail(`${label}: missing pattern ${pattern}`);
  }
}

function verifyRlsPolicySet({
  migrationPath,
  table,
  selectPolicy,
  insertPolicy,
  updatePolicy,
  deletePolicy,
}) {
  const migration = read(migrationPath);
  const label = `${table} RLS migration`;

  assertIncludes(
    migration,
    `alter table public.${table} enable row level security;`,
    label,
  );
  assertIncludes(migration, selectPolicy, label);
  assertIncludes(migration, insertPolicy, label);
  assertIncludes(migration, updatePolicy, label);
  assertIncludes(migration, deletePolicy, label);
  assertMatches(migration, /using \(user_id = auth\.uid\(\)\)/, label);
  assertMatches(migration, /with check \(user_id = auth\.uid\(\)\)/, label);
}

function verifyApiRoute(path, checks) {
  const content = read(path);

  for (const check of checks) {
    if (typeof check === "string") {
      assertIncludes(content, check, path);
    } else {
      assertMatches(content, check, path);
    }
  }
}

verifyRlsPolicySet({
  migrationPath: "supabase/migrations/202606010001_enable_tasks_rls.sql",
  table: "tasks",
  selectPolicy: "create policy tasks_select_own on public.tasks",
  insertPolicy: "create policy tasks_insert_own on public.tasks",
  updatePolicy: "create policy tasks_update_own on public.tasks",
  deletePolicy: "create policy tasks_delete_own on public.tasks",
});

verifyRlsPolicySet({
  migrationPath: "supabase/migrations/202606010002_notes_cloud_foundation.sql",
  table: "notes",
  selectPolicy: "create policy notes_select_own on public.notes",
  insertPolicy: "create policy notes_insert_own on public.notes",
  updatePolicy: "create policy notes_update_own on public.notes",
  deletePolicy: "create policy notes_delete_own on public.notes",
});

verifyRlsPolicySet({
  migrationPath: "supabase/migrations/202606010004_create_activities.sql",
  table: "activities",
  selectPolicy: 'create policy "Users can select own activities"',
  insertPolicy: 'create policy "Users can insert own activities"',
  updatePolicy: 'create policy "Users can update own activities"',
  deletePolicy: 'create policy "Users can delete own activities"',
});

verifyRlsPolicySet({
  migrationPath: "supabase/migrations/202606010005_create_captures.sql",
  table: "captures",
  selectPolicy: "create policy captures_select_own on public.captures",
  insertPolicy: "create policy captures_insert_own on public.captures",
  updatePolicy: "create policy captures_update_own on public.captures",
  deletePolicy: "create policy captures_delete_own on public.captures",
});

const feedbackMigration = read(
  "supabase/migrations/202606010008_create_feedback.sql",
);

assertIncludes(
  feedbackMigration,
  "alter table public.feedback enable row level security;",
  "feedback RLS migration",
);
assertIncludes(
  feedbackMigration,
  "create policy feedback_select_own on public.feedback",
  "feedback RLS migration",
);
assertIncludes(
  feedbackMigration,
  "create policy feedback_insert_own on public.feedback",
  "feedback RLS migration",
);
assertMatches(
  feedbackMigration,
  /using \(user_id = auth\.uid\(\)\)/,
  "feedback RLS migration",
);
assertMatches(
  feedbackMigration,
  /with check \(user_id = auth\.uid\(\)\)/,
  "feedback RLS migration",
);
assertIncludes(
  feedbackMigration,
  "grant select, insert\n  on public.feedback\n  to authenticated;",
  "feedback RLS migration",
);

verifyApiRoute("src/server/api/auth.ts", [
  "parseBearerToken",
  "createSupabaseServerAuthClient({ accessToken })",
  "supabase.auth.getUser()",
]);

verifyApiRoute("src/app/api/tasks/route.ts", [
  "authenticateApiRequest(request)",
  '.eq("user_id", auth.userId)',
  '.is("deleted_at", null)',
  ".insert({ ...parsedPayload.payload, user_id: auth.userId })",
]);

verifyApiRoute("src/app/api/tasks/[id]/route.ts", [
  "authenticateApiRequest(request)",
  '.eq("id", taskId)',
  '.eq("user_id", auth.userId)',
  '.is("deleted_at", null)',
  '.update({ deleted_at: new Date().toISOString() })',
]);

verifyApiRoute("src/app/api/notes/route.ts", [
  "authenticateApiRequest(request)",
  '.eq("user_id", auth.userId)',
  '.is("deleted_at", null)',
  ".insert({ ...parsedPayload.payload, user_id: auth.userId })",
]);

verifyApiRoute("src/app/api/notes/[id]/route.ts", [
  "authenticateApiRequest(request)",
  '.eq("id", noteId)',
  '.eq("user_id", auth.userId)',
  '.is("deleted_at", null)',
  '.update({ deleted_at: new Date().toISOString() })',
]);

verifyApiRoute("src/app/api/activities/route.ts", [
  "authenticateApiRequest(request)",
  '.eq("user_id", auth.userId)',
  '.is("deleted_at", null)',
  ".insert({ ...parsedPayload.payload, user_id: auth.userId })",
]);

verifyApiRoute("src/app/api/captures/route.ts", [
  "authenticateApiRequest(request)",
  '.eq("user_id", auth.userId)',
  '.is("deleted_at", null)',
  ".insert({ ...parsedPayload.payload, user_id: auth.userId })",
]);

verifyApiRoute("src/app/api/captures/[id]/route.ts", [
  "authenticateApiRequest(request)",
  '.eq("id", captureId)',
  '.eq("user_id", auth.userId)',
  '.is("deleted_at", null)',
]);

verifyApiRoute("src/app/api/feedback/route.ts", [
  "authenticateApiRequest(request)",
  ".insert({ ...parsedPayload.payload, user_id: auth.userId })",
  '.select("id,type,status,created_at")',
]);

if (existsSync(join(root, "src/app/api/test/route.ts"))) {
  fail("Unsafe service-role test endpoint still exists.");
}

console.log("RLS and ownership static verification passed.");
