---
phase: 33-footer-redesign-matrix-animation
plan: "02"
subsystem: portfolio-footer
tags: [animation, client-island, intersection-observer, next-dynamic, accessibility]
dependency_graph:
  requires:
    - 33-01 (footer terminal shell + CSS glitch keyframes)
  provides:
    - GlitchSignature client island (FOOTER-05)
    - Single-fire IntersectionObserver pattern with StrictMode guard
  affects:
    - apps/web/components/portfolio/footer.tsx
    - apps/web/components/portfolio/glitch-signature.tsx
tech_stack:
  added: []
  patterns:
    - next/dynamic with ssr:false for browser-only client islands in Next.js 15
    - IntersectionObserver single-fire via hasGlitched state guard
    - useReducedMotion from motion/react for accessibility
key_files:
  created:
    - apps/web/components/portfolio/glitch-signature.tsx
  modified:
    - apps/web/components/portfolio/footer.tsx
decisions:
  - footer.tsx must be 'use client' because Next.js 15 forbids next/dynamic ssr:false in Server Components
  - entries[0]?.isIntersecting optional chain required for TypeScript strict mode (noUncheckedIndexedAccess)
  - hasGlitched state guard prevents double-fire in React StrictMode development double-invoke
metrics:
  duration_seconds: 177
  completed_date: "2026-02-21"
  tasks_completed: 2
  files_changed: 2
---

# Phase 33 Plan 02: GlitchSignature Client Island Summary

**One-liner:** Single-fire CSS glitch animation on footer name via IntersectionObserver client island with StrictMode guard and reduced-motion accessibility.

## What Was Built

Created `GlitchSignature` as a `'use client'` island that uses `IntersectionObserver` to add the `.footer-glitch-once` CSS class exactly once when "Fernando Millan" scrolls into view. Wired into `footer.tsx` via `next/dynamic` with `ssr: false`. Satisfies FOOTER-05.

### Key behaviors:
- Name glitches exactly once on first scroll into view (threshold 0.5)
- Subsequent scrolls: static name, no animation repeat (observer disconnected after first fire)
- Reduced-motion users: `useReducedMotion()` truthy → observer never created → no `.footer-glitch-once` ever added
- SSR safe: `IntersectionObserver` only inside `useEffect` (browser-only), loaded via `next/dynamic ssr:false`
- StrictMode safe: `hasGlitched` state prevents second observer in development double-invoke cycle

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create GlitchSignature client island | 414a2eb | glitch-signature.tsx (created) |
| 2 | Wire GlitchSignature into footer.tsx via next/dynamic | 53e3eb5 | footer.tsx (modified), glitch-signature.tsx (modified) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Next.js 15 forbids next/dynamic ssr:false in Server Components**
- **Found during:** Task 2 (build failure)
- **Issue:** `footer.tsx` was a Server Component. Next.js 15 throws build error: "`ssr: false` is not allowed with `next/dynamic` in Server Components. Please move it into a Client Component."
- **Fix:** Added `'use client'` directive to `footer.tsx`. Consistent with reference pattern in `hero-section.tsx` which also uses `'use client'` + `next/dynamic ssr:false` for MatrixRainCanvas.
- **Files modified:** `apps/web/components/portfolio/footer.tsx`
- **Commit:** 53e3eb5

**2. [Rule 1 - Bug] TypeScript strict: entries[0] possibly undefined**
- **Found during:** Task 2 (TypeScript type check during build)
- **Issue:** `entries[0].isIntersecting` — TypeScript strict mode treats array index access as `T | undefined`. Build error: "Object is possibly 'undefined'."
- **Fix:** Changed to `entries[0]?.isIntersecting` (optional chaining). Semantically identical at runtime since IntersectionObserver always fires with at least one entry when threshold reached.
- **Files modified:** `apps/web/components/portfolio/glitch-signature.tsx`
- **Commit:** 53e3eb5

## Self-Check: PASSED

- glitch-signature.tsx: FOUND
- footer.tsx: FOUND
- Commit 414a2eb: FOUND (feat: create GlitchSignature client island)
- Commit 53e3eb5: FOUND (feat: wire GlitchSignature into footer via next/dynamic)
- Build: PASSED (zero TypeScript errors)
