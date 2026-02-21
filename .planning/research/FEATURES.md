# Feature Research

**Domain:** Portfolio visual polish — Awwwards-quality motion & Matrix aesthetic cohesion (v3.1)
**Researched:** 2026-02-20
**Confidence:** HIGH (Lenis/GSAP verified via official GitHub README + gsap.com docs; magnetic buttons verified via Olivier Larose tutorial + GSAP quickTo docs; footer patterns derived from codebase inspection + CSS technique research; color harmony derived from direct codebase inspection)

---

## Context: What Already Exists

Before categorizing new features, the current state matters for dependency analysis. Every new feature sits on top of this foundation.

| Already Shipped | Implementation | Relevant Notes |
|----------------|----------------|----------------|
| MatrixRainCanvas | RAF loop, 30fps, #00FF41, opacity 0.05 | Hero section only. Canvas element, SSR-safe via `next/dynamic(ssr:false)` |
| Scroll-reveal (AnimateIn) | `motion/react`, opacity 0 → 1, y 24 → 0, `whileInView` | `once: true`. Used on most page sections |
| StaggerContainer/Item | `motion/react` variants, 0.15s stagger | Card grids |
| Text scramble | Hand-rolled `useTextScramble` RAF hook | Hero h1 only, fires once |
| Blinking cursor | CSS `::after` + `cursor-blink` keyframe | Hero tagline paragraph |
| Evervault noise overlay | `motion/react`, radial-gradient mask, katakana chars | Project card hover only |
| Dot-grid + mouse spotlight | CSS custom props `--cursor-x/y`, `any-hover` guard | Fixed, `pointer-events-none` |
| Card glow | CSS `box-shadow` via `var(--matrix-green)` | `.card-glow-hover` class on project card links |
| Nav active indicator | `motion/react` `layoutId` spring | Nav underline slides between routes |
| Matrix CSS tokens | `--matrix-green: #00FF41`, `--matrix-green-dim: #00CC33`, `--matrix-green-ghost: #00FF4120` | In `:root`, consumed via `var()` |
| `.matrix-theme` scope | Background `#0a0a0a`, scoped to `(portfolio)` layout div | Dashboard routes unaffected |
| Reduced-motion gate | CSS global rule + RAF check + `MotionConfig reducedMotion="user"` | Three-layer — comprehensive |
| Libraries installed | `lenis@1.3.17`, `gsap@3.14.2`, `@gsap/react@2.1.2`, `motion@12.34.2` | All in `apps/web/package.json`. None wired yet. |

**Critical gap:** The installed libraries (`lenis`, `gsap`, `@gsap/react`) are wired to nothing. They exist in `node_modules` but no portfolio component imports them.

---

## Feature Landscape

---

### Feature 1: Lenis Smooth Scroll

**What it does:** Replaces native browser scroll momentum with a lerp-interpolated virtual scroll. Content lags slightly behind the scroll position then catches up — like content has physical weight. Every scroll interaction (wheel, keyboard, arrow keys) passes through Lenis's interpolation.

**Expected behavior:**
- Scroll feels buttery across all portfolio pages simultaneously
- Anchor links still work (Lenis 1.3+ has built-in `anchors` support)
- Page-top reset on Next.js SPA route navigation
- Reduced-motion: Lenis must not initialize when `prefers-reduced-motion: reduce` is active
- Dashboard routes (TeamFlow RBAC, DevCollab) are unaffected — scoped to portfolio layout only

### Table Stakes (Lenis)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Smooth wheel scroll across all portfolio pages | Awwwards-quality portfolios universally use smooth scroll; native momentum feels low-budget by comparison | LOW | `ReactLenis root` prop handles this; 20-line wrapper component |
| Anchor link support | Navigation must still work; broken anchors fail accessibility + UX | LOW | Lenis 1.3+ `anchors: true` option |
| Reduced-motion bypass | Must extend existing three-layer gate to JS scroll layer | LOW | Conditional render: do not render ReactLenis if `window.matchMedia('(prefers-reduced-motion: reduce)').matches` |
| Route-change scroll-to-top | SPA navigation without scroll reset leaves user mid-page on new route | LOW-MEDIUM | `usePathname` effect → `lenis.scrollTo(0, { immediate: true })` on path change |
| No dashboard bleed | dnd-kit (drag-and-drop in TeamFlow) conflicts with virtual scroll; dashboard must be excluded | LOW | Wrap `(portfolio)/layout.tsx` only — NOT `app/layout.tsx` |

