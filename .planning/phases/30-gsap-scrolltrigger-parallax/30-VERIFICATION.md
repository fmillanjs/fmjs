---
phase: 30-gsap-scrolltrigger-parallax
verified: 2026-02-20T23:55:00Z
status: human_needed
score: 7/7 automated must-haves verified
re_verification: false
human_verification:
  - test: "Hero text drifts upward visibly slower than page scroll speed"
    expected: "Scrolling the homepage hero causes the text block to move upward at a slower rate than the scrolled distance — a perceivable depth separation from the canvas background"
    why_human: "yPercent: -15 with scrub: 1 is correctly wired in code, but the subjective perception of depth (slower drift vs page) cannot be confirmed programmatically"
  - test: "Decorative lines exhibit independent depth movement when scrolled past"
    expected: "The horizontal line between sections subtly expands (scaleX: 0.92 → 1.04) as the user scrolls through it — creating a distinct depth layer feel from surrounding content"
    why_human: "scaleX animation is correctly wired in code (fromTo, scrub: 1, containerRef trigger) but the visual depth illusion requires human perception to validate"
  - test: "prefers-reduced-motion gate suppresses all parallax — static layout only"
    expected: "With OS prefers-reduced-motion set to ON, the hero text stays at its native position (no drift) and divider lines stay at scaleX: 1 (no animation). Both are statically rendered."
    why_human: "The guard (window.matchMedia early return) is correctly coded but its behavior under the actual OS setting requires a human to toggle and verify no motion occurs"
  - test: "Navigation re-fire — parallax restores correctly after route change"
    expected: "After navigating to /projects and returning to /, the hero parallax re-fires from scratch. No frozen end-state or stale ScrollTrigger instance."
    why_human: "useGSAP { scope: sectionRef } auto-reverts on unmount — correct pattern. Actual re-fire behavior under Next.js App Router navigation requires runtime observation"
  - test: "No JavaScript console errors on page load with parallax active"
    expected: "Browser DevTools Console is clean on load of /, /about, /projects, /contact"
    why_human: "No console.error calls visible in source code, but runtime GSAP plugin registration errors or ScrollTrigger warnings can only be confirmed in a live browser"
---

# Phase 30: GSAP ScrollTrigger Parallax Verification Report

**Phase Goal:** Users scrolling the portfolio hero and past section separators perceive distinct depth layers — hero text drifting upward slower than the page, decorative lines moving at an independent rate — without any layout shift or Lighthouse regression

**Verified:** 2026-02-20T23:55:00Z
**Status:** human_needed (all automated checks pass; 5 items require human runtime confirmation)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Hero text drifts upward slower than page scroll (PRLLX-01) | ? HUMAN NEEDED | `yPercent: -15, scrub: 1, sectionRef/textRef` wired in hero-section.tsx:24-40; logic correct, perception requires human |
| 2 | Lenis smooth scroll continues without jitter — no double-RAF loop | ✓ VERIFIED | `autoRaf: false` at lenis-provider.tsx:82; `LenisGSAPBridge` at lines 32-58 wires `gsap.ticker.add(tickerFn)` (named ref) + cleanup `gsap.ticker.remove(tickerFn)`; single RAF path confirmed |
| 3 | Navigation away and return re-fires parallax — no stale instances | ? HUMAN NEEDED | `useGSAP({ scope: sectionRef })` in hero-section.tsx:40 and `useGSAP({ scope: containerRef })` in parallax-divider.tsx:37; GSAP context auto-revert pattern is correct; runtime re-fire needs human |
| 4 | prefers-reduced-motion users see no parallax — static only | ? HUMAN NEEDED | Guard at hero-section.tsx:25 and parallax-divider.tsx:19; LenisProvider unmounts ReactLenis entirely (lenis-provider.tsx:72-75); code is correct, runtime behavior needs human |
| 5 | Section divider lines show scaleX depth effect independent of content (PRLLX-02) | ? HUMAN NEEDED | `gsap.fromTo(lineRef.current, { scaleX: 0.92 }, { scaleX: 1.04 })` with `scrub: 1` in parallax-divider.tsx:22-36; wiring verified; depth perception needs human |
| 6 | Lighthouse CI performance >= 0.90 on all 5 URLs (PRLLX-03) | ✓ VERIFIED | LHR JSON files confirm perf=1.00 (100%) on all 5 URLs: /, /projects, /projects/teamflow, /projects/devcollab, /contact |
| 7 | CLS = 0 on all 5 URLs — no layout shift from parallax | ✓ VERIFIED | LHR JSON confirms CLS=0 on all 5 URLs; `pin: true` absent from all portfolio component files; only `scaleX` and `yPercent` (transform-only) animations used |

