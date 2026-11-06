const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

// Run against a built local app. API responses are synthetic and never write data.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.REVIEW_BASE_URL || 'http://localhost:4192';
const output = path.resolve(process.env.REVIEW_OUTPUT || 'output/playwright/count-up-motion');
const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
const mode = process.env.REVIEW_CASES || 'all';
const results = [];
const selector = '.jsl-stats span[aria-label]';

const compact = (value) => value.replace(/\s/g, '');
const readValues = (page) => page.locator(selector).evaluateAll((elements) =>
  elements.map((element) => ({ label: element.getAttribute('aria-label'), shown: element.textContent }))
);

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  async function run(name, locale, viewport, motion, action, javaScriptEnabled = true) {
    const context = await browser.newContext({ viewport, reducedMotion: motion, javaScriptEnabled });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/**', (route) => route.request().url().includes('public-summary')
      ? route.fulfill({ status: 503, contentType: 'application/json', body: '{"success":false}' })
      : route.abort());
    let result = { name, locale, viewport, javaScriptEnabled, errors };
    try {
      await page.goto(`${base}/${locale}/landing`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.locator(selector).first().waitFor({ state: 'attached' });
      assert.equal(await page.locator(selector).count(), 7);
      if (javaScriptEnabled && motion === 'no-preference') {
        await page.waitForFunction(() => document.querySelector('.jsl-stats__volumes span[aria-label]')?.textContent === '0', null, { timeout: 15000 });
      }
      if (javaScriptEnabled) await page.waitForTimeout(100);
      const detail = await action(page);
      const values = await readValues(page);
      if (javaScriptEnabled) await page.locator('.jsl-stats').screenshot({ path: path.join(output, `${name}.png`) });
      result = { ...result, ...detail, values };
      assert.deepEqual(errors, []);
      for (const value of values) assert.equal(compact(value.shown), compact(value.label), `${name}: ${value.label}`);
      result.pass = true;
    } catch (error) {
      result = { ...result, pass: false, error: error.message, values: await readValues(page).catch(() => []) };
    } finally {
      results.push(result);
      await context.close();
    }
  }
  try {
    for (const [locale, width, height] of [['en', 1440, 1000], ['ko', 390, 844]]) {
      await run(`outside-then-reduce-${locale}`, locale, { width, height }, 'no-preference', async (page) => {
        const before = await readValues(page);
        assert(before.some((value) => compact(value.shown) !== compact(value.label)), 'Counters already completed before preference change');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForTimeout(200);
        await page.locator('.jsl-stats').scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        return { initialValues: before, transition: 'offscreen normal to reduced' };
      });
    }
    if (mode === 'all') {
      await run('during-animation-en', 'en', { width: 1440, height: 1000 }, 'no-preference', async (page) => {
        await page.locator('.jsl-stats__volumes span[aria-label]').first().scrollIntoViewIfNeeded();
        const middle = await page.waitForFunction(() => {
          const value = Number(document.querySelector('.jsl-stats__volumes span[aria-label]').textContent);
          return value > 0 && value <= 100 ? value : false;
        }, null, { timeout: 5000 });
        const observedIntermediate = await middle.jsonValue();
        const preferenceChangeAt = Date.now();
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForTimeout(200);
        return { observedIntermediate, preferenceChangeAt, transition: 'running normal to reduced' };
      });
      await run('initial-reduce-ko', 'ko', { width: 390, height: 844 }, 'reduce', async (page) => {
        await page.locator('.jsl-stats').scrollIntoViewIfNeeded();
        return { transition: 'reduced from first load' };
      });
      await run('normal-animation-en', 'en', { width: 1440, height: 1000 }, 'no-preference', async (page) => {
        await page.evaluate(() => {
          const target = document.querySelector('.jsl-stats__volumes span[aria-label]');
          window.countSamples = [];
          const until = performance.now() + 1800;
          function sample() {
            window.countSamples.push(target.textContent);
            if (performance.now() < until) requestAnimationFrame(sample);
          }
          requestAnimationFrame(sample);
        });
        await page.locator('.jsl-stats').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1900);
        const samples = await page.evaluate(() => [...new Set(window.countSamples)]);
        assert(samples.some((value) => Number(value) > 0 && Number(value) < 200), 'Normal animation no longer runs');
        return { samples, transition: 'unchanged normal CountUp' };
      });
      await run('no-javascript-en', 'en', { width: 1440, height: 1000 }, 'no-preference', async (page) => {
        return { transition: 'server HTML values without JavaScript; section visibility is not asserted' };
      }, false);
    }
  } finally {
    await browser.close();
    const source = await fs.readFile(path.resolve(__dirname, '../../frontend/src/app/landing/components/count-up.tsx'), 'utf8');
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({
      scope: 'Actual local app in Chromium. Viewports and motion preferences are emulated; summary API503 is synthetic.',
      sourceSha256: crypto.createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex'),
      results,
    }, null, 2));
  }
  console.log(JSON.stringify(results.map(({ name, pass, error }) => ({ name, pass, error }))));
  if (results.some((result) => !result.pass)) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });
