# Contact integration review

This harness bundles the real ContactSection, its shared UI components, localized content and CSS. The navigation adapter replaces Next routing for this component test. It does not verify Next server rendering, hydration, production fonts, deployment CORS or the whole landing page.

Install/reuse frontend and backend project dependencies without modifying another checkout. Build into a disposable directory outside the repository:

```powershell
node tools/contact-review/build.cjs OUTPUT_DIRECTORY
```

The browser driver requires Playwright and axe-core in a separate tools directory, a Chrome executable and a disposable MongoDB binary. Set `JSL_REVIEW_DEPENDENCIES` to that tools directory, `JSL_CHROME_PATH` to Chrome, and `MONGOMS_SYSTEM_BINARY` to MongoDB. Set `MONGOMS_RUNTIME_DOWNLOAD=0` to avoid unexpected downloads. `NODE_PATH` may point to existing backend dependencies if reusing them read-only. Run:

```powershell
node tools/contact-review/browser.cjs OUTPUT_DIRECTORY
```

For low-space disposable DB tests, `JSL_TEST_SMALL_JOURNAL=1` uses smaller journal files while keeping journaling enabled. Never transfer this test tuning to the operational DB. The driver starts its own local HTTP server and disposable database, uses only synthetic inquiries, and closes both after the run. It never loads the real backend server, credentials, scheduler or operational database.

The test policy is synthetic and permitted only by the test factory option. The operational route rejects fixtures. Screenshots contain synthetic notice content and existing public website contact text; do not publish them as approved business policy.
