# Phase 22: Token Foundation - Research

**Researched:** 2026-02-18
**Domain:** CSS Custom Properties, npm Workspace Installation, Pure CSS Animations
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| THEME-01 | Portfolio site renders in dark-first mode by default via `.matrix-theme` CSS class scoped to `(portfolio)` route group — TeamFlow/DevCollab dashboard routes visually unchanged | Architecture pattern: add `.matrix-theme` wrapper div only in `(portfolio)/layout.tsx`; dashboard layout never touches it |
| THEME-02 | Matrix green token system (`--matrix-green: #00FF41`, `--matrix-green-dim`, `--matrix-green-ghost`) added as additive CSS tokens without modifying existing Radix Colors cascade | Tailwind v4: add to `:root` block inside `globals.css`, below the existing Radix tokens; plain `:root` CSS vars coexist peacefully with `@theme` |
| THEME-03 | Animation packages (`motion` v12, `gsap`, `@gsap/react`, `lenis`) installed workspace-scoped to `apps/web` — not global, no TeamFlow/DevCollab bundle contamination | npm workspaces `-w apps/web` flag installs only into `apps/web/package.json`; verified exact versions available |
| THEME-04 | All animations and canvas RAF loop stop completely when OS Reduce Motion is active (`prefers-reduced-motion: reduce`) | Global CSS rule in `globals.css` using `@media (prefers-reduced-motion: reduce)` kills all transitions/animations; pure CSS animations on `::after` are also killed by this rule |
| FX-02 | Blinking terminal cursor (`_`) appears after the hero tagline via pure CSS `::after` animation | CSS `::after` pattern with `content: "_"`, `@keyframes blink` using `opacity` toggle, `steps(2)` timing function — no JS needed |
| UX-01 | Project cards display a Matrix green border glow on hover via CSS `box-shadow` | CSS `hover:` state on card container using `box-shadow` with `--matrix-green` variable; zero JS |
</phase_requirements>

---

## Summary

Phase 22 is a pure foundation phase: three distinct work streams that do not interact with each other at the code level. First, CSS token extension — adding Matrix green custom properties to `:root` in `globals.css` alongside the existing Radix Colors cascade, and adding a `.matrix-theme` wrapper class to the portfolio layout that defers visual activation to future phases. Second, workspace-scoped npm package installation — four animation libraries installed only into `apps/web`, with the critical constraint that no other workspace (`apps/api`, `apps/devcollab-web`, etc.) acquires these dependencies. Third, two pure-CSS effects that require zero JavaScript: a blinking `_` terminal cursor on the hero tagline via `::after` + `@keyframes`, and a Matrix green `box-shadow` glow on project card hover.

The visual regression snapshot constraint is the most important coordination concern. The existing Playwright snapshots capture the current visual state. The strategy to avoid breaking them: define `--matrix-green` tokens in `:root` (which is invisible to Playwright since no element references them yet), and apply `.matrix-theme` to the portfolio layout's wrapper div but do NOT add any CSS rules that activate when `.matrix-theme` is present during Phase 22. The `.matrix-theme` class sits dormant — it's a hook for future phases to hang CSS off of, not a visual trigger itself. The blinking cursor and card glow will change snapshots, so those snapshots must be regenerated after implementing FX-02 and UX-01.

The reduced motion global rule must go into `globals.css` at the project root level, not inside a portfolio-scoped CSS file. This ensures the accessibility gate applies everywhere, and it handles the pure-CSS animations (blinking cursor, slide-in-up) immediately without waiting for Phase 23's canvas RAF check or Phase 24's MotionConfig.

**Primary recommendation:** Do all three work streams in order — tokens first (non-visual), packages second (non-visual), pure CSS effects third (regenerate snapshots for FX-02 and UX-01 only). Each step is independently verifiable.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | 12.34.2 | React animation library (formerly framer-motion) | Official successor to framer-motion; import path is `motion/react`, not `framer-motion` |
| gsap | 3.14.2 | Professional-grade JavaScript animation engine | Industry standard for complex timeline/scroll animations; framework-agnostic |
| @gsap/react | 2.1.2 | GSAP React hooks (`useGSAP`) | Provides `useGSAP()` hook that replaces `useEffect/useLayoutEffect` for GSAP, handles cleanup automatically |
| lenis | 1.3.17 | Smooth scroll library | Replaces `@studio-freight/lenis` (deprecated); lightweight, RAF-based smooth scroll |

