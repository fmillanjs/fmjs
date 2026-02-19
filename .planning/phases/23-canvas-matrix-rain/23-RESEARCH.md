# Phase 23: Canvas Matrix Rain - Research

**Researched:** 2026-02-18
**Domain:** HTML5 Canvas, requestAnimationFrame, Next.js dynamic import, Lighthouse CI
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ANIM-02 | Hero section shows Matrix digital rain on a canvas element behind content (opacity 0.04–0.07, 30fps cap, `aria-hidden`, SSR-safe via `next/dynamic ssr:false`) | SSR pattern: `'use client'` wrapper + `dynamic(..., { ssr: false })`. RAF throttle via timestamp delta. Canvas positioned `absolute inset-0` behind hero content via z-index. Opacity via CSS `opacity` property on canvas element (not canvas draw alpha). |
| ANIM-03 | Lighthouse CI performance score remains ≥ 90 on all five portfolio URLs after canvas is added | `@lhci/cli` installed as devDependency in `apps/web`. `lighthouserc.json` URL list updated to Phase 23 spec. Canvas performance budget: 30fps cap + `will-change: transform` on canvas avoids blocking main thread. Canvas renders only on client (SSR-safe) so LCP/FCP unaffected. |
</phase_requirements>

---

## Summary

Phase 23 has two distinct work streams that must succeed together: (1) implement the Matrix digital rain canvas in the hero section with correct accessibility, reduced-motion handling, and no memory leaks; (2) verify that Lighthouse CI performance scores stay at or above 90 on all five required portfolio URLs after the canvas is added.

The canvas implementation is pure browser JavaScript with no library dependencies. It uses `next/dynamic` with `ssr: false` (wrapped in a `'use client'` client component — required in Next.js 15) to ensure the canvas never runs during server-side rendering. The RAF loop is throttled to 30fps via a timestamp comparison, halted entirely when `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true, and fully canceled via `cancelAnimationFrame` in the `useEffect` cleanup function to prevent memory leaks after 10+ navigations.

The Lighthouse CI gate is already partially configured (`lighthouserc.json` exists in `apps/web/`) but has two problems: the URL list does not match the Phase 23 spec (it includes `/about` and `/login` instead of `/projects/devcollab` and `/contact`), and `@lhci/cli` is not installed as a devDependency anywhere in the monorepo. Both require a fix. The canvas is positioned absolutely behind hero content at `opacity: 0.05` (CSS property, not canvas context alpha), which means LCP and FCP are unaffected since the canvas is a decorative layer that never blocks text rendering.

**Primary recommendation:** Build the canvas as a standalone `MatrixRainCanvas` client component, import it into `HeroSection` via `next/dynamic` + `ssr:false`, fix the `lighthouserc.json` URLs, install `@lhci/cli`, and run `lhci autorun` against a production build to confirm the gate passes before declaring the phase done.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| No canvas library | N/A | Canvas Matrix Rain | Hand-rolling is correct here: no library adds value for a single full-screen canvas effect. Plain 2D canvas context is sufficient and adds zero bundle cost. |
| `@lhci/cli` | 0.15.1 (latest) | Lighthouse CI test runner | Official LHCI CLI from Google. `lhci autorun` reads `lighthouserc.json` and enforces performance thresholds. |

### Supporting (already installed in `apps/web`)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next` | ^15.1.0 | `next/dynamic` with `ssr: false` | SSR-safe client-only import of canvas component |
| `react` | ^19.0.0 | `useEffect`, `useRef` hooks | Canvas lifecycle management |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain 2D canvas | `react-mdr` npm package | `react-mdr` (GitHub: FullStackWithLawrence) exists but adds a dependency for a trivial effect. Plain canvas is 30 lines, fully controllable. |
| Plain 2D canvas | `p5.js` or `three.js` | Enormous bundles (~800KB). Completely unjustified for a simple rain effect. |
| CSS `opacity` on `<canvas>` | Canvas context `globalAlpha` | Using CSS `opacity: 0.05` on the `<canvas>` element is simpler and keeps the canvas draw code independent of the visibility level. The canvas draws at full opacity internally; CSS composites it at 5% into the page. |

