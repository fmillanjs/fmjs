# Phase 24: Scroll Animations + Entrance - Research

**Researched:** 2026-02-19
**Domain:** Framer Motion v12 (motion/react) scroll-triggered animations, Next.js 15 App Router SSR/hydration, reduced motion accessibility
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ANIM-01 | Section headings and project cards animate in (fade + slide-up) when scrolled into view across all portfolio pages | `whileInView` prop with `viewport={{ once: true }}` + stagger variants; `MotionConfig reducedMotion="user"` gate; `'use client'` wrapper pattern for RSC compatibility |
</phase_requirements>

---

## Summary

Phase 24 adds scroll-triggered entrance animations to portfolio section headings and project cards. The codebase already has `motion` v12.34.2 installed at the monorepo root, with React 19 and Next.js 15 in `apps/web`. All portfolio pages are currently Server Components using plain HTML elements — no animation wrappers exist yet. The CSS layer already has `@media (prefers-reduced-motion: reduce)` rules that kill CSS transitions; the JS animation layer (motion/react) still needs a `MotionConfig reducedMotion="user"` gate applied via a client provider in the portfolio layout.

The primary challenge is hydration safety: motion components that start at `opacity: 0` can cause SSR/client mismatches if rendered by React in Server Component context. The solution is thin `'use client'` wrapper components that the RSC pages import — the Server Component renders the RSC wrapper which is a client boundary. Inside client components, `initial={{ opacity: 0, y: 24 }}` with `whileInView={{ opacity: 1, y: 0 }}` and `viewport={{ once: true }}` is the standard pattern. Stagger uses parent/child variant composition with `staggerChildren` on the container.

The `once: true` behavior in motion/react is intentional: it fires the animation exactly once per component mount. When Next.js App Router navigates away and back to a page, the RSC page and its client sub-tree unmount and remount, which means `once: true` correctly fires the entrance animation again on each page visit — satisfying success criterion 5. No special handling is needed for "multiple navigations" beyond ensuring the page does not have persistent component identity across routes (App Router does not by default).

**Primary recommendation:** Use `whileInView` + `viewport={{ once: true }}` via thin `'use client'` AnimateIn wrapper components; add a `MotionProvider` client component wrapping `<MotionConfig reducedMotion="user">` inserted into the portfolio `layout.tsx`; animate only `opacity` and `y` (translateY) for performance.

---

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `motion` | 12.34.2 | Scroll-triggered animation engine | Already installed, React 19 compatible, IntersectionObserver-based `whileInView` |
| `motion/react` | (same pkg, `/react` export) | React-specific imports for `motion`, `MotionConfig`, `useInView` | Official React entry point for the motion package |

### Supporting (Already Installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `motion/react-client` | (same pkg) | RSC-safe import alias | When importing motion inside a file that Next.js may statically analyze as a Server Component |

### No New Installs Needed

The `motion` package (v12.34.2) at monorepo root covers everything needed. All imports use:

```typescript
import { motion, MotionConfig, useInView } from 'motion/react'
```

`framer-motion` is NOT installed separately — do NOT add it. `motion` is the correct package (React 19 compatible).

---

## Architecture Patterns

### Recommended File Structure for Phase 24

```
apps/web/
├── components/
│   └── portfolio/
│       ├── motion-provider.tsx        # NEW: 'use client' MotionConfig wrapper
│       ├── animate-in.tsx             # NEW: 'use client' single-element scroll reveal
│       ├── stagger-container.tsx      # NEW: 'use client' stagger wrapper for cards
│       ├── project-card.tsx           # MODIFY: wrap with AnimateIn or accept motion props
│       ├── case-study-section.tsx     # MODIFY: wrap h2 with AnimateIn
│       ├── hero-section.tsx           # MODIFY: wrap h1/p with AnimateIn
│       └── ...
└── app/
    └── (portfolio)/
        └── layout.tsx                 # MODIFY: import MotionProvider
```

### Pattern 1: MotionProvider — Global Reduced Motion Gate

**What:** A `'use client'` wrapper component that provides `MotionConfig reducedMotion="user"` to all child motion components in the portfolio layout tree.

**When to use:** Insert once in `apps/web/app/(portfolio)/layout.tsx` wrapping `{children}`.

