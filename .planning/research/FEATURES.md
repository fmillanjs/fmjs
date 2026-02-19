# Feature Research

**Domain:** Matrix-aesthetic portfolio redesign — senior full-stack developer portfolio
**Researched:** 2026-02-18
**Confidence:** HIGH (verified via Codrops case studies, official Motion/GSAP docs, hiring manager research, Aceternity UI docs)

---

## Context

This research covers NEW visual and animation features for an existing Next.js 15 portfolio.

**Existing stack:** Shadcn/Radix Colors/Tailwind v4, next-themes dark mode. No animation library installed yet.
**Existing portfolio components:** `HeroSection`, `ProjectCard`, `CaseStudySection`, `Nav`, `Footer`, `ContactForm`, `TechStack`.
**Current hero:** Static gradient, no animation. Cards: CSS hover shadow only.
**Goal:** "Serious engineer" impression — Matrix vibe without Halloween costume energy.
**Accent palette:** `#00FF41` green family on near-black background. No purple.

---

## Table Stakes

Features hiring managers and other developers expect from an impressive 2025-2026 portfolio.
Missing these makes the portfolio feel dated or unfinished.

| Feature | Why Expected | Complexity | Delight Score | Notes |
|---------|--------------|------------|---------------|-------|
| **Scroll-reveal animations** (fade + slide-up on section entrance) | Every impressive 2024-2025 portfolio does this. Absence reads as "forgot animations exist". | LOW | 5/10 | `motion` (framer-motion) `whileInView` + `initial={{ opacity: 0, y: 30 }}`. Wraps existing `<section>` elements. |
| **Dark background enforcement** | Matrix theme requires it. Current default is light. Radix dark tokens already exist. | LOW | 7/10 | Portfolio layout (`app/(portfolio)/layout.tsx`) forces `.dark` class. Overrides `--background` to `#0a0a0a`. Does not change app dashboard. |
| **Smooth page transitions** | Single-page feel. Hard cuts between portfolio pages feel like 2015. | LOW | 5/10 | `AnimatePresence` + layout-level fade. Required because Next.js App Router has no built-in page transitions. |
| **Card hover state with elevation + glow** | Cards that do not respond to hover feel static and broken. Industry norm since 2020. | LOW | 6/10 | Replace `hover:shadow-xl` on project cards with green box-shadow glow. Pure CSS. |
| **Green accent token system** | Random green usage looks accidental. Thematic coherence signals intentional design. | LOW | 6/10 | CSS vars: `--matrix-green: #00FF41`, `--matrix-green-dim: #00CC33`, `--matrix-green-ghost: rgba(0,255,65,0.08)`. |
| **Accessible reduced-motion fallback** | WCAG 2.1 SC 2.3.3. Vestibular disorders affect 70M+ users. Large-company hiring managers notice this. | LOW | 3/10 (table stakes) | `prefers-reduced-motion: reduce` media query disables all animations. Motion's `useReducedMotion()` hook handles this automatically. |

---

## Differentiators

Features that make the portfolio genuinely memorable. Ordered by delight-to-effort ratio (highest first).

### Hero Section

| Feature | Value Proposition | Complexity | Delight Score | Matrix Fit | Notes |
|---------|-------------------|------------|---------------|------------|-------|
| **Text scramble / decode-reveal on hero name** | The name assembles like a decryption sequence. Immediately signals "engineer" without saying it. Fires once, never loops. | MEDIUM | 9/10 | PERFECT | Use `use-scramble` React hook (tiny, zero heavy deps) or GSAP ScrambleTextPlugin. Green characters scramble before resolving to final text. Under 1 second total. |
| **Staggered word-by-word headline reveal** | Motion motif used by Codrops award-winning portfolios (Stefan Vitasovic 2025). Words assemble like code compiling. | MEDIUM | 8/10 | HIGH | Motion `staggerChildren` on words split from tagline. `overflow: hidden` + `translateY` reveal per word. |
| **Animated terminal cursor blink after tagline** | Signals terminal/engineer aesthetic without a full terminal component. Single `_` character. | LOW | 8/10 | HIGH | Pure CSS: `::after { content: '_'; animation: blink 1s step-end infinite; }`. Zero JS. |
| **Subtle scanline overlay on hero** | CRT texture that reads as "intentional design decision" to engineers and designers. Subliminal at correct opacity. | LOW | 7/10 | HIGH | CSS `repeating-linear-gradient` at opacity `0.03`. Invisible unless you look for it, but felt. No JS. |

