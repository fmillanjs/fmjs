# Project Research Summary

**Project:** Matrix-Aesthetic Portfolio Redesign
**Domain:** Animation integration into existing Next.js 15 App Router portfolio
**Researched:** 2026-02-18
**Confidence:** HIGH

## Executive Summary

This milestone adds a Matrix-inspired dark aesthetic and animation layer to an existing Next.js 15 portfolio site that shares a Turborepo monorepo with two production SaaS apps (TeamFlow and DevCollab). The portfolio already uses Shadcn/Radix/Tailwind v4 with a well-structured CSS token system. The redesign is strictly scoped to the `(portfolio)` route group — nothing in the dashboard, auth, or API surfaces should be touched.

The recommended approach is additive and layered: start with CSS token changes that have zero regression risk, introduce canvas as an isolated unit, then layer in the `motion` v12 animation system, and finally apply the `.matrix-theme` class that activates the full visual overhaul. This sequence means every stage is independently verifiable against the existing Lighthouse CI gate (performance >= 0.9 on five portfolio URLs). Four packages cover all animation needs: `motion` v12, `gsap`, `@gsap/react`, and `lenis`. The old `framer-motion` package must not be installed — the correct package name is `motion` and the correct import path is `motion/react`. This single distinction is the most important technical fact in the entire research.

The primary risks are technical: a canvas component that crashes with `window is not defined` during SSR, a `requestAnimationFrame` loop that is never canceled causing memory leaks on navigation, the Lighthouse performance gate dropping below 90 due to canvas CPU usage, and using the wrong Framer Motion import path with React 19. All four risks have deterministic prevention strategies. The design risk — Matrix aesthetic reading as "Halloween costume" rather than "serious engineer" — is addressed by a strict calibration rule: one background effect per section, animations fire once not in loops, rain opacity between 0.04 and 0.07. Three anti-features must be explicitly avoided: full-screen rain at readable opacity, looping typewriter cycling role titles, and any loading screen that gates content.

## Key Findings

### Recommended Stack

The existing stack (Next.js 15.1, React 19, Tailwind v4.1.18, Radix UI, Shadcn UI, next-themes) is preserved entirely. Four new packages are installed in `apps/web` only, scoped to the workspace to prevent bundle contamination of TeamFlow and DevCollab.

**Core technologies (new additions only):**

- `motion` v12.4.0+: declarative React animations (scroll reveals, hover states, entrance animations) — the renamed React 19-compatible rewrite of Framer Motion; import from `motion/react` not `framer-motion`; React 19 test suite added to CI in v12.29.0; v12.34.0 latest as of Feb 2026
- `gsap` v3.14.2+: timeline animations, ScrollTrigger parallax, SplitText text reveals, magnetic button `quickTo()` — 100% free since Webflow acquisition including all plugins; framework-agnostic, bypasses React diffing for high-frequency mouse events where `motion` springs lag
- `@gsap/react` v2.1.1+: `useGSAP()` hook providing SSR-safe lifecycle management and auto-cleanup of all ScrollTrigger instances on component unmount; required companion for GSAP in React
- `lenis` v1.2.3+: smooth scroll (renamed from deprecated `@studio-freight/lenis`); import from `lenis/react`; tested with Next.js 15 + React 19; integrates with GSAP ScrollTrigger via `lenis.on('scroll', ScrollTrigger.update)`

No library is needed for the Matrix rain canvas — native Canvas 2D API in a `'use client'` component covers the effect in under 100 lines. `p5.js` (9MB) and `three.js` (600KB) are explicitly excluded as they destroy Lighthouse scores.

**Critical install command:**
```bash
npm install motion gsap @gsap/react lenis --workspace=apps/web
```

That is the complete installation. Four packages. Nothing else.

### Expected Features

