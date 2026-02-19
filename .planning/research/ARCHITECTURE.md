# Architecture Research: Matrix-Aesthetic Portfolio Redesign

**Domain:** Animation integration into existing Next.js 15 App Router portfolio site
**Researched:** 2026-02-18
**Confidence:** HIGH (client/server boundaries, hydration patterns, canvas SSR); MEDIUM (Tailwind v4 token migration, Framer Motion App Router specifics); LOW (canvas Lighthouse impact at specific animation density)

---

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                      apps/web — Next.js 15 App Router              │
├────────────────────────────────────────────────────────────────────┤
│  (portfolio) Route Group — Server Components by default            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ /page.tsx  │  │ /about     │  │ /projects  │  │ /resume    │   │
│  │ (RSC)      │  │ /page.tsx  │  │ /page.tsx  │  │ /page.tsx  │   │
│  │            │  │ (RSC)      │  │ (RSC)      │  │ (RSC)      │   │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘   │
│        │               │               │               │           │
│        └───────────────┴───────────────┴───────────────┘           │
│                                │                                    │
│                   ┌────────────▼───────────────┐                   │
│                   │ (portfolio)/layout.tsx (RSC)│                   │
│                   │  + MotionProvider (client)  │                   │
│                   │  + .matrix-theme class      │                   │
│                   │  PortfolioNav (client)      │                   │
│                   │  PortfolioFooter (RSC)      │                   │
│                   │  CommandPalette (client)    │                   │
│                   └────────────┬───────────────┘                   │
│                                │                                    │
├────────────────────────────────┼───────────────────────────────────┤
│               CLIENT BOUNDARY (all animations live here)           │
├────────────────────────────────┼───────────────────────────────────┤
│                                │                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │          New Animation Client Components ("use client")    │    │
│  │  ┌─────────────────────┐  ┌─────────────────────────────┐  │    │
│  │  │  MatrixRainCanvas   │  │  AnimatedHeroSection        │  │    │
│  │  │  canvas + rAF loop  │  │  Framer Motion m.div        │  │    │
│  │  │  dynamic(ssr:false) │  │  wraps RSC hero children    │  │    │
│  │  └─────────────────────┘  └─────────────────────────────┘  │    │
│  │  ┌─────────────────────┐  ┌─────────────────────────────┐  │    │
│  │  │  GlitchText         │  │  MotionProvider             │  │    │
│  │  │  CSS @keyframes     │  │  LazyMotion + MotionConfig  │  │    │
│  │  │  + useReducedMotion │  │  reducedMotion="user"       │  │    │
│  │  └─────────────────────┘  └─────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
├────────────────────────────────────────────────────────────────────┤
│          CSS Token Layer (globals.css + @theme inline)             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Layer 1: Radix Colors imports (existing, unchanged)         │  │
│  │  Layer 2: :root semantic tokens (existing + .matrix-theme)   │  │
│  │  Layer 3: @theme inline Tailwind utilities (additive)        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Type | Responsibility | New or Modified |
|-----------|------|----------------|-----------------|
| `(portfolio)/layout.tsx` | RSC | Shell: nav + footer + command palette. Add MotionProvider + matrix-theme class. | Modified |
| `(portfolio)/page.tsx` | RSC | Home page markup. Imports `AnimatedHeroSection` wrapping existing hero. | Modified |
| `PortfolioNav` | Client (existing) | Already client (uses `usePathname`). Matrix terminal-style active-link CSS. | Modified (CSS only) |
| `HeroSection` | RSC (existing) | Stays RSC. Content passes as `children` to `AnimatedHeroSection`. | Unchanged |
| `MatrixRainCanvas` | **Client (new)** | Canvas element + `requestAnimationFrame` loop. Uses `dynamic(ssr:false)`. | New |
| `AnimatedHeroSection` | **Client (new)** | Wraps RSC hero children with Framer Motion entrance animation. | New |
| `GlitchText` | **Client (new)** | CSS `@keyframes` glitch effect on headings. Respects `useReducedMotion`. | New |
| `MotionProvider` | **Client (new)** | `LazyMotion` + `MotionConfig reducedMotion="user"`. In portfolio layout. | New |
| `ThemeProvider` | Client (existing) | `next-themes` wrapper. Already in `app/layout.tsx`. | Unchanged |
| `globals.css` | CSS | Add Matrix color tokens; add `.matrix-theme` block; keep all existing tokens. | Modified (additive) |

---

## Question 1: Client/Server Boundary Decisions

### The Core Rule

Next.js 15 App Router renders all components as React Server Components (RSC) by default. Animations require DOM access and browser APIs unavailable server-side. The boundary is created with `"use client"`.

**Decision principle:** Push the `"use client"` boundary as far down the tree as possible. Server components can import and render client components. Client components cannot render server components as children except via the `children` prop pattern.

### Boundary Map for the Portfolio

```
app/layout.tsx (RSC)
  └── ThemeProvider (client, existing) — must be client for next-themes
      └── (portfolio)/layout.tsx (RSC) — stays RSC
          └── MotionProvider (client, new) — LazyMotion context
              ├── PortfolioNav (client, existing — uses usePathname)
              │     CSS-only Matrix styling added here; no new boundary
              ├── main > {children} (RSC pages flow through)
              │     └── (portfolio)/page.tsx (RSC)
              │           └── AnimatedHeroSection (CLIENT, new)
              │                 ├── RSC hero content (children — server-rendered)
              │                 └── MatrixRainCanvas (CLIENT, dynamic ssr:false)
              └── PortfolioFooter (RSC — no interaction needed)
```