### Differentiators (Lenis)

| Feature | Value Proposition | Complexity | Notes |
|---------|------------------|------------|-------|
| `lerp: 0.08` tuning (slower than default 0.1) | Slightly dreamier feel fits the Matrix "weight of code" narrative better than snappy default | LOW | One config value; test against 0.08/0.10/0.12 |
| GSAP ticker sync | Prerequisite for frame-accurate ScrollTrigger parallax; without it, parallax fires at wrong depths | MEDIUM | Required if ScrollTrigger is used simultaneously |

### Anti-Features (Lenis)

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| `smoothTouch: true` | "Works on mobile too" | Mobile browsers implement their own momentum; fighting it causes jank and breaks iOS scrolling accessibility | Default `smoothTouch: false` |
| `lerp: 0.03` (very slow) | "Ultra smooth" | At lerp 0.03, scroll lags so far behind input that users think the site is broken; vestibular motion issues on sensitive users | Stay in 0.08–0.12 range |
| Applying to root `app/layout.tsx` | Covers all routes | TeamFlow dnd-kit conflicts with virtual scroll position; DevCollab dashboard breaks | Scope to `(portfolio)/layout.tsx` only |
| `@studio-freight/react-lenis` import | Old tutorials reference this | Package is deprecated; correct import for lenis@1.3.17 is `import { ReactLenis } from 'lenis/react'` | `lenis/react` subpath |

**Verified import pattern for lenis@1.3.17 (from darkroomengineering/lenis GitHub README):**

```typescript
// SmoothScroll.tsx — 'use client'
import { ReactLenis } from 'lenis/react'

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothTouch: false }}>
      {children}
    </ReactLenis>
  )
}
```

**GSAP ScrollTrigger sync pattern (from lenis/react README):**

```typescript
// autoRaf: false hands tick control to GSAP
<ReactLenis root options={{ lerp: 0.1, autoRaf: false }}>

// In useGSAP hook alongside ScrollTrigger setup:
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => { lenis.raf(time * 1000) })
gsap.ticker.lagSmoothing(0)
```

---

### Feature 2: GSAP ScrollTrigger Parallax

**What it does:** As the user scrolls, different layers of content move at different speeds, creating depth. Background elements move slower than foreground. Applied to hero decorative layers, section separators, and optionally case study stats.

**What "parallax depth" means concretely for this portfolio:**

The hero already has MatrixRainCanvas as one background layer. Parallax targets:
1. **Hero text block** — moves at 70% of scroll speed as user scrolls past (yPercent: -15 scrubbed to scroll)
2. **Section heading decorative elements** — subtle independent movement (y: -20 on scroll through section)
3. **Decorative Matrix glyphs positioned in sections** — standalone characters that drift

### Table Stakes (Parallax)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Scroll-scrubbed movement (`scrub: 1`), not triggered | Parallax that plays once on enter then stops looks like a broken entrance animation | LOW | `scrub: 1` creates smooth catch-up; `scrub: true` is abrupt |
| `ease: 'none'` on all parallax tweens | Any easing breaks the scroll-tied illusion — the animation should feel physically tied to the scrollbar | LOW | Mandatory; wrong easing is the #1 reported mistake |
| GPU-only properties (transform, opacity) | Animating box-shadow, width, padding causes layout recalculations every frame → jank | LOW | Only `x`, `y`, `xPercent`, `yPercent`, `scale`, `opacity` |
| `useGSAP` cleanup from `@gsap/react` | Without cleanup, ScrollTrigger accumulates on re-render and navigation → memory leak | MEDIUM | `useGSAP` is a drop-in for `useEffect` with automatic `gsap.context()` cleanup |
| Lenis sync (if both active) | Without sync, ScrollTrigger reads native scroll (0) while Lenis interpolates a different position | MEDIUM | Required when Lenis is wired |

### Differentiators (Parallax)

| Feature | Value Proposition | Complexity | Notes |
|---------|------------------|------------|-------|
| Hero text subtle upward drift as user scrolls away | Makes the hero feel like a "departing" intro rather than a static banner | LOW | `yPercent: -15, scrub: 1` on hero text container |
| Section divider green line moves at 80% scroll speed | Thin horizontal `var(--matrix-green)` lines that have independent depth — adds Z-axis perception without heavy computation | LOW | One `gsap.to` per divider |
| Case study metrics drift (stat numbers) | Numbers like "27,942 LOC" and "0 axe violations" moving at slightly different rates sells depth on case study pages | MEDIUM | Per-stat tween; test performance |

