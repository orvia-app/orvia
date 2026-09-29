/** Disposable only: node this-file <external-pglite-module> <approved-catalog.sql> <snapshot.json> */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const [modulePath,catalogPath,snapshotPath]=process.argv.slice(2);
assert.ok(modulePath && catalogPath && snapshotPath);
const {PGlite}=await import(pathToFileURL(modulePath).href);
const db=new PGlite();
const snapshot=JSON.parse(readFileSync(snapshotPath,'utf8')).rows[0].schema_metadata;
const catalog=readFileSync(catalogPath,'utf8').replace(/^begin transaction read only;\s*/i,'').replace(/\s*commit;\s*$/i,'');
const tables=['tasks','notes','captures','activities','feedback'];
const roles=['anon','authenticated','service_role','public_probe'];
const privileges=['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'];
const excess=privileges.slice(4);
const quote=s=>'"'+s.replaceAll('"','""')+'"';
const grantee=s=>s==='PUBLIC'?'PUBLIC':quote(s);
async function matrix(table){
 const rows=[];
 for(const role of roles) for(const privilege of privileges) rows.push({role,privilege,allowed:(await db.query('select has_table_privilege($1,$2,$3) allowed',[role,`public.${table}`,privilege])).rows[0].allowed});
 return rows;
}
async function behavior(){
 const user='00000000-0000-0000-0000-000000000001', other='00000000-0000-0000-0000-000000000002';
 const values={tasks:"title",notes:"title",captures:"content",activities:"title,type,entity_type",feedback:"message"};
 for(const table of tables){
  await db.exec('begin');
  try{
   await db.exec(`set local role authenticated; set local request.jwt.claim.sub='${user}'`);
   const payload=table==='activities'?"'fixture','task_created','task'":"'fixture'";
   const row=(await db.query(`insert into ${table}(user_id,${values[table]}) values ('${user}',${payload}) returning id`)).rows[0];
   assert.equal((await db.query(`select id from ${table} where id=$1`,[row.id])).rows.length,1);
   if(table!=='feedback'){
    assert.equal((await db.query(`update ${table} set user_id=user_id where id=$1 returning id`,[row.id])).rows.length,1);
   }
   await db.exec(`set local request.jwt.claim.sub='${other}'`);
   assert.equal((await db.query(`select id from ${table} where id=$1`,[row.id])).rows.length,0);
   if(table!=='feedback'){
    assert.equal((await db.query(`update ${table} set user_id=user_id where id=$1 returning id`,[row.id])).rows.length,0);
    assert.equal((await db.query(`delete from ${table} where id=$1 returning id`,[row.id])).rows.length,0);
    await db.exec(`set local request.jwt.claim.sub='${user}'`);
    assert.equal((await db.query(`delete from ${table} where id=$1 returning id`,[row.id])).rows.length,1);
   }
  }finally{await db.exec('rollback');}
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${user}'`);
  await assert.rejects(db.query(`insert into ${table}(user_id,${values[table]}) values ('${other}',${table==='activities'?"'fixture','task_created','task'":"'fixture'"})`),{code:'42501'});
  if(table==='feedback') for(const sql of ['update feedback set message=message','delete from feedback']) await assert.rejects(db.query(sql),{code:'42501'});
  await db.exec('reset role');
 }
}
try{
 await db.exec(`create role fixture_owner; create role anon; create role authenticated; create role service_role bypassrls; create role public_probe; create role supabase_admin;
 create schema auth; create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated,fixture_owner; grant references on auth.users to fixture_owner; grant all on schema public to fixture_owner; grant usage on schema public to anon,authenticated,service_role,public_probe; set role fixture_owner;`);
 for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql') && f < '202609250002').sort()) await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
 // Reconstruct captured table ACLs exactly, rather than assuming platform defaults.
 for(const table of tables){
  await db.exec(`revoke all on public.${table} from public,anon,authenticated,service_role`);
  for(const g of snapshot.table_grants.filter(g=>g.table===table && g.grantee!=='postgres')) await db.exec(`grant ${g.privilege} on public.${table} to ${grantee(g.grantee)}`);
 }
 await db.exec('reset role');
 for(const g of snapshot.default_grants.filter(g=>g.object_type==='r')){
  assert.equal(g.schema,'public','global grants need separate review');
  await db.exec(`alter default privileges for role ${quote(g.owner === "postgres" ? "fixture_owner" : g.owner)} in schema public grant ${g.privilege} on tables to ${grantee(g.grantee)}`);
 }
 await db.exec("insert into auth.users values ('00000000-0000-0000-0000-000000000001',now()),('00000000-0000-0000-0000-000000000002',now())");
 const before=(await db.query(catalog)).rows[0].schema_metadata;
 const matrices={};for(const table of tables) matrices[table]=await matrix(table);
 for(const table of tables) for(const g of matrices[table]){
  if(g.privilege==='MAINTAIN') assert.equal(g.allowed,snapshot.table_grants.some(a=>a.table===table&&a.grantee===g.role&&a.privilege==='MAINTAIN'));
  else if(g.role!=='public_probe') assert.equal(g.allowed,snapshot.effective_grants.find(a=>a.table===table&&a.role===g.role)[g.privilege.toLowerCase()]);
 }
 const analytics=await matrix('analytics_events');
 await behavior();
 await db.exec('set role fixture_owner');
 await db.exec(readFileSync('supabase/migrations/202609250002_runtime_table_privilege_hardening.sql','utf8').replace("for role postgres", "for role fixture_owner"));
 const after=(await db.query(catalog)).rows[0].schema_metadata;
 for(const category of ['tables','columns','constraints','indexes','policies','functions','triggers']) assert.deepEqual(after[category],before[category],category);
 for(const table of tables) for(const g of await matrix(table)) assert.equal(g.allowed,excess.includes(g.privilege)&&g.role!=='service_role'?false:matrices[table].find(a=>a.role===g.role&&a.privilege===g.privilege).allowed,`${table} ${g.role} ${g.privilege}`);
 assert.deepEqual(await matrix('analytics_events'),analytics);
 await behavior();
 await db.exec('set role fixture_owner; create table public.hardening_future_probe(id uuid)');
 for(const role of ['anon','authenticated','public_probe']) for(const privilege of excess) assert.equal((await db.query("select has_table_privilege($1,'hardening_future_probe',$2) allowed",[role,privilege])).rows[0].allowed,false);
 assert.deepEqual(after.default_grants.filter(g=>g.owner==='supabase_admin'),before.default_grants.filter(g=>g.owner==='supabase_admin'));
 assert.deepEqual(after.default_grants.filter(g=>g.grantee==='service_role'),before.default_grants.filter(g=>g.grantee==='service_role'));
 await db.exec('set role fixture_owner');
 await assert.rejects(db.exec('alter default privileges for role supabase_admin in schema public revoke truncate on tables from anon'),{code:'42501'});
 console.log('PASS: snapshot ACL reproduction; all eight privileges before/after; authenticated own CRUD and cross-user RLS denial before/after; feedback UPDATE/DELETE denied; functions/triggers/RLS unchanged; analytics/service grants unchanged; future postgres tables hardened; proposal runs as non-superuser owner (postgres mapped to fixture_owner); unrelated supabase_admin defaults unchanged and require separate authority.');
}finally{await db.close();}

