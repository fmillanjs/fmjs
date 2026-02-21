# Phase 31: Magnetic Buttons - Research

**Researched:** 2026-02-20
**Domain:** motion/react (v12.34.2) spring physics, useMotionValue, useSpring, useReducedMotion, touch device guard, Lighthouse TBT
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MAGN-01 | User hovering the hero CTAs ("View Projects", "View GitHub") sees the button attract toward the cursor with spring physics (motion/react useSpring) | useMotionValue + useSpring pattern confirmed from project's installed framer-motion types; hero-section.tsx CTAs identified — note: "Learn More" button needs rename to "View Projects" per requirement text |
| MAGN-02 | User hovering the contact CTA ("Get In Touch") sees the same magnetic spring-physics attraction | "Get In Touch" CTA located in `about/page.tsx` (Server Component); MagneticButton must be 'use client' wrapper imported as Client Component |
| MAGN-03 | User on a touch device or with reduced-motion preference sees a plain button with no magnetic effect (any-hover guard + useReducedMotion) | `window.matchMedia('(any-hover: hover)').matches` guard already used in `DotGridSpotlight`; `useReducedMotion()` from `motion/react` returns `boolean | null`, null = SSR safe no-motion |
</phase_requirements>

---

## Summary

Phase 31 implements a `MagneticButton` component that wraps any button child in spring-physics cursor attraction using `motion/react` v12.34.2. The project already has `motion` installed (re-exporting from `framer-motion`), and the exact hooks needed — `useMotionValue`, `useSpring`, `useReducedMotion` — are already used elsewhere in the portfolio (see `evervault-card.tsx`, `animate-in.tsx`, `dot-grid-spotlight.tsx`).

The implementation follows the project's established pattern: `useReducedMotion()` early-return renders a plain div wrapper, and `window.matchMedia('(any-hover: hover)').matches` inside `useEffect` skips mousemove binding on touch devices. The magnetic effect is applied to a `motion.div` outer wrapper — not to the `<button>` element — so the browser focus ring remains correctly positioned during keyboard navigation.

The architecture decision locked in STATE.md is confirmed correct: `motion/react` useSpring on `useMotionValue` (not `gsap.to()` in mousemove) prevents TBT spike. The `set()` call on a `MotionValue` inside an event handler does NOT create new tweens — the spring physics is handled by framer-motion's internal scheduler, which is RAF-based and off-main-thread for the actual interpolation. The Lighthouse CI gate is performance >= 0.90 and TBT must stay < 50ms.

**Primary recommendation:** Build `MagneticButton` as a `'use client'` component using `useMotionValue` + `useSpring` for X/Y, guard with `useReducedMotion()` early-return + `(any-hover: hover)` matchMedia check, wrap all three CTAs, then verify LHCI gate still passes.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion/react | 12.34.2 (installed) | useMotionValue, useSpring, useReducedMotion | Already in project; re-exports from framer-motion; React 19 + Next.js 15 compatible |
| framer-motion | (bundled via motion) | SpringOptions type definitions | Underlying implementation; types confirmed from installed node_modules |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React useRef | Built-in | getBoundingClientRect() for button center calculation | Required to compute cursor offset from button center |
| React useCallback | Built-in | Stable onMouseMove reference | Prevents unnecessary re-registration of event handlers |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| motion/react useSpring | gsap.quickTo() | STATE.md arch decision: motion/react spring chosen to avoid GSAP TBT risk; quickTo would work but splits concerns across two animation libraries |
| motion/react useSpring | CSS custom properties + CSS spring | Less control over spring config; cannot snap back with velocity |
| outer wrapper motion.div | Animating `<button>` directly | NEVER — breaks focus ring alignment (Pitfall 12 in PITFALLS.md) |

**Installation:** No new packages needed — `motion` is already in package.json at `^12.34.2`.

---

## Architecture Patterns

### Recommended Project Structure

