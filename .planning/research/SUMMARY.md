# Project Research Summary

**Project:** Fernando Millan Portfolio — v3.1 Polish & Matrix Cohesion
**Domain:** Animation polish, smooth scroll, parallax depth, interactive CTAs, Matrix aesthetic
**Researched:** 2026-02-20
**Confidence:** HIGH

## Executive Summary

This milestone (v3.1) is a visual polish and aesthetic cohesion pass on an already-deployed Next.js 15 App Router portfolio. The goal is not to build new features in the product sense — it is to wire up animation libraries already installed but not yet used (Lenis, GSAP, @gsap/react), apply consistent Matrix color tokens across all portfolio sections, redesign the footer for narrative closure, and add magnetic button physics to primary CTAs. Every dependency required is already in `node_modules`. No new packages are needed.

The recommended approach is a strict phased delivery ordered by dependency chain: Lenis smooth scroll first (it is the scroll runtime everything else depends on), GSAP ScrollTrigger parallax second (requires Lenis ticker sync before it can work), then magnetic buttons and Matrix color harmony in parallel (both are independent of each other), and finally the footer redesign last (highest Playwright snapshot surface area, fully self-contained). This ordering minimizes debugging complexity by ensuring each moving part is stable before the next is added.

The primary risks are not technical novelty but integration correctness: the Lenis + GSAP ticker sync pattern is well-documented but frequently botched in older tutorials, the `useGSAP` hook cleanup discipline must be applied from the start to prevent ScrollTrigger memory leaks on navigation, and Playwright visual regression baselines must be updated deliberately at every phase that changes rendered colors. The Lighthouse CI gate (≥ 0.90 performance across 5 URLs) is the hard constraint guarding every phase merge — and all libraries are already installed so there is zero new bundle delta to worry about.

## Key Findings

### Recommended Stack

All four animation libraries are already installed in `apps/web/package.json`: `lenis@1.3.17`, `gsap@3.14.2`, `@gsap/react@2.1.2`, `motion@12.34.2`. Zero new dependencies are required for any v3.1 feature. The only required "setup" work is importing `lenis/dist/lenis.css` into `globals.css` and adding four new CSS custom property tokens for Matrix color extension (`--matrix-green-subtle`, `--matrix-green-border`, `--matrix-scan-line`, `--matrix-terminal`). No Tailwind `@theme inline` changes — Matrix tokens stay in `:root` only.

**Core technologies:**
- `lenis@1.3.17` via `ReactLenis` from `lenis/react`: Document-level smooth scroll provider — the `root` prop wraps native document scroll; `options={{ autoRaf: false }}` is mandatory when GSAP ScrollTrigger is also used
- `gsap@3.14.2` + `ScrollTrigger` + `@gsap/react@2.1.2` via `useGSAP`: Scroll-position-tied parallax — `useGSAP` is required (not `useEffect`) for React 19 cleanup correctness; `{ scope: containerRef }` limits cleanup per component and prevents cross-page leaks
- `motion@12.34.2` via `motion/react` (`useMotionValue` + `useSpring`): Spring physics for magnetic buttons — consistent with all existing portfolio animations (nav, scroll-reveal, hover); no second animation system introduced
- CSS custom properties only: Matrix color extension — four new `:root` tokens scoped to `.matrix-theme`; no libraries, no Tailwind utilities

### Expected Features

