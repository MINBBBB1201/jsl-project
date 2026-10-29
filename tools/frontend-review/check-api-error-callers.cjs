const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { execFileSync } = require('node:child_process');
const repo = path.resolve(__dirname, '../..');
const outputIndex = process.argv.indexOf('--output');
const outputFile = outputIndex < 0 ? null : process.argv[outputIndex + 1];
if (outputIndex >= 0 && !outputFile) throw new Error('--output requires a path');
const ts = createRequire(path.join(repo, 'frontend/package.json'))('typescript');
const base = 'c8c5489a662ae9aab354335483332116f1962072';
const paths = {
  auth: 'frontend/src/lib/auth.ts',
  dashboard: 'frontend/src/app/(dashboard)/dashboard/use-async-resource.ts',
  helper: 'frontend/src/lib/api-error.ts',
};
const report = { base, method: 'Actual apiFetch and exported dashboard request source, TypeScript transpilation and import adapters; fetch/DOM fixtures only, no HTTP or React rendering.', beforeCommonMessages: [], after: [] };
function make(phase) {
  let response;
  const document = { cookie: '' };
  const cache = {};
  const read = file => phase === 'before' ? execFileSync('git', ['-C', repo, 'show', `${base}:${file}`], { encoding: 'utf8' }) : fs.readFileSync(path.join(repo, file), 'utf8');
  function load(key) {
    if (cache[key]) return cache[key];
    const module = { exports: {} };
    const js = ts.transpileModule(read(paths[key]), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(js, {
      module, exports: module.exports, Headers, document,
      fetch: async () => response,
      require(name) {
        if (name === '@/lib/api') return { API_BASE_URL: 'https://fixture.invalid' };
        if (name === '@/lib/api-error') return load('helper');
        if (name === '@/lib/auth') return load('auth');
        if (name === 'react') return {}; // No hook is executed by exported request().
        throw new Error('Unexpected import: ' + name);
      },
    }, { filename: paths[key] });
    cache[key] = module.exports;
    return module.exports;
  }
  const auth = load('auth');
  const dashboard = load('dashboard');
  return {
    document, auth,
    call(name, body, status, raw = false) {
      response = new Response(raw ? body : JSON.stringify(body), { status, headers: { 'Content-Type': raw ? 'text/html' : 'application/json' } });
      return name === 'auth' ? auth.apiFetch('/fixture') : dashboard.request('/fixture');
    },
  };
}
async function thrown(promise) { try { await promise; throw new Error('Expected API rejection'); } catch (error) { return error; } }
(async () => {
  const before = make('before'), after = make('after');
  for (const [status, message] of [[400, 'Invalid JSON request body.'], [403, 'Request not allowed.'], [404, 'Route not found.'], [413, 'Request body is too large.'], [500, 'Something went wrong!']]) {
    for (const caller of ['auth', 'dashboard']) {
      const body = { status: status < 500 ? 'fail' : 'error', message };
      const oldError = await thrown(before.call(caller, body, status));
      const newError = await thrown(after.call(caller, body, status));
      report.beforeCommonMessages.push({ caller, status, displaysPublicMessage: oldError.message === message });
      assert.equal(newError.message, message);
      if (caller === 'auth') { assert(newError instanceof after.auth.ApiError); assert.equal(newError.status, status); }
      report.after.push({ name: `${caller} fixed public ${status}`, passed: true });
    }
  }
  assert(report.beforeCommonMessages.every(item => !item.displaysPublicMessage));
  for (const caller of ['auth', 'dashboard']) {
    assert.equal((await thrown(after.call(caller, { success: false, error: 'legacy fixture' }, 409))).message, 'legacy fixture');
    report.after.push({ name: `${caller} legacy error`, passed: true });
    const fallback = caller === 'auth' ? '요청에 실패했습니다. (HTTP 500)' : '요청이 실패했습니다. (HTTP 500)';
    for (const [name, body] of [['HTML', '<html>private fixture</html>'], ['empty', '']]) {
      assert.equal((await thrown(after.call(caller, body, 500, true))).message, fallback);
      report.after.push({ name: `${caller} ${name} fallback`, passed: true });
    }
  }
  assert.equal(JSON.stringify(await after.call('auth', { success: true, data: { fixture: true } }, 200)), '{"fixture":true}');
  report.after.push({ name: 'auth success still unwraps data', passed: true });
  assert.equal(JSON.stringify(await after.call('dashboard', { success: true, data: { fixture: true } }, 200)), '{"success":true,"data":{"fixture":true}}');
  report.after.push({ name: 'dashboard success keeps envelope', passed: true });
  after.document.cookie = 'jsl_token=synthetic-fixture';
  const authError = await thrown(after.call('auth', { success: false, error: 'expired fixture', code: 'TOKEN_EXPIRED' }, 403));
  assert.equal(authError.code, 'TOKEN_EXPIRED');
  assert(after.document.cookie.startsWith('jsl_token=;'));
  report.after.push({ name: 'auth failure code and cookie clearing preserved in fixture DOM', passed: true });
  assert.equal((await thrown(after.call('auth', { success: false, error: 'application fixture' }, 200))).message, 'application fixture');
  report.after.push({ name: 'auth application failure on HTTP 200 preserved', passed: true });
  report.limits = ['Tracking hook not mounted or executed; no actual React UI, browser, network, cookie persistence or deployed request tested.', 'Import aliases/API base and unused React imports are adapters; auth/caller response logic is loaded from actual source.'];
  if (outputFile) fs.writeFileSync(outputFile, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ baselineCommonMessagesVisible: 0, baselineCases: report.beforeCommonMessages.length, currentCasesPassed: report.after.length }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