```
apps/web/components/portfolio/
├── magnetic-button.tsx    # NEW — 'use client' MagneticButton component
├── hero-section.tsx       # MODIFY — wrap two CTAs with MagneticButton
└── (portfolio)/about/page.tsx  # MODIFY — wrap Get In Touch CTA with MagneticButton
```

### Pattern 1: MagneticButton Component

**What:** A `'use client'` wrapper component that adds spring-physics cursor attraction to any child button. The spring `x` and `y` motion values drive the wrapper's `style` prop. The `<button>` itself does not move — only the `motion.div` wrapper does.

**When to use:** Any CTA where MAGN-01, MAGN-02, MAGN-03 apply. Explicitly NOT on nav links, form submits, or dashboard buttons (per REQUIREMENTS.md Out of Scope).

**Example:**
```typescript
// Source: motion/react types (framer-motion/dist/types/index.d.ts) + project patterns
'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react'

// Spring config: stiffness=150 gives perceptible but not violent attraction;
// damping=30 eliminates oscillation while still feeling elastic;
// mass=0.2 makes the response feel lightweight
const SPRING_CONFIG = { stiffness: 150, damping: 30, mass: 0.2 }

// Fraction of the cursor-to-center distance applied as button offset.
// 0.3 = button moves 30% toward cursor — perceptible but not overdone.
const MAGNETIC_STRENGTH = 0.3

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
}

export function MagneticButton({ children, className }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, SPRING_CONFIG)
  const springY = useSpring(y, SPRING_CONFIG)

  // ALWAYS call all hooks before early return — React rules of hooks
  // useReducedMotion() returns null on SSR (safe: null is falsy, so !null = true = render plain)
  if (prefersReducedMotion) {
    // Plain wrapper — no motion overhead, no position shift
    return <div className={className}>{children}</div>
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Guard: only run on hover-capable devices
    // NOTE: matchMedia check is inside useEffect in the real impl — see Pattern 2 below
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * MAGNETIC_STRENGTH)
    y.set((e.clientY - centerY) * MAGNETIC_STRENGTH)
  }

  const handleMouseLeave = () => {
    x.set(0)  // Spring snaps back to center with physics
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}
```

### Pattern 2: Touch Device Guard (using matchMedia in useEffect)

**What:** The `(any-hover: hover)` media query detects whether any input device (not just primary) supports hovering. Evaluates to false on phones and tablets. This is the same guard already used in `dot-grid-spotlight.tsx`.

**When to use:** Any component that binds mousemove — prevents magnetic artifacts on touch tap events.

**Implementation in MagneticButton:**
```typescript
// Source: dot-grid-spotlight.tsx (established project pattern)
// The matchMedia check must be inside useEffect (client-only API).
// Use a ref to track canHover so handlers know whether to activate.
import { useRef, useEffect } from 'react'

const canHoverRef = useRef(false)

useEffect(() => {
  canHoverRef.current = window.matchMedia('(any-hover: hover)').matches
}, [])

// In handleMouseMove:
const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!canHoverRef.current || !ref.current) return
  // ... rest of handler
}
```

### Pattern 3: MagneticButton Usage in Server Component Pages

**What:** `about/page.tsx` is a Server Component. To use `MagneticButton` (which is `'use client'`), import it and pass the existing `<Button asChild>` + `<Link>` as children.

**Example:**
```typescript
// Source: Project pattern — same as how MotionProvider is used in layout.tsx
// about/page.tsx (Server Component — NO 'use client' directive added to the page itself)
import { MagneticButton } from '@/components/portfolio/magnetic-button'

// Replace:
<Button asChild size="lg">
  <Link href="/contact">Get In Touch</Link>
</Button>

// With:
<MagneticButton>
  <Button asChild size="lg">
    <Link href="/contact">Get In Touch</Link>
  </Button>
</MagneticButton>
```

### Pattern 4: Hero Section CTA Wrapping

**What:** `hero-section.tsx` is already `'use client'`. Import `MagneticButton` and wrap both CTAs.

