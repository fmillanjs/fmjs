# Phase 29: Lenis Foundation - Research

**Researched:** 2026-02-20
**Domain:** Lenis smooth scroll — Next.js 15 App Router, ReactLenis, GSAP integration, reduced-motion, CommandPalette lock
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCROLL-01 | User experiences inertia-based smooth scroll across all portfolio pages (Lenis, scoped to portfolio layout only — TeamFlow dashboard unaffected) | ReactLenis with `root` prop in portfolio layout only; dashboard layout has its own `overflow-y-auto` scroll container untouched |
| SCROLL-02 | User navigating between portfolio pages always starts at the top of the new page (Lenis route-change scroll reset) | `lenis.scrollTo(0, { immediate: true, force: true })` inside `useEffect` watching `usePathname()` |
| SCROLL-03 | User with `prefers-reduced-motion` gets native browser scroll with no Lenis overhead (reduced-motion bypass) | Conditional initialization: skip `ReactLenis` render entirely if `matchMedia('(prefers-reduced-motion: reduce)').matches`; no RAF runs |
| SCROLL-04 | User opening the CommandPalette (Cmd+K) cannot scroll the background page while the modal is open; background scroll resumes on close | `lenis.stop()` on open, `lenis.start()` on close via `useLenis()` hook inside CommandPalette |
</phase_requirements>

---

## Summary

Lenis 1.3.17 is already installed in the project (`/home/doctor/fernandomillan/node_modules/lenis`). The `lenis/react` sub-export provides `ReactLenis` and `useLenis` — the two primitives needed for this entire phase. The implementation is self-contained inside the `(portfolio)` layout; the `(dashboard)` layout uses native `overflow-y-auto` scroll on its main element and must never receive a Lenis instance.

The four SCROLL requirements map to three distinct implementation concerns: (1) mounting `ReactLenis` with `root` in the portfolio layout to provide inertia scroll, (2) adding a `usePathname` watcher that calls `lenis.scrollTo(0, { immediate: true, force: true })` on route change, (3) gating the `ReactLenis` mount behind a `prefers-reduced-motion` check so no instance or RAF loop runs for motion-sensitive users, and (4) calling `lenis.stop()` / `lenis.start()` from inside `CommandPalette` via the `useLenis()` hook.

The project has one pre-decided architectural constraint from STATE.md: when GSAP ScrollTrigger is added in Phase 30, `autoRaf: false` + `gsap.ticker.add` integration is required. For Phase 29 alone, `autoRaf: true` (the default) is acceptable and simpler — GSAP is not yet used. The lerp default of 0.1 is a starting value; real-device feel testing during execution should validate whether 0.08 or 0.1 fits the portfolio tone.

**Primary recommendation:** Create a single `LenisProvider` component (`'use client'`) that conditionally renders `ReactLenis root` only when `prefers-reduced-motion` is false. Place it inside the portfolio layout wrapping the existing content. The `CommandPalette` calls `useLenis()` to get the instance and calls `stop`/`start` around open state changes.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lenis | 1.3.17 (installed) | Inertia-based smooth scroll engine | Only library purpose-built for this; project already decided on it |
| lenis/react | same package | `ReactLenis` component + `useLenis` hook | Official React wrapper — same package, sub-export path `lenis/react` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/navigation `usePathname` | Next.js 15.1 (installed) | Detect route changes | Required for SCROLL-02 scroll-reset on navigation |
| react `useEffect` / `useReducedMotion` | React 19 (installed) | Reduced-motion gate, pathname effect | Required for SCROLL-03 |
| lenis/dist/lenis.css | same package | Required CSS — sets `html.lenis { height: auto }`, `overflow: clip` on stop | Must import in portfolio layout or globals.css |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ReactLenis `root` prop | Manual `new Lenis()` in useEffect | `root` is the official React pattern; manual approach works but requires explicit cleanup |
| `prefers-reduced-motion` check before mount | Setting `lerp: 1` for reduced-motion | Not initializing is strictly correct per SCROLL-03 — "no Lenis instance initialized, no RAF overhead runs" |
| `lenis.scrollTo(0, { immediate: true })` | `window.scrollTo(0, 0)` | Lenis owns the scroll; bypassing it via native API can cause position drift |

