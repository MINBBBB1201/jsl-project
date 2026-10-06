import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmod, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const tool = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(tool, '../..');
const artifacts = path.join(tool, 'artifacts');
const sourceBaselinePath = path.join(artifacts, 'original-direction-preview-baseline.json');
const baselinePath = path.join(artifacts, 'industrial-baseline.json');
const sealPath = path.join(artifacts, 'industrial-baseline.sha256');
const snapshotPath = path.join(artifacts, 'industrial-entry-original.tsx');
const expectedPath = path.join(artifacts, 'industrial-entry-expected.tsx');
const reportPath = path.join(artifacts, 'industrial-scope.json');
const entryPath = 'frontend/src/app/landing/landing-page-content.tsx';
const newSources = [
  'frontend/src/app/landing/components/industrial-journey.tsx',
  'frontend/src/app/landing/components/industrial-scenes.tsx',
  'frontend/src/app/landing/components/industrial-journey.css',
  'frontend/src/app/landing/components/industrial-motion.ts',
];
const assetPrefix = 'frontend/public/images/landing/industrial/';
const policy = {
  roots: ['frontend', 'backend'],
  excludedDirectories: [
    'frontend/.next', 'frontend/.test-build', 'frontend/node_modules',
    'backend/node_modules', 'backend/logs',
  ],
  excludedFiles: ['frontend/tsconfig.tsbuildinfo', 'backend/.env'],
  newSources,
  assetPrefix,
  entryPath,
};
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const own = (value, key) => Object.hasOwn(value, key);
const permittedNewFile = (name) => newSources.includes(name) || name.startsWith(assetPrefix);
const originalRoots = ['frontend/src/', 'frontend/public/', 'backend/src/'];

function replaceOnce(text, from, to, label) {
  const first = text.indexOf(from);
  if (first < 0 || text.indexOf(from, first + from.length) >= 0) {
    throw new Error('Expected exactly one original ' + label + ' pair.');
  }
  return text.slice(0, first) + to + text.slice(first + from.length);
}

function expectedEntry(original) {
  const text = original.toString('utf8');
  const imports = [
    'import { EmonsTransport } from "./components/emons-transport"',
    'import { FreezpakLifecycle } from "./components/freezpak-lifecycle"',
  ];
  const slots = ['      <EmonsTransport />', '      <FreezpakLifecycle />'];
  function pairIn(source, lines, label) {
    const found = ['\n', '\r\n'].map((newline) => lines.join(newline))
      .filter((pair) => source.includes(pair));
    assert.equal(found.length, 1, 'Expected exactly one original ' + label + ' pair newline form.');
    return found[0];
  }
  const withImport = replaceOnce(text, pairIn(text, imports, 'import'),
    'import { IndustrialJourney } from "./components/industrial-journey"', 'import');
  return Buffer.from(replaceOnce(withImport, pairIn(withImport, slots, 'JSX'), '      <IndustrialJourney />', 'JSX'));
}

async function scan() {
  const files = {};
  const unsupported = [];
  const excludedDirectories = new Set(policy.excludedDirectories);
  const excludedFiles = new Set(policy.excludedFiles);
  async function walk(relative) {
    for (const item of await readdir(path.join(project, relative), { withFileTypes: true })) {
      const name = path.posix.join(relative, item.name);
      if (excludedDirectories.has(name) || excludedFiles.has(name)) continue;
      if (item.isSymbolicLink()) unsupported.push(name);
      else if (item.isDirectory()) await walk(name);
      else if (item.isFile()) files[name] = hash(await readFile(path.join(project, name)));
      else unsupported.push(name);
    }
  }
  for (const root of policy.roots) await walk(root);
  return { files, unsupported };
}

function firstDifference(expected, current) {
  const a = expected.toString('utf8');
  const b = current.toString('utf8');
  let position = 0;
  while (position < Math.min(a.length, b.length) && a[position] === b[position]) position++;
  return {
    characterOffset: position,
    expectedLine: a.slice(0, position).split('\n').length,
    note: 'Entry must match the original bytes or the exact two-pair replacement, including line endings.',
  };
}

