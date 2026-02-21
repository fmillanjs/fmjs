# Pitfalls Research: v3.1 Portfolio Polish — Lenis, GSAP ScrollTrigger, Magnetic Buttons, Matrix Color Harmony

**Domain:** Adding animation polish (Lenis smooth scroll, GSAP ScrollTrigger parallax, magnetic buttons) and Matrix color extension to an existing Next.js 15 App Router + motion v12 + GSAP + Lenis portfolio with a hard Lighthouse CI gate (≥ 0.90 performance) and 18 Playwright visual regression baselines.
**Researched:** 2026-02-20
**Confidence:** HIGH on SSR/hydration pitfalls (official Next.js + Lenis docs + confirmed GitHub issues), HIGH on GSAP/Lenis integration (official GSAP docs + darkroomengineering README + GSAP forum), HIGH on Lighthouse CI impact (official Lighthouse docs + confirmed library behavior), MEDIUM on Playwright snapshot stability (community patterns + Playwright docs), MEDIUM on Tailwind v4 specificity conflicts (community reports + confirmed GitHub issues)

---

## Critical Pitfalls

### Pitfall 1: ReactLenis Provider Placed in a Server Component — SSR Crash and Window Access Error

**What goes wrong:**
`ReactLenis` from `lenis/react` accesses `window` during initialization. If `<ReactLenis root>` is rendered inside a Server Component (or inside a layout that is not explicitly marked `'use client'`), Next.js 15's SSR environment throws:
```
ReferenceError: window is not defined
```
This crashes the page on first server render. The component tree below ReactLenis never renders. The portfolio goes blank in production.

A subtler variant: the developer correctly marks the provider `'use client'`, but places `<ReactLenis>` directly in the portfolio `layout.tsx` (which is a Server Component). The `'use client'` directive does not propagate from a child component up to the server component boundary — the import itself is the problem. Next.js attempts to serialize the ReactLenis module for SSR and crashes.

**Why it happens:**
The existing portfolio layout (`apps/web/app/(portfolio)/layout.tsx`) is a Server Component. It already uses a pattern for this: `<MotionProvider>` is a `'use client'` wrapper imported into the server layout. Developers adding Lenis often place `<ReactLenis root>` directly into layout.tsx, forgetting it needs the same treatment. The fact that lenis is already installed gives false confidence that it can be imported anywhere.

**How to avoid:**
Create a dedicated `'use client'` provider component — exactly the same pattern already used for `MotionProvider`:

```tsx
// apps/web/components/portfolio/lenis-provider.tsx
'use client'

import { ReactLenis } from 'lenis/react'
import type { ReactNode } from 'react'

export function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root>
      {children}
    </ReactLenis>
  )
}
```

Then import it into the Server Component layout:
```tsx
// apps/web/app/(portfolio)/layout.tsx (Server Component — no changes needed)
import { LenisProvider } from '@/components/portfolio/lenis-provider'

export default function PortfolioLayout({ children }) {
  return (
    <div className="matrix-theme min-h-screen flex flex-col">
      <LenisProvider>
        ...
      </LenisProvider>
    </div>
  )
}
```

**Warning signs:**
- Build succeeds locally in dev (Next.js dev mode has different SSR behavior) but fails on `next build` or in production
- Error message `ReferenceError: window is not defined` in server logs
- Page returns 500 on first load; client-side navigation still works (because RSC boundary isolates the error)

**Phase to address:**
Lenis integration phase — before any other Lenis code is written. The provider structure is the foundation everything else depends on.

---

### Pitfall 2: Lenis + motion v12 `useScroll` — Double RAF Loop Producing Jitter

**What goes wrong:**
The existing portfolio uses `motion/react` (motion v12) for scroll-reveal animations. When Lenis runs with its own RAF loop (`autoRaf: true`, which is the default), and motion's `useScroll` hook ALSO attaches its own scroll listener, two independent animation loops fight over the scroll position. The result is scroll jitter, scroll position drift on fast swipes, and occasional freeze where the page stops responding to wheel events for 200-400ms.

This is confirmed by the motion maintainers: motion's frame system and Lenis's RAF loop conflict when both are managing scroll timing independently. The darkroomengineering Lenis README explicitly documents the fix.

**Why it happens:**
The existing `MotionProvider` wraps children in `<MotionConfig reducedMotion="user">`. Motion v12's `useScroll` attaches native scroll listeners that fire synchronously. Lenis overrides the native scroll and fires its own interpolated scroll. Both try to report scroll position at the same time but from different sources (native vs. Lenis-smoothed). Motion reads the native DOM scroll position, Lenis is mid-interpolation — they disagree on where the page is.

**How to avoid:**
Set `autoRaf: false` on ReactLenis and drive Lenis from GSAP's ticker (not motion's frame system), since GSAP ScrollTrigger also needs to be in the same RAF loop:

```tsx
// apps/web/components/portfolio/lenis-provider.tsx
'use client'

import { ReactLenis } from 'lenis/react'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<{ lenis?: { raf: (time: number) => void } }>(null)

  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000)
    }
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)
    return () => gsap.ticker.remove(update)
  }, [])

  return (
    <ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>
      {children}
    </ReactLenis>
  )
}
```

For motion's `useScroll`, the values will still work — motion reads from the scroll container Lenis targets. The jitter disappears because only one RAF loop is running: GSAP's ticker drives both Lenis and GSAP ScrollTrigger on the same frame.

**Warning signs:**
- Scroll appears smooth but elements with `useScroll`-driven transforms stutter at high velocities
- Occasional brief freeze when scrolling fast then stopping
- `useTransform(scrollYProgress, ...)` values jump erratically during fast scroll
- Scroll feels fine on Chrome but worse on Safari (different native scroll event timing)

