import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const tool = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(tool, '../..');
const baseline = path.join(tool, 'artifacts/original-direction-preview-baseline.json');
const files = {};
async function walk(relative) {
  for (const entry of await readdir(path.join(project, relative), { withFileTypes: true })) {
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) await walk(name);
    else if (entry.isFile()) files[name] = createHash('sha256').update(await readFile(path.join(project, name))).digest('hex');
  }
}
for (const directory of ['frontend/src', 'frontend/public', 'backend/src']) await walk(directory);
for (const relative of ['frontend/package.json', 'frontend/package-lock.json', 'frontend/next.config.ts', 'frontend/tsconfig.json', 'backend/package.json', 'backend/package-lock.json']) {
  files[relative] = createHash('sha256').update(await readFile(path.join(project, relative))).digest('hex');
}
if (process.argv[2] === 'save') {
  await writeFile(baseline, JSON.stringify({ createdAt: new Date().toISOString(), scope: 'Entire existing frontend source/public/config and backend source/package files; preview and review tools excluded.', files }, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ status: 'saved', files: Object.keys(files).length }));
} else {
  const saved = JSON.parse(await readFile(baseline, 'utf8'));
  const changed = [...new Set([...Object.keys(files), ...Object.keys(saved.files)])].filter(name => files[name] !== saved.files[name]);
  const report = { checkedAt: new Date().toISOString(), status: changed.length ? 'changed' : 'unchanged', checkedFiles: Object.keys(saved.files).length, changed };
  await writeFile(path.join(tool, 'artifacts/original-direction-preview-scope.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (changed.length) process.exitCode = 1;
}
