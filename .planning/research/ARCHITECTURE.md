# Architecture Research

**Domain:** Animation integration — Lenis smooth scroll + GSAP ScrollTrigger + magnetic buttons + Matrix color system into existing Next.js 15 App Router portfolio
**Researched:** 2026-02-20
**Confidence:** HIGH (lenis/react API verified against GitHub monorepo; GSAP patterns verified against official docs; motion/react magnetic approach verified; existing codebase read directly)

---

## Existing Architecture Baseline

Before describing what changes, the current state must be understood explicitly.

### Current Provider/Component Tree (Portfolio Routes)

```
app/layout.tsx  [Server Component]
  └── <html> + <body>
        └── ThemeProvider (next-themes, class-based dark mode)
              └── (portfolio)/layout.tsx  [Server Component]
                    └── <div class="matrix-theme min-h-screen flex flex-col">
                          ├── <DotGridSpotlight />        [Client -- mousemove listener]
                          ├── <PortfolioNav />            [Client -- motion/react, usePathname]
                          ├── <MotionProvider>            [Client -- MotionConfig reducedMotion="user"]
                          │     └── <main>{children}</main>
                          └── <PortfolioFooter />         [Server Component currently]
                          └── <CommandPalette />          [Client]
```

### Current CSS Token System

```
:root {
  --matrix-green: #00FF41;         (Tailwind: no utility, consumed as var())
  --matrix-green-dim: #00CC33;     (Tailwind: no utility, consumed as var())
  --matrix-green-ghost: #00FF4120; (Tailwind: no utility, consumed as var())
}

.matrix-theme { background-color: #0a0a0a; color: #e8e8e8; }
html:not(.dark) .matrix-theme { reverts to --background / --foreground }
```

Matrix tokens live in `:root`, NOT in `@theme inline`, meaning no `bg-matrix-green` Tailwind utility exists. Direct `var(--matrix-green)` inline usage throughout codebase.

### Current Animation Library Split

| Concern | Library | Files |
|---------|---------|-------|
| Scroll-reveal (fade+slide) | motion/react `whileInView` | `animate-in.tsx`, `stagger-container.tsx` |
| Nav active indicator | motion/react `layoutId` | `nav.tsx` |
| Noise decryption hover | motion/react `useMotionValue` | `evervault-card.tsx` |
| Text scramble | Hand-rolled RAF hook | `use-text-scramble.ts`, `scramble-hero.tsx` |
| Matrix rain canvas | Raw Canvas 2D API, `requestAnimationFrame` | `matrix-rain-canvas.tsx` (dynamic, ssr:false) |
| Dot-grid spotlight | CSS custom props + `mousemove` listener | `dot-grid-spotlight.tsx` |
| Reduced motion gate | Three-layer: CSS rule + RAF check + `MotionConfig` | `globals.css`, `matrix-rain-canvas.tsx`, `motion-provider.tsx` |

**GSAP is installed** (`gsap@3.14.2`, `@gsap/react@2.1.2`, `lenis@1.3.17`) but currently unused — no GSAP or Lenis code exists in the codebase yet.

---

## Standard Architecture — Target State

### System Overview — Provider Tree After Integration

```
app/layout.tsx  [Server Component -- unchanged]
  └── <html> + <body>
        └── ThemeProvider
              └── (portfolio)/layout.tsx  [Server Component -- MODIFIED]
                    └── <div class="matrix-theme min-h-screen flex flex-col">
                          ├── <DotGridSpotlight />        [unchanged]
                          ├── <PortfolioNav />            [unchanged]
                          ├── <LenisProvider>             [NEW -- wraps main + footer]
                          │     ├── <LenisScrollRestorer /> [NEW -- route change scroll-to-top]
                          │     ├── <MotionProvider>      [MOVED inside LenisProvider]
                          │     │     └── <main>{children}</main>
                          │     └── <PortfolioFooter />   [MODIFIED -- Matrix animation added]
                          └── <CommandPalette />          [unchanged, outside scroll ctx]
```

