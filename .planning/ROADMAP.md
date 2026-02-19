# Roadmap: Fernando Millan Portfolio & DevCollab

## Milestones

- ✅ **v1.0 Foundation & Features** — Phases 1-7 (shipped 2026-02-16)
- ✅ **v1.1 UI/Design System Overhaul** — Phases 8-13 (shipped 2026-02-17)
- ✅ **v2.0 DevCollab** — Phases 14-21 (shipped 2026-02-18)
- 🔄 **v2.5 Matrix Portfolio Overhaul** — Phases 22-25 (in progress)

## Phases

<details>
<summary>✅ v1.0 Foundation & Features (Phases 1-7) — SHIPPED 2026-02-16</summary>

- [x] Phase 1: Foundation & Authentication (7/7 plans) — completed 2026-02-14
- [x] Phase 2: Core Work Management (11/11 plans) — completed 2026-02-14
- [x] Phase 3: Real-Time Collaboration (4/4 plans) — completed 2026-02-15
- [x] Phase 4: Portfolio & Polish (10/10 plans) — completed 2026-02-15
- [x] Phase 5.1: Authentication Investigation (2/2 plans) — completed 2026-02-15
- [x] Phase 6: Authentication Fixes (2/2 plans) — completed 2026-02-16
- [x] Phase 6.1: User Flow & Architecture Audit (6/6 plans) — completed 2026-02-16
- [x] Phase 7: Phase 3 Verification & Real-Time Features Validation (1/1 plan) — completed 2026-02-16

Full archive: `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 UI/Design System Overhaul (Phases 8-13) — SHIPPED 2026-02-17</summary>

- [x] Phase 8: Foundation Validation (2/2 plans) — completed 2026-02-16
- [x] Phase 9: Design System Foundation (4/4 plans) — completed 2026-02-16
- [x] Phase 10: Component Migration (Portfolio) (4/4 plans) — completed 2026-02-17
- [x] Phase 11: Form Components & Validation (4/4 plans) — completed 2026-02-17
- [x] Phase 12: Critical Route Migration (9/9 plans) — completed 2026-02-17
- [x] Phase 13: Automation & Optimization (3/3 plans) — completed 2026-02-17

Full archive: `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v2.0 DevCollab (Phases 14-21) — SHIPPED 2026-02-18</summary>

- [x] Phase 14: Monorepo Scaffold + Infrastructure (4/4 plans) — completed 2026-02-17
- [x] Phase 15: Authentication System (5/5 plans) — completed 2026-02-17
- [x] Phase 16: Workspaces + Membership + RBAC (4/4 plans) — completed 2026-02-17
- [x] Phase 17: Content Creation — Snippets + Posts (5/5 plans) — completed 2026-02-18
- [x] Phase 18: Discussions + Reactions (4/4 plans) — completed 2026-02-18
- [x] Phase 19: Notifications + Activity Feed (4/4 plans) — completed 2026-02-18
- [x] Phase 20: Full-Text Search (3/3 plans) — completed 2026-02-18
- [x] Phase 21: Seed Data + Portfolio Integration (3/3 plans) — completed 2026-02-18

Full archive: `.planning/milestones/v2.0-ROADMAP.md`

</details>

### v2.5 Matrix Portfolio Overhaul

- [x] **Phase 22: Token Foundation** — CSS token system, animation packages, pure-CSS effects, reduced-motion foundation
- [x] **Phase 23: Canvas Matrix Rain** — Hero digital rain canvas, isolated Lighthouse validation
- [ ] **Phase 24: Scroll Animations + Entrance** — Motion provider, scroll-reveal animations across all portfolio pages
- [ ] **Phase 25: Personality Effects** — Text scramble, Evervault card hover, dot grid + spotlight cursor

## Phase Details

