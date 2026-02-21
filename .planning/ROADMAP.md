# Roadmap: Fernando Millan Portfolio & DevCollab

## Milestones

- ✅ **v1.0 Foundation & Features** — Phases 1-7 (shipped 2026-02-16)
- ✅ **v1.1 UI/Design System Overhaul** — Phases 8-13 (shipped 2026-02-17)
- ✅ **v2.0 DevCollab** — Phases 14-21 (shipped 2026-02-18)
- ✅ **v2.5 Matrix Portfolio Overhaul** — Phases 22-26 (shipped 2026-02-19)
- ✅ **v3.0 Deployment & Tech Debt Closure** — Phases 27-28 (shipped 2026-02-20)
- 🚧 **v3.1 Portfolio Polish & Matrix Cohesion** — Phases 29-33 (in progress)

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

<details>
<summary>✅ v2.5 Matrix Portfolio Overhaul (Phases 22-26) — SHIPPED 2026-02-19</summary>

- [x] Phase 22: Token Foundation (4/4 plans) — completed 2026-02-19
- [x] Phase 23: Canvas Matrix Rain (4/4 plans) — completed 2026-02-19
- [x] Phase 24: Scroll Animations + Entrance (3/3 plans) — completed 2026-02-19
- [x] Phase 25: Personality Effects (4/4 plans) — completed 2026-02-19
- [x] Phase 26: Navigation Redesign (2/2 plans) — completed 2026-02-19

Full archive: `.planning/milestones/v2.5-ROADMAP.md`

</details>

<details>
<summary>✅ v3.0 Deployment & Tech Debt Closure (Phases 27-28) — SHIPPED 2026-02-20</summary>

- [x] Phase 27: Infrastructure Foundation + Prisma Fix (3/3 plans) — completed 2026-02-20
- [x] Phase 28: DevCollab UI Debt Closure (3/3 plans) — completed 2026-02-20

Full archive: `.planning/milestones/v3.0-ROADMAP.md`

</details>

### 🚧 v3.1 Portfolio Polish & Matrix Cohesion (In Progress)

**Milestone Goal:** Apply the Matrix aesthetic consistently across the entire portfolio and ship the remaining deferred animation features (Lenis, GSAP parallax, magnetic buttons, color harmony, footer) for an Awwwards-quality, cohesive final product.

**CI Hard Gates (every phase):**
- Lighthouse CI performance >= 0.90 on all 5 URLs: `/`, `/projects`, `/projects/teamflow`, `/projects/devcollab`, `/contact`
- Playwright accessibility axe WCAG AA must remain passing after every phase
- No `pin: true` in any GSAP ScrollTrigger (CLS regression)
- LenisProvider scoped to `(portfolio)/layout.tsx` only — TeamFlow dashboard unaffected

- [x] **Phase 29: Lenis Foundation** - Inertia smooth scroll wired across all portfolio pages with correct GSAP ticker sync, route-reset, modal lock, and reduced-motion bypass (completed 2026-02-21)
- [ ] **Phase 30: GSAP ScrollTrigger Parallax** - Hero text and section separator depth effects driven by scroll position via GSAP ScrollTrigger synced to Lenis ticker
- [ ] **Phase 31: Magnetic Buttons** - Spring-physics cursor attraction on hero and contact CTAs with touch/reduced-motion guard
- [ ] **Phase 32: Matrix Color Harmony** - Four new CSS tokens and consistent Matrix green applied across all portfolio sections, eliminating all blue Radix primary mismatches
- [ ] **Phase 33: Footer Redesign + Matrix Animation** - Terminal-themed footer with CRT scanlines and single-fire CSS glitch text

## Phase Details

### Phase 29: Lenis Foundation
**Goal**: Users experience inertia-based smooth scroll across all portfolio pages with zero side effects on the TeamFlow dashboard, CommandPalette, navigation, or reduced-motion users
**Depends on**: Phase 28 (v3.0 complete)
**Requirements**: SCROLL-01, SCROLL-02, SCROLL-03, SCROLL-04
**Success Criteria** (what must be TRUE):
  1. User scrolling any portfolio page (`/`, `/projects`, `/projects/teamflow`, `/projects/devcollab`, `/contact`) feels inertia-based smooth scroll instead of native instant scroll
  2. User clicking a nav link to a different portfolio page always arrives at the top of the destination page, not mid-page
  3. User with `prefers-reduced-motion: reduce` set in OS gets native browser scroll — no Lenis instance is initialized, no RAF overhead runs
  4. User opening the CommandPalette (Cmd+K) cannot scroll the background page while the modal is open; background scroll resumes on close
  5. User navigating to the TeamFlow dashboard sees no Lenis interference — TanStack Table virtual scroll and Socket.io behavior are identical to pre-Phase-29
