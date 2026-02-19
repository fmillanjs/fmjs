---
phase: 25-personality-effects
verified: 2026-02-19T00:00:00Z
status: human_needed
score: 7/8 must-haves verified
human_verification:
  - test: "Navigate to http://localhost:3000 in a desktop browser. Watch the hero h1 — 'Fernando Millan' should scramble from random ASCII characters to readable text, resolve completely, and STOP (never loop). Refresh — fires again once."
    expected: "Scramble fires exactly once per page load; resolves cleanly to 'Fernando Millan'; never repeats or loops after resolution; navigating away and back triggers it again."
    why_human: "requestAnimationFrame loop resolution and one-shot behavior cannot be verified by static file inspection — requires runtime observation."
  - test: "On http://localhost:3000, hover the mouse over the TeamFlow and DevCollab project cards."
    expected: "Random matrix noise characters appear inside the card revealed by a radial gradient spotlight following the cursor. Moving cursor away removes noise immediately — no looping. Clicking card links still navigates correctly."
    why_human: "pointer-events-none correctness and hover state transitions require interactive runtime testing."
  - test: "Move the mouse around any portfolio page (/, /about, /projects, /contact)."
    expected: "A subtle green spotlight illuminates the dot-grid background beneath the cursor in real time with no visible lag."
    why_human: "CSS custom property cursor tracking performance and visual smoothness require human observation at runtime."
  - test: "In Chrome DevTools, toggle device toolbar to iPhone 15 Pro (or any touch-only device). Navigate to any portfolio page."
    expected: "Dot-grid background and spotlight are completely absent — no visual artifact, no broken layout."
    why_human: "any-hover: none media query behavior requires testing with browser device emulation."
  - test: "In Chrome DevTools Rendering tab, enable 'Emulate CSS media feature: prefers-reduced-motion: reduce'. Navigate to http://localhost:3000."
    expected: "Hero name renders as plain 'Fernando Millan' immediately with no scramble. Dot-grid spotlight is completely absent. Evervault card renders children as plain div with no noise overlay."
    why_human: "useReducedMotion gate behavior requires runtime CSS media query emulation."
---

# Phase 25: Personality Effects Verification Report

**Phase Goal:** The hero name scrambles from noise to readable text on load, project cards reveal a noise-decryption effect on hover, and a green spotlight follows the mouse cursor over a dot-grid background — the portfolio has a distinct "serious engineer with craft" personality that is memorable without being distracting
**Verified:** 2026-02-19
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | Hero name cycles through noise characters before resolving to correct text on load — fires exactly once, never loops | ? HUMAN NEEDED | Hook logic verified: RAF loop exhausts `totalFrames`, sets `display=target`, no restart mechanism. Runtime behavior needs human confirmation. |
| SC-2 | Hovering over a project card causes card title to transition from scrambled noise to legible text — moving cursor away does not loop, resolves cleanly | ? HUMAN NEEDED | `EvervaultCard` sets `isHovered=false` on mouse leave, clearing noise. `pointer-events-none` on overlay. Runtime interaction requires human. |
| SC-3 | A green spotlight circle follows the mouse cursor across portfolio pages, illuminates dot-grid background in real time | ? HUMAN NEEDED | `DotGridSpotlight` attaches passive `mousemove` listener, updates CSS custom props via `setProperty` (zero re-renders). Visual tracking quality requires human. |
| SC-4 | On touch device (pointer: coarse / any-hover: none), spotlight cursor effect completely absent | ? HUMAN NEEDED | `@media (any-hover: hover)` in CSS + runtime `window.matchMedia('(any-hover: hover)')` guard in component. Needs device emulation test. |
| SC-5 | Lighthouse CI performance score >= 0.90 on all five portfolio URLs | ✓ VERIFIED | LHR files confirm: `/`=0.99, `/projects`=0.99, `/projects/teamflow`=0.99, `/projects/devcollab`=0.99-1.00, `/contact`=0.99-1.00. Assertion-results.json shows zero performance failures (only accessibility warnings at `warn` level, not `error`). |