**Must have (table stakes — absence makes the portfolio feel dated):**
- Scroll-reveal animations on section entrance (fade + slide-up) — absence reads as "forgot animations exist" to 2026 reviewers
- Dark background enforcement scoped to `(portfolio)` route group — forces `.dark` and `.matrix-theme` on portfolio layout only; does not affect dashboard
- Green accent CSS variable system (`--matrix-green: #00FF41`, `--matrix-green-dim`, `--matrix-green-ghost`) — required by every subsequent glow effect; must exist before any component references it
- Card hover state with border glow replacing `hover:shadow-xl` — green box-shadow; pure CSS
- Accessible reduced-motion fallback — WCAG 2.1 SC 2.3.3; `MotionConfig reducedMotion="user"` handles all Framer Motion globally; canvas explicitly checks `window.matchMedia('prefers-reduced-motion: reduce')` and skips the RAF loop entirely

**Should have (differentiators that create the "serious engineer" impression):**
- Text scramble/decode reveal on hero name — fires ONCE on mount, never loops; use `use-scramble` hook (~3KB, React-native) unless GSAP ScrambleTextPlugin is preferred
- Evervault-style card: title decrypts from noise to words on hover — Aceternity UI pattern, uses already-installed `motion`, no new dependency
- Animated terminal cursor blink after tagline — pure CSS `::after { content: '_'; animation: blink 1s step-end infinite; }`, zero JS
- Grid dot background + spotlight cursor reveal — CSS dot pattern + JS `mousemove`; these always pair as one feature unit; do not build one without the other
- Staggered card entrance (`staggerChildren: 0.1`) and staggered word reveal on tagline — 10 lines of code after `motion` is installed
- Stat counter count-up on scroll-into-view — `useInView` + counter; no new dependencies
- Green text-shadow glow on hero h1 — CSS only; subtle phosphor effect
- Subtle scanline overlay on hero — CSS `repeating-linear-gradient` at opacity 0.03; subliminal CRT texture, invisible unless looked for

**Defer (Phase 3 / post-validation):**
- Matrix rain canvas — highest reward, highest Lighthouse risk; add only after grid dot + spotlight validates the aesthetic direction and Lighthouse baseline is confirmed
- Animated CSS mesh gradient background — alternative to rain; pick one or the other, never both
- Tech stack horizontal CSS marquee — purely decorative; CSS only, no JS
- 3D card tilt on hover — competes with Evervault card scramble; choose one card interaction, not both

**Anti-features (never build — grounded in hiring manager research):**
- Full-screen Matrix rain at readable opacity — content becomes unreadable; vestibular accessibility violation; hiring managers see noise not portfolio work
- Looping typewriter cycling role titles — overused since 2019; every junior portfolio does this; hiring managers explicitly flagged this as a red flag
- Loading screen or splash animation — mandatory wait before content causes tab closes from queue-pressured recruiters reviewing 50+ portfolios per day

### Architecture Approach

The architecture follows a single principle: push `"use client"` as far down the component tree as possible so RSC pages continue to deliver server-rendered content to the browser (fast LCP, good SEO). Animation is layered on as thin client wrappers that receive RSC content as `children`. The `.matrix-theme` CSS class on the `(portfolio)/layout.tsx` wrapper div overrides the existing semantic tokens (scoped to portfolio routes only) without touching the Radix Colors cascade structure used by the rest of the app.

The canvas component requires a dedicated client wrapper component for `next/dynamic` with `ssr: false` — a Next.js 15 regression blocks calling `dynamic(..., { ssr: false })` directly from a Server Component. This wrapper pattern is required, not optional.

**Major components:**

1. `MotionProvider` (client, new) — `LazyMotion` + `MotionConfig reducedMotion="user"` placed in `(portfolio)/layout.tsx`; must be ancestor of all `m.*` components; reduces initial JS from 34KB (full Framer Motion) to ~4.6KB via async feature loading
2. `MatrixRainCanvas` (client + `dynamic ssr:false`, new) — Canvas 2D API, RAF loop capped at 30fps, `aria-hidden="true"`, animation frame ID stored in `useRef` (not `useState`), `cancelAnimationFrame` in `useEffect` cleanup return
3. `AnimatedHeroSection` (client wrapper, new) — wraps RSC `HeroSection` as `children`; contains canvas dynamic import; applies `m.div` entrance animation; keeps hero text server-rendered for LCP and SEO
4. `.matrix-theme` CSS class (in `globals.css`, additive) — scoped override of semantic tokens activating green color scale; `--background` becomes `#000d03`, `--primary` becomes `#00FF41`; never modifies Radix Colors layer

