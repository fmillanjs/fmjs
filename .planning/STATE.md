# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-20)

**Core value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.
**Current focus:** v3.1 — Portfolio Polish & Matrix Cohesion (COMPLETE)

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-02-25 — Milestone v4.0 started (Live QA & Content Polish)

Previous milestones: v1.0 COMPLETE | v1.1 COMPLETE | v2.0 COMPLETE | v2.5 COMPLETE | v3.0 COMPLETE | v3.1 COMPLETE

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
| Phase 31-magnetic-buttons P01 | 1 | 1 tasks | 1 files |
| Phase 31-magnetic-buttons P02 | 9 | 2 tasks | 3 files |
| Phase 31-magnetic-buttons P02 | 15 | 3 tasks | 2 files |
| Phase 32-matrix-color-harmony P01 | 2 | 2 tasks | 4 files |
| Phase 32 P02 | 3 | 2 tasks | 5 files |
| Phase 32-matrix-color-harmony P03 | 2 | 2 tasks | 4 files |
| Phase 32-matrix-color-harmony P04 | 8 | 1 tasks | 10 files |
| Phase 32-matrix-color-harmony P04 | 25 | 2 tasks | 13 files |
| Phase 33-footer-redesign-matrix-animation P01 | 253 | 2 tasks | 2 files |
| Phase 33-footer-redesign-matrix-animation P02 | 177 | 2 tasks | 2 files |
| Phase 33-footer-redesign-matrix-animation P03 | 28 | 2 tasks (+ checkpoint) | 4 files + 12 PNGs |
| Phase 33-footer-redesign-matrix-animation P03 | 65 | 3 tasks | 7 files |

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
- **31-01:** `motion.div` wrapper used (not `motion.button`) — CSS transform on button breaks focus ring alignment for keyboard navigation (RESEARCH.md Pitfall 3)
- **31-01:** `getBoundingClientRect()` cached in `handleMouseEnter` only — prevents per-pixel forced reflows in mousemove that cause TBT spike (RESEARCH.md Pitfall 5)
- **31-01:** `prefersReducedMotion` null (SSR) treated as falsy — motion render on SSR is hydration-safe; only `true` triggers plain div wrapper
- **31-02:** `chromePath` in `lighthouserc.json` must be in `ci.collect` block (not `ci.collect.settings`) — LHCI uses `collect.chromePath` for its Chrome launcher; `settings.chromePath` is Lighthouse audit setting (different code path)
- **31-02:** Hero CTA renamed "Learn More" -> "View Projects" (href /about -> /projects) — primary hero CTA leads to projects showcase per MAGN-01 spec
- **32-01:** Four new Matrix green tokens inside `.matrix-theme {}` (not `:root`) — dashboard routes never have `.matrix-theme` so tokens are invisible there; prevents Tailwind @theme bleed
- **32-01:** SectionLabel is pure Server Component with `aria-hidden="true"` — decorative `> LABEL` prefix, h2 below provides accessible heading semantics; no 'use client' needed
- **32-02:** SectionLabel placed inside CaseStudySection AnimateIn wrapper — terminal prefix and h2 animate in together as a unit; single component change propagates to all 12+ case study section h2s
- **32-02:** Metric stat numbers use `font-mono` + `--matrix-terminal` (brightest green) — maximum terminal aesthetic on key data points in case study stat grids
- **32-02:** Challenge section left borders use `--matrix-green-border` (subdued) not `--matrix-green` — avoids visual competition with challenge heading text
- **32-03:** `parallax-divider` `bg-primary/30` replaced with `bg-[var(--matrix-green-border)]` — semantically correct; `--primary` in .matrix-theme context resolves to Tailwind blue (not green), so `--matrix-green-border` (#00FF4133, ~20% opacity) now accurately represents original intent
- **32-03:** Homepage stat numbers use `font-mono text-[var(--matrix-terminal)]` — consistent with case study stat pattern from 32-02; maximum terminal aesthetic on hero data points
- **32-04:** Dashboard team-detail baselines committed from CI (auth required) — visual.config.ts uses empty storageState; running --update-snapshots locally overwrites them with unauthenticated captures; must restore from git to preserve CI baselines
- **32-04:** `--primary: var(--matrix-green)` inside `.matrix-theme {}` — overrides Radix default for Button/Badge harmony in portfolio; dashboard routes (no .matrix-theme) are completely unaffected
- **32-04:** ThemeToggle removed from portfolio nav, layout.tsx locked to defaultTheme="dark" — portfolio is intentionally dark-only Matrix aesthetic; toggle was vestigial
- **33-01:** `footer-crt-scanlines` CSS class in global scope (not `.matrix-theme {}`) — guarantees cascade from `<footer>` child of `.matrix-theme`; `--matrix-scan-line` token inherits from parent scope
- **33-01:** `@keyframes footer-glitch` placed outside `.matrix-theme` — Plan 33-02 IntersectionObserver can add `.footer-glitch-once` from any scope without specificity issues
- **33-01:** `background: '#0a0a0a'` applied as inline style on `<footer>` — prevents Tailwind `@theme inline` bleed to `bg-background` utility token
- **33-02:** `footer.tsx` must be `'use client'` — Next.js 15 forbids `next/dynamic ssr:false` in Server Components; consistent with `hero-section.tsx` pattern
- **33-02:** `entries[0]?.isIntersecting` optional chain — TypeScript strict mode treats array index access as `T | undefined`; runtime identical since IntersectionObserver always fires with entries
- **33-03:** `ScrambleHero role="img"` — ARIA spec requires role on span for aria-label to be valid; role=img is semantically correct for dynamic text with stable accessible name
- **33-03:** `html:not(.dark) .matrix-theme footer` — footer always has dark #0a0a0a inline background; footer selector restores bright #00FF41 green tokens that would otherwise be overridden by light-mode rules
- **33-03:** Dashboard baselines restored from git — visual.config.ts runs all e2e tests; --update-snapshots overwrites dashboard baselines with unauthenticated captures; must git restore (same as 32-04)
- **33-03:** `accessibility.spec.ts waitForTimeout(500)` in both light and dark mode tests — defaultTheme=dark means .dark class is added post-hydration; without this wait axe captures pre-hydration state causing false color contrast violations in project card elements

### Pending Todos

None.

### Blockers/Concerns

- Lenis `lerp` optimal value (default 0.10 vs 0.08) — subjective feel; needs real device testing across Chrome/Safari/Firefox (deferred — Phase 29 complete, can tune during Phase 30+)
- CSS `clip-path` glitch animation Safari compatibility — verify during Phase 33 planning; fallback is CSS typewriter reveal via `steps()`
- Playwright baselines: 18 PNGs at maxDiffPixelRatio 0.02 — Phase 32 and Phase 33 both require deliberate `--update-snapshots` run and diff review before commit

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Fix Devcollab demo URLs, demo box color, and View Source GitHub links | 2026-02-21 | 8670075 | [1-fix-devcollab-demo-urls-demo-box-color-a](./quick/1-fix-devcollab-demo-urls-demo-box-color-a/) |
| 2 | Fix DevCollab live demo URL from localhost to https://devcollab.fernandomillan.me | 2026-02-21 | 3d3eabd | [2-the-link-in-projects-dev-collab-is-point](./quick/2-the-link-in-projects-dev-collab-is-point/) |
| 3 | Fix broken View Source GitHub links on DevCollab and TeamFlow (404 branch URLs -> root monorepo) | 2026-02-22 | 73ea0d6 | [3-fix-broken-github-links-for-devcollab-an](./quick/3-fix-broken-github-links-for-devcollab-an/) |

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed quick task 3 — Fix broken View Source GitHub links on DevCollab and TeamFlow
Resume file: None
Next action: All phases complete. Project ready for deployment or next major milestone planning.