function assess(saved, current, entryState, unsupported = []) {
  const protectedFiles = { ...saved.files, ...saved.additionalFiles };
  const changed = [...new Set([...Object.keys(protectedFiles), ...Object.keys(current)])]
    .filter((name) => current[name] !== protectedFiles[name]).sort();
  const outside = changed.filter((name) => {
    if (name === entryPath) return entryState !== 'exact-pair-replacement';
    return own(protectedFiles, name) || !permittedNewFile(name);
  });
  if (entryState === 'unexpected-entry-change' && !outside.includes(entryPath)) outside.push(entryPath);
  outside.push(...unsupported);
  const existingChanges = changed.filter((name) => own(saved.files, name));
  const protectedExcludingEntry = Object.keys(saved.files).filter((name) => name !== entryPath);
  return {
    status: outside.length ? 'unexpected-changes' : 'only-allowed-changes',
    changed,
    outside: [...new Set(outside)].sort(),
    allowedChanges: changed.filter((name) => !outside.includes(name)),
    originalBaselineFiles: Object.keys(saved.files).length,
    unchangedOriginalFiles: Object.keys(saved.files).length - existingChanges.length,
    protectedOriginalFiles: protectedExcludingEntry.length,
    unchangedProtectedOriginalFiles: protectedExcludingEntry
      .filter((name) => current[name] === saved.files[name]).length,
    additionalProtectedFiles: Object.keys(saved.additionalFiles).length,
    unchangedAdditionalFiles: Object.keys(saved.additionalFiles)
      .filter((name) => current[name] === saved.additionalFiles[name]).length,
    entryState,
  };
}

function classifyEntry(bytes, original, expected) {
  if (bytes.equals(original)) return 'original-preserved';
  if (bytes.equals(expected)) return 'exact-pair-replacement';
  return 'unexpected-entry-change';
}

