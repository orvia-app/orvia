import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source = ts.createSourceFile('i18n.ts', readFileSync('src/lib/i18n.ts','utf8'), ts.ScriptTarget.Latest, true);
function dictionary(name) {
 let result;
 function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) {
   let value = node.initializer;
   if (ts.isAsExpression(value)) value = value.expression;
   assert.ok(ts.isObjectLiteralExpression(value));
   const entries = value.properties.map(p => {
    assert.ok(ts.isPropertyAssignment(p) && ts.isStringLiteral(p.name) && ts.isStringLiteral(p.initializer));
    return [p.name.text, p.initializer.text];
   });
   assert.equal(new Set(entries.map(([key])=>key)).size, entries.length, `${name}: duplicate keys`);
   result = Object.fromEntries(entries);
  }
  ts.forEachChild(node,visit);
 }
 visit(source); assert.ok(result); return result;
}
const en=dictionary('en'), ua=dictionary('ua');
test('EN/UA dictionaries have identical keys and no duplicate or empty translations',()=>{
 assert.deepEqual(Object.keys(en).sort(),Object.keys(ua).sort());
 for(const [locale,dict] of Object.entries({en,ua})) for(const [key,value] of Object.entries(dict)) assert.ok(value.trim(),`${locale}.${key}`);
});
test('EN/UA interpolation placeholders agree for every translation',()=>{
 const placeholders=value=>[...value.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map(m=>m[1]).sort();
 for(const key of Object.keys(en)) assert.deepEqual(placeholders(en[key]),placeholders(ua[key]),key);
});
test('English translations contain no accidental Ukrainian text',()=>{
 for(const [key,value] of Object.entries(en)) assert.equal(/[А-Яа-яІіЇїЄєҐґ]/u.test(value),false,key);
});
