import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "ORVIA_RUNTIME_USER_A_EMAIL",
  "ORVIA_RUNTIME_USER_A_PASSWORD",
  "ORVIA_RUNTIME_USER_B_EMAIL",
  "ORVIA_RUNTIME_USER_B_PASSWORD",
];

const runId = `runtime-${Date.now()}-${Math.random()
  .toString(36)
  .slice(2, 8)}`;

function fail(message) {
  throw new Error(message);
}

function formatSupabaseError(error) {
  return {
    code: error?.code ?? "unknown",
    details: error?.details ?? null,
    hint: error?.hint ?? null,
    message: error?.message ?? "Unknown Supabase error",
  };
}

function logSupabaseError({ error, operation, table, user }) {
  const diagnostic = {
    error: formatSupabaseError(error),
    operation,
    table,
    user,
  };

  console.error("Supabase runtime verification error:");
  console.error(JSON.stringify(diagnostic, null, 2));
}

function getEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    fail(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createSupabaseClient() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

async function signInTestUser(label, emailEnv, passwordEnv) {
  const supabase = createSupabaseClient();
  const email = getEnv(emailEnv);
  const password = getEnv(passwordEnv);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    if (error) {
      logSupabaseError({
        error,
        operation: "auth.signInWithPassword",
        table: "auth.users",
        user: label,
      });
    }

    fail(`${label}: failed to sign in test user.`);
  }

  return {
    email,
    label,
    supabase,
    userId: data.user.id,
  };
}

function assertNoError(result, label, context) {
  if (result.error) {
    logSupabaseError({ error: result.error, ...context });
    fail(`${label}: ${result.error.message}`);
  }
}

function assertNoRows(result, label, context) {
  assertNoError(result, label, context);

  if ((result.data ?? []).length !== 0) {
    fail(`${label}: cross-user operation returned rows.`);
  }
}

function assertRows(result, label, context) {
  assertNoError(result, label, context);

  return result.data ?? [];
}

async function insertOne(user, table, payload) {
  const result = await user.supabase
    .from(table)
    .insert({ ...payload, user_id: user.userId })
    .select("*")
    .single();

  if (result.error || !result.data?.id) {
    if (result.error) {
      logSupabaseError({
        error: result.error,
        operation: "insert",
        table,
        user: user.label,
      });
    }

    fail(`${user.label}: failed to create ${table} test row.`);
  }

  return result.data;
}

async function verifyCrossRead(attacker, table, victimId) {
  const result = await attacker.supabase
    .from(table)
    .select("id")
    .eq("id", victimId);

  assertNoRows(result, `${attacker.label}: ${table} cross-read`, {
    operation: "select",
    table,
    user: attacker.label,
  });
}

async function verifyRecordStillExists(owner, table, id) {
  const result = await owner.supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (result.error || !result.data) {
    if (result.error) {
      logSupabaseError({
        error: result.error,
        operation: "select-owner-row",
        table,
        user: owner.label,
      });
    }

    fail(`${owner.label}: ${table} owner row was missing after cross-check.`);
  }

  return result.data;
}

async function verifyCrossUpdate({
  attacker,
  owner,
  table,
  victimId,
  update,
}) {
  const result = await attacker.supabase
    .from(table)
    .update(update)
    .eq("id", victimId)
    .select("id");

  assertNoRows(result, `${attacker.label}: ${table} cross-update`, {
    operation: "update",
    table,
    user: attacker.label,
  });
  const ownerRow = await verifyRecordStillExists(owner, table, victimId);

  for (const [key, value] of Object.entries(update)) {
    if (ownerRow[key] === value) {
      fail(`${attacker.label}: ${table} cross-update mutated owner row.`);
    }
  }
}

async function verifyCrossDelete({ attacker, owner, table, victimId }) {
  const result = await attacker.supabase
    .from(table)
    .delete()
    .eq("id", victimId)
    .select("id");

  assertNoRows(result, `${attacker.label}: ${table} cross-delete`, {
    operation: "delete",
    table,
    user: attacker.label,
  });
  await verifyRecordStillExists(owner, table, victimId);
}

async function cleanupRows(user, rowsByTable) {
  for (const [table, ids] of Object.entries(rowsByTable)) {
    if (ids.length === 0) {
      continue;
    }

    const result = await user.supabase.from(table).delete().in("id", ids);

    if (result.error) {
      logSupabaseError({
        error: result.error,
        operation: "cleanup-delete",
        table,
        user: user.label,
      });
      console.warn(
        `${user.label}: failed to clean up ${table} rows: ${result.error.message}`,
      );
    }
  }
}

async function verifyEntity({
  attacker,
  owner,
  table,
  victimRow,
  update,
}) {
  console.log(`Checking ${table} isolation...`);
  await verifyCrossRead(attacker, table, victimRow.id);
  await verifyCrossUpdate({
    attacker,
    owner,
    table,
    update,
    victimId: victimRow.id,
  });
  await verifyCrossDelete({
    attacker,
    owner,
    table,
    victimId: victimRow.id,
  });
  console.log(`PASS ${table} isolation`);
}

