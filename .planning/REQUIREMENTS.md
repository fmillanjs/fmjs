# Requirements: Fernando Millan Portfolio & DevCollab

**Defined:** 2026-02-26
**Core Value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.

## v4.1 Requirements

Requirements for the Screenshot Story Walkthroughs milestone. Each maps to roadmap phases.

### Screenshot Capture

- [x] **SHOT-01**: Playwright script captures 5 TeamFlow workflow screenshots from the live app (authenticated session): Kanban board, real-time presence, task create/assign modal, team RBAC management, audit log
- [x] **SHOT-02**: Playwright script captures 5 DevCollab workflow screenshots from the live app (authenticated session): workspace overview/feed, code snippet with Shiki highlighting, threaded discussion with @mention, Cmd+K full-text search, activity feed / notification bell
- [x] **SHOT-03**: All 10 screenshots stored as optimized static assets at consistent resolution (1280×800), served via next/image

### Walkthrough Component

- [x] **WALK-01**: `WalkthroughSection` component renders screenshots vertically with numbered callout overlay circles pinned at defined coordinates on each screenshot
- [x] **WALK-02**: Each step has a legend below the screenshot — numbered entries matching the overlay circles, each with a short label and 1-sentence explanation
- [x] **WALK-03**: Component is styled in Matrix theme: `#0a0a0a` background, `--matrix-green` accents on callout circles and step numbers, monospace font for labels
- [x] **WALK-04**: Walkthrough section has scroll-reveal entrance animation consistent with existing portfolio animation system (AnimateIn/StaggerContainer)

### Integration

- [x] **INTG-01**: TeamFlow case study page (`/projects/teamflow`) includes the `WalkthroughSection` with its 5 captured screenshots and callout definitions
- [x] **INTG-02**: DevCollab case study page (`/projects/devcollab`) includes the `WalkthroughSection` with its 5 captured screenshots and callout definitions

### Quality

- [x] **QA-01**: Lighthouse CI ≥ 0.90 on case study pages after new screenshot assets (next/image lazy loading, proper sizing)
- [x] **QA-02**: Callout overlays have `aria-label` attributes; screenshots have descriptive `alt` text
- [ ] **QA-03**: Walkthrough section works correctly with `prefers-reduced-motion` (no animation violations)

## Future Requirements

### Enhanced Walkthrough

- **WALK-05**: Step-by-step interactive mode — user can click through steps with next/prev arrows (deferred: vertical scroll is cleaner for initial version)
- **WALK-06**: Video walkthrough / screen recording embed alongside screenshots (deferred: high asset maintenance cost)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Video walkthroughs | High asset maintenance cost, screenshot story achieves the same narrative goal |
| Animated GIF screenshots | File size / Lighthouse impact; static screenshots with callouts are cleaner |
| Third project walkthrough | Only TeamFlow and DevCollab are case studies in the portfolio |
| Interactive step-through mode | Vertical scroll is simpler, works better for recruiter skimming |
| Purple in any design element | User requirement, all milestones |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SHOT-01 | Phase 38 | Complete |
| SHOT-02 | Phase 38 | Complete |
| SHOT-03 | Phase 38 | Complete |
| WALK-01 | Phase 39 | Complete |
| WALK-02 | Phase 39 | Complete |
| WALK-03 | Phase 39 | Complete |
| WALK-04 | Phase 39 | Complete |
| INTG-01 | Phase 40 | Complete |
| INTG-02 | Phase 40 | Complete |
| QA-01 | Phase 40 | Complete |
| QA-02 | Phase 40 | Complete |
| QA-03 | Phase 40 | Pending |

**Coverage:**
- v4.1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-26*
*Last updated: 2026-02-26 — Traceability confirmed after roadmap creation*