### Card Interactions

| Feature | Value Proposition | Complexity | Delight Score | Matrix Fit | Notes |
|---------|-------------------|------------|---------------|------------|-------|
| **Evervault-style card: text scrambles on hover then resolves** | On hover, card title decrypts from noise to words. Tied directly to the Matrix/hacker identity. Most memorable card interaction in 2025. | MEDIUM | 9/10 | PERFECT | Aceternity UI "Evervault Card" pattern. Copy-paste component using `framer-motion`. Requires `motion` package (already needed for scroll-reveal). |
| **Border glow intensifies on hover** | Communicates interactivity with Matrix language: green glow = system active, system responding. | LOW | 8/10 | HIGH | CSS only: `transition: box-shadow 0.3s`. On hover: `box-shadow: 0 0 0 1px var(--matrix-green), 0 0 20px rgba(0,255,65,0.2)`. |
| **Tech stack badge glow on hover** | Small detail — badge emits faint green glow when focused. Consistent with accent system. | LOW | 6/10 | HIGH | CSS `text-shadow` and `box-shadow` on `.badge:hover`. Extends existing `Badge` Shadcn component via `className`. |
| **Subtle 3D tilt on card hover** | Depth and physicality. Separates from flat Tailwind defaults at a glance. | MEDIUM | 7/10 | MEDIUM | CSS `perspective` + JS `mousemove` tracking. Keep tilt small (max 8 degrees). Or Aceternity UI "3D Card Effect". |

### Scroll Animations

| Feature | Value Proposition | Complexity | Delight Score | Matrix Fit | Notes |
|---------|-------------------|------------|---------------|------------|-------|
| **Stat counter count-up animation on scroll-into-view** | Stats section currently shows static "30+", "Real-Time", "Production". Count-up on scroll-in adds dynamism at zero library cost. | LOW | 8/10 | MEDIUM | `useInView` from `motion` + `useEffect` counter with `setInterval`. No additional dependencies. |
| **Staggered card entrance (cards slide in sequentially)** | Projects section feels assembled, not dumped. Reinforces "built with care" message. | LOW | 7/10 | MEDIUM | Motion `staggerChildren: 0.1` on project grid container. Dead simple after `motion` is installed. |
| **Nav link underline grows left-to-right on hover** | Micro-interaction signaling precision. Green underline that extends from 0 to 100% width. | LOW | 6/10 | HIGH | CSS `::after` pseudoelement. `width: 0 → 100%`, `background: var(--matrix-green)`, `transition: width 0.2s`. |

### Matrix-Specific Effects

| Feature | Value Proposition | Complexity | Delight Score | Matrix Fit | Notes |
|---------|-------------------|------------|---------------|------------|-------|
| **Subtle Matrix rain in hero background (very low opacity)** | The signature effect — but ONLY at opacity 0.04-0.07 with CSS blur. Far background layer behind content. | HIGH | 8/10 | PERFECT | Canvas API + `requestAnimationFrame` in React `useEffect`. Cleanup: `cancelAnimationFrame` on unmount. Characters: Katakana + digits. Speed: slow, deliberate. Must check `prefers-reduced-motion` before starting. |
| **Green text-shadow glow on primary headings** | Neon feel at low intensity. `text-shadow: 0 0 10px rgba(0,255,65,0.4)`. Professional when barely visible. | LOW | 7/10 | HIGH | CSS only. Apply to hero `h1` and section `h2` headers. Intensity: barely perceptible at arm's length, obvious on close inspection. |
| **Terminal-line styling on skill/contact elements** | Specific sections styled with `border-left: 2px solid var(--matrix-green)` terminal prompt aesthetic. Reads as "engineer at home in a terminal". | LOW | 7/10 | HIGH | CSS on specific components. Monospace font (`font-mono`) for accent labels. Used sparingly. |
| **Horizontal scrolling marquee for tech stack** | Infinite-scroll ticker of technologies shows breadth without a wall of badges. | LOW | 6/10 | MEDIUM | Pure CSS `@keyframes scroll` on duplicated list. No JS. Replace static tech-stack badge cloud. |

