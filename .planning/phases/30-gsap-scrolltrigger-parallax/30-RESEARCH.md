# Phase 30: GSAP ScrollTrigger Parallax - Research

**Researched:** 2026-02-20
**Domain:** GSAP ScrollTrigger + Lenis ticker sync — parallax animations in Next.js 15 App Router with CLS-safe transforms only
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PRLLX-01 | User scrolling the hero section sees the hero text drift upward at a slower rate than page scroll (GSAP ScrollTrigger, yPercent: -15, scrub: 1) | `useGSAP` hook scoped to hero ref; `gsap.to(heroRef.current, { yPercent: -15, ease: 'none', scrollTrigger: { trigger, start, end, scrub: 1 } })` — transform-only, no layout change |
| PRLLX-02 | User scrolling past section separators sees decorative lines move at an independent depth (subtle scale/y transform, no layout shift) | Same `useGSAP` pattern with a separate `ParallaxDivider` component; `gsap.to(lineRef.current, { scaleX: 1.04, ease: 'none', scrollTrigger: { ... } })` or subtle `y` shift |
| PRLLX-03 | Lighthouse CI performance score remains >= 0.90 on all five portfolio URLs after parallax is added (no pin: true, transform-only properties) | `pin: true` is hard-blocked (CLS spacer); `transform` properties (`yPercent`, `scaleX`) do not trigger layout; `useGSAP` context auto-reverts on unmount avoiding orphan ticks; `gsap.ticker.lagSmoothing(0)` prevents timing spikes |
</phase_requirements>

---

## Summary

GSAP 3.14.2 and @gsap/react 2.1.2 are already installed in the project. ScrollTrigger is available at `gsap/ScrollTrigger` — no new packages are required for this phase. The phase has two implementation concerns: (1) switching LenisProvider from `autoRaf: true` to `autoRaf: false` and wiring `gsap.ticker.add` so that Lenis and ScrollTrigger share a single RAF loop without double-ticking, and (2) applying `useGSAP` + ScrollTrigger with `scrub: 1` and `yPercent`/transform-only props to the hero section and section divider elements.

The architecture constraint established in STATE.md and documented in Phase 29 research is now the active concern: `autoRaf: true` in LenisProvider must be switched to `autoRaf: false`, and `gsap.ticker.add((time) => lenis.raf(time * 1000))` plus `gsap.ticker.lagSmoothing(0)` must be added. This is the official Lenis + GSAP synchronization pattern from the Lenis README and GSAP community. Without this switch, both Lenis's internal RAF loop and GSAP's ticker drive Lenis on every frame, causing visible jitter.

The `useGSAP` hook from `@gsap/react` is the correct React integration point. It uses `useIsomorphicLayoutEffect` internally (safe for SSR), automatically creates a `gsap.context()` that reverts all animations and ScrollTrigger instances when the component unmounts, and prevents the stale-instance problem on route navigation without any manual `ScrollTrigger.getAll().forEach(st => st.kill())` calls. The `scope` parameter scopes selector text to a container ref for safety.