### Anti-Features (Parallax)

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| `background-attachment: fixed` CSS parallax | Classic look, zero JS | Triggers full-page repaints on every scroll frame; destroys Lighthouse Performance score; broken on iOS entirely | Transform-based parallax on `position: absolute` elements |
| Parallax on body text (the words themselves) | "Immersive" | Text moving relative to its container breaks reading comprehension; visitors leave | Limit to decorative/background elements |
| `y` movement >40% viewport height | "Dramatic depth" | Causes visible gaps at section edges; looks broken at non-standard viewport heights | Stay within `yPercent: -20` to `+20` range |
| >8-10 simultaneous ScrollTriggers on one page | "Rich experience" | Each active ScrollTrigger adds scroll listener overhead; compound cost causes frame drops | Use `ScrollTrigger.batch()` for repeated element types |
| Parallax active on touch/mobile | Consistent experience | Touch scroll has native momentum; adding GSAP parallax causes visual stutter and motion sickness on mobile | Guard with `@media (pointer: coarse)` or `prefers-reduced-motion` |

**Verified cleanup pattern from @gsap/react docs:**

```typescript
'use client'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

export function ParallaxHeroText() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.to(ref.current, {
      yPercent: -15,
      ease: 'none',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      }
    })
  }, { scope: ref }) // scope enables auto-cleanup on unmount

  return <div ref={ref}>...</div>
}
```

---

### Feature 3: Magnetic Buttons

**What it does:** When the cursor enters a button's orbit (50–80px radius), the button drifts toward the cursor. On cursor leave, it snaps back with elastic easing. Makes primary CTAs feel alive and premium.

**Premium vs gimmicky — the distinction is specific:**

Premium:
- Applied to 2–3 key CTAs only ("View Projects", "Get In Touch", "Download Resume")
- Magnetic pull capped at 30–40% of button width displacement
- Elastic snap-back that settles in ~1 second (`elastic.out(1, 0.3)` — one oscillation)
- Inner content (text, icon) moves at 60% of outer container movement — layered "mass" illusion
- Only on hover-capable devices (`any-hover: hover`)
- Disabled on reduced-motion

Gimmicky:
- Applied to every button including nav links and form submits
- Excessive pull (button moves >50% its width, escapes click target)
- Slow settle (lerp-based return that visually never stops)
- Applied on mobile (no cursor; event listeners fire on tap-start then immediately leave, causing jitter)
- No inner parallax (single rigid block moving — looks mechanical)

### Table Stakes (Magnetic Buttons)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Elastic snap-back to exact origin | Without snap, button stays displaced — layout breaks, click target shifts | LOW | `gsap.quickTo(el, 'x', { duration: 1, ease: 'elastic.out(1, 0.3)' })` |
| `any-hover: hover` device guard | Touch has no cursor; event listeners waste CPU and cause tap-jitter | LOW | Consistent with existing spotlight and dot-grid guard pattern |
| Reduced-motion bypass | Must respect OS preference | LOW | Check `useReducedMotion()` from `motion/react` before attaching handlers |
| Scoped to primary CTAs only | Table stakes of premium execution | LOW | Hero CTAs (View Projects, View GitHub), contact CTA (Get In Touch) |
| No layout shift | Button must return precisely to origin — no accumulated drift | LOW | `gsap.quickTo(el, 'x', 0)` + `gsap.quickTo(el, 'y', 0)` on leave |

### Differentiators (Magnetic Buttons)

| Feature | Value Proposition | Complexity | Notes |
|---------|------------------|------------|-------|
| Inner content parallax (text at 60% of container movement) | Sells the "mass" illusion — button has weight, text has slightly less | MEDIUM | Two nested refs: outer at `strength * 1.0`, inner at `strength * 0.6` |
| Matrix green glow intensifies as cursor approaches | As cursor enters orbit, `box-shadow` in `var(--matrix-green)` fades in — ties to existing card-glow pattern | MEDIUM | Distance-based opacity on hover; combine with existing CSS glow |
| Activation radius beyond button bounds | Magnetic field extends 80px beyond the button — user "feels" pull before reaching the button | LOW | Track mousemove on parent container, calculate distance to button center |

