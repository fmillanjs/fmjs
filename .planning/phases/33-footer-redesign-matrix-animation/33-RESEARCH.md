# Phase 33: Footer Redesign + Matrix Animation - Research

**Researched:** 2026-02-21
**Domain:** CSS animations, IntersectionObserver, Next.js App Router, Playwright visual regression
**Confidence:** HIGH — all findings verified directly from the live codebase and MDN/official sources

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOOTER-01 | Footer has `#0a0a0a` background with a `--matrix-green-border` top border, replacing current `bg-muted` styling | Confirmed: `footer.tsx` currently has `className="border-t bg-muted"`. Token `--matrix-green-border: #00FF4133` is defined in `.matrix-theme {}` since Phase 32. Swap is a single-line className change plus inline style for border-top. |
| FOOTER-02 | Social links render as terminal-prompt style (`> github`, `> linkedin`, `> email`) in monospace Matrix green | Confirmed: current footer has icon-only GitHub + CodeSignal links with no text. FOOTER-02 requires text links — `> github`, `> linkedin`, `> email` — replacing icon links. URL and hrefs need updating (email needs `mailto:` href). |
| FOOTER-03 | Footer includes a `> EOF` tagline as narrative close | Static text addition above the copyright line. No JS needed. `font-mono text-[var(--matrix-green)]` per established SectionLabel pattern. |
| FOOTER-04 | Footer has CRT scanline texture via CSS `::before` pseudo-element (zero JS, no animation library) | `footer` element needs `position: relative` and a `::before` pseudo-element with `repeating-linear-gradient`. Pattern verified from MDN + multiple authoritative sources. `--matrix-scan-line: #00FF410D` token (Phase 32) is the scanline color. Must be `pointer-events: none` and `aria-hidden`. |
| FOOTER-05 | "Fernando Millan" signature has single-fire CSS glitch animation when scrolled into view (IntersectionObserver, fires once, `animation-iteration-count: 1`) | Requires `'use client'` component with `useEffect` + `IntersectionObserver`. Observer disconnects after first intersection. CSS `@keyframes` glitch added to globals.css. Reduced-motion: no animation class added. `--matrix-scan-line` token consulted for color match. |
| FOOTER-06 | All footer links are keyboard-accessible with visible focus rings | Current social links already have `aria-label`. Need `:focus-visible` ring. Project uses Tailwind `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--matrix-green)]` pattern (verified from existing nav component). |
| FOOTER-07 | All 18 Playwright visual regression snapshots pass at maxDiffPixelRatio 0.02; reduced-motion users see static footer | 12 portfolio + 6 dashboard = 18 confirmed. All portfolio specs use `reducedMotion: 'reduce'` — glitch animation must not fire in tests. Update command confirmed. |
</phase_requirements>

---

## Summary

Phase 33 redesigns the existing `PortfolioFooter` component from a generic three-column layout with `bg-muted` background into a terminal-themed footer with `#0a0a0a` background, CRT scanline overlay, terminal-prompt social links, `> EOF` tagline, and a single-fire CSS glitch animation on the "Fernando Millan" signature.

The current footer (`apps/web/components/portfolio/footer.tsx`) is a Server Component. Phase 33 requires splitting it: the static shell (background, scanlines, links, `> EOF`, copyright) stays Server Component, but the glitch animation on the name requires a `'use client'` island that wraps only the signature span. This follows the exact pattern used by `MatrixRainCanvas` (exported as `default`, imported via `next/dynamic` with `ssr: false` in `HeroSection`). The `DotGridSpotlight` component provides a close reference: `useReducedMotion` guard, `useEffect` for the browser API call, `aria-hidden` on the decorative element.

The CSS token `--matrix-scan-line: #00FF410D` (~5% opacity Matrix green) was defined in Phase 32 for exactly this use. The four tokens from Phase 32 (`--matrix-green-subtle`, `--matrix-green-border`, `--matrix-scan-line`, `--matrix-terminal`) are available immediately in `.matrix-theme` context. No new packages are required. All Playwright visual regression snapshots already run with `reducedMotion: 'reduce'`, which triggers the global CSS rule that sets `animation-duration: 0.01ms !important` — this makes the glitch animation invisible in snapshots without any test-specific code.

**Primary recommendation:** Split footer into a static Server Component shell + a `GlitchSignature` 'use client' island loaded via `next/dynamic` with `ssr: false`. CSS scanlines go on the `<footer>` element's `::before` in globals.css. IntersectionObserver in `GlitchSignature` adds a class once and disconnects. All 18 snapshots update without special handling because reduced-motion suppresses the animation globally.

