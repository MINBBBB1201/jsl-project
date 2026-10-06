import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'artifacts/playwright');
const phases = ['entry', 'middle', 'exit'];
for (const width of [1440, 390]) {
  const tileWidth = width === 1440 ? 720 : 390;
  const tileHeight = width === 1440 ? 450 : 844;
  const images = [];
  for (const [row, phase] of phases.entries()) {
    for (const [column, source] of ['emons', 'jsl'].entries()) {
      images.push({ input: await sharp(path.join(root, `${source}-${width}-${phase}-1.png`)).resize(tileWidth, tileHeight).png().toBuffer(), left: column * tileWidth, top: row * tileHeight });
    }
  }
  await sharp({ create: { width: tileWidth * 2, height: tileHeight * 3, channels: 4, background: '#fff' } }).composite(images).png().toFile(path.join(root, `comparison-${width}.png`));
}
for (const width of [1440, 390]) {
  const w = width === 1440 ? 288 : 156;
  const h = width === 1440 ? 180 : 338;
  const images = [];
  for (let n = 0; n <= 40; n++) images.push({ input: await sharp(path.join(root, `scan-ko-${width}-${String(n).padStart(2, '0')}.jpg`)).resize(w, h).toBuffer(), left: (n % 5) * w, top: Math.floor(n / 5) * h });
  await sharp({ create: { width: w * 5, height: h * 9, channels: 4, background: '#fff' } }).composite(images).png().toFile(path.join(root, `scan-sheet-${width}.png`));
}
let html = '<!doctype html><html lang="ko"><meta charset="utf-8"><title>Emons → JSL 실제 캡처 비교</title><style>body{font:16px system-ui;margin:24px;background:#eee;color:#111}h1{font-size:26px}section{margin:40px 0}table{width:100%;border-collapse:collapse;table-layout:fixed}td,th{padding:8px;border:1px solid #ccc;vertical-align:top}img{width:100%;height:auto;background:white}small{display:block;margin:8px 0}a{color:#0645ad}summary{cursor:pointer;padding:12px;background:white}</style><h1>Emons → JSL — 서비스 슬라이드 검수</h1><p>왼쪽: Emons 원본 / 오른쪽: JSL. 같은 화면 크기, 같은 영상 시점. 진입·중간·퇴장 각 5장.</p><p>원본 미디어 요청에는 동일 영상 캐시를 공급했습니다. 정지 비교와 실제 스크롤 재생 검수는 구분합니다.</p>';
for (const width of [1440, 390]) {
  html += `<section><h2>${width} × ${width === 1440 ? 900 : 844}</h2><table><tr><th>Emons 원본</th><th>JSL</th></tr>`;
  for (const phase of phases) for (let n = 1; n <= 5; n++) html += `<tr><td><small>${phase} ${n}/5</small><img loading="lazy" src="emons-${width}-${phase}-${n}.png"></td><td><small>${phase} ${n}/5</small><img loading="lazy" src="jsl-${width}-${phase}-${n}.png"></td></tr>`;
  html += `</table><details><summary>2.5% 간격 전체 41 프레임</summary><img src="scan-sheet-${width}.png"></details></section>`;
}
html += '<section><h2>다국어 상세 펼침 검사</h2>';
const localeData = JSON.parse(await readFile(path.join(root, 'locale-review.json'), 'utf8'));
for (const locale of ['en', 'zh', 'vi']) {
  html += `<details><summary>${locale} — 운송 모드 전체</summary>`;
  for (const frame of localeData.filter(x => x.locale === locale)) html += `<small>${locale} ${frame.width}px / mode ${frame.active + 1}</small><img loading="lazy" src="${frame.file}">`;
  html += '</details>';
}
html += '</section></html>';
await writeFile(path.join(root, 'emons-review.html'), html);
console.log(JSON.stringify({ gallery: path.join(root, 'emons-review.html'), comparisons: ['comparison-1440.png', 'comparison-390.png'], scanSheets: ['scan-sheet-1440.png', 'scan-sheet-390.png'] }));