### Anti-Features (Magnetic Buttons)

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Applied to nav links | "Interactive nav" | Nav links are small and close together; magnetic pull causes adjacent links to collide visually | Keep nav with existing CSS `scaleX` underline — it is already Awwwards-level |
| Applied to form submit button | "Consistent" | Users click submit with intent; magnetic offset makes the button appear to dodge them; anxiety-inducing | Static hover glow on submit button |
| Applied on mobile | "Universal" | Touch devices have no cursor; tap fires enter-then-immediate-leave, causing single-frame jitter | Guard with `any-hover` media query |
| `gsap.to()` inside `mousemove` handler | "Simpler" | `gsap.to` allocates a new tween object on every mouse event — 60+ per second; causes GC pressure and frame drops | `gsap.quickTo()` creates a cached setter called directly without tween allocation |
| Displacement >50% of button width | "Dramatic" | Button escapes its click target area — user aims at the displaced visual but clicks empty space | Cap at 30–40% (`strength = 0.35` in `(clientX - cx) * strength` formula) |

**Verified implementation pattern (Olivier Larose + GSAP quickTo docs):**

```typescript
'use client'
import { useRef, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useReducedMotion } from 'motion/react'

const MAGNETIC_STRENGTH = 0.35
const ACTIVATION_RADIUS = 80 // px beyond button bounds

type QuickToFunc = ReturnType<typeof gsap.quickTo>

export function MagneticButton({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const xTo = useRef<QuickToFunc | null>(null)
  const yTo = useRef<QuickToFunc | null>(null)
  const prefersReducedMotion = useReducedMotion()

  useGSAP(() => {
    if (prefersReducedMotion) return
    // any-hover guard — only initialize on pointer devices
    if (!window.matchMedia('(any-hover: hover)').matches) return

    xTo.current = gsap.quickTo(outerRef.current, 'x', {
      duration: 1, ease: 'elastic.out(1, 0.3)'
    })
    yTo.current = gsap.quickTo(outerRef.current, 'y', {
      duration: 1, ease: 'elastic.out(1, 0.3)'
    })
  }, { scope: outerRef })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!outerRef.current || !xTo.current || !yTo.current) return
    const rect = outerRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    xTo.current((e.clientX - cx) * MAGNETIC_STRENGTH)
    yTo.current((e.clientY - cy) * MAGNETIC_STRENGTH)
  }, [])

  const handleMouseLeave = useCallback(() => {
    xTo.current?.(0)
    yTo.current?.(0)
  }, [])

  return (
    <div
      ref={outerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'inline-block' }}
    >
      {children}
    </div>
  )
}
```

---

### Feature 4: Matrix Color Harmony

**What it does:** Apply `var(--matrix-green)`, `var(--matrix-green-dim)`, and `var(--matrix-green-ghost)` consistently across portfolio sections that currently use generic Radix semantic tokens (`--primary` = blue) or neutral styling that breaks the dark-terminal aesthetic.

**Current violations (found via direct codebase inspection):**

| Location | Current Issue | Token to Use Instead |
|----------|--------------|----------------------|
| `about/page.tsx` CTA section | `from-primary/10` = blue gradient background | `var(--matrix-green-ghost)` background or border |
| `about/page.tsx` value cards | `hover:border-primary/50` = blue border hover | `hover:border-[var(--matrix-green)]/50` |
| `contact/page.tsx` headings | Plain `text-foreground` — no Matrix accent | Section `h2` gets terminal prefix or green accent |
| `footer.tsx` | `bg-muted`, `hover:text-primary` (blue), generic typography | `bg-[#0a0a0a]`, `hover:text-[var(--matrix-green)]`, font-mono on copyright |
| `project-card.tsx` | No EvervaultCard wrapping — Evervault is only used in project listing page wrapper, not in the card component itself | Card hover: card-glow-hover class (already present) but needs Matrix badge styling |
| Case study pages | Unknown — inspect `projects/teamflow/page.tsx` and `projects/devcollab/page.tsx` | Metric numbers as `font-mono text-[var(--matrix-green)]` |
| `tech-stack.tsx` | Unknown — inspect | Tech category labels as terminal-style `>` prompts |
| Section `h2` across all portfolio pages | Plain bold foreground — no Matrix accent | Left border `border-l-2 border-[var(--matrix-green)]` or dim green label above |