### Phase 22: Token Foundation
**Goal**: The portfolio CSS token system is in place, animation packages are installed, and the two pure-CSS effects (terminal cursor, card border glow) are live — everything that Phase 23 and beyond will build on exists and is verifiable without any animation library
**Depends on**: Nothing — this is the first v2.5 phase
**Requirements**: THEME-01, THEME-02, THEME-03, THEME-04, FX-02, UX-01
**Success Criteria** (what must be TRUE):
  1. `--matrix-green: #00FF41`, `--matrix-green-dim`, and `--matrix-green-ghost` are available as CSS custom properties in every portfolio route — verifiable by opening DevTools > Computed and checking the variables exist on `:root`
  2. `motion`, `gsap`, `@gsap/react`, and `lenis` appear in `apps/web/package.json` and the lockfile — no other workspace package.json contains these packages
  3. Project card border glows Matrix green (`box-shadow` with `--matrix-green`) when the cursor hovers over it
  4. A blinking `_` cursor appears after the hero tagline with no JavaScript — visible in the DOM as a CSS `::after` pseudo-element
  5. All existing Playwright visual regression snapshots pass unchanged — Matrix CSS tokens are defined in `:root` but the `.matrix-theme` class is not yet applied, so no visual diff occurs; OS Reduce Motion toggled ON produces a fully static page (no animations fire, canvas RAF does not start)
**Plans**: 3 plans

Plans:
- [x] 22-01-PLAN.md — CSS tokens + reduced-motion rule + dormant `.matrix-theme` class on portfolio layout (complete 2026-02-19)
- [x] 22-02-PLAN.md — Install motion, gsap, @gsap/react, lenis workspace-scoped to apps/web (complete 2026-02-19)
- [x] 22-03-PLAN.md — FX-02 blinking cursor + UX-01 card glow + Playwright snapshot update (complete 2026-02-18)

### Phase 23: Canvas Matrix Rain
**Goal**: The hero section has a functioning Matrix digital rain canvas that passes the Lighthouse CI performance gate on all five portfolio URLs — proving canvas does not degrade site performance before any animation library is layered on top
**Depends on**: Phase 22
**Requirements**: ANIM-02, ANIM-03
**Success Criteria** (what must be TRUE):
  1. The hero section displays falling green characters behind the content at opacity 0.04–0.07 — visible but content remains clearly readable
  2. The canvas element has `aria-hidden="true"` and does not appear in the accessibility tree (verifiable with axe DevTools or VoiceOver)
  3. `lhci autorun` reports performance score ≥ 0.90 on all five portfolio URLs (`/`, `/projects`, `/projects/teamflow`, `/projects/devcollab`, `/contact`) — this is a hard gate; Phase 24 does not start until this passes
  4. The canvas animation does not start when OS Reduce Motion is active — the RAF loop is skipped entirely, verified by toggling OS accessibility setting
  5. After 10+ client-side navigations, Chrome Memory tab shows a stable heap with no growth — the RAF loop is fully canceled on component unmount
**Plans**: 4 plans

Plans:
- [x] 23-01-PLAN.md — MatrixRainCanvas component + hero-section integration via next/dynamic (ANIM-02) (complete 2026-02-18)
- [x] 23-02-PLAN.md — Install @lhci/cli + fix lighthouserc.json URL list to five required routes (ANIM-03) (complete 2026-02-19)
- [x] 23-03-PLAN.md — Regenerate Playwright homepage snapshots + accessibility gate (ANIM-02) (complete 2026-02-18)
- [x] 23-04-PLAN.md — Production build + lhci autorun performance gate (ANIM-03 hard gate) (complete 2026-02-19)

### Phase 24: Scroll Animations + Entrance
**Goal**: Section headings and project cards animate in as the visitor scrolls through every portfolio page, with the MotionConfig reduced-motion gate active globally — the portfolio feels alive but respects system accessibility preferences
**Depends on**: Phase 23
**Requirements**: ANIM-01
**Success Criteria** (what must be TRUE):
  1. Section headings on every portfolio page (`/`, `/projects`, `/projects/teamflow`, `/projects/devcollab`, `/contact`) fade and slide up from below when scrolled into view — elements start at `opacity: 0` and transition to `opacity: 1` with a `translateY` motion only
  2. Project cards stagger in sequentially (not all at once) on first scroll-reveal — the stagger delay is visible to a human observer
  3. With OS Reduce Motion toggled ON, all scroll animations are completely disabled — elements appear at their final state immediately with no transition, verified by scrolling through the full page
  4. Zero hydration warnings appear in the browser console on first page load for any portfolio route — verified in Chrome DevTools Console with React strict mode active
  5. Navigating between portfolio pages three or more times does not cause animations to replay incorrectly or trigger multiple times — each section animates exactly once per page visit
