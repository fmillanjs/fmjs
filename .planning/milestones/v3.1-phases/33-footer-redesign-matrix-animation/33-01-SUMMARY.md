---
phase: 33-footer-redesign-matrix-animation
plan: "01"
subsystem: ui
tags: [css, tailwind, next.js, server-component, animations, matrix-theme, crt]

# Dependency graph
requires:
  - phase: 32-matrix-color-harmony
    provides: Matrix color tokens (--matrix-green-border, --matrix-scan-line, --matrix-terminal) in .matrix-theme scope

provides:
  - Terminal-themed footer static shell with #0a0a0a background and Matrix green top border
  - CRT scanline texture via .footer-crt-scanlines::before CSS pseudo-element in globals.css
  - footer-glitch @keyframes + .footer-glitch-once class for Plan 33-02 GlitchSignature island
  - Terminal-prompt social links (> github, > linkedin, > email) in font-mono Matrix green
  - > EOF narrative tagline before copyright line

affects:
  - 33-02 (GlitchSignature island uses .footer-glitch-once class from this plan's globals.css additions)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component footer with inline style for #0a0a0a background (avoids Tailwind class bleed)
    - CSS pseudo-element CRT scanline overlay via .footer-crt-scanlines::before + z-index lift on direct children
    - Terminal-prompt text links (JSX {'>'} syntax) instead of icon-only links

key-files:
  created: []
  modified:
    - apps/web/components/portfolio/footer.tsx
    - apps/web/app/globals.css

key-decisions:
  - "footer-crt-scanlines CSS class placed in global scope (not inside .matrix-theme {}) — guarantees cascade from <footer> child of .matrix-theme; --matrix-scan-line token inherits correctly from parent scope"
  - "footer-glitch @keyframes placed outside .matrix-theme — allows IntersectionObserver (Plan 33-02) to add .footer-glitch-once class dynamically from any scope without specificity issues"
  - ".footer-crt-scanlines > * gets z-index: 1 via CSS rule — lifts all footer content above the ::before overlay without inline styles on every child element"
  - "background: '#0a0a0a' applied as inline style — prevents Tailwind @theme inline bleed; borderTopColor: var(--matrix-green-border) also inline for same reason"
  - "Pre-existing build failure (Next.js 15.5.12 uncaughtException: Cannot read properties of undefined) verified as pre-existing before changes; footer.tsx has zero TypeScript errors per tsc --noEmit"

patterns-established:
  - "Pseudo-element overlays: position relative on container + absolute inset-0 ::before + pointer-events: none + z-index 0; content children get position relative + z-index 1 via CSS class rule"
  - "Terminal prompt links: {'>'} JSX syntax in font-mono text-[var(--matrix-terminal)] for consistent aesthetic"

requirements-completed: [FOOTER-01, FOOTER-02, FOOTER-03, FOOTER-04]

# Metrics
duration: 3min
completed: 2026-02-21
---

# Phase 33 Plan 01: Footer Redesign — Terminal Static Shell Summary

**Terminal-themed footer with #0a0a0a background, Matrix green top border, CRT scanline texture, terminal-prompt social links (> github/linkedin/email), > EOF tagline, and glitch keyframes for Plan 33-02**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-21T08:54:51Z
- **Completed:** 2026-02-21T08:57:58Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced `bg-muted` gray footer with `#0a0a0a` dark background and `--matrix-green-border` top border (FOOTER-01)
- Replaced icon-only social links (Github, ExternalLink lucide icons) with terminal-prompt text links `> github`, `> linkedin`, `> email` in `font-mono text-[var(--matrix-terminal)]` (FOOTER-02)
- Added `> EOF` narrative tagline in `font-mono text-xs text-[var(--matrix-green-border)]` above copyright line (FOOTER-03)
- Added `.footer-crt-scanlines::before` pseudo-element rule with `repeating-linear-gradient` using `var(--matrix-scan-line)` and `pointer-events: none` to globals.css (FOOTER-04)
- Added `@keyframes footer-glitch` (11-step transform-only, Safari-safe) and `.footer-glitch-once` class for Plan 33-02 GlitchSignature IntersectionObserver integration

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CRT scanline CSS and glitch keyframes to globals.css** - `0ee8ff5` (feat)
2. **Task 2: Redesign footer.tsx as terminal-themed Server Component** - `cc96dc1` (feat)

## Files Created/Modified

- `apps/web/app/globals.css` - Added .footer-crt-scanlines::before CRT overlay rule, .footer-crt-scanlines > * z-index lift rule, @keyframes footer-glitch 11-step animation, .footer-glitch-once single-fire class
- `apps/web/components/portfolio/footer.tsx` - Full redesign: #0a0a0a background inline style, --matrix-green-border top border, footer-crt-scanlines class on <footer>, terminal-prompt social links, > EOF tagline, focus-visible ring styles on all links, removed lucide-react imports

## Decisions Made

- `footer-crt-scanlines` CSS class placed in global scope (not inside `.matrix-theme {}`) — guarantees cascade from `<footer>` child of `.matrix-theme`; `--matrix-scan-line` token inherits correctly from parent scope
- `footer-glitch` keyframes placed outside `.matrix-theme` — allows Plan 33-02 IntersectionObserver to dynamically add `.footer-glitch-once` class from any scope without specificity issues
- `.footer-crt-scanlines > *` gets `z-index: 1` via CSS rule — lifts all footer content above `::before` overlay without requiring inline styles on every child element
- `background: '#0a0a0a'` applied as inline style on `<footer>` — prevents Tailwind `@theme inline` bleed to the `bg-background` utility token

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Pre-existing build failure: `uncaughtException [TypeError: Cannot read properties of undefined (reading 'length')]` in Next.js 15.5.12 build was confirmed as pre-existing before our changes by running `git stash` and reproducing the error. Our footer.tsx has zero TypeScript errors confirmed via `npx tsc --noEmit` (only pre-existing errors in e2e test files). This is an out-of-scope environmental issue.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 33-01 complete: terminal footer static shell ready
- Plan 33-02 can now wire the GlitchSignature client island — the `.footer-glitch-once` CSS class and `footer-glitch` keyframes are in place
- Footer uses `<span>Fernando Millan</span>` placeholder in Column 1 — Plan 33-02 replaces this with the `GlitchSignature` island
- CSS `prefers-reduced-motion` media query at line 232 of globals.css (`animation-duration: 0.01ms !important`) already covers `.footer-glitch-once` — no additional reduced-motion code needed

---
*Phase: 33-footer-redesign-matrix-animation*
*Completed: 2026-02-21*

## Self-Check: PASSED

- FOUND: apps/web/components/portfolio/footer.tsx
- FOUND: apps/web/app/globals.css
- FOUND: .planning/phases/33-footer-redesign-matrix-animation/33-01-SUMMARY.md
- FOUND commit: 0ee8ff5 (Task 1)
- FOUND commit: cc96dc1 (Task 2)
