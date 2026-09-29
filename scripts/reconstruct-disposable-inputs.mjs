/** Offline only. Derive explicitly labelled fixtures from surviving catalog captures.
 * node scripts/reconstruct-disposable-inputs.mjs <capture-directory> <output-directory>
 * Does not connect to PostgreSQL, read application rows, or derive expected schema from migrations.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const [source,output]=process.argv.slice(2);
assert.ok(source && output,'Supply capture and output directories');
const names=['schema-after-hardening.json','privilege-preflight.json'];
const raw=names.map(name=>readFileSync(join(source,name),'utf8'));
const schema=JSON.parse(raw[0]).rows[0].schema_metadata;
const preflight=JSON.parse(raw[1]).rows[0].privilege_preflight;
assert.equal(schema.connection.read_only,'on');
assert.equal(preflight.context.read_only,'on');
const tables=['tasks','notes','captures','activities','feedback'];
assert.equal(schema.tables.length,6);
const provenance={
 kind:'derived-local-fixture-not-original-historical-snapshot',
 sources:names.map((name,i)=>({name,sha256:createHash('sha256').update(raw[i]).digest('hex')})),
 notes:['Runtime schema projected from post-hardening capture; only named analytics objects removed.',
 'Pre-hardening effective privileges reproduced with synthetic direct grants; not a claim about historical ACL provenance.',
 'postgres default table privileges taken from the preflight capture; other defaults retained from the later capture.']
};
const baseline=structuredClone(schema);
for(const category of ['tables','columns','constraints','indexes','policies','triggers'])
 baseline[category]=baseline[category].filter(row=>tables.includes(category==='tables'?row.name:row.table));
baseline.functions=baseline.functions.filter(row=>row.name==='set_updated_at');
baseline.triggers=baseline.triggers.filter(row=>!['beta_task_activation','beta_feedback_submission'].includes(row.name));
assert.deepEqual(['tables','columns','constraints','indexes','policies','functions','triggers'].map(k=>baseline[k].length),[5,55,31,34,18,1,3]);
baseline.effective_grants=schema.effective_grants.filter(g=>tables.includes(g.table));
for(const row of baseline.effective_grants) for(const privilege of ['select','insert','update','delete','truncate','references','trigger']) {
 const captured=preflight.effective_grants.find(g=>g.table===row.table&&g.role===row.role&&g.privilege===privilege.toUpperCase());
 assert.ok(captured);row[privilege]=captured.allowed;
}
baseline.table_grants=schema.table_grants.filter(g=>g.grantee==='postgres'&&tables.includes(g.table));
for(const g of preflight.effective_grants.filter(g=>tables.includes(g.table)&&g.allowed))
 baseline.table_grants.push({table:g.table,grantee:g.role,privilege:g.privilege,grantable:false});
for(const g of preflight.public_grants.filter(g=>tables.includes(g.table)&&g.allowed))
 baseline.table_grants.push({table:g.table,grantee:'PUBLIC',privilege:g.privilege,grantable:false});
baseline.default_grants=schema.default_grants.filter(g=>!(g.owner==='postgres'&&g.object_type==='r'));
for(const g of preflight.postgres_defaults) baseline.default_grants.push({owner:'postgres',object_type:'r',schema:g.schema,grantee:g.grantee,privilege:g.privilege});
mkdirSync(output,{recursive:true});
writeFileSync(join(output,'reconstructed-baseline.json'),JSON.stringify({provenance,rows:[{schema_metadata:baseline}]},null,2)+'\n');
console.log('Reconstructed local fixture: captured schema projection and effective ACLs; original captures unchanged.');