**Phase to address:**
Lenis integration phase — specifically when wiring the GSAP ticker. Do not defer this to the ScrollTrigger phase; it must be part of the initial Lenis provider.

---

### Pitfall 3: GSAP ScrollTrigger Pin Spacer Creates Layout Shift — Lighthouse CLS Regression

**What goes wrong:**
When a GSAP ScrollTrigger animation uses `pin: true`, ScrollTrigger wraps the pinned element in a `<div class="pin-spacer">` with a calculated height equal to the pin duration in pixels. This spacer is injected at JavaScript runtime after the initial HTML renders. Lighthouse detects the spacer injection as a layout shift and adds a CLS (Cumulative Layout Shift) penalty.

The existing portfolio scores ≥ 0.90 on Lighthouse with the current animation setup. Each pinned section can add 0.02-0.08 CLS depending on the element size. The Lighthouse performance weight for CLS is 25%. A CLS increase from 0 to 0.1 can drop the performance score by 3-5 points — crossing below 0.90 and failing the CI gate.

The GitHub Actions lhci gate runs `numberOfRuns: 3` and takes the median — a single run penalty is unlikely to fail, but consistent CLS from pinned sections will.

**Why it happens:**
Developers add parallax depth effects with `pin: true` and `scrub: true` on hero sections or full-viewport panels. ScrollTrigger's pin spacer must match the element's visual height exactly. When the element height is not deterministic at JS initialization time (e.g., depends on image load, font load, or window size), the spacer height is miscalculated, causing cumulative layout shifts when the correct height resolves later.

**How to avoid:**
1. **Avoid `pin: true` on elements whose height depends on loaded resources.** Use `pin: false` parallax (translateY transforms only) which has zero CLS impact.

2. **If pinning is required**, ensure the element has explicit dimensions set in CSS before GSAP initializes:
```css
.parallax-section {
  height: 100vh; /* Explicit — not auto/content-based */
}
```

3. **Call `ScrollTrigger.refresh()` after all assets load**, not on DOMContentLoaded:
```tsx
useEffect(() => {
  window.addEventListener('load', () => ScrollTrigger.refresh())
  return () => window.removeEventListener('load', () => ScrollTrigger.refresh())
}, [])
```

4. **For the portfolio's parallax depth effect**, translateY-based parallax on content inside a normal-flow section has no CLS impact at all. Prefer this over pinning.

**Warning signs:**
- Lighthouse "Avoid large layout shifts" audit flags `.pin-spacer` elements
- CLS score above 0.1 in Lighthouse results
- `lhci assert` fails with: `categories:performance: 0.88 < 0.90 (error)` in GitHub Actions
- Visual glitch where content "jumps" 20-50px as page loads

**Phase to address:**
GSAP parallax phase — validate Lighthouse after each pinned section is added, not after all parallax is complete. Run `npx lhci autorun` locally to catch regressions before pushing.

---

### Pitfall 4: Lenis `scroll` Event + ScrollTrigger — Wrong Pattern Causes Desynced Trigger Positions

**What goes wrong:**
A widely circulated integration pattern uses `scrollerProxy`:
```javascript
// WRONG for Lenis v1.x — scrollerProxy is for older non-standard scrollers
ScrollTrigger.scrollerProxy(document.body, {
  scrollTop(value) { ... },
  getBoundingClientRect() { ... },
})
```
The `scrollerProxy` pattern was designed for custom scroll containers (like a div with `overflow: scroll`). Lenis on `root: true` scrolls the window directly, not a custom scroller. Using `scrollerProxy` with window-based Lenis causes ScrollTrigger trigger positions to be calculated against the wrong element, producing animations that fire 100-500px early or late.

The correct modern pattern (Lenis 1.x + GSAP 3.x):
```javascript
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```

**Why it happens:**
The `scrollerProxy` pattern is in countless tutorials, blog posts, and StackOverflow answers. Many tutorials targeting Lenis 0.x (studio-freight era) still rank first in search results but are outdated. The new `lenis.on('scroll', ScrollTrigger.update)` pattern was introduced when Lenis internalized native scroll pass-through.

**How to avoid:**
Never use `ScrollTrigger.scrollerProxy` with `root: true` Lenis. The only integration needed is:
1. `lenis.on('scroll', ScrollTrigger.update)` — keeps ScrollTrigger in sync with Lenis position
2. Drive Lenis via GSAP ticker (see Pitfall 2)

Verify by checking trigger positions: an element at exactly 500px from top should trigger when `scrollTop === 500px` in the Lenis-reported position. If it triggers early, the proxy is misconfigured.

**Warning signs:**
- ScrollTrigger animations fire before the element enters the viewport (too early) or only after it's partially offscreen (too late)
- ScrollTrigger debug markers (add `markers: true` temporarily) show `start` and `end` positions that don't correspond to visual element positions
- Animation works in GSAP's standalone CodePen example but breaks when Lenis is added

**Phase to address:**
GSAP ScrollTrigger integration phase — the very first ScrollTrigger setup must use the correct pattern. Using `scrollerProxy` is a root cause that breaks all subsequent ScrollTrigger work.

---

### Pitfall 5: ScrollTrigger Instances Not Cleaned Up on Navigation — Growing Memory Leak and Stale Animations on Return

**What goes wrong:**
In Next.js App Router, navigating between portfolio pages (e.g., `/` → `/projects` → `/projects/teamflow`) unmounts and remounts page components. If GSAP ScrollTrigger instances created in `useEffect` are not properly killed on unmount, they persist in GSAP's internal registry. Each navigation adds more triggers. After 3-4 navigations, there are duplicate triggers for the same elements — the returning page fires animations twice, scroll positions jump, and memory grows continuously.

This also manifests as Playwright test instability: the visual regression test navigates pages via `page.goto()`, and if stale triggers fire during test execution, element positions differ from the baseline snapshot.

