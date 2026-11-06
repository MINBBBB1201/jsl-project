const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = path.resolve(process.env.REVIEW_OUTPUT || 'output/playwright/marine-finish');
const base = process.env.REVIEW_BASE_URL || 'http://localhost:4192';
const oldAsset = process.env.REVIEW_ASSET_OVERRIDE;
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
  const results = [];
  try {
    for (const [width, height] of [[1440, 900], [390, 844]]) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error' && /Shader Error|VALIDATE_STATUS|WebGL: INVALID/.test(message.text())) errors.push(message.text()); });
      await page.route('**/api/**', (route) => route.abort());
      if (oldAsset) await page.route('**/sea-vessel-photo.webp', (route) => route.fulfill({ path: oldAsset, contentType: 'image/webp' }));
      const expectedAssetHash = digest(await fs.readFile(oldAsset || path.resolve(__dirname, '../../frontend/public/images/multimodal/sea-vessel-photo.webp')));
      const servedAssetHash = page.waitForResponse((response) => response.url().endsWith('/sea-vessel-photo.webp'), { timeout: 30000 })
        .then(async (response) => { assert(response.ok(), 'Vessel texture request failed'); return digest(await response.body()); });
      const expectedRoofHash = digest(await fs.readFile(path.resolve(__dirname, '../../frontend/public/images/multimodal/roof-quality.avif')));
      const servedRoofHash = page.waitForResponse(response => response.url().endsWith('/roof-quality.avif'), {timeout:30000})
        .then(async response => {assert(response.ok(), 'Original roof request failed'); return digest(await response.body());});
      await page.goto(`${base}/en/landing`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      await page.locator('#features').scrollIntoViewIfNeeded();
      await page.waitForSelector('.pin-spacer', { timeout: 25000 });
      await page.waitForSelector('.mm-native-canvas', { state: 'attached', timeout: 25000 });
      // Probe just after the fade endpoint, beyond scroll-position rounding.
      const points = process.env.REVIEW_FOCUS_CARGO === '1' ? [.52, .58, .65, .65] : [.46, .52, .56, .58, .60, .625, .65, .72, .65];
      for (const [index, progress] of points.entries()) {
        if (width === 1440 && progress < Number(process.env.REVIEW_PC_MIN_PROGRESS || 0)) continue;
        for (let retry = 0; retry < 12; retry++) {
          await page.evaluate((value) => {
            const section = document.querySelector('#features');
            scrollTo({ top: section.getBoundingClientRect().top + scrollY + innerHeight * 14 * value, behavior: 'instant' });
          }, progress);
          await page.waitForTimeout(450);
          const actual = Number(await page.locator('.uc-screen').getAttribute('data-progress'));
          if (Math.abs(actual - progress) < .001) break;
        }
        await page.waitForFunction(() => {
          const runtime = document.querySelector('#jsl-marine-native')?.marineRuntime;
          return runtime?.daylight?.status?.state === 'ready' && runtime?.model?.group?.userData?.photoVessel?.status?.state === 'ready';
        }, null, { timeout: 45000 }).catch(async (error) => {
          console.error(JSON.stringify({width, progress, errors, runtime: await page.evaluate(() => {
            const r = document.querySelector('#jsl-marine-native')?.marineRuntime;
            return {daylight: r?.daylight?.status, photo: r?.model?.group?.userData?.photoVessel?.status, camera: document.querySelector('.uc-screen')?.dataset.nativeCamera};
          })}));
          throw error;
        });
        const info = await page.evaluate(() => {
          const screen = document.querySelector('.uc-screen');
          const runtime = document.querySelector('#jsl-marine-native').marineRuntime;
          const water = runtime.scene.children.find((child) => child.material?.fragmentShader?.includes('void wave('));
          const containers = runtime.model.group.getObjectByName('Native ISO containers / coherent paint and metric grid');
          const colors = containers?.instanceColor?.array || [];
          const instanceMatrix = containers.matrix.clone();
          let orangeModelSlots = 0, inactiveOrangeSlots = 0;
          for (let i = 0; i < colors.length; i += 3) {
            if (colors[i] > .4 && colors[i] > colors[i + 1] * 1.6 && colors[i + 1] > colors[i + 2] * 1.8) {
              containers.getMatrixAt(i / 3, instanceMatrix);
              if (Math.abs(instanceMatrix.determinant()) > .001) orangeModelSlots++; else inactiveOrangeSlots++;
            }
          }
          const body = runtime.model.cargo.getObjectByName('JSL / continuous orange container body');
          const identity = runtime.model.cargo.getObjectByName('JSL / legible original roof lettering');
          const photoMesh = runtime.model.group.getObjectByName('JSL / photo vessel');
          const roofRegistration = photoMesh.material.userData.jslOriginalRoof;
          const nativeRoof = runtime.model.cargo.userData.roofTexture;
          let visibleCargoMeshes = 0;
          runtime.model.cargo.traverse(mesh => {if (mesh.isMesh && mesh.visible) visibleCargoMeshes++;});
          return {
            progress: Number(screen.dataset.progress), fallback: screen.dataset.nativeFallback,
            camera: JSON.parse(screen.dataset.nativeCamera), photo: runtime.model.group.userData.photoVessel.status,
            daylight: runtime.daylight.status, waterShader: water?.material.fragmentShader,
            waterTime: water?.material.uniforms.seaTime.value, waterDrift: water?.material.uniforms.drift.value,
            orangeModelSlots, inactiveOrangeSlots,
            extraCargoBody: !!body, extraCargoIdentity: !!identity,
            visibleCargoMeshes, nativeBatchVisible: containers.visible, photoOpacity: photoMesh.material.opacity,
            originalRoof: roofRegistration ? {fullUV: roofRegistration.fullUV, sameTexture: roofRegistration.textureUUID === nativeRoof.uuid, sameNativeAxes: roofRegistration.nativeUV.every((v,i)=>v===runtime.model.cargo.userData.roofMesh.geometry.getAttribute('uv').array[i]), nativeUV:roofRegistration.nativeUV, width: nativeRoof.image.naturalWidth, height: nativeRoof.image.naturalHeight, macroCrop: nativeRoof.repeat.toArray(), quadPixels: roofRegistration.quadPixels} : null,
            overflow: document.documentElement.scrollWidth - innerWidth,
          };
        });
        assert(Math.abs(info.progress - progress) < .001, 'Scroll driver did not settle');
        assert.equal(info.fallback, 'false');
        assert.equal(info.overflow, 0);
        assert.equal(info.orangeModelSlots, 1, 'Native cargo grid must contain exactly one orange hero container');
        if (!oldAsset) {
          assert.equal(info.inactiveOrangeSlots, 0, 'Original native cargo grid must remain intact');
          assert.equal(info.extraCargoBody, false, 'No extra box may float over the photographic stack');
          assert.equal(info.extraCargoIdentity, false, 'No live branding plane may cover the photographic stack');
          assert(info.originalRoof?.sameTexture && info.originalRoof.fullUV, 'Photo material must reuse the unchanged full original roof');
          assert(info.originalRoof.sameNativeAxes, 'Photo roof must retain the original native UV direction');
          assert.equal(info.originalRoof.width, 6144);
          assert.equal(info.originalRoof.height, 1516);
          if (progress >= .625) {
            assert.equal(info.visibleCargoMeshes, 0, 'Every native cargo mesh must be hidden behind the registered photograph');
            assert.equal(info.nativeBatchVisible, false, 'Native stack must not double the photograph');
            assert.equal(info.photoOpacity, 1);
          } else if (progress <= .56) {
            assert(info.visibleCargoMeshes > 0 && info.nativeBatchVisible, 'Native close-up must retain its existing cargo');
          }
        }
        assert(info.waterShader, 'Live water shader missing');
        const waveletCalls = (info.waterShader.match(/wavelet\(m,/g) || []).length;
        assert.equal(waveletCalls, oldAsset ? 0 : 12, 'Wrong water version served by the local build');
        if (!oldAsset) {
          assert(info.waterShader.includes('col*=1.189207'), 'Water brightness follow-up is not in this build');
          if (progress === .65) assert.equal(info.camera.screenAngle, width === 390 ? 78 : 14, 'Wrong follow-up camera angle');
        }
        assert.equal(await servedAssetHash, expectedAssetHash, 'Served vessel texture differs from the review asset');
        assert.equal(await servedRoofHash, expectedRoofHash, 'Served original roof differs from the preserved asset');
        assert.deepEqual(errors, []);
        const shaderHash = digest(info.waterShader);
        delete info.waterShader;
        const file = `${width}-${index === points.length - 1 ? 'reverse-' : ''}${Math.round(progress * 100)}.png`;
        await page.screenshot({ path: path.join(output, file) });
        results.push({ viewport: { width, height }, file, ...info, shaderHash, waveletCalls, vesselTextureSha256: expectedAssetHash, originalRoofSha256:expectedRoofHash, errors: [...errors] });
        console.log(JSON.stringify({width, progress, file}));
      }
      await context.close();
    }
  } finally {
    await browser.close();
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({
      scope: 'Actual local Next app, Chromium emulated viewports, API requests blocked. Forward and reverse native rendering; no operational writes.',
      sourceLabel: process.env.REVIEW_SOURCE_LABEL || 'working tree',
      oldAssetOverride: !!oldAsset,
      results,
    }, null, 2));
  }
  for (const width of [1440, 390]) {
    const hold = results.find((result) => result.viewport.width === width && result.file === `${width}-65.png`);
    const reverse = results.find((result) => result.viewport.width === width && result.file === `${width}-reverse-65.png`);
    assert.deepEqual(hold.camera, reverse.camera, 'Reverse camera changed');
    assert.equal(hold.waterTime, reverse.waterTime);
    assert.equal(hold.waterDrift, reverse.waterDrift);
  }
  console.log(JSON.stringify({ cases: results.length, errors: 0, reverseCameraAndClock: 'identical', oldAssetOverride: !!oldAsset }));
})().catch((error) => { console.error(error); process.exitCode = 1; });