---

## Current Footer: Exact State

```tsx
// apps/web/components/portfolio/footer.tsx (Phase 32 end state)
// LINE 8: <footer className="border-t bg-muted">
// LINE 12-18: Column 1 — "Fernando Millan" h3 + tagline p
// LINE 26-59: Column 2 — Quick Links (Home, About, Projects, Contact)
//             hover:text-[var(--matrix-green)] ← already applied in Phase 32
// LINE 62-87: Column 3 — Social Links (icon-only GitHub + CodeSignal)
//             hover:text-[var(--matrix-green)] ← already applied in Phase 32
// LINE 90-95: Copyright line

// Social links currently use:
//   - GitHub: https://github.com/fmillanjs (GitHub icon)
//   - CodeSignal: https://codesignal.com/... (ExternalLink icon)
// FOOTER-02 requires TEXT links: > github, > linkedin, > email
// The LinkedIn URL and email address are not in footer.tsx — research confirms
// they need to be added (matching the contact page content).
```

The footer is currently a Server Component (no `'use client'`). This must be maintained for the static parts.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CSS custom properties | Native | `--matrix-green-border`, `--matrix-scan-line`, `--matrix-terminal` tokens | All defined in `.matrix-theme {}` since Phase 32 — consume directly |
| `next/dynamic` | Next.js 15.1 | Load `GlitchSignature` as `ssr: false` island | Required pattern: `IntersectionObserver` is browser-only API, SSR crashes without it |
| `motion/react` | 12.34.2 | `useReducedMotion()` hook for reduced-motion guard | Project convention — same hook used in `MagneticButton`, `AnimateIn`, `DotGridSpotlight` |
| Playwright `@playwright/test` | 1.58.2 | Visual regression baseline update | Already installed; same command as Phase 32 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@axe-core/playwright` | 4.11.1 | WCAG AA accessibility verification | Run after footer changes to confirm focus ring visibility + no violations |
| `lucide-react` | 0.564.0 | Icons (if any icon remains in footer) | Optional — FOOTER-02 asks for text links, not icons |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `IntersectionObserver` in `useEffect` | `react-intersection-observer` npm package | Do NOT add a new package. Project pattern is native browser APIs in `useEffect` (see `DotGridSpotlight`, `MagneticButton`). Native is sufficient for single-fire pattern. |
| CSS `::before` scanlines | Canvas, JS animation library | Explicitly out of scope — FOOTER-04 mandates CSS only, no JS |
| `next/dynamic` with `ssr: false` | `useEffect` + conditional render in Server Component | `next/dynamic` is the established project pattern for browser-only components (see `MatrixRainCanvas` in `HeroSection`) |
| `clip-path: inset()` glitch | `transform: skewX() + translateX()` glitch | `transform`-only glitch has better Safari compatibility, lower complexity, runs on compositor. Use `transform` approach (see Code Examples below). |

**Installation:** No new packages required. All needed libraries are already in the project.

---

## Architecture Patterns

### Recommended File Structure for Phase 33

```
apps/web/
├── app/
│   └── globals.css                    # ADD: @keyframes footer-glitch + .footer-crt-scanlines rule
├── components/portfolio/
│   ├── footer.tsx                     # MODIFY: full redesign, add next/dynamic GlitchSignature
│   └── glitch-signature.tsx           # NEW: 'use client' island — IntersectionObserver + animation class
```

### Pattern 1: Static Server Component Footer Shell

**What:** Keep `footer.tsx` as a Server Component (no `'use client'`). The static structure — background, scanlines via CSS class, terminal prompt links, `> EOF`, copyright — renders on the server with zero JS.

**When to use:** All content except the glitch animation.

```tsx
// apps/web/components/portfolio/footer.tsx
import dynamic from 'next/dynamic';

const GlitchSignature = dynamic(
  () => import('./glitch-signature'),
  { ssr: false }
);