**CSS token migration strategy — additive only:**

The existing `globals.css` uses a 3-layer pattern: (1) Radix Colors imports, (2) `:root` semantic tokens, (3) `@theme inline` Tailwind utilities. The Matrix tokens extend this with a new `:root` block (`--matrix-1` through `--matrix-12` scale), new `@theme inline` entries (`bg-matrix-bg`, `text-matrix-accent`), and a `.matrix-theme` selector that overrides `--background`, `--primary`, `--card` etc. to Matrix values. No existing Layer 1, 2, or 3 entries are modified. All existing components continue working unchanged.

**Client/server boundary map:**
```
(portfolio)/layout.tsx (RSC)
  └── MotionProvider (CLIENT) — LazyMotion context
      ├── PortfolioNav (CLIENT, existing — uses usePathname)
      ├── main > {children}
      │     └── (portfolio)/page.tsx (RSC)
      │           └── AnimatedHeroSection (CLIENT, new)
      │                 ├── HeroSection (RSC, unchanged — passed as children)
      │                 └── MatrixRainCanvas (CLIENT, dynamic ssr:false)
      └── PortfolioFooter (RSC — no interaction needed)
```

### Critical Pitfalls

1. **Canvas crashes with `window is not defined` (CRITICAL)** — All canvas and browser API access must live inside `useEffect`, never at module level. Use a dedicated `'use client'` wrapper component for `dynamic(..., { ssr: false })` — Next.js 15 has a confirmed regression that blocks this pattern when called directly from a Server Component. Verify with `next build && next start` before writing any animation logic.

2. **RAF loop not canceled — memory leak on every navigation (CRITICAL)** — Store the animation frame ID in `useRef` (not `useState`). Return `() => cancelAnimationFrame(rafRef.current)` from `useEffect`. React Strict Mode double-mounts reveal any leak immediately in development. After 10+ navigations, Chrome Memory tab should show a stable heap.

3. **Canvas degrades Lighthouse performance below 90 gate (CRITICAL)** — Delay canvas start by 100ms with `setTimeout` so the LCP text element can paint first. Cap frame rate at 30fps via timestamp delta check. Set `aria-hidden="true"` and position canvas with `position: absolute; z-index: -1`. Run `lhci autorun` (not browser DevTools Lighthouse) after adding canvas — CI uses 3-run averaging which local single runs cannot replicate.

4. **Wrong Framer Motion package for React 19 (CRITICAL)** — Install `motion`, not `framer-motion`. Import from `motion/react`, not `framer-motion`. The old package breaks all animations in React Strict Mode dev — they appear frozen at initial state, working only in production builds. This gives false confidence during development.

