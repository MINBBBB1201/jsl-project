// Capture the settled sea canvas at N evenly spaced progress values (the canvas only, no DOM overlays),
// from a page running the live renderer (?sea=3d, or a deployment that predates the frame sequence).
// Headed on purpose: frame timing and WebGL behave like a real visit. Then run encode.cjs.
// usage: node tools/sea-frames/capture.cjs <url> <outDir> <viewportW> <viewportH> <count> [from] [to]
const fs = require('fs'), path = require('path')
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')
const [url, outDir, vw, vh, count = '120', from = '.456', to = '.8395'] = process.argv.slice(2)
fs.mkdirSync(outDir, { recursive: true })
;(async () => {
  const b = await chromium.launch({ headless: false, executablePath: process.env.CHROME_PATH || undefined, args: [`--window-size=${Number(vw) + 16},${Number(vh) + 140}`, '--window-position=0,0'] })
  const ctx = await b.newContext({ viewport: { width: Number(vw), height: Number(vh) }, deviceScaleFactor: 1 }); const p = await ctx.newPage()
  await p.goto(url, { waitUntil: 'load', timeout: 180000 }); await p.bringToFront(); await p.waitForTimeout(3000)
  await p.evaluate(() => document.getElementById('features').scrollIntoView({ behavior: 'instant' }))
  await p.waitForFunction(() => !!document.getElementById('jsl-marine-native')?.marineRuntime, null, { timeout: 120000 })
  // Park in the sea and wait until the HDR daylight and the vessel photograph are both in.
  await p.evaluate(() => { const root = document.getElementById('jsl-marine-native'); root.querySelector('input[type=range]').value = '62'; root.ucRender() })
  await p.waitForFunction(() => { const rt = document.getElementById('jsl-marine-native').marineRuntime; return rt.daylight.status.state === 'ready' && (rt.model.group.userData.photoVessel?.status.state ?? 'ready') === 'ready' }, null, { timeout: 120000 })
  await p.waitForTimeout(2000)
  await p.evaluate(() => {
    const root = document.getElementById('jsl-marine-native'), rt = root.marineRuntime, orig = rt.render
    rt.render = function (...args) { window.__args = args; return orig.apply(this, args) }; window.__settle = () => { const args = window.__args.slice(0, 5); orig.call(rt, ...args, true); return { progress: args[0], data: rt.renderer.domElement.toDataURL('image/png'), w: rt.renderer.domElement.width, h: rt.renderer.domElement.height } }
  })
  // POSITIONS: a JSON file of progress values from plan.cjs; otherwise <count> evenly spaced values.
  const planned = process.env.POSITIONS ? JSON.parse(fs.readFileSync(process.env.POSITIONS, 'utf8').replace(/^\uFEFF/, '')) : null
  const n = planned ? planned.length : Number(count), a = Number(from), z = Number(to), manifest = []
  for (let i = 0; i < n; i++) {
    const target = planned ? planned[i] : a + (z - a) * i / (n - 1)
    const shot = await p.evaluate(async t => {
      const root = document.getElementById('jsl-marine-native'), range = root.querySelector('input[type=range]')
      window.__args = null; range.value = (t * 100).toFixed(4); root.ucRender(); await new Promise(r => setTimeout(r, 60))
      return window.__args ? window.__settle() : null
    }, target)
    if (!shot) { console.log('no shot at', target); continue }
    const file = `f${String(i).padStart(3, '0')}.png`
    fs.writeFileSync(path.join(outDir, file), Buffer.from(shot.data.split(',')[1], 'base64'))
    manifest.push({ file, progress: +shot.progress.toFixed(5), w: shot.w, h: shot.h })
    if (i % 20 === 0) console.log(i, shot.progress.toFixed(4), `${shot.w}x${shot.h}`)
  }
  fs.writeFileSync(path.join(outDir, 'capture.json'), JSON.stringify(manifest, null, 1))
  console.log('captured', manifest.length)
  await b.close()
})()
