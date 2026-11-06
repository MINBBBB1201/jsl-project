/* Next-page fixture review only. Never sends a contact request to a real API. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { chromium } = require(process.env.JSL_PLAYWRIGHT_MODULE || 'playwright');

const base = new URL(process.env.JSL_REVIEW_URL || 'http://localhost:4192');
assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Local preview only');
assert(!base.username && !base.password, 'Credential URLs are not supported');
const output = path.resolve(process.env.JSL_CONTACT_EVIDENCE || path.join(require('node:os').tmpdir(), 'jsl-contact-browser-review'));
const executablePath = process.env.JSL_CHROMIUM_PATH || undefined;
const sizes = [
  { language: 'ko', width: 1440, height: 1000 },
  { language: 'en', width: 1440, height: 1000 },
  { language: 'vi', width: 390, height: 844 },
  { language: 'ko', width: 390, height: 844 },
];
const labels = {
  ko: { unavailable: '온라인 문의를 접수할 수 없습니다.', changed: '동의 안내가 변경되었습니다.' },
  en: { unavailable: 'Online inquiries are unavailable.', changed: 'The consent notice has changed.' },
  vi: { unavailable: 'Hiện chưa thể nhận yêu cầu trực tuyến.', changed: 'Thông báo đã thay đổi.' },
};
const fixtureText = {
  ko: { purpose: '합성 검수용 문의. 실제 회사 고지가 아닙니다.', retention: '브라우저 검수 종료 시 폐기하는 가상 데이터', refusal: '동의하지 않으면 합성 접수 검사를 진행하지 않습니다.', contact: '운영 연락처가 아닌 합성 검수 항목' },
  en: { purpose: 'Synthetic review inquiry. This is not an approved company notice.', retention: 'Synthetic browser-fixture data only; discarded when this review ends.', refusal: 'Declining consent prevents the synthetic submission.', contact: 'Synthetic review entry, not an operational privacy contact.' },
  vi: { purpose: 'Yêu cầu giả lập để kiểm tra. Đây không phải thông báo được công ty phê duyệt.', retention: 'Dữ liệu giả lập được loại bỏ khi kết thúc kiểm tra trình duyệt.', refusal: 'Không đồng ý thì không thực hiện gửi dữ liệu giả lập.', contact: 'Thông tin kiểm tra giả lập, không phải đầu mối vận hành.' },
};
function notice(language, version) {
  const text = fixtureText[language];
  const data = {
    noticeId: `fixture-contact-${language}-v${version}`,
    effectiveDate: '2026-11-05',
    purpose: `${text.purpose} [fixture v${version}]`,
    items: ['companyName', 'contactName', 'email', 'subject', 'message'],
    retentionDescription: text.retention,
    refusalConsequence: text.refusal,
    privacyContact: text.contact,
  };
  return { ...data, noticeHash: createHash('sha256').update(JSON.stringify(data)).digest('hex'), language };
}
const receipt = (id, replayed) => ({ success: true, data: { id, createdAt: '2026-11-05T00:00:00.000Z', status: 'received' }, replayed });
async function bounded(label, task, timeout = 20000) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(task),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label}: timed out after ${timeout}ms`)), timeout); }),
    ]);
  } finally { clearTimeout(timer); }
}

async function review(browser, size) {
  const name = `${size.language}-${size.width}x${size.height}`;
  const result = { name, scope: 'Next contact UI with mocked API, light theme and reduced motion', checks: [], stages: [], captures: [], pageErrors: [], blockedExternal: [], blockedOtherApi: [] };
  async function stage(label, task, timeout = 30000) {
    const started = Date.now();
    console.log(`[${name}] START ${label}`);
    result.activeStage = label;
    try {
      const value = await bounded(`${name}/${label}`, task, timeout);
      const ms = Date.now() - started;
      result.stages.push({ label, pass: true, milliseconds: ms });
      console.log(`[${name}] DONE ${label} (${ms}ms)`);
      return value;
    } catch (error) {
      result.stages.push({ label, pass: false, milliseconds: Date.now() - started, error: error.message });
      console.log(`[${name}] FAIL ${label}: ${error.message}`);
      throw error;
    }
  }
  const context = await stage('create isolated browser context', () => browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light', serviceWorkers: 'block' }), 15000);
  const state = { available: false, version: 1, loseNext: false, posts: [], gets: [], receipts: new Map(), lostKey: null, lostId: null };
  const page = await stage('create page', () => context.newPage(), 15000);
  let contactHydrated = false;
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(30000);
  page.on('pageerror', error => result.pageErrors.push(error.message));
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/\/+$/, '');
    const isContact = pathname === '/api/contact' || pathname === '/api/contact/notice';
    if (isContact) {
      const cors = {
        'access-control-allow-origin': request.headers().origin || base.origin,
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-allow-headers': 'content-type,idempotency-key',
        'cache-control': 'no-store',
      };
      const reply = (status, body) => route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      if (request.method() === 'GET' && pathname.endsWith('/notice')) {
        const requestedLanguage = url.searchParams.get('language') || 'ko';
        state.gets.push({ language: requestedLanguage, version: state.version, status: state.available ? 200 : 503 });
        if (requestedLanguage !== size.language) return reply(400, { success: false, code: 'INVALID_LANGUAGE' });
        return state.available ? reply(200, notice(size.language, state.version)) : reply(503, { success: false, code: 'POLICY_NOT_READY' });
      }
      if (request.method() === 'POST' && pathname === '/api/contact') {
        const body = request.postDataJSON();
        const key = request.headers()['idempotency-key'];
        state.posts.push({ key, noticeHash: body?.consent?.noticeHash, language: body?.consent?.language });
        if (!state.available) return reply(503, { success: false, code: 'POLICY_NOT_READY' });
        if (body?.consent?.noticeHash !== notice(size.language, state.version).noticeHash) return reply(409, { success: false, code: 'VALIDATION_FAILED', errors: [{ field: 'consent', code: 'NOTICE_CHANGED' }] });
        if (!key || body?.consent?.accepted !== true) return reply(400, { success: false, code: 'INVALID_REQUEST_KEY' });
        const existing = state.receipts.get(key);
        const id = existing || `fixture-${size.language}-${size.width}-receipt-${state.receipts.size + 1}`;
        state.receipts.set(key, id);
        if (state.loseNext) {
          state.loseNext = false;
          state.lostKey = key;
          state.lostId = id;
          return route.abort('failed');
        }
        return reply(existing ? 200 : 201, receipt(id, Boolean(existing)));
      }
      return reply(405, { success: false, code: 'FIXTURE_METHOD_NOT_SUPPORTED' });
    }
    // Never allow another API or external service to be contacted during this check.
    if (pathname.startsWith('/api/')) {
      result.blockedOtherApi.push(pathname);
      return route.abort('blockedbyclient');
    }
    if (url.origin !== base.origin) {
      result.blockedExternal.push({ origin: url.origin, type: request.resourceType() });
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });
  const section = page.locator('#contact');
  const form = section.locator('form');
  const submit = form.locator('button[type="submit"]');
  const consent = form.locator('button[role="checkbox"]');
  const unavailableStatus = form.locator(':scope > div[role="status"]');
  const receiptStatus = form.locator(':scope > p[role="status"]');
  const failureAlert = form.locator(':scope > p[role="alert"]');
  const person = form.locator('input[name="name"]');
  const channelColumn = section.locator('[class~="order-2"][class~="lg:order-1"]');
  async function ready() {
    await section.waitFor({ state: 'visible' });
    await bounded(`${name}/fonts ready`, () => page.evaluate(() => document.fonts.ready), 10000);
  }
  async function waitEnabled() {
    await page.waitForFunction(() => document.querySelector('#contact input[name="name"]')?.disabled === false);
  }
  async function annotate() {
    assert(contactHydrated, 'Do not annotate React markup before the contact useEffect has run');
    await page.evaluate(() => {
      if (document.getElementById('contact-fixture-caption')) return;
      const label = document.createElement('div');
      label.id = 'contact-fixture-caption';
      label.textContent = 'FIXTURE REVIEW · Mock API · No live inquiry / company notice';
      label.style.cssText = 'font:11px/1.4 Arial,sans-serif;color:#8a3609;background:#fff0dc;border:1px solid #e7b788;padding:7px;margin-bottom:12px;';
      document.querySelector('#contact .container')?.prepend(label);
    });
  }
  async function capture(stateName) {
    const file = `fixture-contact-${name}-${stateName}.png`;
    if (contactHydrated) {
      await annotate();
      await section.screenshot({ path: path.join(output, file), animations: 'disabled', timeout: 12000 });
    } else {
      // On an early navigation/hydration failure, preserve the untouched page.
      // Injecting a caption here can itself cause a React hydration mismatch.
      await page.screenshot({ path: path.join(output, file), animations: 'disabled', timeout: 12000 });
    }
    result.captures.push(file);
  }
  async function fill(message) {
    await form.locator('input[name="company"]').fill('Synthetic Fixture Co');
    await person.fill('Synthetic Review Person');
    await form.locator('input[name="email"]').fill('review@example.test');
    await form.locator('input[name="subject"]').fill('Synthetic inquiry fixture');
    await form.locator('textarea[name="message"]').fill(message);
    await consent.check();
  }
  async function sendAndRead() {
    const response = page.waitForResponse(response => new URL(response.url()).pathname.replace(/\/+$/, '') === '/api/contact' && response.request().method() === 'POST');
    await submit.click();
    return response;
  }
  async function assertReceipt(id) {
    await receiptStatus.filter({ hasText: id }).waitFor();
  }
  try {
    await stage('503 notice and disabled intake', async () => {
    const routePath = size.language === 'ko' ? '/landing' : `/${size.language}/landing`;
    // The unavailable message also exists in SSR HTML. Wait for the effect's
    // first GET before assertions or any DOM annotation, not just DOM visibility.
    const firstNoticeResponse = page.waitForResponse(response => {
      const url = new URL(response.url());
      return url.pathname.replace(/\/+$/, '') === '/api/contact/notice'
        && url.searchParams.get('language') === size.language
        && response.request().method() === 'GET';
    }, { timeout: 30000 });
    const [response, initialNotice] = await Promise.all([
      page.goto(new URL(routePath, base.origin).href, { waitUntil: 'domcontentloaded', timeout: 30000 }),
      firstNoticeResponse,
    ]);
    assert.equal(response?.status(), 200, 'Next landing document');
    assert.equal(initialNotice.status(), 503, 'Initial notice must use the unavailable fixture');
    contactHydrated = true;
    await ready();
    await unavailableStatus.filter({ hasText: labels[size.language].unavailable }).waitFor();
    assert(state.gets.some(get => get.status === 503), '503 notice fixture must be consumed');
    const disabled = await form.locator('input:not([type="hidden"]), textarea, button[type="submit"], button[role="checkbox"]').evaluateAll(nodes => nodes.length > 0 && nodes.every(node => node.disabled));
    assert(disabled, 'No intake controls enabled without an approved notice');
    const channels = await channelColumn.locator('[data-slot="card-title"]').allTextContents();
    assert(channels.length >= 1 && channels.every(text => text.trim()), 'Contact channels remain present');
    assert(await channelColumn.isVisible(), 'Contact channels remain visible');
    assert.equal(state.posts.length, 0, 'Unavailable state must not submit');
    await bounded(`${name}/503 capture`, () => capture('unavailable-503'), 15000);
    result.checks.push({ name: 'unavailable notice', pass: true, controlsDisabled: true, channels, postCount: 0 });
    }, 50000);

    await stage('approved notice and required-field focus', async () => {
    state.available = true;
    assert.equal(await unavailableStatus.count(), 1, 'Exactly one unavailable notice status');
    assert.equal(await consent.count(), 1, 'Exactly one visible Radix consent control');
    await unavailableStatus.getByRole('button').click();
    await waitEnabled();
    await consent.focus();
    await page.keyboard.press('Space');
    assert(await consent.isChecked(), 'Keyboard consent toggle');
    await submit.click();
    await page.waitForFunction(() => document.activeElement?.matches('#contact input[name="name"]'));
    assert.equal(state.posts.length, 0, 'Invalid fields must not POST');
    result.checks.push({ name: 'required-field validation focus', pass: true, focusedField: 'name' });
    });

    await stage('synthetic 201 receipt', async () => {
    await fill('Synthetic successful inquiry for a mocked UI check.');
    const firstResponse = await sendAndRead();
    assert.equal(firstResponse.status(), 201);
    const firstReceipt = await bounded(`${name}/201 response JSON`, () => firstResponse.json(), 10000);
    await assertReceipt(firstReceipt.data.id);
    assert.equal(firstReceipt.replayed, false);
    assert.equal(state.posts.at(-1).language, size.language);
    await capture('approved-synthetic-receipt-201');
    result.checks.push({ name: 'synthetic approved notice and receipt', pass: true, status: 201, receipt: firstReceipt.data.id });
    });

    await stage('lost response and same-key reload retry', async () => {
    const lostMessage = 'Synthetic lost response inquiry; do not send to a real API.';
    await fill(lostMessage);
    state.loseNext = true;
    await submit.click();
    await failureAlert.waitFor();
    const countBeforeRetry = state.receipts.size;
    const metadata = await page.evaluate(() => JSON.parse(sessionStorage.getItem('jsl.contact.retry.v1')));
    assert.deepEqual(Object.keys(metadata).sort(), ['expiresAt', 'identityHash', 'key', 'version']);
    assert.equal(metadata.key, state.lostKey);
    assert(!JSON.stringify(metadata).includes('review@example.test'), 'Retry metadata must not contain form email');
    contactHydrated = false;
    const reloadedNoticeResponse = page.waitForResponse(response => {
      const url = new URL(response.url());
      return url.pathname.replace(/\/+$/, '') === '/api/contact/notice'
        && url.searchParams.get('language') === size.language
        && response.request().method() === 'GET';
    }, { timeout: 30000 });
    const [, reloadedNotice] = await Promise.all([
      page.reload({ waitUntil: 'domcontentloaded' }),
      reloadedNoticeResponse,
    ]);
    assert.equal(reloadedNotice.status(), 200, 'Reload must consume the approved synthetic notice');
    contactHydrated = true;
    await ready();
    await waitEnabled();
    assert.equal(await consent.isChecked(), false, 'Consent must be renewed after reload');
    assert.equal(await form.locator('input[name="email"]').inputValue(), '', 'Form PII must not be restored');
    await fill(lostMessage);
    const replayResponse = await sendAndRead();
    const replayReceipt = await bounded(`${name}/200 replay response JSON`, () => replayResponse.json(), 10000);
    assert.equal(replayResponse.status(), 200);
    assert.equal(replayReceipt.replayed, true);
    assert.equal(state.posts.at(-1).key, state.lostKey);
    assert.equal(replayReceipt.data.id, state.lostId);
    assert.equal(state.receipts.size, countBeforeRetry);
    await assertReceipt(state.lostId);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('jsl.contact.retry.v1')), null);
    result.checks.push({ name: 'lost response and reload retry', pass: true, sameRequestKey: true, sameFixtureReceipt: true, fixtureReceiptCountBefore: countBeforeRetry, fixtureReceiptCountAfter: state.receipts.size, realDatabaseUsed: false });
    }, 50000);

    await stage('stale notice and renewed consent', async () => {
    await fill('Synthetic stale notice test, isolated in this browser route.');
    state.version = 2;
    const staleResponse = await sendAndRead();
    assert.equal(staleResponse.status(), 409);
    await failureAlert.filter({ hasText: labels[size.language].changed }).waitFor();
    await waitEnabled();
    assert.equal(await consent.isChecked(), false);
    assert.equal(await submit.isDisabled(), true);
    assert(state.gets.some(get => get.version === 2 && get.status === 200), 'Updated notice must be reloaded');
    assert((await form.textContent()).includes('[fixture v2]'), 'Updated notice is displayed');
    await capture('stale-notice-renew-consent');
    await consent.check();
    const renewedResponse = await sendAndRead();
    assert.equal(renewedResponse.status(), 201);
    const renewedReceipt = await bounded(`${name}/renewed receipt JSON`, () => renewedResponse.json(), 10000);
    await assertReceipt(renewedReceipt.data.id);
    result.checks.push({ name: 'stale notice and renewed consent', pass: true, initialStatus: 409, confirmedStatus: 201, updatedNoticeVersion: 2 });
    });
    result.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    result.pass = result.checks.length === 5 && result.checks.every(check => check.pass) && !result.horizontalOverflow && result.pageErrors.length === 0;
  } catch (error) {
    result.pass = false;
    result.error = error.stack || error.message;
    try { await bounded(`${name}/failure screenshot`, () => capture('FAILED'), 15000); } catch (captureError) { result.captureError = captureError.message; }
  } finally {
    result.mockedNoticeRequests = state.gets.length;
    result.mockedPostRequests = state.posts.length;
    result.blockedExternal = [...new Map(result.blockedExternal.map(item => [JSON.stringify(item), item])).values()];
    result.blockedOtherApi = [...new Set(result.blockedOtherApi)];
    await bounded(`${name}/close context`, () => context.close(), 10000);
  }
  return result;
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const report = { scope: 'Next integrated contact UI; every contact API response is a synthetic Playwright route fixture. No API server, database, approved operational policy, or live submission is used.', limitations: ['Reduced motion and light theme only', 'Mock response handling does not verify backend validation, persistence, database indexes, operational policy approval, CORS, or delivery', 'External resources and other APIs are blocked'], base: base.origin, cases: [], startedAt: new Date().toISOString() };
  console.log(`[contact fixture] Launching existing Chromium for ${base.origin}`);
  const browser = await bounded('launch browser', () => chromium.launch({ headless: true, executablePath, timeout: 30000 }), 35000);
  try {
    for (const size of sizes) {
      const result = await review(browser, size);
      report.cases.push(result);
      fs.writeFileSync(path.join(output, 'fixture-contact-summary.json'), `${JSON.stringify(report, null, 2)}\n`);
      console.log(`${result.name}: ${result.pass ? 'PASS' : 'FAIL'}; ${result.checks.length}/5 flows`);
    }
  } finally {
    await bounded('close browser', () => browser.close(), 10000);
    report.finishedAt = new Date().toISOString();
    report.pass = report.cases.length === sizes.length && report.cases.every(result => result.pass);
    fs.writeFileSync(path.join(output, 'fixture-contact-summary.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  if (!report.pass) process.exitCode = 1;
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