**Note on CTA rename:** MAGN-01 references "View Projects" but the current hero shows "Learn More" (linking to `/about`). The phase plan must decide: rename the text to "View Projects" pointing to `/projects`, or apply magnetic to both CTAs as-is ("Learn More" + "View GitHub"). The requirement wording says "View Projects" — this is likely a spec that expects a rename.

```typescript
// hero-section.tsx — wrap each Button in MagneticButton
import { MagneticButton } from '@/components/portfolio/magnetic-button'

<div className="flex flex-col sm:flex-row gap-4 justify-center">
  <MagneticButton>
    <Button asChild size="lg">
      <Link href="/projects">View Projects</Link>
    </Button>
  </MagneticButton>
  <MagneticButton>
    <Button asChild variant="outline" size="lg">
      <a href="https://github.com/fmillanjs" target="_blank" rel="noopener noreferrer">
        View GitHub
      </a>
    </Button>
  </MagneticButton>
</div>
```

### Anti-Patterns to Avoid

- **Applying transform to `<button>` element directly:** The focus ring stays at the original position, causing keyboard navigation to show a displaced focus indicator. Always transform the `motion.div` wrapper.
- **Calling `gsap.to()` or `gsap.quickTo()` inside mousemove:** The project arch decision (STATE.md) mandates `motion/react` spring — not GSAP — for magnetic buttons. GSAP quickTo in mousemove works but splits animation libraries and was explicitly ruled out.
- **Using `document.addEventListener('mousemove')` as a global handler:** The `alexjedi/magnetic-wrapper` pattern (global mousemove) is inferior to React's `onMouseMove` on the element — the global handler fires for all cursor movement even when cursor is far from the button, wastefully calling `getBoundingClientRect()`.
- **Placing hooks after the reduced-motion early return:** React rules of hooks require all hook calls before any conditional return. Call `useMotionValue`, `useSpring`, `useRef` before the `if (prefersReducedMotion)` check.
- **Placing `window.matchMedia()` at render time:** matchMedia is client-only. Call only inside `useEffect` (see Pattern 2).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spring-physics snap-back | Custom exponential decay or CSS transition on mouseleave | `useSpring` with `x.set(0)` / `y.set(0)` | Spring handles velocity, overshoot, and deceleration correctly; hand-rolled easing ignores accumulated velocity |
| Touch device detection | `navigator.userAgent` parsing or `'ontouchstart' in window` | `window.matchMedia('(any-hover: hover)').matches` | Media query is reliable across hybrid devices (touch + mouse laptop); UA parsing is fragile and deprecated |
| Reduced-motion detection | `useState(false) + useEffect + matchMedia` | `useReducedMotion()` from `motion/react` | Already imported; handles SSR correctly (returns null on server = no motion = safe); project already uses this in 6 components |
| MotionValue–spring connection | `useEffect` + subscription to value changes | `useSpring(x, config)` — returns a MotionValue that follows `x` | useSpring creates a subscribing MotionValue automatically; no manual subscription needed |

**Key insight:** The `useMotionValue.set()` call in the mousemove handler does NOT create new tweens. It updates the raw value; the `useSpring` value subscribes to that and runs spring interpolation through framer-motion's internal RAF scheduler. This is why it doesn't cause TBT spikes — the computation is spread across animation frames, not on the event handler's synchronous call.

---

## Common Pitfalls

### Pitfall 1: Hooks Called After Conditional Return (Rules of Hooks Violation)

**What goes wrong:** `useReducedMotion()` check is placed before `useMotionValue()`, `useSpring()`, `useRef()` calls. React throws "rendered more hooks than the previous render" error in production.

**Why it happens:** Developer correctly wants to short-circuit for reduced-motion before allocating motion values. But React's rules require hooks to always be called in the same order.

**How to avoid:** Call ALL hooks first — `useRef`, `useMotionValue`, `useSpring`, `useReducedMotion`. Then conditional return.

**Warning signs:** React hook order error in console; component crashes on reduced-motion devices.

### Pitfall 2: `window.matchMedia` Called at Render Time

