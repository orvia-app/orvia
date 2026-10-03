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

const calendarMigrationPath =
  "supabase/migrations/202609300001_calendar_plan_persistence.sql";

verifyRlsPolicySet({
  migrationPath: calendarMigrationPath,
  table: "orvia_events",
  selectPolicy: "create policy orvia_events_select_own on public.orvia_events",
  insertPolicy: "create policy orvia_events_insert_own on public.orvia_events",
  updatePolicy: "create policy orvia_events_update_own on public.orvia_events",
  deletePolicy: "create policy orvia_events_delete_own on public.orvia_events",
});

const calendarMigration = read(calendarMigrationPath);
assertMatches(calendarMigration,
  /create policy orvia_events_update_own[\s\S]*?using \(user_id = auth\.uid\(\)\)\s+with check \(user_id = auth\.uid\(\)\)/,
  "Events update ownership",
);
assertIncludes(calendarMigration,
  "revoke all on table public.orvia_events from public, anon, authenticated;",
  "Events grants",
);
assertIncludes(calendarMigration,
  "grant select, insert, update, delete on table public.orvia_events to authenticated;",
  "Events grants",
);
if (/grant\s+[^;]*\bon\s+(?:table\s+)?public\.orvia_events\s+to\s+(?:public|anon)\b/i.test(calendarMigration)) {
  fail("Events grants expose public or anon access.");
}

const temporalFoundationMigrationPath =
  "supabase/migrations/202610020001_temporal_scheduling_foundation.sql";

verifyRlsPolicySet({
  migrationPath: temporalFoundationMigrationPath,
  table: "planning_preferences",
  selectPolicy: "create policy planning_preferences_select_own on public.planning_preferences",
  insertPolicy: "create policy planning_preferences_insert_own on public.planning_preferences",
  updatePolicy: "create policy planning_preferences_update_own on public.planning_preferences",
  deletePolicy: "create policy planning_preferences_delete_own on public.planning_preferences",
});

const temporalFoundationMigration = read(temporalFoundationMigrationPath);
for (const operation of ["select", "insert", "update", "delete"]) {
  assertIncludes(
    temporalFoundationMigration,
    `create policy task_plan_blocks_${operation}_own on public.task_plan_blocks`,
    "Task plan blocks RLS migration",
  );
}
assertIncludes(temporalFoundationMigration,
  "alter table public.task_plan_blocks enable row level security;",
  "Task plan blocks RLS migration",
);
assertMatches(temporalFoundationMigration,
  /foreign key \(user_id, task_id\)[\s\S]*?references public\.tasks \(user_id, id\)/,
  "Task plan block owner/Task foreign key",
);
assertMatches(temporalFoundationMigration,
  /task_plan_blocks_insert_own[\s\S]*?tasks\.user_id = auth\.uid\(\)/,
  "Task plan block insert ownership",
);
assertMatches(temporalFoundationMigration,
  /task_plan_blocks_update_own[\s\S]*?tasks\.user_id = auth\.uid\(\)/,
  "Task plan block update ownership",
);
assertIncludes(temporalFoundationMigration,
  "revoke all on table public.task_plan_blocks from public, anon, authenticated;",
  "Task plan block grants",
);

const tasksServiceRoleGrantMigration = read(
  "supabase/migrations/202610030001_tasks_service_role_runtime_permissions.sql",
).trim();
const expectedTasksServiceRoleGrant = [
  "grant select, insert, update",
  "on table public.tasks",
  "to service_role;",
].join("\n");
if (tasksServiceRoleGrantMigration !== expectedTasksServiceRoleGrant) {
  fail("Tasks service-role migration must grant only SELECT, INSERT, and UPDATE on public.tasks.");
}

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

for (const path of [
  "src/app/api/events/[id]/route.ts",
  "src/app/api/tasks/[id]/schedule/route.ts",
]) {
  verifyApiRoute(path, ["authenticateApiRequest(request)", '.eq("id", id)', '.eq("user_id", auth.userId)']);
}
verifyApiRoute("src/app/api/events/route.ts", [
  "authenticateApiRequest(request)", "user_id: auth.userId",
]);
verifyApiRoute("src/app/api/events/query/route.ts", [
  "authenticateApiRequest(request)", "fetchOwnedEvents(auth.userId, range.value)",
]);
verifyApiRoute("src/app/api/schedule/route.ts", [
  "authenticateApiRequest(request)", "readOwnedSchedule(auth.userId",
]);
verifyApiRoute("src/server/api/schedule-source.ts", [
  '.eq("user_id", ownerId)',
]);
verifyApiRoute("src/app/api/planning-preferences/route.ts", [
  "authenticateApiRequest(request)",
  '.eq("user_id", auth.userId)',
  "user_id: auth.userId",
]);
verifyApiRoute("src/app/api/tasks/[id]/blocks/route.ts", [
  "authenticateApiRequest(request)",
  '.eq("user_id", auth.userId)',
  "user_id: auth.userId",
  "ownedActiveTask(taskId, auth.userId)",
]);
verifyApiRoute("src/app/api/tasks/[id]/blocks/[blockId]/route.ts", [
  "authenticateApiRequest(request)",
  '.eq("user_id", ownerId)',
  "ownedBlock(identifiers.id, identifiers.blockId, auth.userId)",
]);
verifyApiRoute("src/app/api/task-plan-blocks/route.ts", [
  "authenticateApiRequest(request)",
  '.eq("user_id", auth.userId)',
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