### Background Effects

| Feature | Value Proposition | Complexity | Delight Score | Matrix Fit | Notes |
|---------|-------------------|------------|---------------|------------|-------|
| **Grid dot background with spotlight cursor reveal** | Dots are subtle at rest (opacity 0.05), revealed by cursor movement as a radial gradient spotlight. Creates discovery feeling. | MEDIUM | 8/10 | HIGH | CSS dot pattern (`radial-gradient`) + JS `mousemove` listener sets `--x, --y` CSS vars. `radial-gradient` centered on cursor reveals dots. These two features pair as a single unit. |
| **Animated CSS mesh gradient background** | Slow-moving dark green color cloud in the background suggests depth without JS. No-JS version of aurora. | LOW | 7/10 | HIGH | CSS `@keyframes` on `background-position` of layered radial gradients. Aceternity UI "Aurora Background" adapted to `#00FF41` green family + black. **No purple.** |

---

## Anti-Features

Explicitly NOT building these. Reasons grounded in evidence from hiring manager research and the "serious engineer, not costume" goal.

| Anti-Feature | Surface Appeal | Why It Fails | What to Build Instead |
|--------------|----------------|--------------|----------------------|
| **Full-screen Matrix rain at readable opacity** | "Maximally Matrix" | Screams Halloween costume. Hiring managers see visual noise, not portfolio work. Content becomes unreadable. Vestibular/accessibility problem at full opacity. | Opacity 0.04-0.07 with `filter: blur(1px)` as far background layer, OR skip rain entirely and use grid dot + spotlight |
| **Looping typewriter effect cycling role titles** ("Developer... Designer... Engineer...") | Shows range | Overused since 2019. Every junior portfolio does this. Wastes the 3-second first impression. Hiring managers interviewed explicitly called this out as a red flag. | Scramble-decode reveal that fires ONCE on mount, never loops. Static text after resolution. |
| **Glitch/corruption effects applied to multiple elements** | Edgy, techy | Disorienting. Signals instability. Multiple glitch elements active simultaneously creates chaos. One hiring manager review article: "never have multiple animations running at once — it turns your site into noise." | Use scramble reveal on hero name only (one instance). Everything else uses controlled animations. |
| **Multiple simultaneous background animations** | "Alive" feeling | Turns site into noise. The #1 complaint from hiring manager portfolio reviews. | One background effect maximum: either rain OR grid-dot+spotlight OR mesh gradient. Pick one. |
| **Heavy 3D WebGL scene (Three.js) as background** | Impressive tech demo | 5-15 second load on mid-range hardware. Mobile GPU issues. Shifts perceived purpose from "look at my products" to "look at my Three.js demo". Fernando's products are production SaaS — not a 3D demo. | CSS-based depth (perspective transforms, layered gradients). If 3D needed: isolated single component, lazy-loaded, disabled on reduced-motion. |
| **Full custom cursor replacement** | Personality | Disorienting. Breaks user muscle memory. Hiring managers reviewing 50+ portfolios per day find it annoying. | Spotlight cursor effect that augments without replacing OS cursor. OS cursor remains visible. |
| **Particle systems with physics** (tsparticles, etc.) | Atmospheric | CPU-heavy, especially on battery/mobile. Particles drift over content making text hard to scan. Looks like 2016 jQuery-era sites. | Static grid dot background with spotlight reveal: same visual interest, near-zero CPU. |
| **Loading screen / splash animation** | "Grand entrance" | Hiring managers have 50+ portfolios in queue. Mandatory 2-3 second wait before content = closed tab. Load time is already part of first impression. | Instant content load. Animate content IN (fade+slide-up) rather than gating with a preloader. |
| **Horizontal scroll sections for project navigation** | Modern/trendy | Breaks expected scroll behavior. Poor on trackpad. Very bad on mobile. Disorienting for fast-scanning reviewers who scroll quickly. | Standard vertical scroll. Horizontal marquee only for tertiary/decorative content (tech logos). |
| **Auto-playing audio** | "Immersive" | No. Never. | Never. |