**Plans**: TBD

### Phase 25: Personality Effects
**Goal**: The hero name scrambles from noise to readable text on load, project cards reveal a noise-decryption effect on hover, and a green spotlight follows the mouse cursor over a dot-grid background — the portfolio has a distinct "serious engineer with craft" personality that is memorable without being distracting
**Depends on**: Phase 24
**Requirements**: FX-01, FX-03, FX-04
**Success Criteria** (what must be TRUE):
  1. The hero name cycles through noise characters before resolving to the correct text on page load — the scramble effect fires exactly once and stops; refreshing triggers it again but it never loops or re-fires after resolution
  2. Hovering over a project card causes the card title to transition from scrambled noise characters to legible text — moving the cursor away does not loop the effect; it resolves cleanly
  3. A green spotlight circle follows the mouse cursor across portfolio pages and illuminates the dot-grid background beneath it — the effect tracks cursor position in real time without visible lag
  4. On a touch device (or any device where `pointer: coarse` or `any-hover: none` applies), the spotlight cursor effect is completely absent — no visual artifact, no broken layout
  5. Lighthouse CI performance score remains ≥ 0.90 on all five portfolio URLs after Phase 25 ships — verifiable by running `lhci autorun` after all effects are in place
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Authentication | v1.0 | 7/7 | Complete | 2026-02-14 |
| 2. Core Work Management | v1.0 | 11/11 | Complete | 2026-02-14 |
| 3. Real-Time Collaboration | v1.0 | 4/4 | Complete | 2026-02-15 |
| 4. Portfolio & Polish | v1.0 | 10/10 | Complete | 2026-02-15 |
| 5.1. Authentication Investigation | v1.0 | 2/2 | Complete | 2026-02-15 |
| 6. Authentication Fixes | v1.0 | 2/2 | Complete | 2026-02-16 |
| 6.1. User Flow & Architecture Audit | v1.0 | 6/6 | Complete | 2026-02-16 |
| 7. Phase 3 Verification | v1.0 | 1/1 | Complete | 2026-02-16 |
| 8. Foundation Validation | v1.1 | 2/2 | Complete | 2026-02-16 |
| 9. Design System Foundation | v1.1 | 4/4 | Complete | 2026-02-16 |
| 10. Component Migration (Portfolio) | v1.1 | 4/4 | Complete | 2026-02-17 |
| 11. Form Components & Validation | v1.1 | 4/4 | Complete | 2026-02-17 |
| 12. Critical Route Migration | v1.1 | 9/9 | Complete | 2026-02-17 |
| 13. Automation & Optimization | v1.1 | 3/3 | Complete | 2026-02-17 |
| 14. Monorepo Scaffold + Infrastructure | v2.0 | 4/4 | Complete | 2026-02-17 |
| 15. Authentication System | v2.0 | 5/5 | Complete | 2026-02-17 |
| 16. Workspaces + Membership + RBAC | v2.0 | 4/4 | Complete | 2026-02-17 |
| 17. Content Creation — Snippets + Posts | v2.0 | 5/5 | Complete | 2026-02-18 |
| 18. Discussions + Reactions | v2.0 | 4/4 | Complete | 2026-02-18 |
| 19. Notifications + Activity Feed | v2.0 | 4/4 | Complete | 2026-02-18 |
| 20. Full-Text Search | v2.0 | 3/3 | Complete | 2026-02-18 |
| 21. Seed Data + Portfolio Integration | v2.0 | 3/3 | Complete | 2026-02-18 |
| 22. Token Foundation | 4/4 | Complete    | 2026-02-19 | 2026-02-18 |
| 23. Canvas Matrix Rain | v2.5 | 4/4 | Complete | 2026-02-19 |
| 24. Scroll Animations + Entrance | v2.5 | 0/? | Not started | — |
| 25. Personality Effects | v2.5 | 0/? | Not started | — |