### Supporting (not installed in Phase 22, already present in web app)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | ^4.1.18 | CSS utility framework | Already installed; v4 CSS-first config already in place |
| @radix-ui/colors | ^3.0.0 | Radix color scales | Already installed; don't modify the import chain |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| motion (npm package) | framer-motion | User decision: use `motion`, import from `motion/react` — framer-motion is the old package name |
| lenis (package) | @studio-freight/lenis | @studio-freight/lenis is deprecated; `lenis` is the current canonical package |
| npm -w flag | yarn workspace or pnpm | This is an npm workspaces monorepo; use `-w` flag |

**Installation (run from monorepo root, targets only apps/web):**
```bash
npm install motion gsap @gsap/react lenis --workspace apps/web
```

---

## Architecture Patterns

### Recommended File Structure for Phase 22
```
apps/web/
├── app/
│   ├── globals.css                    # ADD: :root Matrix tokens + reduced-motion rule
│   ├── (portfolio)/
│   │   ├── layout.tsx                 # ADD: matrix-theme wrapper div + dark class
│   │   └── page.tsx                   # TOUCH: hero tagline element gets cursor class
│   └── layout.tsx                     # NO CHANGE (root layout)
└── components/
    └── portfolio/
        ├── hero-section.tsx           # MODIFY: add blinking cursor CSS class to tagline
        └── project-card.tsx           # MODIFY: add hover glow CSS class
```

### Pattern 1: Additive CSS Token Extension (Tailwind v4)

**What:** Add Matrix green CSS custom properties to `:root` in `globals.css` alongside existing Radix Colors. Do NOT use `@theme` for these — they are not design tokens that generate utility classes; they are raw values consumed by portfolio-scoped CSS.

**When to use:** Any time you need a CSS variable available throughout the document without creating Tailwind utilities.

**Example:**
```css
/* In apps/web/app/globals.css — below the existing :root block */
/* Matrix green tokens — portfolio-only, additive, does not replace Radix cascade */
:root {
  --matrix-green: #00FF41;
  --matrix-green-dim: #00CC33;      /* ~80% luminance — subtler accent */
  --matrix-green-ghost: #00FF4120;  /* 8-hex alpha = ~12% opacity */
}
```

Why `:root` not `@theme`: Tailwind v4 docs explicitly state: "Use `@theme` when you want a design token to map directly to a utility class, and use `:root` for defining regular CSS variables that shouldn't have corresponding utility classes." Matrix tokens exist only for portfolio CSS to reference; they do not need `bg-matrix-green` utility classes.

**Important:** A second `:root {}` block in the same file is valid CSS and does not override the first. CSS merges multiple `:root` declarations additively.

### Pattern 2: Scoped Theme Class (.matrix-theme)

**What:** Apply a class to the portfolio layout's wrapper `div` to provide a CSS selector scope for all portfolio-specific styling. During Phase 22, this class has NO CSS rules attached — it is purely a future hook.

**When to use:** When you need to scope visual changes to one route group without touching the root `<html>` or `<body>` elements.

**Example:**
```tsx
// apps/web/app/(portfolio)/layout.tsx
export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="matrix-theme min-h-screen flex flex-col">
      <PortfolioNav />
      <main className="flex-1">{children}</main>
      <PortfolioFooter />
      <CommandPalette />
    </div>
  );
}
```

In globals.css, `.matrix-theme` CSS rules will be added by Phase 23 and 24. In Phase 22, adding the class itself is invisible — no visual diff.

### Pattern 3: Pure CSS Terminal Cursor (FX-02)

**What:** A blinking `_` character appears after text using CSS `::after` pseudo-element with a `@keyframes` animation toggling `opacity`. Zero JavaScript.

**When to use:** Any text element that needs a terminal-style blinking cursor.

**Example:**
```css
/* In globals.css */
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

.cursor-blink::after {
  content: "_";
  display: inline-block;
  margin-left: 1px;
  animation: cursor-blink 1s steps(2, start) infinite;
  color: var(--matrix-green);
}
```

Applied in JSX:
```tsx
/* In hero-section.tsx */
<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 cursor-blink">
  Specializing in Next.js, NestJS, TypeScript...
</p>
```

The `steps(2, start)` timing function creates a binary on/off blink (true terminal behavior) rather than a smooth fade. `color: var(--matrix-green)` makes the cursor green even if surrounding text is a different color.

### Pattern 4: CSS Hover Glow (UX-01)

