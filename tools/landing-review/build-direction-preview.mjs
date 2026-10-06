import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const directory = 'C:/Users/mimin/.codex/visualizations/2026/09/15/01a0a4cd-b26a-7f80-a32c-befc97923b12';
const imageDirectory = 'C:/Users/mimin/.codex/generated_images/01a0a4cd-b26a-7f80-a32c-befc97923b12';
const originals = [
  `${imageDirectory}/exec-6e0be662-a672-4bf2-9657-c266f0a04250.png`,
  `${imageDirectory}/exec-0953601a-d1a0-4c51-8607-61c12b24aa87.png`,
];
let fragment = await readFile(`${directory}/jsl-original-directions.template.html`, 'utf8');
const images = [];
for (const [index, file] of originals.entries()) {
  const metadata = await sharp(file).metadata();
  // Display encoding only. Do not crop, retouch or alter the generated composition.
  const buffer = await sharp(file).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  fragment = fragment.replace(index === 0 ? '__INDUSTRIAL__' : '__MINIATURE__', `data:image/jpeg;base64,${buffer.toString('base64')}`);
  images.push({ file, width: metadata.width, height: metadata.height, displayBytes: buffer.length });
}
if (fragment.includes('__INDUSTRIAL__') || fragment.includes('__MINIATURE__')) throw new Error('Missing inline image.');
if (Buffer.byteLength(fragment) >= 1_000_000) throw new Error('Preview exceeds inline size limit.');
const output = `${directory}/jsl-original-directions.html`;
await writeFile(output, fragment);
console.log(JSON.stringify({ output, bytes: Buffer.byteLength(fragment), images }));
