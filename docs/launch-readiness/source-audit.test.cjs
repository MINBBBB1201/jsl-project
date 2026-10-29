const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scanText } = require('./source-audit.cjs');

test('commented source links do not become request evidence', () => {
  const result = scanText('sample.tsx', '// https://example.test/source\nexport const label = "No request";');
  assert.deepEqual(result.findings, []);
});
test('URL evidence omits paths, queries and fragments', () => {
  const result = scanText('sample.tsx', 'const image = "https://cdn.example.test/private?name=synthetic#fragment";');
  assert.equal(result.findings[0].origin, 'https://cdn.example.test');
  assert(!JSON.stringify(result).includes('synthetic'));
  assert(!JSON.stringify(result).includes('private'));
});
test('network calls, storage writes and clickable links are distinct', () => {
  const result = scanText('sample.tsx', 'fetch(api); navigator.sendBeacon(api); localStorage.setItem("theme", value); document.cookie = cookie; window.open("https://editor.example.test");');
  assert.equal(result.findings.filter(item => item.kind === 'network-call').length, 2);
  assert.equal(result.findings.filter(item => item.kind === 'window-open-call').length, 1);
  assert.equal(result.findings.filter(item => item.kind === 'cookie-write').length, 1);
  assert.equal(result.findings.filter(item => item.kind === 'storage-call').length, 1);
});
test('iframe, executable script and injected HTML are review locations', () => {
  const result = scanText('sample.tsx', '<><iframe src="/video"/><script src="/code.js"/><div dangerouslySetInnerHTML={content}/></>');
  assert.equal(result.findings.filter(item => item.kind === 'embed-or-script-element').length, 2);
  assert.equal(result.findings.filter(item => item.kind === 'inline-html-review').length, 1);
});
test('tracker imports and lazy imports are found without executing code', () => {
  const result = scanText('sample.tsx', 'import { Analytics } from "@vercel/analytics"; import("./lazy");');
  assert.equal(result.findings.filter(item => item.kind === 'script-or-tracker-import').length, 1);
  assert.deepEqual(result.imports, ['@vercel/analytics', './lazy']);
});
test('remote CSS imports are found while comment URLs are excluded', () => {
  const result = scanText('sample.css', '/* url(https://comment.example.test) */ @import "https://font.example.test/font.css"; .a {background:url(https://image.example.test/image.png)}');
  assert.deepEqual(result.findings.map(item => item.origin), ['https://font.example.test', 'https://image.example.test']);
});