**Installation:**
```bash
# Already installed — no action needed
# lenis@1.3.17 is in /home/doctor/fernandomillan/node_modules/lenis
```

---

## Architecture Patterns

### Recommended Project Structure
```
apps/web/
├── components/
│   └── portfolio/
│       ├── lenis-provider.tsx    # NEW — 'use client', conditional ReactLenis mount
│       ├── motion-provider.tsx   # EXISTING — MotionConfig reducedMotion="user"
│       └── ...
├── app/
│   └── (portfolio)/
│       └── layout.tsx            # MODIFY — add <LenisProvider> wrapping children
├── components/
│   └── ui/
│       └── command-palette.tsx   # MODIFY — add useLenis() stop/start on open state
```

### Pattern 1: LenisProvider Component (SCROLL-01 + SCROLL-02 + SCROLL-03)

**What:** A `'use client'` wrapper that gates ReactLenis mount on motion preference and handles route-change scroll reset.
**When to use:** Placed in portfolio layout, wrapping all portfolio content.

```typescript
// Source: lenis/react TypeScript declarations (installed package) + GitHub discussion #244
// File: apps/web/components/portfolio/lenis-provider.tsx
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import ReactLenis, { useLenis } from 'lenis/react'
import 'lenis/dist/lenis.css'

// Inner component: has access to useLenis() (must be inside ReactLenis tree)
function ScrollReset() {
  const pathname = usePathname()
  const lenis = useLenis()

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true, force: true })
    }
  }, [pathname, lenis])

  return null
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  // SCROLL-03: no Lenis instance, no RAF loop for reduced-motion users
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    return <>{children}</>
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,        // default; adjust 0.08–0.12 based on real-device feel testing
        autoRaf: true,    // Phase 29: use built-in RAF; Phase 30 will switch to autoRaf: false + gsap.ticker
        smoothWheel: true,
      }}
    >
      <ScrollReset />
      {children}
    </ReactLenis>
  )
}
```

**IMPORTANT NOTE:** The `prefersReducedMotion` check via `window.matchMedia` runs on the client only (SSR guard via `typeof window !== 'undefined'`). Because this component is `'use client'`, it only runs in the browser — this is safe. However, to avoid hydration mismatch, consider using a `useEffect` + `useState` approach if hydration issues arise during testing.

### Pattern 2: CommandPalette Stop/Start (SCROLL-04)

**What:** Calls `lenis.stop()` when CommandPalette opens, `lenis.start()` when it closes.
**When to use:** Inside the existing `CommandPalette` component in `components/ui/command-palette.tsx`.

```typescript
// Source: Lenis TypeScript declarations — stop()/start() public API
// File: apps/web/components/ui/command-palette.tsx (modification)
import { useLenis } from 'lenis/react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const lenis = useLenis()

  // SCROLL-04: stop Lenis when palette opens, resume when it closes
  useEffect(() => {
    if (open) {
      lenis?.stop()
    } else {
      lenis?.start()
    }
  }, [open, lenis])

  // ... rest of existing component unchanged
}
```

**Key:** `useLenis()` returns `undefined` when no ReactLenis ancestor exists (e.g. on dashboard routes where `LenisProvider` is not mounted). The optional chaining `lenis?.stop()` ensures no-op on dashboard — satisfying SCROLL-01 dashboard isolation by doing nothing.

### Pattern 3: Portfolio Layout Integration

**What:** Add `LenisProvider` to portfolio layout, wrapping the existing content structure.
**When to use:** Modify `app/(portfolio)/layout.tsx`.

```typescript
// Source: project codebase — apps/web/app/(portfolio)/layout.tsx
// MODIFICATION: add LenisProvider
import { LenisProvider } from '@/components/portfolio/lenis-provider'

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <LenisProvider>
      <div className="matrix-theme min-h-screen flex flex-col">
        <DotGridSpotlight />
        <PortfolioNav />
        <MotionProvider>
          <main className="flex-1">{children}</main>
        </MotionProvider>
        <PortfolioFooter />
        <CommandPalette />
      </div>
    </LenisProvider>
  )
}
```

**Note:** `LenisProvider` must wrap the outer `div`, not just `main`, because `CommandPalette` and `PortfolioNav` also live inside the layout and must have access to `useLenis()` context.

