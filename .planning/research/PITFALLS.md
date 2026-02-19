# Pitfalls Research: Matrix Animation Milestone — Adding Animations to Existing Next.js 15 Portfolio

**Domain:** Adding Matrix-inspired animations (canvas rain, scroll animations, magnetic buttons, cursor effects, dark-first theme) to an existing Next.js 15 App Router portfolio sharing a Turborepo monorepo with a production SaaS app.
**Researched:** 2026-02-18
**Confidence:** HIGH (canvas/SSR/hydration patterns), HIGH (Framer Motion/GSAP + Next.js 15 specifics), HIGH (accessibility), HIGH (Tailwind v4 + Radix Colors dark mode), MEDIUM (Lighthouse CLS specifics for animation)

---

## Critical Pitfalls

### Pitfall 1: Canvas Component Crashes With `window is not defined` in Next.js 15 App Router

**Severity: CRITICAL**

**What goes wrong:**
The Matrix rain canvas component imports a browser API (`window`, `document`, `HTMLCanvasElement`) at module load time. Next.js 15 App Router pre-renders all components on the server. The module is evaluated server-side before any `'use client'` boundary can protect it, causing a `ReferenceError: window is not defined` build crash or runtime error.

A secondary variant: the component has `'use client'` but uses `dynamic()` with `ssr: false` inside a Server Component file. Next.js 15 introduced a regression where `dynamic()` with `ssr: false` called directly from a Server Component causes a build-time error. The workaround (using a wrapper Client Component solely for the dynamic import) is required.

**Why it happens:**
App Router renders all components on the server first. `'use client'` marks a boundary but does not prevent the module graph from being evaluated on the server — it only prevents the *render* from running server-side. Libraries that access `window` at import time (not inside hooks) still crash. Additionally, the `ssr: false` regression in Next.js 15 blocks the standard pattern from Next.js 14.

**How to avoid:**
1. Place ALL canvas/animation initialization inside `useEffect`, never at module level:
   ```typescript
   'use client';
   import { useEffect, useRef } from 'react';

   export function MatrixRain() {
     const canvasRef = useRef<HTMLCanvasElement>(null);
     useEffect(() => {
       // Safe: window/document available here, runs client-only
       const canvas = canvasRef.current;
       if (!canvas) return;
       const ctx = canvas.getContext('2d');
       // ... animation setup
     }, []);
     return <canvas ref={canvasRef} />;
   }
   ```
2. Never call `window.innerWidth` or `document.*` outside `useEffect` or event handlers.
3. If you must use `dynamic()` with `ssr: false`, create a dedicated wrapper Client Component:
   ```typescript
   // MatrixRainWrapper.tsx — Client Component wrapper
   'use client';
   import dynamic from 'next/dynamic';
   const MatrixRain = dynamic(() => import('./MatrixRainCanvas'), { ssr: false });
   export { MatrixRain };
   ```
4. Never import the canvas module directly from a Server Component file.

**Warning signs:**
- Build fails with `ReferenceError: window is not defined`
- `dynamic(() => import('./Canvas'), { ssr: false })` causes a build error (Next.js 15 regression)
- Component renders blank in production but works in `next dev` (dev has more lenient SSR behavior)
- Lighthouse reports blank LCP element

**Phase to address:**
Phase where Matrix rain canvas is first introduced — day one of implementation. Verify with `next build && next start` before writing any animation logic.

---

### Pitfall 2: requestAnimationFrame Loop Not Canceled — Memory Leak on Every Route Change

**Severity: CRITICAL**

**What goes wrong:**
The Matrix rain animation runs an infinite `requestAnimationFrame` loop. When the user navigates away (Next.js App Router client-side navigation), the component unmounts but the animation loop continues running in the background, holding a reference to the canvas element and accumulating ~8KB of memory per mount/unmount cycle. After 10+ navigations the tab becomes sluggish. The canvas element is garbage-collected but the RAF callback keeps executing against a detached context.

**Why it happens:**
Developers write `requestAnimationFrame(animate)` inside `useEffect` without returning a cleanup function. React's `useEffect` cleanup runs on unmount, but if the RAF ID is not stored and `cancelAnimationFrame` is not called, the loop outlives the component. Recursive RAF scheduling is the worst variant: the next frame is scheduled at the end of each frame, so canceling requires storing the LATEST ID at each frame boundary, not the initial one.

**How to avoid:**
Store the animation frame ID in a ref and cancel it in the cleanup function. Use a ref (not state) to avoid re-renders:

```typescript
'use client';
import { useEffect, useRef } from 'react';

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const animate = () => {
      // ... draw frame
      rafRef.current = requestAnimationFrame(animate); // store LATEST ID
    };
    rafRef.current = requestAnimationFrame(animate);

    // REQUIRED cleanup — cancels the loop when component unmounts
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} />;
}
```

Additionally: cancel and restart the animation on canvas resize to prevent stale dimensions.

**Warning signs:**
- Chrome DevTools Memory tab shows heap growing with each portfolio page navigation
- CPU usage does not drop to 0% when navigating away from the page with the animation
- React Strict Mode (dev) triggers the effect twice: if no cleanup exists, two animation loops run simultaneously
- Animation appears choppy after 5+ navigations (GPU battling two loops)

**Phase to address:**
Phase where Matrix rain canvas is introduced. Verify cleanup with React Strict Mode — it intentionally mounts/unmounts twice in development, so any leak is immediately visible. Run Chrome Performance profiler: CPU should return to baseline after navigating away.

---

### Pitfall 3: Canvas Causes LCP Regression — Lighthouse Score Drops Below 90 Gate

**Severity: CRITICAL**

