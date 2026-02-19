# Phase 25: Personality Effects - Research

**Researched:** 2026-02-19
**Domain:** Text scramble animation, Evervault-style noise decryption hover, CSS dot-grid + mouse-following spotlight
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FX-01 | Hero name text scrambles from noise characters to readable text on page load — fires exactly once, never loops | `use-scramble` hook with `playOnMount: true` (default), fires once then stops; `onAnimationEnd` callback confirms resolution; `useReducedMotion` guard skips entire effect |
| FX-03 | Project cards reveal an Evervault-style noise decryption effect on hover — uses installed `motion` v12, no new dependency | `useMotionValue` + `useMotionTemplate` (already in installed framer-motion 12.34.2) for mouse-relative radial-gradient mask; random char string regenerated on `onMouseMove` — no dependency needed beyond `motion` |
| FX-04 | Portfolio pages show a dark dot grid background with a green spotlight that follows the mouse cursor — built as a paired unit | CSS radial-gradient dot grid + CSS custom properties driven by `mousemove` event listener; `@media (any-hover: none)` hides spotlight; `pointer-events: none` on overlay prevents blocking |
</phase_requirements>

---

## Summary

Phase 25 adds three distinct personality effects to the portfolio. Each effect has a clear, self-contained implementation strategy using tools already in the stack.

**FX-01 (hero scramble):** The `use-scramble` npm package (1 KB, TypeScript, respects `prefers-reduced-motion`) provides a `useScramble` hook that fires once on mount by default, stops when the target text resolves, and exposes `onAnimationEnd` — exactly matching the "fires once, never loops" requirement. This is a new dependency but it is tiny (1 KB) and the requirement says "no new dependency" only for FX-03. The alternative is a hand-rolled RAF-based hook, which is approximately the same code size but requires own maintenance. `use-scramble` is the standard choice. **Key constraint: requirement FX-03 explicitly bans new deps; FX-01 does not.** Therefore `use-scramble` is acceptable for FX-01 only if the team agrees. The hand-rolled fallback is documented in Code Examples.

**FX-03 (card noise decryption):** The Evervault effect is pure React + CSS — no library beyond what is already installed. `useMotionValue` and `useMotionTemplate` from `motion/react` (framer-motion 12.34.2 — VERIFIED present in installed package) drive a radial-gradient mask that tracks the mouse inside the card boundary. A random string of ~1500 characters regenerates on each `mousemove` event. The mask reveals the noise characters through the gradient spotlight. On `mouseLeave`, the random string disappears. Motion+ `ScrambleText` component is NOT used — it is a paid feature not included in the free motion package.

**FX-04 (dot grid + spotlight):** The dot-grid background is pure CSS using two `radial-gradient` repeating patterns offset by half a step, producing a dot array. The green spotlight is a fixed `div` positioned via CSS custom properties (`--cursor-x`, `--cursor-y`) updated by a single `mousemove` listener on `document`. Touch/coarse-pointer devices: CSS `@media (any-hover: none)` hides the spotlight element completely. The component renders in the portfolio `layout.tsx` so it covers all five portfolio URLs.

**Primary recommendation:** Build three thin `'use client'` components — `ScrambleHero`, `EvervaultCard` (wrapping the existing `ProjectCard` or as a standalone wrapper), and `DotGridSpotlight` — following the existing pattern in `animate-in.tsx` and `stagger-container.tsx`. Add `DotGridSpotlight` to `(portfolio)/layout.tsx`. Use `use-scramble` for FX-01 (or the hand-rolled hook if no new deps is required). Use `useMotionValue` + `useMotionTemplate` for FX-03. Use CSS + one event listener for FX-04.

---

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `motion` (framer-motion) | 12.34.2 | `useMotionValue`, `useMotionTemplate`, `useReducedMotion` for FX-03 | Already installed; `useMotionValue`/`useMotionTemplate` VERIFIED present in dist |
| `motion/react` | (same package, `/react` export) | React-specific import path for all motion hooks | Official entry point used across existing portfolio components |