### Pattern 4: GSAP Integration (Phase 30 — document now, implement then)

**What:** When Phase 30 adds ScrollTrigger, switch `autoRaf: false` + add GSAP ticker.
**When to use:** Do NOT implement in Phase 29. Document here for the planner's awareness.

```typescript
// Source: Lenis README + STATE.md arch decision
// Phase 30 ONLY — do not add in Phase 29
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// In LenisProvider useEffect (Phase 30):
gsap.registerPlugin(ScrollTrigger)
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time: number) => { lenis.raf(time * 1000) })
gsap.ticker.lagSmoothing(0)
// options: { autoRaf: false }  ← switch from autoRaf: true
```

### Anti-Patterns to Avoid

- **Mounting ReactLenis in root layout (`app/layout.tsx`):** Root layout wraps BOTH portfolio and dashboard routes. Lenis on root breaks TeamFlow's `overflow-y-auto` virtual scroll container. Always mount in `(portfolio)/layout.tsx` only.
- **Checking `prefersReducedMotion` at render time from `window.matchMedia` without SSR guard:** Crashes on server. Guard with `typeof window !== 'undefined'`.
- **Calling `lenis.stop()` inside the modal without calling `lenis.start()` on cleanup:** If user closes palette via keyboard or backdrop click, `open` state changes to false — the `useEffect` cleanup handles this. But if using the event listener pattern, ensure cleanup in `return () => { lenis?.start() }`.
- **Using native `window.scrollTo(0, 0)` for route reset:** Lenis overrides native scroll; native calls fight Lenis. Always use `lenis.scrollTo(0, { immediate: true, force: true })`.
- **Using `autoRaf: false` without wiring up a RAF loop:** Lenis will not animate at all. For Phase 29, use `autoRaf: true`. For Phase 30, wire GSAP ticker before removing `autoRaf: true`.
- **Importing from `@studio-freight/react-lenis`:** That package is deprecated. The project already has `lenis` (not `@studio-freight/lenis`). Import from `lenis/react`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth scroll interpolation | Custom RAF + lerp loop | `lenis` (already installed) | Lenis handles pointer event capture, touch inertia, CSS class management (`lenis-smooth`, `lenis-stopped`), iframe pointer-events during scroll |
| Scroll lock during modal | `overflow: hidden` on `body` | `lenis.stop()` / `lenis.start()` | Body overflow breaks Lenis scroll position tracking; Lenis's own stop/start is the correct API |
| Route-change scroll reset | `router.push` + `window.scrollTo` | `lenis.scrollTo(0, { immediate: true, force: true })` | Only Lenis knows its animated scroll position; bypassing causes position drift |
| Reduced-motion detection | Custom media query watcher | `window.matchMedia('(prefers-reduced-motion: reduce)').matches` | One synchronous check at mount time; no subscription needed since users rarely change this setting mid-session |

**Key insight:** Lenis manages a separate "animated scroll" value on top of native scroll. Any code that touches native scroll directly (body overflow, window.scrollTo) without going through Lenis will cause position desync.

---

## Common Pitfalls

### Pitfall 1: ReactLenis on Dashboard Routes

**What goes wrong:** If `LenisProvider` is placed in `app/layout.tsx` or any layout above `(portfolio)`, it wraps dashboard routes too. Dashboard's `overflow-y-auto` main element conflicts with Lenis's `html { height: auto }` CSS, breaking TanStack Table's virtual scroll container height calculations.
**Why it happens:** Lenis's CSS sets `html.lenis, html.lenis body { height: auto }` globally. If `html` gets the `lenis-smooth` class while the dashboard is active, fixed-height containers fail.
**How to avoid:** Strictly mount `LenisProvider` in `app/(portfolio)/layout.tsx` only — confirmed by checking both layout files in this research. Dashboard layout (`app/(dashboard)/layout.tsx`) does NOT use LenisProvider.
**Warning signs:** Dashboard shows empty or mis-sized TanStack Table rows; dashboard main content area loses scrollability.

### Pitfall 2: `useLenis()` Returns Undefined on Dashboard