### Table Stakes (Color Harmony)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| All hover borders matrix-green (not blue) | Blue in a Matrix portfolio breaks immersion — recruiter sees the mismatch | LOW | Replace `hover:border-primary/50` with `hover:border-[var(--matrix-green)]/50` |
| CTA section background matrix-green-ghost not primary/10 | Blue glow on dark background reads as an unrelated accent | LOW | CSS change in `about/page.tsx` |
| Footer links hover state matrix-green | Currently `hover:text-primary` (blue) — inconsistent with nav hover | LOW | Replace in `footer.tsx` |
| Section `h2` headings have Matrix accent | Without accent, sections feel like a blank dark page | LOW | Left border + small terminal label above or `text-[var(--matrix-green)]` for first word |
| Code/metric text in case studies uses `font-mono` + matrix-green | Numbers like "27,942 LOC" in monospace green read as terminal output — exactly right for engineering recruiters | LOW | className additions in case study pages |

### Differentiators (Color Harmony)

| Feature | Value Proposition | Complexity | Notes |
|---------|------------------|------------|-------|
| Terminal-style section labels (`> SECTION_NAME`) | Small `> SECTION_NAME` prefixes in `font-mono text-[var(--matrix-green-dim)]` above each `h2` — reads like a directory path or terminal prompt | LOW | Very high impact; zero technical risk |
| Subtle scanline texture on CTA sections | CSS `repeating-linear-gradient` at 0.03 opacity on CTA background = CRT monitor feel | LOW | Pure CSS `::before` pseudo-element; zero JS |
| Tech skill chips with matrix-green border | Badge outlines in `var(--matrix-green-dim)` instead of Radix secondary | LOW | Custom variant in `tech-stack.tsx` |

### Anti-Features (Color Harmony)

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Full-opacity `#00FF41` backgrounds | "More Matrix" | At full opacity on dark background, green is eye-searingly bright; #00FF41 on #0a0a0a fails WCAG for text readability | `var(--matrix-green-ghost)` = `#00FF4120` (8% alpha) for backgrounds |
| Coloring all body text matrix-green | "Consistent terminal feel" | Green body text at full opacity fails WCAG AA contrast requirements that were carefully validated in v1.1 | Green only on: accents, headings markers, interactive elements, decorative |
| Modifying `:root` tokens | "Apply globally" | Dashboard routes use the same `:root` token system; changing `--primary` in `:root` breaks the validated WCAG AA Radix color system across TeamFlow and DevCollab UI | Scope ALL overrides to `.matrix-theme {}` — this is the established v2.5 pattern |
| Orange/amber accent as secondary Matrix color | "Cyberpunk feel" | Orange + green clashes; kills the monochrome terminal aesthetic | White (`#e8e8e8`) for secondary emphasis; dim green for tertiary; black/dark for backgrounds |

---

### Feature 5: Footer Redesign with Matrix Animation

**What it does:** Replace the current plain footer (99 lines, `bg-muted`, standard typography, no theming) with a Matrix-themed footer that signals "end of transmission" — a visual narrative close to the portfolio.

**Why the footer animation must be DIFFERENT from the hero canvas:**

The hero `MatrixRainCanvas` uses:
- `<canvas>` element with a 30fps RAF loop
- Full-column falling rain top-to-bottom across the full section width
- 60+ columns, all characters falling continuously
- Opacity 0.05 (full-viewport wash)

A second identical canvas in the footer is:
1. Visually repetitive — reads as laziness, not craft
2. Performance-costly — two concurrent canvas RAF loops on the same page
3. Narratively wrong — the footer should feel like a closing, not a repeat of the opening

**Evaluated footer animation options (ranked by fit + distinction from hero):**

