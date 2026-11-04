# Theme-trigger idle measurement follow-up

Base PR49 head: 717ad0f58c8882ebce9a45455c4f0186c7df6d6f. The trigger's 450ms settle callback recursively schedules itself, so a stationary landing page keeps querying target geometry indefinitely. This was observed in the matching READY Vercel preview: one 450ms callback was scheduled seven times in3.5 seconds at scrollY0. This is a behavioral observation, not a quantified battery/CPU benchmark.

Candidate uses a single delayed measurement after scroll/resize, target attribute/size observers for visibility and geometry, and a filtered structure observer to discover later-loaded/replaced targets. Unrelated engine text updates do not cause target rescans. Existing cleanup disconnects observers and removes listeners. Trigger transform transitions are disabled so it vacates an interactive AIR tab immediately rather than briefly covering it during the move; no scene animation or engine code is changed.

## Validation
- Actual-source browser DOM fixture `tools/landing-review/check-theme-trigger-idle.cjs` compares baseline717ad0f and candidate: baseline2 idle measurements in1.1sec versus candidate0; after scroll candidate performs the immediate and one delayed check then remains idle. Added/hidden/shown/removed navigation and cleanup are exercised; unrelated text insertion causes no candidate remeasure.
- Changed-file ESLint, full frontend TypeScript and git diff --check pass. No package changes or installation. Fixture requires an existing Playwright and browser; set JSL_PLAYWRIGHT_MODULE and JSL_CHROMIUM_PATH when they are outside normal resolution.
- This fixture extracts the actual geometry/effect block but does not mount React, Next or the full transport engine. Actual preview check, full-app performance and independent latest-delta review remain pending. No battery/performance improvement has been measured.

No change to PR29, PR49's author-owned branch, PR52, assets, transport scenes, backend, main or production.

## Follow-up: service navigation at 320 × 640
The deployed 24f6572 preview showed the theme trigger covering the EXPRESS service navigation item. The avoidance list now also observes the service navigation. The source fixture reads the selector list from the implementation and checks late insertion of that navigation. Real combined-preview validation and a fresh independent review of this follow-up remain required.

The first follow-up preview (d97010f) moved the trigger off the service buttons but over the description at 320×640. A second follow-up adds the full service-information region to avoidance only at viewport widths of 480px or less. The fixture exercises late insertion of that larger region; an actual preview and renewed independent review are still needed.