**Why it happens:**
GSAP's `useGSAP` hook from `@gsap/react` handles cleanup automatically — but only for animations and triggers created inside its callback. If any ScrollTrigger is created in a plain `useEffect` instead of `useGSAP`, it is not tracked and will not be killed on unmount. Mixing `useEffect` and `useGSAP` is the source of leaks.

**How to avoid:**
Use `useGSAP` exclusively for all GSAP-related code. Never mix with `useEffect` for GSAP:

```tsx
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'

gsap.registerPlugin(ScrollTrigger)

function ParallaxSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // All ScrollTrigger instances created here are auto-killed on unmount
    gsap.to(containerRef.current, {
      y: -100,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    })
  }, { scope: containerRef }) // scope prevents selector leaks

  return <div ref={containerRef}>...</div>
}
```

Also call `ScrollTrigger.refresh()` once after the page layout settles (after fonts and images load) to ensure trigger positions are correct for the new page:
```tsx
useGSAP(() => {
  // ... setup triggers
  ScrollTrigger.refresh()
}, [pathname]) // Re-run on route change
```

**Warning signs:**
- Navigating to a page a second time shows animations that already ran firing again from the start
- Browser memory (Chrome DevTools > Memory tab) grows with each navigation and never stabilizes
- `ScrollTrigger.getAll().length` in browser console is greater than the number of triggers on the current page
- Playwright visual regression tests fail intermittently (not consistently) — stale triggers fire during screenshot capture

**Phase to address:**
GSAP ScrollTrigger phase — before adding more than one page with ScrollTrigger. The leak compounds rapidly; fix at the first component, not after all parallax is added.

---

### Pitfall 6: Lenis Navigation Scroll Position — Page Opens Halfway Down on Next.js Link Navigation

**What goes wrong:**
When a user clicks a Next.js `<Link>` while Lenis is still interpolating (mid-scroll, momentum still active), Lenis carries its internal scroll state to the next page. The new page opens at the scroll position where Lenis stopped interpolating — which could be 400px down the page — instead of at the top.