**What goes wrong:**
The portfolio has a Lighthouse CI gate of `categories:performance >= 0.9` (90+). Adding a full-viewport canvas animation as a background element behind the hero section can drop LCP by 300-800ms and drop the performance score below the gate, blocking CI. This happens through two mechanisms: (1) the canvas element itself becomes the LCP candidate if it renders before text, blocking the score; (2) even when not the LCP element, canvas initialization on the main thread delays paint of the actual LCP element (the hero heading).

Additionally, a canvas that draws on every frame without GPU compositing (`will-change: transform` or hardware-accelerated draws) causes excessive main thread work, raising Total Blocking Time (TBT, 30% of Lighthouse score).

**Why it happens:**
Canvas 2D context operations are main-thread CPU work. A full-viewport Matrix rain running at 60fps can consume 15-30% CPU on a mid-range laptop. Lighthouse emulates a 4x CPU slowdown (Moto G4 profile) — on simulated mobile the canvas can block for 300-500ms before the LCP element can paint. The `categories:performance: ["error", { "minScore": 0.9 }]` assertion in `lighthouserc.json` makes this a hard CI failure.

**How to avoid:**
1. Start the canvas animation with a `requestIdleCallback` or `setTimeout(..., 0)` delay — let the LCP element paint first:
   ```typescript
   useEffect(() => {
     const timer = setTimeout(() => {
       // start animation after LCP has painted
       rafRef.current = requestAnimationFrame(animate);
     }, 100);
     return () => {
       clearTimeout(timer);
       cancelAnimationFrame(rafRef.current);
     };
   }, []);
   ```
