import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(toolRoot, '../..');
const baseline = path.join(toolRoot, 'artifacts/frontend-baseline.json');
const mode = process.argv[2];
if (!['save', 'verify'].includes(mode)) throw new Error('Usage: node checkpoint.mjs save|verify');
const files = new Map();
async function walk(relative) {
  let entries;
  try { entries = await readdir(path.join(projectRoot, relative), { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  for (const entry of entries) {
    const next = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) await walk(next);
    else if (entry.isFile()) files.set(next, createHash('sha256').update(await readFile(path.join(projectRoot, next))).digest('hex'));
  }
}
await walk('frontend/src');
await walk('frontend/public');
for (const name of ['package.json', 'package-lock.json', 'next.config.ts', 'next.config.mjs', 'tsconfig.json', 'postcss.config.mjs']) {
  const relative = `frontend/${name}`;
  try { files.set(relative, createHash('sha256').update(await readFile(path.join(projectRoot, relative))).digest('hex')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const current = Object.fromEntries([...files.entries()].sort(([a], [b]) => a.localeCompare(b)));
if (mode === 'save') {
  await mkdir(path.dirname(baseline), { recursive: true });
  // Do not silently replace the previous checkpoint.
  await writeFile(baseline, JSON.stringify({ createdAt: new Date().toISOString(), projectRoot, files: current }, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ status: 'saved', files: files.size, baseline }));
} else {
  const saved = JSON.parse(await readFile(baseline, 'utf8'));
  const changed = [...new Set([...Object.keys(saved.files), ...Object.keys(current)])].filter(name => saved.files[name] !== current[name]);
  console.log(JSON.stringify({ status: changed.length ? 'changed' : 'unchanged', files: files.size, changed }));
  if (changed.length) process.exitCode = 1;
}