**Score:** 1/5 truths verified via automation; 4/5 need human confirmation (all automated wiring checks pass)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/hooks/use-text-scramble.ts` | Hand-rolled RAF-based text scramble hook (no new dependency) | ✓ VERIFIED | 55 lines. Exports `useTextScramble`. Contains `requestAnimationFrame` (line 43, 49) and `cancelAnimationFrame` (line 50). Space-preservation logic present. Final `setDisplay(target)` guarantees exact text. |
| `apps/web/components/portfolio/scramble-hero.tsx` | `use client` component wrapping the scramble hook | ✓ VERIFIED | 21 lines. Exports `ScrambleHero`. `useReducedMotion` guard on line 12. `aria-label={text}` on line 17. `\u00A0` fallback prevents CLS. |
| `apps/web/components/portfolio/hero-section.tsx` | Modified hero section importing ScrambleHero | ✓ VERIFIED | Imports `ScrambleHero` on line 6. Uses `<ScrambleHero text="Fernando Millan" className="block mb-2" />` on line 19. Subtitle span remains plain. |
| `apps/web/components/portfolio/evervault-card.tsx` | `use client` Evervault-style noise decryption wrapper | ✓ VERIFIED | 75 lines. Exports `EvervaultCard`. Imports `useMotionValue`, `useMotionTemplate`, `useReducedMotion` from `motion/react`. `pointer-events-none` on noise overlay (line 65). `aria-hidden="true"` on overlay (line 67). Reduced-motion returns plain `<div>`. |
| `apps/web/app/(portfolio)/page.tsx` | Modified home page wrapping both project cards in EvervaultCard | ✓ VERIFIED | Imports `EvervaultCard` on line 7. Wraps TeamFlow card (line 40-79) and DevCollab card (line 89-127). No `'use client'` directive — remains Server Component. |
| `apps/web/components/portfolio/dot-grid-spotlight.tsx` | `use client` DotGridSpotlight component with CSS custom property cursor tracking | ✓ VERIFIED | 46 lines. Exports `DotGridSpotlight`. Uses `document.addEventListener('mousemove', ..., { passive: true })`. Sets `--cursor-x` / `--cursor-y` via `el.style.setProperty` (lines 21-22). `useReducedMotion` guard returns `null`. `any-hover: hover` runtime check. |
| `apps/web/app/globals.css` | `.dot-grid-spotlight` CSS class scoped inside `@media (any-hover: hover)` | ✓ VERIFIED | `.dot-grid-spotlight` block at line 189, scoped inside `@media (any-hover: hover)` at line 188. `pointer-events: none` on line 193. `z-index: 0` on line 192. Three-layer background-image with `var(--cursor-x, -9999px)` / `var(--cursor-y, -9999px)`. `opacity: 0.08`. |
| `apps/web/app/(portfolio)/layout.tsx` | Modified portfolio layout with DotGridSpotlight rendered as background layer | ✓ VERIFIED | Imports `DotGridSpotlight` on line 6. Renders `<DotGridSpotlight />` as first child of `.matrix-theme` on line 23. No `'use client'` directive — remains Server Component. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `hero-section.tsx` | `scramble-hero.tsx` | `import { ScrambleHero }` | ✓ WIRED | Line 6: `import { ScrambleHero } from '@/components/portfolio/scramble-hero'`. Used on line 19. |
| `scramble-hero.tsx` | `use-text-scramble.ts` | `import { useTextScramble }` | ✓ WIRED | Line 4: `import { useTextScramble } from '@/hooks/use-text-scramble'`. Called on line 13. |
| `use-text-scramble.ts` | browser RAF | `requestAnimationFrame` loop with `cancelAnimationFrame` cleanup | ✓ WIRED | RAF called on lines 43 and 49. Cleanup `cancelAnimationFrame(frameRef.current)` on line 50. |
| `page.tsx` | `evervault-card.tsx` | `import { EvervaultCard }` | ✓ WIRED | Line 7: `import { EvervaultCard } from '@/components/portfolio/evervault-card'`. Used twice: lines 40 and 89. |
| `evervault-card.tsx` | `motion/react` | `useMotionValue`, `useMotionTemplate`, `useReducedMotion` | ✓ WIRED | Line 4: `import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react'`. All three used in component body. |
| noise overlay div | null click interception | `pointer-events-none` on overlay | ✓ WIRED | Line 65 className includes `pointer-events-none`. Handlers are on the container `<div>`, not the overlay. |
| `layout.tsx` | `dot-grid-spotlight.tsx` | `import { DotGridSpotlight }` | ✓ WIRED | Line 6: `import { DotGridSpotlight } from '@/components/portfolio/dot-grid-spotlight'`. Rendered on line 23. |
| `dot-grid-spotlight.tsx` | `globals.css` `.dot-grid-spotlight` class | CSS custom properties `--cursor-x`, `--cursor-y` | ✓ WIRED | Component applies className `"dot-grid-spotlight"` (line 37). CSS class reads `var(--cursor-x)` / `var(--cursor-y)` (line 199). Component sets them via `el.style.setProperty` (lines 21-22). |
| JavaScript `mousemove` listener | CSS `--cursor-x` / `--cursor-y` custom properties | `element.style.setProperty` | ✓ WIRED | Lines 21-22: `el.style.setProperty('--cursor-x', ...)` and `el.style.setProperty('--cursor-y', ...)` inside `onMouseMove`. |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| FX-01 | 25-01-PLAN.md, 25-04-PLAN.md | Hero name text scrambles from noise characters to readable text on page load — fires exactly once, never loops | ✓ SATISFIED | `use-text-scramble.ts` + `ScrambleHero` + `hero-section.tsx` integration. Hook has one-shot RAF loop; no replay mechanism. Marked complete in REQUIREMENTS.md. |
| FX-03 | 25-02-PLAN.md, 25-04-PLAN.md | Project cards reveal Evervault-style noise decryption effect on hover (motion/react, no new dependency) | ✓ SATISFIED | `EvervaultCard` wraps both featured project cards on home page. Uses `motion/react` (no new package). Marked complete in REQUIREMENTS.md. |
| FX-04 | 25-03-PLAN.md, 25-04-PLAN.md | Portfolio pages show dark dot-grid background with green spotlight following mouse cursor — paired unit (CSS + JS) | ✓ SATISFIED | `DotGridSpotlight` in portfolio layout, `.dot-grid-spotlight` CSS in globals.css, scoped to `any-hover: hover`. Marked complete in REQUIREMENTS.md. |