---

## Feature Dependencies

```
Scroll-reveal animations
    └──requires──> motion package installed (framer-motion v12 / motion)
                       └──enables──> Staggered card entrance, AnimatePresence page transitions,
                                     Stat count-up (useInView), Evervault card effect

Text scramble on hero name
    └──requires──> use-scramble (React hook) OR GSAP ScrambleTextPlugin
                   use-scramble recommended: lighter, no license concerns, React-native
    └──conflicts with──> Looping typewriter (do not combine these)

Matrix rain canvas
    └──requires──> Canvas element + React useEffect + requestAnimationFrame cleanup pattern
    └──requires──> prefers-reduced-motion check before starting animation loop
    └──conflicts with──> Mesh gradient background (pick ONE background effect for hero)
    └──conflicts with──> Grid dot + spotlight (pick ONE background system)

Grid dot background + spotlight cursor
    └──these pair together as one feature unit
    └──requires──> CSS dot pattern + JS mousemove listener
    └──conflicts with──> Matrix rain canvas (one background effect per section)

Green accent CSS variable system
    └──required by──> ALL glow effects, border glows, text-shadows
    └──must be added to globals.css FIRST before other features

Dark portfolio background
    └──requires──> (portfolio) layout.tsx to force .dark class
    └──note──> Does NOT affect app dashboard routes — layout scope is (portfolio) only
    └──should be done BEFORE any other visual feature (establishes baseline)

Evervault card hover effect
    └──requires──> motion package (same dep as scroll-reveal — no extra install)
    └──enhances──> Existing ProjectCard component (extend, not replace)

Magnetic nav links
    └──requires──> GSAP (separate library, not motion)
    └──not worth GSAP install unless GSAP is added for other features too
```

### Dependency Notes

- **Install `motion` (framer-motion v12) once.** This unlocks: scroll-reveal, staggered entrance, AnimatePresence, useInView, Evervault card. One dependency, five features.
- **Matrix rain conflicts with background alternatives.** Hero can have ONE background treatment. If rain is chosen, do not also run mesh gradient or spotlight. Pick based on desired complexity level.
- **Dark mode scope is critical.** Force `.dark` on the `(portfolio)` layout only. The app dashboard at `/teams` etc. should remain system-responsive. A global `forceDark` would break the existing auth/dashboard UX.
- **Green CSS vars should be the first PR.** Every subsequent feature references them. Without them, individual features use hardcoded hex values that become impossible to maintain.
- **use-scramble vs GSAP:** `use-scramble` is purpose-built for React, ~3kb, zero configuration. GSAP ScrambleTextPlugin is more powerful but requires GSAP (larger library, commercial license for some plugins). Use `use-scramble` unless GSAP is already being added for other reasons (it is not needed for any other feature in this list).

---

## MVP Definition

### Phase 1 — Core Aesthetic (CSS-first, minimal JS)

Establishes the Matrix vibe. All CSS-first or trivial JS. No new library installs required except `motion`.

- [ ] **Dark background enforcement** — Portfolio layout forces `.dark`. `--background` overridden to `#0a0a0a`. Foundation of entire redesign.
- [ ] **Green accent CSS variable system** — `--matrix-green`, `--matrix-green-dim`, `--matrix-green-ghost` added to `globals.css`. Required by all subsequent features.
- [ ] **Card border glow on hover** — Replace `hover:shadow-xl` with green box-shadow. Pure CSS. Instant visual lift.
- [ ] **Terminal cursor blink in hero** — CSS `::after` on tagline. Zero JS. Establishes terminal aesthetic immediately.
- [ ] **Green text-shadow on hero h1** — CSS only. Subtle phosphor effect on name/title.
- [ ] **Scanline overlay on hero** — CSS `repeating-linear-gradient` at opacity 0.03. Subliminal CRT texture.
- [ ] **Install `motion` + scroll-reveal on all sections** — `whileInView` fade+slide-up. This single install enables all Phase 2 features.

### Phase 2 — Interactions (after Phase 1 is live)

Depends on `motion` installed in Phase 1. All features are low-risk additions.

