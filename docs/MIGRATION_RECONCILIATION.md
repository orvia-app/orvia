# Production migration reconciliation

## Current verification status — 2026-09-30

The historical preparation narrative below predates deployment. All 12 active
versions were verified Local = Remote during the release gate, including analytics
202609250001 and privilege hardening 202609250002. The historical proposal remains
as documentation. The active hardening file's “PROPOSAL ONLY / not deployed” comment
is stale; its approved deployed bytes must not be edited to fix that comment.

The disposable PGlite 0.3.14 runtime was restored offline from the existing npm
cache outside the repository. No project dependency or lockfile changed.
The original catalog.sql and pre-analytics production-schema.json were missing.
They have **not** been represented as recovered originals:

- `scripts/fixtures/reconciliation-catalog.sql` reconstructs read-only catalog
  inspection from the surviving capture's field schema. It reads catalog metadata
  only. PostgreSQL's pretty-print flags and whitespace-stripped function-body MD5
  reproduce the captured representations; no comparison category was removed.
- `scripts/reconstruct-disposable-inputs.mjs` projects the five runtime tables and
  their objects from the surviving `schema-after-hardening.json`, removing only
  the analytics table, analytics functions and two named analytics triggers.
  Its expected schema is captured evidence, not generated from the migrations
  under test. It asserts the original documented category counts.
- Pre-hardening effective grants and postgres default table grants come from
  `privilege-preflight.json`. Synthetic direct grants reproduce those effective
  permissions; they do not establish historical direct-ACL/inheritance provenance.
  Other captured defaults are retained from the post-hardening snapshot.
- Derived JSON records input SHA-256 hashes and these qualifications. Original
  captures remain unchanged outside Git. These tests cannot prove historical
  migration execution or current live production configuration.

Local reproduction (requires those retained metadata captures):

```sh
node scripts/reconstruct-disposable-inputs.mjs /tmp/orvia-migration-reconciliation /tmp/orvia-disposable-reconstructed
node scripts/verify-beta-analytics-db.mjs /tmp/orvia-analytics-pg-test/node_modules/@electric-sql/pglite/dist/index.js
node scripts/verify-migration-reconciliation.mjs /tmp/orvia-analytics-pg-test/node_modules/@electric-sql/pglite/dist/index.js scripts/fixtures/reconciliation-catalog.sql /tmp/orvia-disposable-reconstructed/reconstructed-baseline.json
node scripts/verify-runtime-privilege-hardening.mjs /tmp/orvia-analytics-pg-test/node_modules/@electric-sql/pglite/dist/index.js scripts/fixtures/reconciliation-catalog.sql /tmp/orvia-disposable-reconstructed/reconstructed-baseline.json
```

All three runtime verifiers PASS using these inputs. Reconciliation executes all
12 active SQL files, preserves the pre-analytics structural/CRUD comparison, and
checks the four revoked privileges after hardening. The hardening verifier also
checks own-user CRUD, cross-user denial, feedback restrictions, unchanged schema,
service/analytics grants and future-table defaults, including a second execution
of the exact unmodified migration with the literal postgres owner.
No production access was made during this reconstruction. Application validation
was not repeated; these are verification-only changes awaiting review/commit.

## Historical preparation record

Local preparation only. No production history repair or migration deployment has
been performed by this preparation. Production project: **personal-os-prod**;
project reference: **uxyofppteklwjyqxzneg** (eu-central-1).

Evidence: approved read-only catalog snapshot taken 2026-09-25 14:15:45 UTC,
with transaction_read_only=on. Snapshot and catalog query remain under
`/tmp/orvia-migration-reconciliation/`; they contain schema metadata, not application
rows. Preserve these external evidence files before temporary-directory cleanup.
Schema equivalence does not prove historical execution of any migration file.

## Active stream

The incompatible `202605270001_initial_schema.sql` was moved unchanged to
`supabase/migration-archive/`. SHA-256:
`10843fda9a8feee7a3e2a99680909f840587408fc9c03631f0cdc6610d02b134`.
Eleven proposed tables and both archflow functions are absent in production;
overlapping tasks/notes/captures definitions materially differ. Replaying it
would conflict with the runtime schema and later notes creation. Do not mark it
applied. The archive is outside the CLI's active migration directory.

`202605280001_legacy_tasks_prerequisite.sql` reconstructs only the verified seven
legacy tasks columns and primary key. It is a prerequisite, not a complete
production baseline or evidence of historical provenance. Subsequent migrations
supply the remaining runtime objects. All nine verified migrations remain unchanged.

| Version | Verified effective production effects |
| --- | --- |
| 202605290001 | Ten task columns, five NOT VALID checks, eight indexes, shared update function and task trigger |
| 202606010001 | Task RLS and four authenticated owner policies; old public read policy absent |
| 202606010002 | Notes: 11 columns, six constraints, five non-PK indexes, four owner policies and update trigger |
| 202606010003 | Notes authenticated/service CRUD and required public schema usage |
| 202606010004 | Activities: 11 columns, six constraints, six non-PK indexes, four owner policies and required grants |
| 202606010005 | Captures: nine columns, six constraints, six non-PK indexes, four owner policies, update trigger and required grants |
| 202606010006 | Validated activities type constraint includes task_completed |
| 202606010007 | Authenticated CRUD on all four runtime tables with RLS retained |
| 202606010008 | Feedback: seven columns, six constraints, four non-PK indexes, two owner policies; authenticated SELECT/INSERT, no UPDATE/DELETE; anon no grants |