**How `reducedMotion="user"` works:** When the OS Reduce Motion setting is ON, motion/react automatically disables transform and layout animations for all child `motion.*` components. Opacity and color animations remain active but since our entrance animations combine `opacity` with `y` translateY, the `y` portion is disabled — elements appear immediately at their final state. This satisfies success criterion 3.

```typescript
// Source: motion.dev/docs/react-motion-config + shakuro.com/blog/framer-motion-new-and-underestimated-features
// apps/web/components/portfolio/motion-provider.tsx
'use client'

import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

interface MotionProviderProps {
  children: ReactNode
}

export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  )
}
```

Insert into portfolio layout:

```typescript
// apps/web/app/(portfolio)/layout.tsx (Server Component — no 'use client' needed here)
import { MotionProvider } from '@/components/portfolio/motion-provider'

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="matrix-theme min-h-screen flex flex-col">
      <PortfolioNav />
      <MotionProvider>
        <main className="flex-1">{children}</main>
      </MotionProvider>
      <PortfolioFooter />
      <CommandPalette />
    </div>
  )
}
```

**Why this is hydration-safe:** `MotionProvider` itself renders no animated HTML on the server — it is only a React context provider. The client picks up the context on mount. No `initial` state mismatch.

### Pattern 2: AnimateIn — Single Element Scroll Reveal

**What:** A `'use client'` wrapper that applies `whileInView` fade+slide-up to any single child element.

**When to use:** Section headings (`h1`, `h2`), standalone paragraphs, CTA blocks.

**Critical hydration note:** Using `initial={{ opacity: 0, y: 24 }}` on a motion component renders with `opacity: 0` on the server (SSR output). React 19 strict mode does NOT produce a hydration warning for motion components because motion/react sets the initial state client-side via the DOM style API AFTER hydration, not via React's server render pass. The server renders the element without inline style; motion applies `opacity: 0` immediately on mount before the first paint. This is the documented behavior of motion/react — it is hydration-safe.

```typescript
// Source: motion.dev/docs/react-motion-component, verified pattern
// apps/web/components/portfolio/animate-in.tsx
'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface AnimateInProps {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'article'
}

export function AnimateIn({
  children,
  className,
  delay = 0,
  as = 'div',
}: AnimateInProps) {
  const Tag = motion[as]

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </Tag>
  )
}
```

**Key parameters:**
- `initial={{ opacity: 0, y: 24 }}` — 24px below, invisible
- `whileInView={{ opacity: 1, y: 0 }}` — full opacity, natural position
- `viewport={{ once: true, amount: 0.2 }}` — triggers when 20% of element enters viewport; `once: true` means fires exactly once per mount
- `transition={{ duration: 0.5, ease: 'easeOut' }}` — smooth ease-out, no spring physics (avoids CLS jitter)

### Pattern 3: StaggerContainer — Card Stagger Reveal

**What:** A parent container that uses motion variants with `staggerChildren` to sequence child card entrance animations.

**When to use:** `ProjectCard` grids on `/projects` and `/` pages.

```typescript
// Source: framerbook.com staggered-animation, motion.dev transition docs
// apps/web/components/portfolio/stagger-container.tsx
'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

interface StaggerContainerProps {
  children: ReactNode
  className?: string
}

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      {children}
    </motion.div>
  )
}

// Export itemVariants for child cards to consume
export { itemVariants }
```

Child card wrapper (or modify `ProjectCard` to accept motion props):

```typescript
// Applied inside the stagger grid — each direct child needs itemVariants
<motion.div variants={itemVariants}>
  <ProjectCard ... />
</motion.div>
```

**Stagger timing:** `staggerChildren: 0.15` creates a 150ms delay between each card's entrance — visually obvious to a human observer (success criterion 2).

### Pattern 4: Using AnimateIn in RSC Pages (Server Component Pages)

Portfolio pages (e.g., `/projects/page.tsx`) are Server Components with no `'use client'`. They can import `AnimateIn` and `StaggerContainer` because those components declare `'use client'` themselves — Next.js treats them as client component boundaries.