5. **Missing `prefers-reduced-motion` (CRITICAL)** — Add global CSS rule to `globals.css`. Set `reducedMotion="user"` on `MotionConfig`. Canvas checks `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and skips the RAF loop entirely — not just slows it. Test by toggling OS Reduce Motion setting; the portfolio must be completely static.

6. **GSAP ScrollTrigger instances leak on App Router navigation (HIGH)** — Always use `useGSAP(() => { ... }, { scope: containerRef })` from `@gsap/react`, never plain `useEffect` for GSAP. `useGSAP` auto-kills all triggers on unmount. Test by navigating between pages 3+ times and verifying animations play exactly once per visit.

7. **Scroll animations cause CLS, dropping Lighthouse score (HIGH)** — Animate only `transform` and `opacity`. Never animate `height`, `width`, `margin`, or `padding`. Pre-allocate space using `opacity: 0`, never `display: none`. Measure CLS in Chrome DevTools Performance tab before and after each animation type is added.

## Implications for Roadmap

Build order is driven by three constraints: (1) the CSS token system must exist before components reference it, (2) canvas performance must be validated in isolation before animation layers are added on top, and (3) the full visual overhaul should happen after animation stability is confirmed so regression types are separable.

### Phase 1: Token Foundation
**Rationale:** All subsequent phases reference Matrix CSS tokens. This is purely additive CSS — nothing references it yet, so regression risk is zero. Do this first to unblock everything else and prevent hardcoded hex values from spreading.
**Delivers:** `bg-matrix-bg`, `text-matrix-accent`, `border-matrix-border`, and all `--matrix-*` Tailwind utilities available. `--matrix-green: #00FF41` usable in any component via CSS variable.
**Addresses:** Green accent CSS variable system (table stakes), establishes the token foundation dark background depends on.
**Avoids:** Anti-Pattern 4 (hardcoded hex values bypassing token system — prohibited by existing `DESIGN-SYSTEM.md` governance rule).
**Gate:** All existing Playwright visual regression snapshots pass unchanged — Matrix tokens are defined but not applied yet.
**Research flag:** No additional research needed. Token architecture is fully specified with exact CSS in ARCHITECTURE.md.

### Phase 2: Canvas Matrix Rain (Isolated Validation)
**Rationale:** Canvas is the highest-risk component for the Lighthouse gate. Building it in isolation before Framer Motion means performance issues are attributable to canvas alone. This phase validates the most technically risky element before anything else depends on it.
**Delivers:** `MatrixRainCanvas` client component, dedicated `'use client'` wrapper for `dynamic ssr:false`, `AnimatedHeroSection` (canvas + positioning wrapper only, no Framer Motion yet), home page hero has rain effect behind content.
**Uses:** Native Canvas 2D API, `next/dynamic`, no animation library needed.
**Avoids:** Pitfall 1 (window undefined), Pitfall 2 (RAF memory leak), Pitfall 3 (LCP regression). Set `NEXT_PUBLIC_DISABLE_MATRIX_RAIN=true` in `.env.test` for stable Playwright snapshots.
**Gate:** `lhci autorun` performance >= 0.9 on all five portfolio URLs before proceeding to Phase 3. This gate is non-negotiable.
**Research flag:** No additional research needed. Canvas implementation code is provided verbatim in STACK.md and ARCHITECTURE.md.

### Phase 3: Motion Provider + Entrance Animations
**Rationale:** Requires the canvas baseline from Phase 2. `MotionProvider` (LazyMotion + MotionConfig) must be in place before any `m.*` components mount. Motion is installed here as a workspace-scoped dependency.
**Delivers:** `motion` v12 installed (`--workspace=apps/web`), `MotionProvider` in `(portfolio)/layout.tsx`, hero text fade-in via `m.div`, scroll-triggered entrance animations on all section and project card elements, `reducedMotion="user"` active globally.
**Uses:** `motion` v12, import from `motion/react`, `LazyMotion` + `domAnimation` features (~4.6KB initial vs 34KB full bundle).
**Avoids:** Pitfall 4 (wrong package), Pitfall 5 (reduced motion — `reducedMotion="user"` on MotionConfig), Pitfall 8 (CLS — only `transform` + `opacity` animated, never layout properties), Pitfall 11 (monorepo isolation — scoped install only).
**Gate:** Zero hydration warnings in browser console after first client-side load. Strict Mode dev shows animations playing correctly (not frozen at initial state).
**Research flag:** No additional research needed. LazyMotion + `m.*` pattern is fully documented with exact code in ARCHITECTURE.md.