**Installation (adds `@lhci/cli` to `apps/web` devDependencies only):**
```bash
# Run from monorepo root
npm install --save-dev @lhci/cli --workspace apps/web
```

---

## Architecture Patterns

### Recommended File Structure for Phase 23
```
apps/web/
├── app/
│   └── (portfolio)/
│       └── page.tsx               # NO CHANGE — HeroSection already imported here
├── components/
│   └── portfolio/
│       ├── hero-section.tsx       # MODIFY: add MatrixRainCanvas via next/dynamic
│       └── matrix-rain-canvas.tsx # CREATE: the actual canvas + RAF logic ("use client")
└── lighthouserc.json              # MODIFY: fix URL list to Phase 23 spec
```

### Pattern 1: SSR-Safe Canvas Import (Next.js 15 App Router)

**What:** `next/dynamic` with `ssr: false` must be called from a `'use client'` file in Next.js 15. Server components cannot use `ssr: false` dynamic imports — this was changed from Next.js 14 and causes a build error if violated.

**When to use:** Any component that touches `window`, `document`, `HTMLCanvasElement`, or any browser-only API.

**Example:**
```tsx
// Source: https://nextjs.org/docs/pages/guides/lazy-loading (official docs, verified 2026-02-18)
// apps/web/components/portfolio/hero-section.tsx
'use client'

import dynamic from 'next/dynamic'

// dynamic() call must be at module top level (not inside render)
const MatrixRainCanvas = dynamic(
  () => import('./matrix-rain-canvas'),
  { ssr: false }
)

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-background to-muted/30 py-24 md:py-32">
      {/* Canvas behind content: absolute, full coverage, aria-hidden */}
      <MatrixRainCanvas />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* ... existing hero content ... */}
      </div>
    </section>
  )
}
```

**Critical constraint:** The `<section>` wrapping the hero content must have `position: relative` (already has `relative` via Tailwind). The hero content `div` needs `relative z-10` to sit above the canvas layer. The canvas uses `absolute inset-0` (z-index default 0 or explicit `z-0`).

### Pattern 2: Canvas Component with RAF Loop, 30fps Cap, Cleanup

**What:** The `MatrixRainCanvas` component manages the canvas element, RAF loop, character drops, and cleanup. The 30fps cap uses a timestamp comparison: skip the draw if less than 33ms has elapsed since the last draw. The loop is not started if reduced motion is active.

**When to use:** Any canvas animation component in a React app.