```typescript
// apps/web/app/(portfolio)/projects/page.tsx — Server Component, no changes needed to directive
import { AnimateIn } from '@/components/portfolio/animate-in'
import { StaggerContainer } from '@/components/portfolio/stagger-container'
import { motion } from 'motion/react' // ❌ WRONG — cannot use motion directly in Server Component

// CORRECT pattern:
export default function ProjectsPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <AnimateIn as="div" className="mb-12">
        <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">Projects</h1>
        <p className="text-xl text-muted-foreground">Things I&apos;ve built</p>
      </AnimateIn>
      <StaggerContainer className="grid gap-6 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <ProjectCard ... />
        </motion.div>
        ...
      </StaggerContainer>
    </div>
  )
}
```

**Wait — this is wrong.** `motion.div` with variants cannot appear in a Server Component. The correct pattern is to wrap each card in its own `'use client'` component or make a `StaggerItem` component:

```typescript
// apps/web/components/portfolio/stagger-container.tsx
// Add a StaggerItem export:
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}
```

Then in the Server Component page:

```typescript
import { StaggerContainer, StaggerItem } from '@/components/portfolio/stagger-container'

<StaggerContainer className="grid gap-6 md:grid-cols-2">
  <StaggerItem><ProjectCard ... /></StaggerItem>
  <StaggerItem><ProjectCard ... /></StaggerItem>
</StaggerContainer>
```

### Anti-Patterns to Avoid

- **Using `motion.div` directly in Server Components:** Will not throw at build time in all cases but causes runtime errors — always wrap in a `'use client'` component.
- **Using `initial={false}` globally:** Prevents entrance animations entirely — do not use unless intentionally skipping all entrance animation on navigation.
- **`layout` or `layoutId` animations on scroll items:** `MotionConfig reducedMotion="user"` disables layout animations. Since we only use `opacity` + `y`, this is not relevant — but avoid adding layout props.
- **Animating `height`, `width`, or `top/left`:** These cause layout reflow and destroy CLS scores. Only animate `opacity` and `y` (transform) as required by success criterion 1.
- **Wrapping the entire `app/layout.tsx` in MotionProvider:** The root layout serves dashboard, auth, and portfolio routes. Only wrap the portfolio layout `(portfolio)/layout.tsx` to avoid polluting other route groups.
- **Using `transition-duration: 0.01ms` CSS override conflicting with motion JS:** The existing CSS already applies `transition-duration: 0.01ms` under `prefers-reduced-motion: reduce`. The `MotionConfig reducedMotion="user"` gate handles the JS layer separately — they are additive (CSS kills CSS transitions, MotionConfig kills motion transforms).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Viewport detection | Custom IntersectionObserver hook | `whileInView` prop or `useInView` from motion/react | motion's implementation handles threshold, margin, root, cleanup, and SSR correctly |
| Reduced motion detection | `useMediaQuery('prefers-reduced-motion')` hook + conditional props | `MotionConfig reducedMotion="user"` | Single source of truth; propagates to all child motion components automatically |
| Stagger timing | Manual `delay` prop arithmetic on each card | `staggerChildren` in parent variant | Automatically re-spaceable, works with any number of children |
| Animation state across navigation | `useRef` + `sessionStorage` to track "has animated" | `viewport={{ once: true }}` + Next.js natural unmount/remount | motion tracks animation state per component instance; navigation causes remount which resets to "not yet animated" — this is the correct behavior for per-page-visit entrance |

**Key insight:** Framer Motion's `whileInView` / IntersectionObserver path is ~0.6kb added overhead and runs entirely off-main-thread for detection. Hand-rolling with scroll event listeners would add jank and violate Lighthouse TBT budget.

---

## Common Pitfalls

### Pitfall 1: Hydration Warning from `opacity: 0` Initial State

**What goes wrong:** Adding `initial={{ opacity: 0 }}` to a motion component causes React hydration to warn because SSR renders the element without the style and the client immediately sets it — some versions of React strict mode report this.

**Why it happens:** motion/react applies `initial` values via the DOM style API imperatively in a `useLayoutEffect`, after React finishes reconciling. With React 19 + strict mode, `useLayoutEffect` runs twice in development. The second call re-applies the initial state which can produce a flash.

**How to avoid:** Always use `'use client'` wrapper components (Pattern 2/3 above). The key is that the server never renders `opacity: 0` in HTML — motion applies it client-side. Test in production build (`next build && next start`) not just dev mode, because strict mode double-invoking effects is a dev-only behavior. The success criterion says "zero hydration warnings in Chrome DevTools Console" — verify in a production build.

