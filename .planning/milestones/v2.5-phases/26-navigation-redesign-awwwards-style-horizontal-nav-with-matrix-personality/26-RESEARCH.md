# Phase 26: Navigation Redesign — Awwwards-style Horizontal Nav with Matrix Personality - Research

**Researched:** 2026-02-19
**Domain:** CSS animation, Motion v12 layoutId, Next.js 15 nav patterns, accessibility
**Confidence:** HIGH

## Summary

Phase 26 redesigns the portfolio navigation (`apps/web/components/portfolio/nav.tsx`) to be Awwwards-quality: architecturally minimal horizontal nav with Matrix green personality. The primary deliverable is **UX-04: nav link sliding green underline animation on hover** — a CSS-only `scaleX` transition using `::before`/`::after` pseudo-elements or a child `<span>`. Optionally, an additional active-page indicator can use Motion v12's `layoutId` shared element animation to slide the underline between routes as the active page changes.

The codebase already has the full stack in place: Motion v12 (`motion/react`), Tailwind CSS v4, the `--matrix-green: #00FF41` token, `useReducedMotion` from `motion/react`, and a global `@media (prefers-reduced-motion: reduce)` rule that kills all CSS transitions. No new dependencies are needed. The implementation is a targeted enhancement of one existing file plus a CSS class addition to `globals.css`.

The dominant Awwwards pattern for nav personality is: **logo left, links right, generous tracking, monospace number prefixes optional, thin green underline on hover, stationary or animated active indicator**. This portfolio's current nav already has the right layout skeleton — the work is adding the underline microinteraction and elevating the visual hierarchy.

**Primary recommendation:** Implement UX-04 using a CSS-only `scaleX` sliding underline on hover (`::before` or a real `<span>` child, scaled via Tailwind v4 group-hover variants) plus a conditionally-rendered `motion.div` with `layoutId="nav-active-underline"` for the active-page indicator. Keep the nav as `'use client'` (already is). No GSAP needed for this requirement.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UX-04 | Nav link sliding green underline animation on hover (CSS) | CSS `scaleX` transform via `::before` pseudo-element or child `<span>`; `transform-origin: left`; `transition-transform 0.25s ease-out`; Tailwind v4 `group-hover:scale-x-100` variant stacking confirmed |
| UX-02 | Magnetic buttons (GSAP quickTo) — Future, may be in scope | GSAP `quickTo` pattern known; `@gsap/react` already installed (v2.1.2); defer unless confirmed in scope by planner |
| UX-03 | Stat counters count up (motion useInView) — Future, may be in scope | `useInView` from `motion/react` available; no nav relevance; defer |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4.1.18 | Utility classes for underline span, group-hover, scale, origin, transition | Already installed; v4 supports `group-hover:before:scale-x-100` variant stacking |
| motion/react | v12.34.2 | `layoutId` shared element for active indicator; `useReducedMotion` guard | Already installed; project-wide standard import path |
| next/navigation | Next.js 15 | `usePathname()` for active detection | Already used in current nav.tsx |
| React | v19.0.0 | `useState` for mobile menu | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gsap + @gsap/react | 3.14.2 / 2.1.2 | Magnetic button effect (UX-02) | Only if planner confirms UX-02 in scope for this phase |
| lucide-react | 0.564.0 | Menu / X icons | Already used; keep as-is |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `scaleX` pseudo-element | `width: 0 → 100%` transition | `width` causes layout reflow; `scaleX` is GPU-composited, zero reflow |
| `scaleX` pseudo-element | `background-size` gradient trick | Background-size works for inline text; pseudo-element cleaner for nav with fixed height |
| Motion `layoutId` active indicator | CSS `border-bottom` on active link | `layoutId` gives FLIP animation between routes; CSS border is instant (no slide) |
| Motion `layoutId` active indicator | `getBoundingClientRect` + JS positioning | `layoutId` is idiomatic in this codebase; avoid custom measurement code |

**Installation:** No new packages needed. Everything is already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
apps/web/
├── components/portfolio/
│   └── nav.tsx          # MODIFY — primary deliverable
└── app/
    └── globals.css      # ADD — .nav-underline-slide CSS class