The later activities constraint supersedes the original 202606010004 constraint;
this is an intended change, not drift. Captures' conditional raw_text backfill
cannot be proven to have run by inspecting schema metadata. Do not replay it to
establish provenance. Task/captures NOT VALID checks match migration definitions;
this work makes no claim about historical row compliance.

Analytics migration `202609250001_beta_analytics.sql` is absent in the approved
production snapshot: no expected analytics relation/indexes/functions/triggers.
It remains pending remotely. Local application during testing does not change that.

## Disposable verification

Run from the repository root with an externally installed PGlite module:

```sh
node scripts/verify-migration-reconciliation.mjs /tmp/orvia-analytics-pg-test/node_modules/@electric-sql/pglite/dist/index.js /tmp/orvia-migration-reconciliation/catalog.sql /tmp/orvia-migration-reconciliation/production-schema.json
node scripts/verify-beta-analytics-db.mjs /tmp/orvia-analytics-pg-test/node_modules/@electric-sql/pglite/dist/index.js
```

The clean verifier starts an empty in-memory PostgreSQL engine, supplies only
Supabase platform roles, auth.users, auth.uid and minimum service CRUD defaults,
then runs all 11 active files in order without editing their SQL. No application
tables are seeded before the prerequisite. This is a PostgreSQL compatibility
fixture, not a running Supabase Auth/PostgREST stack.

Pre-analytics comparison passes: five tables (including RLS flags), 55 columns,
31 constraints (including validation state), 34 indexes, 18 policies, one function
(including normalized body hash, invoker/definer and search_path), three triggers,
and CRUD privileges for anon/authenticated/service_role on all five tables.
Owner names, column ordinal positions and platform default/function ACLs are not
part of structural equality. Unsafe extra production grants are intentionally not
reproduced. The separate analytics regression models broad Supabase defaults and
tests revocation, RPC isolation, triggers, deduplication, aggregates and failures.

## Focused privilege reachability review

Production grants include TRUNCATE/REFERENCES/TRIGGER/MAINTAIN for anon on four
runtime tables and authenticated on all five. RLS does not govern TRUNCATE.

Standard PostgREST table endpoints expose row CRUD, not arbitrary SQL, TRUNCATE,
CREATE TRIGGER, foreign-key DDL or maintenance commands. DELETE is not TRUNCATE.
The repository has no generic SQL executor or caller-selected RPC gateway. Its
only RPC calls are fixed analytics ingestion/report names with validated typed
arguments; these RPCs are service-role-only in the pending migration. The known
shared set_updated_at trigger function only assigns NEW.updated_at, has no dynamic
SQL and is SECURITY INVOKER. Existing triggers do not depend on clients possessing
TRIGGER privilege to fire.

Therefore no route exercising these extra privileges was identified in the known
application/standard REST paths. This is NOT proof that all live RPC paths are
safe: the approved snapshot deliberately filters functions by name and does not
inventory every exposed schema, view, RPC, role membership or gateway setting.
No remote API requests or destructive probes were made during this preparation.
A complete production reachability conclusion requires a separately reviewed
read-only inventory of all exposed functions and their execution grants/bodies,
view/trigger call chains and exposed-schema configuration. Unknown RPCs remain an
unresolved release-review item; no direct public exploit has been demonstrated.

TRUNCATE threatens whole-table loss if SQL/RPC execution is reachable; TRIGGER and
REFERENCES can enable dangerous schema-side behavior; MAINTAIN permits disruptive
maintenance/locking. Remove the unnecessary grants before expanding beta access,
or explicitly resolve reachability first. This does not prevent history-only repair.

Sources:
- https://docs.postgrest.org/en/stable/references/api/tables_views.html
- https://docs.postgrest.org/en/v12/references/api/functions.html
- https://www.postgresql.org/docs/17/ddl-priv.html
- https://www.postgresql.org/docs/17/ddl-rowsecurity.html

## Separate hardening proposal

`docs/proposed-migrations/202609250002_runtime_table_privilege_hardening.sql`
remains outside the active stream and is not applied. It removes the four excess
privileges from PUBLIC/anon/authenticated on the five runtime tables, and removes
only those four future public-table default grants for the postgres owner.
It retains existing application CRUD, RLS, policies, function definitions and
triggers. The platform-managed supabase_admin defaults remain unchanged: they do
not govern objects created by postgres, and authority to change them was not
established. Future objects created by supabase_admin require a separate supported
review. Verify the deployment role and inherited/global privileges before deploying;
do not skip a failed revocation. This is deliberately
not mixed into the historical prerequisite.

## Approval gate

No additional schema change is required before the proposed history-only repair.
Review these local files and preserve evidence; reconfirm the linked target and
schema freshness before separately authorizing repair. Record the new prerequisite
and nine verified versions as applied; never record the archived initial version.
After repair, all ten active pre-analytics versions should match local/remote;
only 202609250001 should be pending. Stop if a later dry run lists anything else.