**Orphaned requirements check:** ROADMAP.md specifies `Requirements: FX-01, FX-03, FX-04` for Phase 25. REQUIREMENTS.md shows FX-01 (Phase 25), FX-02 (Phase 22 — not in scope), FX-03 (Phase 25), FX-04 (Phase 25). No orphaned requirements found for this phase.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `dot-grid-spotlight.tsx` | 31 | `return null` | Info | Intentional: reduced-motion guard returns null to render nothing. Not a stub — the full implementation is the conditional render path. |

No blockers. No stubs. No placeholder implementations found.

---

### TypeScript Status

Phase 25 files compile without errors. Four pre-existing TypeScript errors exist in unrelated test files:
- `apps/web/e2e/user-journey/complete-flow.spec.ts` — present since commit `c3e2f34` (Phase 6.1, before Phase 25)
- `apps/web/lib/api.test.ts` — present since commit `2e52e4c` (Phase 6.1, before Phase 25)

These are not regressions introduced by Phase 25.

---

### Lighthouse CI Results

| URL | Performance Score (3 runs) | Status |
|-----|---------------------------|--------|
| `http://localhost:3000/` | 0.99, 0.99, 0.99 | ✓ PASS |
| `http://localhost:3000/projects` | 0.99, 0.99, 0.99 | ✓ PASS |
| `http://localhost:3000/projects/teamflow` | 0.99, 0.99, 0.99 | ✓ PASS |
| `http://localhost:3000/projects/devcollab` | 1.00, 0.99, 1.00 | ✓ PASS |
| `http://localhost:3000/contact` | 1.00, 0.99, 0.99 | ✓ PASS |