This is a confirmed and actively discussed issue in the Lenis GitHub repo (Issue #319, Discussion #244). It manifests as: user scrolls down hero, clicks "View Projects" link, lands on `/projects` but sees the page from 300px down, missing the hero section.

**Why it happens:**
Lenis maintains an internal `targetScroll` value that represents where it is trying to scroll to. On page navigation, React Router/Next.js changes the URL but Lenis's internal state is not reset. The RAF loop continues from the previous `targetScroll` value. The `<ReactLenis root>` persists across navigations because it is in the layout component — it is NOT unmounted on page change.

**How to avoid:**
Add a route-change listener that resets Lenis to scroll position 0 with `immediate: true` (no animation) on every pathname change:

```tsx
// Inside LenisProvider component
import { useLenis } from 'lenis/react'
import { usePathname } from 'next/navigation'

function ScrollReset() {
  const lenis = useLenis()
  const pathname = usePathname()

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true })
  }, [pathname, lenis])

  return null
}
```

Render `<ScrollReset />` inside `<ReactLenis>` so it has access to the Lenis context.

**Warning signs:**
- Clicking any navigation link while the page is scrolled down lands on the new page partway down
- The browser back button takes you to the previous page but at the top (native scroll restoration wins over Lenis)
- Lighthouse CI captures the page mid-scroll when the dev server is running and previous test left scroll position — but this is less likely since lhci uses fresh browser sessions

**Phase to address:**
Lenis integration phase — immediately after the provider is wired. Test by scrolling to the bottom of the hero, clicking to `/projects`, and verifying the page renders from the top.

---

### Pitfall 7: Magnetic Button Using `mousemove` on Every Event — Mobile Touch Artifacts and Lighthouse TBT Regression

**What goes wrong:**
The magnetic button effect tracks mouse position using a `mousemove` listener and applies a `gsap.quickTo()` transform. The listener fires at native frequency — up to 200Hz on high-refresh displays. On mobile, `touchmove` fires at similar frequency and can activate the magnetic transform, causing a "drunk button" effect where tap targets shift unpredictably.

More critically: if the `mousemove` handler calls `gsap.to()` (not `quickTo`) on every event, it creates a new tween on every pixel of mouse movement — hundreds of concurrent tweens per second. This saturates the GSAP animation queue and causes Lighthouse Total Blocking Time (TBT) to spike. TBT weight is 30% of the Lighthouse performance score. A spike from 0ms to 200ms TBT can drop performance score from 0.95 to below 0.90.

**Why it happens:**
The canonical magnetic button tutorial uses `mousemove` with `gsap.to()`. It works in demo conditions where the mouse moves slowly and the device is powerful. On lower-end devices or rapid mouse movements, the tween queue overflows. Mobile touch events are not filtered because the tutorials target desktop.

**How to avoid:**
1. Use `gsap.quickTo()` which creates a single reusable setter that does not create new tweens per call:
```tsx
const xTo = gsap.quickTo(buttonRef.current, 'x', { duration: 0.3, ease: 'power3' })
const yTo = gsap.quickTo(buttonRef.current, 'y', { duration: 0.3, ease: 'power3' })

// In mousemove handler:
xTo(relativeX)
yTo(relativeY)
```

2. Guard touch devices with the same `any-hover: hover` pattern already used by `DotGridSpotlight`:
```tsx
useEffect(() => {
  const canHover = window.matchMedia('(any-hover: hover)').matches
  if (!canHover) return // Skip magnetic on touch devices entirely
  // ... attach mousemove listener
}, [])
```

3. Respect `prefers-reduced-motion` — do not apply magnetic transform at all under reduced motion:
```tsx
const prefersReducedMotion = useReducedMotion()
if (prefersReducedMotion) return <button>{children}</button> // Plain button
```

4. Reset position on `mouseleave` with a smooth return:
```tsx
xTo(0) // Return to center
yTo(0)
```

**Warning signs:**
- On mobile, tapping buttons causes them to slide or jitter before activating
- Lighthouse TBT > 50ms after adding magnetic buttons (check in lhci report)
- GSAP `gsap.globalTimeline.getChildren().length` grows unboundedly during rapid mouse movement
- DevTools Performance tab shows long tasks during mouse movement

**Phase to address:**
Magnetic button phase — implement with `quickTo` from the start. Run Lighthouse locally after adding to the first CTA and verify TBT remains < 50ms before adding to additional elements.

---

### Pitfall 8: Playwright Visual Regression Snapshots Break From Color Changes Without Baseline Update

**What goes wrong:**
The 18 existing PNG baselines were taken with the current color values. Adding Matrix color harmony to project cards, typography, and sections changes the colors rendered on those pages. The Playwright visual regression tests (`visual-regression.spec.ts`) use `maxDiffPixelRatio: 0.02` — any change affecting more than 2% of pixels fails.

A Matrix color extension that changes project card backgrounds, border colors, or typography across `/projects`, `/projects/teamflow`, `/projects/devcollab` will immediately fail 6-8 of the 18 snapshot tests. CI blocks merge.

This is not a bug — it is the test suite working correctly. But if the developer does not understand this, they spend time debugging CI failures that are actually intentional visual changes that need new baselines.

**Why it happens:**
The test suite is designed to catch unintended visual changes. Intentional design changes (Matrix color harmony) are also caught — requiring a baseline update. The `reducedMotion: 'reduce'` is already set in the test, so Lenis/GSAP/motion animations are suppressed for snapshots. But color changes are not animation — they render regardless of reduced motion.

**How to avoid:**
Treat each visual milestone (color harmony phase, typography phase) as requiring a deliberate baseline update:

1. Make the color change
2. Run `npx playwright test --config=playwright.visual.config.ts --update-snapshots` locally
3. Review the diff images in `/apps/web/test-results/` — verify only the intentional areas changed
4. Commit the new baselines alongside the color changes in the same commit

This workflow prevents the CI failure pattern. Never run `--update-snapshots` without reviewing diffs — it can silently accept regressions.

Also note: the test runs from `npm run dev` (not standalone build) per the `playwright.visual.config.ts` `webServer` config. Color values must be final in the dev server to produce correct baselines.

**Warning signs:**
- CI fails with `Screenshot comparison failed` on multiple portfolio routes after a color change
- Snapshot diff images show the entire card or section changed color (intentional) vs. a small unexpected area changed (regression)
- Error: `A snapshot doesn't exist at path ... — writing actual` — baseline file is missing entirely

**Phase to address:**
Any phase that changes visual appearance of snapshotted pages. Add "update Playwright baselines" as a required checklist item in every phase that touches colors, typography, or layout. Never land a phase without passing Playwright CI.

---

### Pitfall 9: Matrix Color CSS Variables Conflict With Tailwind v4 `@theme inline` Tokens

**What goes wrong:**
The existing design system exposes Tailwind utilities through `@theme inline { --color-background: var(--background); ... }`. If new Matrix color tokens are added to `@theme inline` instead of plain `:root` CSS variables, they compete with Tailwind's cascade layer system.

The specific failure: adding `--color-matrix-green: var(--matrix-green)` to the `@theme inline` block makes `text-matrix-green` a valid Tailwind utility. But the `.matrix-theme` scope applies `var(--matrix-green)` for portfolio routes only. In the dashboard routes (`/dashboard`, `/projects` in the TeamFlow app), the `--matrix-green` variable is not defined in `:root` without the `.matrix-theme` class — it resolves to empty, making `text-matrix-green` render invisibly.

Alternatively, if `--matrix-green` IS added to `:root` globally (for the Tailwind utility to work), it bleeds into the dashboard and TeamFlow routes, potentially conflicting with Shadcn/Radix Colors design tokens there.

**Why it happens:**
The existing architecture correctly keeps Matrix tokens in `:root` as plain CSS variables (not `@theme inline`) — consumed as `style={{ color: 'var(--matrix-green)' }}` or as raw CSS in `.matrix-theme` scoped classes. Adding them to `@theme inline` breaks this encapsulation. The PROJECT.md Key Decisions section explicitly documents: "Matrix tokens in :root (not @theme)" — the original decision was intentional.

**How to avoid:**
Never add Matrix color tokens to `@theme inline`. Continue the established pattern:
- Matrix colors live in `:root` as `--matrix-green`, `--matrix-green-dim`, `--matrix-green-ghost`
- Consume via `style={{ color: 'var(--matrix-green)' }}` in TSX
- Or via `.matrix-theme` scoped utility classes in `globals.css`

If a Tailwind utility class is genuinely needed for Matrix colors (e.g., for convenience in components), scope the `@theme inline` token to `.matrix-theme`:
```css
/* In globals.css — INSIDE the .matrix-theme scope, not in :root @theme */
.matrix-theme {
  @theme inline {
    --color-matrix-green: #00FF41;
  }
}
```

Note: Tailwind v4's `@theme` inside a class selector is an emerging pattern — verify behavior before using.

**Warning signs:**
- `text-matrix-green` class renders transparent or invisible in TeamFlow/DevCollab dashboard routes
- Tailwind utility `text-matrix-green` works on portfolio pages but not in Shadcn component stories
- Dashboard routes flash green text on page load then return to normal (cascade race condition)
- CSS specificity warnings in browser DevTools for `--color-matrix-green` resolution

**Phase to address:**
Matrix color harmony phase — before adding any new CSS variables. Audit every new token against the established "Matrix tokens in :root (not @theme)" decision. If extending globals.css, add a comment noting the intentional separation.

---

### Pitfall 10: Lenis `html.lenis` Required CSS Not Added — CLS and Double Scroll Bar

**What goes wrong:**
Lenis requires specific CSS to function correctly on the `<html>` element. Without it:
1. **Double scroll bar**: the browser renders its native scrollbar while Lenis also handles scrolling, resulting in two scroll bars (Lenis's and the browser's native one)
2. **CLS from height mismatch**: `html` defaults to `height: auto` in most Lenis docs, but without explicit CSS, different browsers treat `html` height differently, causing inconsistent layout that Lighthouse flags as layout shift

The required CSS is:
```css
html.lenis, html.lenis body {
  height: auto;
}

.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}

.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}

.lenis.lenis-stopped {
  overflow: hidden;
}
```

Without `scroll-behavior: auto !important`, CSS smooth scroll (`scroll-behavior: smooth` set by some CSS resets or Tailwind base) conflicts with Lenis's own interpolation, creating double-smoothing that makes scroll feel sluggish and wrong.

**Why it happens:**
The Lenis package is installed but the required CSS is not automatically injected. Developers install ReactLenis, see smooth scrolling appear to work in basic cases, and ship without the CSS. The CLS and double-scroll issues appear only in specific browsers or specific scroll scenarios.

**How to avoid:**
Add the Lenis CSS requirement to `globals.css` as the first action when integrating Lenis:

```css
/* globals.css — add immediately when Lenis is integrated */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }
```

Note: `ReactLenis root` adds the `lenis` class to `<html>` automatically — no manual class management needed.

**Warning signs:**
- Two vertical scroll bars appear side-by-side in Firefox or Safari
- Scroll feels like it's applying smoothing twice (sluggish, over-damped)
- CLS score > 0 in Lighthouse (unexplained layout shift on initial paint)
- `html` element in DevTools does not have the `lenis-smooth` class after page load (indicates ReactLenis did not initialize)

**Phase to address:**
Lenis integration phase — add the CSS to `globals.css` in the same commit as the LenisProvider component.

---

## High-Severity Pitfalls

### Pitfall 11: GSAP Plugin Registered Multiple Times — Causes Warning and Potential Animation State Corruption

**What goes wrong:**
GSAP requires plugins to be registered once with `gsap.registerPlugin(ScrollTrigger)`. In Next.js App Router with hot module replacement, if the registration call is inside a component body (not a module-level top-of-file call), it re-runs on every HMR update. GSAP emits a warning:
```
GSAP: ScrollTrigger is already registered
```
In production, repeated registration across multiple components that each import and register the plugin causes GSAP's internal plugin state to be inconsistent — triggers may fire with stale configuration from a previous registration.

**Why it happens:**
Each component file imports and registers `ScrollTrigger` independently. This works in simple apps but in App Router with multiple page components, all potentially importing the plugin, GSAP sees multiple registrations.

**How to avoid:**
Register GSAP plugins exactly once in a module-level call in a single shared file:

```typescript
// apps/web/lib/gsap.ts — run once at module load time
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }
```

All components import from this file, not from `gsap` directly:
```tsx
import { gsap, ScrollTrigger } from '@/lib/gsap'
```

**Warning signs:**
- Browser console: `GSAP: ScrollTrigger is already registered`
- Animations work on first page load but break after HMR update in dev
- Multiple `import { ScrollTrigger } from 'gsap/ScrollTrigger'` + `gsap.registerPlugin(ScrollTrigger)` calls across different component files

**Phase to address:**
GSAP ScrollTrigger phase — create the shared `lib/gsap.ts` module before writing any ScrollTrigger usage. This is a one-time setup, not a per-component concern.

---

### Pitfall 12: Magnetic Button Focus State Lost — WCAG 2.5.3 Violation and Keyboard Navigation Broken

**What goes wrong:**
The magnetic button effect applies `transform: translate(Xpx, Ypx)` to the button element on mouse move. CSS transforms do not affect the visual focus ring position on all browsers — the focus ring renders at the original (non-transformed) position. On keyboard navigation, the focus ring appears in the center of the button while the button's visual appearance is offset, creating a confusing UX where the focus indicator does not match the interactive element.

Additionally, if the magnetic effect applies `pointer-events: none` to child elements (a common pattern for capturing mouse position), keyboard focus events may not propagate correctly through the component tree, breaking Tab navigation through magnetic buttons.

**Why it happens:**
The magnetic effect is designed for mouse interaction. Focus behavior during keyboard navigation is an afterthought. The `translate` transform causing focus ring misalignment is a browser rendering edge case that only surfaces during keyboard testing.

**How to avoid:**
1. Apply the magnetic transform to an inner wrapper, not the `<button>` element itself — the focus ring stays on the `<button>`, the visual effect on the wrapper:
```tsx
<button className="magnetic-btn" ref={buttonRef}>
  <span className="magnetic-inner" ref={innerRef}>
    {children}
  </span>
</button>
```
Animate `innerRef` with GSAP, not `buttonRef` — the `<button>` stays fixed, maintaining correct focus ring position.

2. Test keyboard navigation: Tab to the button, verify focus ring appears at the button's visual location.

3. Verify `pointer-events` are not blocked on any interactive element. The existing `EvervaultCard` correctly uses `pointer-events-none` on the noise overlay, not on the link — same principle applies here.

**Warning signs:**
- Tab to a magnetic button and press Space — focus ring appears elsewhere on the page
- Screen reader announces the button but keyboard activation doesn't work
- `axe-core` in Playwright accessibility tests reports "Interactive element has no visible focus indicator"
- The accessibility spec in `e2e/portfolio/accessibility.spec.ts` catches this if it tests keyboard focus

**Phase to address:**
Magnetic button phase — test keyboard navigation before any other UX testing. Add to the magnetic button's "done" definition: Tab to the button and visually confirm focus ring aligns with the button.

---

### Pitfall 13: Lenis Blocks Radix UI Dialog/Modal Scroll Lock — Modals Unable to Prevent Background Scroll

**What goes wrong:**
Radix UI's `Dialog`, `AlertDialog`, and `CommandDialog` components manage body scroll lock when a modal is open — they set `overflow: hidden` on `<body>` to prevent background scroll. Lenis bypasses the native browser scroll with its own RAF loop, so the `overflow: hidden` on body has no effect. When a modal is open, Lenis continues scrolling the background page.

The existing portfolio has `<CommandPalette />` (in the portfolio layout) which uses Radix's Dialog. When Lenis is active and the user opens the Command Palette, the background scrolls freely behind the modal.

**Why it happens:**
Lenis works by using `requestAnimationFrame` to set `window.scrollTo()` values, completely bypassing the CSS `overflow: hidden` mechanism. Radix's scroll lock targets the CSS property, not the scroll event. They are operating at different levels.

**How to avoid:**
Use Lenis's built-in `stop()` and `start()` API to disable scrolling when Radix modals open:

```tsx
// Hook to sync Lenis with Radix Dialog open state
import { useLenis } from 'lenis/react'

function useDisableLenisOnModal(isOpen: boolean) {
  const lenis = useLenis()
  useEffect(() => {
    if (isOpen) lenis?.stop()
    else lenis?.start()
    return () => lenis?.start() // Cleanup in case component unmounts while open
  }, [isOpen, lenis])
}
```

Use `data-lenis-prevent` attribute on scrollable modal content to allow inner scroll without Lenis interference:
```tsx
<DialogContent data-lenis-prevent>
  {/* Scrollable content inside modal — Lenis will not interfere */}
</DialogContent>
```

**Warning signs:**
- Opening Command Palette (`Cmd+K`) allows background page to keep scrolling
- Radix `Dialog` overlays are visible but the page scrolls behind them
- `overflow: hidden` on body appears in DevTools but background scroll is not stopped

**Phase to address:**
Lenis integration phase — test the CommandPalette immediately after wiring Lenis. This is a regression on existing functionality, making it critical to catch before any new features are added.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `autoRaf: true` with Lenis when GSAP ScrollTrigger is also used | Works in simple demos | Two RAF loops fight each other; scroll jitter; useScroll conflicts | Never when using GSAP ScrollTrigger simultaneously |
| `gsap.to()` in mousemove handler for magnetic button | Simple, readable code | Creates hundreds of tweens/second; TBT regression; Lighthouse CI failure | Never — always use `gsap.quickTo()` |
| Registering `ScrollTrigger` inside each component that uses it | Keeps components self-contained | Duplicate registration warnings; potential state corruption after HMR | Never — use a shared `lib/gsap.ts` module |
| Adding `--color-matrix-green` to `@theme inline` for Tailwind utility | Convenient utility class | Bleeds into dashboard routes; conflicts with Radix Colors cascade | Never — keep Matrix tokens in `:root` only |
| Skipping Playwright baseline update after color changes | Avoids a CI step | CI blocks on every push until baselines are updated anyway | Never — update baselines in the same commit as color changes |
| `pin: true` ScrollTrigger on content-height-dependent elements | Easy parallax depth effect | CLS regression; Lighthouse CI gate failure | Only if element has explicit `height: 100vh` CSS set before GSAP initializes |
| Skipping Lenis CSS (`html.lenis { height: auto }`) | Less CSS to write | Double scroll bars in Firefox/Safari; `scroll-behavior: smooth` double-dampening | Never — required for correct Lenis behavior |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Lenis + Next.js Server Component | Importing ReactLenis in a Server Component layout | Create a `'use client'` LenisProvider wrapper, import that into the layout |
| Lenis + GSAP ScrollTrigger | Using `scrollerProxy()` with root Lenis | Use `lenis.on('scroll', ScrollTrigger.update)` + GSAP ticker |
| Lenis + motion v12 `useScroll` | Running Lenis with `autoRaf: true` alongside motion RAF | Set `autoRaf: false`; drive Lenis from GSAP ticker |
| Lenis + Radix Dialog | Relying on CSS `overflow: hidden` to lock background scroll | Call `lenis.stop()` on modal open, `lenis.start()` on close |
| Lenis + Next.js navigation | ReactLenis persists across routes with stale scroll position | `useLenis()` + `usePathname()` → `lenis.scrollTo(0, { immediate: true })` on pathname change |
| GSAP + React | Using `useEffect` for GSAP animations | Use `useGSAP` hook from `@gsap/react` exclusively — auto-cleanup on unmount |
| GSAP ScrollTrigger + parallax pins | `pin: true` on auto-height content | translateY transforms only (no pin) OR explicit CSS height before GSAP init |
| Magnetic button + mobile | Not guarding `mousemove` for touch devices | `window.matchMedia('(any-hover: hover)')` guard — same pattern as DotGridSpotlight |
| Magnetic button + keyboard nav | Applying transform to `<button>` element | Apply transform to inner `<span>` wrapper; `<button>` stays fixed |
| Matrix colors + Tailwind v4 | Adding Matrix tokens to `@theme inline` | Keep in `:root` only; consume as `var(--matrix-green)` inline styles or scoped `.matrix-theme` classes |
| Playwright snapshots + color changes | Running CI without baseline update | Always `--update-snapshots` locally, review diffs, commit baselines with the color change |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `gsap.to()` in mousemove handler | TBT spike; GSAP animation queue overflow; sluggish button response | `gsap.quickTo()` — single reusable setter, no tween per call | Any device; immediately noticeable on lower-end laptops |
| `pin: true` on variable-height content | CLS > 0.1 in Lighthouse; CI gate failure | translateY parallax without pin; explicit height CSS before GSAP init | Lighthouse run immediately after adding first pinned section |
| Lenis + `scroll-behavior: smooth` CSS conflict | Double-smooth scroll; feels sluggish and over-damped | `scroll-behavior: auto !important` in Lenis CSS | All pages; immediately visible |
| Multiple GSAP ticker callbacks (one per component) | RAF executes N callbacks per frame where N = number of animation components | Single shared `gsap.ticker.add()` in LenisProvider only | When more than 3-4 parallax components are on the page simultaneously |
| Magnetic transform on `<button>` (not inner wrapper) | WCAG focus ring misalignment; accessibility test failure | Inner wrapper receives transform; button stays in place | Keyboard navigation testing |
| ScrollTrigger triggers not killed on unmount | Memory grows per navigation; animations fire twice on return | `useGSAP` hook (not useEffect) for all GSAP code | After 3-4 navigations in a single session |

---

## "Looks Done But Isn't" Checklist

- [ ] **Lenis provider:** ReactLenis renders → verify `<html>` element has `lenis` class in DevTools; if missing, provider did not initialize
- [ ] **Lenis + navigation:** Smooth scroll works → verify by scrolling 50% down, clicking a nav link, confirming the new page starts at the top (not mid-scroll)
- [ ] **Lenis + Command Palette:** Smooth scroll works → verify Cmd+K opens Command Palette and background page does NOT scroll while modal is open
- [ ] **GSAP ScrollTrigger positions:** Animation fires → verify with `markers: true` that trigger start/end align with the intended viewport positions (not offset by 100-500px)
- [ ] **ScrollTrigger cleanup:** Animations work → navigate away and back to the page; verify animations run exactly once on the second visit, not twice
- [ ] **Magnetic button:** Looks correct → Tab to the button and confirm the focus ring aligns with the button's visual center, not the original position
- [ ] **Magnetic button on mobile:** Appears in test browser → load on a touch device or Chrome DevTools mobile simulation; confirm button does NOT shift on tap
- [ ] **Magnetic button TBT:** Feels responsive → run Lighthouse after adding magnetic buttons; verify TBT remains < 50ms
- [ ] **Matrix color variables:** Render correctly in portfolio → switch to TeamFlow dashboard route and confirm no Matrix green bleeds into the dashboard
- [ ] **Playwright baselines:** All tests green locally → run `npx playwright test --config=playwright.visual.config.ts` locally after any visual change; update baselines if needed before pushing
- [ ] **Lighthouse gate:** Animations feel great → run `npx lhci autorun` locally before pushing; confirm all 5 URLs score ≥ 0.90 performance

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| SSR crash from ReactLenis in Server Component | LOW | Move ReactLenis behind `'use client'` provider wrapper; same pattern as existing MotionProvider |
| Lenis + motion scroll jitter | LOW | Set `autoRaf: false` on ReactLenis; add GSAP ticker integration in LenisProvider |
| CLS regression from pin spacers | MEDIUM | Remove `pin: true` from offending triggers; replace with translateY parallax; re-run Lighthouse to confirm |
| Wrong scrollerProxy pattern breaking trigger positions | MEDIUM | Remove all `scrollerProxy` calls; replace with `lenis.on('scroll', ScrollTrigger.update)` pattern; test all trigger positions |
| ScrollTrigger memory leak after 3+ navigations | MEDIUM | Replace all `useEffect` GSAP code with `useGSAP` hook; add `{ scope: containerRef }` to prevent selector leaks |
| Playwright CI blocked by color change baselines | LOW | Run locally: `npx playwright test --config=playwright.visual.config.ts --update-snapshots`; review diffs; commit new baselines |
| Lighthouse TBT regression from magnetic button | LOW | Replace `gsap.to()` in mousemove with `gsap.quickTo()`; one setter per axis, created once |
| Matrix color bleeding into dashboard | LOW | Remove `--color-matrix-*` from `@theme inline`; use `var(--matrix-green)` inline styles in `.matrix-theme`-scoped components only |
| Lenis scroll background scroll with Radix modal | LOW | Add `useLenis().stop()` on modal open; `useLenis().start()` on close; `data-lenis-prevent` on scrollable modal content |
| Keyboard focus ring misaligned on magnetic button | LOW | Move GSAP transform from `<button>` to inner `<span>` wrapper; retest keyboard navigation |

---

## Pitfall-to-Phase Mapping

| Pitfall | Severity | Prevention Phase | Verification |
|---------|----------|------------------|--------------|
| ReactLenis in Server Component → SSR crash | CRITICAL | Lenis integration phase (first commit) | `next build` succeeds; no `window is not defined` in build log |
| Lenis + motion v12 double RAF → jitter | CRITICAL | Lenis integration phase (provider setup) | Scroll with `useScroll`-driven elements; no jitter at high velocity |
| Lenis navigation scroll position not reset | CRITICAL | Lenis integration phase | Scroll 50% down, click nav link, new page starts at top |
| Lenis + Radix modal background scroll | HIGH | Lenis integration phase | Open Command Palette; background scroll is disabled |
| GSAP ScrollTrigger CLS from pin spacer | CRITICAL | GSAP parallax phase (first parallax component) | `npx lhci autorun` ≥ 0.90 after first pinned section |
| Wrong scrollerProxy pattern → desynced triggers | CRITICAL | GSAP parallax phase (initial setup) | Trigger markers align with visual element positions |
| GSAP triggers not cleaned up → memory leak | HIGH | GSAP parallax phase (first useGSAP hook) | Navigate away and back; animations fire once on second visit |
| GSAP plugin registered multiple times | MEDIUM | GSAP parallax phase (lib/gsap.ts creation) | No `GSAP: ScrollTrigger is already registered` warning in console |
| Magnetic button `gsap.to()` in mousemove → TBT | CRITICAL | Magnetic button phase | Lighthouse TBT < 50ms after adding buttons |
| Magnetic button touch artifacts on mobile | HIGH | Magnetic button phase | Chrome DevTools mobile simulation: no button shift on tap |
| Magnetic button focus ring misalignment | HIGH | Magnetic button phase | Keyboard Tab to button; focus ring aligns with visual center |
| Matrix colors in `@theme inline` → dashboard bleed | HIGH | Matrix color harmony phase | TeamFlow dashboard: no Matrix green in UI |
| Playwright baselines stale after color change | HIGH | Every visual phase | All 18 Playwright snapshot tests pass in CI |
| Lenis required CSS missing → CLS/double scroll | HIGH | Lenis integration phase | No double scroll bar in Firefox; Lighthouse CLS = 0 |
| Lenis `html.lenis` CSS scroll-behavior conflict | MEDIUM | Lenis integration phase | Scroll does not feel double-smooth in any browser |

---

## Sources

**Lenis SSR and Next.js integration:**
- [darkroomengineering/lenis React README](https://github.com/darkroomengineering/lenis/blob/main/packages/react/README.md) — autoRaf: false + GSAP ticker pattern (HIGH confidence — official)
- [ReactLenis begins halfway down on navigation — Issue #319](https://github.com/darkroomengineering/lenis/issues/319) — confirmed scroll position reset issue (HIGH confidence — confirmed bug)
- [Lenis + Next.js 13 — Issue #170](https://github.com/darkroomengineering/lenis/issues/170) — `use client` placement patterns (HIGH confidence — confirmed)
- [How to implement Lenis in Next.js — Bridger Tower](https://bridger.to/lenis-nextjs) — provider wrapper pattern (MEDIUM confidence)

**Lenis + GSAP ScrollTrigger integration:**
- [Patterns for synchronizing ScrollTrigger and Lenis in React/Next — GSAP Forum](https://gsap.com/community/forums/topic/40426-patterns-for-synchronizing-scrolltrigger-and-lenis-in-reactnext/) — `lenis.on('scroll', ScrollTrigger.update)` confirmed pattern (HIGH confidence — official GSAP forum)
- [GSAP React documentation](https://gsap.com/resources/React/) — useGSAP hook cleanup behavior (HIGH confidence — official)
- [ScrollTrigger + Lenis problem — GSAP Forum](https://gsap.com/community/forums/topic/39286-scrolltrigger-lenis-problem/) — pin spacer and blank space issues (MEDIUM confidence)

**Lenis + motion v12 conflict:**
- [Correct Way to Integrate Motion and Lenis with React — Discussion #2913](https://github.com/motiondivision/motion/discussions/2913) — conflicting RAF loops (MEDIUM confidence)
- [How to integrate motion frame with lenis — Discussion #3065](https://github.com/motiondivision/motion/discussions/3065) — frame synchronization (MEDIUM confidence)

**Magnetic buttons:**
- [2 Ways to Make Magnetic Buttons using React, GSAP, Framer Motion](https://blog.olivierlarose.com/tutorials/magnetic-button) — quickTo pattern (MEDIUM confidence)
- [GSAP accessible animation](https://gsap.com/resources/a11y/) — reducedMotion with gsap.matchMedia (HIGH confidence — official)
- [WCAG 2.3.3 Animations from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) — reduced motion requirements (HIGH confidence — official W3C)

**Tailwind v4 specificity:**
- [Tailwind v4 @theme inline dark mode discussion #15083](https://github.com/tailwindlabs/tailwindcss/discussions/15083) — `@theme inline` cascade behavior (MEDIUM confidence — community + confirmed)
- [Tailwind v4 dark mode upgrade issue #16171](https://github.com/tailwindlabs/tailwindcss/issues/16171) — specificity conflicts (MEDIUM confidence — confirmed issue)

**Lighthouse CI gate:**
- [Lighthouse performance score calculator](https://unlighthouse.dev/tools/lighthouse-score-calculator) — TBT (30%) and CLS (25%) weights (HIGH confidence)
- [Debugging CLS](https://www.ditdot.hr/en/debugging-cls-cumulative-layout-shift) — pin spacer as CLS source (MEDIUM confidence)

**Playwright visual regression:**
- [Fixing flaky Playwright visual regression tests](https://www.houseful.blog/posts/2023/fix-flaky-playwright-visual-regression-tests/) — animation disabling strategy (MEDIUM confidence)
- Direct codebase analysis: `apps/web/e2e/portfolio/visual-regression.spec.ts` — reducedMotion already set; `maxDiffPixelRatio: 0.02` threshold (HIGH confidence)
- Direct codebase analysis: `apps/web/playwright.visual.config.ts` — webServer uses `npm run dev`, retries: 2 in CI (HIGH confidence)

**Radix modal + Lenis:**
- [Lenis stop modal scroll — Discussion #292](https://github.com/darkroomengineering/lenis/discussions/292) — `data-lenis-prevent` and stop/start pattern (MEDIUM confidence)

---

*Pitfalls research for: v3.1 Portfolio Polish — Lenis smooth scroll, GSAP ScrollTrigger parallax, magnetic buttons, Matrix color harmony on existing Next.js 15 + motion v12 + GSAP stack with Lighthouse CI ≥ 0.90 gate and 18 Playwright visual regression baselines*
*Researched: 2026-02-20*
*Confidence: HIGH on SSR/hydration, GSAP cleanup, CI gate impact; MEDIUM on Tailwind v4 @theme conflicts, Playwright stability strategies*