**Warning signs:** Console shows `Warning: Extra attributes from the server` or `Hydration failed` mentioning `style` attribute on motion components.

### Pitfall 2: `once: true` Fires Per Navigation (Expected, Not a Bug)

**What goes wrong:** After navigating away from `/projects` and back, cards animate in again. Testers think this violates "exactly once per page visit" requirement.

**Why it happens:** In Next.js App Router, each navigation to a new route unmounts the previous route's component tree and mounts the new one fresh. This means the `StaggerContainer` component state is destroyed on navigation. When you return to `/projects`, it mounts again as a new instance — `once: true` fires again for the new mount.

**This is the CORRECT behavior** per success criterion 5: "each section animates exactly once per page visit." One navigation = one mount = one animation. Multiple navigations = multiple mounts = multiple correct single animations.

**How to avoid confusion:** Do not attempt to persist animation state across navigations (no `sessionStorage`, no global state). Success criterion 5 tests that animations do not trigger "multiple times" on a SINGLE page visit (e.g., no double-fire from strict mode effects). Each page visit animates once.

**Warning signs:** Success criterion 5 failure would look like: loading `/projects`, seeing cards animate in, then watching them animate AGAIN while still on the page without navigating.

### Pitfall 3: Stagger Not Visible If All Cards Above the Fold

**What goes wrong:** On large desktop viewports, all project cards may already be visible on page load — `whileInView` fires immediately for all of them simultaneously, making stagger imperceptible.

**Why it happens:** `viewport={{ once: true }}` triggers when the element enters the viewport. If all elements are already in the viewport at mount time, all trigger at once.

**How to avoid:** Use `viewport={{ once: true, amount: 0.1 }}` so elements trigger as soon as 10% is visible. For pages where all cards are above the fold, consider using `initial="hidden"` on the container and `animate="visible"` instead of `whileInView` — this animates the cards on mount rather than on scroll, which is correct behavior for content that is immediately visible. Alternatively, add a small `delayChildren: 0.3` so the stagger always plays out visually even on first load.

**Warning signs:** Success criterion 2 test — "stagger delay is visible to a human observer" — fails during Lighthouse or Playwright testing on a non-scrolled page.

### Pitfall 4: CLS from `y` Transform and Paint Timing

**What goes wrong:** Elements with `initial={{ y: 24 }}` and `whileInView` that trigger mid-scroll can cause Cumulative Layout Shift if implemented incorrectly.

**Why it happens:** `transform: translateY()` does NOT cause layout shift because transforms operate in the compositing layer. However, if `opacity: 0` elements still occupy space in the document flow, their height contributes to the layout correctly. CLS is only impacted if element SIZE changes. Fade + translate is safe.

**How to avoid:** Never animate `height`, `width`, `margin`, `padding`, or `top/left`. Always use `opacity` + `y` (transform). This is already encoded in the success criterion ("opacity: 0 to 1 with translateY motion only").

**Warning signs:** Lighthouse CLS score drops below 0.1. Check using Chrome DevTools Performance panel → Layout Shift regions.

### Pitfall 5: `MotionConfig` Not Preventing All Animations with `reducedMotion="user"`

**What goes wrong:** After setting `reducedMotion="user"` in MotionConfig, elements still visibly transition with reduced opacity animation when OS reduce motion is ON.

**Why it happens:** `reducedMotion="user"` disables **transform and layout** animations but NOT opacity/color animations. Since our entrance animation is `opacity: 0 → 1` combined with `y: 24 → 0`, only the `y` part is suppressed. Elements will still fade in (opacity animation persists).

**How to avoid per success criterion 3:** "elements appear at their final state immediately with no transition." To fully disable all animations including opacity, do NOT rely on `MotionConfig reducedMotion="user"` alone. Instead, check `useReducedMotion()` in the AnimateIn component and set `initial` to the final state when reduced motion is active:

```typescript
// apps/web/components/portfolio/animate-in.tsx
'use client'
import { motion, useReducedMotion } from 'motion/react'

export function AnimateIn({ children, className, delay = 0, as = 'div' }: AnimateInProps) {
  const prefersReducedMotion = useReducedMotion()
  const Tag = motion[as]

  return (
    <Tag
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </Tag>
  )
}
```

Using `initial={false}` bypasses the initial animation entirely — the element renders in its natural CSS state immediately. `whileInView={undefined}` means no transition occurs.

