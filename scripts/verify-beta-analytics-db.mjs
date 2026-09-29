/** Optional disposable PostgreSQL runtime verification, no project dependency.
 * node scripts/verify-beta-analytics-db.mjs /absolute/path/to/pglite/dist/index.js
 * Never connects to a real Supabase project; creates an in-memory database.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

if (!process.argv[2]) throw new Error("Supply the absolute PGlite module path for disposable database testing.");
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create role analytics_public_probe;
    create schema auth;
    create table auth.users (id uuid primary key, email_confirmed_at timestamptz);
    create table public.tasks (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), title text not null, deleted_at timestamptz);
    create table public.feedback (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id), message text not null check(length(message)>0));
    grant usage on schema public to anon, authenticated, service_role, analytics_public_probe;
    -- Model existing Supabase projects, not vanilla PostgreSQL defaults.
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
    create table public.analytics_privilege_probe (id uuid);
  `);
  const defaults = (await db.query(`
    select has_table_privilege('service_role','public.analytics_privilege_probe','UPDATE') as can_update,
           has_table_privilege('service_role','public.analytics_privilege_probe','DELETE') as can_delete
  `)).rows[0];
  assert.deepEqual(defaults, { can_update: true, can_delete: true }, "fixture must reproduce broad service-role defaults");
  await db.exec(`
    drop table public.analytics_privilege_probe;
  `);
  const users = Array.from({ length: 8 }, randomUUID);
  for (const user of users) await db.query("insert into auth.users values ($1,now())", [user]);
  await db.query("insert into tasks(user_id,title) values ($1,'prior task')", [users[0]]);
  await db.exec(readFileSync("supabase/migrations/202609250001_beta_analytics.sql", "utf8"));
  for (const role of ["anon", "authenticated", "analytics_public_probe", "service_role"]) {
    for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]) {
      const allowed = (await db.query(
        "select has_table_privilege($1,'public.analytics_events',$2) allowed", [role, privilege],
      )).rows[0].allowed;
      assert.equal(allowed, role === "service_role" && ["SELECT", "INSERT"].includes(privilege), `${role} ${privilege}`);
    }
  }
  const functions = [
    "public.ingest_beta_analytics(uuid,text,uuid,uuid,text,uuid)",
    "public.beta_analytics_report(integer)",
    "public.record_beta_task_activation()",
    "public.record_beta_feedback_submission()",
  ];
  for (const fn of functions) {
    for (const role of ["anon", "authenticated", "analytics_public_probe"]) {
      const allowed = (await db.query("select has_function_privilege($1,$2,'EXECUTE') allowed", [role, fn])).rows[0].allowed;
      assert.equal(allowed, false, `${role} cannot execute ${fn}`);
    }
    const publicGrants = (await db.query(`
      select count(*)::integer total from pg_proc p,
        lateral aclexplode(coalesce(p.proacl, acldefault('f',p.proowner))) acl
      where p.oid=$1::regprocedure and acl.grantee=0 and acl.privilege_type='EXECUTE'
    `, [fn])).rows[0].total;
    assert.equal(publicGrants, 0, `PUBLIC cannot execute ${fn}`);
  }
  const count = async (name, user) => Number((await db.query("select count(*) as total from analytics_events where event_name=$1 and user_id=$2", [name,user])).rows[0].total);
  await db.query("insert into tasks(user_id,title) values ($1,'later task')", [users[0]]);
  assert.equal(await count("first_task_created",users[0]), 0, "existing accounts are not activated again");
  await db.query("insert into tasks(user_id,title) values ($1,'first')", [users[1]]);
  await db.query("insert into tasks(user_id,title) values ($1,'second')", [users[1]]);
  await db.query("update tasks set deleted_at=now() where user_id=$1", [users[1]]);
  await db.query("insert into tasks(user_id,title) values ($1,'after soft deletion')", [users[1]]);
  assert.equal(await count("first_task_created",users[1]), 1, "first task is lifetime once including soft deletes");
  await db.query("insert into tasks(user_id,title) values ($1,'batch first'),($1,'batch second')", [users[2]]);
  assert.equal(await count("first_task_created",users[2]), 1, "multirow creation activates once");
  const taskId = randomUUID();
  await db.query("insert into tasks(id,user_id,title) values ($1,$2,'retry') on conflict do nothing", [taskId,users[3]]);
  await db.query("insert into tasks(id,user_id,title) values ($1,$2,'retry') on conflict do nothing", [taskId,users[3]]);
  assert.equal(await count("first_task_created",users[3]),1,"task retries deduplicate");
  await assert.rejects(db.query("insert into tasks(user_id,title) values ($1,null)", [users[4]]));
  assert.equal(await count("first_task_created",users[4]),0,"failed task creation produces no activation");
  await db.exec("begin");
  await db.query("insert into tasks(user_id,title) values ($1,'rolled back')", [users[4]]);
  await db.exec("rollback");
  assert.equal(await count("first_task_created",users[4]),0,"rollback removes analytics too");
  await assert.rejects(db.query("insert into feedback(user_id,message) values ($1,'')", [users[1]]));
  assert.equal(await count("feedback_submitted",users[1]),0);
  const feedbackId=randomUUID();
  await db.query("insert into feedback(id,user_id,message) values ($1,$2,'never copy this secret')", [feedbackId,users[1]]);
  await db.query("insert into feedback(id,user_id,message) values ($1,$2,'retry') on conflict do nothing", [feedbackId,users[1]]);
  assert.equal(await count("feedback_submitted",users[1]),1,"only successful feedback insert is counted");
  assert.equal(JSON.stringify((await db.query("select * from analytics_events")).rows).includes("never copy this secret"),false);
  await db.exec("alter table analytics_events add constraint simulated_outage check(false) not valid");
  await db.query("insert into tasks(user_id,title) values ($1,'survives telemetry failure')", [users[5]]);
  await db.query("insert into feedback(user_id,message) values ($1,'survives telemetry failure')", [users[5]]);
  assert.equal(await count("first_task_created",users[5]),0);
  assert.equal(Number((await db.query("select count(*) n from tasks where user_id=$1",[users[5]])).rows[0].n),1);
  assert.equal(Number((await db.query("select count(*) n from feedback where user_id=$1",[users[5]])).rows[0].n),1);
  await db.exec("alter table analytics_events drop constraint simulated_outage");
  const anonymous = randomUUID(), session = randomUUID();
  const ingest = (name, user=null, anon=anonymous, ses=session) => db.query("select ingest_beta_analytics($1,$2,$3,$4,'en',$5) accepted",[randomUUID(),name,anon,ses,user]);
  await ingest("landing_view"); await ingest("landing_view");
  await ingest("signup_started"); await ingest("signup_completed");
  await ingest("login_completed",users[1]); await ingest("login_completed",users[1]);
  await ingest("email_confirmed",users[1]); await ingest("email_confirmed",users[1],randomUUID(),randomUUID());
  assert.equal(await count("email_confirmed",users[1]),1,"confirmation is once per account across browsers");
  await ingest("email_confirmed",users[6]);
  assert.equal(await count("email_confirmed",users[6]),1,"accounts sharing a browser session must not suppress each other");
  await assert.rejects(ingest("first_task_created",users[4]));
  await assert.rejects(ingest("feedback_submitted",users[4]));
  await db.query("update auth.users set email_confirmed_at=null where id=$1",[users[4]]);
  await assert.rejects(ingest("email_confirmed",users[4]));
  const report=(await db.query("select beta_analytics_report(7) report")).rows[0].report;
  assert.equal(report.counts.landing_view,1,"rerenders/replays do not increase landing count");
  assert.deepEqual(report.conversions.signup,{numerator:1,denominator:1});
  assert.deepEqual(report.conversions.activation,{numerator:1,denominator:1});
  assert.deepEqual(report.conversions.feedback,{numerator:1,denominator:3});
  assert.equal(report.daily.length,7);
  assert.equal(JSON.stringify(report).includes(users[1]),false,"report never returns identities");
  await assert.rejects(db.query("select beta_analytics_report(999)"));
  for (let i=0;i<35;i++) await ingest("landing_view",null,anonymous,randomUUID());
  assert.equal((await ingest("landing_view",null,anonymous,randomUUID())).rows[0].accepted,false,"durable budget bounds a browser changing sessions");
  for (const role of ["anon","authenticated","analytics_public_probe"]) {
    await db.exec(`set role ${role}`);
    await assert.rejects(db.query("select * from analytics_events"));
    await assert.rejects(db.query("insert into analytics_events(event_name,authenticated) values ('first_task_created',false)"));
    await assert.rejects(db.query("select beta_analytics_report(7)"));
    await assert.rejects(ingest("landing_view"));
    await db.exec("reset role");
  }
  await db.exec("set role service_role");
  await db.query("select beta_analytics_report(30)");
  assert.equal((await ingest("landing_view",null,randomUUID(),randomUUID())).rows[0].accepted,true,"service role can execute ingestion RPC");
  const directId = randomUUID();
  await db.query("insert into analytics_events(id,event_name,authenticated,user_id) values ($1,'feedback_submitted',true,$2)", [directId,users[7]]);
  assert.equal((await db.query("select id from analytics_events where id=$1",[directId])).rows.length,1,"service role can directly insert and select");
  await assert.rejects(db.query("update analytics_events set locale='ua' where id=$1",[directId]), { code: "42501" });
  await assert.rejects(db.query("delete from analytics_events where id=$1",[directId]), { code: "42501" });
  await assert.rejects(db.query("truncate table analytics_events"), { code: "42501" });
  await db.exec("reset role");
  await db.query("delete from tasks where user_id=$1",[users[1]]);
  await db.query("delete from feedback where user_id=$1",[users[1]]);
  await db.query("delete from auth.users where id=$1",[users[1]]);
  assert.equal(await count("first_task_created",users[1]),0,"account deletion cascades linked analytics");
  console.log("PASS: PostgreSQL migration, deduplication, successful writes, fail-safe triggers, strict RPCs, aggregates, rate budget, Supabase default-grant overrides, restricted table/RPC privileges, RLS and account deletion.");
} finally { await db.close(); }