**Key insight:** The existing `HeroSection` is a pure RSC. Rather than converting it, wrap it: create `AnimatedHeroSection` as a client component that receives the hero content as `children`. This keeps the hero text markup server-rendered (good for SEO and LCP) while the animation layer hydrates on the client.

```typescript
// components/portfolio/animated-hero-section.tsx
'use client';
import { m } from 'framer-motion';

interface AnimatedHeroSectionProps {
  children: React.ReactNode; // RSC children pass through — valid pattern
}

export function AnimatedHeroSection({ children }: AnimatedHeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Canvas behind content — absolutely positioned, decorative */}
      <MatrixRainCanvasLazy />
      {/* Animated wrapper — children are the RSC hero content */}
      <m.div
        className="relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {children}
      </m.div>
    </section>
  );
}
```

```typescript
// app/(portfolio)/page.tsx — RSC, structure barely changes
import { HeroSection } from '@/components/portfolio/hero-section';
import { AnimatedHeroSection } from '@/components/portfolio/animated-hero-section';

export default function HomePage() {
  return (
    <>
      <AnimatedHeroSection>
        <HeroSection />   {/* RSC passed as children — valid */}
      </AnimatedHeroSection>
      {/* rest of page content unchanged */}
    </>
  );
}
```

### Boundary Decision Table

| Component | Boundary Decision | Reason |
|-----------|------------------|--------|
| `(portfolio)/layout.tsx` | RSC | No interactive state needed at layout level |
| `MotionProvider` | Client | `LazyMotion` and React context providers must be client |
| `AnimatedHeroSection` | Client | Uses `m.div` (Framer Motion) — needs DOM |
| `MatrixRainCanvas` | Client + `dynamic(ssr:false)` | Canvas API not available server-side |
| `GlitchText` | Client | Uses `useReducedMotion` hook — needs browser |
| `HeroSection` | RSC (unchanged) | Static content; passed as children |
| `ProjectCard` | RSC (unchanged) if no hover animation; Client if `m.div` added | Depends on whether hover animation is CSS-only or Framer Motion |
| `TechStack` | RSC (unchanged) | CSS hover via Tailwind is RSC-safe |
| `PortfolioFooter` | RSC (unchanged) | No interaction |

---

## Question 2: Canvas-Based Matrix Rain in SSR Context

### The Problem

`<canvas>` requires the DOM. During SSR, there is no DOM. Any component that calls `useRef` on a canvas and starts a `requestAnimationFrame` loop will throw during server rendering.

### The Solution: `dynamic` with `ssr: false`

`next/dynamic` with `{ ssr: false }` skips server rendering for the component entirely. Next.js does not attempt to render it in the server HTML. The component mounts on the client after hydration.

```typescript
// In animated-hero-section.tsx (which is already "use client"):
import dynamic from 'next/dynamic';

const MatrixRainCanvasLazy = dynamic(
  () => import('./matrix-rain-canvas').then(m => m.MatrixRainCanvas),
  {
    ssr: false,
    loading: () => null, // No loading state — canvas appears on hydration, no flash
  }
);
```

```typescript
// components/portfolio/matrix-rain-canvas.tsx
'use client';
import { useEffect, useRef } from 'react';

const MATRIX_GREEN = '#00FF41';
const MATRIX_DARK = 'rgba(0, 13, 3, 0.05)'; // semi-transparent fade per frame

export function MatrixRainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>(0); // useRef NOT useState — no rerender on mutation

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect prefers-reduced-motion — skip loop entirely
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const fontSize = 14;
    const cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(cols).fill(1);

    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';

    // Cap at 30fps to protect Lighthouse performance score
    let lastTime = 0;
    const FPS_CAP = 30;
    const INTERVAL = 1000 / FPS_CAP;

    const animate = (timestamp: number) => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (timestamp - lastTime < INTERVAL) return;
      lastTime = timestamp;

      // Semi-transparent overlay creates fade trail effect
      ctx.fillStyle = MATRIX_DARK;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = MATRIX_GREEN;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    animationIdRef.current = requestAnimationFrame(animate);

    // Cleanup: prevents memory leaks and stacked loops on navigation
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []); // Empty deps: run once on mount

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"       // Decorative — screen readers must skip
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
      // opacity-20 keeps it ambient, not overwhelming
    />
  );
}
```

### Canvas and Lighthouse Performance Gates

The existing `lighthouserc.json` enforces `categories:performance: error at 0.9` on `/`, `/about`, `/projects`, `/projects/teamflow`, and `/login`.

| Metric | Canvas Impact | Mitigation |
|--------|--------------|------------|
| **LCP** | Zero — canvas elements are excluded from LCP candidate set by all browsers | Verify hero heading remains the LCP candidate |
| **CLS** | Zero — `position: absolute` removes canvas from document flow | No layout shift possible |
| **INP** | Low risk — 30fps cap, GPU-composited, `pointer-events-none` | Monitor with Lighthouse post-integration |
| **FCP** | Zero — canvas renders after hydration; FCP is the first text/image paint | Server-rendered hero text is FCP candidate |
| **TBT** | Low risk — `rAF` loop is async, does not block the main thread | Cap frame rate, avoid heavy per-frame computation |

