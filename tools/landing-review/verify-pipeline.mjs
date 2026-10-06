import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import ffmpeg from 'ffmpeg-static';

const root = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(root, 'artifacts/tooling-check');
await mkdir(fixtures, { recursive: true });
function run(script, args, expected = 0) {
  const result = spawnSync(process.execPath, [path.join(root, script), ...args], { windowsHide: true, encoding: 'utf8', timeout: 30000 });
  if (result.status !== expected) throw new Error(`${script}: ${result.error?.message ?? result.stderr ?? result.stdout}`);
  return result.stdout;
}
const pixels = Buffer.alloc(16 * 16 * 4, 255);
await sharp(pixels, { raw: { width: 16, height: 16, channels: 4 } }).png().toFile(path.join(fixtures, 'before.png'));
for (let i = 0; i < 4 * 16 * 4; i += 4) { pixels[i] = 0; pixels[i + 1] = 0; pixels[i + 2] = 0; }
await sharp(pixels, { raw: { width: 16, height: 16, channels: 4 } }).png().toFile(path.join(fixtures, 'after.png'));
run('image-diff.mjs', [path.join(fixtures, 'before.png'), path.join(fixtures, 'after.png'), path.join(fixtures, 'difference.png')]);
const diff = JSON.parse(await readFile(path.join(fixtures, 'difference.png.json'), 'utf8'));
if (!diff.changedPixels) throw new Error('Changed pixels not detected.');
await sharp({ create: { width: 8, height: 8, channels: 4, background: '#fff' } }).png().toFile(path.join(fixtures, 'wrong-size.png'));
run('image-diff.mjs', [path.join(fixtures, 'before.png'), path.join(fixtures, 'wrong-size.png'), path.join(fixtures, 'must-not-resize.png')], 1);
run('asset-check.mjs', [path.join(fixtures, 'before.png')]);
await writeFile(path.join(fixtures, 'valid.gltf'), JSON.stringify({ asset: { version: '2.0' }, scenes: [{}], scene: 0 }));
await writeFile(path.join(fixtures, 'invalid.gltf'), JSON.stringify({ asset: { version: '9.0' } }));
run('asset-check.mjs', [path.join(fixtures, 'valid.gltf')]);
run('asset-check.mjs', [path.join(fixtures, 'invalid.gltf')], 1);
const video = path.join(fixtures, 'sample.mp4');
const encoded = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=orange:s=320x180:r=30', '-t', '1.2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', video], { windowsHide: true, encoding: 'utf8', timeout: 30000 });
if (encoded.status !== 0) throw new Error(encoded.error?.message ?? encoded.stderr);
// Use a fresh extraction directory to retain the no-overwrite rule.
const frameDirectory = path.join(fixtures, `frames-${Date.now()}`);
run('video-frames.mjs', [video, frameDirectory]);
if (!(await readdir(frameDirectory)).some(name => name.endsWith('.png'))) throw new Error('Video frames missing.');
const report = { checkedAt: new Date().toISOString(), status: 'passed', checks: ['image-decode', 'pixel-difference', 'mismatched-dimensions-rejected', 'valid-gltf', 'invalid-gltf-rejected', 'video-encode', 'video-frame-extraction'], scope: 'Synthetic tooling fixtures only; no production visual or animation quality claim.' };
await writeFile(path.join(root, 'artifacts/pipeline-verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
