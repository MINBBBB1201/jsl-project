import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const tool = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(tool, '../..');
const baseline = path.join(tool, 'artifacts/emons-freezpak-baseline.json');
const files = {};
async function walk(relative) {
  for (const entry of await readdir(path.join(project, relative), { withFileTypes: true })) {
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) await walk(name);
    else files[name] = createHash('sha256').update(await readFile(path.join(project, name))).digest('hex');
  }
}
await walk('frontend/src');
await walk('frontend/public');
for (const relative of ['frontend/package.json', 'frontend/package-lock.json', 'frontend/next.config.ts', 'frontend/tsconfig.json', 'backend/package.json', 'backend/package-lock.json']) files[relative] = createHash('sha256').update(await readFile(path.join(project, relative))).digest('hex');
if (process.argv[2] === 'save') {
  await writeFile(baseline, JSON.stringify({ createdAt: new Date().toISOString(), files }, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ status: 'saved', files: Object.keys(files).length }));
} else {
  const saved = JSON.parse(await readFile(baseline, 'utf8'));
  const allowed = new Set(['frontend/src/app/landing/landing-page-content.tsx', 'frontend/src/app/landing/components/emons-transport.tsx', 'frontend/src/app/landing/components/emons-transport.css', 'frontend/src/app/landing/components/freezpak-lifecycle.tsx', 'frontend/src/app/landing/components/freezpak-lifecycle.css', 'frontend/package.json', 'frontend/package-lock.json']);
  const changed = [...new Set([...Object.keys(files), ...Object.keys(saved.files)])].filter(name => files[name] !== saved.files[name]);
  const outside = changed.filter(name => !allowed.has(name) && !name.startsWith('frontend/public/images/landing/freezpak/') && !name.startsWith('frontend/public/fonts/landing-reference/'));
  const report = { status: outside.length ? 'unexpected-changes' : 'only-allowed-changes', changed, outside, preserved: Object.keys(saved.files).length - changed.filter(name => name in saved.files).length };
  await writeFile(path.join(tool, 'artifacts/emons-freezpak-scope.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (outside.length) process.exitCode = 1;
}