### Phase 4: Matrix Dark Theme Applied to Portfolio Routes
**Rationale:** The full visual overhaul is a separate phase from animation stability so that when visual regression snapshots break, they break for a single known reason. Depends on token foundation (Phase 1) and stable animation baseline (Phases 2-3).
**Delivers:** `.matrix-theme` class on `(portfolio)/layout.tsx` wrapper div, activating green token values across all portfolio routes. `PortfolioNav` updated with Matrix terminal styling (monospace active link, green glow). `defaultTheme="dark"` set in ThemeProvider for dark-first default.
**Avoids:** Pitfall 7 (dark theme breaking Radix token resolution — the only ThemeProvider change is `defaultTheme="dark"`; the CSS token cascade structure is never touched). Scope isolation — `.matrix-theme` on portfolio layout div only, not global; TeamFlow and DevCollab dashboard routes visually unchanged.
**Gate:** All portfolio Playwright snapshots updated to new baselines. TeamFlow/DevCollab dashboard visual regression snapshots unchanged. Run `playwright test --update-snapshots` after confirming the new appearance is correct.
**Research flag:** No additional research needed. The single correct change is clearly scoped and documented in PITFALLS.md.

### Phase 5: Typography and Micro-Interactions
**Rationale:** Cosmetic polish that creates the "serious engineer" impression. Each item is independently deferrable. Add after Phases 1-4 are verified stable and the Lighthouse gate still passes.
**Delivers:** Text scramble reveal on hero name (`use-scramble` — fires ONCE on mount, never loops), Evervault card hover effect (uses already-installed `motion`, no new dep), staggered word reveal on tagline, stat count-up animation via `useInView`, CSS-only terminal cursor blink, scanline overlay, green text-shadow glow on headings, nav link underline micro-interaction.
**Avoids:** All anti-features — scramble fires once and resolves, never loops. One animation motif per component. One background effect per section.
**Research flag:** `use-scramble` React 19 peer dependency compatibility needs verification before install. If incompatible, GSAP ScrambleTextPlugin is the zero-cost fallback since `gsap` is already installed in Phase 3.

### Phase 6: Polish Pass (Optional — Post-Validation)
**Rationale:** Highest complexity, purely decorative features. Validate the aesthetic in Phases 1-5 first. Any single item in this phase can be deferred without degrading the portfolio impression.
**Delivers:** Tech stack horizontal CSS marquee, terminal-line styling on contact/skills sections, grid dot background + spotlight cursor (must pair these as one unit), GSAP ScrollTrigger parallax on hero if desired.
**Avoids:** Pitfall 6 (GSAP ScrollTrigger leaks — use `useGSAP` exclusively, never plain `useEffect`), Pitfall 9 (magnetic/parallax broken on mobile — gate all `mousemove`-based effects behind `(any-hover: hover) and (pointer: fine)` media query), Pitfall 10 (custom cursor blocks interactions — `pointer-events: none` required on cursor element; gate behind pointer media query).
**Research flag:** Real mobile device test required for cursor and spotlight effects. DevTools mobile emulation fires `mousemove` synthetically and will not reveal the touch-device snap bug documented in Pitfall 9.

### Phase Ordering Rationale

- Tokens before components — every animation component references `--matrix-accent` etc.; establishing the token system in Phase 1 prevents hardcoded hex values from spreading through early phases
- Canvas before Framer Motion — canvas is the highest Lighthouse risk; validating it in isolation means a performance regression is attributable to canvas alone, not animation interaction effects
- Framer Motion before visual theme — entrance animations on a non-Matrix-themed page are detectable and testable; switching the theme later means the visual change is a single, auditable delta with clear snapshot update intent
- Visual theme before typography — typography micro-interactions require the dark background to evaluate correctly; the green glow on a white background is meaningless
- Polish last — Phases 1-4 deliver a complete, shippable portfolio redesign; Phases 5-6 add craft and memorability but are not required for the "serious engineer" impression

### Research Flags

