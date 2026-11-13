# Approved orange landing theme — 2026-11-03

User selected the globe-led theme proposal: warm night #17100b navigation/company, orange #ff7a22 primary actions, paper #f3efe7 reading/contact. Existing fonts, factual copy, routes, transport engine and anchor logic preserved. Representative design: local orange-theme-20261103 comparison.

Implementation: orange-theme.css scoped to .journey--orange and the explicitly marked portaled Sheet. LandingPageContent opts in; LandingNavbar defaults to the old surface elsewhere. Real LogoWordmark replaces the preview's CSS image replacement; both existing logo variants retain accessible alt text, the correct dark-surface variant is shown. SheetTitle stays present but visually hidden. No body/html global theme mutation. At desktop breakpoint>=1728, redundant hero navigation is hidden while the complete header navigation remains, as in the selected proposal.

Checks before preview: changed TSX ESLint, full frontend tsc --noEmit --incremental false, git diff --check pass. Impeccable detector[]. No new dependencies. Static React review: no new effect/state/data fetch, optional theme prop, existing Sheet focus/navigation handlers unchanged. Representative palette8pairs contrast checks were performed on the selected proposal, not a full-site audit.

Actual built-preview checks and latest independent delta review pending at commit time. No main merge or production deployment. PR49/52 are separate open changes; this commit does not silently incorporate them. Company production media and image/font provenance remain separate conditions.