**Why LenisProvider wraps `<main>` AND `<PortfolioFooter>`:** Both are in the scroll flow. Lenis must manage the entire scrollable content, not just main.

**Why CommandPalette stays outside:** It renders in a portal/fixed overlay and does not participate in document scroll.

---

## Component Responsibilities

| Component | New or Modified | Responsibility | SSR |
|-----------|----------------|----------------|-----|
| `LenisProvider` | NEW | Creates ReactLenis root instance; wires GSAP ticker when GSAP is co-used | Client only |
| `LenisScrollRestorer` | NEW | Watches `usePathname()`, calls `lenis.scrollTo(0, { immediate: true })` on route change | Client only |
| `MagneticButton` | NEW | Wrapper that pulls child element toward cursor via motion spring; `any-hover` guarded | Client only |
| `PortfolioFooter` | MODIFIED | Add Matrix animation child (dynamic ssr:false); apply Matrix color styling | Server stays Server |
| `FooterMatrixEffect` | NEW | The actual animated element inside the footer; isolated client animation island | Client only |
| `globals.css` | MODIFIED | Add Tailwind utilities for Matrix tokens; add new CSS tokens for surface/glow variants | N/A |
| `(portfolio)/layout.tsx` | MODIFIED | Wrap with LenisProvider; reorder providers | Server Component |

---

## Recommended Project Structure (Delta -- New Files Only)

```
apps/web/
├── providers/
│   └── lenis-provider.tsx              # NEW: ReactLenis root + GSAP ticker wiring
│
├── components/
│   └── portfolio/
│       ├── lenis-scroll-restorer.tsx   # NEW: Route-change scroll-to-top
│       ├── magnetic-button.tsx         # NEW: Cursor-pull wrapper component
│       ├── footer-matrix-effect.tsx    # NEW: Animated Matrix element for footer
│       ├── footer.tsx                  # MODIFIED: dynamic import + Matrix styling
│       └── animate-in.tsx              # unchanged (motion/react whileInView)
│
└── app/
    └── globals.css                     # MODIFIED: Matrix Tailwind utilities added
```

---

## Architectural Patterns

### Pattern 1: ReactLenis Root Provider + GSAP Ticker Integration

**What:** A single `LenisProvider` client component placed in the portfolio layout creates one Lenis instance for the entire portfolio, wires it into GSAP's ticker (replacing autoRaf), and disables GSAP lag smoothing. ScrollTrigger then calls `ScrollTrigger.update` on each Lenis scroll event.

**When to use:** Any time both Lenis and GSAP ScrollTrigger are used together. Ticker unification prevents drift between the two animation loops.

**Trade-offs:** One global Lenis instance is simpler to reason about than per-page instances. The GSAP ticker drives Lenis rather than `requestAnimationFrame`, so GSAP and scroll are always in sync. If only Lenis is needed (no GSAP), `autoRaf: true` is simpler and this wiring is unnecessary.

**Example:**

```tsx
// providers/lenis-provider.tsx
'use client'

import { useEffect, useRef } from 'react'
import { ReactLenis } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { ReactNode } from 'react'

gsap.registerPlugin(ScrollTrigger)

export function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<{ lenis?: { raf: (time: number) => void } }>(null)

  useEffect(() => {
    // Wire Lenis into GSAP ticker -- replaces autoRaf
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000)
    }
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)  // critical: prevents jank on tab-switch return

    return () => gsap.ticker.remove(update)
  }, [])

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{ autoRaf: false, lerp: 0.1, duration: 1.2 }}
    >
      {children}
    </ReactLenis>
  )
}
```

