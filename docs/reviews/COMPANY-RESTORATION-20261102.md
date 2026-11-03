# Company headline restoration — 2026-11-02

Restored the previously approved English campaign headline “Every move. One JSL.” and orange emphasis in the existing company component. The translated about.title is preserved as the lower scene summary. Existing detail copy, values, links, media loading/failure handling and production media gate remain unchanged. Desktop keeps one headline row; mobile uses two rows.

Only approved-company-section.tsx and approved-company.css changed. No hero, transport engine, assets, backend, #49 or #52 branch changes.

Validation: changed-component ESLint and full frontend tsc --noEmit --incremental false exit 0; git diff --check exit 0; Impeccable detector returned []. Actual component source was transpiled and server-rendered with React; useContent used real locale message data and SiteLink was mocked as an anchor. Sixteen desktop/mobile before/after captures across ko/en/zh/vi: no horizontal document overflow. Captures inspected for English desktop and Korean mobile. Captures use Arial and a review-only reference image, not full Next routing, hydration, site font or surrounding-section integration. No Next build or deployment performed. Production media remains absent until a cleared suitable asset is selected; this is a headline/layout restoration, not final photographic-scene completion.

Local comparison: http://127.0.0.1:4190/company-restoration-20261102/index.html
Evidence: D:/jsl-validation/release-20261102/company-restoration