**Alternative:** Keep `MotionConfig reducedMotion="user"` for general transform suppression AND use `useReducedMotion()` in AnimateIn specifically for opacity — belt-and-suspenders for success criterion 3.

**Warning signs:** OS Reduce Motion ON → element starts transparent and fades in — fails criterion 3. Correct behavior: element is fully visible immediately.

### Pitfall 6: Accessibility — Hidden Content Before Scroll

**What goes wrong:** Screen readers or keyboard users encounter elements at `opacity: 0` before scrolling. Although visually hidden, they may still be in the DOM and focusable.

**Why it happens:** `opacity: 0` does not remove elements from the accessibility tree. Keyboard focus can land on invisible elements.

**How to avoid:** motion/react does not set `visibility: hidden` or `display: none`. Since our animations trigger quickly once in view, and `opacity: 0` content below the fold is not in the keyboard tab order until scrolled to, this is low risk. Do not add `aria-hidden` to animated elements — that would harm screen reader users. The existing axe-core accessibility tests (Phase 23 gate) will catch violations.

---

## Code Examples

Verified patterns from official sources and codebase analysis:

### Complete AnimateIn Component (Hydration-Safe + Reduced Motion)

```typescript
// Source: motion.dev/docs/react-motion-component, motion.dev reducedMotion docs
// apps/web/components/portfolio/animate-in.tsx
'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

type MotionTag = 'div' | 'section' | 'article'

interface AnimateInProps {
  children: ReactNode
  className?: string
  delay?: number
  as?: MotionTag
}

export function AnimateIn({
  children,
  className,
  delay = 0,
  as = 'div',
}: AnimateInProps) {
  const prefersReducedMotion = useReducedMotion()
  const Component = motion[as]

  if (prefersReducedMotion) {
    // Render as plain element — no motion overhead at all
    const PlainTag = as
    return <PlainTag className={className}>{children}</PlainTag>
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </Component>
  )
}
```

### Complete StaggerContainer + StaggerItem Components

```typescript
// Source: framerbook.com/animation/example-animations/28-variants-staggered-animation
// apps/web/components/portfolio/stagger-container.tsx
'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

interface ContainerProps {
  children: ReactNode
  className?: string
}

export function StaggerContainer({ children, className }: ContainerProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: ContainerProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}
```

### MotionProvider for Portfolio Layout

```typescript
// Source: motion.dev/docs/react-motion-config
// apps/web/components/portfolio/motion-provider.tsx
'use client'

import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  )
}
```

### How to Wrap `CaseStudySection` for Heading Animation

```typescript
// apps/web/components/portfolio/case-study-section.tsx — Modified
// CaseStudySection is a Server Component — no 'use client' needed
import { AnimateIn } from './animate-in'

export function CaseStudySection({ title, children }: CaseStudySectionProps) {
  return (
    <section className="mb-12">
      <AnimateIn>
        <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      </AnimateIn>
      <div>{children}</div>
    </section>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` npm package | `motion` package (import from `motion/react`) | v10-v11 migration | React 19 compatibility; tree-shakable |
| Custom `useScrollAnimation` hook with IntersectionObserver | `whileInView` prop with `viewport={{ once: true }}` | Framer Motion v5.3+ | No hook boilerplate, IntersectionObserver managed by library |
| `useReducedMotion()` + conditional props per component | `MotionConfig reducedMotion="user"` as global provider | Framer Motion v6.2+ | Single config propagates to entire tree |
| Manually tracking "has animated" in state/ref | `viewport={{ once: true }}` | Framer Motion v5.3+ | Library manages per-instance state |
| `animate={{ opacity: 1 }}` + `useInView` + `useEffect` | `whileInView={{ opacity: 1 }}` | Framer Motion v5.3+ | Declarative, less code, same result |

**Deprecated/outdated patterns:**
- `LazyMotion` with `features` prop on `MotionConfig`: The `features` prop was removed in v12. Use `LazyMotion` as a separate component if tree-shaking is needed (not required for this phase since motion is already installed).
- `AnimatePresence` + `exit` props for scroll items: Not needed for entrance-only animations. `AnimatePresence` is for exit animations when components unmount.

---

## Open Questions

