# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-20)

**Core value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.
**Current focus:** v3.1 — Portfolio Polish & Matrix Cohesion (Phase 31: Magnetic Buttons)

## Current Position

Phase: 31 of 33 (Magnetic Buttons) — Phase 30 COMPLETE
Plan: Next plan in Phase 31
Status: 30-02 complete — ParallaxDivider scaleX + Lighthouse CI gate; Phase 30 COMPLETE (PRLLX-01, PRLLX-02, PRLLX-03 all verified)
Last activity: 2026-02-21 — Completed 30-02 (ParallaxDivider scaleX 0.92→1.04 + LHCI 1.00 + human visual verify approved)

Previous milestones: v1.0 COMPLETE | v1.1 COMPLETE | v2.0 COMPLETE (41/41) | v2.5 COMPLETE (13/13) | v3.0 COMPLETE (8/8)

Progress: [█████████████████░░░] 88% (30/33 phases complete, Phase 31 next)

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
| 30 | 1 (30-01) | ~2 min |

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
- **30-01:** `LenisGSAPBridge` uses named `tickerFn` variable (not inline arrow) — same reference required for `gsap.ticker.remove()` to work correctly
- **30-01:** `gsap.ticker.lagSmoothing(0)` — prevents GSAP jump-catch-up when tab regains focus after being backgrounded
- **30-01:** `overflow-hidden` on hero section (not textRef div) — MatrixRainCanvas is `absolute inset-0` so canvas stays clipped correctly without breaking background effect
- **30-02:** `ParallaxDivider` uses `origin-center` on line + `overflow-hidden` on container — scaleX expands symmetrically from center, clipped at container edges, CLS = 0 confirmed by LHCI
- **30-02:** `bg-primary/30` for divider line — Matrix green at 30% opacity within `.matrix-theme`; avoids blue Radix bleed, consistent with portfolio color tokens
- **30-02:** `scrub: 1` on scaleX — defers entirely to RAF, blends with Lenis inertia, prevents TBT spike on main thread
- **30-02:** `projects/page.tsx` and `contact/page.tsx` skipped for ParallaxDivider inserts — single-section layouts where forcing a divider would be visually incorrect

### Pending Todos

None.

### Blockers/Concerns

- Lenis `lerp` optimal value (default 0.10 vs 0.08) — subjective feel; needs real device testing across Chrome/Safari/Firefox (deferred — Phase 29 complete, can tune during Phase 30+)
- CSS `clip-path` glitch animation Safari compatibility — verify during Phase 33 planning; fallback is CSS typewriter reveal via `steps()`
- Playwright baselines: 18 PNGs at maxDiffPixelRatio 0.02 — Phase 32 and Phase 33 both require deliberate `--update-snapshots` run and diff review before commit

## Session Continuity

Last session: 2026-02-21
Stopped at: Completed 30-02-PLAN.md — ParallaxDivider scaleX 0.92→1.04 + LHCI gate (1.00 performance, CLS=0) + human visual verify all 8 checks passed. Phase 30 COMPLETE.
Resume file: None
Next action: Execute Phase 31 (Magnetic Buttons)