export function PortfolioFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="footer-crt-scanlines relative border-t"
      style={{
        background: '#0a0a0a',
        borderTopColor: 'var(--matrix-green-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Column 1: Glitch signature + tagline */}
        <div>
          <GlitchSignature />
          <p className="text-sm text-muted-foreground mt-2">
            Full-Stack Engineer building production-ready SaaS applications
          </p>
        </div>

        {/* Column 2: Quick Links */}
        {/* ... unchanged nav links ... */}

        {/* Column 3: Terminal-prompt social links */}
        <div>
          <ul className="space-y-2">
            <li>
              <a
                href="https://github.com/fmillanjs"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-[var(--matrix-terminal)] hover:text-[var(--matrix-green)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--matrix-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-sm"
                aria-label="GitHub profile"
              >
                {'>'} github
              </a>
            </li>
            <li>
              <a
                href="https://linkedin.com/in/fernando-millan"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-[var(--matrix-terminal)] hover:text-[var(--matrix-green)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--matrix-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-sm"
                aria-label="LinkedIn profile"
              >
                {'>'} linkedin
              </a>
            </li>
            <li>
              <a
                href="mailto:fernando@example.com"
                className="font-mono text-sm text-[var(--matrix-terminal)] hover:text-[var(--matrix-green)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--matrix-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-sm"
                aria-label="Email Fernando"
              >
                {'>'} email
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* > EOF tagline */}
      <div className="text-center pb-4">
        <p className="font-mono text-xs text-[var(--matrix-green-border)]">
          {'>'} EOF
        </p>
      </div>

      {/* Copyright */}
      <div className="border-t border-[var(--matrix-green-border)] py-4">
        <p className="text-center text-xs font-mono text-muted-foreground">
          &copy; {currentYear} Fernando Millan. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
```

### Pattern 2: CRT Scanline `::before` in globals.css

**What:** Pure CSS `::before` pseudo-element with `repeating-linear-gradient`. No JS, no canvas. Applied via a class on the `<footer>` element.

**When to use:** Exclusively for the footer CRT texture (FOOTER-04).

```css
/* apps/web/app/globals.css — add to .matrix-theme context or global rules */

/* FOOTER-04: CRT scanline texture */
/* Applied to the footer element; pointer-events: none prevents interaction blocking */
/* Uses --matrix-scan-line (#00FF410D, ~5% opacity) defined in Phase 32 .matrix-theme */
.footer-crt-scanlines::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    var(--matrix-scan-line) 2px,
    var(--matrix-scan-line) 4px
  );
  pointer-events: none;
  z-index: 0;
  border-radius: inherit;
}

/* Ensure footer content renders above scanline overlay */
.footer-crt-scanlines > * {
  position: relative;
  z-index: 1;
}
```

**Why `repeating-linear-gradient` over two-gradient approach:** The single-gradient approach using the `--matrix-scan-line` token keeps opacity sourced from the token (5% Matrix green). The two-gradient CRT approach uses RGB separation colors (red, green, blue channels) which would break the terminal aesthetic. Single-gradient horizontal scanlines are sufficient and visually correct.

### Pattern 3: Single-Fire Glitch Signature Island

**What:** `'use client'` component that uses `IntersectionObserver` to add a CSS animation class once when the element scrolls into view. Observer disconnects immediately after first fire. Reduced-motion users never receive the animation class.

**When to use:** The "Fernando Millan" signature only.

```tsx
// apps/web/components/portfolio/glitch-signature.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

export default function GlitchSignature() {
  const ref = useRef<HTMLSpanElement>(null)
  const [hasGlitched, setHasGlitched] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    // Reduced-motion: skip observer entirely — no animation class ever added
    if (prefersReducedMotion) return
    // Already fired: skip (handles StrictMode double-invoke)
    if (hasGlitched) return

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add glitch animation class — fires CSS keyframe once
            el.classList.add('footer-glitch-once')
            setHasGlitched(true)
            // Disconnect immediately — single fire, never repeats
            observer.disconnect()
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [prefersReducedMotion, hasGlitched])

  return (
    <span
      ref={ref}
      className="text-lg font-bold text-foreground font-mono"
      aria-label="Fernando Millan"
    >
      Fernando Millan
    </span>
  )
}
```

### Pattern 4: CSS Glitch Keyframes (transform-only, Safari-safe)

**What:** `@keyframes` using `transform: skewX() translateX()` — no `clip-path`. This avoids the Safari partial-support concern flagged in STATE.md.

**When to use:** Instead of `clip-path: inset()` glitch, which has historical Safari rendering bugs with animations.

```css
/* apps/web/app/globals.css */

