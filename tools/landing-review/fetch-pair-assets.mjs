import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const cdn = 'https://cdn.prod.website-files.com/';
const assets = [
 ['images/landing/freezpak/desktop.json', cdn+'660eb6abe8cde3bea6a9c111/6669c2d77776396910ac1f10_freezpak-logistics.json'],
 ['images/landing/freezpak/mobile.json', cdn+'660eb6abe8cde3bea6a9c111/666ab8b5b624df6d15a73b5d_freezpak-logistics-mobile.json'],
 ['fonts/landing-reference/ClashGrotesk-Regular.woff2', cdn+'66c856a2e1e5dc372a191eaa/67040024f9f32da66ec8952e_ClashGrotesk-Regular.woff2'],
 ['fonts/landing-reference/ClashGrotesk-Medium.woff2', cdn+'66c856a2e1e5dc372a191eaa/671a79fb19670e966650540a_ClashGrotesk-Medium.woff2'],
 ['fonts/landing-reference/ClashGrotesk-Semibold.woff2', cdn+'66c856a2e1e5dc372a191eaa/671a79fbfd6f29e2e55ea499_ClashGrotesk-Semibold.woff2'],
 ['fonts/landing-reference/MonaSansCondensed-ExtraBold.woff2', cdn+'660eb6abe8cde3bea6a9c111/662646f307b4e0712180d7ba_MonaSansCondensed-ExtraBold.woff2'],
 ['fonts/landing-reference/MonaSans-Variable.woff2', cdn+'660eb6abe8cde3bea6a9c111/6626479bda0f1f7e5f00f607_MonaSans%5Bslnt%2Cwdth%2Cwght%5D.woff2'],
 ['fonts/landing-reference/MonaSans-LICENSE.txt', 'https://raw.githubusercontent.com/github/mona-sans/main/LICENSE'],
];
const results = await Promise.allSettled(assets.map(async ([file,url]) => {
 const response = await fetch(url); if (!response.ok) throw new Error(`${file}: ${response.status}`);
 const body = Buffer.from(await response.arrayBuffer());
 const output = path.join(root, 'frontend/public', file);
 await mkdir(path.dirname(output), { recursive: true }); await writeFile(output, body);
 return { file, url, bytes: body.length };
}));
for (const result of results) console.log(JSON.stringify(result.status === 'fulfilled' ? result.value : { error: result.reason.message }));
await writeFile(path.join(root,'tools/landing-review/artifacts/pair-assets.json'),JSON.stringify(results.filter(r=>r.status==='fulfilled').map(r=>r.value),null,2));
if(results.some(r=>r.status==='rejected')) process.exitCode=1;