**Must have (table stakes):**
- Lenis smooth scroll across all portfolio pages — absence is jarring at this quality level; 20-line wrapper component, library installed
- Matrix color consistency across all portfolio sections — current blue Radix `--primary` mismatch in `about/page.tsx`, `contact/page.tsx`, footer, case study pages, and `tech-stack.tsx` is the most visible visual inconsistency
- Anchor links and route-change scroll-to-top with Lenis — without scroll reset, users land mid-page on navigation (confirmed GitHub issue #319)
- Reduced-motion bypass at the JS layer for Lenis — existing three-layer gate (CSS + RAF + MotionConfig) must extend to Lenis initialization; skip `<ReactLenis>` when `prefers-reduced-motion: reduce` is active
- Footer Matrix theming — current `bg-muted` footer visually disconnects from the dark-terminal portfolio aesthetic

**Should have (competitive differentiators):**
- GSAP ScrollTrigger parallax on hero text drift and section separator decorations — depth effect that elevates from "animated" to "crafted"
- Magnetic buttons on hero CTAs ("View Projects", "View GitHub") and contact CTA ("Get In Touch") — spring-physics pull applied to 2–3 CTAs max; applied everywhere is gimmicky
- CRT scanline texture on footer via CSS `::before` pseudo-element — zero JS, zero cost, immediate visual upgrade over current plain footer
- CSS glitch text on "Fernando Millan" footer signature, firing once via IntersectionObserver — memorable narrative close that differs mechanically from the hero scramble
- Terminal-prompt social links (`> github`, `> email`) and `> EOF` tagline in footer — narrative coherence with the terminal theme

**Defer (v2+):**
- Inner-content magnetic parallax (text at 60% of button movement) — ship basic magnetic first, validate the feel before adding complexity
- Scrolling katakana ticker in footer — low information density relative to effort; CSS scanlines cover the texture need
- Parallax on all portfolio sections — validate Phase 2 Lighthouse impact on targeted sections first before expanding scope
- Magnetic glow intensification on cursor proximity — additive polish layer on top of the basic magnetic effect

### Architecture Approach

The integration adds a thin new `LenisProvider` layer inside the existing `(portfolio)/layout.tsx`, wrapping `<main>` and `<PortfolioFooter>` but leaving `<DotGridSpotlight>`, `<PortfolioNav>`, and `<CommandPalette>` outside. The `<MotionProvider>` moves inside `LenisProvider`. New client-only components follow the established pattern: `'use client'` providers for stateful scroll logic, `next/dynamic(ssr: false)` for canvas/animation islands — identical to how `MatrixRainCanvas` is handled in `hero-section.tsx`. The animation library split remains intentional: motion/react owns entrance animations and spring interactions; GSAP owns scroll-position-tied transforms. No cross-contamination between the two systems.

**Major components:**
1. `LenisProvider` (new, `providers/lenis-provider.tsx`) — ReactLenis root instance; wires GSAP ticker (`autoRaf: false` + `gsap.ticker.add`); ScrollTrigger event sync; scoped exclusively to `(portfolio)/layout.tsx`
2. `LenisScrollRestorer` (new, `components/portfolio/lenis-scroll-restorer.tsx`) — zero-render child; `useLenis()` + `usePathname()` → `lenis.scrollTo(0, { immediate: true })` on route change
3. `MagneticButton` (new, `components/portfolio/magnetic-button.tsx`) — `motion.div` with `useMotionValue` + `useSpring`; `useReducedMotion()` guard returns plain `<div>`; applied only to primary CTAs
4. `FooterMatrixEffect` (new, `components/portfolio/footer-matrix-effect.tsx`) — isolated dynamic client animation island inside the server-component footer; CRT scanlines + single-fire glitch text
5. `globals.css` (modified) — four new CSS tokens in `:root`; Lenis required CSS rules; `@import "lenis/dist/lenis.css"`; no changes to `@theme inline`

### Critical Pitfalls

1. **ReactLenis placed in a Server Component crashes SSR** (`ReferenceError: window is not defined`) — always wrap `<ReactLenis>` in a `'use client'` provider component, identical to the existing `MotionProvider` pattern; this is the first thing to get right in Phase 1

2. **`autoRaf: true` with GSAP ScrollTrigger creates two competing RAF loops** — scroll jitter, `useScroll` value drift, browser freeze on fast scroll; fix: `options={{ autoRaf: false }}` on ReactLenis + `gsap.ticker.add((time) => lenis.raf(time * 1000))` + `gsap.ticker.lagSmoothing(0)`; this is the canonical pattern from the official Lenis README

3. **Lenis carries scroll position across Next.js soft navigation** — user clicks a link while scrolled down, lands mid-page on new route; fix: `LenisScrollRestorer` component with `lenis.scrollTo(0, { immediate: true })` on pathname change; `immediate: true` is the critical detail that skips the easing

4. **Lenis breaks Radix Dialog/CommandPalette scroll lock** — `overflow: hidden` on `<body>` has no effect against Lenis's RAF-driven scroll; the existing `CommandPalette` in the portfolio layout will regress immediately on Lenis activation; fix: `lenis.stop()` on modal open, `lenis.start()` on close, `data-lenis-prevent` on scrollable modal content

5. **`gsap.to()` in mousemove handler spikes Lighthouse Total Blocking Time** — creates hundreds of concurrent tween objects per second (30% of Lighthouse score); fix: `gsap.quickTo()` creates a single reusable setter; for this project motion/react spring is used instead of GSAP quickTo, which avoids the problem entirely

6. **Playwright baselines break on every visual color change** — 18 existing PNG baselines at `maxDiffPixelRatio: 0.02`; Matrix color harmony across project cards and sections will fail 6–8 tests; this is not a bug — update baselines deliberately with `--update-snapshots`, review diffs, commit in the same commit as the color change

7. **Matrix color tokens in `@theme inline` bleed into dashboard** — `text-matrix-green` Tailwind utility would activate in TeamFlow/DevCollab where `--matrix-green` is not in scope; fix: keep all Matrix tokens in `:root` only; consume via `var(--matrix-green)` inline styles or `.matrix-theme`-scoped CSS classes; the PROJECT.md explicitly documents this decision

## Implications for Roadmap

Based on the dependency chain established across all four research files, the phase structure is clear and non-negotiable. GSAP ScrollTrigger cannot be correctly wired before Lenis is running. Color harmony is independent but benefits from being done before footer work since the footer consumes the same new token set. Footer is last because it has the highest snapshot surface area and is fully self-contained.

### Phase 1: Lenis Foundation

**Rationale:** Every other scroll animation depends on Lenis being wired correctly. GSAP ScrollTrigger will misfire against native scroll position (always 0) if Lenis is not the scroll runtime first. This must ship and pass gates before Phase 2 begins.

**Delivers:** Buttery smooth scroll across all five portfolio URLs; correct scroll-to-top on route navigation; CommandPalette continues to lock background scroll correctly; reduced-motion users get plain native scroll with zero Lenis overhead.

**Addresses:** Lenis smooth scroll (table stakes), anchor link support, route-change reset, dashboard isolation (dashboard routes in `(dashboard)/layout.tsx` are architecturally untouched).

**Avoids:** SSR crash from ReactLenis in Server Component (Pitfall 1); double RAF loop jitter with motion/react (Pitfall 2); navigation scroll position drift (Pitfall 3); Radix modal background scroll regression on CommandPalette (Pitfall 4); double scroll bar from missing Lenis CSS (Pitfall 10 from PITFALLS.md).

**New files:** `providers/lenis-provider.tsx`, `components/portfolio/lenis-scroll-restorer.tsx`

**Modified files:** `app/(portfolio)/layout.tsx` (add LenisProvider wrapper), `app/globals.css` (Lenis CSS rules + `@import "lenis/dist/lenis.css"`)

**Gate:** Lighthouse CI ≥ 0.90 on all 5 URLs; no Playwright snapshot regressions; CommandPalette scroll lock verified; new page routes confirmed starting from top.

### Phase 2: GSAP ScrollTrigger Parallax

**Rationale:** Directly depends on Phase 1 — Lenis ticker sync is established in `LenisProvider`; extending it with ScrollTrigger sync is additive. Adding immediately after Phase 1 while the Lenis wiring is fresh in context.

**Delivers:** Hero text subtle upward drift as user scrolls (yPercent: -15, scrub: 1); section separator depth lines at 80% scroll speed; case study metric numbers with independent depth. Creates the "crafted" impression that distinguishes this portfolio from scroll-reveal-only portfolios.

**Uses:** `gsap@3.14.2` + `@gsap/react@2.1.2`; per-component `useGSAP({ scope: containerRef })`; `scrub: 1` for inertia feel; `ease: 'none'` mandatory (any easing breaks the scroll-tied illusion); transform-only properties (`yPercent`, `y`, `opacity`) — never layout properties.

**Implements:** Shared `lib/gsap.ts` module for single plugin registration (prevents Pitfall 11 — multiple registrations); per-component `useGSAP` with `{ scope }` for automatic cleanup on unmount.

**Avoids:** CLS regression from `pin: true` spacers — use translateY parallax only, no pinning on content-height-dependent elements; wrong `scrollerProxy` pattern (use `lenis.on('scroll', ScrollTrigger.update)` not `scrollerProxy`); ScrollTrigger memory leak on navigation — `useGSAP` exclusively, never `useEffect` for GSAP code.

**Gate:** Lighthouse CI ≥ 0.90 with CLS = 0; `ScrollTrigger.getAll().length` equals active triggers only; navigate away and back — animations fire exactly once on return.

### Phase 3: Magnetic Buttons

**Rationale:** Independent of Phases 1–2 but benefits from Lenis being stable first so debugging is unambiguous. Uses motion/react (not GSAP) for spring physics — consistent with all existing animation patterns in this codebase, no second animation system.

**Delivers:** Hero CTAs and contact CTA with spring-physics cursor attraction (stiffness: 150, damping: 15, mass: 0.1). Elastic snap-back on cursor leave. Touch devices and reduced-motion users get a plain `<div>` wrapper with zero overhead.

**Uses:** `motion/react` `useMotionValue` + `useSpring` from `motion@12.34.2`; `useReducedMotion()` hook reads from existing `MotionConfig reducedMotion="user"` in `MotionProvider`; `strength = 0.3` for subtle professional displacement.

**Avoids:** `gsap.to()` in mousemove TBT regression — motion spring approach bypasses this entirely; focus ring misalignment — transform applies to inner `motion.div`, not to the `<button>` element itself; mobile touch artifacts — `onMouseMove` does not fire on touch devices; applying to nav links — nav already has Awwwards-quality `layoutId` spring underline.

**Gate:** Lighthouse TBT < 50ms after adding to hero; keyboard Tab to button — focus ring aligns with visual center; Chrome DevTools mobile simulation — no button shift on tap; reduced-motion: component renders plain `<div>`.

### Phase 4: Matrix Color Harmony

**Rationale:** CSS-only changes with the lowest risk profile of any phase. Independent of all animation phases. Sets the token foundation the footer redesign consumes.

**Delivers:** Consistent Matrix green aesthetic across all portfolio sections. Eliminates blue Radix `--primary` mismatch in `about/page.tsx` (CTA gradient, value card borders), `contact/page.tsx` (heading accents), `footer.tsx` (link hover states), case study pages (metric numbers in font-mono green), and `tech-stack.tsx` (badge borders). Adds four new CSS tokens: `--matrix-green-subtle`, `--matrix-green-border`, `--matrix-scan-line`, `--matrix-terminal`.

**Implements:** All changes scoped inside `.matrix-theme {}` — never in `:root` `@theme inline`. Terminal-style section labels (`> SECTION_NAME`) above each `h2` as low-effort/high-impact differentiator.

**Avoids:** Matrix color bleeding into TeamFlow/DevCollab dashboard — strict `.matrix-theme` scope; WCAG contrast regression (matrix-green #00FF41 on #0a0a0a = ~12:1, well above 4.5:1 AA); no purple introduced anywhere (global requirement).

**Gate:** Switch to TeamFlow dashboard route — confirm no Matrix green visible; Playwright baselines updated and all 18 tests passing; Lighthouse ≥ 0.90.

### Phase 5: Footer Redesign + Matrix Animation

**Rationale:** Last phase because it has the broadest Playwright snapshot impact (footer renders on every portfolio page) and is fully self-contained — does not block any other phase. Consumes Matrix token work from Phase 4.

**Delivers:** Matrix-themed footer with `#0a0a0a` background, `border-t` in `--matrix-green-border`, monospace copyright, terminal-prompt social links, `> EOF` tagline, CRT scanline texture (CSS `::before`, zero JS), and CSS glitch text on "Fernando Millan" firing once on scroll-into-view via IntersectionObserver.

**Implements:** `FooterMatrixEffect` as isolated dynamic client animation island (`next/dynamic(ssr: false)`); footer static content stays server-rendered for fast initial HTML and LCP — identical pattern to `MatrixRainCanvas` in `hero-section.tsx`.

**Avoids:** Second `MatrixRainCanvas` canvas RAF loop (doubles GPU cost, visually repetitive with hero — the footer is the close, not a repeat of the opening); infinite glitch loop (inaccessible for photosensitive users — fires once only via `animation-iteration-count: 1`); oversized footer that buries the nav links recruiters actually need.

**Gate:** Playwright baselines updated for footer on all routes; Lighthouse ≥ 0.90 (footer below fold — should not affect LCP); reduced-motion: all footer animations disabled; all footer links keyboard-accessible.

### Phase Ordering Rationale

- **Phase 1 must be first** — GSAP ScrollTrigger reads native scroll position (always 0) while Lenis is interpolating; parallax fires at wrong depths without the ticker sync established in Phase 1.
- **Phase 2 immediately after Phase 1** — while Lenis wiring is fresh in context; the ScrollTrigger extension to `LenisProvider` is a small additive change.
- **Phase 3 is independent** — can move earlier if Phase 1/2 debugging takes longer than expected, but keeping it sequential prevents simultaneous variable debugging across two animation systems.
- **Phase 4 before Phase 5** — footer redesign consumes the new Matrix color tokens from Phase 4; combining them would increase diff surface area and make snapshot reviews harder to reason about.
- **Phase 5 last** — highest Playwright snapshot impact; fully self-contained; a Phase 5 regression does not block any earlier-phase work.

### Research Flags

Phases with well-documented patterns — skip `research-phase`:
- **Phase 1 (Lenis):** Official `lenis/react` README + confirmed GitHub issues provide exact implementation. Zero ambiguity. The provider pattern is a direct copy of existing `MotionProvider`.
- **Phase 3 (Magnetic Buttons):** motion/react spring API is well-documented and already in daily use in this codebase. Pattern from Olivier Larose tutorial is widely validated.
- **Phase 4 (Color Harmony):** Pure CSS token work with established `.matrix-theme` scope pattern already in production. No architectural decisions needed.

Phases that may benefit from targeted investigation during planning:
- **Phase 2 (GSAP Parallax):** The architecture pattern is clear and fully specified; the specific parallax targets (which elements on which sections, exact `yPercent` ranges) need visual inspection of the current page state during phase planning. Recommended: start with hero text drift and one section separator, measure Lighthouse impact, then expand.
- **Phase 5 (Footer Glitch Text):** CSS `clip-path` animation is the recommended approach for the glitch effect, but Safari compatibility needs explicit verification before committing. Fallback (typewriter reveal via CSS `steps()`) is ready and documented in FEATURES.md.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified via direct `node_modules` inspection; import paths confirmed against TypeScript type definitions; zero new installs needed — this is implementation-ready |
| Features | HIGH | Current codebase inspected directly; existing color mismatches identified by file and class name; feature dependencies mapped with explicit rationale; anti-features documented with specific reasons |
| Architecture | HIGH | Existing provider tree read directly from `(portfolio)/layout.tsx`; new components follow identical patterns already in production (`MatrixRainCanvas`, `MotionProvider`); data flow diagrams derived from actual code |
| Pitfalls | HIGH (SSR/hydration, GSAP cleanup, CI gate impact), MEDIUM (Tailwind v4 @theme conflicts, Playwright stability) | SSR and GSAP pitfalls sourced from official docs + confirmed GitHub issues with issue numbers; Playwright and Tailwind pitfalls from community reports + direct codebase inspection |

**Overall confidence:** HIGH

### Gaps to Address

- **Specific parallax targets in Phase 2:** The research identifies candidate elements (hero text drift, section separator lines, case study metric numbers) but the final selection requires visual inspection during phase planning and per-element Lighthouse validation. Recommended approach: instrument one element at a time, measure, then expand.

- **CSS `clip-path` glitch animation Safari behavior:** The footer glitch text mechanism uses `clip-path` + offset `@keyframes`. Safari has historically had inconsistent `clip-path` animation performance. Verify during Phase 5 planning or have the fallback (CSS typewriter reveal) ready to substitute without changing the surrounding component structure.

- **Lenis `lerp` value:** `lerp: 0.08` is suggested as slightly dreamier than the default `0.10`. This is a subjective feel decision that requires real device testing across Chrome, Safari, and Firefox — not something resolvable by research alone.

- **Tailwind v4 `@theme` inside `.matrix-theme` class selector:** If Tailwind utilities for Matrix colors become genuinely necessary (beyond current `var()` inline usage), the scoped `@theme` approach is an emerging pattern that needs browser verification before use. Current recommendation is to avoid entirely.

## Sources

### Primary (HIGH confidence)

- Direct `node_modules` inspection — lenis@1.3.17, gsap@3.14.2, @gsap/react@2.1.2, motion@12.34.2 — versions, import paths, TypeScript types confirmed from package dist files
- [darkroomengineering/lenis GitHub monorepo packages/react README](https://github.com/darkroomengineering/lenis/blob/main/packages/react/README.md) — ReactLenis API, `root` prop, `autoRaf: false`, `useLenis` hook, GSAP ticker integration pattern
- [darkroomengineering/lenis Issue #319](https://github.com/darkroomengineering/lenis/issues/319) — scroll position on App Router navigation confirmed issue and `immediate: true` fix
- [GSAP React documentation — useGSAP hook](https://gsap.com/resources/React/) — cleanup behavior, Strict Mode double-invocation handling, ScrollTrigger setup/teardown
- [GSAP accessibility resources](https://gsap.com/resources/a11y/) — reducedMotion handling
- [WCAG 2.3.3 Animations from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) — reduced motion requirements
- Direct codebase inspection: `apps/web/app/(portfolio)/layout.tsx`, `apps/web/app/globals.css`, `apps/web/components/portfolio/*`, `apps/web/app/(portfolio)/about/page.tsx`, `apps/web/app/(portfolio)/contact/page.tsx`, `apps/web/components/portfolio/footer.tsx`, `apps/web/e2e/portfolio/visual-regression.spec.ts`, `apps/web/playwright.visual.config.ts`, `apps/web/package.json`

### Secondary (MEDIUM confidence)

- [GSAP Forum — Patterns for synchronizing ScrollTrigger and Lenis in React/Next](https://gsap.com/community/forums/topic/40426-patterns-for-synchronizing-scrolltrigger-and-lenis-in-reactnext/) — canonical sync pattern with GSAP team contributor confirmation
- [GSAP Forum — Using ScrollTriggers in Next.js with useGSAP](https://gsap.com/community/forums/topic/40128-using-scrolltriggers-in-nextjs-with-usegsap/) — scope pattern for App Router per-component cleanup
- [Olivier Larose — Magnetic Button tutorial](https://blog.olivierlarose.com/tutorials/magnetic-button) — spring config values (stiffness: 150, damping: 15, mass: 0.1); quickTo vs gsap.to comparison; widely cited in creative dev community
- [Bridger Tower — How to implement Lenis in Next.js](https://bridger.to/lenis-nextjs) — Next.js App Router provider pattern with autoRaf
- [motion/react GitHub Discussion #2913](https://github.com/motiondivision/motion/discussions/2913) — conflicting RAF loops between motion and Lenis confirmed
- [Muz.li Web Design Trends 2026](https://muz.li/blog/web-design-trends-2026/) — magnetic/interactive elements premium vs gimmicky distinction
- [Tailwind v4 @theme inline discussion #15083](https://github.com/tailwindlabs/tailwindcss/discussions/15083) — cascade behavior of @theme inline tokens

### Tertiary (LOW confidence / needs validation during implementation)

- Tailwind v4 `@theme` inside `.matrix-theme` class selector — emerging pattern, verify before use; current recommendation is to avoid
- Lenis `lerp: 0.08` optimal value — subjective; requires real device cross-browser testing; not resolvable by research
- CSS `clip-path` animation for footer glitch text — Safari behavior needs explicit verification in Phase 5 planning

---
*Research completed: 2026-02-20*
*Ready for roadmap: yes*