/* FOOTER-05: Single-fire text glitch animation */
/* Uses transform only (not clip-path) for Safari compatibility */
/* animation-iteration-count: 1 — fires exactly once */
/* animation-fill-mode: forwards — holds final state after completion */
@keyframes footer-glitch {
  0%   { transform: translate(0, 0) skewX(0deg); opacity: 1; }
  10%  { transform: translate(-3px, 0) skewX(-4deg); opacity: 0.9; }
  20%  { transform: translate(3px, 0) skewX(4deg); opacity: 1; }
  30%  { transform: translate(-2px, 0) skewX(0deg); opacity: 0.85; }
  40%  { transform: translate(2px, 0) skewX(2deg); opacity: 1; }
  50%  { transform: translate(0, 0) skewX(-2deg); opacity: 0.95; }
  60%  { transform: translate(-1px, 0) skewX(1deg); opacity: 1; }
  70%  { transform: translate(1px, 0) skewX(-1deg); opacity: 0.9; }
  80%  { transform: translate(0, 0) skewX(0deg); opacity: 1; }
  90%  { transform: translate(-1px, 0) skewX(1deg); opacity: 0.95; }
  100% { transform: translate(0, 0) skewX(0deg); opacity: 1; }
}

.footer-glitch-once {
  animation: footer-glitch 0.6s ease-out 1 forwards;
  /* animation-iteration-count: 1 via shorthand 'once' above */
}
```

**Why transform-only over clip-path:** STATE.md explicitly flags "CSS `clip-path` glitch animation Safari compatibility — verify during Phase 33 planning." Research confirms `clip-path` in animated keyframes has "improper redrawing" bugs in Safari versions. `transform` runs on the GPU compositor in all modern browsers with no known issues. Falls back gracefully: without the `.footer-glitch-once` class, the element renders normally.

### Pattern 5: Focus Ring for Keyboard Accessibility

**What:** `:focus-visible` ring using Matrix green. Uses `ring-offset` matching the `#0a0a0a` footer background.

**When to use:** All `<a>` and interactive elements in the footer.

```tsx
// Tailwind classes for keyboard-accessible links
className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--matrix-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-sm"
```

**Why `ring-offset-[#0a0a0a]`:** The footer background is `#0a0a0a` (not `--background`). The ring-offset color must match or the focus ring visually bleeds. This is the same issue as the hero CTA buttons needing to match their section background.