// Independently execute the active SQL bytes unchanged with the literal postgres owner.
const exactDb = new PGlite();
try {
 await exactDb.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;`);
 for (const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql') && f < '202609250002').sort()) await exactDb.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
 for (const g of snapshot.table_grants.filter(g=>tables.includes(g.table) && g.grantee!=='postgres')) await exactDb.exec(`grant ${g.privilege} on public.${g.table} to ${grantee(g.grantee)}`);
 for (const g of snapshot.default_grants.filter(g=>g.object_type==='r' && g.owner==='postgres')) await exactDb.exec(`alter default privileges for role postgres in schema public grant ${g.privilege} on tables to ${grantee(g.grantee)}`);
 const before=(await exactDb.query(catalog)).rows[0].schema_metadata;
 await exactDb.exec(readFileSync('supabase/migrations/202609250002_runtime_table_privilege_hardening.sql','utf8'));
 const after=(await exactDb.query(catalog)).rows[0].schema_metadata;
 for (const category of ['tables','columns','constraints','indexes','policies','functions','triggers']) assert.deepEqual(after[category],before[category]);
 for (const table of tables) for (const role of ['anon','authenticated','service_role']) for (const privilege of privileges) {
  const allowed=(await exactDb.query('select has_table_privilege($1,$2,$3) allowed',[role,`public.${table}`,privilege])).rows[0].allowed;
  const expected=excess.includes(privilege) && role!=='service_role' ? false : snapshot.table_grants.some(g=>g.table===table && g.grantee===role && g.privilege===privilege);
  assert.equal(allowed,expected,`${table} ${role} ${privilege}`);
 }
 assert.deepEqual(after.table_grants.filter(g=>g.table==='analytics_events'),before.table_grants.filter(g=>g.table==='analytics_events'));
 await exactDb.exec('create table public.exact_future_probe(id uuid)');
 for (const role of ['anon','authenticated']) for (const privilege of excess) assert.equal((await exactDb.query("select has_table_privilege($1,'public.exact_future_probe',$2) allowed",[role,privilege])).rows[0].allowed,false);
 console.log('PASS: exact active migration bytes executed unchanged; literal postgres defaults and all eight runtime privileges verified; analytics and schema definitions unchanged.');
} finally {await exactDb.close();}
