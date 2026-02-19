# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.

**Current focus:** v2.5 Matrix Portfolio Overhaul — Phase 22: Token Foundation

## Current Position

Phase: 22 — Token Foundation
Plan: —
Status: Not started
Last activity: 2026-02-18 — v2.5 roadmap created (4 phases, 12 requirements mapped)

Progress: [░░░░░░░░░░░░░░░░░░░░] 0% — v2.5 Phase 22 ready to plan

Previous milestones: v2.0 COMPLETE (41/41 requirements) | v1.1 COMPLETE (16/16) | v1.0 COMPLETE

## Performance Metrics

| Metric | Value |
|--------|-------|
| v1.0 requirements | 22/22 |
| v1.1 requirements | 16/16 |
| v2.0 requirements | 41/41 |
| v2.5 requirements | 0/12 |
| Total shipped | 79/91 |

## Accumulated Context

### Decisions

All decisions logged in PROJECT.md Key Decisions table.

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
Stopped at: v2.5 roadmap created. Phase 22 ready to plan.
Resume file: None
Next action: `/gsd:plan-phase 22` to plan and execute Token Foundation