**Score:** 3/7 truths fully verified programmatically; 4/7 require human confirmation (visual/runtime behaviors — all code is correct)

---

## Required Artifacts

### Plan 01 Artifacts (PRLLX-01)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/components/portfolio/lenis-provider.tsx` | LenisGSAPBridge wired inside ReactLenis; autoRaf: false; gsap.ticker.add + lagSmoothing(0) | ✓ VERIFIED | File exists, 94 lines, substantive. `autoRaf: false` line 82; `LenisGSAPBridge` function lines 32-58; rendered at line 90 inside ReactLenis tree; `gsap.ticker.add(tickerFn)` line 45; `gsap.ticker.lagSmoothing(0)` line 49; named `tickerFn` variable (not inline) lines 42-44; cleanup at lines 52-54 |
| `apps/web/components/portfolio/hero-section.tsx` | Hero text parallax via useGSAP + ScrollTrigger; sectionRef + textRef wired | ✓ VERIFIED | File exists, 71 lines, substantive. `useGSAP` imported line 10; `sectionRef` line 21, `textRef` line 22; hook lines 24-41; `yPercent: -15` line 29; `scrub: 1` line 35; `invalidateOnRefresh: true` line 36; `{ scope: sectionRef }` line 40; `ref={sectionRef}` with `overflow-hidden` line 43; `ref={textRef}` line 45 |

### Plan 02 Artifacts (PRLLX-02, PRLLX-03)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/components/portfolio/parallax-divider.tsx` | ParallaxDivider 'use client' with useGSAP + ScrollTrigger scaleX animation | ✓ VERIFIED | File exists, 50 lines, substantive. `'use client'` line 1; `useGSAP` imported line 6; `containerRef` + `lineRef` wired; `gsap.fromTo` lines 22-36 with `scaleX: 0.92 → 1.04`; `scrub: 1` line 32; `invalidateOnRefresh: true` line 33; `overflow-hidden` on container line 41; `origin-center` on line div line 44; prefers-reduced-motion guard line 19-20 |
| `apps/web/app/(portfolio)/page.tsx` | Homepage with ParallaxDivider between hero and featured projects, and between featured projects and stats | ✓ VERIFIED | `ParallaxDivider` imported line 8; first render line 19 (after HeroSection, before Featured Projects section); second render line 137 (after Featured Projects, before Stats section) — exactly 2 renders as specified |

---

## Key Link Verification

### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lenis-provider.tsx` | `gsap.ticker` | `LenisGSAPBridge useEffect — gsap.ticker.add(tickerFn)` | ✓ WIRED | `gsap.ticker.add(tickerFn)` at line 45; `gsap.ticker.remove(tickerFn)` at line 53; named variable (not inline) at lines 42-44 |
| `lenis-provider.tsx` | `ScrollTrigger` | `lenis.on('scroll', ScrollTrigger.update)` | ✓ WIRED | `lenis.on('scroll', ScrollTrigger.update)` at line 39; `lenis.off('scroll', ScrollTrigger.update)` cleanup at line 52 |
| `hero-section.tsx` | `ScrollTrigger` | `useGSAP callback with gsap.to + scrollTrigger config` | ✓ WIRED | `gsap.to(textRef.current, { ... scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: 1, invalidateOnRefresh: true } })` at lines 28-39 |

### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `parallax-divider.tsx` | `ScrollTrigger` | `useGSAP callback with gsap.fromTo + scrollTrigger scaleX` | ✓ WIRED | `gsap.fromTo(lineRef.current, { scaleX: 0.92 }, { scaleX: 1.04, scrollTrigger: { trigger: containerRef.current, scrub: 1 } })` at lines 22-36; `scaleX` pattern confirmed |
| `apps/web/app/(portfolio)/page.tsx` | `parallax-divider.tsx` | `import and JSX render between sections` | ✓ WIRED | `import { ParallaxDivider } from '@/components/portfolio/parallax-divider'` line 8; rendered at lines 19 and 137 — between sections as specified |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PRLLX-01 | 30-01-PLAN.md | Hero text drifts upward at slower rate than page scroll (GSAP ScrollTrigger, yPercent: -15, scrub: 1) | ✓ SATISFIED (code) / ? HUMAN (perception) | `yPercent: -15, scrub: 1` confirmed in hero-section.tsx; ScrollTrigger trigger wired to sectionRef; REQUIREMENTS.md marks [x] Complete |
| PRLLX-02 | 30-02-PLAN.md | Section separators move at independent depth (subtle scale/y transform, no layout shift) | ✓ SATISFIED (code) / ? HUMAN (perception) | `scaleX: 0.92 → 1.04` in parallax-divider.tsx; CLS=0 confirmed by Lighthouse CI; REQUIREMENTS.md marks [x] Complete |
| PRLLX-03 | 30-02-PLAN.md | Lighthouse CI performance >= 0.90 on all five portfolio URLs after parallax added | ✓ SATISFIED | All 5 URLs score 1.00 (100%) performance, CLS=0, confirmed from LHR JSON files in `.lighthouseci/`; commit 82fc5a2 message lists each URL's scores; REQUIREMENTS.md marks [x] Complete |

**Orphaned requirements check:** PRLLX-04 exists in REQUIREMENTS.md as deferred (defer tag, not assigned to Phase 30) — correctly excluded from this phase. No orphaned requirements.

**Assertion-results.json note:** The 5 entries in `assertion-results.json` are ALL `level: warn` (not `error`) for the `accessibility` audit property — NOT for performance. These are pre-existing accessibility warnings unrelated to Phase 30 parallax work. LHCI performance assertions passed.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `lenis-provider.tsx` | 26, 57 | `return null` | Info | Intentional — `LenisScrollReset` and `LenisGSAPBridge` are render-null inner components by design; not stubs |
| `hero-section.tsx` | 37 | `// pin: false — never use pin: true` | Info | Comment-only; active `pin: true` absent — correct per Lighthouse CLS requirement |

No blocker or warning anti-patterns found. Zero `TODO/FIXME/HACK/PLACEHOLDER` markers. Zero empty handler stubs. `pin: true` confirmed absent from all portfolio component files and all portfolio page files.

---

## Commit Integrity

All 4 commits from SUMMARY.md files verified present in git history:

| Commit | Message | Plan |
|--------|---------|------|
| `0b96b38` | feat(30-01): add LenisGSAPBridge — autoRaf: false + gsap.ticker sync | 30-01 |
| `f26c13d` | feat(30-01): add hero text parallax via useGSAP + ScrollTrigger | 30-01 |
| `379779b` | feat(30-02): add ParallaxDivider component with scaleX 0.92→1.04 scrub animation | 30-02 |
| `82fc5a2` | feat(30-02): Lighthouse CI gate — all 5 URLs score 1.00 (100%) performance, CLS = 0 | 30-02 |

---

## Human Verification Required

### 1. Hero Depth Effect — Text Drifting Slower Than Page

**Test:** Start `npx next dev` in `apps/web`. Visit `http://localhost:3000/`. Scroll slowly through the hero section.
**Expected:** The text block (name, subtitle, buttons) visibly moves upward at a slower rate than the page scroll distance — as if it has more inertia or is on a deeper z-layer. The canvas background moves at full scroll speed.
**Why human:** The yPercent: -15 animation with scrub: 1 is correctly coded. Whether this produces a perceptible depth illusion at the actual scroll speed requires visual confirmation.

### 2. Divider Line Depth Effect — Independent Scale on Scroll