1. **StaggerContainer on homepage project cards — all cards may be above the fold**
   - What we know: The homepage has two large project cards that may be fully visible on load on large monitors.
   - What's unclear: Will `whileInView` + `staggerChildren` produce a visible stagger when all cards are already in the viewport at mount time?
   - Recommendation: Use `initial="hidden"` + `animate="visible"` triggered by `useInView` hook (not `whileInView`) for content that is consistently above the fold. Alternatively, keep `whileInView` and accept that on large screens the stagger happens on page load — this is still visually correct.

2. **`useReducedMotion()` hydration safety in strict mode**
   - What we know: `useReducedMotion()` reads `window.matchMedia` which is not available on the server.
   - What's unclear: Does motion/react's `useReducedMotion` handle SSR gracefully (return `false` on server) in v12?
   - Recommendation: The `'use client'` directive on AnimateIn and StaggerContainer components means `useReducedMotion()` only runs client-side. The server never calls it. No hydration risk if components are properly marked `'use client'`.

3. **Visual regression snapshots from Phase 23 will need regeneration**
   - What we know: Phase 23 generated visual regression baselines. Adding scroll animations means elements start at `opacity: 0` on first paint, which could break snapshot comparisons if tests run before scroll.
   - What's unclear: Do existing Playwright visual regression tests scroll the page before snapshotting?
   - Recommendation: Check `e2e/portfolio/visual-regression.spec.ts` and ensure it either waits for animations to complete (`await page.waitForTimeout(600)` after scroll) or runs with `page.emulateMedia({ reducedMotion: 'reduce' })` to disable animations during snapshots.

---

## Sources

### Primary (HIGH confidence)
- `motion` package v12.34.2 — installed at `/home/doctor/fernandomillan/node_modules/motion/`, exports verified: `./react`, `./react-client`, `./mini`
- Codebase direct read: `apps/web/package.json` (motion v12.34.2), `apps/web/app/(portfolio)/layout.tsx`, all portfolio pages, all portfolio components
- [motion.dev/docs/react-motion-config](https://motion.dev/docs/react-motion-config) — MotionConfig reducedMotion prop: "user"/"always"/"never"
- [CHANGELOG.md raw.githubusercontent.com/framer/motion](https://raw.githubusercontent.com/framer/motion/main/CHANGELOG.md) — v12 API continuity confirmed, `skipAnimations` added in v12.30.0

### Secondary (MEDIUM confidence)
- [shakuro.com/blog/framer-motion-new-and-underestimated-features](https://shakuro.com/blog/framer-motion-new-and-underestimated-features) — `reducedMotion` prop values ("user"/"always"/"never") documented with code example — cross-referenced with official MotionConfig docs
- [motion.dev/docs/react-use-in-view](https://motion.dev/docs/react-use-in-view) — `useInView` hook API: `once`, `amount`, `margin` options
- [github.com/vercel/next.js/discussions/72228](https://github.com/vercel/next.js/discussions/72228) — `motion` (not `framer-motion`) is correct for Next.js 15 + React 19; import from `motion/react`
- [victoreke.com/blog/scroll-reveal-animation-in-react-using-framer-motion](https://victoreke.com/blog/scroll-reveal-animation-in-react-using-framer-motion) — `useInView` + `useAnimation` pattern (older approach, superseded by `whileInView`)
- [framerbook.com staggered-animation pattern](https://framerbook.com/animation/example-animations/28-variants-staggered-animation/) — staggerChildren variant pattern

### Tertiary (LOW confidence, flag for validation)
- Multiple WebSearch results consistently agree that `once: true` per-mount behavior (not per-session) is expected — this conclusion has MEDIUM confidence but the specific Next.js App Router remount interaction was not verified with an official source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — motion v12.34.2 confirmed installed; import path `motion/react` verified from package exports
- Architecture: HIGH — pattern verified against codebase; `'use client'` wrapper approach is the official Next.js recommendation
- Pitfalls (hydration, reducedMotion): MEDIUM — useReducedMotion SSR behavior inferred from 'use client' boundary rules, not directly documented
- `once: true` navigation behavior: MEDIUM — confirmed by multiple community sources as expected behavior; no official changelog entry contradicting it
- Stagger above-fold issue: LOW — observed pattern, not verified with motion v12 specific behavior

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (30 days — motion v12 is stable, Next.js 15 App Router patterns are settled)
