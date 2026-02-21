# Stack Research

**Domain:** Portfolio Polish — Smooth scroll, GSAP parallax, magnetic buttons, Matrix theme extension
**Researched:** 2026-02-20
**Confidence:** HIGH

---

## Existing Installed Packages (Do Not Re-Install)

All animation libraries are already in `apps/web/package.json` at the workspace level. Zero new dependencies are needed for the core v3.1 features.

| Package | Installed Version | Import Path |
|---------|-------------------|-------------|
| `lenis` | 1.3.17 | `lenis` (core), `lenis/react` (ReactLenis + useLenis) |
| `gsap` | 3.14.2 | `gsap` (core), `gsap/ScrollTrigger` (plugin) |
| `@gsap/react` | 2.1.2 | `@gsap/react` (useGSAP hook) |
| `motion` | 12.34.2 | `motion/react` (motion, useMotionValue, useSpring, etc.) |

Verified with direct `node_modules` inspection — `lenis@1.3.17`, `gsap@3.14.2`, `motion@12.34.2`, `@gsap/react@2.1.2`.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `lenis` (ReactLenis) | 1.3.17 | Smooth scroll provider for portfolio layout | Already installed. `lenis/react` ships `ReactLenis` and `useLenis` built into the package — no separate `@studio-freight/react-lenis` needed. The `root` prop makes it wrap the native document scroll, not a fake scroll container. |
| `gsap` + ScrollTrigger | 3.14.2 | Parallax depth effects tied to scroll position | Already installed. ScrollTrigger is at `gsap/ScrollTrigger`. When Lenis drives scroll, ScrollTrigger must be synced via GSAP's ticker — not via its own native scroll listeners. |
| `@gsap/react` (useGSAP) | 2.1.2 | Safe GSAP animation lifecycle in React components | Already installed. Automatically handles cleanup on unmount and re-runs on deps change. Required for Next.js App Router to avoid ScrollTrigger instances leaking across route navigations. |
| `motion` (useMotionValue + useSpring) | 12.34.2 | Spring physics for magnetic button cursor tracking | Already installed. `useMotionValue` + `useSpring` from `motion/react` produce layout-thrash-free spring animations without React re-renders. Consistent with existing motion/react usage throughout portfolio. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lenis/dist/lenis.css` | included in lenis 1.3.17 | Scroll container CSS rules | Must be imported once — sets `html.lenis body { height: auto }` and overflow rules. Import in `apps/web/app/globals.css` via `@import`. |
| CSS custom properties only | — | Matrix color token extension | No new library. Extend existing `--matrix-green`, `--matrix-green-dim`, `--matrix-green-ghost` tokens already in `:root`. Add new tokens directly in `globals.css`. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Existing Lighthouse CI | Performance regression gate | Run after adding Lenis + ScrollTrigger to confirm score stays at or above 0.90. Lenis itself adds ~8KB gzipped — well within budget. |
| Existing Playwright visual regression | Snapshot comparison | Update baselines after Matrix color harmony changes to project cards, footer, sections. |

---

## Integration Architecture

### 1. Lenis Smooth Scroll

**Where:** `apps/web/app/(portfolio)/layout.tsx` via a new `LenisProvider` client component.

**Why not wrap in root layout:** The dashboard routes (TeamFlow, DevCollab) do not use smooth scroll. Scoping to the portfolio layout keeps it isolated.

**CSS import:** Add `@import "lenis/dist/lenis.css";` to `globals.css` before other imports. The lenis.css file contains: `html.lenis body { height: auto }` plus overflow and pointer-events rules for the smooth scroll container. Without it, Lenis does not function correctly.

**ReactLenis ref API (from lenis 1.3.17 TypeScript types):**
- `ReactLenis` is a `forwardRef` component
- `ref` exposes `{ wrapper, content, lenis }` — access the Lenis instance via `ref.current.lenis`
- `root` prop (boolean) — when `true`, targets the document scroll (what we want for portfolio)
- `options.autoRaf` — when `false`, you manually drive the RAF loop (required for GSAP ticker integration)
- The `autoRaf` prop directly on `<ReactLenis>` is deprecated in 1.3.17 — use `options={{ autoRaf: false }}` instead

**Lenis provider component structure:**

```tsx
// apps/web/components/portfolio/lenis-provider.tsx
'use client'