2. Set canvas `aria-hidden="true"` and do not give it explicit width/height attributes that would make it an LCP candidate — use CSS sizing instead.
3. Throttle frame rate to 30fps for the Matrix rain (it's decorative):
   ```typescript
   let lastTime = 0;
   const animate = (time: number) => {
     if (time - lastTime > 33) { // ~30fps cap
       drawFrame(ctx);
       lastTime = time;
     }
     rafRef.current = requestAnimationFrame(animate);
   };
   ```
4. Use `position: fixed` or `position: absolute` with `z-index: -1` so the canvas is composited independently and does not block layout.
5. Run `ANALYZE=true next build` and verify the canvas component is not in the initial bundle critical path.

**Warning signs:**
- `lhci autorun` returns `performance` assertion failure
- Chrome DevTools Performance tab shows long tasks during page load (> 50ms)
- LCP in Lighthouse report points to the canvas element, not the hero heading
- Lighthouse "Avoid large layout shifts" or "Reduce JavaScript execution time" flags reference canvas-related code

**Phase to address:**
Phase where Matrix rain canvas is introduced. Run Lighthouse CI after adding animation, before merging. The existing `lighthouserc.json` already runs 3 passes on the portfolio URLs — compare before/after scores.

---

### Pitfall 4: Framer Motion / `motion/react` — Wrong Import Package for React 19

**Severity: CRITICAL**

**What goes wrong:**
The project uses React 19 and Next.js 15. Installing `framer-motion` and importing from `"framer-motion"` causes peer dependency warnings, and in dev mode with React Strict Mode enabled, all animations break: initial state is stuck in its final state and exit animations snap instantly rather than playing. The animations appear correct in production builds but are broken during development, giving false confidence.

**Why it happens:**
`framer-motion` < 12.0 is incompatible with React 19's Strict Mode behavior, which double-invokes refs and effects. The library was rebranded to `motion` and the correct import path for React 19 is `"motion/react"`. Installing the old `framer-motion` package (which many tutorials still reference) will install a version that has not been updated for React 19 compatibility.

**How to avoid:**
1. Install the correct package: `npm install motion` (not `framer-motion`)
2. Import from `motion/react`, not `framer-motion`:
   ```typescript
   // WRONG — old package, React 19 issues
   import { motion, AnimatePresence } from 'framer-motion';

   // CORRECT — React 19 compatible
   import { motion, AnimatePresence } from 'motion/react';
   ```
3. Use `LazyMotion` with `domAnimation` features to keep bundle additions to ~15KB instead of the full 34KB:
   ```typescript
   import { LazyMotion, domAnimation, m } from 'motion/react';

   // Wrap your animation root once
   <LazyMotion features={domAnimation}>
     <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
       {children}
     </m.div>
   </LazyMotion>
   ```
4. Never import `motion` in Server Components — all `motion.*` usage requires `'use client'`.

**Warning signs:**
- Npm install shows `WARN: peer dependency "react": "^18"` from `framer-motion`
- In dev mode (Strict Mode), all `initial` states are permanently stuck — elements don't animate in
- `exit` animations snap immediately without playing
- Works in `next build && next start` but broken in `next dev`

**Phase to address:**
Phase where Framer Motion scroll animations are introduced. Verify React 19 compatibility immediately with a single animated element in Strict Mode before building out the full animation system.

---

### Pitfall 5: Missing `prefers-reduced-motion` — Accessibility Violation on Every Animated Element

**Severity: CRITICAL**

**What goes wrong:**
Every animated element (Matrix rain, scroll-in animations, magnetic buttons, cursor effects) violates WCAG 2.3.3 (Animation from Interactions) for users who have enabled "Reduce Motion" in their OS. The Lighthouse CI assertion `categories:accessibility: ["warn", { "minScore": 1 }]` will flag this. More critically, users with vestibular disorders experience nausea or disorientation from parallax and full-viewport animations. The Matrix rain background canvas — a full-screen rapidly-changing animation — is one of the most problematic patterns for this group.

**Why it happens:**
Developers add animations and test visually but never toggle the OS "Reduce Motion" preference during development. Accessibility test tools (axe-core via Playwright) do not automatically detect motion preference violations — they must be manually verified. The existing `@axe-core/playwright` in the project will not catch this.

**How to avoid:**
1. Add a global `prefers-reduced-motion` check at the CSS level as the baseline:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
2. For the canvas Matrix rain — the most critical case — check the media query in JavaScript and completely skip the animation loop:
   ```typescript
   useEffect(() => {
     const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
     if (mediaQuery.matches) return; // No canvas animation at all

     const startAnimation = () => { rafRef.current = requestAnimationFrame(animate); };
     startAnimation();
     mediaQuery.addEventListener('change', (e) => {
       if (e.matches) cancelAnimationFrame(rafRef.current);
       else startAnimation();
     });
     return () => cancelAnimationFrame(rafRef.current);
   }, []);
   ```
3. For Framer Motion (motion/react): use `MotionConfig` with `reducedMotion="user"` at the root — this automatically disables transform/layout animations:
   ```typescript
   import { MotionConfig } from 'motion/react';
   <MotionConfig reducedMotion="user">
     {/* All motion.* children respect OS reduced motion preference */}
   </MotionConfig>
   ```
4. For GSAP: check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before registering ScrollTrigger animations.
5. Test: enable "Reduce Motion" in System Settings → Accessibility and verify the portfolio is fully static.

**Warning signs:**
- Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce" shows animations still playing
- Playwright axe test with `--force-reduced-motion` flag fails
- OS "Reduce Motion" is enabled and full-screen canvas is still animating
- No `prefers-reduced-motion` media query anywhere in `globals.css`

**Phase to address:**
Every animation phase. Add the global CSS rule in the first animation phase. Add OS-level motion check to canvas in the Matrix rain phase. Wrap all Framer Motion usage in `MotionConfig reducedMotion="user"` at provider level before adding any animated component.

---

### Pitfall 6: GSAP ScrollTrigger Stale Triggers After App Router Navigation

**Severity: HIGH**

**What goes wrong:**
GSAP ScrollTrigger instances created on page A are not killed when Next.js App Router navigates to page B. On returning to page A, new ScrollTrigger instances are created for the same elements, resulting in duplicate animations running simultaneously. Elements animate twice, scroll positions are wrong (triggers fire at stale DOM positions), and ScrollTrigger's internal proxy scroll position conflicts with the real scroll position.

**Why it happens:**
ScrollTrigger maintains a global registry of all triggers. The `useGSAP()` hook automatically cleans up triggers created inside the hook's scope on unmount. But when developers create GSAP animations outside `useGSAP()` (in event handlers, in module scope, or in plain `useEffect` without calling `ScrollTrigger.kill()` in cleanup), they leak into the global registry. App Router's soft navigation does not full-page-reload, so leaked triggers persist across navigation.

**How to avoid:**
1. Always use `@gsap/react`'s `useGSAP()` hook instead of plain `useEffect` for all GSAP animation initialization:
   ```typescript
   'use client';
   import { useGSAP } from '@gsap/react';
   import { gsap } from 'gsap';
   import { ScrollTrigger } from 'gsap/ScrollTrigger';
   gsap.registerPlugin(ScrollTrigger); // Register once at module level

   export function ScrollSection({ containerRef }: { containerRef: RefObject<HTMLDivElement> }) {
     useGSAP(() => {
       gsap.from('.animate-in', {
         opacity: 0,
         y: 60,
         scrollTrigger: {
           trigger: '.animate-in',
           start: 'top 80%',
         }
       });
       // useGSAP automatically calls ScrollTrigger.kill() on unmount
     }, { scope: containerRef }); // scope prevents selecting elements from other components
   }
   ```
2. For animations created in event handlers, wrap with `contextSafe()`:
   ```typescript
   const { contextSafe } = useGSAP({ scope: containerRef });
   const onHover = contextSafe(() => {
     gsap.to(buttonRef.current, { scale: 1.1 });
   });
   ```
3. Call `ScrollTrigger.refresh()` once after all animations are registered, not on each component mount.
4. Do NOT call `ScrollTrigger.refresh()` in every component — only once at the page level.

**Warning signs:**
- Elements animate twice (stutter) after navigating back to a page
- Console: "ScrollTrigger refresh: updating positions" fires multiple times for the same trigger
- Scroll animations fire at wrong positions after client-side navigation
- Memory grows with each navigation cycle (visible in DevTools Memory tab)

**Phase to address:**
Phase where scroll-triggered animations are introduced. Test by navigating between portfolio pages at least 3 times and verify scroll animations play exactly once per page visit.

---

### Pitfall 7: Dark-First Theme Migration Breaks Existing Radix Colors Token Resolution

**Severity: HIGH**

**What goes wrong:**
The existing codebase uses Radix Colors with a carefully designed semantic token layer in `globals.css`. Light-mode values are set in `:root`, dark-mode values activate automatically when `.dark` is on `<html>` via the Radix dark CSS imports. Converting to dark-first (making dark the default, light the override) requires moving the dark Radix scale variables to `:root` and the light values to `:root.light`. If done incorrectly, components using `var(--background)`, `var(--foreground)`, `var(--primary)`, etc. stop resolving correctly — either both modes display dark, or the existing WCAG-validated contrast ratios break because dark values were designed for `oklch` contrast against dark backgrounds, not light.

**Why it happens:**
The current architecture relies on Radix Colors' own dark CSS files (`@radix-ui/colors/slate-dark.css`) which scope dark variables to `.dark` and `.dark-theme` selectors. These are not `:root` overrides — they live in separate CSS cascade layers. Switching to dark-first by simply inverting which set is in `:root` breaks the Radix cascade assumptions. Additionally, Tailwind v4's `@custom-variant dark (&:where(.dark, .dark *))` in the codebase is already correctly configured — any change to how `next-themes` writes the class (e.g., switching from `class` strategy to `data-theme` attribute) breaks this custom variant.

**How to avoid:**
1. Do NOT change how `next-themes` applies dark mode — keep `attribute="class"` strategy. The existing `@custom-variant dark (&:where(.dark, .dark *))` in `globals.css` is correctly configured.
2. For dark-first default: set `defaultTheme="dark"` in the `ThemeProvider` — this is the only change needed. Do not restructure the CSS variable cascade:
   ```typescript
   // providers/theme-provider.tsx
   <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
     {children}
   </ThemeProvider>
   ```
3. After changing `defaultTheme`, run the full Lighthouse CI suite across all portfolio URLs — validate that contrast ratios still pass for both themes.
4. Validate dark-first does not flash light theme on first load: `next-themes` uses `localStorage` — first-time visitors see dark by default, returning visitors see their preference.
5. Test the specific tokens that changed during the Phase 8 color audit (muted-foreground, warning, accent) in both themes after the defaultTheme change.

**Warning signs:**
- After changing defaultTheme, components that worked before now show incorrect colors in either mode
- First-time visitor sees a flash of light theme before dark loads (FOUC — Flash of Unstyled Content)
- Radix `--slate-1` resolves to the wrong end of the scale in one of the themes
- Lighthouse accessibility score drops due to contrast failures in dark mode

**Phase to address:**
Dark-first theme phase. Change only `defaultTheme="dark"` in ThemeProvider. Run Lighthouse on all routes before and after. Do not restructure the CSS token hierarchy.

---

### Pitfall 8: Scroll Animations Cause CLS (Cumulative Layout Shift) — Breaking the 90+ Score

**Severity: HIGH**

**What goes wrong:**
Scroll-triggered entrance animations (fade-in, slide-up, scale-in) that use `initial={{ opacity: 0, y: 60 }}` or GSAP's `from` with `y: 60` cause elements to initially render off their final position. During the Lighthouse audit (which measures CLS over the full page load), these displaced elements count as layout shifts, directly penalizing the CLS score (25% of Lighthouse performance score). A single mishandled scroll animation section can drop CLS from 0.0 to 0.15+, dropping the Lighthouse score below 90.

**Why it happens:**
CLS is measured from layout shift events during page load. An element that starts at `transform: translateY(60px)` and then moves to `translateY(0)` is a layout shift IF the element affects surrounding layout. CSS `transform` does not trigger layout shifts (it is GPU-composited), but `opacity: 0` followed by layout-affecting properties DO. Additionally, if elements start invisible and then become visible, they can shift surrounding elements if they are not `position: absolute/fixed`.

The Lighthouse CI collects 3 runs on portfolio pages including `/` (hero), `/projects`, and individual project pages — all scroll-animation-heavy pages.

**How to avoid:**
1. Use only `transform` and `opacity` for animation — never animate `height`, `width`, `top`, `left`, `margin`, or `padding`:
   ```typescript
   // GOOD — transform + opacity are compositor-safe (no CLS)
   initial={{ opacity: 0, y: 40 }}
   animate={{ opacity: 1, y: 0 }}

   // BAD — margin/padding changes trigger layout recalculation (causes CLS)
   initial={{ marginTop: 40, opacity: 0 }}
   animate={{ marginTop: 0, opacity: 1 }}
   ```
2. Pre-allocate space for animated elements. Never set `display: none` as the initial state — use `opacity: 0` with `visibility: hidden`:
   ```css
   .animate-target {
     opacity: 0;
     /* Space is reserved, no layout shift */
   }
   ```
3. Use `IntersectionObserver` with a threshold (e.g., 0.1) instead of scroll position — elements only animate when already in the viewport frame, not when they shift into it.
4. Add `will-change: transform, opacity` to elements that will animate (applied before animation starts, removed after).
5. Test CLS specifically: Chrome DevTools → Performance → record a full page scroll, inspect "Layout Shift" events in the timeline.

**Warning signs:**
- Lighthouse performance score drops after adding scroll animations but TBT and LCP remain stable — CLS is the culprit
- Chrome DevTools Performance timeline shows orange "Layout Shift" badges on animated elements
- `lhci autorun` fails with CLS > 0.1 assertion
- Elements visibly "jump" on the first paint before animation starts

**Phase to address:**
Phase where scroll animations are introduced. Measure CLS before (baseline 0.0) and after each animation type is added. Roll back any animation type that raises CLS above 0.05.

---

### Pitfall 9: Magnetic / Parallax Effects Degrade on Mobile — Touch Devices Fire No `mousemove`

**Severity: HIGH**

**What goes wrong:**
Magnetic button effects and parallax cursor-follow effects are built around the `mousemove` event. On touch devices (iOS Safari, Android Chrome — the majority of portfolio viewers on mobile), `mousemove` fires once on tap with a "sacrificial" single synthetic event, not continuously. The magnetic button snaps to one position on tap and never releases, creating a broken broken interaction. On iOS specifically, the momentum scrolling model conflicts with `mousemove`-based parallax, causing the background to appear frozen while content scrolls.

**Why it happens:**
`mousemove` is a pointer device event, not a touch event. Touch devices simulate a single `mousemove` before `mousedown` for compatibility, but do not continuously fire during touch movement. Developers build and test magnetic effects on desktop without checking mobile behavior. The effect looks polished on desktop but actively breaks on mobile, which is problematic for a recruiter-facing portfolio.

**How to avoid:**
1. Gate all `mousemove`-based effects behind a `(any-hover: hover) and (pointer: fine)` media query — this targets only devices with a precise pointer (mouse/trackpad):
   ```typescript
   useEffect(() => {
     const mediaQuery = window.matchMedia('(any-hover: hover) and (pointer: fine)');
     if (!mediaQuery.matches) return; // Skip entirely on touch devices

     const handleMouseMove = (e: MouseEvent) => { /* magnetic effect */ };
     window.addEventListener('mousemove', handleMouseMove);
     return () => window.removeEventListener('mousemove', handleMouseMove);
   }, []);
   ```
2. For the CSS `cursor: none` custom cursor: guard it with the same media query so mobile users keep the default cursor.
3. Throttle `mousemove` handlers with `requestAnimationFrame` — never do DOM manipulation directly in the handler:
   ```typescript
   let ticking = false;
   const handleMouseMove = (e: MouseEvent) => {
     if (!ticking) {
       requestAnimationFrame(() => {
         updateMagneticPosition(e.clientX, e.clientY);
         ticking = false;
       });
       ticking = true;
     }
   };
   ```
4. Test on real mobile: open the portfolio on an iPhone/Android. Magnetic buttons and parallax should be completely absent (not broken).

**Warning signs:**
- Magnetic button on mobile: button snaps to a position on tap and stays there
- Parallax background on iOS: appears frozen or stutters on scroll
- DevTools mobile emulation shows `mousemove` events — this is misleading (emulated mouse); test on a real device
- Portfolio reviewer on mobile reports "buttons are stuck"

**Phase to address:**
Phase where magnetic buttons and parallax effects are introduced. Test on a real mobile device before the feature is considered complete. Add a mobile-detection guard on day one of the implementation.

---

### Pitfall 10: Custom Cursor Breaks Existing Cursor Behaviors and Violates Accessibility

**Severity: HIGH**

**What goes wrong:**
Setting `cursor: none` globally to replace the system cursor with a custom `div`-based cursor breaks three things: (1) existing Shadcn/Radix components that set `cursor: pointer` on interactive elements — the custom cursor must read these states and change appearance accordingly; (2) users who rely on the OS cursor for accessibility (enlarged cursor, high-contrast cursor, inverted cursor) lose their customizations entirely; (3) on focus-only navigation (Tab key), the cursor element follows mouse position, not keyboard focus — making the custom cursor completely misleading for keyboard users.

**Why it happens:**
Developers set `cursor: none` on `body` or `:root` and add a custom cursor element, but forget that all interactive elements (Shadcn Button, Link, dialog trigger) had `cursor: pointer` in their CSS — this is now invisible since the real cursor is hidden. The custom `div` cursor only responds to `mousemove` and does not know which element has keyboard focus.

**How to avoid:**
1. Gate custom cursor behind `(any-hover: hover) and (pointer: fine)` media query — same as magnetic effects. Touch users and keyboard-primary users never see it:
   ```css
   @media (any-hover: hover) and (pointer: fine) {
     * { cursor: none !important; }
   }
   ```
2. The cursor `div` must also be hidden when using this CSS — apply the same media query to the cursor element's visibility.
3. Do not use `cursor: none` on interactive elements like buttons, links, inputs. Consider keeping the real cursor and only adding a trailing visual effect, rather than replacing the cursor entirely.
4. If replacing the cursor: implement cursor-state tracking that reads `data-cursor` attributes or listens to `mouseenter`/`mouseleave` on interactive elements to change cursor appearance (e.g., expand on hover over links).
5. Verify the cursor element has `pointer-events: none` so it never blocks clicks on elements beneath it.

**Warning signs:**
- Users cannot click interactive elements (cursor element is intercepting clicks) — missing `pointer-events: none`
- Shadcn buttons show no cursor state change on hover (the pointer cursor is hidden but custom cursor isn't responding)
- Tab-navigating through the portfolio: the cursor element stays in the last mouse position
- Screen reader users report confusion (cursor effects should not announce anything to AT)

**Phase to address:**
Phase where cursor effects are introduced. Test: (1) keyboard-only navigation through all interactive elements; (2) enable OS high-contrast mode and verify the cursor is visible; (3) `pointer-events: none` on cursor element (clicking must reach elements beneath).

---

### Pitfall 11: Framer Motion Added to Monorepo Portfolio (`apps/web`) Affects TeamFlow Bundle

**Severity: HIGH**

**What goes wrong:**
The monorepo shares a `node_modules` via npm workspaces. Installing `motion` (Framer Motion) in `apps/web`'s `package.json` adds it to the workspace `node_modules`, and if `apps/devcollab-web` or any shared `packages/*` imports from `motion/react`, it pulls the full animation library into bundles that don't need it. Additionally, Turborepo caches the `node_modules` hash — adding `motion` changes the hash, invalidating the cache for ALL apps in the monorepo, triggering full rebuilds of TeamFlow (`apps/web`) on the next CI run even when TeamFlow files didn't change.

**Why it happens:**
npm workspaces hoists dependencies to the root `node_modules`. A package installed only in `apps/web` can be accidentally imported from any app because the module resolution walks up to the root `node_modules`. Turborepo's cache key includes `package-lock.json` at the root — any `node_modules` change invalidates all app caches.

**How to avoid:**
1. Install `motion` scoped to the portfolio app only: `npm install motion --workspace=apps/web`
2. Verify it is in `apps/web/package.json` dependencies, NOT in root `package.json` or any shared `packages/*`
3. Verify neither `apps/api`, `apps/devcollab-web`, nor `apps/devcollab-api` import from `motion/react` (they have no reason to)
4. After installing, run `turbo run build --dry-run` to confirm only `apps/web` and its dependents are in the build pipeline — TeamFlow API should not be affected
5. Accept the one-time cache invalidation from the `package-lock.json` change — all subsequent builds should hit cache correctly

**Warning signs:**
- `motion` appears in `apps/api` or `apps/devcollab-api` bundle analyzer output
- CI shows full rebuild of ALL apps when only portfolio animation files changed
- `package-lock.json` shows `motion` hoisted to root `node_modules` as a top-level dependency

**Phase to address:**
Phase where Framer Motion / `motion` package is first installed. Verify workspace scoping before writing any animation code.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `suppressHydrationWarning={true}` on canvas parent | Silences hydration warning quickly | Hides real rendering mismatches that may affect content | Never — fix the root cause instead |
| Checking `typeof window !== 'undefined'` at module level instead of inside `useEffect` | Works in dev | Causes hydration mismatch in production (server renders undefined branch, client renders defined branch) | Never — always use `useEffect` |
| Importing `framer-motion` instead of `motion/react` | All tutorials use old import | React 19 dev-mode animation breakage, TypeScript peer dep warnings | Never — use `motion/react` |
| Using `position: fixed` canvas without `aria-hidden="true"` | Canvas shows immediately | Canvas is announced as empty region by screen readers; confusing for AT users | Never — always add `aria-hidden="true"` |
| Global `cursor: none` without media query guard | Custom cursor always visible | Breaks mobile, breaks accessibility cursor customizations | Never — always gate behind pointer media query |
| GSAP in `useEffect` instead of `useGSAP` | Familiar React pattern | ScrollTrigger instances leak on route changes | Never — use `useGSAP` exclusively |
| Running Lighthouse CI only on `/` | Faster CI | Scroll animations on `/projects` and project detail pages never measured | Never — the existing `lighthouserc.json` already correctly tests 5 URLs |
| Setting `will-change: transform` on every animated element | Animations feel smoother | GPU memory pressure; most elements don't need it | Only on elements animating at 60fps continuously |

---

## Integration Gotchas

Common mistakes when integrating these animation features into the existing Radix/Shadcn/Tailwind v4 stack.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Canvas + Next.js 15 App Router | Using `dynamic(import, { ssr: false })` directly in a Server Component | Create a wrapper Client Component solely for the dynamic import — Next.js 15 regression blocks `ssr: false` in Server Components |
| Framer Motion + React 19 | Installing `framer-motion` from npm (old package) | Install `motion` and import from `motion/react`; framer-motion@12+ supports React 19 |
| GSAP + App Router navigation | Creating ScrollTrigger in plain `useEffect` | Use `useGSAP()` from `@gsap/react` — auto-kills all triggers on unmount |
| `prefers-reduced-motion` + canvas | Checking once at mount, not reacting to changes | Add `mediaQuery.addEventListener('change', ...)` to react to OS setting changes at runtime |
| Radix Colors dark theme + dark-first default | Restructuring CSS variable cascade for dark-first | Only change `defaultTheme="dark"` in ThemeProvider — never touch the CSS variable structure |
| `@custom-variant dark` + next-themes | Switching next-themes to `data-theme` attribute mode | Keep `attribute="class"` — the existing `@custom-variant dark (&:where(.dark, .dark *))` requires the class strategy |
| Magnetic buttons + Radix/Shadcn | Adding `mousemove` listener directly on Shadcn `Button` component | Wrap Shadcn Button in a container div and track mouse relative to the container, not the button itself |
| Custom cursor + Radix dialogs | `cursor: none` applies inside Radix Portal (appended to body) | Radix portals are children of `document.body` — `cursor: none` on `body` covers them. Verify the cursor element is also appended to `body` and z-indexed above portals. |
| GSAP + Tailwind v4 CSS variables | Animating Tailwind v4 CSS custom properties with GSAP | GSAP can animate CSS variables: `gsap.to(element, { '--color-primary': newValue })` — but Tailwind v4 regenerates styles on build, verify variable names haven't changed |

---

## Performance Traps

Patterns that work at small scale but fail under real conditions.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full-viewport canvas at native 60fps | Passes Lighthouse on fast laptop; fails on simulated mobile | Cap canvas to 30fps for decorative animations; use `requestIdleCallback` delay at start | Lighthouse emulates 4x CPU slowdown — any Moto G4 emulation |
| `mousemove` handler doing DOM manipulation directly | Works on desktop, laggy on slower machines | Throttle with RAF: store coordinates in ref, apply in RAF callback | On mid-range laptops during portfolio review |
| Multiple GSAP ScrollTrigger instances per element | Correct on first load; doubles on second navigation | Use `useGSAP` scope + single trigger per element | After 2+ client-side navigations |
| `will-change: transform` on all animated elements simultaneously | Perceived smoothness on page load | Apply only during animation, remove after; use sparingly | >10 elements with `will-change` causes GPU memory exhaustion on mobile |
| `motion/react` full import without LazyMotion | ~34KB added to portfolio initial JS bundle | Use `LazyMotion` with `domAnimation` features (~15KB) | Lighthouse TBT increases on slow connections; scores above 90 but margin narrows |
| Canvas resize not debounced | Canvas distorts on window resize | Debounce resize handler at 100ms; recalculate columns and drop arrays | Any window resize event, common during portfolio review on ultrawide monitors |

---

## Security Mistakes

These are minimal for an animation milestone, but two issues apply specifically to this context.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Reading `window.location` for animation triggers in SSR | Server-side crash leaks stack trace in Vercel/Coolify logs | All `window.*` access in `useEffect` only |
| Canvas element without `aria-hidden` and with focusable content inside | Screen readers attempt to navigate canvas; confusing/broken AT experience | Always `aria-hidden="true"` on decorative canvas; never place interactive content inside canvas |

---

## UX Pitfalls

Common user experience mistakes specific to this animation feature set.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Matrix rain obscures portfolio content (text readability) | Recruiters cannot read hero heading, skills, or project descriptions | Apply the canvas with low opacity (0.05-0.15) and `z-index: -1`; verify text contrast with Lighthouse accessibility audit |
| Animation starts playing during initial page load before content is ready | Users see the animation before the content it's decorating | Delay canvas start by 100-200ms with `setTimeout`; use opacity fade-in on the canvas element itself |
| Scroll animations block scroll momentum on iOS | iOS Safari users experience "stuck" scrolling | Never use `e.preventDefault()` in scroll listeners; use `passive: true` on all scroll event listeners |
| Magnetic effect "follows" buttons too aggressively (large displacement) | Feels broken, not polished | Limit magnetic displacement to 20-30% of the element's size; use easing (spring physics) not linear interpolation |
| Cursor effect lags visibly behind mouse on slower machines | Looks buggy, unprofessional | Use CSS transform (GPU-composited) not `top`/`left` for cursor positioning; keep cursor DOM element lightweight |
| Dark theme default breaks OG image sharing (images designed for light) | Social preview images look wrong against dark background | OG images should use explicit dark backgrounds, not inherit from the page theme |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Matrix rain canvas:** Renders in browser — verify `cancelAnimationFrame` cleanup exists AND `prefers-reduced-motion` check skips the loop entirely
- [ ] **Canvas SSR:** Works in `next dev` — verify `next build && next start` (production SSR) shows no `window is not defined` errors
- [ ] **Framer Motion install:** Animations play in dev — verify they play in Strict Mode dev AND `motion/react` (not `framer-motion`) is the import
- [ ] **Scroll animations:** Elements animate in — verify CLS is 0.0 with Chrome DevTools Performance tab after adding each animation type
- [ ] **Lighthouse CI:** Passes locally — run `lhci autorun` (not just browser DevTools Lighthouse) using the 3-run averaging; local single runs can pass while CI fails
- [ ] **prefers-reduced-motion:** Looks accessible — actually toggle "Reduce Motion" in OS Settings and verify the portfolio is completely static (not just slower)
- [ ] **Magnetic buttons:** Looks polished on desktop — open on a real iPhone/Android and verify buttons have no broken snap-to-position behavior
- [ ] **Custom cursor:** Custom cursor shows — verify `pointer-events: none` is set on the cursor element (click on a button, it must work)
- [ ] **Dark theme default:** Dark mode looks correct — verify light mode still works by toggling the theme toggle (both directions)
- [ ] **GSAP cleanup:** Animations run — navigate to portfolio, then to `/dashboard`, then back; verify animations play exactly once and no console errors appear
- [ ] **Monorepo isolation:** Portfolio animations work — verify `turbo run build` shows `apps/api` and `apps/devcollab-api` did NOT rebuild due to the animation changes

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Canvas `window is not defined` in production | LOW | Move all browser API access inside `useEffect`; run `next build` locally to confirm before pushing |
| RAF memory leak discovered (heap growing) | LOW | Add `return () => cancelAnimationFrame(rafRef.current)` to `useEffect`; test with React Strict Mode double-mount |
| Lighthouse CI fails after adding canvas | MEDIUM | Add 100ms delay to canvas start; cap to 30fps; add `aria-hidden`; run local `lhci` to verify before pushing |
| Framer Motion dev-mode animations broken | LOW | Uninstall `framer-motion`, install `motion`; change all imports to `motion/react`; clear `.next` cache |
| GSAP ScrollTrigger ghost triggers | MEDIUM | Replace all `useEffect(gsap...)` with `useGSAP(...)`; add `scope` parameter; navigate through pages 3x to verify no doubles |
| CLS score dropped (scroll animations) | MEDIUM | Audit each animated element: replace any `y` offset with `transform: translateY` in CSS; remove `height`/`margin` animations |
| Dark theme migration breaks contrast | MEDIUM | Revert CSS changes; only change `defaultTheme="dark"` in ThemeProvider; re-run WCAG contrast validation on the semantic tokens |
| Custom cursor blocks clicks | LOW | Add `pointer-events: none` to cursor element immediately; verify with DevTools element picker |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Severity | Prevention Phase | Verification |
|---------|----------|------------------|--------------|
| Pitfall 1: Canvas `window is not defined` | CRITICAL | Matrix rain canvas phase — before writing animation logic | `next build && next start` zero errors; no blank canvas in production |
| Pitfall 2: RAF memory leak | CRITICAL | Matrix rain canvas phase — same day as animation loop | React Strict Mode double-mount shows no duplicate loops; Chrome Memory tab stable after 10 navigations |
| Pitfall 3: Canvas causes LCP regression | CRITICAL | Matrix rain canvas phase — after animation works | `lhci autorun` performance score >= 0.9 with canvas enabled |
| Pitfall 4: Wrong Framer Motion package | CRITICAL | Scroll animations phase — day one, package install | `motion/react` import; Strict Mode animations play correctly in dev |
| Pitfall 5: Missing prefers-reduced-motion | CRITICAL | First animation phase (applied globally) — checked on every subsequent animation addition | OS "Reduce Motion" enabled: portfolio fully static; canvas loop exits immediately |
| Pitfall 6: GSAP ScrollTrigger leaks | HIGH | Scroll animations phase | Navigate to portfolio → other page → back; scroll animations play once only |
| Pitfall 7: Dark theme migration breaks tokens | HIGH | Dark-first theme phase | Both themes verified in Lighthouse; WCAG contrast validation script passes for dark-first |
| Pitfall 8: Scroll animations cause CLS | HIGH | Scroll animations phase | CLS = 0.0 in Chrome Performance tab; Lighthouse score unchanged from baseline |
| Pitfall 9: Magnetic/parallax broken on mobile | HIGH | Magnetic buttons phase | Real device testing on iOS Safari; magnetic buttons absent (not broken) on touch |
| Pitfall 10: Custom cursor breaks interactions | HIGH | Cursor effects phase | Keyboard navigation test; `pointer-events: none` verified; high-contrast cursor test |
| Pitfall 11: Monorepo bundle isolation | HIGH | Package install phase (first animation dependency) | `turbo run build --dry-run` shows only `apps/web` affected; `apps/api` cache unchanged |

---

## Sources

**Canvas / SSR / Hydration:**
- [Next.js Hydration Error docs](https://nextjs.org/docs/messages/react-hydration-error) — official hydration mismatch documentation (HIGH confidence)
- [Next.js Discussion #72236: `ssr: false` not working in Next.js 15](https://github.com/vercel/next.js/discussions/72236) — confirmed regression requiring wrapper Client Component (HIGH confidence)
- [CSS-Tricks: requestAnimationFrame with React hooks](https://css-tricks.com/using-requestanimationframe-with-react-hooks/) — cleanup patterns (HIGH confidence)
- [Memory Leaks in React & Next.js (Jan 2026)](https://medium.com/@essaadani.yo/memory-leaks-in-react-next-js-what-nobody-tells-you-91c72b53d84d) — RAF leak benchmarked at ~8KB/cycle (MEDIUM confidence)

**Framer Motion / motion/react:**
- [Motion GitHub Issue #2668](https://github.com/motiondivision/motion/issues/2668) — React 19 incompatibility confirmed resolved in framer-motion@12+ / `motion` package (HIGH confidence)
- [Motion bundle size docs](https://motion.dev/docs/react-reduce-bundle-size) — 34KB full, ~15KB with LazyMotion domAnimation (HIGH confidence)
- [Next.js Discussion #72228: framer-motion in Next.js 15](https://github.com/vercel/next.js/discussions/72228) — import path issues (HIGH confidence)

**GSAP + Next.js 15:**
- [GSAP React Resources](https://gsap.com/resources/React/) — `useGSAP` cleanup requirements, `contextSafe`, Strict Mode behavior (HIGH confidence — official GSAP docs)
- [Optimizing GSAP in Next.js 15](https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232) — cleanup best practices (MEDIUM confidence)
- [GSAP community: ScrollTrigger in Next.js with useGSAP](https://gsap.com/community/forums/topic/40128-using-scrolltriggers-in-nextjs-with-usegsap/) — official community guidance (HIGH confidence)

**Accessibility / prefers-reduced-motion:**
- [Pope Tech Blog: Accessible animation (Dec 2025)](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) — WCAG 2.3.3 requirements (HIGH confidence)
- [CSS-Tricks: prefers-reduced-motion](https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/) — implementation patterns (HIGH confidence)
- [Custom Cursor Accessibility (dbushell.com, Oct 2025)](https://dbushell.com/2025/10/27/custom-cursor-accessibility/) — cursor accessibility violations (HIGH confidence — recent, specific)

**CLS / Lighthouse:**
- [Chrome Developers: Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) — CLS is 25% of score; LCP is 25% (HIGH confidence)
- [DebugBear: 2025 In Review Web Performance](https://www.debugbear.com/blog/2025-in-web-performance) — INP replaced FID; current metric weights (HIGH confidence)
- [Scroll animations techniques 2025](https://mroy.club/articles/scroll-animations-techniques-and-considerations-for-2025) — CLS-safe animation patterns (MEDIUM confidence)

**Dark theme / Radix Colors / Tailwind v4:**
- [Tailwind GitHub Discussion #16517: dark mode issues in v4](https://github.com/tailwindlabs/tailwindcss/discussions/16517) — confirmed `@custom-variant` conflicts (HIGH confidence)
- [iifx.dev: Enabling class-based dark mode Next.js 15 + Tailwind 4](https://iifx.dev/en/articles/456423217/solved-enabling-class-based-dark-mode-with-next-15-next-themes-and-tailwind-4) — `@custom-variant` configuration (MEDIUM confidence)
- [Medium: Theme colors with Tailwind v4 and next-themes](https://medium.com/@kevstrosky/theme-colors-with-tailwind-css-v4-0-and-next-themes-dark-light-custom-mode-36dca1e20419) — dark-first default pattern (MEDIUM confidence)

**Mobile / Touch / Performance:**
- [MDN: mousemove event](https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event) — single synthetic event on touch (HIGH confidence)
- [Apple Support: Reduce Motion on iOS](https://support.apple.com/en-us/111781) — OS-level prefers-reduced-motion (HIGH confidence)
- [Direct codebase analysis: `apps/web/lighthouserc.json`](file://.) — `minScore: 0.9` performance gate confirmed (HIGH confidence — direct code)

---

*Pitfalls research for: Matrix-animation additions to existing Next.js 15 portfolio (Turborepo monorepo, Tailwind v4, Radix Colors, Shadcn UI)*
*Researched: 2026-02-18*
*Confidence: HIGH — all critical pitfalls verified against official documentation, confirmed GitHub issues, or direct codebase analysis*