### New Dependency (FX-01 only)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `use-scramble` | 2.x (latest) | Hero name scramble hook with `playOnMount`, `onAnimationEnd`, reduced-motion support | 1 KB, 96% TypeScript, respects `prefers-reduced-motion`, no transitive deps |

**If no new dependency is permitted for FX-01:** Use the hand-rolled hook in Code Examples section below. It is ~30 lines of `useEffect` + `useRef`.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `use-scramble` | GSAP ScrambleText plugin | GSAP already installed but ScrambleText is a paid Club GSAP plugin |
| `use-scramble` | motion ScrambleText | Motion+ exclusive (paid) — not in installed framer-motion 12.34.2 |
| `use-scramble` | Hand-rolled RAF hook | No dependency, same size, full control — acceptable alternative |
| CSS custom props for spotlight | `useMotionValue` for FX-04 | CSS custom props + `mousemove` is simpler, no React re-render |

**Installation (if use-scramble permitted):**
```bash
npm install use-scramble --workspace=apps/web
```

---

## Architecture Patterns

### Recommended File Structure

```
apps/web/
├── components/
│   └── portfolio/
│       ├── scramble-hero.tsx          # NEW: FX-01 — 'use client', wraps hero h1 text
│       ├── evervault-card.tsx         # NEW: FX-03 — 'use client', noise decryption wrapper
│       ├── dot-grid-spotlight.tsx     # NEW: FX-04 — 'use client', full-page overlay component
│       ├── hero-section.tsx           # MODIFY: import ScrambleHero, replace plain text span
│       ├── project-card.tsx           # MODIFY: wrap title in EvervaultCard OR leave unchanged
│       └── motion-provider.tsx        # UNCHANGED: MotionConfig reducedMotion="user" still active
└── app/
    └── (portfolio)/
        ├── layout.tsx                 # MODIFY: add <DotGridSpotlight /> as sibling to <main>
        └── page.tsx                   # Project cards are here — use EvervaultCard wrapper
```

### Pattern 1: FX-01 — Hero Name Scramble (using use-scramble)

**What:** On mount, the hero h1 "Fernando Millan" cycles through random Unicode characters before resolving to the correct text. Fires exactly once.

**Key properties:** `playOnMount: true` (default) — animation starts immediately on mount; `speed: 0.6`, `scramble: 4`, `seed: 3` for a natural scramble cadence; `range: [33, 126]` for visible ASCII noise; `onAnimationEnd` can be used to set `aria-live` back to polite.

```typescript
// apps/web/components/portfolio/scramble-hero.tsx
// Source: https://github.com/tol-is/use-scramble
'use client'

import { useScramble } from 'use-scramble'
import { useReducedMotion } from 'motion/react'

interface ScrambleHeroProps {
  text: string
  className?: string
}

export function ScrambleHero({ text, className }: ScrambleHeroProps) {
  const prefersReducedMotion = useReducedMotion()

  const { ref } = useScramble({
    text,
    playOnMount: !prefersReducedMotion,  // skip scramble entirely if reduced motion
    speed: 0.6,
    tick: 1,
    step: 1,
    scramble: 4,
    seed: 3,
    range: [33, 126],
    overdrive: false,   // no trailing underscore placeholder
  })

  // If reduced motion, render text directly without ref trick
  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>
  }

  return (
    // use-scramble writes directly to the DOM node via ref
    // The element starts empty and resolves to `text` when animation ends
    <span ref={ref} className={className} aria-label={text} />
  )
}
```

### Pattern 2: FX-01 — Hand-Rolled Scramble Hook (no new dep fallback)

**What:** If no new dependency is permitted, this 30-line hook replicates the core behavior using `useEffect` + `requestAnimationFrame`.