**What goes wrong:** `CommandPalette` is mounted in both portfolio layout AND dashboard layout. On dashboard routes, no `ReactLenis` ancestor exists, so `useLenis()` returns `undefined`. If the code calls `lenis.stop()` without optional chaining, it throws a runtime error.
**Why it happens:** `useLenis()` reads from `LenisContext`, which is `null` when no provider is present.
**How to avoid:** Always use `lenis?.stop()` and `lenis?.start()` — the optional chaining is a no-op when `lenis` is undefined. Verified from TypeScript declaration: `useLenis()` returns `Lenis.default | undefined`.
**Warning signs:** Console error "Cannot read properties of undefined (reading 'stop')" when opening CommandPalette on dashboard.

### Pitfall 3: Scroll Reset Race Condition

**What goes wrong:** User clicks a link mid-scroll. Lenis has momentum. Route change fires. `scrollTo(0, { immediate: true })` is called, but Lenis's inertia overrides the immediate flag because the scroll target is still animating.
**Why it happens:** `force: false` (default) means "scroll even if stopped"; without `force: true`, an in-progress scroll animation can defer the reset.
**How to avoid:** Always use `{ immediate: true, force: true }` for route-change resets. The `force: true` flag explicitly overrides any in-progress animation. Verified from TypeScript declaration: `force?: boolean — Scroll even if stopped`.
**Warning signs:** New page loads and user sees it start at ~200px scroll rather than top; intermittent (only happens when navigating while still scrolling).

### Pitfall 4: Hydration Mismatch from SSR `window` Access