async function main() {
  for (const envVar of requiredEnvVars) {
    getEnv(envVar);
  }

  console.log(`Runtime ownership verification id: ${runId}`);

  const userA = await signInTestUser(
    "User A",
    "ORVIA_RUNTIME_USER_A_EMAIL",
    "ORVIA_RUNTIME_USER_A_PASSWORD",
  );
  const userB = await signInTestUser(
    "User B",
    "ORVIA_RUNTIME_USER_B_EMAIL",
    "ORVIA_RUNTIME_USER_B_PASSWORD",
  );

  if (userA.userId === userB.userId) {
    fail("Runtime ownership verification requires two distinct test users.");
  }

  const cleanup = {
    [userA.label]: { activities: [], captures: [], notes: [], tasks: [] },
    [userB.label]: { activities: [], captures: [], notes: [], tasks: [] },
  };

  try {
    const userBTask = await insertOne(userB, "tasks", {
      description: "Runtime ownership verification task",
      priority: "medium",
      status: "todo",
      title: `Runtime task ${runId}`,
    });
    cleanup[userB.label].tasks.push(userBTask.id);
    const userBNote = await insertOne(userB, "notes", {
      content: "Runtime ownership verification note",
      metadata: {},
      source: "system",
      tags: [],
      title: `Runtime note ${runId}`,
      type: "note",
    });
    cleanup[userB.label].notes.push(userBNote.id);
    const userBCapture = await insertOne(userB, "captures", {
      content: `Runtime capture ${runId}`,
      metadata: {},
      source: "manual",
      status: "inbox",
    });
    cleanup[userB.label].captures.push(userBCapture.id);
    const userBActivity = await insertOne(userB, "activities", {
      description: "Recorded a system event",
      entity_id: null,
      entity_type: "system",
      metadata: { source: "system" },
      title: "System event",
      type: "system_event",
    });

    cleanup[userB.label].activities.push(userBActivity.id);

    await verifyEntity({
      attacker: userA,
      owner: userB,
      table: "tasks",
      update: { title: `Compromised task ${runId}` },
      victimRow: userBTask,
    });
    await verifyEntity({
      attacker: userA,
      owner: userB,
      table: "notes",
      update: { title: `Compromised note ${runId}` },
      victimRow: userBNote,
    });
    await verifyEntity({
      attacker: userA,
      owner: userB,
      table: "captures",
      update: { status: "archived" },
      victimRow: userBCapture,
    });

    console.log("Checking activities isolation...");
    await verifyCrossRead(userA, "activities", userBActivity.id);
    await verifyRecordStillExists(userB, "activities", userBActivity.id);
    console.log("PASS activities isolation");

    const userATask = await insertOne(userA, "tasks", {
      description: "Runtime ownership verification task",
      priority: "medium",
      status: "todo",
      title: `Runtime task ${runId}`,
    });
    const userANote = await insertOne(userA, "notes", {
      content: "Runtime ownership verification note",
      metadata: {},
      source: "system",
      tags: [],
      title: `Runtime note ${runId}`,
      type: "note",
    });
    const userACapture = await insertOne(userA, "captures", {
      content: `Runtime capture ${runId}`,
      metadata: {},
      source: "manual",
      status: "inbox",
    });
    const userAActivity = await insertOne(userA, "activities", {
      description: "Recorded a system event",
      entity_id: null,
      entity_type: "system",
      metadata: { source: "system" },
      title: "System event",
      type: "system_event",
    });

    cleanup[userA.label].tasks.push(userATask.id);
    cleanup[userA.label].notes.push(userANote.id);
    cleanup[userA.label].captures.push(userACapture.id);
    cleanup[userA.label].activities.push(userAActivity.id);

    const userBVisibleCounts = await Promise.all(
      [
        ["tasks", userATask.id],
        ["notes", userANote.id],
        ["captures", userACapture.id],
        ["activities", userAActivity.id],
      ].map(async ([table, id]) => {
        const result = await userB.supabase
          .from(table)
          .select("id")
          .eq("id", id);

        return [
          table,
          assertRows(result, `User B: ${table} cross-read`, {
            operation: "select",
            table,
            user: userB.label,
          }),
        ];
      }),
    );

    for (const [table, rows] of userBVisibleCounts) {
      if (rows.length !== 0) {
        fail(`User B could read User A ${table} row.`);
      }
    }

    console.log("PASS reverse cross-read checks");
    console.log("Runtime ownership verification passed.");
  } finally {
    await cleanupRows(userA, cleanup[userA.label]);
    await cleanupRows(userB, cleanup[userB.label]);
    await userA.supabase.auth.signOut();
    await userB.supabase.auth.signOut();
  }
}

main().catch((error) => {
  console.error("Runtime ownership verification failed.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