import { ReactLenis } from 'lenis/react'
import type { LenisRef } from 'lenis/react'
import { useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null)
  const pathname = usePathname()

  // Wire Lenis into GSAP ticker for ScrollTrigger synchronization
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)

    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000)
    }

    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)
    lenisRef.current?.lenis?.on('scroll', ScrollTrigger.update)

    return () => {
      gsap.ticker.remove(update)
      lenisRef.current?.lenis?.off('scroll', ScrollTrigger.update)
    }
  }, [])

  // Reset scroll to top on route change
  useEffect(() => {
    lenisRef.current?.lenis?.scrollTo(0, { immediate: true })
  }, [pathname])

  return (
    <ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>
      {children}
    </ReactLenis>
  )
}
```

**Route change scroll reset:** Lenis does not reset scroll position on Next.js App Router navigation. Without the `useEffect` above, users land partway down the page when navigating between portfolio pages. The `immediate: true` flag skips Lenis easing and teleports instantly.

**Reduced motion:** Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before rendering `<ReactLenis>`. When reduced motion is active, render a plain `<>{children}</>` without the Lenis wrapper. The existing `@media (prefers-reduced-motion: reduce)` CSS already sets `scroll-behavior: auto !important` but Lenis operates in JavaScript — it must be conditionally skipped at the component level too.

**`ReactLenis root` sets `class="lenis"` on `<html>`**, which activates the `lenis.css` rules. The `.matrix-theme` class on the portfolio layout div is unaffected — no cascade conflict.

### 2. GSAP ScrollTrigger Parallax

**Where:** Per-section 'use client' components. Not in layout.

**Plugin registration:** Register once in `LenisProvider` (shown above). Do NOT register in every component — GSAP's registration is global. A second `registerPlugin(ScrollTrigger)` call is a no-op but adds reader confusion.

**Pattern per parallax section:**

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

export function ParallaxSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.to(layerRef.current, {
      yPercent: -20,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,           // 1:1 with scroll position — pure positional
      },
    })
  }, { scope: containerRef })   // limits cleanup to this component's triggers only

  return (
    <div ref={containerRef} className="overflow-hidden">
      <div ref={layerRef}>content</div>
    </div>
  )
}
```

**`scrub: true`** ties animation position directly to scroll. `scrub: 1.5` adds 1.5-second lag for a springy feel. Use `scrub: true` for tight parallax, `scrub: 1.5` for inertia-feel depth.

**`{ scope: containerRef }`** on useGSAP limits cleanup to that component's ScrollTrigger instances. This is the critical Next.js App Router safety mechanism. Never use `ScrollTrigger.getAll().forEach(st => st.kill())` globally — it kills running ScrollTriggers from other mounted sections.

**After Lenis init:** Call `ScrollTrigger.refresh()` inside the `LenisProvider` `useGSAP` callback after wiring the ticker. Lenis changes how scroll position is calculated and ScrollTrigger needs to recalculate trigger positions after Lenis initializes.

**SSR safety:** All code inside `useGSAP` runs only after mount, client-side. With `'use client'` on the component, no SSR issues. Do NOT call `gsap` or `ScrollTrigger` at module level — they access `window` and `document`.

**Import path:** `import ScrollTrigger from 'gsap/ScrollTrigger'` — confirmed working from `gsap@3.14.2` package root. Do NOT use `gsap/dist/ScrollTrigger` — that bypasses module resolution.

### 3. Magnetic Button

**Approach:** `motion/react` spring physics. NOT GSAP.