```typescript
// apps/web/hooks/use-text-scramble.ts
'use client'

import { useEffect, useRef, useState } from 'react'

// Visible ASCII range: 33–126
const CHARS = Array.from({ length: 94 }, (_, i) => String.fromCharCode(i + 33)).join('')

export function useTextScramble(target: string, enabled = true) {
  const [display, setDisplay] = useState('')
  const frameRef = useRef<number>(0)
  const iterRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setDisplay(target)
      return
    }

    iterRef.current = 0

    const totalFrames = target.length * 6  // ~6 frames per character

    function step() {
      const progress = iterRef.current / totalFrames
      const resolved = Math.floor(progress * target.length)

      const output = target
        .split('')
        .map((char, i) => {
          if (i < resolved) return char
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join('')

      setDisplay(output)
      iterRef.current++

      if (iterRef.current <= totalFrames) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        setDisplay(target)  // guarantee exact final text
      }
    }

    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, enabled])

  return display
}
```

### Pattern 3: FX-03 — Evervault Noise Decryption (motion v12, no new dep)

**What:** On card hover, a radial-gradient mask follows the mouse and reveals a layer of random noise characters beneath the card title. Moving away hides the noise layer.

**Key insight:** `useMotionValue` + `useMotionTemplate` operate outside React's render cycle — `mousemove` updates are NOT re-renders. The random string IS regenerated on each `mousemove` with `useState`/`useCallback` — this is intentional (the noise must change). The gradient mask is applied via `motion.div` `style` prop using `useMotionTemplate`.

```typescript
// apps/web/components/portfolio/evervault-card.tsx
// Pattern derived from: https://gist.github.com/Patil-143/facf72906eb1839b9f20dd800be7b740
// and https://ui.aceternity.com/components/evervault-card
'use client'

import { useState, useCallback } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react'

// Use matrix-green themed characters — alphanumeric + katakana subset
const NOISE_CHARS = 'ｦｧｨｩｯｱｲｳｴｵ0123456789ABCDEF<>[]{}|/\\^~'
const NOISE_LENGTH = 1500

function randomNoise() {
  return Array.from(
    { length: NOISE_LENGTH },
    () => NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)]
  ).join('')
}

interface EvervaultCardProps {
  children: React.ReactNode
  className?: string
}

export function EvervaultCard({ children, className }: EvervaultCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [noise, setNoise] = useState('')
  const [isHovered, setIsHovered] = useState(false)

  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
    setNoise(randomNoise())
  }, [mouseX, mouseY])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    setNoise(randomNoise())
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setNoise('')
  }, [])

  // Reduced motion: skip entirely, render children as-is
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={`relative overflow-hidden ${className ?? ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Noise layer — masked by radial gradient following cursor */}
      {isHovered && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 font-mono text-[10px] leading-[1] text-[var(--matrix-green)] opacity-60 break-all overflow-hidden"
          style={{ maskImage, WebkitMaskImage: maskImage }}
          aria-hidden="true"
        >
          {noise}
        </motion.div>
      )}
      {children}
    </div>
  )
}
```

**Integration:** Wrap `ProjectCard` usages in `/projects/page.tsx` and `/app/(portfolio)/page.tsx` with `<EvervaultCard>`. Or accept the wrapper inside `ProjectCard` itself by making it a client component.

### Pattern 4: FX-04 — Dot Grid + Green Spotlight

**What:** A fixed overlay div covers the entire viewport. It has a dot-grid background (CSS only). A second child div renders a radial green spotlight at the cursor position. CSS custom properties `--cursor-x` and `--cursor-y` are updated by a single `mousemove` listener on the document. Hidden on touch/coarse-pointer devices.

**Key insight:** The overlay must NOT capture pointer events — `pointer-events: none` is mandatory. The spotlight should be `position: fixed` and stay in the background (`z-index: -1` or behind content layers). Using CSS custom properties instead of React state means zero re-renders per mousemove.

```typescript
// apps/web/components/portfolio/dot-grid-spotlight.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'