**Primary recommendation:** Three tasks — (1) update LenisProvider to `autoRaf: false` + ticker wiring inside the existing `useEffect`, (2) create a `useParallax` hook using `useGSAP` + ScrollTrigger for the hero text block, (3) apply a subtle parallax transform to section dividers via a thin `ParallaxDivider` client component. No new packages. No `pin: true` anywhere. Lighthouse CI gate at >=0.90 is the verification step.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| gsap | 3.14.2 (installed) | Animation engine + ScrollTrigger plugin | Already installed; ScrollTrigger is the project's locked choice (REQUIREMENTS.md: "GSAP ScrollTrigger") |
| gsap/ScrollTrigger | same package | Scroll-driven animation with scrub | Included in base `gsap` package at `gsap/ScrollTrigger` — no additional install |
| @gsap/react | 2.1.2 (installed) | `useGSAP` hook for React lifecycle integration | Official React wrapper; auto-reverts gsap.context on unmount — critical for Next.js App Router route changes |
| lenis | 1.3.17 (installed) | Smooth scroll engine; must sync with GSAP ticker | Phase 29 established; Phase 30 switches its RAF mode |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react `useRef` | React 19 (installed) | Provide DOM refs for GSAP animation targets | Required — `useGSAP` scope + trigger elements need refs |
| next/navigation `usePathname` | Next.js 15.1 (installed) | Not needed in parallax components directly | LenisProvider already uses it for scroll reset |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useGSAP` from @gsap/react | Raw `useLayoutEffect` + `gsap.context` | `useGSAP` IS the official React idiom; raw approach works but requires manual ctx.revert() on cleanup — more error-prone |
| `scrub: 1` (number = lag seconds) | `scrub: true` (instant scrub) | `scrub: 1` gives smooth 1-second lag between scroll and animation — feels more natural for depth parallax; `scrub: true` is too snappy |
| `yPercent` for parallax movement | `y` in pixels | `yPercent` scales relative to element height — consistent across viewport sizes; pixel `y` values are viewport-dependent |
| Section divider: `scaleX` subtle transform | `y` shift on the line | Both are transform-only; `scaleX` gives a breathing/depth effect; `y` shift at low amount (e.g., 8px) is also fine — either is CLS-safe |

**Installation:**
```bash
# No new packages required — gsap@3.14.2 and @gsap/react@2.1.2 already installed
# ScrollTrigger is bundled in the gsap package
```

---

## Architecture Patterns

### Recommended Project Structure
```
apps/web/
├── components/
│   └── portfolio/
│       ├── lenis-provider.tsx        # MODIFY: autoRaf: false + gsap.ticker wiring
│       ├── hero-section.tsx          # MODIFY: add ref + useGSAP parallax hook
│       └── parallax-divider.tsx      # NEW: thin 'use client' component with useGSAP + ScrollTrigger
```

### Pattern 1: LenisProvider — Switch to autoRaf: false + GSAP Ticker

**What:** Replace `autoRaf: true` in ReactLenis options with `autoRaf: false`, then register GSAP plugin and add Lenis to gsap.ticker inside a `useEffect` that runs after the Lenis instance is available.

**When to use:** This is the single change to LenisProvider that enables ScrollTrigger to function without double-RAF jitter.

**Constraint from STATE.md (already decided):** `autoRaf: false` on ReactLenis + `gsap.ticker.add((time) => lenis.raf(time * 1000))` — prevents double RAF loop jitter with GSAP ScrollTrigger.

```typescript
// Source: Lenis README (verified 2026-02-20) + STATE.md arch decision + GSAP community forum
// File: apps/web/components/portfolio/lenis-provider.tsx

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import ReactLenis, { useLenis } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Register plugins once at module level (safe — idempotent)
gsap.registerPlugin(ScrollTrigger, useGSAP)

function LenisScrollReset() {
  const pathname = usePathname()
  const lenis = useLenis()

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true, force: true })
    }
  }, [pathname, lenis])

  return null
}

// Ticker bridge: runs inside ReactLenis tree to access lenis instance
function LenisGSAPBridge() {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return

    // Sync lenis scroll events → ScrollTrigger position updates
    lenis.on('scroll', ScrollTrigger.update)

    // Drive Lenis via GSAP's RAF loop (not its own RAF)
    const tickerFn = (time: number) => { lenis.raf(time * 1000) }
    gsap.ticker.add(tickerFn)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.off('scroll', ScrollTrigger.update)
      gsap.ticker.remove(tickerFn)
    }
  }, [lenis])

  return null
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
  }, [])

  if (prefersReducedMotion) {
    return <>{children}</>
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        autoRaf: false,      // ← Phase 30: GSAP ticker drives Lenis now
        smoothWheel: true,
      }}
    >
      <LenisScrollReset />
      <LenisGSAPBridge />    {/* ← Phase 30: bridge must be inside ReactLenis tree */}
      {children}
    </ReactLenis>
  )
}
```

**Why inner component for the bridge:** `useLenis()` requires a `ReactLenis` ancestor. The bridge must live inside the ReactLenis tree to get the lenis instance. This is the same pattern already used for `LenisScrollReset`.

### Pattern 2: Hero Section Parallax (PRLLX-01)

**What:** Wrap the hero text content in a ref, use `useGSAP` to attach a ScrollTrigger with `scrub: 1` and `yPercent: -15`. The hero `<section>` is the trigger; the inner text `<div>` is the animated element.

**When to use:** `HeroSection` component needs to become `'use client'` if it isn't already. Add a ref to the text container div, add `useGSAP` hook.

```typescript
// Source: GSAP ScrollTrigger docs + @gsap/react README (verified from installed packages)
// File: apps/web/components/portfolio/hero-section.tsx