| Option | Description | Distinctness from Hero | Performance | Complexity |
|--------|-------------|----------------------|-------------|------------|
| A: CSS drain columns | 4–5 absolutely-positioned `<span>` elements with CSS `@keyframes`; characters appear at top and fade out before reaching bottom — "draining" rather than falling | HIGH — sparse, fading, narrative | Zero JS | LOW |
| B: CRT scanline texture | CSS `repeating-linear-gradient` on `::before` pseudo-element; overlays horizontal lines at ~0.04 opacity | HIGH — texture not animation; pure CSS | Zero JS | VERY LOW |
| C: Glitch text on name | CSS `clip-path` + offset `@keyframes` on "Fernando Millan" signature; fires once on scroll-into-view via IntersectionObserver; not a loop | HIGH — CSS layer-split vs hero's character-replacement | Minimal JS (IO only) | MEDIUM |
| D: Terminal typewriter reveal | Copyright or tagline types out on scroll-into-view; left-to-right character reveal | MEDIUM — different from hero scramble (scramble goes wrong-chars-first; this is straight reveal) | Minimal JS | LOW |
| E: Scrolling katakana ticker | Single horizontal `animation: marquee` CSS scroll of katakana + digits across top of footer | MEDIUM — horizontal vs vertical | Zero JS | LOW |

**Recommendation: Options B + C + structural redesign**

- **Option B (CRT scanlines)** as background texture — zero cost, zero JS, immediate visual upgrade
- **Option C (glitch text)** on "Fernando Millan" footer signature — fires once on scroll-into-view; CSS-driven; narratively memorable; different from hero scramble in mechanism and feel
- **Structural redesign** of the footer layout with Matrix tokens: `#0a0a0a` background, `border-t border-[var(--matrix-green)]/20`, `font-mono` copyright, `> github` terminal-prompt styled social links, `"> EOF"` or `"CONNECTION TERMINATED"` as footer tagline

Option A (drain columns) is the next addition if the above does not feel "alive" enough — but verify reduced-motion compliance before adding JS animation.

### Table Stakes (Footer)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Matrix dark background (`#0a0a0a`) | Current `bg-muted` is grey/neutral — footer visually disconnects from the rest of the portfolio | LOW | CSS change |
| Matrix-green top border accent | Signals the footer boundary with Matrix theming | LOW | `border-t border-[var(--matrix-green)]/20` |
| `hover:text-[var(--matrix-green)]` on links | Current `hover:text-primary` is blue — inconsistent with nav and card hover | LOW | CSS change |
| Monospace copyright text | Fits terminal aesthetic | LOW | `font-mono` Tailwind class |
| Reduced-motion: all footer animations off | Must extend the existing gate (CSS global rule already present) | LOW | Any JS animation needs `window.matchMedia('(prefers-reduced-motion: reduce)')` check |

### Differentiators (Footer)

| Feature | Value Proposition | Complexity | Notes |
|---------|------------------|------------|-------|
| CRT scanline texture (`::before` pseudo-element) | Terminal/monitor feel; zero JS; distinguishes footer from hero canvas | LOW | `repeating-linear-gradient(to bottom, transparent 0%, rgba(0,255,65,0.03) 50%, transparent 100%)` at 3px repeat |
| Glitch text on "Fernando Millan" (CSS, fires once via IntersectionObserver) | Memorable narrative close; CSS `clip-path` layer-split differs from hero character-replacement scramble | MEDIUM | IntersectionObserver adds class → CSS `@keyframes` with `animation-iteration-count: 1`; fires once |
| Terminal-prompt social links (`> github`, `> email`) | Visual styling of links as terminal commands — narrative coherence with terminal prompt on hero | LOW | Text prefix change + `font-mono` |
| `> EOF` or `CONNECTION TERMINATED` footer tagline | Explicit narrative close to the portfolio story | LOW | Static text, `font-mono`, `text-[var(--matrix-green-dim)]` |

### Anti-Features (Footer)

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Second `MatrixRainCanvas` (another `<canvas>` RAF loop) | "More immersive" | Two concurrent canvas RAF loops doubles GPU context cost; identical visual to hero reads as copy-paste not design; hero is the opening, footer is the close | CSS-only drain effect (Option A) if ambient animation is needed |
| Infinite looping glitch on "Fernando Millan" | "Keeps it alive" | Infinite glitch becomes wallpaper — recruiter tries to read the name and it keeps jittering; inaccessible for photosensitive users | Fire once via IntersectionObserver + `animation-iteration-count: 1` |
| Three.js or p5.js particle footer | "Technically impressive" | 9MB+ bundle; destroys Lighthouse score; no alignment with existing lightweight canvas approach | CSS-only or plain canvas matching existing `MatrixRainCanvas` pattern (vanilla JS, no library) |
| Full-height footer (>300px) making animation the main content | "Big final moment" | Footer is utility UI — nav links, social, copyright; oversized footer confuses information hierarchy and annoys users who want to find the GitHub link | Animation behind/around content; footer stays compact (~160–200px) |
| Three-column grid removed for a single centered animation panel | "Dramatic" | Removes Quick Links and Connect columns that are actually useful to recruiters | Keep three-column layout; add Matrix styling on top |

