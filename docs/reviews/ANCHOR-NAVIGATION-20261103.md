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


## Follow-up after Claude integration evidence
Claude's actual integrated build confirmed the native progress-rail fix, but mobile Sheet links and path-qualified mega-menu links still failed, also on baseline. The follow-up uses document capture before React/Next consumes the event. Navbar hash handlers no longer call scrollIntoView or use an arbitrary100ms timer; mobile callbacks still close the Sheet. The journey waits until the clicked link's Sheet is disconnected, then two animation frames for focus/scroll-lock cleanup, then measures and scrolls. Pending requests cancel on later eligible clicks or unmount.

Fixture cleanup was updated for capture listeners. Added Next-style bubble-handler simulation and a closing-sheet DOM case. Final fixture:14conditions x2viewports=28pass. These simulate event order and Sheet lifetime; they do not mount actual Next Link or Radix. Changed-navbar/journey ESLint and full frontend TypeScript pass. Actual mobile/mega-menu travel on the follow-up and independent delta review remain pending. No scene/assets changes. #53 remains open; PR29 Draft.

## Actual preview regression found and corrected
Read-only browser checks on Vercel head6eb8243 passed mobile network/contact cold and warm plus desktop mega-menu network/contact cold (six cases). The reduced-motion mobile case failed: hash changed but scroll stayed0. Removing the old navbar scroll callbacks exposed the native anchor attempt while the Sheet was still scroll-locked.

Navbar now captures same-page Sheet anchors not already claimed by the journey. It closes the Sheet, waits for Radix onCloseAutoFocus, prevents trigger focus restoration and scrolls/focuses the target after two frames. This covers reduced motion and upstream anchors while leaving active-journey handling unchanged. Modified/external/download links keep their native paths. Changed-navbar lint, full frontend TypeScript and diff-check pass. Actual latest-preview recheck pending at commit time; the failure is not reported as fixed solely from static checks.

## Reduced-motion desktop keyboard follow-up
A separate reduced-motion-only effect now captures same-page anchors before Next Link, scrolls instantly and focuses the actual target after menu selection. It excludes Sheet links, whose close/unlock handling remains in Navbar. Modified/external/download/different-query links keep native handling. Pending frame is canceled on a newer handled navigation or effect cleanup. No engine/scene/theme-button code changed.

Changed-file lint and full frontend TypeScript pass. tools/landing-review/check-reduced-focus.cjs executes the actual effect block in a browser DOM fixture: Enter sets hash/network focus and honors90px scroll margin; next Tab reaches the target's button without jumping to the header. A simulated Next bubble handler cannot consume the captured navigation. This is not an actual Next/Radix integration test; latest integration and independent review remain pending. Run with existing browser/Playwright paths or JSL_PLAYWRIGHT_MODULE/JSL_CHROMIUM_PATH overrides. No install is performed.