**Rationale:** Motion already drives every other portfolio animation (AnimateIn, StaggerContainer, nav active indicator). Mixing GSAP `quickTo` for a single UI component adds a second animation system for one feature. Motion's `useMotionValue` + `useSpring` give spring physics without React re-renders, and integrate naturally with the existing `MotionConfig reducedMotion="user"` in `MotionProvider`.

Both `useMotionValue` and `useSpring` are confirmed available in `motion@12.34.2` from `motion/react` (verified by inspecting exported symbols from `motion/dist/cjs/react.js`).

**Pattern:**

```tsx
'use client'
import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react'

interface MagneticButtonProps {
  children: React.ReactNode
  strength?: number  // fraction of offset distance to follow; default 0.3
}

export function MagneticButton({ children, strength = 0.3 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 })
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength)
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  if (prefersReducedMotion) {
    return <div>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}
```

**Spring config:** `stiffness: 150, damping: 15, mass: 0.1`. The low mass (0.1) makes response feel near-instantaneous and cursor-following; damping 15 prevents oscillation on leave. These values come from the Olivier Larose magnetic button tutorial and are the community standard for this effect.

**`strength` parameter:** Controls displacement in pixels as a fraction of offset from center. 0.3 = subtle professional movement for hero CTAs. Reserve magnetic effect for 2-3 key CTAs only — applying it everywhere makes the site feel gimmicky.

**`useReducedMotion()` integration:** This hook reads from the existing `MotionConfig reducedMotion="user"` context in `MotionProvider`. When the OS requests reduced motion, the hook returns `true` and the component renders a plain div with zero animation overhead.

### 4. Matrix Color Extension

**No new libraries.** Extend existing `:root` CSS token block in `globals.css`.

**Current tokens (already in codebase):**
```css
--matrix-green: #00FF41;
--matrix-green-dim: #00CC33;
--matrix-green-ghost: #00FF4120;
```

**New tokens to add for v3.1:**
```css
/* Matrix color extension — v3.1 portfolio polish */
--matrix-green-subtle: #00FF410D;    /* ~5% opacity — section background tints */
--matrix-green-border: #00FF4133;    /* 20% opacity — card and section borders */
--matrix-scan-line: #00FF410A;       /* ~4% opacity — scanline overlay effect for footer */
--matrix-terminal: #0a1a0a;          /* near-black with green tint — deep section backgrounds */
```

**Token application by section:**
- Project cards: `border-color: var(--matrix-green-border)`, `background: var(--matrix-terminal)` within `.matrix-theme`
- Case study pages: `<hr>` dividers use `border-color: var(--matrix-green-dim)`
- Skills/About: skill badge outlines use `--matrix-green-border`, level indicators use `--matrix-green`
- Contact/CTA: primary CTA `background: var(--matrix-green)`, `color: #0a0a0a` (dark text on green)
- Footer: Matrix rain characters use `var(--matrix-green)` with transparency variation