**Why `focus-visible` not `focus`:** `:focus-visible` only shows the ring on keyboard navigation, not on mouse click. This is the correct WCAG 2.1 AA pattern (confirmed from project's existing nav component which uses the same class).

### Anti-Patterns to Avoid

- **`clip-path` in glitch animation keyframes:** Known Safari rendering bug — text redraws incorrectly on window resize or repaint. Use `transform: skewX() translateX()` instead.
- **`animation-iteration-count: infinite` on glitch:** Accessibility violation for photosensitive users (explicitly in REQUIREMENTS.md "Out of Scope"). Single-fire with `animation-iteration-count: 1` is required.
- **Second MatrixRainCanvas in footer:** Explicitly out of scope in REQUIREMENTS.md — "Redundant GPU load + visually reads as copy-paste of hero."
- **`--matrix-scan-line` in `:root` or `@theme inline`:** Token belongs in `.matrix-theme {}` (already there from Phase 32). Never register in `@theme inline` — causes dashboard bleed.
- **Not disconnecting the IntersectionObserver:** Memory leak on long sessions. Must call `observer.disconnect()` inside the `isIntersecting` branch AND in the `useEffect` cleanup return.
- **`animation-fill-mode` omitted:** Without `forwards`, the element snaps back to pre-animation state after glitch completes. Use `forwards` to hold final position.
- **Using `bg-muted` style on `#0a0a0a` footer:** `bg-muted` resolves to `--muted: var(--slate-3)` which is a light gray. In dark mode `--muted` resolves to a dark gray, but still NOT `#0a0a0a`. Must use inline `style={{ background: '#0a0a0a' }}` or a fixed-value Tailwind class `bg-[#0a0a0a]`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reduced-motion detection | `window.matchMedia()` directly in render | `useReducedMotion()` from `motion/react` | Project convention; SSR-safe (returns null on server which is falsy — hydration-safe pattern confirmed in `MagneticButton`) |
| CRT scan texture | Canvas-based scanline rendering, JS animation | CSS `::before` with `repeating-linear-gradient` | FOOTER-04 explicitly mandates CSS-only; token `--matrix-scan-line` already defined |
| Single-fire animation | setTimeout, state polling, JS animation library | Native `IntersectionObserver` + `observer.disconnect()` + CSS class | Browser native since 2019, project already uses this pattern for `AnimateIn` (`viewport: { once: true }` via motion) |
| Focus ring visibility | Custom JS focus tracking | CSS `:focus-visible` + Tailwind `focus-visible:ring-*` | WCAG 2.1 §2.4.11 — `:focus-visible` is the correct standards-compliant approach |

**Key insight:** Every visual effect in Phase 33 has a CSS-or-browser-native answer. Zero new npm packages are needed.

---

## Common Pitfalls

### Pitfall 1: `GlitchSignature` SSR Crash

**What goes wrong:** `IntersectionObserver` does not exist in the Node.js SSR environment. If `glitch-signature.tsx` is imported normally (not via `next/dynamic`), Next.js SSR crashes with `ReferenceError: IntersectionObserver is not defined`.

**Why it happens:** Server Components execute in Node.js where browser APIs don't exist.

**How to avoid:** Use `next/dynamic(() => import('./glitch-signature'), { ssr: false })` in `footer.tsx`. The observer only runs on the client. This is the exact same pattern as `MatrixRainCanvas` in `hero-section.tsx`.

**Warning signs:** Build error or runtime error mentioning `IntersectionObserver is not defined`.

### Pitfall 2: Glitch Fires in Playwright Snapshots

**What goes wrong:** The glitch animation visually changes the footer text appearance. If it fires during a Playwright screenshot, the baseline shows the animated state and every subsequent test run sees a different state → flaky tests.

**Why it happens:** Playwright injects JavaScript after page load, and `IntersectionObserver` callbacks fire during `waitForLoadState('networkidle')`.

**How to avoid:** All 12 portfolio Playwright tests already call `page.emulateMedia({ reducedMotion: 'reduce' })`. The project's global CSS rule in `globals.css` enforces `animation-duration: 0.01ms !important` for `prefers-reduced-motion: reduce`. The glitch duration drops to 0.01ms — invisible and functionally static. No test-specific code needed.

**Warning signs:** If you see snapshot diffs only on the footer section, check that the global reduced-motion CSS rule covers `.footer-glitch-once`.

### Pitfall 3: React StrictMode Double-Invoke

**What goes wrong:** In development (`npm run dev`), React StrictMode double-invokes `useEffect`. The IntersectionObserver gets created twice. The first observer fires, sets `hasGlitched(true)` and disconnects. The second observer never fires because `hasGlitched` is `true` on remount — but without the `hasGlitched` guard, the second observer fires again → two glitch animations in dev mode.

**Why it happens:** StrictMode intentionally mounts → unmounts → remounts to detect side effects.

**How to avoid:** The `hasGlitched` state guard + the `if (hasGlitched) return` inside `useEffect` prevents the second observer from being created. The `useEffect` cleanup `return () => observer.disconnect()` handles the unmount between mounts correctly.

**Warning signs:** In development, the name glitches twice on first scroll. In production builds, this won't happen since StrictMode double-invoke only occurs in development.

### Pitfall 4: `ring-offset` Color Mismatch on Focus Ring

**What goes wrong:** Using `focus-visible:ring-offset-background` on links inside the `#0a0a0a` footer causes the ring offset to be the light `--background` color (slate-1 light or dark slate-1 in dark mode). This looks like a white or gray gap between the link text and the green ring — visually broken.

**Why it happens:** Tailwind's `ring-offset-background` uses `--background` which is `--slate-1` — not `#0a0a0a`.

**How to avoid:** Use `focus-visible:ring-offset-[#0a0a0a]` (arbitrary value matching the footer background exactly).

**Warning signs:** Focus ring has a visible white or gray gap between link and ring in dark mode.

### Pitfall 5: Scanline `z-index` Blocks Content Interaction

**What goes wrong:** The `::before` pseudo-element with `position: absolute; inset: 0` can sit above interactive content, blocking clicks and keyboard access to links.

**Why it happens:** If `z-index` is not managed correctly, the overlay is above the content stacking order.

**How to avoid:** Set `z-index: 0` on `::before` and `position: relative; z-index: 1` on all direct children of the footer. Also set `pointer-events: none` on the `::before` element as a belt-and-suspenders measure. Footer element itself must have `position: relative`.

**Warning signs:** Playwright accessibility test reports links as non-clickable or axe finds `aria-hidden` elements blocking focusable children.

### Pitfall 6: LinkedIn / Email URLs Unknown

**What goes wrong:** FOOTER-02 requires `> linkedin` and `> email` links. The current `footer.tsx` only has GitHub and CodeSignal. The correct LinkedIn URL and email address for Fernando Millan are not in `footer.tsx` — they may be in the contact page.

**Why it happens:** The footer was built with minimal social links; the full contact info lives in `contact/page.tsx`.

**How to avoid:** Read `apps/web/app/(portfolio)/contact/page.tsx` before writing the new footer to extract the correct LinkedIn URL and email address. Do not invent these values.

**Warning signs:** Broken links or placeholder `href="#"` in the footer.

---

## Code Examples

Verified patterns from official sources and live codebase:

### CRT Scanline via `::before` (globals.css)

```css
/* Source: MDN repeating-linear-gradient + verified from aleclownes.com CRT technique */
/* Token --matrix-scan-line: #00FF410D defined in .matrix-theme since Phase 32 */
.footer-crt-scanlines::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    var(--matrix-scan-line) 2px,
    var(--matrix-scan-line) 4px
  );
  pointer-events: none;
  z-index: 0;
}

.footer-crt-scanlines > * {
  position: relative;
  z-index: 1;
}
```

### Glitch Keyframe + Class (globals.css)

```css
/* Source: CSS-Tricks glitch pattern, adapted to transform-only for Safari safety */
/* animation-iteration-count: 1 (single fire) */
@keyframes footer-glitch {
  0%   { transform: translate(0) skewX(0deg);   opacity: 1; }
  10%  { transform: translate(-3px) skewX(-4deg); opacity: 0.9; }
  20%  { transform: translate(3px) skewX(4deg);  opacity: 1; }
  30%  { transform: translate(-2px) skewX(0deg);  opacity: 0.85; }
  40%  { transform: translate(2px) skewX(2deg);  opacity: 1; }
  50%  { transform: translate(0) skewX(-2deg);   opacity: 0.95; }
  60%  { transform: translate(-1px) skewX(1deg); opacity: 1; }
  70%  { transform: translate(1px) skewX(-1deg); opacity: 0.9; }
  80%  { transform: translate(0) skewX(0deg);    opacity: 1; }
  90%  { transform: translate(-1px) skewX(1deg); opacity: 0.95; }
  100% { transform: translate(0) skewX(0deg);    opacity: 1; }
}

/* Class added by IntersectionObserver — never in markup by default */
.footer-glitch-once {
  animation: footer-glitch 0.6s ease-out 1 forwards;
}
```

### IntersectionObserver Single-Fire Pattern (glitch-signature.tsx)

```tsx
// Source: MDN IntersectionObserver.disconnect() + project pattern from DotGridSpotlight
'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

export default function GlitchSignature() {
  const ref = useRef<HTMLSpanElement>(null)
  const [hasGlitched, setHasGlitched] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion || hasGlitched) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          el.classList.add('footer-glitch-once')
          setHasGlitched(true)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [prefersReducedMotion, hasGlitched])

  return (
    <span ref={ref} className="text-lg font-bold text-foreground font-mono">
      Fernando Millan
    </span>
  )
}
```

### `next/dynamic` Import of Client Island (footer.tsx)

```tsx
// Source: apps/web/components/portfolio/hero-section.tsx (same pattern for MatrixRainCanvas)
import dynamic from 'next/dynamic';

const GlitchSignature = dynamic(
  () => import('./glitch-signature'),
  { ssr: false }
)
```

### Focus Ring Classes for Terminal Links (FOOTER-06)

```tsx
// Source: project nav.tsx focus pattern + WCAG 2.1 :focus-visible standard
className={[
  'font-mono text-sm text-[var(--matrix-terminal)]',
  'hover:text-[var(--matrix-green)] transition-colors',
  'focus-visible:outline-none',
  'focus-visible:ring-2 focus-visible:ring-[var(--matrix-green)]',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]',
  'rounded-sm',
].join(' ')}
```

### Playwright Baseline Update Command (FOOTER-07)

```bash
# Run from apps/web directory
# Step 1: Update the 12 portfolio baselines (footer changed on all routes)
npx playwright test --config=playwright.visual.config.ts --update-snapshots

# Step 2: Verify all 18 pass without update flag
npx playwright test --config=playwright.visual.config.ts

# Step 3: Confirm dashboard snapshots are unchanged (must be 0 diff)
git diff --stat apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/
# Expected: no output — dashboard has no footer changes
```

---

## Contact Page Audit (LinkedIn / Email Discovery)

The LinkedIn URL and email are needed for FOOTER-02 but are NOT in `footer.tsx`. Before writing the new footer, the planner must inspect `apps/web/app/(portfolio)/contact/page.tsx` to extract:

1. The LinkedIn profile URL (expected format: `https://linkedin.com/in/...`)
2. The email address (expected: `mailto:...`)

The CodeSignal link in the current footer is not required by FOOTER-02 (which specifies `> github`, `> linkedin`, `> email` — not CodeSignal). It can be removed or relegated to the Quick Links column.

---

## CSS Token Reference (from Phase 32)

All four Phase 32 tokens are available in `.matrix-theme {}` context — the footer is inside `.matrix-theme` wrapper (confirmed from `layout.tsx`):

| Token | Value | Use in Phase 33 |
|-------|-------|----------------|
| `--matrix-green-border` | `#00FF4133` (~20% opacity green) | `border-top-color` on footer, `border-t` between sections |
| `--matrix-scan-line` | `#00FF410D` (~5% opacity green) | CRT scanline `::before` color |
| `--matrix-terminal` | `#00FF41` (full bright) | Terminal prompt link text color (`> github`) |
| `--matrix-green-subtle` | `#00FF4108` (~3% opacity green) | Not primary in footer, but available |

Plus the three existing `:root` tokens:

| Token | Value | Use in Phase 33 |
|-------|-------|----------------|
| `--matrix-green` | `#00FF41` | Hover state, focus ring, identical to `--matrix-terminal` |
| `--matrix-green-dim` | `#00CC33` | Optional dimmer green for `> EOF` tagline |
| `--matrix-green-ghost` | `#00FF4120` | Not needed in footer |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `clip-path: inset()` glitch animations | `transform: skewX() translateX()` glitch | Safari compatibility issue identified 2024 | Safari renders `clip-path` animation incorrectly on redraws; `transform` is GPU compositor path in all browsers |
| IntersectionObserver polyfills | Native `IntersectionObserver` (disconnect after fire) | Browser baseline shifted; available since 2019 | No polyfill needed, disconnect() is the single-fire pattern |
| CSS glitch with JS random clip values | Deterministic CSS `@keyframes` | Best practice 2024+ | Deterministic frames are stable in Playwright snapshots; random JS values break visual regression |
| `focus` ring (shows on mouse click) | `focus-visible` ring (keyboard only) | WCAG 2.1 / browser support established | Correct accessibility pattern; avoids the "focus ring on click" UX issue |

**Deprecated/outdated:**
- `animation-iteration-count: infinite` on glitch animations: Accessibility violation for photosensitive users (REQUIREMENTS.md Out of Scope). Never use.
- `-webkit-clip-path` vendor prefix for new code: Current browsers (Chrome 120+, Safari 17+, Firefox) support `clip-path` unprefixed. Still recommended as belt-and-suspenders if using `clip-path`, but Phase 33 uses `transform` instead.

---

## Open Questions

1. **LinkedIn URL and Email Address for Fernando Millan**
   - What we know: Current `footer.tsx` only has GitHub + CodeSignal links. FOOTER-02 requires `> linkedin` and `> email`.
   - What's unclear: The exact LinkedIn profile URL slug and email address — not present in `footer.tsx`.
   - Recommendation: Read `apps/web/app/(portfolio)/contact/page.tsx` at the start of Plan 33-01 to extract the correct values. Do not invent values.

2. **CodeSignal link disposition**
   - What we know: Current footer has a CodeSignal link (ExternalLink icon). FOOTER-02 specifies only `> github`, `> linkedin`, `> email`.
   - What's unclear: Should CodeSignal be removed entirely, or kept as a fourth link?
   - Recommendation: Remove CodeSignal from the "Connect" column. FOOTER-02 only specifies three links. If there is a need to keep it, it belongs in Quick Links — but the spec doesn't require it.

3. **`> EOF` tagline placement and styling**
   - What we know: FOOTER-03 says "narrative close before copyright line". No exact visual spec for font size, color, alignment.
   - What's unclear: Should `> EOF` be centered, left-aligned, or full-width? Same color as other terminal prompts (`--matrix-terminal`) or dimmer (`--matrix-green-border`)?
   - Recommendation: Center-align, `font-mono text-xs`, use `--matrix-green-border` (dimmer, subdued) to signal "end of transmission" — visually quieter than the social links which are full `--matrix-terminal`. This follows the visual hierarchy: social links are interactive (bright), `> EOF` is narrative (dim).

4. **Glitch animation color shift (optional enhancement)**
   - What we know: The `transform`-only glitch moves/skews text. Classic glitch effects also add color fringing (red/blue channel shift) using `text-shadow`.
   - What's unclear: Is color fringing desired or too distracting?
   - Recommendation: Add subtle `text-shadow: 2px 0 var(--matrix-green-dim), -2px 0 #0a0a0a` in the mid-animation keyframes for a more "digital" feel without color bleed into red/blue (keeps Matrix green theme). This is optional — the `transform`-only glitch is sufficient for FOOTER-05.

---

## Sources

### Primary (HIGH confidence)

- `apps/web/components/portfolio/footer.tsx` — Confirmed current structure, existing classNames, social link URLs
- `apps/web/app/globals.css` — Confirmed all Phase 32 tokens in `.matrix-theme {}`, existing `@keyframes`, `prefers-reduced-motion` global rule at lines 232-239
- `apps/web/app/(portfolio)/layout.tsx` — Confirmed `.matrix-theme` class on wrapper div; footer is inside scope
- `apps/web/components/portfolio/hero-section.tsx` — Confirmed `next/dynamic` + `ssr: false` pattern for `MatrixRainCanvas`
- `apps/web/components/portfolio/dot-grid-spotlight.tsx` — Confirmed `useReducedMotion()` + `useEffect` + `aria-hidden` pattern
- `apps/web/components/portfolio/magnetic-button.tsx` — Confirmed `useReducedMotion()` null-as-falsy SSR safety pattern
- `apps/web/components/portfolio/animate-in.tsx` — Confirmed `viewport: { once: true }` single-fire animation pattern
- `apps/web/e2e/portfolio/visual-regression.spec.ts` — Confirmed `reducedMotion: 'reduce'` in all 12 portfolio tests + `maxDiffPixelRatio: 0.02`
- `apps/web/e2e/portfolio/accessibility.spec.ts` — Confirmed `@axe-core/playwright` AxeBuilder + `wcag2a`, `wcag2aa`, `wcag21aa` tags
- `apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/` — Confirmed 12 portfolio PNG baselines
- `apps/web/e2e/dashboard/visual-regression.spec.ts-snapshots/` — Confirmed 6 dashboard PNG baselines (18 total)
- [MDN IntersectionObserver.disconnect()](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/disconnect) — disconnect() signature + single-fire usage pattern
- `.planning/STATE.md` — `clip-path` Safari concern flagged, confirmed all architectural decisions (`.matrix-theme` scoping, `motion/react` convention)

### Secondary (MEDIUM confidence)

- [CSS-Tricks: Glitch Effect on Text/Images/SVG](https://css-tricks.com/glitch-effect-text-images-svg/) — `clip-path: inset()` keyframe pattern (adapted to `transform` for this project)
- [aleclownes.com CRT Display](https://aleclownes.com/2017/02/01/crt-display.html) — `::before` + `repeating-linear-gradient` CRT scanline CSS technique
- [WebSearch: Safari clip-path animation issues](https://gsap.com/community/forums/topic/30617-issues-with-svg-clip-path-animations-in-safari/) — confirmed "improper redrawing" bug in Safari for `clip-path` animations → validates `transform`-only approach

### Tertiary (LOW confidence)

- WebSearch: multiple sources confirm `clip-path: inset()` has known Safari rendering issues in animated keyframes — not a single authoritative MDN page, but consistent across multiple community reports. Treat as LOW until validated in real Safari. `transform` approach mitigates entirely.

---

## Metadata

**Confidence breakdown:**
- Footer structure audit: HIGH — read directly from `footer.tsx`
- CSS token availability: HIGH — read directly from `globals.css`; Phase 32 tokens confirmed
- CRT scanline pattern: HIGH — MDN `repeating-linear-gradient` + multiple authoritative implementations
- IntersectionObserver single-fire: HIGH — MDN `disconnect()` official docs
- Glitch animation (transform approach): HIGH — standard CSS; `transform` is universally supported
- Glitch animation (clip-path approach): MEDIUM — known Safari animation rendering bugs; `transform` used instead
- LinkedIn/email URLs: UNRESOLVED — not in `footer.tsx`, must read `contact/page.tsx`
- Playwright reduced-motion suppression: HIGH — confirmed from `visual-regression.spec.ts` + `globals.css` rule

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable codebase, no fast-moving CSS specs; clip-path Safari situation may improve but irrelevant since transform approach chosen)
