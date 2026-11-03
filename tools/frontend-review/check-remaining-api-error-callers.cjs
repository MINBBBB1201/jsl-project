// Fixture check for the API error callers of issue #45 (read-only, no network).
// Runs the real caller source (transpiled TypeScript in a vm sandbox) against fake Response fixtures,
// once for the base commit and once for the working tree, and compares the message each caller shows.
// Usage from the repo root: node tools/frontend-review/check-remaining-api-error-callers.cjs [--output result.json]
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { execFileSync } = require('node:child_process');

const repo = path.resolve(__dirname, '../..');
const ts = createRequire(path.join(repo, 'frontend/package.json'))('typescript');
const BASE = '51da2816d0240a60e87e028794b9ebe2535367d6';
const outIndex = process.argv.indexOf('--output');
const outputFile = outIndex < 0 ? null : process.argv[outIndex + 1];
if (outIndex >= 0 && !outputFile) throw new Error('--output requires a path');

const FILES = {
  helper: 'frontend/src/lib/api-error.ts',
  auth: 'frontend/src/lib/auth.ts',
  announcements: 'frontend/src/app/(dashboard)/announcements/api.ts',
  tradeApi: 'frontend/src/lib/trade-documents/api.ts',
  dialog: 'frontend/src/app/(dashboard)/trade-documents/components/new-document-dialog.tsx',
  notices: 'frontend/src/app/[locale]/(public)/notices/use-public-notices.ts',
  damage: 'frontend/src/app/(dashboard)/damage-inspection/use-damage-inspection.ts',
  chat: 'frontend/src/app/(dashboard)/chat/use-ai-chat.ts',
};
// Private functions are exposed only on the transpiled copy; the source files are not changed for the test.
const EXPOSE = { announcements: 'request', tradeApi: 'request', dialog: 'findShipment' };

