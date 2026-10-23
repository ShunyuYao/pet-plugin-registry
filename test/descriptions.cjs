'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { description, updateDescription, fetchManifest } = require('../scripts/sync-description.cjs');
const index = require('../registry/plugins.json');
test('every registered plugin has a short description', () => {
  for (const entry of index.plugins) assert.equal(description(entry.description), entry.description, entry.id);
});
test('description sync preserves all installation metadata and the input', () => {
  const original = structuredClone(index), entry = index.plugins[0];
  const next = updateDescription(index, entry.id, {id:entry.id, version:entry.version, description:'  新用途。  ', permissions:['untrusted'], download:'untrusted'});
  assert.deepEqual(index, original);
  assert.deepEqual(next, {...index, plugins:index.plugins.map(p=>p.id===entry.id?{...p,description:'新用途。'}:p)});
});
test('missing/malformed metadata and mismatched releases cannot replace good descriptions', () => {
  const entry = index.plugins[0];
  for (const value of [undefined, null, {}, [], 42, '', '  ', 'x\ny', 'x'.repeat(201)]) assert.throws(()=>description(value));
  assert.equal(description('🐶'.repeat(200)), '🐶'.repeat(200));
  for (const m of [{id:'wrong',version:entry.version,description:'x'}, {id:entry.id,version:'999.0.0',description:'x'}]) assert.throws(()=>updateDescription(index,entry.id,m));
  assert.throws(()=>updateDescription({plugins:[entry,entry]},entry.id,entry));
});
test('fetch pins the registered repository and reviewed commit; network failures are errors', async () => {
  const entry = index.plugins[0], ref='a'.repeat(40);
  await fetchManifest(entry,ref,async(url,opts)=>{assert.equal(url,`https://api.github.com/repos/${entry.repo}/contents/manifest.json?ref=${ref}`);assert.equal(opts.redirect,'error');return {ok:true,text:async()=>JSON.stringify(entry)};});
  await assert.rejects(fetchManifest(entry,'main'));
  await assert.rejects(fetchManifest({...entry,repo:'https://other.example'},ref));
  await assert.rejects(fetchManifest(entry,ref,async()=>({ok:false,status:404})));
  await assert.rejects(fetchManifest(entry,ref,async()=>({ok:true,text:async()=>'invalid JSON'})));
});
