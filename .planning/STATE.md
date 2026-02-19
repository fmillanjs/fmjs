# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.

**Current focus:** v3.0 Deployment & Tech Debt Closure — defining requirements

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-02-19 — Milestone v3.0 started

Previous milestones: v2.0 COMPLETE (41/41 requirements) | v1.1 COMPLETE (16/16) | v1.0 COMPLETE

## Performance Metrics

| Metric | Value |
|--------|-------|
| v1.0 requirements | 22/22 |
| v1.1 requirements | 16/16 |
| v2.0 requirements | 41/41 |
| v2.5 requirements | 13/13 (THEME-01, THEME-02, THEME-03, THEME-04, FX-01, FX-02, FX-03, FX-04, UX-01, ANIM-01, ANIM-02, ANIM-03, UX-04 complete) |
| Total shipped | 92/92 |
| Phase 22 P04 | 1 | 2 tasks | 2 files |
| Phase 23-canvas-matrix-rain P01 | 2 | 2 tasks | 2 files |
| Phase 23-canvas-matrix-rain P02 | 1 | 2 tasks | 3 files |
| Phase 23-canvas-matrix-rain P03 | 1 | 2 tasks | 2 files |
| Phase 23-canvas-matrix-rain P04 | 0e592f2 | 3 tasks | 1 file |
| Phase 24-scroll-animations-entrance P01 | a0cc624 | 3 tasks | 4 files |
| Phase 24 P02 | 3 | 3 tasks | 6 files |
| Phase 24-scroll-animations-entrance P03 | 5 | 1 tasks | 3 files |
| Phase 24 P03 | 15 | 2 tasks | 2 files |
| Phase 25-personality-effects P01 | a3609ab | 2 tasks | 3 files |
| Phase 25-personality-effects P02 | a956a1c | 2 tasks | 2 files |
| Phase 25-personality-effects P03 | 908899e | 2 tasks | 3 files |
| Phase 25-personality-effects P04 | 190f5db | 2 tasks | 0 files |
| Phase 26-navigation-redesign P01 | 1f8afe9 | 2 tasks | 1 file |
| Phase 26-navigation-redesign P02 | c6183af | 3 tasks | 2 files |

## Accumulated Context

### Decisions

