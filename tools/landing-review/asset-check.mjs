import sharp from 'sharp';
import validator from 'gltf-validator';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const filename = process.argv[2];
if (!filename) throw new Error('Usage: node asset-check.mjs file.glb|file.gltf|image.webp');
const file = path.resolve(filename), extension = path.extname(file).toLowerCase();
const fileStat = await stat(file);
if (['.glb', '.gltf'].includes(extension)) {
  const assetRoot = path.dirname(file);
  const options = { uri: path.basename(file), maxIssues: 100, externalResourceFunction: async uri => {
    if (/^[a-z]+:/i.test(uri)) throw new Error('Remote external resources are not fetched by this checker.');
    const resource = path.resolve(assetRoot, decodeURIComponent(uri));
    const relative = path.relative(assetRoot, resource);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('External resource leaves the asset directory.');
    return new Uint8Array(await readFile(resource));
  } };
  const bytes = await readFile(file);
  const result = extension === '.glb' ? await validator.validateBytes(new Uint8Array(bytes), options) : await validator.validateString(bytes.toString('utf8'), options);
  console.log(JSON.stringify({ file, bytes: fileStat.size, issues: result.issues, info: result.info }));
  if (result.issues.numErrors) process.exitCode = 1;
} else {
  const metadata = await sharp(file).metadata();
  // Decode the full image as well as reading its header.
  await sharp(file).raw().toBuffer();
  console.log(JSON.stringify({ file, bytes: fileStat.size, format: metadata.format, width: metadata.width, height: metadata.height, hasAlpha: metadata.hasAlpha, pages: metadata.pages, decoded: true }));
}
