# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.

**Current focus:** v2.5 Matrix Portfolio Overhaul — Phase 22: Token Foundation COMPLETE — next: Phase 23 (Canvas + RAF)

## Current Position

Phase: 22 — Token Foundation COMPLETE
Plan: 03 of 03 complete
Status: Phase complete — ready for Phase 23
Last activity: 2026-02-18 — 22-03 (CSS Visual Effects) executed: cursor-blink FX-02 + card-glow-hover UX-01 shipped, Playwright snapshots updated (13/13 pass)

Progress: [█████░░░░░░░░░░░░░░░] 22% — v2.5 Phase 22 complete (3/3 plans), Phase 23 next

Previous milestones: v2.0 COMPLETE (41/41 requirements) | v1.1 COMPLETE (16/16) | v1.0 COMPLETE

## Performance Metrics

| Metric | Value |
|--------|-------|
| v1.0 requirements | 22/22 |
| v1.1 requirements | 16/16 |
| v2.0 requirements | 41/41 |
| v2.5 requirements | 6/12 (THEME-01, THEME-02, THEME-03, THEME-04, FX-02, UX-01 complete) |
| Total shipped | 85/91 |

## Accumulated Context

### Decisions

- **22-01:** Matrix tokens in :root (not @theme) — raw CSS vars consumed as var(--matrix-green), not Tailwind utility tokens
- **22-01:** matrix-theme first class on portfolio layout div — no CSS rules attached in Phase 22 (dormant selector hook)
- **22-01:** THEME-04 layered: CSS global rule (Phase 22), RAF check (Phase 23), MotionConfig (Phase 24)
- **22-02:** Use motion (NOT framer-motion) — import path is motion/react in all downstream phases
- **22-02:** Lenis installed but not initialized — activation deferred to Phase 26 (ANIM-06) with "use client" wrapper
- **22-02:** Animation packages as runtime dependencies (not devDependencies) — used in client components at runtime
- **22-03:** card-glow-hover class on Link wrapper (not Card) — hover area matches clickable region, no Card component coupling
- **22-03:** No new reduced-motion CSS needed — Plan 01 block covers cursor-blink::after via animation-duration: 0.01ms
- **22-03:** Removed hover:shadow-xl transition-shadow from inline cards and transition-shadow hover:shadow-lg from ProjectCard — card-glow-hover replaces both

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

### Pending Todos

None.

### Blockers/Concerns

**v3.0 (Deployment) — deferred:**
- Coolify per-service webhook trigger behavior for a second app is not fully documented. Plan for hands-on iteration when configuring devcollab-web + devcollab-api deployment pipeline.
- NEXT_PUBLIC_API_URL must be set in Coolify environment for devcollab-web — Docker prod gap from v2.0 audit.

## Session Continuity

Last session: 2026-02-18
Stopped at: Completed 22-03-PLAN.md — CSS Visual Effects (FX-02 cursor-blink + UX-01 card-glow-hover + Playwright snapshots updated)
Resume file: None
Next action: Begin Phase 23 (Canvas + RAF) — dot grid background + reduced-motion RAF check