'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register once at module level
gsap.registerPlugin(ScrollTrigger)

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!textRef.current || !sectionRef.current) return

    gsap.to(textRef.current, {
      yPercent: -15,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        // NO pin: true — causes CLS spacer, fails Lighthouse CI
        // NO markers: true in production
      },
    })
  }, { scope: sectionRef })
  // useGSAP auto-reverts context (kills ScrollTrigger + tween) on unmount

  return (
    <section ref={sectionRef} className="relative bg-gradient-to-b from-background to-muted/30 py-24 md:py-32">
      <MatrixRainCanvas />
      <div ref={textRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* ... existing hero content unchanged ... */}
      </div>
    </section>
  )
}
```

**yPercent: -15 means:** when fully scrolled past the section, the text div has moved up 15% of its own height. With `scrub: 1`, this creates a smooth lag of 1 second behind the scroll position — readable as slower drift.

### Pattern 3: Section Divider Parallax (PRLLX-02)

**What:** A thin `ParallaxDivider` client component that renders a decorative line element and attaches a subtle scroll-driven transform using `useGSAP`. Portfolio pages insert this between major sections.

**When to use:** Between the hero section and featured projects section on the homepage, and between major sections on other pages.

```typescript
// Source: GSAP ScrollTrigger scrub pattern + project codebase context
// File: apps/web/components/portfolio/parallax-divider.tsx

'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface ParallaxDividerProps {
  className?: string
}

export function ParallaxDivider({ className }: ParallaxDividerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!lineRef.current || !containerRef.current) return

    gsap.fromTo(lineRef.current,
      { scaleX: 0.92 },
      {
        scaleX: 1.04,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 1,
        },
      }
    )
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className={`py-8 overflow-hidden ${className ?? ''}`}>
      <div
        ref={lineRef}
        className="h-px bg-primary/30 w-full origin-center"
        // transform-only: scaleX does not affect layout, CLS = 0
      />
    </div>
  )
}
```

**Note on `origin-center`:** `transform-origin: center` ensures scale expands equally left and right, preventing horizontal shift of the line endpoint.

### Pattern 4: Plugin Registration Strategy

**What:** Register `ScrollTrigger` and `useGSAP` once at module level, not inside hooks.

**When to use:** At the top of every file that uses these plugins.

```typescript
// Source: GSAP React docs — gsap.registerPlugin is idempotent
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Register at module level — safe to call multiple times (idempotent)
gsap.registerPlugin(ScrollTrigger, useGSAP)
```

**Why module-level:** `useGSAP` itself must be registered as a plugin. Doing it inside a hook body risks calling it post-SSR or on every render. Module-level registration happens once per module load.

### Pattern 5: Reduced-Motion Gate for GSAP Animations

**What:** The existing `MotionProvider` uses `MotionConfig reducedMotion="user"` which gates `motion/react` animations. GSAP does not respect this automatically. Gate `useGSAP` parallax animations with a `prefers-reduced-motion` check.

```typescript
// Source: project pattern (animate-in.tsx uses useReducedMotion from motion/react)
// For GSAP components: use matchMedia directly

