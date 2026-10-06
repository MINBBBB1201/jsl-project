import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [before, after, output] = process.argv.slice(2);
if (!before || !after || !output) throw new Error('Usage: node image-diff.mjs before.png after.png output.png');
const [a, b] = await Promise.all([before, after].map(file => sharp(file).toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
if (a.info.width !== b.info.width || a.info.height !== b.info.height) throw new Error('Capture dimensions differ. Capture both at the same viewport; do not resize the evidence.');
const { width, height } = a.info;
const difference = Buffer.alloc(width * height * 4);
const changedPixels = pixelmatch(a.data, b.data, difference, width, height, { threshold: 0.1 });
await mkdir(path.dirname(path.resolve(output)), { recursive: true });
await sharp(difference, { raw: { width, height, channels: 4 } }).png().toFile(output);
const report = { before: path.resolve(before), after: path.resolve(after), output: path.resolve(output), width, height, changedPixels, changedRatio: changedPixels / (width * height), threshold: 0.1, note: 'Pixel differences do not certify design quality, equipment contact or motion continuity.' };
await writeFile(`${output}.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