async function init() {
  try {
    await readFile(baselinePath);
    throw new Error('Industrial baseline already exists. It is immutable and cannot be overwritten.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const sourceBytes = await readFile(sourceBaselinePath);
  const source = JSON.parse(sourceBytes);
  assert.equal(Object.keys(source.files).length, 692, 'Original preview baseline must contain 692 files.');
  const original = await readFile(snapshotPath);
  assert.equal(hash(original), source.files[entryPath], 'Entry snapshot differs from the original 692-file baseline.');
  const expected = expectedEntry(original);
  const current = await scan();
  assert.equal(current.unsupported.length, 0, 'Unsupported filesystem entries found.');
  for (const name of Object.keys(source.files)) {
    assert(!permittedNewFile(name), 'A purported new industrial file already exists in the original baseline: ' + name);
    if (name !== entryPath) {
      assert.equal(current.files[name], source.files[name], 'Protected file already changed before initialization: ' + name);
    }
  }
  const currentEntry = await readFile(path.join(project, entryPath));
  const entryState = classifyEntry(currentEntry, original, expected);
  assert.notEqual(entryState, 'unexpected-entry-change', 'Entry already contains an unapproved change.');
  const initialUnknown = Object.keys(current.files).filter((name) =>
    !own(source.files, name) && !permittedNewFile(name) &&
    originalRoots.some((root) => name.startsWith(root)));
  assert.equal(initialUnknown.length, 0, 'Unapproved new files already exist: ' + initialUnknown.join(', '));
  const additionalFiles = Object.fromEntries(Object.entries(current.files).filter(([name]) =>
    !own(source.files, name) && !permittedNewFile(name)));
  const saved = {
    format: 1,
    createdAt: new Date().toISOString(),
    sourceBaseline: 'artifacts/original-direction-preview-baseline.json',
    sourceBaselineSha256: hash(sourceBytes),
    sourceBaselineCreatedAt: source.createdAt,
    scope: 'Original 692 hashes unchanged; exact entry pair replacement; four new component files and new industrial assets only. Existing authored root configuration, frontend scripts, and backend tests are additionally protected.',
    policy,
    entry: {
      originalSnapshot: 'artifacts/industrial-entry-original.tsx',
      expectedSnapshot: 'artifacts/industrial-entry-expected.tsx',
      originalSha256: hash(original),
      expectedSha256: hash(expected),
      replacement: 'Two consecutive Emons/Freezpak import lines become one IndustrialJourney import; their two consecutive JSX slots become one IndustrialJourney slot. Every other byte is preserved.',
    },
    files: source.files,
    additionalFiles,
    initiallyPresentAllowedFiles: Object.keys(current.files).filter(permittedNewFile).sort(),
  };
  try {
    await writeFile(expectedPath, expected, { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    assert((await readFile(expectedPath)).equals(expected), 'Existing expected snapshot is different.');
  }
  const bytes = Buffer.from(JSON.stringify(saved, null, 2) + '\n');
  await writeFile(baselinePath, bytes, { flag: 'wx' });
  await writeFile(sealPath, hash(bytes) + '\n', { flag: 'wx' });
  for (const file of [snapshotPath, expectedPath, baselinePath, sealPath]) await chmod(file, 0o444);
  console.log(JSON.stringify({
    status: 'saved-immutable-baseline',
    originalFiles: Object.keys(saved.files).length,
    additionalProtectedFiles: Object.keys(additionalFiles).length,
    entryState,
    baselineSha256: hash(bytes),
    initiallyPresentAllowedFiles: saved.initiallyPresentAllowedFiles,
  }, null, 2));
}

async function verify() {
  const baselineBytes = await readFile(baselinePath);
  const saved = JSON.parse(baselineBytes);
  const sourceBytes = await readFile(sourceBaselinePath);
  const source = JSON.parse(sourceBytes);
  const original = await readFile(snapshotPath);
  const expected = expectedEntry(original);
  const storedExpected = await readFile(expectedPath);
  const integrityErrors = [];
  if (hash(baselineBytes) !== (await readFile(sealPath, 'utf8')).trim()) integrityErrors.push('Industrial baseline seal mismatch.');
  if (saved.format !== 1 || JSON.stringify(saved.policy) !== JSON.stringify(policy)) integrityErrors.push('Industrial policy mismatch.');
  if (hash(sourceBytes) !== saved.sourceBaselineSha256) integrityErrors.push('Original preview baseline changed.');
  if (JSON.stringify(source.files) !== JSON.stringify(saved.files) || Object.keys(saved.files).length !== 692) integrityErrors.push('Original 692 hashes changed.');
  if (hash(original) !== saved.entry.originalSha256 || hash(original) !== source.files[entryPath]) integrityErrors.push('Original entry snapshot changed.');
  if (hash(expected) !== saved.entry.expectedSha256 || !storedExpected.equals(expected)) integrityErrors.push('Expected entry snapshot changed.');
  const current = await scan();
  let currentEntry = Buffer.alloc(0);
  try {
    currentEntry = await readFile(path.join(project, entryPath));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const entryState = classifyEntry(currentEntry, original, expected);
  const assessment = assess(saved, current.files, entryState, current.unsupported);
  const report = {
    checkedAt: new Date().toISOString(),
    ...assessment,
    status: integrityErrors.length ? 'integrity-failed' : assessment.status,
    integrityErrors,
    sourceBaselineIntact: hash(sourceBytes) === saved.sourceBaselineSha256,
    baselineSha256: hash(baselineBytes),
    entry: {
      path: entryPath,
      state: entryState,
      actualSha256: hash(currentEntry),
      originalSha256: saved.entry.originalSha256,
      expectedSha256: saved.entry.expectedSha256,
      remainderPreserved: entryState !== 'unexpected-entry-change',
      ...(entryState === 'unexpected-entry-change' ? { firstDifference: firstDifference(expected, currentEntry) } : {}),
    },
    checkedRoots: policy.roots,
    excludedDirectories: policy.excludedDirectories,
    excludedFiles: policy.excludedFiles,
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (report.outside.length || integrityErrors.length) process.exitCode = 1;
}

function selfTest() {
  const original = Buffer.from(
    'import { EmonsTransport } from "./components/emons-transport"\r\n' +
    'import { FreezpakLifecycle } from "./components/freezpak-lifecycle"\r\n' +
    '  <JourneyHeroMotion />\r\n      <EmonsTransport />\r\n      <FreezpakLifecycle />\r\n  <JourneyOcean />\r\n');
  const expected = expectedEntry(original);
  const hero = 'frontend/src/app/landing/components/journey-hero-motion.tsx';
  const mixedOriginal = Buffer.from(original.toString().replaceAll('\r\n', '\n') + '\r\n');
  const mixedExpected = Buffer.from(expected.toString().replaceAll('\r\n', '\n') + '\r\n');
  assert(expectedEntry(mixedOriginal).equals(mixedExpected), 'Mixed original line endings must be preserved.');
  const asset = 'frontend/public/images/landing/preserved.glb';
  const config = 'frontend/next.config.ts';
  const backend = 'backend/src/api.js';
  const extra = 'frontend/eslint.config.mjs';
  const saved = {
    files: { [entryPath]: hash(original), [hero]: 'hero', [asset]: 'asset', [config]: 'config', [backend]: 'backend' },
    additionalFiles: { [extra]: 'extra' },
  };
  const base = { ...saved.files, ...saved.additionalFiles };
  let checks = 1;
  function check(current, bytes, shouldPass, label, unsupported = []) {
    const state = classifyEntry(bytes, original, expected);
    const result = assess(saved, current, state, unsupported);
    assert.equal(result.outside.length === 0, shouldPass, label);
    checks++;
  }
  check(base, original, true, 'Unchanged source passes.');
  check({ ...base, [entryPath]: hash(expected), [newSources[0]]: 'new', [assetPrefix + 'truck.glb']: 'new' },
    expected, true, 'Exact replacement and approved additions pass.');
  const altered = Buffer.from(expected.toString().replace('JourneyHeroMotion', 'DifferentHero'));
  check({ ...base, [entryPath]: hash(altered) }, altered, false, 'Changing another entry slot fails.');
  const reformatted = Buffer.from(expected.toString().replaceAll('\r\n', '\n'));
  check({ ...base, [entryPath]: hash(reformatted) }, reformatted, false, 'Reformatting the entry remainder fails.');
  for (const [name, label] of [[hero, 'hero'], [asset, 'existing asset'], [config, 'config'], [backend, 'backend'], [extra, 'additional config']]) {
    check({ ...base, [name]: 'changed' }, original, false, 'Changing ' + label + ' fails.');
  }
  const deleted = { ...base };
  delete deleted[backend];
  check(deleted, original, false, 'Deleting preserved backend source fails.');
  check({ ...base, 'frontend/src/app/unapproved.tsx': 'new' }, original, false, 'An unrelated new frontend source fails.');
  check({ ...base, 'backend/new-config.json': 'new' }, original, false, 'An unrelated new backend file fails.');
  check(base, original, false, 'Symlink assets fail.', [assetPrefix + 'linked.glb']);
  console.log(JSON.stringify({ status: 'self-test-passed', checks }));
}

const mode = process.argv[2] ?? 'verify';
try {
  if (mode === 'init') await init();
  else if (mode === 'verify') await verify();
  else if (mode === 'self-test') selfTest();
  else throw new Error('Usage: node tools/landing-review/industrial-scope.mjs init|verify|self-test');
} catch (error) {
  const failure = { checkedAt: new Date().toISOString(), status: 'scope-check-failed', error: error.message };
  if (mode === 'verify') {
    try { await writeFile(reportPath, JSON.stringify(failure, null, 2) + '\n'); } catch {}
  }
  console.error(JSON.stringify(failure, null, 2));
  process.exitCode = 1;
}
