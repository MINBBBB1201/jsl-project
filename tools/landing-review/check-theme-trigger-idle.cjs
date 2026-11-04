/* Executes the actual hook and geometry function in a DOM fixture; does not mount React or the full app. */
const fs = require('fs')
const cp = require('child_process')
const path = require('path')
const root = path.resolve(__dirname, '../..')
const ts = require(path.join(root, 'frontend/node_modules/typescript'))
const { chromium } = require(process.env.JSL_PLAYWRIGHT_MODULE || 'playwright')
const sourcePath = 'frontend/src/app/landing/components/landing-theme-customizer.tsx'

function compile(source) {
  source = source.replace(/\r\n/g, '\n')
  const helperStart = source.indexOf('function measureTriggerLift()')
  const helperEnd = source.indexOf('// Floating trigger button', helperStart)
  const hookStart = source.indexOf('  React.useEffect(() => {', helperEnd)
  const hookEnd = source.indexOf('\n  }, [])', hookStart)
  if ([helperStart, helperEnd, hookStart, hookEnd].some((n) => n < 0)) throw Error('Source sections not found')
  const selectors = source.match(/^const TRIGGER_AVOID_SELECTORS = .+$/m)?.[0]
  if (!selectors) throw Error('Trigger selectors not found')
  const helper = source.slice(helperStart, helperEnd).replace('function measureTriggerLift()', 'function measureActual()')
  const hook = source.slice(hookStart, hookEnd) + '\n  }, [])'
  const program = `
    ${selectors}
    const TRIGGER_BOTTOM = 24, TRIGGER_RIGHT = 16, TRIGGER_SIZE = 48, TRIGGER_GAP = 12
    ${helper}
    function measureTriggerLift() { window.measureCount++; return measureActual() }
    function install() {
      let cleanup
      const setLift = value => window.values.push(value)
      const React = { useEffect: callback => { cleanup = callback() } }
      ${hook}
      return cleanup
    }
    window.dispose = install()
  `
  return ts.transpileModule(program, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
}

async function check(browser, version, source) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  try {
    await page.setContent('<div class="journey"><div class="multimodal-guest"></div><div class="journey-track-form" style="position:fixed;right:16px;bottom:24px;width:100px;height:30px"></div></div>')
    await page.evaluate(() => { window.values = []; window.measureCount = 0 })
    await page.addScriptTag({ content: compile(source) })
    await page.waitForTimeout(1000)
    const initial = await page.evaluate(() => ({ lift: window.values.at(-1), count: window.measureCount }))
    await page.waitForTimeout(1100)
    const idle = await page.evaluate(() => ({ count: window.measureCount, lift: window.values.at(-1) }))
    await page.evaluate(() => { const span = document.createElement('span'); span.textContent = 'Unrelated'; document.querySelector('.multimodal-guest').append(span) })
    await page.waitForTimeout(150)
    const unrelated = await page.evaluate(() => window.measureCount)
    await page.evaluate(() => window.dispatchEvent(new Event('scroll')))
    await page.waitForTimeout(700)
    const afterScroll = await page.evaluate(() => window.measureCount)
    await page.waitForTimeout(750)
    const afterScrollSettled = await page.evaluate(() => window.measureCount)
    await page.evaluate(() => {
      document.querySelector('.journey-track-form').remove()
      document.querySelector('.multimodal-guest').innerHTML = '<div id="jsl-marine-native"><nav class="mm-mode-nav" style="position:fixed;right:16px;bottom:12px;width:200px;height:40px"></nav></div>'
    })
    await page.waitForTimeout(650)
    const added = await page.evaluate(() => window.values.at(-1))
    await page.locator('.mm-mode-nav').evaluate((node) => { node.style.visibility = 'hidden' })
    await page.waitForTimeout(650)
    const hidden = await page.evaluate(() => window.values.at(-1))
    await page.locator('.mm-mode-nav').evaluate((node) => { node.style.visibility = 'visible' })
    await page.waitForTimeout(650)
    const shown = await page.evaluate(() => window.values.at(-1))
    await page.locator('#jsl-marine-native').evaluate((node) => node.remove())
    await page.waitForTimeout(650)
    const removed = await page.evaluate(() => window.values.at(-1))
    await page.evaluate(() => { document.querySelector('.multimodal-guest').innerHTML = '<div id="jsl-marine-native"><nav class="uc-service-nav" style="position:fixed;right:16px;bottom:24px;width:200px;height:40px"></nav></div>' })
    await page.waitForTimeout(650)
    const serviceNav = await page.evaluate(() => window.values.at(-1))
    await page.evaluate(() => { document.querySelector('#jsl-marine-native').innerHTML = '<div class="uc-information" style="position:fixed;right:16px;bottom:24px;width:200px;height:150px"><nav class="uc-service-nav"></nav></div>' })
    await page.waitForTimeout(650)
    const serviceContent = await page.evaluate(() => window.values.at(-1))
    const beforeCleanup = await page.evaluate(() => window.measureCount)
    await page.evaluate(() => { window.dispose(); window.dispatchEvent(new Event('scroll')) })
    await page.waitForTimeout(600)
    const afterCleanup = await page.evaluate(() => window.measureCount)
    return { version, initial, idle, idleMeasurements: idle.count - initial.count, unrelatedMeasurements: unrelated - idle.count, scrollMeasurements: afterScroll - unrelated, laterMeasurements: afterScrollSettled - afterScroll, added, hidden, shown, removed, serviceNav, serviceContent, beforeCleanup, afterCleanup }
  } finally { await page.close() }
}

;(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.JSL_CHROMIUM_PATH ? { executablePath: process.env.JSL_CHROMIUM_PATH } : {}) })
  try {
    const baseline = cp.execFileSync('git', ['show', `717ad0f:${sourcePath}`], { cwd: root, encoding: 'utf8' })
    const candidate = fs.readFileSync(path.join(root, sourcePath), 'utf8')
    const before = await check(browser, 'baseline', baseline)
    const after = await check(browser, 'candidate', candidate)
    console.log(JSON.stringify([before, after], null, 2))
    if (!(before.idleMeasurements > 0 && after.initial.lift > 0 && after.idleMeasurements === 0 && after.unrelatedMeasurements === 0 && after.scrollMeasurements === 2 && after.laterMeasurements === 0 && after.added > 0 && after.hidden === 0 && after.shown > 0 && after.removed === 0 && after.serviceNav > 0 && after.serviceContent > after.serviceNav && after.beforeCleanup === after.afterCleanup)) process.exitCode = 1
  } finally { await browser.close() }
})().catch((error) => { console.error(error); process.exitCode = 1 })
