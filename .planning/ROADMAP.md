# Roadmap: Fernando Millan Portfolio & DevCollab

## Milestones

- ✅ **v1.0 TeamFlow Foundation** - Phases 1-7 (shipped 2026-02-16)
- ✅ **v1.1 Design System** - Phases 8-13 (shipped 2026-02-17)
- ✅ **v2.0 DevCollab** - Phases 14-21 (shipped 2026-02-18)
- ✅ **v2.5 Matrix Portfolio Overhaul** - Phases 22-26 (shipped 2026-02-19)
- ✅ **v3.0 Deployment & Tech Debt Closure** - Phases 27-32 (shipped 2026-02-21)
- ✅ **v3.1 Portfolio Polish & Matrix Cohesion** - Phases 33 (shipped 2026-02-21)
- ✅ **v4.0 Live QA & Content Polish** - Phases 34-37 (shipped 2026-02-26)
- ✅ **v4.1 Screenshot Story Walkthroughs** - Phases 38-40 (shipped 2026-02-26)

## Phases

<details>
<summary>✅ v1.0–v4.0 (Phases 1–37) - SHIPPED 2026-02-26</summary>

All prior milestone phases (1–37) are complete and archived in:
- `.planning/milestones/v2.0-ROADMAP.md`
- `.planning/milestones/v2.5-ROADMAP.md`
- `.planning/milestones/v4.0-ROADMAP.md`

Phase 37 (last v4.0 phase): Phase 34 Documentation Closure — complete 2026-02-26.

</details>

---

### ✅ v4.1 Screenshot Story Walkthroughs (SHIPPED 2026-02-26)

**Milestone Goal:** Add annotated screenshot walkthrough sections to both case study pages that narrate each SaaS app's workflow through Matrix-themed, numbered callout overlays — giving recruiters a visual story of each app without requiring a live demo session.

## Phase Details

### Phase 38: Screenshot Capture
**Goal**: Ten production-quality workflow screenshots exist as optimized static assets, captured from authenticated live sessions of both deployed apps, ready to be consumed by the walkthrough component.
**Depends on**: Phase 37 (live apps are fully functional — v4.0 complete)
**Requirements**: SHOT-01, SHOT-02, SHOT-03
**Success Criteria** (what must be TRUE):
  1. A Playwright script runs against `teamflow.fernandomillan.me`, authenticates, and saves 5 screenshots covering: Kanban board, real-time presence, task create/assign modal, RBAC team management, audit log
  2. A Playwright script runs against `devcollab.fernandomillan.me`, authenticates, and saves 5 screenshots covering: workspace overview/feed, code snippet with Shiki, threaded discussion with @mention, Cmd+K search, activity feed/notification bell
  3. All 10 PNG files exist in `apps/web/public/screenshots/` at exactly 1280x800px and are referenced via `next/image` with proper width/height props
**Plans**: 3 plans

Plans:
- [x] 38-01-PLAN.md — TeamFlow Playwright capture script + 5 screenshots
- [x] 38-02-PLAN.md — DevCollab Playwright capture script + 5 screenshots
- [x] 38-03-PLAN.md — Dimension verification + typed screenshots manifest

### Phase 39: Walkthrough Component
**Goal**: A `WalkthroughSection` React component exists that renders any set of screenshots with numbered callout circles, a matching legend, Matrix styling, and scroll-reveal animations — fully reusable for both case studies.
**Depends on**: Phase 38 (screenshots must exist to develop against real assets)
**Requirements**: WALK-01, WALK-02, WALK-03, WALK-04
**Success Criteria** (what must be TRUE):
  1. Numbered callout circles appear pinned at defined pixel coordinates on top of each screenshot image
  2. Below each screenshot, a legend renders numbered entries — each with a short label and one-sentence explanation — whose numbers match the overlay circles
  3. The component background is `#0a0a0a`, callout circles and step numbers use `--matrix-green`, and labels use a monospace font
  4. The walkthrough section entrance animation fires on scroll using the existing `AnimateIn`/`StaggerContainer` animation system and respects `prefers-reduced-motion`
**Plans**: 1 plan

Plans:
- [x] 39-01-PLAN.md — WalkthroughSection component: types + callout circles + legend + Matrix styling + animations

### Phase 40: Integration & QA
**Goal**: Both case study pages display the `WalkthroughSection` with their respective screenshots and callout definitions, pass Lighthouse CI, meet accessibility requirements, and handle reduced-motion correctly.
**Depends on**: Phase 39 (component must exist before integration)
**Requirements**: INTG-01, INTG-02, QA-01, QA-02, QA-03
**Success Criteria** (what must be TRUE):
  1. Visiting `/projects/teamflow` shows the `WalkthroughSection` with all 5 TeamFlow screenshots and correct callout overlays/legend
  2. Visiting `/projects/devcollab` shows the `WalkthroughSection` with all 5 DevCollab screenshots and correct callout overlays/legend
  3. Lighthouse CI reports performance score ≥ 0.90 on both case study pages after the new screenshot assets are added
  4. All callout overlay elements have `aria-label` attributes and all screenshots have descriptive `alt` text readable by a screen reader
  5. With `prefers-reduced-motion: reduce` active, the walkthrough section renders without any entrance animation, and no animation-related errors appear
**Plans**: 3 plans

Plans:
- [x] 40-01-PLAN.md — Walkthrough data file + Lighthouse accessibility gate upgrade
- [x] 40-02-PLAN.md — WalkthroughSection integration into TeamFlow and DevCollab case study pages
- [x] 40-03-PLAN.md — Lighthouse CI run + accessibility audit + reduced-motion checkpoint

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 38. Screenshot Capture | 3/3 | Complete    | 2026-02-26 | - |
| 39. Walkthrough Component | 1/1 | Complete    | 2026-02-26 | - |
| 40. Integration & QA | 3/3 | Complete    | 2026-02-26 | - |