export function DotGridSpotlight() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) return

    // Check for hover capability at runtime (belt-and-suspenders with CSS media query)
    const canHover = window.matchMedia('(any-hover: hover)').matches
    if (!canHover) return

    const el = containerRef.current
    if (!el) return

    function onMouseMove(e: MouseEvent) {
      el!.style.setProperty('--cursor-x', `${e.clientX}px`)
      el!.style.setProperty('--cursor-y', `${e.clientY}px`)
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => document.removeEventListener('mousemove', onMouseMove)
  }, [prefersReducedMotion])

  if (prefersReducedMotion) return null

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="dot-grid-spotlight"
      style={
        {
          '--cursor-x': '-9999px',
          '--cursor-y': '-9999px',
        } as React.CSSProperties
      }
    />
  )
}
```

**Required CSS in `globals.css`:**

```css
/* FX-04: Dot grid background with green spotlight cursor */
/* Hidden entirely on touch / coarse-pointer / no-hover devices */
@media (any-hover: hover) {
  .dot-grid-spotlight {
    position: fixed;
    inset: 0;
    z-index: 0;               /* behind content (content is z-10+), above raw background */
    pointer-events: none;
    /* Dot grid: two offset radial-gradient repeating patterns */
    background-image:
      radial-gradient(
        circle 250px at var(--cursor-x, -9999px) var(--cursor-y, -9999px),
        var(--matrix-green-ghost),
        transparent 80%
      ),
      radial-gradient(circle, var(--matrix-green-dim) 1px, transparent 1px),
      radial-gradient(circle, var(--matrix-green-dim) 1px, transparent 1px);
    background-size:
      100% 100%,
      28px 28px,
      28px 28px;
    background-position:
      0 0,
      0 0,
      14px 14px;
    opacity: 0.12;             /* subtle — not distracting */
  }
}
```

**Layout integration:**
```tsx
// apps/web/app/(portfolio)/layout.tsx
import { DotGridSpotlight } from '@/components/portfolio/dot-grid-spotlight'