```

The nav is a single `'use client'` component. No layout file changes needed. No new files unless the active indicator warrants extracting a `NavLink` subcomponent (recommended for testability).

### Pattern 1: CSS-Only Hover Underline via Child Span

**What:** Each nav link contains a `<span aria-hidden="true">` absolutely positioned at the bottom that scales from 0 to 1 on hover. Using a real DOM child (not `::before`) is recommended by Tailwind's own docs when the element is non-semantic and works cleaner with Tailwind v4 utility classes.

**When to use:** UX-04 hover underline — always enabled unless `prefers-reduced-motion`.

**Example:**
```tsx
// Source: Tailwind CSS docs + Tobias Ahlin "Animating Link Underlines"
<Link
  href={link.href}
  className="group relative inline-flex flex-col py-1"
>
  {link.label}
  {/* Hover underline — scales left-to-right on group hover */}
  <span
    aria-hidden="true"
    className="
      absolute bottom-0 left-0
      h-[2px] w-full
      bg-[var(--matrix-green)]
      origin-left scale-x-0
      transition-transform duration-[250ms] ease-out
      group-hover:scale-x-100
    "
  />
</Link>
```

The CSS origin-left + scale-x-0 → scale-x-100 pattern is GPU-composited (transform only, no paint). Duration 250ms ease-out is the sweet spot found across multiple sources (Tobias Ahlin, 30 Seconds of Code, CSS-IRL).

### Pattern 2: Motion layoutId Active Page Indicator

**What:** A `motion.div` with `layoutId="nav-active-underline"` is conditionally rendered inside the active link only. When the active route changes, Motion's FLIP algorithm animates the underline div sliding to its new position.

**When to use:** Active-page persistent underline — shows which page the user is on, slides when navigating.

**Example:**
```tsx
// Source: Motion.dev layoutId docs + Matt Perry tweet verifying underline use case
// Import: { motion } from 'motion/react' — already project-standard
import { motion } from 'motion/react'

// Inside the navLinks.map():
<Link key={link.href} href={link.href} className="group relative inline-flex flex-col py-1">
  {link.label}
  {/* Hover underline (CSS) */}
  <span
    aria-hidden="true"
    className="absolute bottom-0 left-0 h-[2px] w-full bg-[var(--matrix-green)] origin-left scale-x-0 transition-transform duration-[250ms] ease-out group-hover:scale-x-100"
  />
  {/* Active page indicator (Motion layoutId) */}
  {pathname === link.href && (
    <motion.span
      aria-hidden="true"
      layoutId="nav-active-underline"
      className="absolute bottom-0 left-0 h-[2px] w-full bg-[var(--matrix-green)]"
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    />
  )}