---

## Feature Dependencies

```
Lenis smooth scroll
    └──requires──> 'use client' wrapper component (SmoothScroll.tsx)
    └──requires──> Scoped to (portfolio)/layout.tsx (NOT root layout)
    └──requires──> usePathname route-change handler → lenis.scrollTo(0)
    └──requires──> Conditional render: skip if prefers-reduced-motion
    └──enables──> GSAP ScrollTrigger sync (when parallax is added)

GSAP ScrollTrigger parallax
    └──requires──> Lenis sync: lenis.on('scroll', ScrollTrigger.update)
    └──requires──> Lenis sync: gsap.ticker.add(time => lenis.raf(time * 1000))
    └──requires──> gsap.ticker.lagSmoothing(0)
    └──requires──> gsap.registerPlugin(ScrollTrigger) once at module level
    └──requires──> useGSAP from @gsap/react (auto-cleanup on unmount)
    └──depends on──> Lenis being wired first (P2 after P1 Lenis)

Magnetic Buttons
    └──requires──> gsap.quickTo (in gsap@3.14.2 — no additional install)
    └──requires──> any-hover media guard (matchMedia)
    └──requires──> useReducedMotion() or matchMedia reduced-motion check
    └──intentionally excludes──> nav links (CSS underline already excellent)
    └──intentionally excludes──> form submit buttons

Matrix Color Harmony
    └──requires──> .matrix-theme CSS class scope (already established in v2.5)
    └──requires──> var(--matrix-green) token system (already in :root)
    └──must NOT modify──> :root tokens (breaks dashboard route WCAG AA colors)
    └──enhances──> Footer redesign (footer uses same token set)

Footer Redesign (CSS glitch + scanlines + structural)
    └──requires──> IntersectionObserver (for once-on-view glitch trigger)
    └──requires──> prefers-reduced-motion CSS guard (already present globally)
    └──must NOT use──> second MatrixRainCanvas (canvas duplication)
    └──enhances when combined with──> Matrix Color Harmony tokens
```

### Dependency Notes

- **Lenis must ship before GSAP parallax.** Without the Lenis + GSAP ticker sync, ScrollTrigger reads native scroll position (always 0 while Lenis interpolates) — parallax fires at wrong depths or not at all.
- **Color harmony must scope to `.matrix-theme` only.** `:root` token modifications would silently break the v1.1 WCAG AA validated color system that powers TeamFlow and DevCollab dashboards. The established pattern (`.matrix-theme {}` in `globals.css`) must be followed for all overrides.
- **Footer must not duplicate the canvas.** Two concurrent canvas RAF loops on the same page page is measurable GPU overhead. The footer should use CSS-only animation unless the CSS approach proves insufficient — and even then, use a minimal vanilla JS canvas matching the existing `MatrixRainCanvas` pattern (no library).
- **Magnetic buttons must not touch nav links.** The nav already has Awwwards-quality animation via `motion/react` `layoutId` spring underline. Magnetic effect on small nav items would cause visual collision between close-proximity links.

---

## MVP Definition (v3.1 Polish Milestone)

### Ship in This Milestone (P1 — All Low-Medium Complexity)

- [ ] **Lenis smooth scroll** — Wire `ReactLenis` in `(portfolio)/layout.tsx` with route-change handler + reduced-motion bypass. Library installed; integration only.
- [ ] **Matrix color harmony** — CSS edits across `about/page.tsx`, `contact/page.tsx`, `footer.tsx`, case study pages, `tech-stack.tsx`. No new libraries, no new components.
- [ ] **Footer redesign** — Full rewrite of `footer.tsx` (99 lines). Matrix tokens, CRT scanlines (CSS), glitch text (CSS + IntersectionObserver), terminal-prompt social links, `> EOF` tagline.
- [ ] **Magnetic buttons** — New `MagneticButton.tsx` component using `gsap.quickTo`. Applied to: hero CTAs, contact page CTA. Guard: `any-hover` + reduced-motion.

### Add After P1 Ships (P2)