export default function PortfolioLayout({ children }) {
  return (
    <div className="matrix-theme min-h-screen flex flex-col">
      <DotGridSpotlight />   {/* renders behind everything, pointer-events: none */}
      <PortfolioNav />
      <MotionProvider><main className="flex-1">{children}</main></MotionProvider>
      <PortfolioFooter />
      <CommandPalette />
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Using React state for cursor X/Y:** Each `mousemove` event would trigger a re-render. Use CSS custom properties set via `element.style.setProperty` or `useMotionValue` (which bypasses the React render cycle) instead.
- **Calling `requestAnimationFrame` from within `useState` setter:** Can cause layout thrash. The hand-rolled scramble hook uses `requestAnimationFrame` directly and calls `setDisplay` only once per frame.
- **Attaching `mousemove` to `window` without `{ passive: true }`:** Blocks scrolling performance. Always use `{ passive: true }` for mouse/touch move listeners.
- **Rendering `DotGridSpotlight` in a Server Component:** It uses `useEffect` and is `'use client'`. The layout already has `MotionProvider` as client — add alongside it.
- **Looping the scramble effect:** `use-scramble` with `playOnMount: true` fires exactly once by design. Do NOT call `replay()` after `onAnimationEnd`. For hover (FX-03), the Evervault effect clears on `mouseLeave` — it does NOT loop.
- **Using `pointer: coarse` instead of `any-hover: none`:** `pointer: coarse` only checks the primary input; on a hybrid laptop with touch AND mouse, it may return `coarse` even though hover is available. The requirement says "pointer: coarse OR any-hover: none" — use `@media (any-hover: none)` as the CSS guard, which correctly disables spotlight on any-hover-incapable device.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scramble text animation | Custom RAF loop with character cycling | `use-scramble` hook | Handles reduced-motion, TypeScript, timing edge cases, cleanup |
| Mouse-position-reactive CSS | `setState` on mousemove → re-render | CSS custom properties via `style.setProperty` | Zero React renders per frame; exactly what the existing `matrix-rain-canvas.tsx` does |
| Gradient masking | Custom canvas or SVG mask | CSS `mask-image` + `useMotionTemplate` | Native browser, GPU-accelerated, no dependency |

**Key insight:** The Evervault effect's "noise layer" is NOT an animation in the motion/react sense — it's a static noise string regenerated on each `mousemove` event, masked by a CSS gradient. The only motion library feature used is `useMotionTemplate` to bind the mask to motion values efficiently.

---

## Common Pitfalls

### Pitfall 1: Scramble Effect Re-Fires on Navigation

**What goes wrong:** Next.js App Router preserves layout components across client navigations. If `DotGridSpotlight` and `ScrambleHero` are inside the portfolio `layout.tsx` and their parent component does NOT unmount, the scramble effect will not re-fire on page navigation — because the component stays mounted.

**Why it happens:** `HeroSection` is in the root `page.tsx`, not `layout.tsx` — it DOES unmount on navigation. The scramble `useEffect` with `[]` deps fires on mount. Navigating away and back unmounts and remounts the hero page, retriggering the scramble. This is the CORRECT behavior matching SC-1.

**How to avoid:** Keep `ScrambleHero` inside `page.tsx` hierarchy (not `layout.tsx`) — it is already there via `HeroSection`. Do not hoist it into the layout.

**Warning signs:** If scramble fires on every page but the hero is not on every page, the component was placed in `layout.tsx` by mistake.

### Pitfall 2: Evervault Noise Layer Blocks Card Clicks

**What goes wrong:** The noise overlay div sits above the card content. If `pointer-events` is not `none`, hover interaction works but clicks are captured by the noise div, preventing navigation.

**Why it happens:** Default `pointer-events` on positioned divs is `auto`.

**How to avoid:** Always set `pointer-events: none` (or Tailwind `pointer-events-none`) on the noise overlay div. The `onMouseMove`, `onMouseEnter`, `onMouseLeave` handlers belong on the CONTAINER, not the overlay.

### Pitfall 3: Spotlight Visible on Touch Devices (Wrong Media Query)

**What goes wrong:** SC-4 requires the spotlight to be completely absent on `pointer: coarse` or `any-hover: none` devices. Using `@media (pointer: fine)` to SHOW the spotlight is fragile — some styluses report `fine` on tablets.

**Why it happens:** Using `pointer` (primary input) instead of `any-hover` (any available input).

**How to avoid:** Use `@media (any-hover: hover)` to SHOW the spotlight (whitelist fine-pointer devices) rather than trying to hide on coarse. Default state (outside the media query) is the spotlight being completely absent (`display: none` or the component returning `null`).

### Pitfall 4: Lighthouse Performance Regression from Noise Generation

**What goes wrong:** `randomNoise()` regenerates a 1500-character string on every `mousemove` event. On low-end hardware, this can drop frame rate and fail the ≥ 0.90 Lighthouse score.

**Why it happens:** String allocation of 1500 chars happens in the event handler, which fires 60× per second during mouse movement.

**How to avoid:** The noise layer is only rendered when `isHovered` is true. On Lighthouse runs (automated, no mouse movement), the noise layer is never rendered. Performance score is measured with automated testing — mouse interaction is not simulated by Lighthouse. The concern is real-world smoothness, not Lighthouse score directly. Throttle `mousemove` with `requestAnimationFrame` if profiling shows jank:
```typescript
let rafPending = false
function handleMouseMove(e) {
  if (rafPending) return
  rafPending = true
  requestAnimationFrame(() => {
    // update mouseX, mouseY, noise
    rafPending = false
  })
}
```

### Pitfall 5: DotGridSpotlight z-index Layering

**What goes wrong:** The spotlight overlay renders on top of content, making links unclickable.

**Why it happens:** `position: fixed` with no `z-index` set, or `z-index` higher than nav/content layers.

**How to avoid:** Set `z-index: 0` on the spotlight overlay. The `.matrix-theme` wrapper uses `flex-col` — nav, main, footer stack naturally. Add `relative z-10` (or equivalent) to the nav, main, and footer elements if the spotlight bleeds over them. `pointer-events: none` is mandatory regardless.

---

## Code Examples

Verified patterns from official sources and installed package inspection:

### Verifying useMotionValue and useMotionTemplate are in installed framer-motion 12.34.2

```bash
# Verified: both functions are exported from framer-motion 12.34.2
node -e "const { useMotionValue, useMotionTemplate, useSpring } = require('framer-motion'); \
  console.log(typeof useMotionValue, typeof useMotionTemplate, typeof useSpring)"
# Output: function function function
```

### use-scramble: Hover variant (FX-03 alternative for card title)

Per the requirement, FX-03 uses the Evervault style (noise characters revealed by gradient mask), not text scramble. But for reference, `use-scramble` also supports hover-triggered replay:

```typescript
const { ref, replay } = useScramble({
  text: 'TeamFlow',
  playOnMount: false,  // do NOT fire on mount
  speed: 0.4,
  scramble: 8,
})
// trigger on hover: onMouseEnter={replay}
```

### Checking any-hover media query at runtime (JavaScript)

```typescript
// For the belt-and-suspenders runtime check in DotGridSpotlight
const canHover = window.matchMedia('(any-hover: hover)').matches
// true on desktop with mouse, false on pure touch device
```

### CSS dot grid without spotlight (base layer)

```css
/* Background dot grid that is always visible (no spotlight) */
.dot-grid-bg {
  background-image:
    radial-gradient(circle, var(--matrix-green-dim) 1px, transparent 1px),
    radial-gradient(circle, var(--matrix-green-dim) 1px, transparent 1px);
  background-size: 28px 28px;
  background-position: 0 0, 14px 14px;
  opacity: 0.06;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GSAP ScrambleText plugin (Club GSAP paid) | `use-scramble` (free, 1 KB) or hand-rolled RAF hook | 2022-present | No paid gate, simpler API |
| framer-motion `useMotionValue` (v7+) | Same API in motion 12.34.2 (framer-motion re-export) | Stable since v7 | Fully compatible with installed version |
| CSS `background-attachment: fixed` for parallax | CSS custom properties updated by JS `mousemove` | 2020-present | Simpler, better performance, no jank on iOS |
| `pointer: coarse` for touch detection | `any-hover: none` for hover-incapable device detection | 2020-present (CSS spec) | Correctly handles hybrid devices |

**Deprecated/outdated:**
- **motion ScrambleText**: Listed on motion.dev docs but it is a Motion+ (paid, one-time fee) exclusive component — NOT available in the free `motion` package at any version as of 2026-02-19. Do not assume it can be imported from `motion/react`.
- **`framer-motion` as separate install**: The `motion` package (installed) re-exports framer-motion 12.34.2. The correct import path is `motion/react` for React hooks. Both `framer-motion` and `motion/react` resolve to the same code.

---

## Open Questions

1. **Is `use-scramble` permitted as a new dependency for FX-01?**
   - What we know: FX-03 explicitly says "no new dependency"; FX-01 does not have this constraint
   - What's unclear: Whether the project owner intends "no new dependency" to apply globally
   - Recommendation: Default to hand-rolled hook (Pattern 2 above) to be safe; upgrade to `use-scramble` if the owner confirms it's allowed

2. **Should `EvervaultCard` wrap `ProjectCard` from outside or be integrated inside?**
   - What we know: `ProjectCard` is a Server Component (no `'use client'`); wrapping from outside is cleaner SSR boundary
   - What's unclear: Whether the noise effect should apply to ALL card content or just the title
   - Recommendation: Create an `EvervaultCard` wrapper used at call sites in `page.tsx`, not inside `ProjectCard` itself — preserves the Server Component nature of `ProjectCard`

3. **Dot grid opacity — visible on light mode?**
   - What we know: The portfolio uses `.matrix-theme` which applies `background-color: #0a0a0a` in dark mode; in light mode it falls back to `var(--background)` (light slate)
   - What's unclear: At `opacity: 0.12`, `--matrix-green-dim` (#00CC33) on white background may look jarring
   - Recommendation: Scope the `dot-grid-spotlight` CSS to `.dark .dot-grid-spotlight` or check via JS `document.documentElement.classList.contains('dark')` before attaching the mousemove listener

---

## Sources

### Primary (HIGH confidence)

- Installed package inspection — `node -e "require('framer-motion')"` — `useMotionValue`, `useMotionTemplate`, `useSpring` confirmed present in framer-motion 12.34.2
- `/home/doctor/fernandomillan/apps/web/components/portfolio/motion-provider.tsx` — existing `MotionConfig reducedMotion="user"` pattern
- `/home/doctor/fernandomillan/apps/web/components/portfolio/animate-in.tsx` — existing `useReducedMotion()` guard pattern
- `/home/doctor/fernandomillan/apps/web/app/globals.css` — `--matrix-green`, `--matrix-green-dim`, `--matrix-green-ghost` CSS token definitions
- `/home/doctor/fernandomillan/apps/web/lighthouserc.json` — 5 portfolio URLs, performance threshold ≥ 0.90

### Secondary (MEDIUM confidence)

- [use-scramble GitHub README](https://github.com/tol-is/use-scramble) — API options including `playOnMount`, `onAnimationEnd`, `prefers-reduced-motion` support, 1 KB size
- [buildui.com/recipes/spotlight](https://buildui.com/recipes/spotlight) — `useMotionValue`/`useMotionTemplate` pattern for cursor tracking in a container; `pointer-events-none` overlay
- [Frontend Masters CSS Spotlight Effect](https://frontendmasters.com/blog/css-spotlight-effect/) — CSS custom property `--clientX`/`--clientY` driven by `mousemove` for dot-grid spotlight
- [Evervault hover gist](https://gist.github.com/Patil-143/facf72906eb1839b9f20dd800be7b740) — `randomString(1500)` regenerated per `mousemove`, CSS `mask-image` with `radial-gradient` at cursor position

### Tertiary (LOW confidence — needs validation)

- [Smashing Magazine hover/pointer media queries](https://www.smashingmagazine.com/2022/03/guide-hover-pointer-media-queries/) — `any-hover: none` vs `pointer: coarse` distinction; recommendation to use `any-hover` for hover-capable device detection (2022 article, consider checking MDN for current browser support)
- Motion ScrambleText is Motion+ exclusive — confirmed by search results but not verified against the motion.dev source; treat as HIGH confidence given it is not present in installed framer-motion 12.34.2 dist

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — installed packages verified by runtime check
- Architecture: HIGH — follows existing patterns in the codebase (`animate-in.tsx`, `motion-provider.tsx`, `matrix-rain-canvas.tsx`)
- FX-01 scramble implementation: HIGH (use-scramble API) / MEDIUM (hand-rolled hook untested)
- FX-03 Evervault implementation: HIGH — `useMotionValue` + `useMotionTemplate` verified in installed package; pattern verified from multiple sources
- FX-04 spotlight implementation: HIGH — CSS custom properties + `mousemove` pattern is well-established; `any-hover` media query is standard CSS
- Pitfalls: HIGH — derived from codebase analysis (z-index, pointer-events, SC-component boundaries)

**Research date:** 2026-02-19
**Valid until:** 2026-03-21 (stable libraries; `use-scramble` API is stable v2.x)
