// Plan capture positions so every step between frames is an equal amount of visible change.
// Reads a uniform pilot capture (capture.json + PNGs), measures the mean absolute difference between
// neighbouring frames on a small grey thumbnail, and spreads <count> positions evenly over the cumulative
// change. Prints the positions as JSON for capture.cjs (POSITIONS env var).
// usage: node tools/sea-frames/plan.cjs <pilotDir> <count> > positions.json
const fs = require('fs'), path = require('path')
const sharp = require(process.env.SHARP_PATH || 'sharp')
const [dir, count = '150'] = process.argv.slice(2)
;(async () => {
  const frames = JSON.parse(fs.readFileSync(path.join(dir, 'capture.json'), 'utf8'))
  const thumbs = []
  for (const f of frames) thumbs.push(await sharp(path.join(dir, f.file)).resize(160, 90, { fit: 'fill' }).greyscale().raw().toBuffer())
  const step = [0]
  for (let i = 1; i < thumbs.length; i++) { let d = 0; for (let k = 0; k < thumbs[i].length; k++) d += Math.abs(thumbs[i][k] - thumbs[i - 1][k]); step.push(d / thumbs[i].length + Number(process.env.FLOOR || 4)) } // the floor keeps slow stretches (water drift) from starving
  const total = step.reduce((a, b) => a + b, 0), n = Number(count), out = []
  let acc = 0, j = 0
  const cum = step.map(s => (acc += s))
  for (let k = 0; k < n; k++) {
    const target = total * k / (n - 1)
    while (j < cum.length - 1 && cum[j + 1] < target) j++
    const a = frames[j].progress, b = frames[Math.min(j + 1, frames.length - 1)].progress
    const span = cum[Math.min(j + 1, cum.length - 1)] - cum[j]
    out.push(+(span > 0 ? a + (b - a) * (target - cum[j]) / span : a).toFixed(5))
  }
  process.stderr.write(`change per pilot step: min ${Math.min(...step.slice(1)).toFixed(2)} max ${Math.max(...step).toFixed(2)}\n`)
  process.stdout.write(JSON.stringify(out))
})()