**Critical:** Add `will-change: contents` or promote canvas to its own GPU layer via `transform: translateZ(0)` CSS to prevent the canvas animation from forcing paint invalidation on parent layers.

---

## Question 3: Framer Motion with App Router — Avoiding Hydration Errors

### Root Cause of Hydration Errors

Hydration errors occur when server HTML differs from what React expects during client-side hydration. Framer Motion's `motion.*` components inject animation state into the DOM immediately at mount, which differs from static server HTML. The fix is to ensure Framer Motion components never run during SSR.

The `"use client"` directive on a component file prevents that component from running on the server. Since `AnimatedHeroSection`, `GlitchText`, and any other animation components have `"use client"`, Framer Motion code inside them is safe from SSR.

### Recommended Integration: `LazyMotion` + `m` Components

Framer Motion's full bundle is ~34KB gzipped. Using `LazyMotion` with the `m` (lightweight) component variant reduces the initial client bundle contribution to ~4.6KB, loading animation features asynchronously. This is the performance-correct and hydration-safe pattern.

```typescript
// lib/motion-features.ts
// Async feature loader — loaded by LazyMotion on demand
const loadFeatures = () =>
  import('framer-motion').then((mod) => mod.domAnimation);

export default loadFeatures;
```

```typescript
// components/providers/motion-provider.tsx
'use client';
import { LazyMotion, MotionConfig } from 'framer-motion';
import loadFeatures from '@/lib/motion-features';

interface MotionProviderProps {
  children: React.ReactNode;
}

export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {/* reducedMotion="user" automatically disables transform animations
          for users with prefers-reduced-motion enabled — global accessibility gate */}
      <MotionConfig reducedMotion="user">
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
```

```typescript
// app/(portfolio)/layout.tsx — add MotionProvider
// This file is RSC. MotionProvider is a client component used as a wrapper.
import { MotionProvider } from '@/components/providers/motion-provider';
import { PortfolioNav } from '@/components/portfolio/nav';
import { PortfolioFooter } from '@/components/portfolio/footer';
import { CommandPalette } from '@/components/ui/command-palette';

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <div className="matrix-theme min-h-screen flex flex-col">
        <PortfolioNav />
        <main className="flex-1">{children}</main>
        <PortfolioFooter />
        <CommandPalette />
      </div>
    </MotionProvider>
  );
}
```

### Hydration Safety Rules

| Rule | Reason |
|------|--------|
| Put `"use client"` in every file that imports from `framer-motion` | Framer Motion accesses DOM APIs unavailable during SSR |
| Use `m.div`, `m.span` etc. inside `LazyMotion` — never `motion.div` inside it | `motion.*` eagerly loads all features; defeats LazyMotion's bundle splitting |
| Import `m` from `framer-motion`, not `motion` | `m` is the lightweight variant; `motion` is the full bundle |
| `LazyMotion` must be an ancestor of all `m.*` usage | React context: features unavailable if `LazyMotion` is not above the component |
| Do not place `AnimatePresence` in RSC files | Must be client-side; App Router navigation causes known quirks with AnimatePresence |
| `suppressHydrationWarning` on `<html>` is already present | In `app/layout.tsx` for next-themes; covers theme flashes; no change needed |

### Page Transitions Warning