**What:** Project cards emit a Matrix green `box-shadow` glow when hovered.

**When to use:** Any card that needs a highlight glow on hover using the Matrix green token.

**Example:**
```css
/* In globals.css or a portfolio-scoped CSS block */
.card-glow-hover:hover {
  box-shadow:
    0 0 0 1px var(--matrix-green),
    0 0 20px 0 var(--matrix-green-ghost),
    0 4px 24px 0 rgba(0, 255, 65, 0.15);
  transition: box-shadow 0.2s ease;
}
```

Applied in JSX:
```tsx
/* In project-card.tsx or the cards in page.tsx */
<Link href={href} className="block card-glow-hover group">
  ...
</Link>
```

Note: The current homepage cards use `<Link>` elements directly with inline Tailwind hover classes (`hover:shadow-xl`). Those must be updated to use the glow class.

**Performance note:** Animating `box-shadow` directly triggers repaints on every frame. Since this is hover-triggered (not continuous), it is acceptable. For continuous animation, a pseudo-element opacity approach would be better. For a hover state, `transition: box-shadow 0.2s ease` is standard practice.

### Pattern 5: Global Reduced Motion Rule (THEME-04 — Phase 22 portion)

**What:** A single `@media (prefers-reduced-motion: reduce)` block in `globals.css` that kills all CSS animations and transitions across the entire document. This handles the pure-CSS effects in Phase 22 without any JavaScript.

**When to use:** Once, globally, in the base stylesheet.

