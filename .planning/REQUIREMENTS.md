# Requirements: Fernando Millan Portfolio

**Defined:** 2026-02-20
**Milestone:** v3.1 — Portfolio Polish & Matrix Cohesion
**Core Value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.

## v3.1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Smooth Scroll (SCROLL)

- [x] **SCROLL-01**: User experiences inertia-based smooth scroll across all portfolio pages (Lenis, scoped to portfolio layout only — TeamFlow dashboard unaffected)
- [x] **SCROLL-02**: User navigating between portfolio pages always starts at the top of the new page (Lenis route-change scroll reset)
- [x] **SCROLL-03**: User with `prefers-reduced-motion` gets native browser scroll with no Lenis overhead (reduced-motion bypass)
- [x] **SCROLL-04**: User opening the CommandPalette (Cmd+K) cannot scroll the background page while the modal is open (lenis.stop() on open, lenis.start() on close)

### Parallax (PRLLX)

- [x] **PRLLX-01**: User scrolling the hero section sees the hero text drift upward at a slower rate than page scroll (GSAP ScrollTrigger, yPercent: -15, scrub: 1)
- [x] **PRLLX-02**: User scrolling past section separators sees decorative lines move at an independent depth (subtle scale/y transform, no layout shift)
- [x] **PRLLX-03**: Lighthouse CI performance score remains ≥ 0.90 on all five portfolio URLs after parallax is added (no pin: true, transform-only properties)

### Magnetic Buttons (MAGN)

- [x] **MAGN-01**: User hovering the hero CTAs ("View Projects", "View GitHub") sees the button attract toward the cursor with spring physics (motion/react useSpring)
- [x] **MAGN-02**: User hovering the contact CTA ("Get In Touch") sees the same magnetic spring-physics attraction
- [x] **MAGN-03**: User on a touch device or with reduced-motion preference sees a plain button with no magnetic effect (any-hover guard + useReducedMotion)

### Matrix Color Harmony (COLOR)

- [ ] **COLOR-01**: Four new CSS tokens are defined in `:root` scoped to `.matrix-theme` (`--matrix-green-subtle`, `--matrix-green-border`, `--matrix-scan-line`, `--matrix-terminal`)
- [ ] **COLOR-02**: About page replaces blue `--primary` gradient and value card borders with Matrix green tokens (no blue mismatches visible)
- [ ] **COLOR-03**: Contact page heading accents and CTA styling use Matrix green instead of blue `--primary`
- [ ] **COLOR-04**: Case study pages (TeamFlow, DevCollab) display metric numbers in Matrix green monospace, eliminating blue accent colors
- [ ] **COLOR-05**: Tech-stack badge borders and highlight colors use Matrix green tokens instead of blue Radix primary
- [ ] **COLOR-06**: Footer link hover states use Matrix green (replacing current blue hover)
- [ ] **COLOR-07**: All portfolio section headings have a terminal-style label prefix (`> SECTION_NAME`) above each `<h2>` for visual coherence with the terminal theme
- [ ] **COLOR-08**: Playwright visual regression baselines are updated for all affected routes and all 18 snapshots pass (maxDiffPixelRatio 0.02)

### Footer Redesign (FOOTER)

- [ ] **FOOTER-01**: Footer has `#0a0a0a` background with a `--matrix-green-border` top border, replacing the current `bg-muted` styling
- [ ] **FOOTER-02**: Social links render as terminal-prompt style (`> github`, `> linkedin`, `> email`) in monospace Matrix green
- [ ] **FOOTER-03**: Footer includes a `> EOF` tagline as a narrative close
- [ ] **FOOTER-04**: Footer has a CRT scanline texture via CSS `::before` pseudo-element (zero JS, no animation library)
- [ ] **FOOTER-05**: "Fernando Millan" name or footer signature has a single-fire CSS glitch animation when scrolled into view (IntersectionObserver, fires once, `animation-iteration-count: 1`)
- [ ] **FOOTER-06**: All footer links are keyboard-accessible with visible focus rings
- [ ] **FOOTER-07**: Playwright visual regression baselines updated for footer changes on all portfolio routes; all 18 snapshots pass

## Future Requirements

### v3.2 (Deferred)

- **ANIM-04**: Animated stat counters — numbers count up on scroll-into-view (deferred: keep scope focused)
- **PRLLX-04**: Extend parallax to additional portfolio sections beyond hero (defer: validate Lighthouse impact of Phase 2 first, then expand)
- **MAGN-04**: Magnetic button glow intensification on cursor proximity (additive polish on top of basic magnetic)
- **MAGN-05**: Inner-content secondary parallax (button label moves at 60% of button movement)
- **ANIM-05**: Lenis momentum-based section snapping (complex; validate feel first)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Second MatrixRainCanvas in footer | Redundant GPU load + visually reads as copy-paste of hero; CRT scanlines cover the texture need at zero JS cost |
| Magnetic effect on nav links | Nav already has Awwwards-quality layoutId spring underline; magnetic nav links are a known gimmick anti-pattern |
| Magnetic effect on all buttons | 2–3 CTAs max — more is gimmicky; form submits and dashboard buttons explicitly excluded |
| ScrollTrigger pin: true | Causes CLS regression that fails Lighthouse CI ≥ 0.90; translateY parallax achieves the same depth effect |
| Looping footer glitch animation | Accessibility violation for photosensitive users; single-fire is the correct pattern |
| Purple in any design element | Global user requirement — all milestones |
| Lenis on dashboard routes | TeamFlow has TanStack Table virtual scroll + Socket.io; Lenis on root layout would break dashboard scroll behavior |
| gsap.to() in mousemove handlers | Creates new tween per pixel → TBT spike → Lighthouse regression; motion/react spring used instead |
| Scrolling katakana ticker in footer | Low information density relative to effort; CSS scanlines cover texture need |
| Stat counters in v3.1 | Explicitly deferred by user — keep scope focused on 5 core features |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCROLL-01 | Phase 29 | Complete |
| SCROLL-02 | Phase 29 | Complete |
| SCROLL-03 | Phase 29 | Complete |
| SCROLL-04 | Phase 29 | Complete |
| PRLLX-01 | Phase 30 | Complete |
| PRLLX-02 | Phase 30 | Complete |
| PRLLX-03 | Phase 30 | Complete |
| MAGN-01 | Phase 31 | Complete |
| MAGN-02 | Phase 31 | Complete |
| MAGN-03 | Phase 31 | Complete |
| COLOR-01 | Phase 32 | Pending |
| COLOR-02 | Phase 32 | Pending |
| COLOR-03 | Phase 32 | Pending |
| COLOR-04 | Phase 32 | Pending |
| COLOR-05 | Phase 32 | Pending |
| COLOR-06 | Phase 32 | Pending |
| COLOR-07 | Phase 32 | Pending |
| COLOR-08 | Phase 32 | Pending |
| FOOTER-01 | Phase 33 | Pending |
| FOOTER-02 | Phase 33 | Pending |
| FOOTER-03 | Phase 33 | Pending |
| FOOTER-04 | Phase 33 | Pending |
| FOOTER-05 | Phase 33 | Pending |
| FOOTER-06 | Phase 33 | Pending |
| FOOTER-07 | Phase 33 | Pending |

**Coverage:**
- v3.1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-02-20*
*Last updated: 2026-02-20 — traceability confirmed after roadmap creation*