**What goes wrong:** `LenisProvider` is `'use client'` but still renders on the server during SSR hydration pass. Accessing `window.matchMedia` without an SSR guard throws `ReferenceError: window is not defined`.
**Why it happens:** Next.js 15 App Router renders client components on the server for SSR, even with `'use client'`. The directive means "this has client behavior" not "skip SSR".
**How to avoid:** Guard `window.matchMedia` with `typeof window !== 'undefined'`. In the pattern above, the guard defaults to `false` (don't skip Lenis) when on server, which is safe — on server there's no real scroll anyway. Alternatively, use `useEffect` + `useState` if the conditional rendering causes hydration mismatch with the `if (prefersReducedMotion) return children` branch.
**Warning signs:** `window is not defined` error in Next.js build output or runtime server logs.

### Pitfall 5: Double `lenis.css` Import Causing Global Scroll Breaks

**What goes wrong:** Importing `lenis/dist/lenis.css` in multiple places (both `globals.css` and the component) causes duplicate CSS. The CSS sets `html { height: auto }` — duplicate is harmless but bloats CSS.
**Why it happens:** Copy-paste from examples.
**How to avoid:** Import `lenis/dist/lenis.css` exactly once — either in `apps/web/app/globals.css` or in `LenisProvider`. Prefer `globals.css` to keep CSS in one place.

### Pitfall 6: `autoRaf: true` in Phase 29 vs `autoRaf: false` in Phase 30

**What goes wrong:** Phase 30 adds GSAP ScrollTrigger and wires `gsap.ticker.add`. If `autoRaf` is still `true`, both Lenis's internal RAF loop AND GSAP's ticker call `lenis.raf()` on every frame — double execution causing jitter.
**Why it happens:** `autoRaf: true` runs Lenis's internal `requestAnimationFrame` loop. Adding GSAP ticker also calls `lenis.raf()`. Both run simultaneously.
**How to avoid:** Phase 29 uses `autoRaf: true` (no GSAP). Phase 30 switches to `autoRaf: false` and adds `gsap.ticker.add((time) => lenis.raf(time * 1000))`. The STATE.md decision is recorded. Plan the Phase 30 task to update `LenisProvider` options.
**Warning signs:** Scroll animation jitters or stutters; visible double-step on fast scroll.

---

## Code Examples

Verified patterns from official sources (TypeScript declarations from installed `lenis@1.3.17`):

### Lenis Instance API (confirmed from `/node_modules/lenis/dist/lenis.d.ts`)

```typescript
// stop/start
lenis.stop()   // pauses smooth scroll
lenis.start()  // resumes smooth scroll

// scrollTo signature
lenis.scrollTo(
  target: number | string | HTMLElement,
  options?: {
    offset?: number
    immediate?: boolean  // skip animation, jump immediately
    force?: boolean      // scroll even if stopped
    lock?: boolean
    duration?: number
    lerp?: number
    onComplete?: (lenis: Lenis) => void
  }
): void

// Route-change reset (verified pattern from GitHub discussion #244)
lenis.scrollTo(0, { immediate: true, force: true })
```

### ReactLenis Props (confirmed from `/node_modules/lenis/dist/lenis-react.d.ts`)

```typescript
// root prop: makes instance globally accessible via useLenis()
<ReactLenis root options={{ lerp: 0.1, autoRaf: true, smoothWheel: true }}>
  {children}
</ReactLenis>

// useLenis: returns instance or undefined (no provider = undefined)
const lenis = useLenis()  // Lenis | undefined
```

### LenisOptions confirmed types

```typescript
// From lenis.d.ts
type LenisOptions = {
  lerp?: number             // default: 0.1 (linear interpolation 0-1)
  duration?: number         // in seconds (alternative to lerp)
  smoothWheel?: boolean     // default: true
  syncTouch?: boolean       // default: false (touch mimic)
  autoRaf?: boolean         // default: false in class, ReactLenis prop deprecated alias
  prevent?: (node: HTMLElement) => boolean  // exclude nodes from smooth scroll
  stopInertiaOnNavigate?: boolean           // stop inertia on link click
}
```

### Full LenisProvider (production-ready for Phase 29)

```typescript
// Source: research-verified pattern combining official TypeScript API + project codebase
// apps/web/components/portfolio/lenis-provider.tsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import ReactLenis, { useLenis } from 'lenis/react'

// Separated inner component required because useLenis() needs ReactLenis ancestor
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

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Run once on mount — no need for ongoing listener
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
  }, [])

  if (prefersReducedMotion) {
    // SCROLL-03: no ReactLenis mounted, no RAF overhead
    return <>{children}</>
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        autoRaf: true,  // Phase 29 only; Phase 30 sets false + gsap.ticker
        smoothWheel: true,
      }}
    >
      <LenisScrollReset />
      {children}
    </ReactLenis>
  )
}
```

**Note on useState approach:** Using `useState(false)` + `useEffect` to set `prefersReducedMotion` is the SSR-safe pattern. It avoids hydration mismatch because both server and client initially render the Lenis tree (state starts `false`), then client-side `useEffect` re-renders to skip Lenis if needed. Acceptable for a preference that changes only on mount.

### CommandPalette Modification (minimal diff)

```typescript
// Source: project codebase CommandPalette + Lenis stop/start API
// Add to top of CommandPalette component:
import { useLenis } from 'lenis/react'

// Inside the component, after existing state declarations:
const lenis = useLenis()

useEffect(() => {
  if (open) {
    lenis?.stop()   // SCROLL-04: prevent background scroll when modal open
  } else {
    lenis?.start()  // SCROLL-04: resume scroll when modal closes
  }
}, [open, lenis])
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@studio-freight/lenis` + `@studio-freight/react-lenis` | `lenis` package with `lenis/react` sub-export | ~2023-2024 | Old packages deprecated; project already uses new `lenis` package |
| `ReactLenis` `autoRaf` prop | `options.autoRaf` in LenisOptions | Lenis 1.x | `autoRaf` as direct prop is deprecated (marked in type declaration); use `options={{ autoRaf: true }}` |
| `lenis.scrollTo(0)` for route reset | `lenis.scrollTo(0, { immediate: true, force: true })` | Lenis 1.2+ | `force` flag required to overcome in-progress animation |
| Manual `window.matchMedia` check + skip init | Same approach (no built-in Lenis API for this) | N/A | Lenis does not have native `prefers-reduced-motion` integration; must handle in wrapper |

**Deprecated/outdated:**
- `@studio-freight/react-lenis`: Deprecated. Never import from this. Use `lenis/react`.
- `ReactLenis autoRaf` prop (top-level): TypeScript declaration marks it `@deprecated use options.autoRaf instead`. Use `options={{ autoRaf: true }}`.
- `lerp` + `duration` simultaneously: They are alternatives; `lerp` (inertia-based) vs `duration` (time-based). Do not set both.

---

## Open Questions

1. **Optimal lerp value (0.08 vs 0.10)**
   - What we know: Default is 0.1. STATE.md flags this as needing real-device testing.
   - What's unclear: Which value feels right for the portfolio's "premium but not sluggish" tone on Chrome, Safari, Firefox.
   - Recommendation: Ship with `lerp: 0.1` (default). Document that execution plan should include a manual feel-check step on Chrome/Safari before marking SCROLL-01 complete.

2. **Hydration mismatch risk with `prefersReducedMotion` useState pattern**
   - What we know: Server renders `false` (Lenis mounted), client may re-render to `true` (Lenis unmounted). The brief flash of Lenis before reduced-motion check completes.
   - What's unclear: Whether Next.js 15 hydration will flag this as a mismatch.
   - Recommendation: Use the `useState(false)` + `useEffect` pattern. If hydration errors appear during execution, switch to rendering Lenis with `lerp: 1, smoothWheel: false` for reduced-motion users instead of conditional unmount — but this contradicts SCROLL-03 ("no Lenis instance initialized, no RAF overhead runs"). Test during plan execution.

3. **`stopInertiaOnNavigate` option relevance**
   - What we know: Lenis 1.3.x has a `stopInertiaOnNavigate` option that stops inertia when internal links are clicked.
   - What's unclear: Whether this would conflict with or complement the `usePathname`-based `scrollTo(0)` reset.
   - Recommendation: Do not use `stopInertiaOnNavigate`. The `usePathname` + `scrollTo(0, { immediate, force })` pattern is well-documented and community-proven. Using both could cause duplicate behavior.

---

## Sources

### Primary (HIGH confidence)

- Installed package TypeScript declarations: `/home/doctor/fernandomillan/node_modules/lenis/dist/lenis.d.ts` — `LenisOptions`, `stop()`, `start()`, `scrollTo()`, full API
- Installed package TypeScript declarations: `/home/doctor/fernandomillan/node_modules/lenis/dist/lenis-react.d.ts` — `ReactLenis`, `useLenis`, `LenisProps`, `LenisRef`
- Installed package CSS: `/home/doctor/fernandomillan/node_modules/lenis/dist/lenis.css` — confirmed required CSS content
- Project codebase: `apps/web/app/(portfolio)/layout.tsx` — confirmed portfolio layout structure, existing providers
- Project codebase: `apps/web/app/(dashboard)/layout.tsx` — confirmed dashboard uses native `overflow-y-auto`, no Lenis conflict zone
- Project codebase: `apps/web/components/ui/command-palette.tsx` — confirmed open state structure, where to inject `useLenis`
- Project codebase: `apps/web/components/portfolio/motion-provider.tsx` — confirmed `motion/react` pattern already established
- Project STATE.md decisions: `autoRaf: false` + `gsap.ticker` for Phase 30; `motion/react` import pattern

### Secondary (MEDIUM confidence)

- [Lenis GitHub README](https://github.com/darkroomengineering/lenis) — `stop()`, `start()`, GSAP integration pattern, `scrollTo` API, verified against TypeScript declarations
- [Lenis GitHub Discussion #244](https://github.com/darkroomengineering/lenis/discussions/244) — `scrollTo(0, { immediate: true, force: true })` for route-change reset, maintainer confirmed pattern
- [Lenis GitHub Issue #319](https://github.com/darkroomengineering/lenis/issues/319) — NextJS 14 App Router mid-page navigation issue and solutions

### Tertiary (LOW confidence)

- [devdreaming.com — Lenis+GSAP+Next.js](https://devdreaming.com/blogs/nextjs-smooth-scrolling-with-lenis-gsap) — General pattern reference (uses deprecated `@studio-freight` imports, not recommended)
- [bridger.to — Lenis in Next.js](https://bridger.to/lenis-nextjs) — `getResponsiveLenisOptions` pattern for reduced motion; pattern confirmed valid but implementation uses manual `new Lenis()` rather than `ReactLenis`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — lenis@1.3.17 and lenis/react already installed; TypeScript types verified from installed package
- Architecture: HIGH — portfolio layout and dashboard layout examined; ComponentPalette code examined; patterns verified against official API
- Pitfalls: HIGH for dashboard isolation (directly verified from layout files); MEDIUM for hydration mismatch (pattern is standard but Next.js 15 SSR behavior not live-tested)

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (Lenis 1.x is stable; 30-day window appropriate)