**Example:**
```css
/* In globals.css — after all animation @keyframes definitions */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This rule simultaneously disables:
- The `cursor-blink` animation on `::after`
- The existing `slide-in-up` animation already in globals.css
- The `box-shadow` hover transition on cards

Phase 23 will add a JavaScript RAF check (`window.matchMedia('(prefers-reduced-motion: reduce)').matches`) inside the canvas component.
Phase 24 will add `<MotionConfig reducedMotion="user">` for the `motion` library.

### Pattern 6: Workspace-Scoped npm Install

**What:** Install packages only into `apps/web/package.json`, not the monorepo root.

**When to use:** Any library that should not appear in TeamFlow API, DevCollab API, or DevCollab Web bundles.

**Command (run from monorepo root `/home/doctor/fernandomillan`):**
```bash
npm install motion gsap @gsap/react lenis --workspace apps/web
```

Verification after install:
```bash
# Confirm packages appear ONLY in apps/web/package.json, not root package.json
grep -E '"(motion|gsap|@gsap/react|lenis)"' apps/web/package.json
# Should return all 4
grep -E '"(motion|gsap|@gsap/react|lenis)"' package.json
# Should return nothing
```

### Anti-Patterns to Avoid

- **Adding `--matrix-green` to `@theme`:** Creates unwanted utility classes (`bg-matrix-green`, `text-matrix-green`). Use `:root` instead for tokens that won't be used as Tailwind utilities.
- **Applying `.matrix-theme` styles in Phase 22:** The class exists on the wrapper but Phase 22 does NOT add any CSS rules to `.matrix-theme`. Adding visual rules now breaks the snapshot strategy.
- **Installing packages at root:** `npm install motion` without `-w apps/web` pollutes the root `package.json` and makes the library available in all workspaces.
- **Using `framer-motion` import path:** Import from `motion/react`, never from `framer-motion`. The `framer-motion` package is the old name.
- **Using `@studio-freight/lenis`:** Deprecated. The current canonical package is `lenis`.
- **Adding MotionConfig in Phase 22:** Motion/React's `MotionConfig` is for Phase 24. Phase 22 handles reduced motion via CSS only.
- **Animating `height`, `width`, `margin`, `padding`:** Only animate `transform` and `opacity`. Per user decision.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth scroll | Custom RAF scroll loop | `lenis` | Cross-browser edge cases, momentum, iOS inertia, keyboard nav, anchor links — all handled |
| React animation lifecycle | `useEffect` + GSAP manually | `useGSAP()` from `@gsap/react` | Proper cleanup on unmount, React 18 strict mode double-invoke safety |
| Animation library | Custom CSS animation system | `motion` from `motion/react` | Hardware-accelerated, spring physics, layout animations, accessible by default |
| Reduced motion check | `window.matchMedia` + state | `@media (prefers-reduced-motion: reduce)` in CSS (Phase 22), `MotionConfig reducedMotion="user"` (Phase 24) | CSS rule handles pure-CSS animations immediately; MotionConfig handles JS animations |

**Key insight:** For Phase 22 specifically, almost everything is plain CSS. The libraries are just installed, not used. Don't reach for a library when CSS solves the problem (`::after` cursor, `box-shadow` glow).

---

## Common Pitfalls

### Pitfall 1: Breaking Visual Regression Snapshots
**What goes wrong:** Adding Matrix CSS tokens causes Playwright visual diffs because some element accidentally picks up the new color.
**Why it happens:** If `--matrix-green` is accidentally used in any active CSS rule, the visual changes immediately.
**How to avoid:** In Phase 22, `--matrix-green` appears only in `:root` definitions and is referenced ONLY by the new `.cursor-blink::after` color and `.card-glow-hover:hover` box-shadow. Both of these are new states (hover, pseudo-element). The cursor and card glow WILL change snapshots — update them after implementing FX-02 and UX-01 by running `npx playwright test --update-snapshots --grep "portfolio"`.
**Warning signs:** Playwright diff report shows color changes on elements you did not intend to modify.

### Pitfall 2: Workspace Contamination
**What goes wrong:** Running `npm install motion` from the monorepo root adds the package to root `package.json`, making it available to all workspaces.
**Why it happens:** npm install without `-w` flag defaults to the current directory's package.json.
**How to avoid:** Always run from monorepo root with `--workspace apps/web` flag. Verify with grep after install.
**Warning signs:** `motion` appears in root `package.json` dependencies, or in `apps/api/node_modules`.

### Pitfall 3: Tailwind v4 @theme vs :root Confusion
**What goes wrong:** Adding `--matrix-green` inside `@theme inline` instead of `:root` generates broken utility class references that fail silently.
**Why it happens:** Developers familiar with Tailwind v3 config expect to add colors to `@theme`. In v4, `@theme` is for tokens that map to utility classes; `:root` is for standalone CSS variables.
**How to avoid:** Matrix tokens go in `:root {}`. They're consumed directly as `var(--matrix-green)` in CSS, not as Tailwind classes.
**Warning signs:** Build warnings about undefined CSS variables, or unexpected utility class generation.

### Pitfall 4: Blinking Cursor Visible During Reduced Motion
**What goes wrong:** `cursor-blink` animation still runs when OS reduced motion is on.
**Why it happens:** The `@keyframes cursor-blink` fires unless the global `prefers-reduced-motion` rule is in place.
**How to avoid:** Add the global reduced motion rule BEFORE adding the cursor animation. Test by toggling OS accessibility settings. The `animation-duration: 0.01ms !important` rule overrides all animations including `::after`.
**Warning signs:** With OS reduced motion on, the cursor still blinks.

### Pitfall 5: .matrix-theme Dark Mode Conflict
**What goes wrong:** Adding `.matrix-theme` to the portfolio layout wrapper conflicts with the existing `next-themes` dark mode class system (`class="dark"` on `<html>`).
**Why it happens:** The root layout has `ThemeProvider` writing `dark` class to `<html>`. The portfolio wrapper div gets `.matrix-theme` but is not `<html>`. They are independent and don't conflict — unless a developer writes `.matrix-theme.dark` CSS that doesn't account for the actual DOM structure.
**How to avoid:** `.matrix-theme` is on the inner `div` in `(portfolio)/layout.tsx`. The `dark` class is on `<html>`. Future `.matrix-theme` CSS rules can reference both: `.dark .matrix-theme` or `.matrix-theme` selectors work fine with this structure.
**Warning signs:** Dark/light mode toggle stops working on portfolio pages.

### Pitfall 6: lenis CSS Import Missing
**What goes wrong:** Lenis is installed but its CSS (hidden scrollbar, smooth scroll base styles) is never imported.
**Why it happens:** Lenis requires `import "lenis/dist/lenis.css"` in a Client Component or layout. Forgetting this causes scroll behavior issues.
**How to avoid:** Lenis is only installed in Phase 22, not wired up yet. When Phase 26 (ANIM-06, deferred) actually activates Lenis, the CSS import must come from a `"use client"` component. Note: Lenis is installed but not initialized in Phase 22 — this is intentional.
**Warning signs:** Scroll jumps or double-scrollbar visible.

---

## Code Examples

Verified patterns based on official documentation and npm package inspection:

### Complete globals.css additions (Phase 22)

```css
/* === MATRIX THEME TOKENS === */
/* Additive — does not modify existing Radix Colors cascade */
/* Added to :root (not @theme) because these are not Tailwind utility tokens */
:root {
  --matrix-green: #00FF41;
  --matrix-green-dim: #00CC33;
  --matrix-green-ghost: #00FF4120;
}