useGSAP(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return  // skip GSAP animations entirely

  gsap.to(textRef.current, {
    yPercent: -15,
    ease: 'none',
    scrollTrigger: { /* ... */ },
  })
}, { scope: sectionRef })
```

**Alternative:** Use `gsap.matchMedia()` (GSAP 3.11+, included in 3.14.2) which is the GSAP-native way to conditionally apply animations based on media queries.

```typescript
// GSAP matchMedia approach (cleaner, GSAP-native)
useGSAP(() => {
  const mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.to(textRef.current, {
      yPercent: -15,
      ease: 'none',
      scrollTrigger: { trigger: sectionRef.current, scrub: 1 }
    })
  })
  return () => mm.revert()
}, { scope: sectionRef })
```

**Recommendation:** Use `gsap.matchMedia()` — it integrates with `gsap.context()` cleanup automatically and is the modern GSAP pattern.

### Anti-Patterns to Avoid

- **`pin: true` in any ScrollTrigger config:** Creates a spacer `<div>` that shifts layout (CLS). Explicitly blocked in STATE.md and REQUIREMENTS.md Out of Scope table. Never use it.
- **`ScrollTrigger.getAll().forEach(st => st.kill())` for cleanup:** Kills ALL instances globally, including those in sibling components still mounted. Use `useGSAP` context revert instead — it only kills instances created within that context.
- **Registering plugins inside `useGSAP` callback:** `gsap.registerPlugin` should be at module level, not inside the effect body. Module-level is idempotent and correct.
- **Animating `top`, `left`, `height`, `width`, `padding`, `margin` with ScrollTrigger:** All trigger layout/CLS. Only animate `transform` properties (`yPercent`, `y`, `xPercent`, `x`, `scale`, `scaleX`, `scaleY`, `rotation`).
- **`autoRaf: true` in LenisProvider after Phase 30:** Double RAF — Lenis runs its own loop AND GSAP ticks it. Causes scroll jitter. Must switch to `autoRaf: false`.
- **Not calling `gsap.ticker.lagSmoothing(0)`:** Without this, GSAP's lag smoothing can cause timing jumps between GSAP animations and Lenis's scroll position, creating a visible stutter on tab refocus or slow frames.
- **Skipping `lenis.off('scroll', ScrollTrigger.update)` in cleanup:** The event listener accumulates on re-render. Always remove in the useEffect cleanup return.
- **`gsap.ticker.remove` reference mismatch:** Store the ticker function in a variable (not inline) so the same reference can be removed. `gsap.ticker.remove(fn)` requires the exact same function reference used in `gsap.ticker.add(fn)`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll-synchronized parallax | `window.addEventListener('scroll', ...)` + manual transform | GSAP ScrollTrigger with `scrub` | ScrollTrigger handles start/end calculation, progress tracking, reverse on scroll-up, and integrates with Lenis's virtual scroll position |
| Animation cleanup on route change | `useEffect(() => { return () => killMyTweens() })` | `useGSAP` auto-context | `gsap.context()` tracks all animations + ScrollTrigger instances created in the callback and reverts them atomically on unmount |
| Media query breakpoint animations | Custom resize listener + manual animation toggle | `gsap.matchMedia()` | GSAP 3.11+ built-in; integrates with context cleanup; no listener leak |
| RAF synchronization between Lenis + GSAP | Custom `requestAnimationFrame` bridge | `gsap.ticker.add()` | GSAP ticker is already running; adding Lenis to it means one shared RAF loop — no double-tick |

**Key insight:** ScrollTrigger calculates scroll positions based on native scroll. When Lenis is active, native scroll IS the Lenis-managed position. The `lenis.on('scroll', ScrollTrigger.update)` call forces ScrollTrigger to re-read scroll position on every Lenis tick rather than waiting for its own internal update cycle.

---

## Common Pitfalls

### Pitfall 1: Double RAF Loop (autoRaf Not Switched)

**What goes wrong:** LenisProvider still has `autoRaf: true` after Phase 30 wires `gsap.ticker.add`. Lenis's internal `requestAnimationFrame` loop runs, AND GSAP's ticker calls `lenis.raf()` on every tick. This means `lenis.raf()` fires twice per frame — scroll position updates are doubled, causing visible jitter and over-shooting on the parallax elements.

**Why it happens:** Phase 29 was shipped with `autoRaf: true` (correct for Phase 29, no GSAP). Phase 30 adds the ticker. If the options are not updated, both loops coexist.

**How to avoid:** The first task of Phase 30 must update `options={{ autoRaf: false }}` in the `ReactLenis` component in `lenis-provider.tsx` and simultaneously add the `LenisGSAPBridge` inner component.

**Warning signs:** Hero text parallax moves at double speed on scroll; scroll feels "springy" or overshoots.

### Pitfall 2: gsap.ticker.remove Reference Mismatch

**What goes wrong:** The ticker function is defined inline in the `useEffect` body:
```typescript
// WRONG:
gsap.ticker.add((time) => lenis.raf(time * 1000))
return () => gsap.ticker.remove((time) => lenis.raf(time * 1000))  // different function reference
```
The `remove` call does nothing because it receives a different function reference. The ticker accumulates on every re-render.

**Why it happens:** Arrow functions create new objects each time they're evaluated. `gsap.ticker.remove` needs the exact same reference passed to `add`.

**How to avoid:** Store in a named variable:
```typescript
const tickerFn = (time: number) => { lenis.raf(time * 1000) }
gsap.ticker.add(tickerFn)
return () => { gsap.ticker.remove(tickerFn) }
```

**Warning signs:** Memory leak; performance degrades over time as ticker functions accumulate; scroll gets progressively slower/faster.

### Pitfall 3: ScrollTrigger Stale Instances on Navigation

**What goes wrong:** A component with a ScrollTrigger is unmounted (user navigates away). If cleanup is not done, the ScrollTrigger instance survives and fires callbacks for a trigger element that no longer exists in the DOM. When user returns to the page, a new ScrollTrigger is created, but the old one is still running — two instances drive the same animation.

**Why it happens:** Raw `useEffect` + GSAP without context doesn't auto-revert. The effect cleanup function must explicitly call `tween.kill()` and `st.kill()` or `ctx.revert()`.

**How to avoid:** Use `useGSAP` — it wraps the callback in `gsap.context()` and calls `ctx.revert()` on unmount, which kills all tweens and ScrollTrigger instances registered within it. This is automatic — no manual kill needed.

**Warning signs:** After navigating away and back, parallax animation fires from wrong starting position; CLS spike on page return; console warning about ScrollTrigger instances.

### Pitfall 4: Animating Non-Transform Properties (CLS)

**What goes wrong:** Using `top`, `marginTop`, `paddingTop`, `height`, or any layout-affecting property in a ScrollTrigger animation. This causes the browser to re-layout on every scroll frame, producing CLS events and Lighthouse performance regression.

**Why it happens:** CSS `transform` properties (`translate`, `scale`, `rotate`) are composited on the GPU and do not trigger layout. Properties that affect box model DO trigger layout.

**How to avoid:** Only use `yPercent`, `y`, `xPercent`, `x`, `scale`, `scaleX`, `scaleY`, `rotation`, `opacity` in ScrollTrigger animations. Verify with Lighthouse CLS metric = 0 after implementation.

**Warning signs:** Lighthouse CLS > 0; sections below hero shift down/up during scroll.

### Pitfall 5: Plugin Registration in SSR Context

**What goes wrong:** `gsap.registerPlugin(ScrollTrigger)` runs on the server during SSR. GSAP is browser-only — ScrollTrigger tries to access `window` and `document`.

**Why it happens:** Next.js renders `'use client'` components on the server for hydration. The `'use client'` directive does not prevent module-level code from running server-side.

**How to avoid:** GSAP 3.x is smart about SSR — `gsap.registerPlugin` at module level in a `'use client'` file is generally safe because GSAP detects the absence of `window` and no-ops in SSR. However, `useGSAP` uses `useIsomorphicLayoutEffect` internally, which safely falls back to `useEffect` when `window` is not defined. No special guard is needed beyond using `'use client'` on animation components.

**Warning signs:** `window is not defined` error in build output; only if using raw `useLayoutEffect` instead of `useGSAP`.

### Pitfall 6: Hero Text Overflows Clip Region on Fast Scroll

**What goes wrong:** With `yPercent: -15` and the section's `overflow: visible` (default), the hero text drifts upward and visually escapes the section boundary at large scroll distances.

**Why it happens:** `yPercent: -15` moves the text element; if the parent `<section>` doesn't clip, the overflowed text is visible above the section boundary while the next section scrolls in.

**How to avoid:** Add `overflow: hidden` to the hero `<section>` element — this clips the drifting text to the section bounds. Verify visually: the text should drift upward and gracefully disappear into the section's top edge, not float over the nav.

**Warning signs:** Hero text overlaps nav during scroll; text visible above the section boundary.

---

## Code Examples

Verified patterns from installed packages and official sources:

### Full LenisProvider with GSAP Ticker Bridge (Phase 30 version)

```typescript
// Source: Lenis README pattern + @gsap/react README + project codebase
// File: apps/web/components/portfolio/lenis-provider.tsx

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import ReactLenis, { useLenis } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