- [ ] **Text scramble reveal on hero name** — Install `use-scramble`. Signature differentiator. Single fire on mount.
- [ ] **Evervault card scramble hover effect** — Copy Aceternity UI pattern. Uses already-installed `motion`.
- [ ] **Staggered card entrance** — `staggerChildren: 0.1` on project grid. 10 lines of code.
- [ ] **Grid dot background + spotlight cursor** — CSS dots + JS mousemove. Pair together as one feature.
- [ ] **Stat count-up animation** — `useInView` + counter logic. No new dependencies.
- [ ] **Smooth page transitions** — `AnimatePresence` from already-installed `motion`. Layout-level.
- [ ] **Staggered word reveal on tagline** — `staggerChildren` on split words. Same pattern as card stagger.

### Phase 3 — Polish (after Phase 2 validated, if desired)

High complexity or purely decorative. Validate core aesthetic first.

- [ ] **Matrix rain canvas** — Canvas API. High reward, high complexity. Only add if grid dot + spotlight feel insufficient.
- [ ] **Animated mesh gradient background** — Alternative to rain. Deferred to choose between this and rain.
- [ ] **Tech stack horizontal marquee** — Purely decorative. CSS only. Defer until core is stable.
- [ ] **3D card tilt on hover** — Competes with Evervault scramble for card identity. Choose one.
- [ ] **Terminal-line styling on contact/skills sections** — Polish pass. CSS only but requires component-level changes.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Dark background + green CSS vars | HIGH | LOW | P1 |
| Install motion + scroll-reveal | HIGH | LOW | P1 |
| Card border glow (CSS) | HIGH | LOW | P1 |
| Terminal cursor blink (CSS) | MEDIUM | LOW | P1 |
| Green text-shadow on headings (CSS) | MEDIUM | LOW | P1 |
| Scanline overlay (CSS) | MEDIUM | LOW | P1 |
| Text scramble on hero name | HIGH | MEDIUM | P1 |
| Evervault card hover | HIGH | MEDIUM | P2 |
| Staggered card entrance | HIGH | LOW | P2 |
| Grid dot background + spotlight cursor | HIGH | MEDIUM | P2 |
| Stat count-up animation | MEDIUM | LOW | P2 |
| Smooth page transitions | MEDIUM | LOW | P2 |
| Staggered word reveal on tagline | MEDIUM | LOW | P2 |
| Matrix rain canvas | HIGH | HIGH | P3 |
| Animated mesh gradient | MEDIUM | MEDIUM | P3 |
| Tech stack marquee | LOW | LOW | P3 |
| 3D card tilt | MEDIUM | LOW | P3 |
| Terminal-line section styling | MEDIUM | LOW | P3 |
| Magnetic nav links | LOW | HIGH | SKIP |
| Full custom cursor replacement | NEGATIVE | HIGH | SKIP |
| Particle systems (tsparticles) | LOW | HIGH | SKIP |
| Loading screen | NEGATIVE | MEDIUM | SKIP |
| Looping typewriter | NEGATIVE | LOW | SKIP |
| Auto-playing audio | NEGATIVE | LOW | SKIP |

---

## Matrix Effect Calibration Guide

This is the critical judgment call. Professional vs costume is determined by intensity, not presence.

**Professional (Subtle) — Do This:**
- Rain: opacity 0.04-0.07, `filter: blur(1px)`, behind all content layers
- Rain speed: slow — contemplative, not frantic
- Scramble text: fires ONCE on page load, resolves in under 1 second, never loops
- Green glow: barely visible at rest, more present on hover/focus
- Scanlines: opacity 0.03 — subliminal texture, not a visible filter
- Grid dots: opacity 0.05-0.06 — structural grid, not decorative noise
- Rule: ONE background effect maximum per section. ONE motion motif per component.

**Costume (Avoid) — Do Not Do This:**
- Rain covering full viewport at high opacity with Katakana at 24px
- Multiple glitch effects running simultaneously on different elements
- Green on green on green — no visual hierarchy, no breathing room
- Text that scrambles or glitches repeatedly or on every hover
- CRT flicker that actually flickers at human-perceptible speed
- Terminal gate: homepage that requires typing a command to enter

