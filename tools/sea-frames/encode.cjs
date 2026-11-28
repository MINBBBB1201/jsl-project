// Encode captured sea frames (PNG + capture.json from capture.cjs) into the WebP sequence the landing plays.
// usage: node tools/sea-frames/encode.cjs <captureDir> <outDir> [quality]
// Needs `sharp` (resolved from SHARP_PATH or the working directory).
const fs = require('fs'), path = require('path')
const sharp = require(process.env.SHARP_PATH || 'sharp')
const [captureDir, outDir, quality = '72'] = process.argv.slice(2)
if (!captureDir || !outDir) { console.error('usage: encode.cjs <captureDir> <outDir> [quality]'); process.exit(1) }
;(async () => {
  const captured = JSON.parse(fs.readFileSync(path.join(captureDir, 'capture.json'), 'utf8'))
  fs.mkdirSync(outDir, { recursive: true })
  for (const old of fs.readdirSync(outDir)) if (/^f\d+\.webp$/.test(old)) fs.unlinkSync(path.join(outDir, old))
  const frames = []; let bytes = 0
  for (const [i, f] of captured.entries()) {
    const file = `f${String(i).padStart(3, '0')}.webp`
    const info = await sharp(path.join(captureDir, f.file)).webp({ quality: Number(quality), effort: 6, smartSubsample: true }).toFile(path.join(outDir, file))
    bytes += info.size; frames.push({ file, progress: f.progress })
  }
  const { w, h } = captured[0]
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ width: w, height: h, quality: Number(quality), frames }))
  console.log(`${frames.length} frames ${w}x${h} q${quality}: ${(bytes / 1048576).toFixed(2)} MB (${(bytes / frames.length / 1024).toFixed(0)} KB/frame)`)
})()
