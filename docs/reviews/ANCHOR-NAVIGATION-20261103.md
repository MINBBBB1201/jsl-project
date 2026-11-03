# Issue53 downstream-anchor correction — 2026-11-03

## Change
The existing lazy journey loader gated only #features/#cargo-journey. The click handler now also gates targets after the journey, waits for engine initialization and ScrollTrigger.refresh, then measures the target and scrolls/focuses it. The original journey anchors still resolve to the journey root. Initial downstream hashes use the same path. Later valid same-page clicks supersede pending navigations. Modified clicks, non-self targets, downloads, other origins/paths/query strings and invalid fragments retain native handling.

Only the wrapper's anchor navigation changed: no transport engine, timing, scene design, assets, reduced-motion fallback, PR49 or PR52 source edits. This follows the existing PR29 integration branch because the wrapper belongs to that work.

## Verification
- Changed-component ESLint, full frontend tsc --noEmit --incremental false: exit0. An initial lint command from repo root failed to find the config; reran from frontend successfully.
- node --check tools/landing-review/check-journey-anchors.cjs and git diff --check: exit0.
- Browser fixture runs the actual extracted anchor-handler block, not a reimplementation. Delayed ensure and a changing section height simulate pin insertion. At 1440/390: 11 conditions each pass after the fix; baseline d0148c7 fails five each (downstream wait, post-layout measurement, focus, last-choice behavior, initial hash).
- Fixture also checks Ctrl, new-tab, different-path/query and malformed-fragment native handling and cancellation by a newer upstream anchor.
- Fixture listener-order mistake initially invalidated race checks; corrected observation order before the final passing run. No implementation concessions made for that harness error.

## Limits / next review
Fixture does not mount React, load GSAP/Three or validate actual smooth animation/ScrollTrigger lifecycle. Full preview anchor travel at multiple positions, reduced motion, keyboard activation/back-forward behavior and #49/#52 combined integration remain to verify. No full build this turn, independent review pending. This does not close #53 yet. No merge or production deployment.

Run from repository root using installed Playwright/Chromium, or set JSL_PLAYWRIGHT_MODULE / JSL_CHROMIUM_PATH for their existing installation. No dependency installation is performed by the script.
