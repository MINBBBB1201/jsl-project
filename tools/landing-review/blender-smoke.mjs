import { spawnSync } from 'node:child_process';
import { readFile, mkdir, access, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolRoot = path.dirname(fileURLToPath(import.meta.url));
const spec = JSON.parse(await readFile(path.join(toolRoot, 'blender-portable.manifest.json'), 'utf8'));
const binaryFlag = process.argv.indexOf('--binary');
if (binaryFlag >= 0 && !process.argv[binaryFlag + 1]) throw new Error('--binary requires an absolute executable path.');
const binary = binaryFlag >= 0
  ? path.resolve(process.argv[binaryFlag + 1])
  : path.resolve(spec.installRoot, spec.versionDirectory, spec.binaryRelativePath);
try { await access(binary); } catch {
  console.error(JSON.stringify({ status: 'not-installed', binary, reason: spec.reason }));
  process.exit(2);
}
const output = path.join(toolRoot, 'artifacts', `blender-smoke-${Date.now()}`);
await mkdir(output, { recursive: true });
const env = { ...process.env, BLENDER_USER_CONFIG: path.join(output, 'config'), BLENDER_USER_SCRIPTS: path.join(output, 'scripts'), BLENDER_USER_DATAFILES: path.join(output, 'data') };
const run = (executable, args, timeout = 120000) => {
  const result = spawnSync(executable, args, { cwd: toolRoot, windowsHide: true, env, encoding: 'utf8', timeout, maxBuffer: 2 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`${path.basename(executable)} failed (${result.status}): ${result.error?.message ?? result.stderr ?? result.stdout}`);
  return result.stdout;
};
const report = { checkedAt: new Date().toISOString(), status: 'failed', binary, output, scope: 'Synthetic tooling fixture only; no production animation-quality claim.' };
try {
  report.versionOutput = run(binary, ['--background', '--factory-startup', '--version'], 30000).trim();
  if (!report.versionOutput.includes(`Blender ${spec.version}`)) throw new Error('Binary version differs from pinned manifest.');
  report.blenderLog = run(binary, ['--background', '--factory-startup', '--python-exit-code', '1', '--python', path.join(toolRoot, 'blender-smoke.py'), '--', output]);
  report.image = JSON.parse(run(process.execPath, [path.join(toolRoot, 'asset-check.mjs'), path.join(output, 'render.png')]));
  if (!report.image.decoded || report.image.width !== 320 || report.image.height !== 180) throw new Error('Render dimensions or decoding failed.');
  report.model = JSON.parse(run(process.execPath, [path.join(toolRoot, 'asset-check.mjs'), path.join(output, 'fixture.glb')]));
  if (report.model.issues.numErrors !== 0) throw new Error('GLB validator reported errors.');
  report.status = 'passed';
} catch (error) {
  report.error = error.message;
  process.exitCode = 1;
}
await writeFile(path.join(output, 'verification.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: report.status, output, report: path.join(output, 'verification.json'), error: report.error }));
