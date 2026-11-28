# Sea frame sequence

The landing's sea section (journey progress 0.456 to 0.825) plays pre-rendered frames from
`frontend/public/images/multimodal/sea-frames/{desktop,mobile}/` instead of rendering the vessel and
water in real time. The live renderer still exists for producing those frames: open the landing with
`?sea=3d` to run it.

## Regenerating the frames

Run from the repository root with Node 18+, Playwright and sharp available (set `PLAYWRIGHT_PATH`,
`SHARP_PATH` and `CHROME_PATH` if they are not resolvable from here). `URL` is a page that runs the live
renderer: a local `next start` with `?sea=3d`, for example `http://localhost:3100/en/landing?sea=3d`.

1. Pilot capture, evenly spaced (desktop 1600x900 canvas, mobile 720x1560):

   ```
   node tools/sea-frames/capture.cjs URL pilot/desktop 1615 900 120 .456 .825
   node tools/sea-frames/capture.cjs URL pilot/mobile 735 1560 120 .456 .825
   ```

2. Plan positions so each step shows a similar amount of change (denser in the zoom and tilt):

   ```
   node tools/sea-frames/plan.cjs pilot/desktop 160 > positions-desktop.json
   node tools/sea-frames/plan.cjs pilot/mobile 160 > positions-mobile.json
   ```

3. Capture at those positions, then encode to WebP with a manifest:

   ```
   POSITIONS=positions-desktop.json node tools/sea-frames/capture.cjs URL final/desktop 1615 900
   POSITIONS=positions-mobile.json node tools/sea-frames/capture.cjs URL final/mobile 735 1560
   node tools/sea-frames/encode.cjs final/desktop frontend/public/images/multimodal/sea-frames/desktop 78
   node tools/sea-frames/encode.cjs final/mobile frontend/public/images/multimodal/sea-frames/mobile 78
   ```

The viewport sizes include the 15 px scrollbar of headed Chrome on Windows, so the canvas comes out at
1600x900 and 720x1560. Captures wait for the HDR daylight and the vessel photograph before starting.