const transpiled = new Map();
function source(mode, key) {
  const id = `${mode}:${key}`;
  if (transpiled.has(id)) return transpiled.get(id);
  const file = FILES[key];
  const text = mode === 'base'
    ? execFileSync('git', ['-C', repo, 'show', `${BASE}:${file}`], { encoding: 'utf8' })
    : fs.readFileSync(path.join(repo, file), 'utf8');
  const js = ts.transpileModule(text, {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  transpiled.set(id, js);
  return js;
}

// Minimal hook runtime: enough to run the exported hooks once outside React.
function reactRuntime() {
  const state = [];
  let index = 0;
  let effects = [];
  return {
    api: {
      useState(init) {
        const k = index++;
        if (!(k in state)) state[k] = typeof init === 'function' ? init() : init;
        return [state[k], value => { state[k] = typeof value === 'function' ? value(state[k]) : value; }];
      },
      useCallback: fn => fn,
      useMemo: fn => fn(),
      useEffect(fn) { effects.push(fn); },
    },
    render(hook) { index = 0; effects = []; return hook(); },
    runEffects() { const pending = effects; effects = []; pending.forEach(fn => fn()); },
  };
}

const stub = new Proxy(function () {}, { get: () => stub, apply: () => null });
function createEnv(mode, react) {
  const env = { response: null, networkError: null };
  const cache = {};
  const sandbox = {
    Headers, FormData, File, Response, AbortController, URL, document: { cookie: '' },
    console: { log() {}, error() {} },
    fetch: async () => { if (env.networkError) throw new Error(env.networkError); return env.response; },
  };
  function resolve(spec) {
    switch (spec) {
      case '@/lib/api': return { API_BASE_URL: 'https://fixture.invalid' };
      case '@/lib/api-error': return env.load('helper');
      case '@/lib/auth': return env.load('auth');
      case 'react': return react;
      case 'react/jsx-runtime': return { jsx: () => null, jsxs: () => null, Fragment: 'Fragment' };
      case 'next/navigation': return { useRouter: () => ({ push() {} }) };
      case './badges': return { TYPE_LABELS: {} };
      case '@/lib/trade-documents': return {};
      default:
        if (spec === 'lucide-react' || spec.startsWith('@/components/ui/')) return stub;
        throw new Error('Unexpected import: ' + spec);
    }
  }
  env.load = key => {
    if (cache[key]) return cache[key].exports;
    const module = { exports: {} };
    cache[key] = module;
    const js = source(mode, key) + (EXPOSE[key] ? `\nmodule.exports.__test = { ${EXPOSE[key]} };` : '');
    vm.runInNewContext(js, { ...sandbox, module, exports: module.exports, require: resolve }, { filename: FILES[key] });
    return module.exports;
  };
  env.respond = (status, body, raw) => {
    env.networkError = null;
    env.response = new Response(raw === undefined ? JSON.stringify(body) : raw, {
      status, headers: { 'Content-Type': raw === undefined ? 'application/json' : 'text/html' },
    });
  };
  return env;
}

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
async function settle() { for (let i = 0; i < 5; i++) await tick(); }
const png = () => new File([new Uint8Array(8)], 'fixture.png', { type: 'image/png' });

// Each caller: probe(env, mode) returns async (status, body, raw) => the text a user would see (or a success marker).
function makeCallers() {
  const thrown = async fn => { try { return { value: await fn() }; } catch (error) { return { text: error.message, status: error.status, code: error.code }; } };
  const request = key => ({ name: key, key, readsValidation: true, fallback: s => `요청에 실패했습니다. (HTTP ${s})`, statuses: [400, 403, 404, 413, 500],
    async run(env, status, body, raw) { env.respond(status, body, raw); return thrown(() => env.load(key).__test.request('/fixture')); },
    isSuccess: got => got.value && got.value.success === true && got.value.data.fixture === true });
  return [
    request('announcements'),
    request('tradeApi'),
    { name: 'tradeDocumentDialog', key: 'dialog', fallback: s => `화물 조회에 실패했습니다. (HTTP ${s})`, statuses: [400, 403, 413, 500],
      async run(env, status, body, raw) { env.respond(status, body, raw); return thrown(() => env.load('dialog').__test.findShipment('FIXTURE1')); },
      isSuccess: got => got.value && got.value.fixture === true },
    { name: 'publicNotices', key: 'notices', fallback: s => `공지사항을 불러오지 못했습니다. (HTTP ${s})`, statuses: [400, 403, 404, 413, 500],
      async run(env, status, body, raw, rt) {
        env.respond(status, body, raw);
        const hook = env.load('notices').usePublicNotices;
        rt.render(hook); rt.runEffects(); await settle();
        const out = rt.render(hook);
        return out.error ? { text: out.error } : { value: out.notices };
      },
      isSuccess: got => Array.isArray(got.value) && got.value.length === 1 },
    { name: 'damageInspect', key: 'damage', fallback: s => `판정에 실패했습니다. (HTTP ${s})`, statuses: [400, 403, 404, 413, 500],
      async run(env, status, body, raw, rt) {
        env.respond(status, body, raw);
        const hook = env.load('damage').useDamageInspection;
        const { inspect } = rt.render(hook);
        const returned = await inspect(png());
        const out = rt.render(hook);
        return out.error ? { text: out.error, rateLimited: out.isRateLimited } : { value: returned };
      },
      isSuccess: got => got.value && got.value.fixture === true },
    { name: 'damageHistory', key: 'damage', fallback: s => `이력 조회에 실패했습니다. (HTTP ${s})`, statuses: [400, 403, 404, 413, 500],
      async run(env, status, body, raw, rt) {
        env.respond(status, body, raw);
        const hook = env.load('damage').useInspectionHistory;
        rt.render(hook); rt.runEffects(); await settle();
        const out = rt.render(hook);
        return out.error ? { text: out.error } : { value: out.items };
      },
      isSuccess: got => Array.isArray(got.value) && got.value.length === 1 },
    { name: 'aiChat', key: 'chat', readsValidation: true, fallback: s => `요청이 실패했습니다. (HTTP ${s})`, statuses: [400, 403, 404, 413, 500],
      chatPriority: true,
      async run(env, status, body, raw, rt) {
        env.respond(status, body, raw);
        const hook = env.load('chat').useAiChat;
        const { sendMessage } = rt.render(hook);
        await sendMessage('fixture question');
        const last = rt.render(hook).messages.at(-1);
        return last.isError ? { text: last.content } : { value: last.content };
      },
      isSuccess: got => got.value === 'fixture answer' },
  ];
}

const COMMON = [[400, 'fail', 'Invalid JSON request body.'], [403, 'fail', 'Request not allowed.'], [404, 'fail', 'Route not found.'],
  [413, 'fail', 'Request body is too large.'], [500, 'error', 'Something went wrong.']];
const successBody = {
  announcements: { success: true, data: { fixture: true } }, tradeApi: { success: true, data: { fixture: true } },
  tradeDocumentDialog: { success: true, data: { fixture: true } },
  publicNotices: { success: true, data: [{ id: '1', title: 't', body: 'b', category: 'general', isPinned: false, publishedAt: null }] },
  damageInspect: { success: true, data: { fixture: true } }, damageHistory: { success: true, data: [{ fixture: true }] },
  aiChat: { success: true, data: { answer: 'fixture answer', sources: [] } },
};

async function runMode(mode) {
  const results = [];
  for (const caller of makeCallers()) {
    const probe = async (status, body, raw) => {
      const rt = reactRuntime();
      const env = createEnv(mode, rt.api);
      return caller.run(env, status, body, raw, rt);
    };
    const record = async (kind, name, expected, status, body, raw, extra) => {
      let got;
      try {
        got = await probe(status, body, raw);
        if (typeof expected === 'function') expected(got); else assert.equal(got.text, expected);
        if (extra) extra(got);
        results.push({ caller: caller.name, kind, name, passed: true });
      } catch (error) {
        results.push({ caller: caller.name, kind, name, passed: false, shown: got && got.text, error: String(error.message).split('\n')[0].slice(0, 160) });
      }
    };
    // Reproduction cases: common public messages and malformed fields must not be lost.
    for (const [status, label, message] of COMMON) {
      if (!caller.statuses.includes(status)) continue;
      await record('repro', `common ${status}`, message, status, { status: label, message });
    }
    await record('repro', 'object error uses fallback', caller.fallback(500), 500, { success: false, error: { detail: 'private fixture' } });
    // Guards: behavior that must be identical before and after.
    await record('guard', 'legacy error keeps exact text', 'legacy fixture', 409, { success: false, error: 'legacy fixture' });
    await record(caller.readsValidation ? 'guard' : 'repro', 'first validation message', 'validation fixture', 422, { success: false, errors: [{ msg: 'validation fixture' }] });
    await record('guard', 'error and validation together', caller.chatPriority ? 'validation fixture' : 'legacy fixture', 400,
      { success: false, error: 'legacy fixture', errors: [{ msg: 'validation fixture' }] });
    await record('guard', 'HTML response uses fallback', caller.fallback(500), 500, undefined, '<html>private fixture</html>');
    await record('guard', 'empty response uses fallback', caller.fallback(500), 500, undefined, '');
    await record('guard', 'success path unchanged', got => assert(caller.isSuccess(got), 'success marker missing'), 200, successBody[caller.name]);
    if (caller.name === 'damageInspect') {
      await record('repro', 'rate limit common 429', 'Too many requests.', 429, { status: 'fail', message: 'Too many requests.' }, undefined, got => assert.equal(got.rateLimited, true));
      await record('guard', 'rate limit legacy 429', 'rate fixture', 429, { success: false, error: 'rate fixture' }, undefined, got => assert.equal(got.rateLimited, true));
      await record('guard', 'rate limit fallback 429', '요청이 몰려 잠시 처리할 수 없습니다. 1분 후 다시 시도해 주세요.', 429, { success: false }, undefined, got => assert.equal(got.rateLimited, true));
    }
    if (caller.name === 'tradeDocumentDialog') {
      await record('guard', '404 still means no shipment', got => assert(got.value === null), 404, { success: false, error: 'not found fixture' });
    }
    if (caller.name === 'aiChat') {
      await record('repro', 'chat common 400 beats nothing', 'Invalid JSON request body.', 400, { status: 'fail', message: 'Invalid JSON request body.' });
    }
  }
  // Request-shaped callers keep status and code on ApiError.
  for (const key of ['announcements', 'tradeApi']) {
    const rt = reactRuntime();
    const env = createEnv(mode, rt.api);
    env.respond(403, { success: false, error: 'expired fixture', code: 'TOKEN_EXPIRED' });
    const got = await (async () => { try { await env.load(key).__test.request('/fixture'); } catch (error) { return error; } })();
    let passed = true, detail;
    try { assert.equal(got.status, 403); assert.equal(got.code, 'TOKEN_EXPIRED'); assert.equal(got.message, 'expired fixture'); } catch (error) { passed = false; detail = error.message.split('\n')[0]; }
    results.push({ caller: key, kind: 'guard', name: 'ApiError keeps status and code', passed, error: detail });
  }
  return results;
}

(async () => {
  const before = await runMode('base');
  const after = await runMode('working');
  const count = (list, kind, passed) => list.filter(r => r.kind === kind && r.passed === passed).length;
  const report = {
    base: BASE,
    method: 'Real caller source transpiled in a vm sandbox with fetch/Response fixtures; hooks run once by a minimal runtime. No HTTP, React rendering, browser, AI call or data write.',
    before: { reproFailed: count(before, 'repro', false), reproPassed: count(before, 'repro', true), guardPassed: count(before, 'guard', true), guardFailed: count(before, 'guard', false) },
    after: { reproFailed: count(after, 'repro', false), reproPassed: count(after, 'repro', true), guardPassed: count(after, 'guard', true), guardFailed: count(after, 'guard', false) },
    failuresAfter: after.filter(r => !r.passed),
    beforeRepro: before.filter(r => r.kind === 'repro').map(r => ({ caller: r.caller, name: r.name, passed: r.passed, shown: r.shown })),
    limits: ['No React rendering: hooks run once with a minimal useState/useEffect runtime.', 'Import aliases and the API base are adapters; no real API or deployed request is tested.', 'The unexposed request/findShipment functions are reached through a test-only export on the transpiled copy.'],
  };
  if (outputFile) fs.writeFileSync(outputFile, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ before: report.before, after: report.after, failuresAfter: report.failuresAfter.map(r => `${r.caller}/${r.name}: ${r.error}`) }, null, 1));
  if (report.before.guardFailed || report.before.reproFailed === 0 || report.after.reproFailed || report.after.guardFailed) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