**Contrast verification:** `--matrix-green` (#00FF41) on `#0a0a0a` background = ~12:1 contrast ratio, well above 4.5:1 WCAG AA. On interactive CTA: `#0a0a0a` text on `#00FF41` background = ~12:1. No purple introduced anywhere (user requirement).

**Light mode guard:** The existing `html:not(.dark) .matrix-theme` rule reverts to standard Radix tokens in light mode. New tokens inside `.matrix-theme` inherit this behavior — they only apply in dark mode without additional rules.

---

## Installation

No new installations required. All packages are already installed.

```bash
# Nothing to install — all packages already in apps/web/package.json:
# lenis@1.3.17, gsap@3.14.2, @gsap/react@2.1.2, motion@12.34.2
```

The one required "setup" is importing `lenis.css` in globals.css:

```css
/* apps/web/app/globals.css — add before @import "tailwindcss" */
@import "lenis/dist/lenis.css";
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `lenis/react` ReactLenis (root mode) | Vanilla Lenis + manual useEffect | If you need smooth scroll inside a specific scrollable div element rather than the document root. For a full-page portfolio, root mode is the right choice. |
| motion `useMotionValue` + `useSpring` for magnetic button | GSAP `quickTo` | Use GSAP quickTo when GSAP is already the sole animation system AND you need imperatively-controlled velocity. This codebase uses motion as primary, so stay consistent. |
| Per-component `useGSAP` with `{ scope }` | Global GSAP setup in singleton | Use singleton only when many components share one ScrollTrigger timeline. For discrete parallax sections, component scope is leak-free and correct. |
| CSS custom property tokens for Matrix extension | Tailwind utility classes via `@theme inline` | Add Matrix tokens to `@theme inline` only if you want Tailwind utility syntax (`bg-matrix-green`). For component-scoped style attributes and CSS rules, raw vars are simpler. |
| GSAP ScrollTrigger for parallax | motion `useScroll` + `useTransform` | Use motion's `useScroll` + `useTransform` if you want to avoid GSAP entirely. GSAP ScrollTrigger is more battle-tested for complex scrub animations and is already in the project — use what's installed. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@studio-freight/lenis` or `@studio-freight/react-lenis` | Deprecated. Package renamed to `lenis`. These are unmaintained and conflict with the current package. | `lenis` and `lenis/react` (already installed at 1.3.17) |
| `gsap/dist/ScrollTrigger` import path | Bypasses the package export map and may break in ESM module resolution contexts. | `import ScrollTrigger from 'gsap/ScrollTrigger'` — confirmed working from package root |
| `ScrollTrigger.getAll().forEach(st => st.kill())` | Kills every ScrollTrigger in the entire app. With multiple sections mounted simultaneously, this destroys running animations in other components. | Store component-specific trigger refs and kill only those, or let `useGSAP({ scope })` handle cleanup per component. |
| GSAP ScrollSmoother | Lenis is already installed and purpose-built for smooth scrolling. ScrollSmoother requires a specific DOM structure (wrapper + content divs) that conflicts with the existing portfolio layout structure. | `lenis` already installed |
| `framer-motion` package | This codebase uses `motion` (the renamed/split package). Both exist on npm but importing from `framer-motion` introduces a separate dependency with its own React peer requirements. On React 19, only `motion` is validated. | Always import from `motion/react` |
| `autoRaf: true` on ReactLenis when also using GSAP ScrollTrigger | Creates two competing RAF loops — Lenis's internal loop AND GSAP's ticker both try to drive animation. Results in jank and ScrollTrigger position drift. This is the single most common cause of Lenis + ScrollTrigger integration bugs. | `options={{ autoRaf: false }}` on ReactLenis + manual `gsap.ticker.add()` |
| GSAP calls at module level (outside useGSAP/useEffect) | GSAP accesses `window` and `document` on import side-effects. Next.js App Router SSR will throw `ReferenceError: window is not defined`. | All GSAP code must live inside `useGSAP` callback or `useEffect`, inside a `'use client'` component |
| `time * 600` in the GSAP ticker callback | Some older tutorials use `time * 600` — this is wrong. GSAP ticker passes time in seconds; Lenis.raf expects milliseconds. `time * 1000` is the correct conversion. | `lenis.raf(time * 1000)` |

---

## Stack Patterns by Variant

**If section has a large visual background (hero, footer):**
- Use GSAP ScrollTrigger parallax with `scrub: true`
- Keep `yPercent` range between -15 and -25 to avoid visible content gaps at section edges
- Wrap content in `overflow-hidden` container to clip overflowing parallax layer

**If section has primarily text content (about, skills, case study body):**
- Do NOT apply parallax to text — legibility suffers and text parallax is a known readability problem
- Use existing `AnimateIn` scroll-reveal (already implemented) — it is sufficient and correct for text sections

**If button is a primary CTA (hero CTAs, contact submit):**
- Wrap with `<MagneticButton strength={0.3}>` — subtle magnetic pull, professional feel
- Reserve magnetic for 2-3 key CTAs max — applying to every button feels gimmicky and dilutes the effect

**If reduced motion is preferred:**
- `useReducedMotion()` returns true — MagneticButton renders plain div, parallax sections render static
- Skip Lenis initialization entirely — check `matchMedia('(prefers-reduced-motion: reduce)').matches` before rendering `<ReactLenis>` wrapper
- The existing global CSS rule already handles CSS animations and `scroll-behavior: auto`

**If a section needs scroll-driven color change (footer fade-in):**
- Use `useLenis` hook to get scroll progress, update a CSS custom property via `style` prop
- Do NOT use GSAP for color — motion handles color better via `useTransform` on a MotionValue

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `lenis@1.3.17` | `react@19`, `next@15.1.0` | lenis/react dist ships with `"use client"` directive — SSR-safe. The `autoRaf` prop directly on ReactLenis is deprecated in 1.3.17; use `options={{ autoRaf: false }}` instead. |
| `gsap@3.14.2` + `@gsap/react@2.1.2` | `react@19`, `next@15.1.0` | `useGSAP` hook is required for React 19 — the old manual `useLayoutEffect` + cleanup pattern is not React 19 compatible. |
| `motion@12.34.2` | `react@19`, `next@15.1.0` | Already validated in v2.5. Import from `motion/react` exclusively. `useMotionValue` and `useSpring` confirmed present in dist/cjs/react.js. |
| `lenis@1.3.17` + `gsap/ScrollTrigger@3.14.2` | Together | Requires `options={{ autoRaf: false }}` on ReactLenis + `gsap.ticker.add((time) => lenis.raf(time * 1000))`. Without ticker wiring, ScrollTrigger loses sync with Lenis-smoothed scroll position. |
| `motion@12.34.2` + GSAP ScrollTrigger | Together (different responsibilities) | Motion handles spring-physics interactions (magnetic button, entrance animations). GSAP handles scroll-position-tied transforms (parallax). No conflict when kept in separate component trees. |

---

## Sources

- Direct `node_modules` inspection (`/node_modules/lenis/dist/lenis-react.d.ts`, `/node_modules/gsap/ScrollTrigger.js`, `/node_modules/motion/package.json`) — version numbers, import paths, TypeScript type definitions — HIGH confidence
- GSAP Community Forum: [Patterns for synchronizing ScrollTrigger and Lenis in React/Next](https://gsap.com/community/forums/topic/40426-patterns-for-synchronizing-scrolltrigger-and-lenis-in-reactnext/) — GSAP ticker integration, ReactLenis ref pattern — MEDIUM confidence (community, GSAP team contributor)
- GSAP Community Forum: [Using ScrollTriggers in Next.js with useGSAP](https://gsap.com/community/forums/topic/40128-using-scrolltriggers-in-nextjs-with-usegsap/) — scope pattern for Next.js App Router, per-component cleanup — MEDIUM confidence
- Olivier Larose tutorial: [2 Ways to Make a Magnetic Button](https://blog.olivierlarose.com/tutorials/magnetic-button) — spring config values (stiffness: 150, damping: 15, mass: 0.1) — MEDIUM confidence (widely cited creative dev tutorial)
- Bridger Tower: [How to implement Lenis in Next.js](https://bridger.to/lenis-nextjs) — Next.js App Router Lenis provider pattern with autoRaf — MEDIUM confidence
- Lenis GitHub README (darkroomengineering/lenis): `root` prop behavior, useLenis hook API, ReactLenis ref shape — HIGH confidence (official source)

---
*Stack research for: v3.1 Portfolio Polish — Lenis smooth scroll, GSAP ScrollTrigger parallax, magnetic buttons, Matrix theme extension*
*Researched: 2026-02-20*