**Source:** Verified against [darkroomengineering/lenis monorepo packages/react README](https://github.com/darkroomengineering/lenis/blob/main/packages/react/README.md). The `autoRaf: false` + `gsap.ticker.add()` pattern is the official documented integration. **HIGH confidence.**

---

### Pattern 2: Route-Change Scroll Restoration

**What:** A zero-render child component that watches `usePathname()` and calls `lenis.scrollTo(0, { immediate: true })` whenever the route changes. Placed inside LenisProvider so it has access to the Lenis instance via `useLenis`.

**When to use:** Required for all Lenis + Next.js App Router setups. App Router soft navigation does not reset scroll position when Lenis intercepts native scroll. Without this, navigating between portfolio pages resumes at the previous scroll position.

**Trade-offs:** `immediate: true` skips the smooth animation so the page snaps to top, which is the expected browser navigation behavior. Animated scroll-to-top on navigation is disorienting.

**Example:**

```tsx
// components/portfolio/lenis-scroll-restorer.tsx
'use client'

import { useEffect } from 'react'
import { useLenis } from 'lenis/react'
import { usePathname } from 'next/navigation'

export function LenisScrollRestorer() {
  const lenis = useLenis()
  const pathname = usePathname()

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true })
    }
  }, [pathname, lenis])

  return null
}
```

**Known issue confirmed:** GitHub issue [darkroomengineering/lenis #319](https://github.com/darkroomengineering/lenis/issues/319) — "ReactLenis begins halfway down the page on navigation in NextJS 14 with app router." The `immediate: true` flag is the critical detail. **HIGH confidence.**

---

### Pattern 3: GSAP ScrollTrigger Parallax via useGSAP Hook

**What:** Per-component parallax via `useGSAP()` from `@gsap/react`. ScrollTrigger is registered once globally in the LenisProvider. Each component that needs scroll-driven animation uses `useGSAP` with a scoped container ref.

**When to use:** Decorative parallax on section backgrounds, floating elements, case study image depth effects.

**Trade-offs:** `useGSAP` handles cleanup automatically via `gsap.context()` -- all ScrollTriggers created inside the callback are killed on component unmount. This prevents the memory leak that occurs with raw `useEffect` + `ScrollTrigger.create`. React 18+ Strict Mode double-invocation is handled correctly because `useGSAP` reverts on first cleanup before re-running.

**Lighthouse CI constraint:** Only animate `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`, `margin`, or `padding`. Layout properties cause reflow at 60fps and will fail the CLS check and degrade the Lighthouse performance score below 0.90.

**Example:**

```tsx
'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Register once at module level -- idempotent, safe to call multiple times
gsap.registerPlugin(ScrollTrigger, useGSAP)

export function ParallaxSection({ children }: { children: React.ReactNode }) {
  const container = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.to(inner.current, {
      yPercent: -15,           // transform only -- no layout recalculation
      ease: 'none',
      scrollTrigger: {
        trigger: container.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,              // scrub:1 = 1s lag, feels natural vs scrub:true (immediate)
      },
    })
  }, { scope: container })

  return (
    <div ref={container} className="overflow-hidden">
      <div ref={inner}>{children}</div>
    </div>
  )
}
```

**Source:** [GSAP React documentation — useGSAP hook](https://gsap.com/resources/React/). **HIGH confidence.**

---

### Pattern 4: Magnetic Button via motion/react Spring

**What:** A `MagneticButton` wrapper component that uses `useState` with a `motion.div` `animate` prop from `motion/react` to animate `x` and `y` of a wrapper div when the cursor enters the element's bounding box. Resets to zero on mouse leave. Spring physics handle the elastic snap.

**Why motion/react over GSAP `quickTo` for this:** The project already uses `motion/react` for nav, scroll-reveal, and hover effects. Using GSAP's `quickTo` would require explicit `useEffect` cleanup with `removeEventListener` and `cloneElement` ref-threading. The `motion/react` spring approach is declarative, auto-cleaning, and consistent with the existing pattern in `evervault-card.tsx`.

**SSR safety:** The component is `'use client'`, uses only React synthetic events (no `addEventListener`), and reads `getBoundingClientRect` only on mouse event (not at render time). No `window` access during server rendering.

**Touch guard:** Must check `useReducedMotion()` and render children directly when true. The component should also not activate on touch-primary devices since `mousemove` does not fire on touch. A `window.matchMedia('(any-hover: hover)')` check inside `useEffect` is appropriate, but the simpler approach is: if `onMouseMove` never fires, the position stays at `{ x: 0, y: 0 }` and no animation occurs -- functionally safe without an explicit guard, but the reduced-motion guard is mandatory.

**Example:**

```tsx
// components/portfolio/magnetic-button.tsx
'use client'

import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

interface MagneticButtonProps {
  children: ReactNode
  strength?: number   // 0.3 = subtle, 0.5 = strong
}

export function MagneticButton({ children, strength = 0.4 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const prefersReducedMotion = useReducedMotion()

  // Reduced motion: pass through with no wrapper overhead
  if (prefersReducedMotion) return <>{children}</>

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const { height, width, left, top } = ref.current.getBoundingClientRect()
    setPosition({
      x: (e.clientX - (left + width / 2)) * strength,
      y: (e.clientY - (top + height / 2)) * strength,
    })
  }

  const handleMouseLeave = () => setPosition({ x: 0, y: 0 })

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={position}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      style={{ display: 'inline-flex' }}
    >
      {children}
    </motion.div>
  )
}
```

**Usage pattern:**

```tsx
// In hero-section.tsx, contact page, etc.
import { MagneticButton } from '@/components/portfolio/magnetic-button'

<MagneticButton>
  <Button asChild size="lg">
    <Link href="/about">Learn More</Link>
  </Button>
</MagneticButton>
```

**Source:** [Olivier Larose magnetic button tutorial](https://blog.olivierlarose.com/tutorials/magnetic-button) — direct code verification. **MEDIUM confidence (tutorial source, but motion/react spring API is HIGH confidence against official docs).**

---

### Pattern 5: Matrix CSS Token Extension (Tailwind Utilities)

**What:** Add Matrix-specific color tokens to `@theme inline` in `globals.css` so Tailwind utilities like `bg-matrix-green`, `text-matrix-green`, `border-matrix-border` are available alongside the existing raw `var(--matrix-green)` usage.

**Current state:** `--matrix-green`, `--matrix-green-dim`, `--matrix-green-ghost` exist in `:root` but are NOT in `@theme inline`. Consuming code uses `text-[var(--matrix-green)]` inline bracket syntax.

**Why add to `@theme inline`:** Color harmony work across project cards, case study pages, typography, and the footer will benefit from composable Tailwind utilities that enable `hover:text-matrix-green`, `dark:border-matrix-border`, and responsive variants without repeated bracket syntax.

**Impact on existing code:** Adding to `@theme inline` is purely additive. All existing `var(--matrix-green)` references and `text-[var(--matrix-green)]` bracket usages continue to work unchanged.

**New tokens to add:**

```css
/* In globals.css :root block (new additions) */
:root {
  /* ... existing matrix tokens unchanged ... */
  --matrix-surface: #0d1117;         /* deep dark card background */
  --matrix-border: #1a2a1a;          /* dark green-tinted border */
  --matrix-glow: rgba(0,255,65,0.15); /* ambient glow color */
}

/* In globals.css @theme inline block (new additions) */
@theme inline {
  /* ... existing semantic tokens unchanged ... */

  /* Matrix green system -- exposed as Tailwind utilities */
  --color-matrix-green: var(--matrix-green);
  --color-matrix-green-dim: var(--matrix-green-dim);
  --color-matrix-green-ghost: var(--matrix-green-ghost);

  /* Matrix surface tokens -- new for v3.1 color harmony work */
  --color-matrix-surface: var(--matrix-surface);
  --color-matrix-border: var(--matrix-border);
}
```

**Resulting Tailwind utilities:** `text-matrix-green`, `bg-matrix-green`, `border-matrix-green`, `text-matrix-green-dim`, `bg-matrix-surface`, `border-matrix-border`. The `--matrix-glow` raw var is consumed as `shadow-[var(--matrix-glow)]` (arbitrary value) because Tailwind shadow tokens require more complex setup.

---

### Pattern 6: Footer Matrix Animation -- Isolated Dynamic Island

**What:** The footer is currently a Server Component. The Matrix animation element should be isolated to a child `FooterMatrixEffect` client component rendered with `next/dynamic(ssr: false)` inside the footer, following the identical pattern as `MatrixRainCanvas`.

**Why dynamic(ssr: false) for the effect, not the whole footer:** The footer's static content (links, copyright, name) remains server-rendered for fast initial HTML. Only the animated element requires client-side hydration. The footer is below the fold on all portfolio pages -- its dynamic island loads after LCP without affecting the score.

**Provider tree position:**

```
PortfolioFooter (Server Component -- keeps 'use server' behavior)
  ├── Static content (name, links, copyright) -- server HTML
  └── FooterMatrixEffect (dynamic, ssr: false) -- client animation island
```

**Structural pattern:**

```tsx
// In footer.tsx (Server Component stays Server)
import dynamic from 'next/dynamic'

const FooterMatrixEffect = dynamic(
  () => import('./footer-matrix-effect'),
  { ssr: false }
)

export function PortfolioFooter() {
  return (
    <footer className="border-t border-matrix-border bg-[#0a0a0a] relative overflow-hidden">
      <FooterMatrixEffect />  {/* loads after LCP, does not block */}
      <div className="relative z-10 ...">
        {/* static content -- server-rendered */}
      </div>
    </footer>
  )
}
```

**Source:** Direct pattern from existing `matrix-rain-canvas.tsx` + `hero-section.tsx` in this codebase. **HIGH confidence.**

---

## Data Flow

### Lenis + GSAP ScrollTrigger Synchronized Loop

```
Browser scroll event (wheel/touch/keyboard)
    |
    v
Lenis intercepts (native scroll suppressed via preventDefault pattern)
    |
    v
GSAP ticker.add() callback fires each frame (~60fps)
    |
    v
lenisRef.current.lenis.raf(time * 1000)
    |
    v
Lenis calculates velocity + lerped position
    |
    v
Lenis emits 'scroll' event
    |
    v
ScrollTrigger.update() recalculates trigger positions
    |
    v
GSAP tweens execute (yPercent, opacity, etc.)
    |
    v
CSS transform applied on compositor thread (no layout reflow)
```

### MagneticButton State Flow

```
User cursor enters MagneticButton bounding box
    |
    v
onMouseMove -> getBoundingClientRect() -> compute delta from center
    |
    v
setPosition({ x, y }) -- React state update
    |
    v
motion.div animate={position} -> spring physics (stiffness 150, damping 15)
    |
    v
motion/react writes CSS transform directly (no re-render per frame after initial)
    |
    v
User cursor leaves -> setPosition({ x: 0, y: 0 }) -> spring returns to origin
```

### Route Change Scroll Flow

```
User clicks Next.js <Link>
    |
    v
Next.js App Router soft navigation (no full reload)
    |
    v
usePathname() value changes in LenisScrollRestorer
    |
    v
useEffect fires -> lenis.scrollTo(0, { immediate: true })
    |
    v
Page snaps to top (no eased animation -- matches native browser behavior)
    |
    v
New page content renders -- ScrollTrigger recalculates positions on next scroll
```

---

## Integration Points -- New vs Modified Explicit

### New Files

| File | What It Does | Why It's New |
|------|-------------|--------------|
| `providers/lenis-provider.tsx` | ReactLenis root provider + GSAP ticker wiring + ScrollTrigger registration | No Lenis or GSAP code exists in codebase yet |
| `components/portfolio/lenis-scroll-restorer.tsx` | Route-change scroll-to-top via useLenis | Required for App Router navigation correctness |
| `components/portfolio/magnetic-button.tsx` | Cursor-attraction wrapper via motion/react spring | New UX component (was deferred in v2.5) |
| `components/portfolio/footer-matrix-effect.tsx` | Animated Matrix element inside footer | Isolated client animation island |

### Modified Files

| File | What Changes | Risk Level |
|------|-------------|------------|
| `app/(portfolio)/layout.tsx` | Add `<LenisProvider>` wrapping `<main>` + `<PortfolioFooter>`; move `<MotionProvider>` inside | LOW -- additive wrapper, no logic changes |
| `app/globals.css` | Add Matrix tokens to `@theme inline`; add new surface/border vars to `:root` | LOW -- purely additive, no existing tokens touched |
| `components/portfolio/footer.tsx` | Add `FooterMatrixEffect` dynamic import; apply Matrix color classes | MEDIUM -- visual change triggers Playwright snapshot updates |
| `components/portfolio/hero-section.tsx` | Wrap CTA buttons with `<MagneticButton>` | LOW -- additive wrapper around existing Button elements |
| `app/(portfolio)/page.tsx` | Optionally wrap section CTAs with `<MagneticButton>` | LOW |
| `app/(portfolio)/contact/page.tsx` | Optionally wrap submit button with `<MagneticButton>` | LOW |

### Files That Do NOT Change

| File | Reason |
|------|--------|
| `app/layout.tsx` | LenisProvider is portfolio-scoped; must not touch root layout |
| `(dashboard)/layout.tsx` | Dashboard scroll must remain native; Lenis must not affect it |
| `components/portfolio/animate-in.tsx` | Existing scroll-reveal stays as motion/react whileInView |
| `components/portfolio/stagger-container.tsx` | No changes -- already correct |
| `components/portfolio/motion-provider.tsx` | No changes -- MotionConfig is just repositioned in layout tree |
| `next.config.ts` | No changes needed |

---

## Build Order

The ordering is dictated by dependencies: Lenis must be running before GSAP ScrollTrigger can be wired to it, and Matrix color tokens must be extended before color harmony work touches components.

```
Phase 1: Lenis Foundation (DEPENDENCY for all scroll animation)
  New:     providers/lenis-provider.tsx
  New:     components/portfolio/lenis-scroll-restorer.tsx
  Modify:  app/(portfolio)/layout.tsx -- add LenisProvider
  Verify:  smooth scroll works on all 5 portfolio URLs
  Gate:    Lighthouse CI >= 0.90, no visual regressions

Phase 2: GSAP ScrollTrigger Parallax (DEPENDS ON Phase 1)
  Register ScrollTrigger in lenis-provider.tsx
  Wire lenis.on('scroll', ScrollTrigger.update) inside LenisProvider
  Apply useGSAP() parallax to: hero section, case study images, about section
  Gate:    Lighthouse CI >= 0.90, CLS = 0 (transform-only rule verified)

Phase 3: Magnetic Buttons (INDEPENDENT of Phases 1-2 but benefits from Lenis being stable)
  New:     components/portfolio/magnetic-button.tsx
  Modify:  hero-section.tsx, contact/page.tsx -- wrap CTAs
  Gate:    Touch devices unaffected, reduced-motion bypasses wrapper entirely

Phase 4: Matrix Color Harmony (INDEPENDENT -- lowest risk)
  Modify:  app/globals.css -- add @theme inline utilities + :root tokens
  Apply:   project cards, case study pages, skills/about, typography, contact
  Gate:    Playwright snapshots update and pass, no purple introduced

Phase 5: Footer Redesign + Matrix Animation (SELF-CONTAINED -- highest visual risk)
  New:     components/portfolio/footer-matrix-effect.tsx
  Modify:  components/portfolio/footer.tsx -- dynamic import + Matrix styling
  Gate:    Lighthouse CI >= 0.90 (footer is below fold -- should not affect LCP)
           Playwright baseline snapshots updated
```

**Why this order:**
- Phase 1 first because GSAP ScrollTrigger requires the Lenis-driven ticker to already be running
- Phase 2 directly after Phase 1 while Lenis wiring is fresh
- Phase 3 is independent but sequential prevents debugging two moving parts simultaneously
- Phase 4 is the safest phase and most additive -- can move earlier if needed
- Phase 5 is last because footer has the highest Playwright snapshot surface area and is fully self-contained

---

## Anti-Patterns

### Anti-Pattern 1: autoRaf: true with GSAP ScrollTrigger

**What people do:** Use `ReactLenis` with default `autoRaf: true` and also initialize ScrollTrigger separately.

**Why it's wrong:** Two separate RAF loops (Lenis's own RAF and GSAP's ticker) run at different times in the frame. ScrollTrigger reads scroll position between Lenis updates, causing stutter on fast scrolls. The symptoms appear as scroll-triggered animations jumping or lagging slightly behind the smooth scroll position.

**Do this instead:** Set `autoRaf: false` on ReactLenis, wire Lenis into `gsap.ticker.add()`, and set `gsap.ticker.lagSmoothing(0)`. This is the pattern documented in the official lenis/react README.

---

### Anti-Pattern 2: Animating Layout Properties with ScrollTrigger

**What people do:** Animate `top`, `left`, `marginTop`, `height`, or `width` with `scrub` to create parallax.

**Why it's wrong:** Layout properties trigger browser reflow on every scroll frame. At 60fps with scrub enabled, this generates 60 reflows per second. Lighthouse will flag this as a CLS violation if any element shifts layout. The Lighthouse CI gate of >= 0.90 will fail.

**Do this instead:** Only animate `transform: translateY(...)` via GSAP's `yPercent` or `y`, and `opacity`. These are compositor-thread properties that never trigger layout. The `overflow-hidden` on the container prevents the transformed element from affecting surrounding layout.

---

### Anti-Pattern 3: Placing LenisProvider in Root Layout

**What people do:** Add LenisProvider to `app/layout.tsx` so it wraps all routes including the dashboard.

**Why it's wrong:** The TeamFlow dashboard uses a complex layout with sidebar scroll areas, virtual scroll in TanStack Table, and Socket.io real-time updates. Lenis intercepts all native scroll globally. This breaks dashboard scroll behavior in non-obvious ways and is difficult to debug.

**Do this instead:** Place LenisProvider exclusively inside `(portfolio)/layout.tsx` inside the `.matrix-theme` div. Dashboard routes in `(dashboard)/layout.tsx` are completely unaffected by portfolio animation providers.

---

### Anti-Pattern 4: Converting PortfolioFooter to a Full Client Component

**What people do:** Add `'use client'` directly to `footer.tsx` to add animations.

**Why it's wrong:** The footer's static content (links, name, copyright) would be excluded from the server-rendered HTML. This delays the footer's initial render until client-side hydration, increasing Time to Interactive. It also violates the established pattern in this codebase.

**Do this instead:** Keep `footer.tsx` as a Server Component. Use `next/dynamic(ssr: false)` to load only the animated effect child (`FooterMatrixEffect`) as a client component. This is identical to how `MatrixRainCanvas` is handled in `hero-section.tsx`.

---

### Anti-Pattern 5: Applying MagneticButton to Navigation or Mobile-Primary Elements

**What people do:** Wrap nav links or all buttons globally with MagneticButton.

**Why it's wrong:** Mouse events do not fire on touch devices. The motion.div wrapper adds DOM nodes and JS bundle cost to mobile users who get no benefit. Navigation elements also have tight tap targets on mobile that the magnetic offset could interfere with.

**Do this instead:** Apply `MagneticButton` only to desktop-visible CTAs (hero buttons, contact button). Check `useReducedMotion()` and return children directly when true. The component should only be used on elements where the magnetic effect is visible to a hover-capable device.

---

## Scaling Considerations (Lighthouse CI Budget Focus)

This is a portfolio site. The relevant "scaling" concern is the Lighthouse CI performance gate.

| Concern | Current Budget | Integration Impact | Mitigation |
|---------|---------------|-------------------|------------|
| Lighthouse Performance | >= 0.90 on 5 URLs | Lenis adds ~10KB gzipped | Package already installed -- zero new bundle delta |
| Lighthouse Performance | >= 0.90 | GSAP + ScrollTrigger ~20KB | Package already installed -- zero new bundle delta |
| CLS | Must not regress | GSAP parallax on layout props | Transform-only rule -- `yPercent`/`y`/`opacity` only |
| LCP | Must not regress | Footer animation below fold | `dynamic(ssr: false)` defers load until after hydration |
| Playwright snapshots | 18 PNG baselines exist | Footer + color changes will diff | Update baselines deliberately per phase; do not auto-approve all diffs |
| Reduced motion | Three-layer gate active | All new animations must respect it | `useReducedMotion()` in every new animated component |
| Touch / mobile | `any-hover` pattern established | MagneticButton on touch | `useReducedMotion()` guard + mousemove never fires on touch |

---

## SSR / Hydration Constraints Summary

All animation code in this integration runs client-side only. The constraints are:

1. **`'use client'` required on:** LenisProvider, LenisScrollRestorer, MagneticButton, FooterMatrixEffect
2. **`next/dynamic(ssr: false)` required on:** FooterMatrixEffect -- same reason as MatrixRainCanvas: canvas or animation that cannot meaningfully render server-side
3. **`useReducedMotion()` must guard all new animated components:** MagneticButton (already shown), FooterMatrixEffect (needs RAF check matching MatrixRainCanvas pattern), any useGSAP parallax component
4. **No `window` access at render time:** LenisProvider's Lenis initialization happens inside `useEffect` -- already safe. MagneticButton only reads `getBoundingClientRect` on mouse events -- already safe.
5. **`ReactLenis root` prop:** When `root={true}`, Lenis attaches to the `<html>` element and makes the instance globally accessible via `useLenis()`. LenisScrollRestorer uses `useLenis()` and must be a descendant of LenisProvider -- this is guaranteed by the layout tree position.

---

## Sources

- [darkroomengineering/lenis GitHub monorepo -- packages/react README](https://github.com/darkroomengineering/lenis/blob/main/packages/react/README.md) — ReactLenis API, `root` prop, `autoRaf: false`, `useLenis` hook, GSAP ticker pattern (HIGH confidence)
- [darkroomengineering/lenis issue #319](https://github.com/darkroomengineering/lenis/issues/319) — Scroll restoration on navigation -- confirmed pattern (HIGH confidence)
- [GSAP React documentation -- useGSAP hook](https://gsap.com/resources/React/) — useGSAP cleanup, ScrollTrigger setup/teardown, Strict Mode handling (HIGH confidence)
- [GSAP ScrollTrigger + Lenis GSAP forum](https://gsap.com/community/forums/topic/40426-patterns-for-synchronizing-scrolltrigger-and-lenis-in-reactnext/) — synchronized ticker pattern (MEDIUM confidence)
- [Olivier Larose -- Magnetic Button tutorial](https://blog.olivierlarose.com/tutorials/magnetic-button) — GSAP vs Framer Motion magnetic comparison, code patterns (MEDIUM confidence)
- Existing codebase direct inspection: `apps/web/app/(portfolio)/layout.tsx`, `apps/web/app/globals.css`, `apps/web/components/portfolio/matrix-rain-canvas.tsx`, `apps/web/components/portfolio/evervault-card.tsx`, `apps/web/components/portfolio/dot-grid-spotlight.tsx`, `apps/web/package.json` (HIGH confidence)

---

*Architecture research for: v3.1 Portfolio Polish & Matrix Cohesion -- Lenis, GSAP ScrollTrigger, magnetic buttons, Matrix color system integration*
*Researched: 2026-02-20*