**What goes wrong:** `const canHover = window.matchMedia('(any-hover: hover)').matches` at the top of the component body (not in useEffect) throws `ReferenceError: window is not defined` on the server. The portfolio layout is a Server Component that imports client components; any SSR execution of the component function will hit this.

**Why it happens:** `MagneticButton` is `'use client'` but Next.js 15 App Router still server-renders the initial HTML. The component function runs on the server during SSR before hydration. `window` does not exist on the server.

**How to avoid:** Place `window.matchMedia()` call inside `useEffect` only (never in render body). Store result in a `useRef` for handler access. This is the same pattern used in `lenis-provider.tsx` and `dot-grid-spotlight.tsx`.

**Warning signs:** Build error `window is not defined`; or hydration mismatch if the server/client renders different initial states.

### Pitfall 3: Transform Applied to `<button>` Element — Focus Ring Misalignment

**What goes wrong:** The magnetic `motion.div` wrapper is too thin (just around the button text) OR the transform is applied directly to the `<button>` via `motion.button`. The browser's focus ring stays at the untransformed position. Keyboard users Tab to the button and see the focus ring floating next to the button's new position.

**Why it happens:** CSS `transform` moves the rendering of an element but does not move the element's layout box. The focus ring is drawn relative to the layout box, not the rendered position.

**How to avoid:** The `motion.div` wrapper IS the outer element; the `<Button asChild>` + child `<Link>` or `<a>` are inside it. The `motion.div` moves; the button's intrinsic layout position does not. The focus ring follows the button element, which stays put in layout.

**Warning signs:** Tab navigation focuses the button but focus ring appears offset; fails axe-core accessibility test for visible focus indicators.

### Pitfall 4: Magnetic Effect Active on Touch Devices

**What goes wrong:** User taps a CTA on mobile. The `onMouseMove` event does not fire on touch (correct). But if global `document.addEventListener('mousemove')` is used (the pattern from `alexjedi/magnetic-wrapper`), synthetic touch events may leak through. More commonly: the `mouseenter`/`mouseleave` events DO fire on iOS Safari after a tap, causing the button to flash to an offset position for one frame.

**Why it happens:** iOS Safari fires `mouseenter`, `mousemove` (once), and `mouseleave` as a synthetic trio on tap. If the handler is active, the button snaps to an offset and immediately snaps back — visible as a flicker.

**How to avoid:** Guard with `window.matchMedia('(any-hover: hover)').matches` checked in `useEffect`. On touch-only devices, `any-hover: hover` evaluates to false. The handler sets `canHoverRef.current = false`, and the `onMouseMove` handler early-returns immediately.

**Warning signs:** On Chrome DevTools mobile simulation, tap on CTA causes it to jitter before activating; on real iOS device, button flickers on tap.

### Pitfall 5: Lighthouse TBT Spike from Expensive Computation in mousemove

**What goes wrong:** `getBoundingClientRect()` is called every `onMouseMove` event. On a 200Hz display, this fires 200 times/second. If the component has multiple magnetic buttons and each calls `getBoundingClientRect()`, the cumulative synchronous layout queries cause forced reflows. TBT spikes above 50ms.

**Why it happens:** `getBoundingClientRect()` forces a synchronous layout flush (causes the browser to recalculate layout immediately). Multiple calls per frame, especially across multiple elements, compounds the cost.

**How to avoid:** Cache the `getBoundingClientRect()` result in a `useRef` updated only on `onMouseEnter` (when the user enters the button, not on every pixel of movement). During `onMouseMove`, use the cached rect.

```typescript
const rectRef = useRef<DOMRect | null>(null)

const handleMouseEnter = () => {
  rectRef.current = ref.current?.getBoundingClientRect() ?? null
}

const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!canHoverRef.current || !rectRef.current) return
  const centerX = rectRef.current.left + rectRef.current.width / 2
  const centerY = rectRef.current.top + rectRef.current.height / 2
  x.set((e.clientX - centerX) * MAGNETIC_STRENGTH)
  y.set((e.clientY - centerY) * MAGNETIC_STRENGTH)
}
```