</Link>
```

**Note:** `layoutId` is global. Since there is only one nav on the page, no `LayoutGroup` wrapper is needed. If ever rendered in multiple places, wrap in `<LayoutGroup id="portfolio-nav">`.

**Reduced motion:** `useReducedMotion()` from `motion/react` gates the layoutId motion.span — when true, render a plain `<span>` with no transition.

### Pattern 3: Awwwards Visual Hierarchy Upgrades

**What:** Typography and spacing changes that elevate the nav from "standard Shadcn" to "Awwwards-quality." These are CSS/Tailwind changes, not animation.

**Patterns observed across Awwwards portfolio navs:**
- Increased letter-spacing on nav links (`tracking-wider` or `tracking-widest`)
- Slightly reduced font weight or uppercase for link text (`uppercase tracking-widest text-xs`)
- Logo mark uses monospace or techy font hint
- Nav height generous: 64–80px (current is `h-16` = 64px — acceptable)
- Optional: small monospace number prefix before each link (e.g. `01_`, `02_`) for techy personality

**Implementation scope for UX-04:** The underline animation is the primary requirement. Visual hierarchy tweaks (spacing, tracking) are discretionary and low-risk Tailwind class changes on the existing nav.

### Anti-Patterns to Avoid

- **`width: 0 → 100%` animation:** Causes layout reflow. Always use `scaleX` with `transform-origin` instead.
- **`text-decoration` animation for the slide:** `text-decoration-color` can fade in/out but cannot slide directionally across browsers.
- **GSAP for the hover underline:** GSAP is overkill for a pure CSS transition. Reserve GSAP for UX-02 magnetic buttons if that enters scope.
- **Animating `border-bottom` width:** Reflow-inducing. Use `::after`/child span with `scaleX`.
- **Forgetting `prefers-reduced-motion`:** The global `@media (prefers-reduced-motion: reduce)` in `globals.css` already kills all CSS transitions site-wide with `!important`. This means the CSS underline animation is automatically disabled. The Motion `layoutId` element must additionally check `useReducedMotion()` since Motion has its own JS animation layer. Both are handled.
- **Using `usePathname()` outside `'use client'`:** `nav.tsx` already has `'use client'` — no change needed.
- **Purple color:** Constraint — never use purple anywhere.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Active route sliding indicator | Custom `getBoundingClientRect` + `useEffect` + resize listener | Motion `layoutId` | layoutId handles FLIP, cross-route transitions, and spring physics automatically |
| Reduced motion detection | Manual `window.matchMedia` inside component | `useReducedMotion()` from `motion/react` | Already project-standard; handles SSR safely |
| Underline sliding animation | JS-driven `left` position calculation | CSS `scaleX` transform | GPU-composited, zero JS, automatic browser handling |

**Key insight:** The entire hover underline is a CSS-only effect. The only JS involvement is `useReducedMotion()` to conditionally render the Motion active indicator.

---

## Common Pitfalls

### Pitfall 1: z-index conflict between active indicator and hover underline

**What goes wrong:** Both the CSS hover span and the Motion active indicator span sit at `bottom-0`. The Motion span (active) may render on top and block the hover span from being visible on the active link.

**Why it happens:** Both absolutely-positioned elements share the same stacking context and bottom position.

**How to avoid:** Give the hover span `z-index: 1` and the Motion active span `z-index: 2` (via Tailwind `z-[1]` / `z-[2]`), OR ensure they are visually distinguishable (e.g., active indicator at full opacity, hover underline at 70% opacity on non-active links only).

**Warning signs:** Active link hover state appears to have no animation or the active underline is invisible.

### Pitfall 2: `layoutId` global scope collision

**What goes wrong:** If `layoutId="nav-active-underline"` is used in more than one place in the DOM, Motion will try to animate between all instances, causing chaotic motion.

**Why it happens:** `layoutId` is global by default in Motion.

**How to avoid:** Since there is exactly one nav, this is not an issue in the current architecture. If a second nav (e.g., footer quick links) ever uses the same pattern, wrap with `<LayoutGroup id="portfolio-nav">`.

**Warning signs:** Underline teleports erratically when navigating.

### Pitfall 3: `backdrop-filter` stacking context breaking z-index

**What goes wrong:** The nav uses `bg-background/80 backdrop-blur-sm`. This creates a stacking context. If underlines are positioned outside the nav's own stacking context, they may appear behind other elements.

**Why it happens:** `backdrop-filter` always creates a stacking context in CSS.

**How to avoid:** Keep all underline spans inside their parent `<Link>` element, which is itself inside the nav. This keeps them correctly within the nav's stacking context.

### Pitfall 4: Mobile nav underline animation leaking into mobile dropdown

**What goes wrong:** The mobile menu uses `block` layout, not flex. If the underline span is `absolute` positioned, it may render incorrectly in the vertical mobile layout.

**Why it happens:** The current mobile menu renders links as `block px-3 py-2 rounded-lg` — no relative positioning established for the absolute span.

**How to avoid:** Gate the underline span to desktop only using `hidden md:block` on the underline child span, OR change the mobile link to `relative` and use a left-side vertical indicator instead of bottom underline for mobile. The simplest approach: show underline only on desktop links (they're in a separate render branch already).

### Pitfall 5: Transition overridden by global reduced-motion CSS

**What goes wrong:** Developer tests animation in browser where reduced-motion is active, sees no animation, assumes implementation is broken.

**Why it happens:** `globals.css` has `@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; } }` — this kills the `scaleX` CSS animation without any code change.

**Why it's actually correct:** This is the intended behavior per WCAG 2.1.

**Warning signs:** Animation "not working" in DevTools with reduced-motion emulation — this is success, not failure.

---

## Code Examples

Verified patterns from official sources and codebase:

### UX-04: Complete Hover Underline Implementation

```tsx
// Source: Tailwind docs + Tobias Ahlin pattern + project conventions
// File: apps/web/components/portfolio/nav.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PortfolioNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-foreground hover:text-[var(--matrix-green)] transition-colors">
            Fernando Millan
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'group relative inline-flex flex-col py-1 text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-[var(--matrix-green)]'
                    : 'text-muted-foreground hover:text-[var(--matrix-green)]'
                )}
              >
                {link.label}

                {/* Hover underline: CSS scaleX — disabled automatically by global reduced-motion CSS */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-[2px] w-full bg-[var(--matrix-green)] origin-left scale-x-0 transition-transform duration-[250ms] ease-out group-hover:scale-x-100"
                />

                {/* Active indicator: Motion layoutId — gated by useReducedMotion */}
                {pathname === link.href && !prefersReducedMotion && (
                  <motion.span
                    aria-hidden="true"
                    layoutId="nav-active-underline"
                    className="absolute bottom-0 left-0 h-[2px] w-full bg-[var(--matrix-green)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {pathname === link.href && prefersReducedMotion && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 h-[2px] w-full bg-[var(--matrix-green)]"
                  />
                )}
              </Link>
            ))}

            {/* Keep existing kbd shortcut and ThemeToggle */}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono border rounded bg-muted text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
            <ThemeToggle />
          </div>

          {/* Mobile button — unchanged */}
          ...
        </div>
      </div>
    </nav>
  );
}
```

### Contrast Check (Verified via calculation)

```
--matrix-green (#00FF41) on dark bg (#0a0a0a): 14.50:1  ✓ WCAG AAA
--matrix-green-dim (#00CC33) on dark bg:        9.13:1  ✓ WCAG AA
#e8e8e8 on dark bg:                            16.16:1  ✓ WCAG AAA
```

Matrix green on the dark `.matrix-theme` background far exceeds WCAG 2.1 AA (4.5:1 required). No contrast issue for hover color.

### Awwwards Typography Touches (Discretionary)

```tsx
// Option A: Uppercase + widest tracking — techy minimal
className="... uppercase tracking-widest text-xs font-semibold ..."

// Option B: Slightly spaced normal case — editorial
className="... tracking-wide text-sm font-medium ..."

// Option C: Monospace number prefix (Matrix personality)
// Add to navLinks array: { href: '/', label: 'Home', index: '01' }
// Render: <span className="font-mono text-[10px] text-[var(--matrix-green)] mr-1 opacity-60">01_</span>Home
```

Option B is the safest — minimal change, maximum legibility. Option C adds the most Matrix personality.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `border-bottom` on active link | Motion `layoutId` sliding indicator | Motion v4+ | Smooth cross-route animation |
| `width: 0 → 100%` underline | `scaleX(0) → scaleX(1)` | ~2018 | GPU-composited, no reflow |
| Custom `getBoundingClientRect` indicator | `layoutId` FLIP | Framer Motion v6+ | Zero custom measurement code |
| `framer-motion` import | `motion/react` import | Motion v11 | Already correct in this codebase |
| `MotionConfig reducedMotion="user"` covers JS animations | CSS `@media` covers CSS animations | Phase 22/24 | Both layers already handled |

**Deprecated/outdated:**
- `framer-motion` package name: replaced by `motion` (already using `motion/react` in this codebase — no issue)
- `AnimateSharedLayout`: replaced by `LayoutGroup` and automatic layout detection (deprecated in Framer Motion v6+)

---

## Open Questions

1. **Should UX-02 (magnetic buttons) be in scope for Phase 26?**
   - What we know: GSAP + `@gsap/react` are already installed. `quickTo` is the standard approach. The phase description says "may be in scope."
   - What's unclear: The planner must decide if Phase 26 includes UX-02 or defers it to a separate phase.
   - Recommendation: Defer UX-02 to Phase 27 unless explicitly in scope. Magnetic buttons require wrapping nav links in a ref container and GSAP quickTo setup — significant additional scope beyond the hover underline.

2. **Awwwards typography: how far to push it?**
   - What we know: Current nav uses `text-sm font-medium` with `text-muted-foreground`. The phase says "Awwwards-style."
   - What's unclear: Whether the planner wants purely the underline (minimal scope) or a full visual hierarchy overhaul.
   - Recommendation: Treat typography touches as a secondary task — add `tracking-wide` and update hover color to `--matrix-green` (instead of `--primary`/blue). Keep it restrained.

3. **Number prefix personality feature (01_, 02_, ...)?**
   - What we know: Common on Awwwards portfolios to signal "engineer with craft."
   - What's unclear: Whether Fernando wants this aesthetic.
   - Recommendation: Planner should flag as optional/discretionary. Easy to add, easy to remove.

4. **Mobile menu underline behavior?**
   - What we know: Mobile menu is a separate render branch (dropdown, block layout). Bottom underline doesn't make sense for a vertical list.
   - Recommendation: Active state on mobile stays as `bg-primary/10 text-primary` (existing) or update to a left-border accent: `border-l-2 border-[var(--matrix-green)]` for active mobile links. No underline slide on mobile.

---

## Sources

### Primary (HIGH confidence)
- Tailwind CSS v4 docs (`tailwindcss.com/docs/hover-focus-and-other-states`) — pseudo-element variant stacking, group-hover with before/after, scale-x utilities
- Tailwind CSS v4 docs (`tailwindcss.com/docs/scale`) — scale-x utility values, hover stacking
- Motion.dev docs (motion.dev/docs/react-layout-animations) — layoutId shared element API
- Motion.dev docs (motion.dev/docs/react-layout-group) — LayoutGroup namespacing
- Codebase: `apps/web/components/portfolio/nav.tsx` — current implementation baseline
- Codebase: `apps/web/app/globals.css` — `--matrix-green` token, reduced-motion global rule, existing CSS patterns
- Codebase: `apps/web/package.json` — confirmed motion@12.34.2, gsap@3.14.2, tailwindcss@4.1.18

### Secondary (MEDIUM confidence)
- Tobias Ahlin "Animating Link Underlines" (tobiasahlin.com) — scaleX pseudo-element technique; verified against Tailwind docs
- CSS-IRL "Animating Underlines" (css-irl.info) — multi-approach survey including text-decoration-color
- Cruip "Active Link with Tailwind and Framer Motion" (cruip.com) — usePathname + conditional class pattern
- 30 Seconds of Code "Hover underline animation" — simple implementation reference

### Tertiary (LOW confidence)
- Medium / Awwwards articles on nav design — general aesthetic direction only, not technical

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed installed, all API calls verified in docs and codebase
- Architecture (CSS scaleX hover underline): HIGH — technique is well-established, verified in multiple authoritative sources, compatible with Tailwind v4 group-hover stacking
- Architecture (Motion layoutId active indicator): HIGH — API confirmed in motion.dev docs, pattern matches existing codebase conventions (`motion/react` import, `useReducedMotion`)
- Reduced motion handling: HIGH — dual-layer (CSS global + `useReducedMotion`) already established in codebase; Phase 26 follows same pattern
- Contrast/WCAG compliance: HIGH — computed directly from hex values; matrix-green passes at 14.50:1 on dark background
- Pitfalls: MEDIUM — z-index/stacking pitfalls from reasoning; mobile layout pitfall from codebase inspection
- Awwwards design aesthetics: LOW — based on general pattern observation, not a specific codebase or doc

**Research date:** 2026-02-19
**Valid until:** 2026-03-21 (stable APIs — motion, Tailwind v4, Next.js 15 are not fast-moving right now)