**Example:**
```tsx
// Source: patterns from MDN, Josh W. Comeau (joshwcomeau.com/react/prefers-reduced-motion),
//         CSS-Tricks (css-tricks.com/using-requestanimationframe-with-react-hooks),
//         Next.js official docs
// apps/web/components/portfolio/matrix-rain-canvas.tsx
'use client'

import { useEffect, useRef } from 'react'

// Katakana half-width + ASCII digits — standard Matrix character set
const CHARS = 'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789'
const FONT_SIZE = 14          // px — column width
const FPS_TARGET = 30         // frames per second cap
const FRAME_INTERVAL = 1000 / FPS_TARGET  // ~33.33ms

export default function MatrixRainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Respect OS Reduce Motion — skip RAF loop entirely
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Size canvas to parent container
    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()

    const columns = Math.floor(canvas.width / FONT_SIZE)
    const drops: number[] = Array(columns).fill(1)

    let lastTime = 0
    let rafId: number

    function draw(timestamp: number) {
      // 30fps throttle: skip frame if not enough time has passed
      if (timestamp - lastTime < FRAME_INTERVAL) {
        rafId = requestAnimationFrame(draw)
        return
      }
      lastTime = timestamp

      // Fade trail: semi-transparent fill creates the trail effect
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)'  // matches .matrix-theme bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw characters
      ctx.fillStyle = '#00FF41'  // --matrix-green
      ctx.font = `${FONT_SIZE}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        ctx.fillText(char, i * FONT_SIZE, drops[i] * FONT_SIZE)

        // Reset drop to top randomly after it passes the canvas height
        if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)

    // Cleanup: cancel RAF on unmount (prevents memory leak on navigation)
    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full z-0"
      style={{ opacity: 0.05 }}
    />
  )
}
```

**Key implementation details:**
- `aria-hidden="true"`: removes canvas from accessibility tree entirely. Verified via MDN: "Adding `aria-hidden="true"` to an element removes that element and all of its children from the accessibility tree." axe-core will not flag it.
- `style={{ opacity: 0.05 }}`: CSS-level opacity applied to the canvas element. The canvas draws at full color internally; CSS composites the result at 5%. This is the correct approach for the opacity range 0.04–0.07 specified in ANIM-02.
- `absolute inset-0 w-full h-full`: positions canvas to fill the `relative` hero `<section>`. The hero section already has `relative` in its className.
- `z-0` (default stacking) with hero content at `z-10`: canvas stays behind text.
- `cancelAnimationFrame(rafId)` in `useEffect` cleanup: fully stops the loop on unmount, ensuring stable heap after client-side navigations.

### Pattern 3: Lighthouse CI Config — Phase 23 URL Spec

**What:** The existing `lighthouserc.json` has incorrect URLs. Phase 23 requires exactly five URLs: `/`, `/projects`, `/projects/teamflow`, `/projects/devcollab`, `/contact`. The current config has `/about` and `/login` instead of `/projects/devcollab` and `/contact`.

**When to use:** Update `lighthouserc.json` as part of Phase 23 delivery.

**Corrected `apps/web/lighthouserc.json`:**
```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run start",
      "startServerReadyPattern": "ready",
      "startServerReadyTimeout": 30000,
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/projects",
        "http://localhost:3000/projects/teamflow",
        "http://localhost:3000/projects/devcollab",
        "http://localhost:3000/contact"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["warn", { "minScore": 1 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**Run command (from `apps/web` directory after a production build):**
```bash
# Build first (must be done before lhci autorun)
npm run build -w apps/web

# Run LHCI — reads lighthouserc.json automatically
cd /home/doctor/fernandomillan/apps/web && npx lhci autorun
```

### Anti-Patterns to Avoid

- **`dynamic()` with `ssr: false` in a Server Component:** In Next.js 15, this causes a build error. The file calling `dynamic()` must have `'use client'` at the top. Since `hero-section.tsx` will be the importer, it must become a client component.
- **Calling `cancelAnimationFrame` with a stale ID:** Store the RAF ID in a `ref` only if you need to cancel it inside an event handler. For `useEffect` cleanup, storing the latest ID in a local `let rafId` variable in the closure is sufficient — the closure captures the final value.
- **Setting canvas width/height via CSS only:** CSS sizing scales the canvas display without changing the drawing buffer. The canvas will appear blurry. Always set `canvas.width = canvas.offsetWidth` and `canvas.height = canvas.offsetHeight` explicitly after the element mounts.
- **Using `rgba` fill alpha to control overall opacity:** Setting `ctx.globalAlpha = 0.05` makes each character 5% opaque — they become invisible. Use CSS `opacity` on the `<canvas>` element instead to control the composite opacity of the fully-drawn canvas against the page.
- **Not checking `prefersReducedMotion` in the RAF:** The global CSS rule in `globals.css` stops CSS animations, but JavaScript RAF loops are not affected by CSS media queries. The JS check is required separately per ANIM-02.
- **Running `lhci autorun` against `next dev`:** Lighthouse measures production performance. Run against `next build && next start` output only.
- **Hero section `<section>` missing `position: relative`:** The canvas uses `absolute inset-0`. If the parent has no positioning context, the canvas will cover the entire viewport. The current `hero-section.tsx` already has `relative` via Tailwind, but this must be verified.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reduced motion check | Custom `useReducedMotion` state hook | Direct `window.matchMedia` call inside `useEffect` | The canvas is SSR-disabled, so there's no hydration mismatch risk. A one-line check inside the effect is simpler than a hook that manages state. |
| FPS throttle | `setInterval` with canvas draw | `requestAnimationFrame` + timestamp comparison | `setInterval` doesn't sync with vsync, fires when tab is hidden, and creates drift. RAF + delta time is the standard canvas animation pattern. |
| Canvas resize | Custom window `resize` listener | Set `canvas.width/height` once on mount | Hero section is full-width and not resizable post-hydration in the typical portfolio use case. A simple `resize()` call on mount is sufficient. Add `ResizeObserver` only if the hero section's height changes dynamically (it does not in the current implementation). |
| Performance gate | Custom Playwright test for performance | `@lhci/cli` + `lighthouserc.json` | LHCI runs Lighthouse in headless Chrome 3 times and averages scores, which is far more reliable than any custom metric. |

**Key insight:** The canvas implementation intentionally has no dependencies. The entire effect is 30–40 lines of canvas 2D API calls. Adding a library for this would be over-engineering.

---

## Common Pitfalls

### Pitfall 1: `hero-section.tsx` becomes a Client Component, breaking Server Component features

**What goes wrong:** Adding `'use client'` to `hero-section.tsx` (required to use `next/dynamic` with `ssr: false`) means any async data fetching or Server Component features in `hero-section.tsx` will break.

**Why it happens:** `'use client'` marks the entire module and its subtree as client-side. Server Component capabilities (async/await, direct database access) are unavailable in client components.

**How to avoid:** Check the current `hero-section.tsx` — it has no async data fetching, no Server Component features. It renders static JSX only. Converting it to `'use client'` is safe.

**Warning signs:** TypeScript error about `async` in Client Components, or missing data that was previously server-fetched.

### Pitfall 2: Canvas draws at wrong size (blurry or wrong column count)

**What goes wrong:** The canvas element is 0×0 pixels on first render, then CSS scales it up. Characters are drawn into a tiny buffer and CSS-stretched, appearing blurry.

**Why it happens:** `useEffect` runs after the browser paints. `canvas.offsetWidth` is available after paint, but the `canvas.width` drawing buffer defaults to 300 (HTML default), not the element's CSS size.

**How to avoid:** Inside `useEffect`, call `canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;` before initializing `columns` or `drops`. The canvas must be in the DOM with a computed size when `useEffect` runs (it will be, since `useEffect` runs post-paint).

**Warning signs:** Canvas looks blurry, or character columns don't fill the full width of the hero section.

### Pitfall 3: RAF loop continues after navigation (memory leak)

**What goes wrong:** After 10+ client-side navigations, Chrome Memory tab shows steady heap growth. The RAF loop fires every 33ms even though the component has unmounted.

**Why it happens:** `requestAnimationFrame` callbacks hold a closure over the entire component scope. If `cancelAnimationFrame` is not called in the `useEffect` cleanup, the loop continues indefinitely, holding references to the canvas context, drops array, and component scope.

**How to avoid:** The `useEffect` returns `() => { cancelAnimationFrame(rafId) }`. The `rafId` variable is updated on every frame: `rafId = requestAnimationFrame(draw)`. The cleanup always cancels the most recent scheduled frame, breaking the recursive chain.

**Warning signs:** Chrome DevTools Memory tab shows `ImageBitmap` or canvas-related objects growing with navigations. The CPU profile shows RAF callbacks firing on pages that don't have a canvas.

### Pitfall 4: Lighthouse runs against `next dev` instead of production build

**What goes wrong:** `lhci autorun` is run while the dev server is active. Scores are 40–60 instead of 90+.

**Why it happens:** `next dev` runs unoptimized code, large unminified JS bundles, and no static optimization. Lighthouse scores are meaningless against a dev server.

**How to avoid:** Always `npm run build -w apps/web` before `lhci autorun`. The `startServerCommand: "npm run start"` in `lighthouserc.json` starts the production server, but a prior build is required.

**Warning signs:** LCP is > 4s, performance score < 50, TTI is very high.

### Pitfall 5: `lighthouserc.json` URL list mismatch with ANIM-03 spec

**What goes wrong:** The existing `lighthouserc.json` tests `/about` and `/login` instead of `/projects/devcollab` and `/contact`. ANIM-03 requires all five specific URLs to pass. Running the existing config would give a false green for some URLs while skipping the required ones.

**Why it happens:** The config was written in an earlier phase with a different scope.

**How to avoid:** Update the `url` array to exactly match the ANIM-03 spec before running: `/`, `/projects`, `/projects/teamflow`, `/projects/devcollab`, `/contact`.

**Warning signs:** `lhci autorun` output shows results for `/about` or `/login` but not for `/projects/devcollab` or `/contact`.

### Pitfall 6: Canvas visible in Playwright visual regression snapshots

**What goes wrong:** The Matrix rain canvas changes the visual appearance of the homepage. Playwright visual regression snapshots fail because the background now shows a green rain pattern.

**Why it happens:** The canvas is positioned absolutely in the hero section and composited at 5% opacity. Even at 5%, it changes the pixel values in the screenshot enough to exceed `maxDiffPixelRatio: 0.02`.

**How to avoid:** After implementing the canvas, regenerate the homepage (and any other affected) portfolio snapshots:
```bash
cd /home/doctor/fernandomillan/apps/web
npx playwright test e2e/portfolio/visual-regression.spec.ts --update-snapshots
```

**Warning signs:** Playwright CI fails with "screenshot diff exceeds threshold" on `homepage-light.png` and `homepage-dark.png`.

### Pitfall 7: axe-core fails on canvas element

**What goes wrong:** The `accessibility.spec.ts` test fails because axe-core flags the canvas element as having no accessible name.

**Why it happens:** Without `aria-hidden`, canvas elements are expected to have fallback content or an accessible name. axe-core rule `canvas-missing-best-practice` warns about this.

**How to avoid:** The canvas has `aria-hidden="true"`, which removes it from the accessibility tree completely. axe-core skips elements with `aria-hidden`. Verified per MDN: `aria-hidden` removes the element and all its children from the accessibility tree.

**Warning signs:** axe-core reports `aria-required-children` or `canvas-missing-best-practice` violations on the hero section.

---

## Code Examples

Verified patterns from official sources and codebase inspection:

### Complete `matrix-rain-canvas.tsx`
```tsx
// Source: Canvas 2D API (MDN), RAF throttle pattern (CSS-Tricks), reduced-motion (Josh Comeau)
// apps/web/components/portfolio/matrix-rain-canvas.tsx
'use client'

import { useEffect, useRef } from 'react'

const CHARS =
  'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789'

const FONT_SIZE = 14
const FPS_TARGET = 30
const FRAME_INTERVAL = 1000 / FPS_TARGET  // 33.33ms

export default function MatrixRainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // ANIM-02: Skip RAF loop entirely when OS Reduce Motion is active
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set drawing buffer to match CSS size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const columns = Math.floor(canvas.width / FONT_SIZE)
    const drops: number[] = Array(columns).fill(1)

    let lastTime = 0
    let rafId: number

    function draw(timestamp: number) {
      // 30fps cap: skip frame if insufficient time has elapsed
      if (timestamp - lastTime < FRAME_INTERVAL) {
        rafId = requestAnimationFrame(draw)
        return
      }
      lastTime = timestamp

      // Trail fade: semi-transparent black rect over bg-#0a0a0a
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#00FF41'  // --matrix-green
      ctx.font = `${FONT_SIZE}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        ctx.fillText(char, i * FONT_SIZE, drops[i] * FONT_SIZE)

        if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)

    // ANIM-02: Cancel RAF on unmount — prevents heap growth after navigations
    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full z-0"
      style={{ opacity: 0.05 }}
    />
  )
}
```

### Updated `hero-section.tsx` with dynamic import
```tsx
// apps/web/components/portfolio/hero-section.tsx
// Source: https://nextjs.org/docs/pages/guides/lazy-loading (Next.js official, verified 2026-02-18)
'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// dynamic() MUST be at module top level, not inside component render
// ssr: false required — canvas uses browser APIs (window, HTMLCanvasElement)
const MatrixRainCanvas = dynamic(
  () => import('./matrix-rain-canvas'),
  { ssr: false }
)

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-background to-muted/30 py-24 md:py-32">
      {/* ANIM-02: Canvas behind content */}
      <MatrixRainCanvas />

      {/* z-10 ensures content renders above the z-0 canvas */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
          <span className="block mb-2">Fernando Millan</span>
          <span className="block text-primary">
            Full-Stack Engineer Building Production-Ready SaaS
          </span>
        </h1>

        <p className="cursor-blink text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
          Specializing in Next.js, NestJS, TypeScript, and real-time collaboration systems.
          I build scalable, production-ready applications with clean architecture and type safety.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/about">Learn More</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://github.com/fernandomillan" target="_blank" rel="noopener noreferrer">
              View GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
```

### Corrected `lighthouserc.json`
```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run start",
      "startServerReadyPattern": "ready",
      "startServerReadyTimeout": 30000,
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/projects",
        "http://localhost:3000/projects/teamflow",
        "http://localhost:3000/projects/devcollab",
        "http://localhost:3000/contact"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["warn", { "minScore": 1 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### `@lhci/cli` installation
```bash
# Install @lhci/cli as devDependency in apps/web only
npm install --save-dev @lhci/cli --workspace apps/web

# Run LHCI (requires a prior production build)
npm run build --workspace apps/web
cd /home/doctor/fernandomillan/apps/web && npx lhci autorun
```

### Playwright snapshot update (after canvas is visible in hero)
```bash
# Regenerate portfolio snapshots only (canvas changes homepage screenshots)
cd /home/doctor/fernandomillan/apps/web
npx playwright test e2e/portfolio/visual-regression.spec.ts --update-snapshots
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `dynamic()` with `ssr: false` in Server Components | Requires `'use client'` wrapper in Next.js 15 | Next.js 15 (2024) | Build error if violated; wrapper component is the fix |
| `setInterval` for canvas animation | `requestAnimationFrame` + timestamp delta for FPS cap | Long established | RAF pauses when tab is hidden, syncs with vsync |
| `window.addEventListener('resize', ...)` for canvas sizing | `canvas.width = canvas.offsetWidth` once on mount | N/A for hero section | One-time sizing is sufficient for a full-width fixed-height hero |

**Deprecated/outdated:**
- `ssr: false` without `'use client'` in Next.js 14: worked but was discouraged; in Next.js 15 it's a build error.

---

## Open Questions

1. **Will the canvas at `opacity: 0.05` survive the Playwright `maxDiffPixelRatio: 0.02` threshold?**
   - What we know: The canvas draws at full color internally, CSS composites it at 5%. On the dark `.matrix-theme` background (#0a0a0a), the green characters at 5% opacity are subtle but non-zero pixel difference.
   - What's unclear: Whether `maxDiffPixelRatio: 0.02` allows 5%-opacity green characters on a dark background. The animated canvas will differ frame-by-frame.
   - Recommendation: Run `--update-snapshots` after implementing. Playwright captures a static frame; the canvas will be mid-animation in the screenshot. Snapshots must be regenerated — they cannot be preserved unchanged.

2. **Does the `hero-section.tsx` `'use client'` conversion affect anything upstream?**
   - What we know: `hero-section.tsx` is imported in `apps/web/app/(portfolio)/page.tsx` which is a Server Component. Converting `HeroSection` to a Client Component means its subtree is client-rendered, but the rest of `page.tsx` remains server-rendered.
   - What's unclear: None — Server Components can render Client Components as children. This is standard React Server Component composition.
   - Recommendation: No issue. Converting `hero-section.tsx` to `'use client'` is safe.

3. **Lighthouse score impact of canvas at 30fps**
   - What we know: Lighthouse runs with 4x CPU throttling. The canvas at 30fps adds ~0.5ms of JS per frame. At 30fps this is 15ms/sec of CPU time. LCP/FCP are not affected (canvas is client-only, loads after initial render).
   - What's unclear: Whether the canvas animation causes long tasks (> 50ms) that increase TTI under Lighthouse's 4x throttle.
   - Recommendation: The 30fps cap and simple `fillText` loop should not produce long tasks. If scores drop below 90, reduce `FPS_TARGET` to 20 or add `will-change: transform` to the canvas element as a GPU layer promotion hint. If that's still insufficient, reduce the character count by increasing `FONT_SIZE` to 18 or 20.

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs (https://nextjs.org/docs/pages/guides/lazy-loading) — `next/dynamic` with `ssr: false` requires `'use client'`, verified 2026-02-18 from official docs last updated 2026-02-16
- MDN ARIA (https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden) — `aria-hidden="true"` removes element and children from accessibility tree
- Canvas 2D API (https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) — `fillStyle`, `fillRect`, `fillText`, `canvas.width/height` drawing buffer behavior
- `@lhci/cli` npm registry — version 0.15.1 (current), verified 2026-02-18
- `lighthouserc.json` (in codebase) — existing config with URL issues identified from direct file inspection
- Phase 22 RESEARCH.md — confirms `motion`, `gsap`, `lenis` installed; `.matrix-theme` background is `#0a0a0a`

### Secondary (MEDIUM confidence)
- Josh W. Comeau (https://www.joshwcomeau.com/react/prefers-reduced-motion/) — SSR-safe `usePrefersReducedMotion` hook pattern, verified pattern independently for canvas use case
- CSS-Tricks (https://css-tricks.com/using-requestanimationframe-with-react-hooks/) — `useEffect` + RAF + cleanup pattern
- Lighthouse CI official docs (https://googlechrome.github.io/lighthouse-ci/docs/configuration.html) — `assert.assertions` syntax, `startServerReadyPattern`, `numberOfRuns`
- Next.js 15 GitHub discussion (https://github.com/vercel/next.js/discussions/72236) — confirmed `'use client'` required for `ssr: false` in Next.js 15

### Tertiary (LOW confidence — needs validation)
- Lighthouse performance score impact of 30fps canvas under 4x CPU throttle: estimated from general principles, not measured
- Playwright `maxDiffPixelRatio: 0.02` and canvas animation frame capture: predicted behavior, must be verified by running tests after implementation

---

## Metadata

**Confidence breakdown:**
- Canvas implementation pattern: HIGH — MDN, Next.js official docs, direct codebase inspection
- SSR-safe import pattern: HIGH — Next.js official docs verified 2026-02-16
- `aria-hidden` accessibility behavior: HIGH — MDN verified
- Lighthouse CI config: HIGH — official LHCI docs + direct inspection of existing `lighthouserc.json`
- Performance score impact of canvas: MEDIUM — estimated from general principles, not measured against this specific codebase
- Playwright snapshot impact: MEDIUM — predicted from `maxDiffPixelRatio: 0.02` knowledge, unverified until run

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (30 days; Next.js 15 and LHCI APIs are stable at these versions)
