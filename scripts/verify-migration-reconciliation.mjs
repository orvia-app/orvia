/** Local-only clean migration validation. No connections or dependencies installed.
 * node scripts/verify-migration-reconciliation.mjs <pglite-module> <catalog.sql> <snapshot.json>
 * Accepts the labelled reconstructed snapshot described in docs/MIGRATION_RECONCILIATION.md.
 * Expected schema must come from captured metadata, not the migrations under test.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [modulePath, catalogPath, snapshotPath] = process.argv.slice(2);
assert.ok(modulePath && catalogPath && snapshotPath, "Supply PGlite, catalog SQL, and snapshot paths");
const { PGlite } = await import(pathToFileURL(modulePath).href);
const production = JSON.parse(readFileSync(snapshotPath, "utf8")).rows[0].schema_metadata;
assert.equal(production.connection.read_only, "on");
const catalog = readFileSync(catalogPath, "utf8").replace(/^begin transaction read only;\s*/i, "").replace(/\s*commit;\s*$/i, "");
const files = readdirSync("supabase/migrations").filter(f => f.endsWith(".sql")).sort();
assert.deepEqual(files.map(f => f.split("_")[0]), ["202605280001", "202605290001", "202606010001", "202606010002", "202606010003", "202606010004", "202606010005", "202606010006", "202606010007", "202606010008", "202609250001", "202609250002"]);
const db = new PGlite();
const normalize = (rows, category) => rows.map(row => {
  const copy = { ...row };
  // Platform owner/default ACL are compared separately, not synthesized as DDL effects.
  delete copy.owner; delete copy.acl;
  if (category === "columns") delete copy.position;
  return Object.fromEntries(Object.entries(copy).sort(([a], [b]) => a.localeCompare(b)));
}).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
try {
  // Only Supabase platform prerequisites; no application tables are pre-created.
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to authenticated;
    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant select, insert, update, delete on tables to service_role;`);
  for (const file of files) {
    if (file.startsWith("202609250001")) {
      const actual = (await db.query(catalog)).rows[0].schema_metadata;
      for (const category of ["tables", "columns", "constraints", "indexes", "policies", "functions", "triggers"]) {
        assert.deepEqual(normalize(actual[category], category), normalize(production[category], category), category);
        console.log(`MATCH ${category}: ${actual[category].length}`);
      }
      for (const role of ["anon", "authenticated", "service_role"]) {
        for (const table of ["tasks", "notes", "captures", "activities", "feedback"]) {
          for (const privilege of ["select", "insert", "update", "delete"]) {
            const expected = production.effective_grants.find(g => g.role === role && g.table === table)[privilege];
            const observed = actual.effective_grants.find(g => g.role === role && g.table === table)[privilege];
            assert.equal(observed, expected, `${role} ${table} ${privilege}`);
          }
        }
      }
      for (const table of ["tasks", "notes", "captures", "activities", "feedback"]) {
        const user = "00000000-0000-0000-0000-000000000001";
        await db.exec(`set role authenticated; set request.jwt.claim.sub = '${user}';`);
        assert.equal((await db.query(`select * from public.${table}`)).rows.length, 0);
        await db.exec("reset role");
      }
      console.log("MATCH application CRUD grants; owner policies match production; authenticated reads succeed");
    }
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    console.log(`APPLIED locally: ${file}`);
  }
  // Verify the final hardening effect in addition to executing the full stream.
  for (const table of ["tasks", "notes", "captures", "activities", "feedback"]) {
    for (const role of ["anon", "authenticated"]) {
      for (const privilege of ["TRUNCATE", "REFERENCES", "TRIGGER", "MAINTAIN"]) {
        assert.equal((await db.query("select has_table_privilege($1,$2,$3) allowed", [role, `public.${table}`, privilege])).rows[0].allowed, false);
      }
    }
  }
  assert.equal((await db.query("select count(*)::integer n from analytics_events")).rows[0].n, 0);
  console.log("PASS clean 12-migration chain, including analytics and runtime privilege hardening");
} finally { await db.close(); }