/* === PURE CSS ANIMATIONS (Phase 22 effects) === */
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

.cursor-blink::after {
  content: "_";
  display: inline-block;
  margin-left: 1px;
  animation: cursor-blink 1s steps(2, start) infinite;
  color: var(--matrix-green);
}

/* Card hover glow */
.card-glow-hover {
  transition: box-shadow 0.2s ease;
}

.card-glow-hover:hover {
  box-shadow:
    0 0 0 1px var(--matrix-green),
    0 0 20px 0 var(--matrix-green-ghost),
    0 4px 24px 0 rgba(0, 255, 65, 0.15);
}

/* === REDUCED MOTION ACCESSIBILITY GATE === */
/* Covers: cursor-blink, slide-in-up, card hover transition */
/* Phase 23 adds: RAF check in canvas component */
/* Phase 24 adds: MotionConfig reducedMotion="user" */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Portfolio layout with .matrix-theme (THEME-01)

```tsx
// apps/web/app/(portfolio)/layout.tsx
import type { Metadata } from 'next';
import { PortfolioNav } from '@/components/portfolio/nav';
import { PortfolioFooter } from '@/components/portfolio/footer';
import { CommandPalette } from '@/components/ui/command-palette';

export const metadata: Metadata = {
  title: {
    default: 'Fernando Millan - Full-Stack Engineer',
    template: '%s | Fernando Millan',
  },
  description: 'Senior full-stack engineer building production-ready SaaS applications',
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // .matrix-theme class: scoped hook for future portfolio styling phases
    // No visual CSS rules attach to .matrix-theme in Phase 22 — no visual diff
    <div className="matrix-theme min-h-screen flex flex-col">
      <PortfolioNav />
      <main className="flex-1">{children}</main>
      <PortfolioFooter />
      <CommandPalette />
    </div>
  );
}
```

### Hero section with blinking cursor (FX-02)

```tsx
// apps/web/components/portfolio/hero-section.tsx
export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-background to-muted/30 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
          <span className="block mb-2">Fernando Millan</span>
          <span className="block text-primary">
            Full-Stack Engineer Building Production-Ready SaaS
          </span>
        </h1>

        {/* cursor-blink class appends "_" as ::after pseudo-element — pure CSS, no JS */}
        <p className="cursor-blink text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
          Specializing in Next.js, NestJS, TypeScript, and real-time collaboration systems.
          I build scalable, production-ready applications with clean architecture and type safety.
        </p>
        ...
      </div>
    </section>
  );
}
```

### Project card hover glow (UX-01)

The homepage `page.tsx` currently uses `<Link>` elements with `hover:shadow-xl` directly. Apply `.card-glow-hover` to those Link elements:

```tsx
// In apps/web/app/(portfolio)/page.tsx — project card links
<Link
  href="/projects/teamflow"
  className="block card-glow-hover border-2 border-primary rounded-lg p-8 bg-gradient-to-br from-primary/5 to-transparent"
>
  ...
</Link>
```

The `ProjectCard` component in `components/portfolio/project-card.tsx` also needs the glow class added to the Link wrapper for use on the `/projects` page.

### npm workspace install (THEME-03)

```bash
# Run from monorepo root /home/doctor/fernandomillan
npm install motion gsap @gsap/react lenis --workspace apps/web

# Verify: should show 4 packages in apps/web only
grep -E '"(motion|gsap|@gsap/react|lenis)"' apps/web/package.json

# Verify: should show nothing
grep -E '"(motion|gsap|@gsap/react|lenis)"' package.json
```

### Playwright snapshot regeneration (after FX-02 and UX-01)

After the cursor and glow are added, regenerate ONLY the portfolio snapshots:

```bash
# From apps/web directory
npx playwright test e2e/portfolio/visual-regression.spec.ts --update-snapshots
```

This regenerates the 12 snapshot files (`*-light.png` and `*-dark.png` for 6 routes) without touching dashboard snapshots.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package, import `motion/react` | 2024 rebranding | Old package still works but is the deprecated path; new import is `motion/react` |
| `@studio-freight/lenis` | `lenis` (bare package name) | 2024 | @studio-freight packages deprecated; use `lenis` |
| `@studio-freight/react-lenis` | Use `lenis` directly with `"use client"` wrapper | 2024 | No dedicated React package needed; vanilla Lenis works in Client Components |
| Tailwind config.js colors | `:root` CSS vars + `@theme` in CSS file | Tailwind v4 (2025) | CSS-first config; no JS config file for colors |
| `gsap.registerPlugin` in each file | Once at module level before use | Always | Still valid; no change, just important to do it |

