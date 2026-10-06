import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const result = spawnSync(process.execPath, [path.join(root, 'checkpoint.mjs'), 'verify'], { encoding: 'utf8' });
if (result.error) throw result.error;
const report = JSON.parse(result.stdout.trim());
const allowed = new Set([
  'frontend/src/app/landing/landing-page-content.tsx',
  'frontend/src/app/landing/components/features-section.tsx',
  'frontend/src/app/landing/components/emons-transport.tsx',
  'frontend/src/app/landing/components/emons-transport.css',
  'frontend/public/images/landing/emons/services.mp4',
  'frontend/public/images/landing/emons/poster.webp',
]);
const outside = report.changed.filter(file => !allowed.has(file));
const scoped = { ...report, status: outside.length ? 'unexpected-changes' : 'only-allowed-changes', outside, allowed: [...allowed], note: 'Original checkpoint retained. Frontend hashes cover src, public and frontend configuration. Backend is outside this checkpoint.' };
await writeFile(path.join(root, 'artifacts/emons-scope.json'), JSON.stringify(scoped, null, 2));
console.log(JSON.stringify(scoped));
if (outside.length || ![0, 1].includes(result.status)) process.exitCode = 1;