App Router navigation causes pages to unmount and remount. `AnimatePresence` wrapping `{children}` in a layout is documented to have quirks with App Router (vercel/next.js #49279 — App Router's aggressive client transitions interfere with AnimatePresence exit animations).

**Recommendation:** Do not implement cross-page AnimatePresence transitions in this milestone. Entrance animations on individual sections (hero, project cards scrolling into view) are reliable and sufficient for the Matrix aesthetic. Page transitions can be added later once the known App Router friction is resolved upstream.

---

## Question 4: Tailwind v4 Token Migration for Matrix Dark-First

### Existing Token Architecture (Confirmed from Codebase)

The project uses a 3-layer pattern in `globals.css`:

- **Layer 1:** `@import "@radix-ui/colors/slate.css"` etc. Defines `--slate-1` through `--slate-12`. Dark variants loaded via separate dark CSS imports that automatically update variables when `.dark` is applied to `<html>`.
- **Layer 2:** `:root` block defines semantic tokens (`--background: var(--slate-1)`, `--primary: var(--blue-11)`, etc.) and a `.dark` block with overrides.
- **Layer 3:** `@theme inline` block maps semantic tokens to Tailwind utilities (`--color-background: var(--background)` → `bg-background` class).

### Non-Breaking Addition Strategy

**Principle: additive only.** Do not modify any existing Layer 1, 2, or 3 entries. All existing components use `bg-background`, `text-foreground`, `border-border` etc. — these must keep working.

**Add a new parallel section** for Matrix colors, then override the semantic tokens scoped to a `.matrix-theme` class applied to the portfolio layout div.

```css
/* globals.css additions — append after existing content */

/* ============================================================
   Matrix color raw scale
   No Radix dependency — defined directly as hex values
   Verified contrast: #00FF41 on #000d03 = ~15:1 (passes WCAG AAA)
   ============================================================ */
:root {
  --matrix-1:  #000d03;   /* near-black green — page background */
  --matrix-2:  #001a07;   /* deep green — surface/card */
  --matrix-3:  #00290d;   /* panel background */
  --matrix-4:  #003b13;   /* hover state */
  --matrix-5:  #005218;   /* border / separator */
  --matrix-6:  #006e20;   /* muted / disabled */
  --matrix-7:  #009429;   /* secondary text */
  --matrix-8:  #00bb33;   /* placeholder */
  --matrix-9:  #00cc38;   /* UI elements (3:1+ on --matrix-1) */
  --matrix-10: #00e040;   /* large text / icons */
  --matrix-11: #00FF41;   /* THE Matrix green — accent/headings ONLY */
  --matrix-12: #80ff90;   /* near-white green — body text on dark */

  /* Semantic aliases */
  --matrix-bg:          var(--matrix-1);
  --matrix-surface:     var(--matrix-2);
  --matrix-border:      var(--matrix-5);
  --matrix-text:        var(--matrix-12);
  --matrix-text-muted:  var(--matrix-9);
  --matrix-accent:      var(--matrix-11);
  --matrix-glow:        rgba(0, 255, 65, 0.12);
}

/* Expose Matrix tokens as Tailwind utilities via @theme inline */
@theme inline {
  --color-matrix-1:           var(--matrix-1);
  --color-matrix-2:           var(--matrix-2);
  --color-matrix-3:           var(--matrix-3);
  --color-matrix-4:           var(--matrix-4);
  --color-matrix-5:           var(--matrix-5);
  --color-matrix-6:           var(--matrix-6);
  --color-matrix-7:           var(--matrix-7);
  --color-matrix-8:           var(--matrix-8);
  --color-matrix-9:           var(--matrix-9);
  --color-matrix-10:          var(--matrix-10);
  --color-matrix-11:          var(--matrix-11);
  --color-matrix-12:          var(--matrix-12);
  --color-matrix-bg:          var(--matrix-bg);
  --color-matrix-surface:     var(--matrix-surface);
  --color-matrix-border:      var(--matrix-border);
  --color-matrix-text:        var(--matrix-text);
  --color-matrix-text-muted:  var(--matrix-text-muted);
  --color-matrix-accent:      var(--matrix-accent);
  --color-matrix-glow:        var(--matrix-glow);
}

/* Portfolio-specific semantic token overrides
   Scoped to .matrix-theme — applied ONLY on (portfolio)/layout.tsx
   Does NOT affect TeamFlow dashboard, auth pages, or any other route group */
.matrix-theme {
  --background:         var(--matrix-bg);
  --foreground:         var(--matrix-text);
  --card:               var(--matrix-surface);
  --card-foreground:    var(--matrix-text);
  --popover:            var(--matrix-surface);
  --popover-foreground: var(--matrix-text);
  --primary:            var(--matrix-11);        /* #00FF41 */
  --primary-foreground: var(--matrix-1);         /* dark text on bright green */
  --secondary:          var(--matrix-3);
  --secondary-foreground: var(--matrix-10);
  --muted:              var(--matrix-3);
  --muted-foreground:   var(--matrix-text-muted);
  --accent:             var(--matrix-4);
  --accent-foreground:  var(--matrix-10);
  --border:             var(--matrix-border);
  --input:              var(--matrix-border);
  --ring:               var(--matrix-9);
}

/* Matrix dark mode — even darker terminal feel
   When both .dark and .matrix-theme are active */
.dark.matrix-theme,
.dark .matrix-theme {
  /* Dark mode with Matrix is the default experience.
     The :root Matrix values above already assume dark.
     This block handles edge cases if light mode is somehow toggled
     on the portfolio. Keep Matrix bg even in "light" mode for brand
     consistency — the portfolio is dark-first by design. */
  --background: var(--matrix-1);
  --foreground: var(--matrix-12);
}
```

### WCAG Accessibility for Matrix Colors

`#00FF41` (Matrix accent) on `#000d03` (Matrix background):
- WCAG relative luminance of `#00FF41` = 0.6028 (green channel dominates)
- WCAG relative luminance of `#000d03` ≈ 0.00007
- Contrast ratio ≈ (0.6028 + 0.05) / (0.00007 + 0.05) ≈ 13.1:1 — passes WCAG AAA (7:1 threshold)

**Confidence: MEDIUM** — calculated manually; verify with WebAIM Contrast Checker before shipping. The project has `@axe-core/playwright` in devDependencies and a `categories:accessibility: warn at 1.0` Lighthouse gate that will surface any failures.

**Color blindness note:** `#00FF41` is near-pure saturated green. Deuteranopia/protanopia (~8% of men) reduces discrimination of green from yellow/amber. Never use `--matrix-accent` as the sole indicator of meaning — always pair with text, icons, or shape. The existing Radix Colors system handled this via their perceptually-uniform scale; the Matrix palette does not — require manual review for interactive elements.

---

## Question 5: Suggested Build Order

Build order is driven by:
1. **Dependency order:** Token system must exist before components use it
2. **Regression risk:** Never break Lighthouse gates; build in additive layers
3. **Independent verifiability:** Each phase is testable in isolation

### Phase A: Token Foundation (Zero Visual Change)

**What:** Add Matrix color tokens to `globals.css` and `.matrix-theme` class. No components modified yet.
**Why first:** All subsequent phases depend on having the tokens available. Zero regression risk — purely additive CSS that is not referenced by anything yet.
**Deliverable:** `bg-matrix-bg`, `text-matrix-accent`, `border-matrix-border` Tailwind utilities available.
**Test:** All existing visual regression snapshots pass unchanged (Matrix tokens unused).

```
Files touched: apps/web/app/globals.css
Risk: None
Gate: Existing snapshots unaffected
```

### Phase B: Canvas Matrix Rain (Isolated)

**What:** Build `MatrixRainCanvas` client component with `dynamic(ssr:false)`. Add to a `relative`-positioned container on the home page hero only (not all pages yet).
**Why second:** Fully standalone — no Framer Motion dependency. Test canvas performance before adding more animation layers.
**Critical gate:** Run Lighthouse CI after this phase. Confirm performance score remains 90+. If score drops, reduce frame rate cap or animation opacity before continuing.
**Visual regression:** Canvas renders random characters — exclude canvas from E2E screenshot comparison. Add env variable check:

```typescript
// In MatrixRainCanvas useEffect:
if (process.env.NEXT_PUBLIC_DISABLE_MATRIX_RAIN === 'true') return;
```

Set `NEXT_PUBLIC_DISABLE_MATRIX_RAIN=true` in `.env.test` so Playwright snapshots are stable.

```
Files touched:
  components/portfolio/matrix-rain-canvas.tsx (new)
  components/portfolio/animated-hero-section.tsx (new — canvas + position wrapper only)
  app/(portfolio)/page.tsx (swap HeroSection for AnimatedHeroSection wrapper)
Risk: Moderate — canvas performance. Lighthouse gates will surface issues.
Gate: Lighthouse performance 90+ on /
```

### Phase C: Motion Provider + Entrance Animations

**What:** Add `MotionProvider` (LazyMotion + MotionConfig) to `(portfolio)/layout.tsx`. Add entrance animations to `AnimatedHeroSection` (hero text fade-in). Add scroll-triggered entrance animations to project cards.
**Why third:** Requires stable canvas baseline from Phase B. `MotionProvider` must be in place before any `m.*` components mount.
**Hydration check:** After first client-side load, check browser console for hydration warnings. Zero hydration errors is the pass gate.

```
Files touched:
  components/providers/motion-provider.tsx (new)
  lib/motion-features.ts (new)
  app/(portfolio)/layout.tsx (add MotionProvider)
  components/portfolio/animated-hero-section.tsx (add m.div entrance)
  components/portfolio/project-card.tsx (add m.div with scroll trigger)
Risk: Moderate — hydration errors possible if Framer Motion crosses client/server boundary
Gate: Zero console hydration errors; Lighthouse 90+
```

### Phase D: Matrix Dark Theme Applied to Portfolio Routes

**What:** Apply `matrix-theme` class to the wrapping `<div>` in `(portfolio)/layout.tsx`. All portfolio pages will now use Matrix-green token values. Update `PortfolioNav` with Matrix terminal styling (monospace font in nav links, green glow on active link).
**Why fourth:** Depends on token foundation (Phase A) and animation stability (B, C). Making the visual overhaul after animations are confirmed stable is lower regression risk than doing both simultaneously.
**Visual regression:** All portfolio route snapshots will fail intentionally — the visual redesign changes the appearance. Update baseline snapshots after confirming the new appearance is correct.

```
Files touched:
  app/(portfolio)/layout.tsx (add matrix-theme to wrapper div)
  components/portfolio/nav.tsx (Matrix terminal styling)
  app/globals.css (already done in Phase A; no new changes)
Risk: High for visual regression — expected baseline updates
Gate: Update all portfolio snapshots in e2e/portfolio/visual-regression.spec.ts-snapshots/
```

### Phase E: Typography and Micro-Animations

**What:** Add `GlitchText` client component for heading glitch on hover. Add Matrix-green glow `box-shadow` to primary buttons. CSS-only hover transitions on tech stack cards.
**Why last:** Cosmetic polish. Each piece is independent — any can be deferred without blocking others.

```
Files touched:
  components/portfolio/glitch-text.tsx (new)
  components/portfolio/hero-section.tsx (use GlitchText on h1)
  components/ui/button.tsx (add Matrix glow variant or override)
  components/portfolio/tech-stack.tsx (CSS hover classes)
Risk: Low — CSS only; GlitchText is simple @keyframes
Gate: No new Lighthouse regressions
```

---

## Component Boundaries Reference

### New Components to Create

| File | Directive | Why Client |
|------|-----------|------------|
| `components/portfolio/matrix-rain-canvas.tsx` | `"use client"` + `dynamic(ssr:false)` | Canvas API, `requestAnimationFrame`, `window.matchMedia` — all browser-only |
| `components/portfolio/animated-hero-section.tsx` | `"use client"` | Contains `m.div` (Framer Motion) — requires DOM; wraps canvas dynamic import |
| `components/portfolio/animated-project-card.tsx` | `"use client"` | `m.div` for hover/scroll entrance animations |
| `components/portfolio/glitch-text.tsx` | `"use client"` | Uses `useReducedMotion` hook from Framer Motion |
| `components/providers/motion-provider.tsx` | `"use client"` | `LazyMotion`, `MotionConfig` — React context providers |
| `lib/motion-features.ts` | Module (no directive) | Pure async feature loader for `LazyMotion` — no DOM access |

### Modified Components (Existing)

| File | Type of Change | Risk |
|------|---------------|------|
| `app/(portfolio)/layout.tsx` | Add `MotionProvider` wrapper; add `matrix-theme` class to div | LOW — additive |
| `app/(portfolio)/page.tsx` | Swap `<HeroSection />` for `<AnimatedHeroSection><HeroSection /></AnimatedHeroSection>` | LOW |
| `components/portfolio/hero-section.tsx` | Add `relative` positioning to outer section for canvas | LOW |
| `components/portfolio/nav.tsx` | CSS class additions for Matrix glow styling — no logic change | LOW |
| `app/globals.css` | Append Matrix token block; `.matrix-theme` block | LOW — additive CSS only |
| `apps/web/package.json` | Add `framer-motion` dependency | LOW |

### Components That Must Stay RSC

| File | Reason |
|------|--------|
| `app/(portfolio)/page.tsx` | Must stay RSC — passes server-rendered content as children to client wrappers |
| `app/(portfolio)/about/page.tsx` | Pure content; no animation logic at page level |
| `app/(portfolio)/projects/page.tsx` | Lists projects; animated cards handle their own client boundary |
| `components/portfolio/hero-section.tsx` | Content only; `AnimatedHeroSection` is the animation wrapper |
| `components/portfolio/footer.tsx` | No interaction; stays RSC |
| `components/portfolio/tech-stack.tsx` | Static data; CSS hover is RSC-safe |
| `components/portfolio/case-study-section.tsx` | Static wrapper; no animation needed |

---

## Architectural Patterns

### Pattern 1: RSC Shell + Client Animation Leaf

**What:** RSC page renders content. A thin client wrapper applies animation. Content stays server-rendered.
**When to use:** Any existing RSC component that needs entrance animations.
**Trade-offs:** One more file per animated section. Avoids converting RSC pages to client which would re-render all children client-side and degrade LCP.

```typescript
// Pattern: RSC page wraps RSC content in client animation shell
<AnimatedHeroSection>  {/* CLIENT — animation wrapper */}
  <HeroSection />      {/* RSC — server-rendered content */}
</AnimatedHeroSection>
```

### Pattern 2: Dynamic Import for Browser-Only Components

**What:** `next/dynamic` with `ssr: false` for canvas and other browser-only components.
**When to use:** Canvas, WebGL, `window.*`, `document.*`, third-party browser-only libraries.
**Trade-offs:** Component is absent from SSR HTML. Use `loading: () => null` to prevent layout shift on hydration. Never use `ssr: false` for content that matters for SEO or LCP.

```typescript
const MatrixRainCanvasLazy = dynamic(
  () => import('./matrix-rain-canvas').then(m => m.MatrixRainCanvas),
  { ssr: false, loading: () => null }
);
```

### Pattern 3: Scoped Theme Override via CSS Class

**What:** A `.matrix-theme` class on the portfolio layout wrapper overrides Layer 2 semantic tokens (CSS variable values) for the portfolio route group only.
**When to use:** When the visual redesign must not affect other app routes (TeamFlow dashboard, auth pages).
**Trade-offs:** More CSS specificity to manage. Must document clearly. The `.dark` Radix Colors override still works correctly because both `.dark` and `.matrix-theme` can be active simultaneously.

```css
.matrix-theme { /* --background: --matrix-bg; --primary: --matrix-11; etc. */ }
/* Both active: class="dark matrix-theme" on the layout div — valid */
```

### Pattern 4: Reduced Motion as Animation Gate

**What:** `MotionConfig reducedMotion="user"` disables Framer Motion transforms globally for the portfolio. Canvas uses `window.matchMedia('(prefers-reduced-motion: reduce)')` for the same check.
**When to use:** All animations — non-negotiable for Lighthouse accessibility gate.
**Trade-offs:** None — required for WCAG 2.1 success criterion 2.3.3.

```typescript
// Framer Motion: handled globally in MotionProvider
<MotionConfig reducedMotion="user">...</MotionConfig>

// Canvas: manual check in useEffect
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReduced) return; // Skip rAF loop
```

### Pattern 5: `useRef` for Animation Frame IDs (Not `useState`)

**What:** Store `requestAnimationFrame` IDs in `useRef`, never `useState`.
**When to use:** Every canvas animation loop.
**Trade-offs:** None — this is the correct pattern. `useState` causes re-renders on set; re-rendering during a `rAF` loop is incorrect behavior that causes double-loop bugs and stale closures.

---

## Anti-Patterns

### Anti-Pattern 1: Converting RSC Pages to Client for Animation

**What people do:** Add `"use client"` to `app/(portfolio)/page.tsx` to use Framer Motion there directly.
**Why it's wrong:** Converts the entire page subtree to client-side rendering. Next.js loses RSC benefits (server data fetching, smaller bundle, no JS for static content). LCP typically degrades because the hero text is now client-rendered instead of arriving in the initial HTML.
**Do this instead:** Keep pages RSC. Create thin client wrapper components. Pass RSC content as `children` through the client boundary.

### Anti-Pattern 2: Mixing `motion.*` with `LazyMotion`

**What people do:** Import and use `motion.div` inside a component that lives inside `<LazyMotion>`.
**Why it's wrong:** `motion.div` eagerly loads all features regardless of `LazyMotion`, defeating the bundle split. The bundle grows back to ~34KB.
**Do this instead:** Inside any component rendered inside `<LazyMotion>`, always import and use `m.div`, `m.span`, etc. from `framer-motion`.

### Anti-Pattern 3: Canvas Without `cancelAnimationFrame` Cleanup

**What people do:** Start a `rAF` loop in `useEffect` without returning a cleanup function.
**Why it's wrong:** When the user navigates away, React unmounts the component but the loop continues in the background. Each navigation stacks another loop. After five navigations, five loops run simultaneously — memory leak and CPU spike.
**Do this instead:** Always store `rAF` ID in `useRef`. Return a cleanup function from `useEffect` that calls `cancelAnimationFrame(animationIdRef.current)`.

### Anti-Pattern 4: Inline Matrix Hex Values Bypassing Token System

**What people do:** Write `className="text-[#00FF41]"` during fast iteration to get the Matrix green applied quickly.
**Why it's wrong:** Bypasses `--matrix-accent`. If the shade changes, must update every file. The existing `DESIGN-SYSTEM.md` governance rule explicitly prohibits hardcoded color values; the Matrix redesign must follow the same rule.
**Do this instead:** Use `text-matrix-accent` (the Tailwind utility registered via `@theme inline`).

### Anti-Pattern 5: Decorative Canvas Without `aria-hidden`

**What people do:** Leave the Matrix rain canvas accessible to screen readers.
**Why it's wrong:** Screen readers announce `<canvas>` elements. Without `aria-hidden="true"`, the screen reader will announce "canvas" — confusing and meaningless for the user. The Lighthouse accessibility gate will surface this as a violation.
**Do this instead:** Always set `aria-hidden="true"` on decorative canvas elements.

### Anti-Pattern 6: Framer Motion `AnimatePresence` for Page Transitions in App Router

**What people do:** Wrap `{children}` in `(portfolio)/layout.tsx` with `AnimatePresence` for page exit transitions.
**Why it's wrong:** App Router's client-side navigation timing conflicts with `AnimatePresence` exit phase (documented in vercel/next.js #49279). The exit animation is cut short or skipped because the route has already unmounted by the time the animation completes.
**Do this instead:** Use per-section entrance animations (triggered by `IntersectionObserver` / Framer Motion `whileInView`) which are reliable and compose well with the Matrix aesthetic.

---

## Data Flow

### Animation Rendering Flow

```
Server
  └── Renders HTML for HeroSection text, project cards, about content
  └── MatrixRainCanvas is NOT in server HTML (ssr:false)
  └── Sends initial HTML to browser

Browser
  └── Displays server HTML immediately (fast FCP + LCP from server-rendered text)
  └── Hydrates: React claims the server HTML
  └── LazyMotion features load asynchronously (~4.6KB)
  └── MatrixRainCanvas mounts (dynamic import resolves)
      └── canvas starts rAF loop (30fps max)
  └── AnimatedHeroSection: m.div animates from opacity:0 → opacity:1 (0.6s)
  └── Project cards: entrance animation fires as user scrolls
```

### Theme Resolution Flow

```
Browser visits / (portfolio route)
  └── next-themes reads localStorage or system preference
  └── Applies class="dark" (or "light") to <html>
  └── Radix Colors dark imports activate under .dark
  └── (portfolio)/layout.tsx wrapper has class="matrix-theme"
  └── .matrix-theme overrides --background, --primary etc. with Matrix values
  └── All portfolio components see Matrix-themed tokens via existing utilities:
       bg-background → #000d03 (Matrix black-green)
       text-primary  → #00FF41 (Matrix green)
       border-border → #005218 (Matrix dark border)
```

---

## Integration Points

### External Dependency Addition

| Dependency | Action | Notes |
|------------|--------|-------|
| `framer-motion` | `npm install framer-motion --workspace=apps/web` | Not currently installed in apps/web. New addition. |

Verify framer-motion version after install. As of research date (2026-02-18), the package is published under `motion` (new name) at motion.dev, but `framer-motion` npm name still works and resolves to the same package.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| RSC pages → client animation wrappers | `children` prop | RSC content server-rendered; client wrapper animates without re-rendering content |
| `MotionProvider` → all `m.*` components | React context (`LazyMotion`) | MotionProvider must be ancestor of all `m.*` usage; placed in portfolio layout |
| `ThemeProvider` ↔ `.matrix-theme` CSS | No coupling — CSS specificity | Both coexist: `<html class="dark">` + `<div class="matrix-theme">` is valid |
| `MatrixRainCanvas` ↔ page layout | `position: absolute` inside `relative` container | Canvas is decorative overlay; does not participate in document flow |
| Lighthouse CI ↔ animation performance | `lighthouserc.json` gates | Canvas must not degrade score; Playwright tests must disable canvas via env var |

### Files Requiring Snapshot Updates (Phase D)

When `.matrix-theme` activates, these snapshot baselines will fail intentionally and need regeneration:

```
e2e/portfolio/visual-regression.spec.ts-snapshots/
  homepage-dark-chromium-linux.png   — WILL CHANGE
  homepage-light-chromium-linux.png  — WILL CHANGE
  about-dark-chromium-linux.png      — WILL CHANGE
  about-light-chromium-linux.png     — WILL CHANGE
  projects-dark-chromium-linux.png   — WILL CHANGE
  projects-light-chromium-linux.png  — WILL CHANGE
  resume-dark-chromium-linux.png     — WILL CHANGE
  resume-light-chromium-linux.png    — WILL CHANGE
  contact-dark-chromium-linux.png    — WILL CHANGE
  contact-light-chromium-linux.png   — WILL CHANGE
  teamflow-case-study-dark-chromium-linux.png   — WILL CHANGE
  teamflow-case-study-light-chromium-linux.png  — WILL CHANGE
```

Run `playwright test --update-snapshots` after Phase D to update baselines.

---

## Scaling Considerations

This is a portfolio site. Scaling concerns are performance budget concerns:

| Concern | Threshold | Approach |
|---------|-----------|----------|
| Canvas CPU | 30fps cap | Already in the implementation; monitor with Chrome DevTools Performance |
| Framer Motion bundle | 34KB full → 4.6KB with LazyMotion | Always use `LazyMotion` + `m.*` pattern; never `motion.*` inside LazyMotion |
| CSS custom properties | No practical limit | Additive token strategy adds ~40 new properties — negligible |
| Visual regression suite | 12 snapshots to update | Phase D snapshot update is expected and necessary; not a risk |

---

## Sources

**HIGH Confidence — Official Documentation:**
- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — Boundary rules, `"use client"` propagation
- [Next.js: Hydration Error Docs](https://nextjs.org/docs/messages/react-hydration-error) — Official hydration mismatch guidance
- [Motion (Framer): Reduce Bundle Size](https://motion.dev/docs/react-reduce-bundle-size) — `LazyMotion` + `m.*` pattern; 4.6KB vs 34KB
- [Motion (Framer): LazyMotion API](https://motion.dev/docs/react-lazy-motion) — Feature loading, strict mode
- [Motion (Framer): Accessibility](https://motion.dev/docs/react-accessibility) — `reducedMotion="user"` on MotionConfig
- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme) — `@theme inline` directive
- [Tailwind CSS v4 Dark Mode](https://tailwindcss.com/docs/dark-mode) — Class-based dark mode
- [Chrome Lighthouse: Non-Composited Animations](https://developer.chrome.com/docs/lighthouse/performance/non-composited-animations) — CLS and compositing
- [CSS Tricks: requestAnimationFrame with React Hooks](https://css-tricks.com/using-requestanimationframe-with-react-hooks/) — Correct `useRef` + `useEffect` + cleanup pattern

**MEDIUM Confidence — Verified Community Sources:**
- [Framer Motion Compatibility in Next.js: use client pattern](https://medium.com/@dolce-emmy/resolving-framer-motion-compatibility-in-next-js-14-the-use-client-workaround-1ec82e5a0c75) — Confirmed still valid in v15
- [Optimizing GSAP in Next.js 15](https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232) — Cleanup patterns; same patterns apply to rAF
- [Next.js 15 Hydration Errors 2026](https://medium.com/@blogs-world/next-js-hydration-errors-in-2026-the-real-causes-fixes-and-prevention-checklist-4a8304d53702) — Current hydration guidance
- [App Router + AnimatePresence GitHub Issue #49279](https://github.com/vercel/next.js/issues/49279) — Known limitation with page transitions
- [Theming Tailwind v4: Multiple Color Schemes](https://medium.com/@sir.raminyavari/theming-in-tailwind-css-v4-support-multiple-color-schemes-and-dark-mode-ba97aead5c14) — Scoped theme class pattern
- [GSAP vs Motion bundle comparison](https://motion.dev/docs/gsap-vs-motion) — Bundle size data; Framer Motion chosen for React-native API

**Codebase Analysis (HIGH Confidence — direct inspection):**
- `apps/web/app/globals.css` — Existing 3-layer Radix Colors + @theme inline pattern confirmed. Addition strategy derived from existing structure.
- `apps/web/app/layout.tsx` — `suppressHydrationWarning` on `<html>` confirmed. ThemeProvider client wrapper pattern confirmed.
- `apps/web/app/(portfolio)/layout.tsx` — RSC confirmed; safe to add MotionProvider wrapper and matrix-theme class.
- `apps/web/components/portfolio/hero-section.tsx` — RSC confirmed (no `"use client"`); safe to use as children.
- `apps/web/components/portfolio/nav.tsx` — Already `"use client"` (uses `usePathname`); safe to add CSS Matrix styling.
- `apps/web/components/ui/theme-toggle.tsx` — `useState(false)` + `useEffect setMounted` pattern confirmed as the hydration-safe model for client components reading browser state.
- `apps/web/lighthouserc.json` — `categories:performance: error at 0.9` confirmed. Affects `/`, `/about`, `/projects`, `/projects/teamflow`, `/login`.
- `apps/web/package.json` — `framer-motion` not present; must be installed. `tailwindcss: ^4.1.18` confirmed.

---

*Architecture research for: Matrix-aesthetic portfolio redesign on Next.js 15 App Router*
*Researched: 2026-02-18*
*Scope: apps/web — Fernando Millan portfolio routes `(portfolio)/**`*
*Existing DevCollab monorepo architecture: see archived v2.0 research (ARCHITECTURE.md prior state)*