function LenisScrollReset() {
  const pathname = usePathname()
  const lenis = useLenis()
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  }, [pathname, lenis])
  return null
}

function LenisGSAPBridge() {
  const lenis = useLenis()
  useEffect(() => {
    if (!lenis) return
    lenis.on('scroll', ScrollTrigger.update)
    const tickerFn = (time: number) => { lenis.raf(time * 1000) }
    gsap.ticker.add(tickerFn)
    gsap.ticker.lagSmoothing(0)
    return () => {
      lenis.off('scroll', ScrollTrigger.update)
      gsap.ticker.remove(tickerFn)
    }
  }, [lenis])
  return null
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
  }, [])

  if (prefersReducedMotion) return <>{children}</>

  return (
    <ReactLenis root options={{ lerp: 0.1, autoRaf: false, smoothWheel: true }}>
      <LenisScrollReset />
      <LenisGSAPBridge />
      {children}
    </ReactLenis>
  )
}
```

### Hero Parallax with useGSAP (PRLLX-01)

```typescript
// Source: GSAP ScrollTrigger Vars interface (scroll-trigger.d.ts) + @gsap/react README
// yPercent: -15 with scrub: 1 produces depth parallax

'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

// Inside HeroSection component:
const sectionRef = useRef<HTMLElement>(null)
const textRef = useRef<HTMLDivElement>(null)