**Test:** Continue scrolling past the hero on `http://localhost:3000/`. Watch the horizontal line between the hero and "Featured Projects" section. Also watch the second line between "Featured Projects" and "Stats". Then visit `http://localhost:3000/about` and watch the two divider lines there.
**Expected:** Each line subtly expands horizontally (scaleX: 0.92 → 1.04) as it enters the viewport center, creating a sense of the line being on an independent depth layer from the surrounding content blocks.
**Why human:** The fromTo animation is correctly wired. The depth perception (does it actually feel like independent depth?) requires human evaluation.

### 3. prefers-reduced-motion Gate

**Test:** Enable "Reduce Motion" in OS accessibility settings (Windows: Settings > Accessibility > Visual Effects > Animation Effects = Off; macOS: System Settings > Accessibility > Display > Reduce Motion). Hard-reload `http://localhost:3000/`. Scroll through the hero and past the divider lines.
**Expected:** Hero text shows ZERO drift — it scrolls at the same rate as the page. Divider lines show NO scale animation — they remain static at their natural width. Then disable the setting and confirm parallax returns.
**Why human:** The `window.matchMedia('(prefers-reduced-motion: reduce)').matches` guard is correctly placed as an early return inside useGSAP callbacks, and LenisProvider fully unmounts ReactLenis when reduced motion is preferred. Runtime verification under actual OS setting required.

### 4. Navigation Re-fire — No Stale Instances

**Test:** On `http://localhost:3000/`, scroll halfway through the hero (hero text should be mid-drift). Navigate to `/projects`. Navigate back to `/`. Scroll through the hero again.
**Expected:** Hero parallax re-fires correctly from the top — hero text starts at its native position and drifts as expected. No frozen mid-animation state. No visual jump.
**Why human:** `useGSAP({ scope: sectionRef })` auto-reverts the GSAP context on component unmount (correct pattern). Next.js App Router component lifecycle during back-navigation needs runtime validation.

### 5. Zero Console Errors

**Test:** Open browser DevTools Console. Visit `/`, `/about`, `/projects`, `/contact`. Check for any JavaScript errors (red entries).
**Expected:** Console is clean — no GSAP registration errors, no ScrollTrigger warnings (beyond expected "ScrollTrigger registered" info messages), no React errors.
**Why human:** No `console.error` calls appear in source code and TypeScript build is clean, but runtime GSAP plugin initialization warnings or Next.js hydration errors can only be observed in a live browser.

---

## Summary

Phase 30 code implementation is complete and correct. All 7 artifacts exist at the substantive level with all key links properly wired:

- `lenis-provider.tsx` has `autoRaf: false`, `LenisGSAPBridge` with named `tickerFn` wired into `gsap.ticker.add/remove`, `ScrollTrigger.update` on Lenis scroll events, `lagSmoothing(0)`, and proper cleanup — all inside the ReactLenis tree.
- `hero-section.tsx` has `sectionRef` + `textRef`, `useGSAP({ scope: sectionRef })`, `yPercent: -15`, `scrub: 1`, `invalidateOnRefresh: true`, `overflow-hidden` on the section, prefers-reduced-motion guard.
- `parallax-divider.tsx` has `containerRef` + `lineRef`, `gsap.fromTo` with `scaleX: 0.92 → 1.04`, `scrub: 1`, `invalidateOnRefresh: true`, `overflow-hidden` on container, `origin-center` on line, prefers-reduced-motion guard.
- Homepage (`page.tsx`) renders `ParallaxDivider` at both section boundaries (lines 19 and 137).
- About page (`about/page.tsx`) renders `ParallaxDivider` at two section boundaries (lines 52 and 62).
- LHCI confirmed: all 5 URLs score 1.00 performance, CLS=0.
- No `pin: true` anywhere.
- No layout-affecting animation properties.
- REQUIREMENTS.md marks PRLLX-01, PRLLX-02, PRLLX-03 all [x] Complete.

The automated gate (PRLLX-03 Lighthouse CI) passed at 100% performance with CLS=0. The remaining 5 human verification items cover the perceptual and runtime aspects of PRLLX-01 and PRLLX-02 that cannot be confirmed from static code analysis.

---

_Verified: 2026-02-20T23:55:00Z_
_Verifier: Claude (gsd-verifier)_
