# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.

**Current focus:** v2.5 Matrix Portfolio Overhaul — Phase 23: Canvas + RAF — Plan 02 complete (@lhci/cli installed, lighthouserc.json fixed to ANIM-03 spec)

## Current Position

Phase: 23 — Canvas + RAF (In Progress)
Plan: 02 of 04 complete
Status: In progress — 23-01 done (ANIM-02 shipped), 23-02 done (@lhci/cli + lighthouserc.json), 23-03 next
Last activity: 2026-02-19 — 23-02 (@lhci/cli installed in apps/web, lighthouserc.json corrected to five ANIM-03 URLs: /, /projects, /projects/teamflow, /projects/devcollab, /contact)

Progress: [██████████░░░░░░░░░░] 33% — v2.5 Phase 23 in progress (2/4 plans), ANIM-02 + ANIM-03 infra complete

Previous milestones: v2.0 COMPLETE (41/41 requirements) | v1.1 COMPLETE (16/16) | v1.0 COMPLETE

## Performance Metrics

| Metric | Value |
|--------|-------|
| v1.0 requirements | 22/22 |
| v1.1 requirements | 16/16 |
| v2.0 requirements | 41/41 |
| v2.5 requirements | 8/12 (THEME-01, THEME-02, THEME-03, THEME-04, FX-02, UX-01, ANIM-02, ANIM-03 complete) |
| Total shipped | 87/91 |
| Phase 22 P04 | 1 | 2 tasks | 2 files |
| Phase 23-canvas-matrix-rain P01 | 2 | 2 tasks | 2 files |
| Phase 23-canvas-matrix-rain P02 | 1 | 2 tasks | 3 files |

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

Last session: 2026-02-19
Stopped at: Completed 23-02-PLAN.md — @lhci/cli installed in apps/web, lighthouserc.json corrected to ANIM-03 spec (five portfolio URLs + minScore 0.9)
Resume file: None
Next action: Phase 23 Plan 03 — canvas RAF prefers-reduced-motion gate + dot-grid background