All 5 URLs exceed the 0.90 threshold. The 5 assertion failures in `assertion-results.json` are all `level: warn` for `accessibility` (scores 0.83-0.89 against a `minScore: 1.0` threshold). The performance assertion (`level: error, minScore: 0.9`) produced zero failures — meaning performance passed on all URLs. `lhci autorun` exits 0 when there are no `error`-level failures.

---

### Human Verification Required

All three FX effects require runtime observation to confirm behavioral correctness. Automated static analysis confirms all wiring is correct and the implementation is substantive (not stubs). The following tests are required before Phase 25 can be marked complete:

#### 1. FX-01: Hero Scramble Fires Exactly Once

**Test:** Start dev server (`npx next dev -p 3000`). Open `http://localhost:3000`. Watch the hero h1.
**Expected:** "Fernando Millan" scrambles from ASCII noise characters to readable text, resolves completely, and STOPS — no loop. Refresh triggers it again once. Navigate to /about and back — triggers again (component remount).
**Why human:** requestAnimationFrame one-shot resolution cannot be verified by static analysis.

#### 2. FX-03: Evervault Card Noise on Hover

**Test:** On `http://localhost:3000`, hover mouse over the TeamFlow featured project card.
**Expected:** Random matrix characters appear inside the card under a radial gradient spotlight. Spotlight follows cursor within the card. Moving cursor away removes noise immediately, no looping. Clicking the card link navigates to /projects/teamflow correctly.
**Why human:** Hover state transitions, noise generation, and pointer-events passthrough require interactive runtime testing.

#### 3. FX-04: Spotlight Tracks Cursor in Real Time

**Test:** On any portfolio page, move the mouse around.
**Expected:** A subtle green spotlight illuminates the dot-grid background beneath the cursor in real time with no visible lag.
**Why human:** CSS custom property tracking smoothness and visual quality require human observation.

#### 4. FX-04: Touch Device — Spotlight Completely Absent

**Test:** Chrome DevTools → device toolbar → iPhone 15 Pro. Navigate to any portfolio page.
**Expected:** Zero evidence of dot-grid or spotlight — no artifact, no broken layout.
**Why human:** Requires browser device emulation with any-hover: none media query active.

#### 5. Reduced Motion — All Effects Disabled

**Test:** Chrome DevTools → Rendering tab → "Emulate CSS media: prefers-reduced-motion: reduce". Navigate to `http://localhost:3000`.
**Expected:** Hero name renders as plain "Fernando Millan" immediately (no scramble). No dot-grid spotlight. Evervault card renders as plain div (no noise overlay on hover).
**Why human:** useReducedMotion() runtime behavior with OS preference emulation.

---

### Commits Verified

| Plan | Commit | Description | Exists |
|------|--------|-------------|--------|
| 25-01 | `911d21c` | feat(25-01): create useTextScramble RAF-based hook | ✓ |
| 25-01 | `a3609ab` | feat(25-01): create ScrambleHero component and integrate into HeroSection | ✓ |
| 25-02 | `f1f703f` | feat(25-02): create EvervaultCard noise decryption component | ✓ |
| 25-02 | `a956a1c` | feat(25-02): wrap home page project cards in EvervaultCard | ✓ |
| 25-04 | `190f5db` | chore(25-04): run Lighthouse CI gate — all 5 URLs score 0.99-1.00 performance | ✓ |

---

### Summary

All 8 required artifacts are present, substantive, and correctly wired. All 9 key links are verified. All 3 requirement IDs (FX-01, FX-03, FX-04) are satisfied with implementation evidence. No stubs, no missing dependencies, no new npm packages added. Lighthouse CI performance gate passes with 0.99-1.00 scores across all 5 URLs.

The only gap is runtime behavioral verification — the interactive nature of all three effects (one-shot RAF animation, hover state management, cursor tracking) cannot be confirmed by static analysis alone. The automated checks give strong confidence that the implementations are correct; human verification is the final gate.

---

_Verified: 2026-02-19_
_Verifier: Claude (gsd-verifier)_