Needs deeper validation before or during the phase:
- **Phase 5 (`use-scramble`):** Confirm React 19 peer dependency compatibility before install. Check npm page or GitHub issues for any `react@19` compatibility notes. Fallback: GSAP ScrambleTextPlugin (already available since `gsap` is installed in Phase 3, zero additional cost).
- **Phase 6 (cursor and spotlight effects):** Test on a real mobile device — iOS Safari and Android Chrome — before considering the feature complete. DevTools mobile emulation is unreliable for `mousemove`-based effects. The pointer media query guard must be implemented and verified, not assumed.

Phases with standard patterns (no additional research needed):
- **Phase 1:** CSS variable addition is fully specified with exact CSS in ARCHITECTURE.md
- **Phase 2:** Canvas implementation code is provided verbatim in STACK.md and ARCHITECTURE.md
- **Phase 3:** LazyMotion + `m.*` pattern is fully documented with exact code and import paths
- **Phase 4:** Single change (`defaultTheme="dark"`) is clearly scoped with explicit warning not to restructure CSS cascade

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All four packages verified via official docs, npm registry, and motion.dev changelog. `motion@^12.34.0` React 19 CI suite confirmed in v12.29.0. GSAP 100% free confirmed at gsap.com/pricing. `lenis` v1.2.3 React 19 + Next.js 15 tested confirmed on npm. Package names, import paths, and version requirements are all verified. |
| Features | HIGH | Feature list grounded in Codrops 2025 award-winning portfolio case studies, hiring manager research (opendoorscareers.com), and Aceternity UI pattern library. Anti-feature list backed by explicit hiring manager feedback and the "serious engineer not costume" calibration principle. |
| Architecture | HIGH (client/server boundaries, canvas SSR, hydration patterns); MEDIUM (Tailwind v4 token migration contrast ratios) | Client/server boundary patterns verified against official Next.js docs and confirmed GitHub issue #72236. Token migration strategy derived from direct codebase inspection of `apps/web/app/globals.css`. Contrast ratio for `#00FF41` on `#000d03` calculated manually as ~13:1 — needs WebAIM verification before shipping. |
| Pitfalls | HIGH | 9 of 11 pitfalls verified against official documentation or confirmed GitHub issues (Next.js #72236, motion #2668, vercel/next.js #49279). 2 pitfalls (canvas LCP impact at specific opacity, CLS specifics per animation type) rated MEDIUM because exact score delta is device-simulation-dependent. |

**Overall confidence:** HIGH

### Gaps to Address

- **Canvas Lighthouse impact at specific opacity/frame rate:** The exact score delta from adding canvas depends on Lighthouse's simulated device profile (4x CPU slowdown for Moto G4). The 30fps cap + 100ms delay is the documented mitigation, but the actual score delta is unknown until Phase 2 runs `lhci autorun`. Mitigation: run the gate immediately after Phase 2 and adjust parameters if needed before proceeding to Phase 3.

- **`use-scramble` React 19 compatibility:** Not verified in research — STACK.md focused on `motion`, `gsap`, `@gsap/react`, and `lenis`. Verify peer dependencies before Phase 5. GSAP ScrambleTextPlugin is the cost-free fallback since `gsap` is already installed.

- **WCAG contrast for `#00FF41` on `#000d03`:** Calculated manually as ~13:1 in ARCHITECTURE.md (passes WCAG AAA). Verify with WebAIM Contrast Checker before shipping. Also note: `#00FF41` is near-pure saturated green — deuteranopia/protanopia (~8% of men) may reduce discrimination from yellow/amber. Never use `--matrix-accent` as the sole indicator of meaning; always pair with text, icon, or shape.

- **AnimatePresence for page transitions:** Explicitly deferred due to known Next.js App Router conflict (vercel/next.js #49279 — App Router's client navigation timing cuts off `AnimatePresence` exit phase). Per-section entrance animations triggered by `useInView` are the reliable substitute and are sufficient for the Matrix aesthetic.

## Sources

### Primary (HIGH confidence)
- [motion.dev/changelog](https://motion.dev/changelog) — v12.34.0 latest (Feb 9, 2026); React 19 CI suite added v12.29.0; `motion/react` import path confirmed for Next.js App Router
- [gsap.com/resources/React/](https://gsap.com/resources/React/) — `useGSAP` hook pattern; Next.js `"use client"` requirement; cleanup behavior on unmount
- [gsap.com/pricing/](https://gsap.com/pricing/) — 100% free confirmed including SplitText, MorphSVG, ScrollTrigger since v3.13
- [npmjs.com/package/lenis](https://www.npmjs.com/package/lenis) — v1.2.3 Next.js 15 + React 19 tested; renamed from deprecated `@studio-freight/lenis`
- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — boundary rules, `"use client"` propagation
- [Next.js Discussion #72236](https://github.com/vercel/next.js/discussions/72236) — `ssr: false` regression in Next.js 15 confirmed; wrapper client component workaround required
- [Motion bundle size docs](https://motion.dev/docs/react-reduce-bundle-size) — 34KB full vs ~4.6KB with LazyMotion domAnimation features
- [Motion accessibility docs](https://motion.dev/docs/react-accessibility) — `reducedMotion="user"` on MotionConfig behavior
- [App Router + AnimatePresence GitHub Issue #49279](https://github.com/vercel/next.js/issues/49279) — known page transition limitation confirmed
- [Motion GitHub Issue #2668](https://github.com/motiondivision/motion/issues/2668) — React 19 incompatibility with `framer-motion` package confirmed resolved in `motion` v12
- Project `apps/web/package.json` — `react@^19.0.0`, `next@^15.1.0`, `tailwindcss@^4.1.18` confirmed from source
- Project `apps/web/lighthouserc.json` — `categories:performance: error at 0.9` on five portfolio URLs confirmed from source
- Project `apps/web/app/globals.css` — 3-layer Radix Colors + `@theme inline` pattern confirmed from source
- [Chrome Lighthouse: Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) — CLS 25%, LCP 25% of score; 4x CPU slowdown simulation
- [CSS-Tricks: requestAnimationFrame with React hooks](https://css-tricks.com/using-requestanimationframe-with-react-hooks/) — `useRef` + `useEffect` + cleanup pattern
- [Pope Tech Blog: Accessible Animation Dec 2025](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) — WCAG 2.3.3 requirements
- [Custom Cursor Accessibility (dbushell.com Oct 2025)](https://dbushell.com/2025/10/27/custom-cursor-accessibility/) — cursor accessibility violations documented

### Secondary (MEDIUM confidence)
- [Codrops: Stefan Vitasovic Portfolio Case Study 2025](https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/) — staggered word reveal, award-winning pattern reference
- [How Recruiters Actually Look at Your Portfolio](https://blog.opendoorscareers.com/p/how-recruiters-and-hiring-managers-actually-look-at-your-portfolio) — anti-feature rationale, looping typewriter as red flag
- [Aceternity UI Components](https://ui.aceternity.com/components) — Evervault card pattern, Aurora background adaptation
- [Theming Tailwind v4: Multiple Color Schemes](https://medium.com/@sir.raminyavari/theming-in-tailwind-css-v4-support-multiple-color-schemes-and-dark-mode-ba97aead5c14) — scoped `.matrix-theme` class pattern
- [Optimizing GSAP in Next.js 15](https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232) — cleanup best practices, `ScrollTrigger.refresh()` timing
- [Memory Leaks in React & Next.js Jan 2026](https://medium.com/@essaadani.yo/memory-leaks-in-react-next-js-what-nobody-tells-you-91c72b53d84d) — RAF leak ~8KB/cycle benchmarked
- [Tailwind GitHub Discussion #16517](https://github.com/tailwindlabs/tailwindcss/discussions/16517) — `@custom-variant dark` conflict with `attribute` strategy change confirmed
- [use-scramble React hook](https://www.use-scramble.dev/) — React-native text scramble, ~3KB, referenced for Phase 5

---
*Research completed: 2026-02-18*
*Ready for roadmap: yes*
