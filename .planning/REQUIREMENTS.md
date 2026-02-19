# Requirements: Fernando Millan Portfolio — v2.5 Matrix Aesthetic

**Defined:** 2026-02-18
**Core Value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.

## v2.5 Requirements

Matrix-inspired visual overhaul of the portfolio website. Dark-first, Matrix green accents, subtle animations. Goal: recruiter feels "this person is a serious engineer" — memorable but not costume-y.

### Theme & Foundation

- [ ] **THEME-01**: Portfolio site renders in dark-first mode by default via `.matrix-theme` CSS class scoped to `(portfolio)` route group — TeamFlow/DevCollab dashboard routes visually unchanged
- [ ] **THEME-02**: Matrix green token system (`--matrix-green: #00FF41`, `--matrix-green-dim`, `--matrix-green-ghost`) added as additive CSS tokens without modifying existing Radix Colors cascade
- [ ] **THEME-03**: Animation packages (`motion` v12, `gsap`, `@gsap/react`, `lenis`) installed workspace-scoped to `apps/web` — not global, no TeamFlow/DevCollab bundle contamination
- [ ] **THEME-04**: All animations and canvas RAF loop stop completely when OS Reduce Motion is active (`prefers-reduced-motion: reduce`)

### Animations

- [ ] **ANIM-01**: Section headings and project cards animate in (fade + slide-up) when scrolled into view across all portfolio pages
- [ ] **ANIM-02**: Hero section shows Matrix digital rain on a canvas element behind content (opacity 0.04–0.07, 30fps cap, `aria-hidden`, SSR-safe via `next/dynamic ssr:false`)
- [ ] **ANIM-03**: Lighthouse CI performance score remains ≥ 90 on all five portfolio URLs after canvas is added

### Visual Effects

- [ ] **FX-01**: Hero name text scrambles from noise characters to readable text on page load — fires exactly once, never loops
- [ ] **FX-02**: Blinking terminal cursor (`_`) appears after the hero tagline via pure CSS `::after` animation
- [ ] **FX-03**: Project cards reveal an Evervault-style noise decryption effect on hover (uses installed `motion` v12, no new dependency)
- [ ] **FX-04**: Portfolio pages show a dark dot grid background with a green spotlight that follows the mouse cursor — built as a paired unit

### Micro-Interactions

- [ ] **UX-01**: Project cards display a Matrix green border glow on hover via CSS `box-shadow`

## Future Requirements

Deferred to v3.0 or later. Acknowledged but not in current roadmap.

### Animations (deferred)

- **ANIM-04**: Hero heading and tagline stagger in on load (entrance animations with `motion` v12 staggerChildren)
- **ANIM-05**: GSAP ScrollTrigger parallax on hero section
- **ANIM-06**: Lenis smooth scroll enabled globally on portfolio routes

### Interactions (deferred)

- **UX-02**: Magnetic buttons that pull toward cursor on hover (GSAP quickTo)
- **UX-03**: Stat/metric counters count up when scrolled into view (motion useInView)
- **UX-04**: Nav link sliding green underline animation on hover (CSS)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full-screen Matrix rain at readable opacity | Content becomes unreadable; vestibular accessibility violation; hiring managers see noise not portfolio work |
| Looping typewriter cycling role titles | Overused since 2019; hiring managers explicitly flagged as junior red flag |
| Loading screen or splash animation | Mandatory wait causes tab closes from recruiters reviewing 50+ portfolios/day |
| p5.js or three.js for rain effect | 9MB / 600KB — destroys Lighthouse score |
| Purple in any design element | User requirement, all milestones |
| Page transition AnimatePresence | Known Next.js App Router conflict (vercel/next.js #49279) — per-section entrance animations are the reliable substitute |
| 3D card tilt | Competes with Evervault card scramble; choose one card interaction not both |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| THEME-01 | Phase 22 | Pending |
| THEME-02 | Phase 22 | Pending |
| THEME-03 | Phase 22 | Pending |
| THEME-04 | Phase 22 | Pending |
| FX-02 | Phase 22 | Pending |
| UX-01 | Phase 22 | Pending |
| ANIM-02 | Phase 23 | Pending |
| ANIM-03 | Phase 23 | Pending |
| ANIM-01 | Phase 24 | Pending |
| FX-01 | Phase 25 | Pending |
| FX-03 | Phase 25 | Pending |
| FX-04 | Phase 25 | Pending |

**Coverage:**
- v2.5 requirements: 12 total
- Mapped to phases: 12 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-18 — traceability populated by roadmap creation*