useGSAP(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion || !textRef.current || !sectionRef.current) return

  gsap.to(textRef.current, {
    yPercent: -15,
    ease: 'none',
    scrollTrigger: {
      trigger: sectionRef.current,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
      // pin: false (default) — never use pin: true
      invalidateOnRefresh: true,  // recalculate on viewport resize
    },
  })
}, { scope: sectionRef })
// Auto-cleanup: useGSAP reverts context (kills tween + ScrollTrigger) on unmount
```

### ParallaxDivider Component (PRLLX-02)

```typescript
// Source: GSAP ScrollTrigger + project pattern for 'use client' components

'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

export function ParallaxDivider({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || !lineRef.current || !containerRef.current) return

    gsap.fromTo(lineRef.current,
      { scaleX: 0.92 },
      {
        scaleX: 1.04,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 1,
          invalidateOnRefresh: true,
        },
      }
    )
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className={`py-8 overflow-hidden ${className ?? ''}`}>
      <div ref={lineRef} className="h-px bg-primary/30 w-full origin-center" />
    </div>
  )
}
```

### ScrollTrigger Key Vars Reference (from scroll-trigger.d.ts)

```typescript
// Confirmed from installed /node_modules/gsap/types/scroll-trigger.d.ts

interface Vars {
  trigger?: gsap.DOMTarget         // element that triggers the animation
  start?: string | number          // e.g. 'top top', 'top 80%'
  end?: string | number            // e.g. 'bottom top', 'bottom 20%'
  scrub?: boolean | number         // true = instant scrub; number = lag in seconds (1 = 1s lag)
  pin?: boolean | gsap.DOMTarget   // NEVER use — causes CLS spacer
  markers?: boolean                // debug only — remove before production
  invalidateOnRefresh?: boolean    // recalculate start/end on viewport resize
  once?: boolean                   // fire only once (for non-parallax reveal animations)
  onEnter?: Callback
  onLeave?: Callback
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useEffect` + manual `gsap.context` + manual `ctx.revert()` | `useGSAP` from @gsap/react | @gsap/react 2.0 (2024) | Auto-cleanup, SSR-safe `useIsomorphicLayoutEffect`, scope support |
| `ScrollTrigger.matchMedia()` | `gsap.matchMedia()` | GSAP 3.11 (2022) | `ScrollTrigger.matchMedia` is deprecated; `gsap.matchMedia()` is the current API |
| `locomotive-scroll` proxy pattern for third-party scrollers | Direct `lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker` | Lenis 1.x (2023+) | Lenis no longer requires scrollerProxy — direct sync via ticker is simpler and official |
| `pin: true` for parallax depth effect | `yPercent` / `scaleX` transform-only | N/A (always was wrong) | `pin: true` causes CLS; transform-only achieves depth without layout shift |
| `ScrollTrigger.getAll().forEach(st => st.kill())` | `useGSAP` auto-context revert | @gsap/react 2.0 | Global kill affects all components; context revert is scoped |

**Deprecated/outdated:**
- `ScrollTrigger.matchMedia()`: Deprecated since GSAP 3.11.0. Use `gsap.matchMedia()` instead.
- `scrollerProxy` pattern for Lenis: No longer needed. Modern Lenis integrates directly via `lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker.add`.
- `autoRaf: true` as ReactLenis prop at top level (not in options): Deprecated. Use `options={{ autoRaf: false }}`.

---

## Open Questions

1. **Should gsap.registerPlugin run in LenisProvider or in each component?**
   - What we know: `registerPlugin` is idempotent — calling it multiple times is safe. Running it at module level in each file that uses the plugin is the documented approach (@gsap/react README).
   - What's unclear: Whether registering in both `lenis-provider.tsx` AND `hero-section.tsx` causes any issue.
   - Recommendation: Register in every file that imports the plugin. Idempotency guarantees no double-registration side effects. This is the official GSAP recommendation.

2. **Does Lenis `lenis.off('scroll', ScrollTrigger.update)` require exact reference matching?**
   - What we know: `lenis.off` is an EventEmitter-style API. It requires the same function reference passed to `lenis.on`. `ScrollTrigger.update` is a static method — its reference is stable.
   - What's unclear: Whether `ScrollTrigger.update` is reassigned between module loads in development hot reload.
   - Recommendation: `ScrollTrigger.update` is a stable static method. The pattern `lenis.on('scroll', ScrollTrigger.update)` / `lenis.off('scroll', ScrollTrigger.update)` is confirmed correct from the Lenis README and GSAP community.

3. **Hero section `overflow: hidden` visual impact on MatrixRainCanvas**
   - What we know: `HeroSection` renders a `MatrixRainCanvas` as a sibling to the text div. The canvas fills the section background. Adding `overflow: hidden` to the `<section>` clips both.
   - What's unclear: Whether the canvas extends beyond the section bounds (it uses `position: absolute` — it may not).
   - Recommendation: Inspect `MatrixRainCanvas` positioning during plan execution. If canvas is `position: absolute; inset: 0`, adding `overflow: hidden` to the parent `<section>` is harmless. If canvas bleeds, apply `overflow: hidden` only to the text wrapper div instead.

4. **invalidateOnRefresh: should it be used?**
   - What we know: `invalidateOnRefresh: true` tells ScrollTrigger to invalidate its start/end calculations on each `ScrollTrigger.refresh()` call (which fires on window resize). This is essential when the element's natural dimensions change on resize (e.g. when font sizes or section padding changes).
   - What's unclear: Performance cost on frequent resizes.
   - Recommendation: Use `invalidateOnRefresh: true` on both the hero and divider ScrollTriggers. The calculation overhead is negligible compared to the correctness benefit (wrong start/end positions on resize cause visible glitches).

---

## Sources

### Primary (HIGH confidence)

- Installed TypeScript declarations: `/home/doctor/fernandomillan/node_modules/gsap/types/scroll-trigger.d.ts` — `Vars` interface (scrub, trigger, start, end, pin, invalidateOnRefresh), static methods (update, getAll, kill, refresh)
- Installed package source: `/home/doctor/fernandomillan/node_modules/@gsap/react/dist/index.js` — confirmed `useGSAP` wraps `useIsomorphicLayoutEffect`, uses `gsap.context()` for cleanup
- Installed TypeScript declarations: `/home/doctor/fernandomillan/node_modules/@gsap/react/types/index.d.ts` — `useGSAP(func, config)` signature, `scope`, `dependencies`, `revertOnUpdate`
- Installed `@gsap/react/README.md` — `useGSAP` usage patterns, `contextSafe`, context-based cleanup, "all GSAP animations, ScrollTriggers, Draggables reverted automatically on unmount"
- Project codebase: `apps/web/components/portfolio/lenis-provider.tsx` — existing `autoRaf: true` comment "Phase 30 will switch to autoRaf: false + gsap.ticker"
- Project codebase: `apps/web/components/portfolio/hero-section.tsx` — current structure (section + MatrixRainCanvas + text div), currently not 'use client' (will need to add)
- Project STATE.md decisions: `autoRaf: false` + `gsap.ticker.add` arch decision, `No pin: true` constraint, `v3.1 arch` decisions

### Secondary (MEDIUM confidence)

- [Lenis GitHub README](https://github.com/darkroomengineering/lenis) — official GSAP integration pattern: `lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker.add((time) => lenis.raf(time * 1000))` + `lagSmoothing(0)`
- [Lenis GitHub Discussion #366](https://github.com/darkroomengineering/lenis/discussions/366) — confirmed ticker pattern (not custom RAF), `gsap.ticker.lagSmoothing(0)` required
- [GSAP React resources page](https://gsap.com/resources/React) — "All GSAP animations, ScrollTriggers, Draggables, and SplitText instances created when the useGSAP() hook executes will be reverted automatically when the component unmounts"
- [GSAP community forum — ScrollTrigger in Next.js](https://gsap.com/community/forums/topic/40128-using-scrolltriggers-in-nextjs-with-usegsap/) — `useGSAP` with scoped context is the recommended approach; global `getAll().forEach(kill)` is explicitly discouraged

### Tertiary (LOW confidence)

- [GSAP community forum — Lenis + ScrollTrigger sync patterns](https://gsap.com/community/forums/topic/40426-patterns-for-synchronizing-scrolltrigger-and-lenis-in-reactnext/) — notes ReactLenis wrapper may add mobile lag; recommends vanilla Lenis class in some cases; LOW confidence for this project since ReactLenis is established in Phase 29 and changing it would break SCROLL-02/04

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed; versions confirmed from node_modules; ScrollTrigger.d.ts and @gsap/react types verified from installed files
- Architecture (ticker sync): HIGH — pattern confirmed from Lenis README + GSAP community + STATE.md pre-decision; inner component pattern mirrors existing LenisScrollReset already in codebase
- Architecture (useGSAP cleanup): HIGH — @gsap/react README and types explicitly state auto-revert on unmount; confirmed from installed index.js source
- Pitfalls: HIGH for double-RAF and reference mismatch (verified code patterns); MEDIUM for SSR plugin registration (GSAP claims SSR safety but not tested live in this project)
- Lighthouse CI: HIGH — `pin: true` CLS causation is well-documented + established project constraint; transform-only properties confirmed CLS-safe from web platform spec

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (GSAP 3.14.x is stable; lenis 1.3.x is stable; 30-day window appropriate)