**Plans**: 3 plans

Plans:
- [ ] 29-01-PLAN.md — LenisProvider component (prefers-reduced-motion gate, LenisScrollReset inner, autoRaf: true) + globals.css Lenis CSS import + portfolio layout wiring
- [ ] 29-02-PLAN.md — CommandPalette lenis.stop/start integration + human browser verification of all 4 SCROLL requirements
- [ ] 29-03-PLAN.md — Lighthouse CI gate verification (all 5 portfolio URLs >= 0.90 performance)

### Phase 30: GSAP ScrollTrigger Parallax
**Goal**: Users scrolling the portfolio hero and past section separators perceive distinct depth layers — hero text drifting upward slower than the page, decorative lines moving at an independent rate — without any layout shift or Lighthouse regression
**Depends on**: Phase 29 (Lenis ticker sync must be established)
**Requirements**: PRLLX-01, PRLLX-02, PRLLX-03
**Success Criteria** (what must be TRUE):
  1. User scrolling the hero section sees the hero text block drift upward visibly slower than the page scroll speed (yPercent: -15, scrub: 1)
  2. User scrolling past section dividers sees decorative lines shift at an independent depth from the surrounding content (subtle scale or y transform, no abrupt jump)
  3. Lighthouse CI performance score is >= 0.90 on all five portfolio URLs with parallax active — CLS is 0 (no `pin: true` spacers, transform-only properties only)
  4. User navigating away from a parallaxed page and returning sees the animations fire correctly — no stale ScrollTrigger instances or frozen positions
**Plans**: 2 plans

Plans:
- [ ] 30-01-PLAN.md — LenisProvider autoRaf: false + LenisGSAPBridge ticker sync + hero text parallax (yPercent: -15, scrub: 1)
- [ ] 30-02-PLAN.md — ParallaxDivider component (scaleX depth effect) + homepage/page inserts + Lighthouse CI gate (CLS = 0, all 5 URLs >= 0.90)

### Phase 31: Magnetic Buttons
**Goal**: Users hovering the hero CTAs and contact CTA experience spring-physics cursor attraction; users on touch devices or with reduced-motion preference see a plain button with no behavior change
**Depends on**: Phase 29 (Lenis stable; isolates debugging surface)
**Requirements**: MAGN-01, MAGN-02, MAGN-03
**Success Criteria** (what must be TRUE):
  1. User hovering the "View Projects" hero CTA sees the button attract toward the cursor position with spring elasticity and snap back smoothly on cursor leave
  2. User hovering the "View GitHub" hero CTA sees the same spring-physics magnetic attraction
  3. User hovering the "Get In Touch" contact CTA sees the same magnetic spring behavior
  4. User on a touch device (phone, tablet) tapping any CTA sees a plain button press — no position shift, no magnetic artifact
  5. User with `prefers-reduced-motion: reduce` active sees a plain button — the MagneticButton component renders a static wrapper with no motion values
**Plans**: TBD

Plans:
- [ ] 31-01: MagneticButton component (motion/react useMotionValue + useSpring + useReducedMotion guard)
- [ ] 31-02: Apply MagneticButton to hero CTAs + contact CTA + Lighthouse TBT verification (< 50ms)

### Phase 32: Matrix Color Harmony
**Goal**: Every portfolio section uses Matrix green tokens consistently — no blue Radix primary colors remain visible anywhere in the portfolio — and all 18 Playwright visual regression baselines are updated and passing
**Depends on**: Phase 29 (can run independently of 30/31, but after 29 for stable scroll context)
**Requirements**: COLOR-01, COLOR-02, COLOR-03, COLOR-04, COLOR-05, COLOR-06, COLOR-07, COLOR-08
**Success Criteria** (what must be TRUE):
  1. Four new CSS tokens (`--matrix-green-subtle`, `--matrix-green-border`, `--matrix-scan-line`, `--matrix-terminal`) are defined and scoped to `.matrix-theme` in globals.css
  2. User visiting the About page sees no blue gradient or blue card borders — all value card borders and CTA gradient use Matrix green tokens
  3. User visiting the Contact page sees heading accents and CTA styling in Matrix green, not blue Radix primary
  4. User visiting either case study page (`/projects/teamflow`, `/projects/devcollab`) sees metric numbers rendered in Matrix green monospace — no blue accent numbers
  5. User seeing tech-stack badges notices green token borders instead of blue Radix primary; footer link hover states show Matrix green instead of blue
  6. User viewing any portfolio `<h2>` section heading sees a terminal-style label prefix (`> SECTION_NAME`) above it in Matrix green monospace
  7. All 18 Playwright visual regression snapshots pass at maxDiffPixelRatio 0.02 after baseline update; navigating to TeamFlow dashboard shows zero Matrix green bleed
