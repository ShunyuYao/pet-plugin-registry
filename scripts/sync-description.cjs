'use strict';
// Metadata only: never updates versions, downloads, hashes or permissions.
const fs = require('node:fs');
const path = require('node:path');
function description(value) {
  if (typeof value !== 'string' || !value.trim() || [...value.trim()].length > 200 || /[\r\n\x00-\x1f\x7f]/.test(value)) {
    throw new Error('description must be one non-empty line, at most 200 Unicode code points');
  }
  return value.trim();
}
function updateDescription(index, id, manifest) {
  const rows = index.plugins.filter(p => p.id === id);
  if (rows.length !== 1) throw new Error('Expected exactly one registered plugin: ' + id);
  if (manifest.id !== id || manifest.version !== rows[0].version) throw new Error('Manifest id/version must match the registered release');
  const text = description(manifest.description);
  return { ...index, plugins: index.plugins.map(p => p.id === id ? { ...p, description: text } : p) };
}
async function fetchManifest(entry, ref, fetchImpl = fetch) {
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(entry.repo) || entry.repo.includes('..')) throw new Error('Invalid registered GitHub repository');
  if (!/^[a-f0-9]{40}$/i.test(ref || '')) throw new Error('--ref must be a full reviewed Git commit SHA');
  const url = `https://api.github.com/repos/${entry.repo}/contents/manifest.json?ref=${ref}`;
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(15000), redirect: 'error', headers: { Accept: 'application/vnd.github.raw+json', 'User-Agent': 'pet-plugin-registry' } });
  if (!response.ok) throw new Error(`Manifest fetch failed: HTTP ${response.status}`);
  const body = await response.text();
  if (Buffer.byteLength(body) > 65536) throw new Error('Manifest exceeds 64 KiB');
  return JSON.parse(body);
}
async function main(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--write') options.write = true;
    else if (['--id', '--ref', '--manifest'].includes(key) && args[i + 1] && !args[i + 1].startsWith('--')) options[key.slice(2)] = args[++i];
    else throw new Error('Usage: npm run sync:description -- --id ID (--ref SHA | --manifest LOCAL_FILE) [--write]');
  }
  if (!options.id || !!options.ref === !!options.manifest) throw new Error('Provide --id and exactly one of --ref / --manifest');
  const file = path.join(__dirname, '../registry/plugins.json');
  const index = JSON.parse(fs.readFileSync(file, 'utf8'));
  const entry = index.plugins.find(p => p.id === options.id);
  if (!entry) throw new Error('Plugin is not registered');
  const manifest = options.manifest ? JSON.parse(fs.readFileSync(options.manifest, 'utf8')) : await fetchManifest(entry, options.ref);
  const next = updateDescription(index, options.id, manifest);
  console.log(JSON.stringify({ id: entry.id, source: options.ref ? `${entry.repo}@${options.ref}` : 'local preview', before: entry.description || '', after: next.plugins.find(p => p.id === entry.id).description }, null, 2));
  if (options.write) fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
}
module.exports = { description, updateDescription, fetchManifest };
if (require.main === module) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