- [ ] **GSAP ScrollTrigger parallax** — After Lenis is wired and sync pattern established. Target: hero text drift, section separator decorations, case study metric numbers.

### Defer (P3 / Out of Scope)

- [ ] Inner-content magnetic parallax (text at 60% of button movement) — Extra polish layer; ship basic magnetic first, measure feel
- [ ] Scrolling katakana ticker in footer — Low information density relative to effort; CSS scanlines cover the texture need
- [ ] Parallax on all portfolio sections — Verify P2 performance impact on Lighthouse before expanding

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Lenis smooth scroll | HIGH — immediately perceived on first scroll; the absence is jarring on portfolios at this quality level | LOW — 20-line wrapper, library installed | P1 |
| Matrix color harmony | HIGH — current blue-in-green-portfolio mismatch is the most obvious visual inconsistency | LOW — CSS edits only | P1 |
| Footer redesign | MEDIUM-HIGH — last thing recruiter sees; currently generic and breaks aesthetic | MEDIUM — new component, CSS animations | P1 |
| Magnetic buttons | MEDIUM — premium CTA feel; noticed when present, not noticed when absent | LOW-MEDIUM — GSAP quickTo, 2–3 CTAs | P1 |
| GSAP parallax depth | MEDIUM — depth effect; scroll-reveal already gives entrance animation; parallax is additive | MEDIUM — Lenis sync required first | P2 |

---

## Implementation Complexity Notes by Feature

| Feature | Files Touched | New Components | Risk |
|---------|---------------|----------------|------|
| Lenis | `(portfolio)/layout.tsx` + new `SmoothScroll.tsx` | 1 | LOW — wrapper pattern; wrong scope = dashboard breakage |
| GSAP parallax | `hero-section.tsx` + section pages | 0–1 (`ParallaxLayer.tsx` optional) | MEDIUM — must not conflict with existing `whileInView` entrance animations |
| Magnetic button | New `MagneticButton.tsx` + `hero-section.tsx` + `contact/page.tsx` | 1 | LOW-MEDIUM — event listener cleanup via `useGSAP` |
| Color harmony | `globals.css` + `about/page.tsx` + `contact/page.tsx` + case study pages + `tech-stack.tsx` | 0 | LOW — CSS only; must stay inside `.matrix-theme {}` scope |
| Footer redesign | `footer.tsx` (full rewrite of existing 99-line component) | 0 (rewrite existing) | LOW-MEDIUM — CSS animations new; `IntersectionObserver` for glitch trigger |

---

## Sources

- [Lenis GitHub README — darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) — verified `lenis/react` import path for v1.3.17; GSAP sync pattern
- [Lenis React README — packages/react/README.md](https://github.com/darkroomengineering/lenis/blob/main/packages/react/README.md) — `ReactLenis` API, `autoRaf` option, `useLenis` hook
- [GSAP React Guide — gsap.com/resources/React](https://gsap.com/resources/React/) — `useGSAP` hook, `contextSafe`, auto-cleanup behavior
- [GSAPify ScrollTrigger Complete Guide 2025](https://gsapify.com/gsap-scrolltrigger) — `scrub` values, `ease: none` requirement, performance pitfalls
- [Olivier Larose — Magnetic Button Tutorial (GSAP + Framer Motion)](https://blog.olivierlarose.com/tutorials/magnetic-button) — `quickTo` vs `gsap.to` in mousemove; GSAP vs motion.js comparison
- [GSAP community — Lenis ScrollTrigger sync patterns](https://gsap.com/community/forums/topic/40426-patterns-for-synchronizing-scrolltrigger-and-lenis-in-reactnext/) — canonical sync pattern with ticker
- [devdreaming.com — Lenis + GSAP Next.js App Router](https://devdreaming.com/blogs/nextjs-smooth-scrolling-with-lenis-gsap) — App Router integration pattern
- [Muz.li Web Design Trends 2026](https://muz.li/blog/web-design-trends-2026/) — magnetic/interactive elements premium vs gimmicky distinction
- Direct codebase inspection: `apps/web/app/globals.css`, `apps/web/components/portfolio/*`, `apps/web/app/(portfolio)/*` — all inspected 2026-02-20

---

*Feature research for: Fernando Millan Portfolio v3.1 — Matrix Polish & Cohesion*
*Researched: 2026-02-20*