**Deprecated/outdated:**
- `framer-motion` import: replaced by `motion/react` (same API, new package)
- `@studio-freight/lenis`: replaced by `lenis`
- `tailwind.config.js` theme.extend.colors: replaced by `@theme` or `:root` in CSS

---

## Open Questions

1. **Exact `--matrix-green-dim` and `--matrix-green-ghost` values**
   - What we know: `--matrix-green: #00FF41` is locked. dim and ghost are unspecified.
   - What's unclear: The exact luminance/alpha values for dim and ghost are not in the requirements.
   - Recommendation: Use `--matrix-green-dim: #00CC33` (80% luminance, still clearly green) and `--matrix-green-ghost: #00FF4120` (8-digit hex, ~12.5% alpha). These are reasonable defaults; adjust in later phases when the visual design is evaluated in context.

2. **Which project card elements get the glow**
   - What we know: The requirement says "project cards" — UX-01 is scoped to project cards.
   - What's unclear: Does this apply to (a) the homepage project cards (inline in page.tsx), (b) the ProjectCard component used on /projects, or (c) both?
   - Recommendation: Both. Apply `.card-glow-hover` to the Link wrapper in page.tsx and add the class to the Link in the `ProjectCard` component. The effect should be consistent everywhere a project card appears.

3. **Playwright snapshot strategy for cursor and glow**
   - What we know: The visual regression tests use `maxDiffPixelRatio: 0.02`. The cursor (`::after` content) and hover glow will change the screenshot.
   - What's unclear: The hover glow only shows on hover — Playwright's `waitForLoadState('networkidle')` won't trigger hover states by default. So the hover glow may NOT appear in screenshots at all.
   - Recommendation: The cursor blinking will show (screenshot captures a frame of the animation — could be visible or invisible depending on timing). Run snapshots with `animations: 'disabled'` option to get deterministic results, or accept the existing tolerance. The success criteria says "All existing Playwright visual regression snapshots pass unchanged" — this means the cursor IS a visible DOM change and snapshots must be updated after FX-02 is implemented.

---

## Sources

### Primary (HIGH confidence)
- npm registry live query — `npm show motion version` → 12.34.2 (verified 2026-02-18)
- npm registry live query — `npm show gsap version` → 3.14.2 (verified 2026-02-18)
- npm registry live query — `npm show @gsap/react version` → 2.1.2 (verified 2026-02-18)
- npm registry live query — `npm show lenis version` → 1.3.17 (verified 2026-02-18)
- https://tailwindcss.com/docs/theme — `:root` vs `@theme` distinction, `@theme inline` behavior
- https://gsap.com/docs/v3/Installation/ — GSAP v3.14.1 confirmation, plugin registration, useGSAP hook

### Secondary (MEDIUM confidence)
- https://motion.dev/docs/react — motion v12 React integration, `motion/react` import path
- https://motion.dev/docs/react-motion-config — MotionConfig reducedMotion API (confirmed via WebSearch cross-reference)
- https://bridger.to/lenis-nextjs — Lenis Next.js App Router implementation pattern with `"use client"` wrapper
- https://docs.npmjs.com/cli/v8/using-npm/workspaces/ — `--workspace` flag for scoped install
- https://playwright.dev/docs/test-snapshots — toHaveScreenshot and --update-snapshots
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion — MDN prefers-reduced-motion

### Tertiary (LOW confidence — needs validation)
- `--matrix-green-dim` and `--matrix-green-ghost` exact values: derived by reasoning, not specified in requirements
- GSAP plugin registration requirement for ScrollTrigger in future phases: from GSAP official docs but Phase 22 does not register any plugins

---

## Metadata

**Confidence breakdown:**
- Standard stack (versions): HIGH — verified via live npm registry
- Architecture patterns: HIGH — derived from existing codebase structure + official framework docs
- Pure CSS effects: HIGH — standard CSS techniques with MDN-verified behavior
- Pitfalls: HIGH — derived from codebase audit (existing snapshot tests, workspace structure)
- Token values for dim/ghost: LOW — not specified in requirements, using reasonable defaults

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (30 days; npm packages are stable at these versions)
