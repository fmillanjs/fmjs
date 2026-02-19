---
phase: 25-personality-effects
plan: "03"
subsystem: portfolio-effects
tags: [fx, cursor, dot-grid, spotlight, css-custom-properties, animation]
dependency_graph:
  requires: []
  provides: [FX-04]
  affects: [apps/web/app/(portfolio)/layout.tsx, apps/web/app/globals.css]
tech_stack:
  added: []
  patterns: [css-custom-properties-cursor-tracking, any-hover-media-query, passive-event-listener, zero-rerender-mousemove]
key_files:
  created:
    - apps/web/components/portfolio/dot-grid-spotlight.tsx
  modified:
    - apps/web/app/globals.css
    - apps/web/app/(portfolio)/layout.tsx
decisions:
  - "opacity: 0.08 for dot-grid overlay (plan specified 0.08, research suggested 0.12 — plan value used for maximum subtlety)"
  - "layout.tsx remains Server Component — DotGridSpotlight is 'use client' at the RSC boundary, valid pattern"
  - "Initial --cursor-x: -9999px positions spotlight off-screen before first mousemove event"
metrics:
  duration: "102 seconds"
  completed: "2026-02-19"
  tasks: 2
  files: 3
---

# Phase 25 Plan 03: FX-04 Dot Grid Spotlight Summary

FX-04 dot-grid background with green spotlight cursor tracking — CSS custom properties via setProperty, zero React re-renders per mousemove, scoped to any-hover capable devices only.

## What Was Built

### DotGridSpotlight Component (`apps/web/components/portfolio/dot-grid-spotlight.tsx`)

A `'use client'` component that renders a fixed full-viewport overlay combining two effects:

1. **Dot grid:** Two offset CSS `radial-gradient` patterns at 28px x 28px, offset by 14px to create a denser interlocked dot array using `--matrix-green-dim` (#00CC33)
2. **Green spotlight:** A radial gradient spotlight at the cursor position using `--matrix-green-ghost` (#00FF4120) at the CSS custom property coordinates `--cursor-x` / `--cursor-y`

The component:
- Returns `null` immediately under `prefers-reduced-motion` (useReducedMotion guard from motion/react)
- Performs a runtime `window.matchMedia('(any-hover: hover)')` check belt-and-suspenders with the CSS media query
- Attaches a single `document.addEventListener('mousemove', ..., { passive: true })` listener
- Sets `--cursor-x` and `--cursor-y` via `el.style.setProperty` — no React state, no re-renders

### How Zero-Re-render Cursor Tracking Works

The key insight: CSS custom properties are updated directly on the DOM element via `element.style.setProperty('--cursor-x', ...)`. This bypasses React's render cycle entirely. The CSS `background-image: radial-gradient(circle 250px at var(--cursor-x) var(--cursor-y), ...)` repaints via the browser's compositor — no React diffing, no virtual DOM reconciliation, no `setState` calls. The spotlight tracks at the same 60 fps as native mouse events.

### CSS in globals.css

The `.dot-grid-spotlight` class is scoped inside `@media (any-hover: hover)`. On devices where the rule does not apply (touch-only, `any-hover: none`), the element gets no styles at all — it collapses to zero-size and is invisible.

Key CSS properties:
- `position: fixed; inset: 0` — covers the full viewport, independent of scroll position
- `z-index: 0` — behind all content layers (portfolio content uses `z-10` and above)
- `pointer-events: none` — mandatory; clicks, taps, and hover events pass through to content below
- `opacity: 0.08` — intentionally subtle; atmospheric depth, not a distracting light show

### Why `any-hover: hover` (not `pointer: fine`)

`pointer: fine` checks the primary input device only. On a hybrid laptop with both touchscreen and mouse, `pointer` may report the touchscreen (coarse) even though the mouse (fine) is also available. `any-hover: hover` is true if ANY input device supports hover — correctly enabling the spotlight on hybrid devices while still hiding it on pure touch devices (phones, tablets without mouse).

### Layout Integration (`apps/web/app/(portfolio)/layout.tsx`)

`DotGridSpotlight` is rendered as the first child of `.matrix-theme`, before `PortfolioNav`. The `position: fixed` CSS means DOM order does not control visual layering — `z-index: 0` handles that. The layout remains a Server Component (`export const metadata` requires no `'use client'`). Server Component rendering a Client Component is a valid RSC boundary.

## Deviations from Plan

None — plan executed exactly as written.

The opacity value `0.08` from the plan was used (research doc mentioned `0.12` as an alternative). The plan's value was chosen for maximum subtlety.

## Self-Check: PASSED

Files verified to exist and commits verified below.