**Plans**: TBD

Plans:
- [ ] 32-01: Four new CSS tokens in globals.css + About page color sweep
- [ ] 32-02: Contact page + case study pages + tech-stack badge color sweep
- [ ] 32-03: Footer link hover + terminal `> SECTION_NAME` prefixes across all portfolio pages
- [ ] 32-04: Playwright baseline update (--update-snapshots) + all 18 snapshots green + dashboard isolation check

### Phase 33: Footer Redesign + Matrix Animation
**Goal**: Users reaching the footer experience a terminal-themed close — dark background, scanline texture, terminal-prompt social links, `> EOF` tagline, and a single-fire CSS glitch on the signature name — with all links keyboard-accessible and all 18 visual regression snapshots passing
**Depends on**: Phase 32 (consumes the four new CSS tokens defined there)
**Requirements**: FOOTER-01, FOOTER-02, FOOTER-03, FOOTER-04, FOOTER-05, FOOTER-06, FOOTER-07
**Success Criteria** (what must be TRUE):
  1. User seeing the footer notices a `#0a0a0a` background with a Matrix green top border — no `bg-muted` gray background remains
  2. User reading the social links sees them formatted as `> github`, `> linkedin`, `> email` in monospace Matrix green, not plain anchor text
  3. User reading the footer bottom sees a `> EOF` tagline as a narrative close before the copyright line
  4. User viewing the footer sees a CRT scanline texture overlay rendered via CSS `::before` pseudo-element — no JavaScript, no canvas, no animation library
  5. User scrolling the "Fernando Millan" footer signature into view for the first time sees a single CSS glitch animation fire exactly once — subsequent scrolls show the static text with no repeat
  6. User tabbing through the footer with a keyboard sees all social links receive a visible focus ring in the correct position
  7. All 18 Playwright visual regression snapshots pass at maxDiffPixelRatio 0.02 after footer baseline update; reduced-motion users see a static footer with all animations disabled
**Plans**: TBD

Plans:
- [ ] 33-01: Footer static redesign — background, border, scanlines (CSS ::before), terminal social links, > EOF tagline
- [ ] 33-02: FooterMatrixEffect dynamic island — single-fire CSS glitch on "Fernando Millan" via IntersectionObserver (next/dynamic ssr:false)
- [ ] 33-03: Accessibility audit (keyboard focus rings, axe WCAG AA) + Playwright baseline update + all 18 snapshots green

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
| 22. Token Foundation | v2.5 | 4/4 | Complete | 2026-02-19 |
| 23. Canvas Matrix Rain | v2.5 | 4/4 | Complete | 2026-02-19 |
| 24. Scroll Animations + Entrance | v2.5 | 3/3 | Complete | 2026-02-19 |
| 25. Personality Effects | v2.5 | 4/4 | Complete | 2026-02-19 |
| 26. Navigation Redesign | v2.5 | 2/2 | Complete | 2026-02-19 |
| 27. Infrastructure Foundation + Prisma Fix | v3.0 | 3/3 | Complete | 2026-02-20 |
| 28. DevCollab UI Debt Closure | v3.0 | 3/3 | Complete | 2026-02-20 |
| 29. Lenis Foundation | 3/3 | Complete    | 2026-02-21 | - |
| 30. GSAP ScrollTrigger Parallax | 1/2 | In Progress|  | - |
| 31. Magnetic Buttons | v3.1 | 0/2 | Not started | - |
| 32. Matrix Color Harmony | v3.1 | 0/4 | Not started | - |
| 33. Footer Redesign + Matrix Animation | v3.1 | 0/3 | Not started | - |