**The test:** Screenshot the hero section. If the immediate reaction is "whoa, Matrix movie" rather than "polished dark-mode portfolio with a distinctive, technical aesthetic" — dial back opacity and remove simultaneous effects.

---

## Design System Integration Notes

The existing `globals.css` uses Radix Colors semantic tokens. Matrix-specific tokens extend it without conflicting.

```css
/* Add to :root in globals.css — portfolio aesthetic tokens */
--matrix-green: #00FF41;
--matrix-green-dim: #00CC33;
--matrix-green-ghost: rgba(0, 255, 65, 0.08);
--matrix-green-glow: rgba(0, 255, 65, 0.20);
--matrix-bg: #0a0a0a;
--matrix-surface: #111111;
```

**Do NOT replace `--primary` system-wide.** The existing `--primary: var(--blue-11)` is used throughout the app dashboard (TeamFlow, DevCollab). Portfolio-specific components use `--matrix-green` directly. This scopes the aesthetic change without breaking existing UI.

**Do NOT replace `--success` with matrix green.** The existing `--success: var(--green-9)` is Radix `#30a46c` (desaturated, WCAG-compliant for form validation). Matrix `#00FF41` is a distinct phosphor green. Both coexist: `--success` for semantic UI states, `--matrix-green` for aesthetic accents.

**Existing `Badge` component** can be extended via `className` props for glow — no need to modify the base component. The Shadcn `class-variance-authority` pattern supports this cleanly.

---

## Sources

- [Stefan Vitasovic Portfolio Case Study — Codrops 2025](https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/)
- [Stas Bondar Portfolio — GSAP, Three.js, next-level animations — Codrops 2025](https://tympanus.net/codrops/2025/03/25/stas-bondar-25-the-code-techniques-behind-a-next-level-portfolio/)
- [How Recruiters & Hiring Managers Actually Look at Your Portfolio](https://blog.opendoorscareers.com/p/how-recruiters-and-hiring-managers-actually-look-at-your-portfolio)
- [Aceternity UI Components — Cards, Backgrounds, Effects](https://ui.aceternity.com/components)
- [GSAP ScrollTrigger Complete Guide 2025 — GSAPify](https://gsapify.com/gsap-scrolltrigger)
- [Motion (Framer Motion) Scroll Animations — Official Docs](https://motion.dev/docs/react-scroll-animations)
- [Motion useInView — Official Docs](https://motion.dev/docs/react-use-in-view)
- [CSS Scroll-Driven Animations Introduction — Smashing Magazine Dec 2024](https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/)
- [Aurora Background — Aceternity UI](https://ui.aceternity.com/components/aurora-background)
- [use-scramble — React hook for text scramble](https://www.use-scramble.dev/)
- [GSAP ScrambleTextPlugin — Official Docs](https://gsap.com/docs/v3/Plugins/ScrambleTextPlugin/)
- [CSS Glow / Neon Text Effects — CSS-Tricks](https://css-tricks.com/how-to-create-neon-text-with-css/)
- [prefers-reduced-motion — WCAG 2.1 SC 2.3.3 Understanding](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- [Design Accessible Animation — Pope Tech Blog 2025](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)
- [19 Best Portfolio Design Trends 2026 — Colorlib](https://colorlib.com/wp/portfolio-design-trends/)
- [React Matrix Digital Rain — react-mdr GitHub](https://github.com/FullStackWithLawrence/react-mdr)
- [Cypherpunk Portfolio with Next.js 16 and Tailwind v4 — Medium Dec 2025](https://medium.com/@crypticsoul.ak/declassified-the-blueprint-for-a-cypherpunk-portfolio-with-next-js-16-tailwind-v4-829ae8eaa222)
- [GSAP in Practice: Avoid the Pitfalls — Marmelab 2024](https://marmelab.com/blog/2024/05/30/gsap-in-practice-avoid-the-pitfalls.html)
- [Building a Portfolio That Gets Hired: 2025 Developer Guide — Hakia](https://www.hakia.com/skills/building-portfolio/)

---
*Feature research for: Matrix-aesthetic portfolio redesign — Fernando Millan senior full-stack portfolio*
*Researched: 2026-02-18*