- **22-01:** Matrix tokens in :root (not @theme) — raw CSS vars consumed as var(--matrix-green), not Tailwind utility tokens
- **22-01:** matrix-theme first class on portfolio layout div — CSS rules attached in 22-04 (was dormant hook until gap closure)
- **22-04:** .matrix-theme CSS activated with raw hex literals (#0a0a0a background, #e8e8e8 color) — avoids var(--background) which resolves to light values outside .dark context
- **22-01:** THEME-04 layered: CSS global rule (Phase 22), RAF check (Phase 23), MotionConfig (Phase 24)
- **22-02:** Use motion (NOT framer-motion) — import path is motion/react in all downstream phases
- **22-02:** Lenis installed but not initialized — activation deferred to Phase 26 (ANIM-06) with "use client" wrapper
- **22-02:** Animation packages as runtime dependencies (not devDependencies) — used in client components at runtime
- **22-03:** card-glow-hover class on Link wrapper (not Card) — hover area matches clickable region, no Card component coupling
- **22-03:** No new reduced-motion CSS needed — Plan 01 block covers cursor-blink::after via animation-duration: 0.01ms
- **22-03:** Removed hover:shadow-xl transition-shadow from inline cards and transition-shadow hover:shadow-lg from ProjectCard — card-glow-hover replaces both
- [Phase 22]: 22-04: .matrix-theme uses raw hex literals (#0a0a0a bg, #e8e8e8 fg) — var(--background) resolves to light values outside .dark context
- [Phase 23-01]: CSS opacity 0.05 on canvas element (not ctx.globalAlpha) — composites entire frame at 5% so trail effect works correctly
- [Phase 23-01]: hero-section.tsx converted to 'use client' — Next.js 15 blocks dynamic(ssr:false) from Server Components (#72236)
- [Phase 23-02]: @lhci/cli scoped to apps/web devDependencies only — Lighthouse CI is a portfolio web concern, not a monorepo root concern
- [Phase 23-02]: lighthouserc.json URL list corrected to ANIM-03 spec: /about and /login replaced with /projects/devcollab and /contact
- [Phase 23-03]: Pre-existing axe violations (button-name on theme toggle, color-contrast on nav links) accepted as out-of-scope — canvas aria-hidden passes cleanly; use --grep flag to limit Playwright snapshot regeneration to targeted test names only
- [Phase 23-04]: WSL2 lhci requires Playwright Chromium at /home/doctor/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome with --no-sandbox --disable-dev-shm-usage — system Chrome not available in WSL2
- [Phase 23-04]: SC5 heap check accepted via code review when Chrome DevTools is inaccessible — cancelAnimationFrame(rafId) in useEffect cleanup return is the correct pattern; code review is sufficient evidence
- [Phase 24-01]: MotionProvider wraps only <main> in layout.tsx — not nav, footer, or CommandPalette
- [Phase 24-01]: itemVariants typed as Variants with 'easeOut' as const — motion/react strict Easing type requires literal narrowing (string rejected)
- [Phase 24-01]: StaggerItem uses variants prop only (no initial/whileInView) — inherits animation state from StaggerContainer parent via motion variant propagation
- [Phase 24]: Modified CaseStudySection at shared component level — h2 AnimateIn covers all case study routes without touching individual page files
- [Phase 24]: All portfolio page files remain Server Components — AnimateIn/StaggerContainer 'use client' boundary stays inside those components
- [Phase 24-03]: emulateMedia({ reducedMotion: 'reduce' }) before page.goto() in visual regression tests — captures final state, not mid-animation state, for deterministic baselines
- [Phase 24]: emulateMedia({ reducedMotion: 'reduce' }) before page.goto() in visual regression tests — captures final state, not mid-animation state, for deterministic baselines
- [Phase 25-01]: Hand-rolled RAF hook (not use-scramble package) — avoids React 19 peer dep uncertainty; ~50 lines, zero risk
- [Phase 25-01]: Non-breaking space (\\u00A0) fallback in ScrambleHero prevents layout collapse when display is empty string on first frame
- [Phase 25-01]: aria-label={text} on scramble span — screen readers announce real name, not noise characters
- [Phase 25-01]: ScrambleHero not wrapped in next/dynamic — already inside 'use client' HeroSection loaded via dynamic(ssr:false)
- [Phase 25-02]: EvervaultCard noise overlay uses pointer-events-none — prevents click interception on project card links
- [Phase 25-02]: useMotionValue + useMotionTemplate for mask-image updates outside React render cycle — no re-render per mousemove for gradient position
- [Phase 25-02]: EvervaultCard wraps inner card content, not Link wrapper — preserves card-glow-hover behavior on the Link element
- [Phase 25-02]: page.tsx remains a Server Component; RSC can import and render Client Components without 'use client'
- [Phase 25-03]: opacity: 0.08 for dot-grid overlay — maximum subtlety, atmospheric depth not distracting
- [Phase 25-03]: any-hover: hover CSS guard (not pointer: fine) — correctly enables spotlight on hybrid laptop+touch devices
- [Phase 25-03]: Initial --cursor-x: -9999px positions spotlight off-screen before first mousemove event
- [Phase 25-04]: Quality gate plan pattern — final plan in phase runs lhci autorun (automated) + human-verify checkpoint; both must pass before phase is marked complete
- [Phase 25-04]: Phase 25 human verification approved on first attempt — SC-1 through SC-5 all confirmed without rework
- [Phase 26-01]: No LayoutGroup wrapper needed — only one nav in the DOM, layoutId resolves within same tree without explicit group scope
- [Phase 26-01]: globals.css prefers-reduced-motion rule (Phase 22) automatically kills CSS hover transition — no new CSS needed for UX-04
- [Phase 26-01]: Mobile nav active state uses left-border accent (border-l-2) not bottom underline — appropriate for vertical list layout
- [Phase 26-02]: Playwright strict mode requires .first() on selectors that match multiple elements — ambiguous getByRole selectors must be narrowed
- [Phase 26-02]: lhci startServerCommand must use 'node .next/standalone/apps/web/server.js' — 'next start' returns 500 on output:standalone builds
- [Phase 26-02]: Phase 26 human verification approved on first attempt — SC-1 through SC-5 all confirmed without rework

### v2.5 Critical Constraints (carry into every plan)

- Install `motion` NOT `framer-motion` — import from `motion/react` not `framer-motion`
- Canvas component must be `"use client"` in a dedicated wrapper, loaded via `next/dynamic({ ssr: false })` from that wrapper — Next.js 15 regression #72236 blocks calling `dynamic(..., { ssr: false })` directly from a Server Component
- `.matrix-theme` CSS class scoped to `(portfolio)/layout.tsx` wrapper div only — never applied globally
- ANIM-03 (Lighthouse ≥ 0.90) is a hard gate between Phase 23 and Phase 24 — do not start Phase 24 until `lhci autorun` passes on all five portfolio URLs
- THEME-04 (reduced motion) implementation spans phases: global CSS rule in Phase 22, canvas RAF check in Phase 23, MotionConfig in Phase 24
- Only animate `transform` and `opacity` — never `height`, `width`, `margin`, `padding` (CLS risk)
- FX-04 (dot grid + spotlight cursor) must be built as a paired unit — do not build one without the other
- FX-01 (text scramble) fires exactly once on mount and never loops
- Spotlight/cursor effects must be gated behind `(any-hover: hover) and (pointer: fine)` media query — disabled on touch devices

### Research Flags (carry to relevant phases)

- **Phase 25 (FX-01):** Verify `use-scramble` React 19 peer dependency compatibility before install. Fallback: GSAP ScrambleTextPlugin (gsap already installed in Phase 22, zero additional cost)
- **Phase 25 (FX-04):** Test spotlight effect on real mobile device (iOS Safari + Android Chrome) — DevTools mobile emulation is unreliable for `mousemove`-based effects

### Roadmap Evolution

- Phase 26 added: Navigation Redesign — Awwwards-style horizontal nav with Matrix personality

### Pending Todos

None.

### Blockers/Concerns

**v3.0 (Deployment) — deferred:**
- Coolify per-service webhook trigger behavior for a second app is not fully documented. Plan for hands-on iteration when configuring devcollab-web + devcollab-api deployment pipeline.
- NEXT_PUBLIC_API_URL must be set in Coolify environment for devcollab-web — Docker prod gap from v2.0 audit.

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 26-02-PLAN.md — Phase 26 quality gate: lhci 1.0, Playwright 10/10, human SC-1-SC-5 approved
Resume file: None
Next action: Phase 27 (to be planned)