**Warning signs:** LHCI reports TBT > 50ms after adding magnetic buttons; DevTools Performance flamegraph shows "Layout" entries during mouse movement.

---

## Code Examples

Verified patterns from official sources and project's installed types:

### useSpring SpringOptions (from motion-dom/dist/index.d.ts)
```typescript
// Source: /node_modules/motion-dom/dist/index.d.ts (installed locally)
interface SpringOptions {
  stiffness?: number  // Default: 100. Higher = more sudden/snappy movement
  damping?: number    // Default: 10. Higher = less oscillation. 0 = infinite oscillation
  mass?: number       // Default: 1. Higher = more lethargic/heavy movement
}

// Recommended magnetic button config (from community reference + verified against types):
const SPRING_CONFIG = { stiffness: 150, damping: 30, mass: 0.2 }
// - stiffness 150: moderately fast attraction (default 100 is sluggish for this use case)
// - damping 30: stops without bouncing (default 10 bounces 3-4 times)
// - mass 0.2: lightweight feel — snaps back quickly without feeling mechanical
```

### useMotionValue + useSpring wiring
```typescript
// Source: framer-motion/dist/types/index.d.ts (installed locally)
import { useMotionValue, useSpring } from 'motion/react'

const x = useMotionValue(0)    // Raw "target" value — updated by mousemove
const springX = useSpring(x, SPRING_CONFIG)  // Smoothed value — follows x with spring physics
// springX is passed to motion.div style={{ x: springX }}
// x.set(newValue) updates the target; springX animates toward newValue via spring
```

### useReducedMotion return types
```typescript
// Source: framer-motion/dist/types/index.d.ts (installed locally)
declare function useReducedMotion(): boolean | null;
// Returns:
//   null  — during SSR (server has no matchMedia; no-motion is the safe default)
//   true  — user has prefers-reduced-motion: reduce active
//   false — user has prefers-reduced-motion: no-preference

// Project convention (confirmed in animate-in.tsx, scramble-hero.tsx, etc.):
if (prefersReducedMotion) {
  return <div className={className}>{children}</div>  // Plain wrapper, no motion
}
// null is falsy → passes through to motion rendering on SSR
// false is falsy → passes through to motion rendering for normal users
// true is truthy → renders plain wrapper for reduced-motion users
// This is correct: SSR always renders motion-active HTML (hydration-safe)
```

### any-hover media query guard (project-established pattern)
```typescript
// Source: dot-grid-spotlight.tsx (established project pattern, line 14)
const canHover = window.matchMedia('(any-hover: hover)').matches
// '(any-hover: hover)' evaluates true if ANY input device supports hover
// Evaluates false on phones/tablets (touch-only)
// Evaluates true on laptops, even touchscreen laptops (they have a trackpad)
// More reliable than '(hover: hover)' which checks only the PRIMARY device
// MUST be called inside useEffect (window not available on server)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.addEventListener('mousemove')` global handler | React `onMouseMove` on the wrapper element | ~2022 (React event delegation) | Local handler fires only when cursor is over the element; no global cleanup needed |
| `gsap.to()` per mousemove event | `motion/react` useSpring + useMotionValue.set() | Project arch decision (STATE.md) | Eliminates per-pixel tween creation; TBT stays < 50ms |
| `navigator.userAgent` touch detection | `(any-hover: hover)` media query | CSS Level 4 Media Queries | Works on hybrid devices; not fragile to UA string changes |
| `useReducedMotion` from `framer-motion` | `useReducedMotion` from `motion/react` | motion v11 rebrand | Same API; import path changed; project already uses correct import |

**Deprecated/outdated:**
- `import { useSpring } from 'framer-motion'`: Still works (motion/react re-exports framer-motion) but use `from 'motion/react'` per project convention (set in STATE.md v2.5 decision).
- `window.matchMedia('(hover: hover)')`: Use `(any-hover: hover)` instead — the `hover` query checks only the primary pointer device; `any-hover` is more reliable for hybrid mouse+touch devices.

