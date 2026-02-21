# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-20)

**Core value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.
**Current focus:** v3.1 — Portfolio Polish & Matrix Cohesion (Phase 30: GSAP ScrollTrigger)

## Current Position

Phase: 30 of 33 (GSAP ScrollTrigger) — Phase 29 COMPLETE
Plan: 1 of N in current phase
Status: Phase 29 complete — ready for Phase 30
Last activity: 2026-02-21 — Completed 29-03 (Lighthouse CI gate: all 5 URLs score 1.00 performance with Lenis active)

Previous milestones: v1.0 COMPLETE | v1.1 COMPLETE | v2.0 COMPLETE (41/41) | v2.5 COMPLETE (13/13) | v3.0 COMPLETE (8/8)

Progress: [█████████████████░░░] 85% (29/33 phases complete, Phase 29 complete)

## Performance Metrics

**Velocity:**
- Total plans completed (v3.0): 6 plans
- Average duration: ~2 min/plan
- Total execution time v3.0: ~12 min

**By Phase (v3.0 only):**

| Phase | Plans | Avg/Plan |
|-------|-------|----------|
| 27 | 3 | ~1.5 min |
| 28 | 3 | ~2.5 min |

*Updated after each plan completion*

## Accumulated Context

### Decisions (relevant to v3.1)

- **v2.5:** Matrix tokens in `:root` only (not `@theme inline`) — raw CSS vars via `var(--matrix-green)`, never Tailwind utilities — prevents dashboard bleed
- **v2.5:** `.matrix-theme` CSS class on portfolio layout div — scoped dark-first theming, zero dashboard side effects
- **v2.5:** `motion` (NOT `framer-motion`) import from `motion/react` — required for React 19 + Next.js 15 compatibility
- **v3.1 arch:** `LenisProvider` must be `'use client'` wrapper — ReactLenis in Server Component crashes SSR (`window is not defined`)
- **v3.1 arch:** `autoRaf: false` on ReactLenis + `gsap.ticker.add((time) => lenis.raf(time * 1000))` — prevents double RAF loop jitter with GSAP ScrollTrigger
- **29-01:** `useState(false)+useEffect` for reduced-motion gate — NOT `typeof window` inline — prevents hydration mismatch in Next.js 15 App Router
- **29-01:** `LenisScrollReset` inner component inside ReactLenis tree (not exported) — required for `useLenis()` context; handles SCROLL-02 route-change reset
- **29-01:** `LenisProvider` wraps outermost portfolio layout div — CommandPalette + PortfolioNav inside scope for upcoming 29-02 scroll lock
- **29-01:** `lerp: 0.1` shipping value; real-device feel testing may adjust to 0.08-0.12 — documented in provider comment
- **29-02:** `useLenis()` with optional chaining `lenis?.stop()/start()` in CommandPalette — returns `undefined` outside LenisProvider (dashboard); optional chaining prevents crash
- **29-02:** `useEffect([open, lenis])` as single source of truth for scroll lock — all close paths (Escape, backdrop, item select) set open=false triggering start()
- **29-03:** CHROME_PATH=~/.cache/puppeteer/chrome/linux-141.0.7390.122/chrome-linux64/chrome — WSL2 resolves system Chrome to Windows path causing ECONNREFUSED; puppeteer's Linux Chrome binary required for LHCI
- **v3.1 arch:** No `pin: true` in any ScrollTrigger — causes CLS spacer that fails Lighthouse CI >= 0.90 gate
- **v3.1 arch:** MagneticButton uses `motion/react` spring (not `gsap.to()` in mousemove) — prevents TBT spike from per-pixel tween creation
- **v3.1 arch:** Matrix color tokens scoped to `.matrix-theme {}` — never in `:root @theme inline` (Tailwind bleed to dashboard)

### Pending Todos

None.

### Blockers/Concerns

- Lenis `lerp` optimal value (default 0.10 vs 0.08) — subjective feel; needs real device testing across Chrome/Safari/Firefox (deferred — Phase 29 complete, can tune during Phase 30+)
- CSS `clip-path` glitch animation Safari compatibility — verify during Phase 33 planning; fallback is CSS typewriter reveal via `steps()`
- Playwright baselines: 18 PNGs at maxDiffPixelRatio 0.02 — Phase 32 and Phase 33 both require deliberate `--update-snapshots` run and diff review before commit

## Session Continuity

Last session: 2026-02-21
Stopped at: Completed 29-03-PLAN.md — Lighthouse CI gate, all 5 URLs score 1.00 performance, Phase 29 complete
Resume file: None
Next action: Execute Phase 30 (GSAP ScrollTrigger)
