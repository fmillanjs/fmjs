---
phase: 25-personality-effects
plan: "01"
subsystem: hero-animation
tags: [fx, scramble, accessibility, raf, hooks]
dependency_graph:
  requires: []
  provides: [FX-01]
  affects: [apps/web/components/portfolio/hero-section.tsx]
tech_stack:
  added: []
  patterns:
    - RAF-based text scramble (no dependency)
    - useReducedMotion from motion/react for a11y gating
    - aria-label on animated spans for screen reader correctness
key_files:
  created:
    - apps/web/hooks/use-text-scramble.ts
    - apps/web/components/portfolio/scramble-hero.tsx
  modified:
    - apps/web/components/portfolio/hero-section.tsx
decisions:
  - "Hand-rolled RAF hook over use-scramble package — avoids React 19 peer dep uncertainty noted in research flags"
  - "Non-breaking space (\\u00A0) fallback prevents layout collapse when display is empty string on first frame"
  - "aria-label={text} on scramble span ensures screen readers announce real name, not noise characters"
  - "ScrambleHero not wrapped in next/dynamic — already inside 'use client' HeroSection loaded via dynamic(ssr:false)"
  - "Spaces preserved as literal spaces throughout scramble to avoid width jitter in 'Fernando Millan'"
metrics:
  duration: "~2 minutes"
  completed: "2026-02-19"
  tasks: 2
  files: 3
---

# Phase 25 Plan 01: FX-01 Text Scramble Hero Summary

**One-liner:** Hand-rolled RAF-based text scramble hook + ScrambleHero component decodes "Fernando Millan" from ASCII noise exactly once on page load, with reduced-motion and screen reader accessibility guards.

## What Was Built

### useTextScramble hook (`apps/web/hooks/use-text-scramble.ts`)

A hand-rolled `requestAnimationFrame` hook that animates `target` text from random ASCII noise (chars 33-126) to the correct string. Key behaviors:

- Fires exactly once per mount — no loop after `totalFrames` is exhausted
- `cancelAnimationFrame` in useEffect cleanup prevents memory leaks on unmount
- Space characters preserved throughout scramble to avoid width jitter
- `enabled=false` returns target immediately (no animation, no RAF scheduled)
- Final state explicitly set to `target` guaranteeing exact text after animation ends
- No new npm dependencies — zero package.json changes

### ScrambleHero component (`apps/web/components/portfolio/scramble-hero.tsx`)

A `'use client'` component wrapping the hook for hero h1 usage:

- `useReducedMotion()` from `motion/react` reads user's OS preference
- Passes `!prefersReducedMotion` as `enabled` to the hook — motion-sensitive users see immediate text
- `aria-label={text}` on the outer span ensures screen readers always announce the real name
- `|| '\u00A0'` (non-breaking space) prevents layout collapse on first render when display is `''`

### HeroSection integration (`apps/web/components/portfolio/hero-section.tsx`)

Replaced static `<span className="block mb-2">Fernando Millan</span>` with:

```tsx
<ScrambleHero text="Fernando Millan" className="block mb-2" />
```

The subtitle span (`Full-Stack Engineer Building Production-Ready SaaS`) remains a plain span — only the name scrambles per FX-01 scope.

## Decisions Made

1. **Hand-rolled over use-scramble package:** Research phase flagged React 19 peer dependency compatibility uncertainty for `use-scramble`. The hand-rolled Pattern 2 from 25-RESEARCH.md is ~50 lines, zero risk, and matches the GSAP fallback approach without needing gsap.

2. **Non-breaking space fallback:** On the very first frame, `display` is `''` (empty string) because initial state starts empty to allow scramble to begin from nothing. Without the `|| '\u00A0'` fallback, the h1 would momentarily collapse in height causing CLS.

3. **aria-label on span, not role="text":** The span contains live scrambled content during animation. `aria-label` overrides what screen readers speak without affecting visual rendering. `role="text"` would be semantically incorrect for an h1 child.

4. **No next/dynamic wrapper on ScrambleHero:** HeroSection is already `'use client'` and already loaded via `next/dynamic({ ssr: false })` from the portfolio page. Wrapping ScrambleHero in another `dynamic()` would be redundant and create unnecessary code splitting.

## Deviations from Plan

None — plan executed exactly as written. The hand-rolled hook was the specified implementation path (not the `use-scramble` package), matching Pattern 2 from 25-RESEARCH.md exactly.

## Success Criteria Verification

- [x] `useTextScramble` hook exists at `apps/web/hooks/use-text-scramble.ts` with RAF loop and `cancelAnimationFrame` cleanup
- [x] `ScrambleHero` component exists at `apps/web/components/portfolio/scramble-hero.tsx` with `aria-label` and reduced-motion guard
- [x] `hero-section.tsx` uses `ScrambleHero` for "Fernando Millan" text
- [x] No new npm dependencies installed — hand-rolled hook only
- [x] TypeScript reports zero errors in modified/created scramble files

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `911d21c` | `feat(25-01): create useTextScramble RAF-based hook` |
| Task 2 | `a3609ab` | `feat(25-01): create ScrambleHero component and integrate into HeroSection` |

## Self-Check: PASSED