---

## Open Questions

1. **Hero CTA rename: "Learn More" → "View Projects"**
   - What we know: MAGN-01 spec says "View Projects" CTA; hero-section.tsx currently has `<Link href="/about">Learn More</Link>`
   - What's unclear: Is this a copy change required by MAGN-01, or should magnetic be applied to the existing "Learn More" CTA?
   - Recommendation: Plan 31-01 should rename "Learn More" to "View Projects" pointing to `/projects` — this aligns with MAGN-01 spec wording and makes the hero more action-oriented for recruiters

2. **`getBoundingClientRect()` caching strategy**
   - What we know: Calling it in every mousemove causes potential forced reflows
   - What's unclear: At 3 CTAs total, the absolute cost may be acceptable (not every CTA is hovered simultaneously)
   - Recommendation: Cache rect in `onMouseEnter` as shown in Pitfall 5 code example — the correct pattern at zero extra complexity cost

3. **Playwright visual regression baseline update needed**
   - What we know: The magnetic button adds a `motion.div` wrapper around each CTA; at rest (no hover), position is x=0, y=0 — visually identical to current state; snapshots at `reducedMotion: 'reduce'` would render the plain `<div>` wrapper
   - What's unclear: Whether the plain `<div>` wrapper vs the original `<Button asChild>` wrapping changes any layout pixels
   - Recommendation: Run LHCI + Playwright after 31-02; if snapshots fail, run `--update-snapshots` and verify only CTA area changed

---

## Sources

### Primary (HIGH confidence)
- `/home/doctor/fernandomillan/node_modules/framer-motion/dist/types/index.d.ts` — useSpring, useMotionValue, useReducedMotion type signatures
- `/home/doctor/fernandomillan/node_modules/motion-dom/dist/index.d.ts` — SpringOptions interface (stiffness, damping, mass with defaults)
- `/home/doctor/fernandomillan/node_modules/motion/dist/react.d.ts` — confirms `motion/react` re-exports from `framer-motion`
- `/home/doctor/fernandomillan/apps/web/components/portfolio/dot-grid-spotlight.tsx` — established `(any-hover: hover)` guard pattern
- `/home/doctor/fernandomillan/apps/web/components/portfolio/evervault-card.tsx` — established `useMotionValue` + `useReducedMotion` early-return pattern
- `/home/doctor/fernandomillan/apps/web/components/portfolio/animate-in.tsx` — established `useReducedMotion()` falsy check pattern
- `/home/doctor/fernandomillan/.planning/research/PITFALLS.md` — Pitfalls 7 and 12 (magnetic button TBT + focus ring)
- `/home/doctor/fernandomillan/.planning/STATE.md` — locked arch decision: `motion/react` spring over `gsap.to()` for magnetic buttons

### Secondary (MEDIUM confidence)
- https://github.com/alexjedi/magnetic-wrapper — reference implementation showing `useMotionValue` + `useSpring` + `isHovered` state + `{ damping: 30, stiffness: 150, mass: 0.2 }` spring config; confirmed structurally against installed framer-motion types
- https://css-irl.info/detecting-hover-capable-devices/ — `(any-hover: hover)` vs `(hover: hover)` explanation; cross-referenced with project's DotGridSpotlight implementation

### Tertiary (LOW confidence)
- https://blog.olivierlarose.com/tutorials/sticky-cursor — spring config values (damping: 20, stiffness: 300, mass: 0.5); partially confirmed against installed types; different config than project reference; treat as starting point not canonical values

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `motion/react` v12.34.2 installed and confirmed; all hooks present in framer-motion types
- Architecture: HIGH — pattern derived from 4 existing project components using the same hooks; established conventions confirmed
- Pitfalls: HIGH — Pitfalls 7 and 12 from PITFALLS.md are project-specific research; SSR pitfall confirmed from lenis-provider.tsx pattern

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (motion/react stable; Next.js 15 App Router stable; no breaking changes expected in 30 days)
