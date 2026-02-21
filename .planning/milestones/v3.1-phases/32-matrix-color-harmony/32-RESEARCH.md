# Phase 32: Matrix Color Harmony - Research

**Researched:** 2026-02-21
**Domain:** CSS custom properties, Tailwind v4, Next.js App Router, Playwright visual regression
**Confidence:** HIGH — all findings are verified directly from the live codebase

---

## Summary

Phase 32 replaces every remaining blue Radix `--primary` reference inside portfolio routes with Matrix green CSS tokens. The project already has three Matrix green tokens in `:root` (`--matrix-green`, `--matrix-green-dim`, `--matrix-green-ghost`). Four new tokens must be added to `.matrix-theme` (NOT `:root`) to prevent bleed into the TeamFlow/DevCollab dashboards. All token usage must go through `var()` or Tailwind's arbitrary-value syntax `[var(--token)]` — never through `@theme inline` to keep dashboard routes isolated.

The audit of the live codebase reveals approximately 35 locations across 7 files where `text-primary`, `border-primary`, `bg-primary`, `from-primary`, `hover:text-primary`, and `hover:border-primary` are used in portfolio pages and components. These are all the blue mismatches that must become Matrix green. In addition, every `<h2>` section heading in portfolio pages must receive a terminal-label prefix element (`> SECTION_NAME`) rendered in monospace Matrix green above it.

After all changes are made, the 12 existing portfolio Playwright visual regression snapshots must be regenerated (`--update-snapshots`) and the 6 dashboard snapshots must be verified to show zero green bleed. The success gate is all 18 snapshots pass at `maxDiffPixelRatio: 0.02`.

**Primary recommendation:** Work file by file in strict order: (1) add 4 new tokens to `.matrix-theme` in `globals.css`, (2) patch each portfolio page/component to swap primary references, (3) add the `<SectionLabel>` prefix component for all `<h2>` headings, (4) update Playwright baselines and gate.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COLOR-01 | Four new CSS tokens (`--matrix-green-subtle`, `--matrix-green-border`, `--matrix-scan-line`, `--matrix-terminal`) defined in `.matrix-theme` in globals.css | Token values and scoping strategy confirmed from globals.css audit. Must be in `.matrix-theme {}` block, NOT `:root`, to prevent dashboard bleed. |
| COLOR-02 | About page: blue gradient and value card borders replaced with Matrix green tokens | `about/page.tsx` confirmed: 4x `hover:border-primary/50` on Cards, 1x `from-primary/10` on CTA gradient section. All need swapping. |
| COLOR-03 | Contact page: heading accents and CTA styling use Matrix green | `contact/page.tsx` confirmed: 1x `text-primary` on email link. Minor but visible blue that breaks terminal theme. |
| COLOR-04 | Case study pages (TeamFlow, DevCollab): metric numbers in Matrix green monospace | Both case study pages have `text-3xl font-bold text-primary` metric stats plus `border-l-4 border-primary` challenge sections. Confirmed in both files. |
| COLOR-05 | Tech-stack badge borders and highlight colors use Matrix green | `tech-stack.tsx`: `hover:border-primary/50`. `project-card.tsx`: badges use `variant="secondary"`. Home page: `border-2 border-primary` on featured project cards. `parallax-divider.tsx`: `bg-primary/30`. All need attention. |
| COLOR-06 | Footer link hover states use Matrix green | `footer.tsx` confirmed: 9 instances of `hover:text-primary` on nav links and social icon links. All need `hover:text-[var(--matrix-green)]`. |
| COLOR-07 | All portfolio `<h2>` section headings have terminal-style prefix `> SECTION_NAME` above them | Multiple `<h2>` across about, contact, case studies, resume, homepage. Needs a shared `SectionLabel` component or inline pattern. |
| COLOR-08 | All 18 Playwright visual regression snapshots pass after baseline update | 12 portfolio snapshots (6 routes x 2 modes) + 6 dashboard snapshots. Command: `npx playwright test --config=playwright.visual.config.ts --update-snapshots`. Dashboard must show zero Matrix green bleed. |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4 (CSS-first) | Utility classes, `@theme inline` | Project uses Tailwind v4 CSS-first config — `tailwind.config.js` is a stub only |
| CSS custom properties | Native browser | Matrix green token system | All tokens use `var()` syntax; project convention is raw CSS vars, not Tailwind utilities |
| Playwright | ^1.58.2 | Visual regression baseline management | Already installed; `playwright.visual.config.ts` configures the visual test suite |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Radix Colors (blue scale) | Installed | `--primary` semantic token source | Dashboard routes only — portfolio routes override with Matrix green |
| `font-mono` Tailwind class | Built-in | Terminal monospace text for section labels and metric numbers | Use for `> SECTION_NAME` prefix and metric stat numbers |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `.matrix-theme {}` scoping | `:root` scoping | NEVER use `:root` for new Matrix tokens — dashboard bleed is the confirmed failure mode (STATE.md decision) |
| `var(--matrix-green)` arbitrary syntax | Tailwind `text-primary` utility | Never use `@theme inline` to register Matrix tokens as Tailwind utilities — confirmed architectural decision from v2.5 |
| New `SectionLabel` component | Inline JSX in each page | Component preferred for consistency; however it can also be a simple inline pattern since no interactivity is needed |

**Installation:** No new packages needed. All required libraries are already in the project.

---

## Architecture Patterns

### CSS Token Scoping Pattern (CRITICAL)

The project uses a two-tier token system:

```
:root {
  /* Global Radix semantic tokens — used by BOTH portfolio AND dashboard */
  --primary: var(--blue-11);           /* ← blue, used by dashboard buttons etc. */
  --matrix-green: #00FF41;             /* ← existing tokens in :root (safe: read-only vars) */
  --matrix-green-dim: #00CC33;
  --matrix-green-ghost: #00FF4120;
}

.matrix-theme {
  /* Portfolio-only overrides — scoped by CSS class on layout.tsx wrapper div */
  background-color: #0a0a0a;
  color: #e8e8e8;
  /* NEW tokens belong HERE for COLOR-01 */
}
```

The `.matrix-theme` class is applied to the wrapper `<div>` in `/apps/web/app/(portfolio)/layout.tsx`. Dashboard routes never have `.matrix-theme`, so any token defined here is invisible to the dashboard.

### New Token Definitions (COLOR-01)

Add to the `.matrix-theme {}` block in `globals.css`:

```css
.matrix-theme {
  background-color: #0a0a0a;
  color: #e8e8e8;

  /* Phase 32: Matrix green harmony tokens */
  --matrix-green-subtle: #00FF4108;    /* 5% opacity — very faint glow bg */
  --matrix-green-border: #00FF4133;    /* ~20% opacity — border tint */
  --matrix-scan-line: #00FF410D;       /* ~5% opacity — scan line overlay (used in Phase 33) */
  --matrix-terminal: #00FF41;          /* Alias of matrix-green for semantic clarity */
}
```

Token value rationale:
- `--matrix-green-subtle`: Use in gradient backgrounds replacing `from-primary/10 to-transparent`
- `--matrix-green-border`: Use on hover borders replacing `hover:border-primary/50`
- `--matrix-scan-line`: Reserved for Phase 33 footer CRT effect; define now per COLOR-01
- `--matrix-terminal`: Full bright green for metric numbers and section labels (replaces `text-primary`)

### Pattern: Replacing Primary Color References

**Before (blue):**
```tsx
<Card className="hover:border-primary/50 transition-colors">
```

**After (Matrix green):**
```tsx
<Card className="hover:border-[var(--matrix-green-border)] transition-colors">
```

**Before (gradient):**
```tsx
<section className="text-center bg-gradient-to-br from-primary/10 to-transparent rounded-lg p-8">
```

**After:**
```tsx
<section className="text-center bg-gradient-to-br from-[var(--matrix-green-subtle)] to-transparent rounded-lg p-8">
```

**Before (footer hover):**
```tsx
className="text-sm text-muted-foreground hover:text-primary transition-colors"
```

**After:**
```tsx
className="text-sm text-muted-foreground hover:text-[var(--matrix-green)] transition-colors"
```

**Before (metric number):**
```tsx
<div className="text-3xl font-bold text-primary mb-2">v1.0</div>
```

**After (COLOR-04 — monospace + Matrix green):**
```tsx
<div className="text-3xl font-bold font-mono text-[var(--matrix-terminal)] mb-2">v1.0</div>
```

### Pattern: Terminal Section Label Prefix (COLOR-07)

Each `<h2>` section heading in portfolio pages needs a `> SECTION_NAME` prefix above it. This is a presentational label, not a heading level. It must be:
- `font-mono` (matches terminal theme)
- `text-[var(--matrix-green)]` (Matrix green)
- Small/uppercase (`text-xs` or `text-sm uppercase tracking-widest`)
- Rendered as a `<div>` or `<span>` ABOVE the `<h2>`, not inside it

Two implementation approaches are valid:

**Option A: Shared `SectionLabel` component** (preferred for reuse):
```tsx
// components/portfolio/section-label.tsx
interface SectionLabelProps {
  label: string;
}

export function SectionLabel({ label }: SectionLabelProps) {
  return (
    <div className="font-mono text-xs text-[var(--matrix-green)] tracking-widest uppercase mb-2">
      {'>'} {label.toUpperCase().replace(/ /g, '_')}
    </div>
  );
}
```

Usage:
```tsx
<section>
  <SectionLabel label="Professional Summary" />
  <h2 className="text-2xl font-bold text-foreground mb-6">Professional Summary</h2>
  ...
</section>
```

**Option B: Inline pattern** (acceptable for small number of instances):
```tsx
<section>
  <div className="font-mono text-xs text-[var(--matrix-green)] tracking-widest uppercase mb-2">
    {'>'} PROFESSIONAL_SUMMARY
  </div>
  <h2 className="text-2xl font-bold text-foreground mb-6">Professional Summary</h2>
```

**Recommendation:** Create `SectionLabel` component since there are ~15+ `<h2>` across 7 pages.

### Pattern: `CaseStudySection` component update (COLOR-04 + COLOR-07)

The `CaseStudySection` component in `components/portfolio/case-study-section.tsx` renders the `<h2>` for case study sections. To apply COLOR-07 consistently to all case study sections at once, modify this component to add the terminal label above each `<h2>`:

```tsx
// case-study-section.tsx — updated
import { SectionLabel } from './section-label';

export function CaseStudySection({ title, children }: CaseStudySectionProps) {
  return (
    <section className="mb-12">
      <AnimateIn>
        <SectionLabel label={title} />
        <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      </AnimateIn>
      <div>{children}</div>
    </section>
  );
}
```

This handles all 12+ case study `<h2>` headings in both TeamFlow and DevCollab pages with a single change.

---

## Complete Audit: Blue Primary References to Replace

### `apps/web/app/globals.css`
- No changes to existing tokens needed
- ADD 4 new tokens to `.matrix-theme {}` block (COLOR-01)

### `apps/web/app/(portfolio)/about/page.tsx` (COLOR-02)
- Line 71, 82, 93, 104: `hover:border-primary/50` on Cards → `hover:border-[var(--matrix-green-border)]`
- Line 119: `from-primary/10` on CTA gradient → `from-[var(--matrix-green-subtle)]`

### `apps/web/app/(portfolio)/contact/page.tsx` (COLOR-03)
- Line 34: `text-primary hover:underline` on email link → `text-[var(--matrix-green)] hover:underline`
- The two `<h2>` headings ("Send a Message", "Contact Information") need `SectionLabel` above them

### `apps/web/app/(portfolio)/projects/teamflow/page.tsx` (COLOR-04)
- Lines 87, 95, 103: `text-3xl font-bold text-primary` metric numbers → add `font-mono` + `text-[var(--matrix-terminal)]`
- Line 82, 125: `text-primary` inline text → `text-[var(--matrix-green)]`
- Lines 27: `text-primary` "Back to Projects" link → `text-[var(--matrix-green)]`
- Lines 410, 434, 456: `border-l-4 border-primary` challenge sections → `border-l-4 border-[var(--matrix-green-border)]`
- Lines 502, 503, 504: `text-primary` v1.1 coming items → `text-[var(--matrix-green)]`
- `CaseStudySection` titles handled by component update

### `apps/web/app/(portfolio)/projects/devcollab/page.tsx` (COLOR-04)
- Lines 90, 94, 98: `text-3xl font-bold text-primary` metric numbers → add `font-mono` + `text-[var(--matrix-terminal)]`
- Line 29: `text-primary` "Back to Projects" link → `text-[var(--matrix-green)]`
- Lines 282, 305, 327: `border-l-4 border-primary` → `border-l-4 border-[var(--matrix-green-border)]`
- `CaseStudySection` titles handled by component update

### `apps/web/app/(portfolio)/page.tsx` (COLOR-05)
- Lines 41, 90: `border-2 border-primary` on featured project cards → `border-2 border-[var(--matrix-green-border)]`
- Lines 41, 90: `from-primary/5 to-transparent` gradients → `from-[var(--matrix-green-subtle)] to-transparent`
- Lines 79, 127: `text-primary` "Read full case study →" links → `text-[var(--matrix-green)]`
- Lines 145, 153, 161: `text-4xl font-bold text-primary` stats → `font-mono text-[var(--matrix-terminal)]`
- `<h2>` "Featured Projects" needs `SectionLabel` prefix

### `apps/web/components/portfolio/tech-stack.tsx` (COLOR-05)
- Line 29: `hover:border-primary/50` on Card → `hover:border-[var(--matrix-green-border)]`

### `apps/web/components/portfolio/footer.tsx` (COLOR-06)
- Lines 30, 38, 46, 54: `hover:text-primary` on nav links → `hover:text-[var(--matrix-green)]`
- Lines 72, 81: `hover:text-primary` on social icon links → `hover:text-[var(--matrix-green)]`

### `apps/web/components/portfolio/parallax-divider.tsx` (COLOR-05)
- Line 44: `bg-primary/30` → `bg-[var(--matrix-green-border)]`
  - Note: This was a deliberate decision in Phase 30 (STATE.md: "bg-primary/30 for divider line — Matrix green at 30% opacity within .matrix-theme"). The semantic intent was already Matrix green; now the token explicitly matches.

### `apps/web/components/portfolio/hero-section.tsx`
- Line 49: `text-primary` on "Full-Stack Engineer" subtitle span → this is the ONE intentional blue in the hero. Decision needed: keep it as brand accent or swap to Matrix green?
  - Recommendation: swap to `text-[var(--matrix-green)]` for full harmony — the hero is inside `.matrix-theme` wrapper and the MatrixRainCanvas background makes green the natural accent.

### `apps/web/app/(portfolio)/resume/page.tsx` (COLOR-07)
- Line 191: `text-primary hover:underline` on "View Case Study →" → `text-[var(--matrix-green)]`
- All `<h2>` headings (Summary, Technical Skills, Experience, Education, Projects) need `SectionLabel` prefix

### Pages without blue primary issues
- `apps/web/app/(portfolio)/projects/page.tsx` — uses `text-foreground` and `text-muted-foreground`; no `text-primary` instances. Still needs `<h2>` label check.

---

## Playwright Visual Regression Gate (COLOR-08)

### Current snapshot count

Portfolio spec (`e2e/portfolio/visual-regression.spec.ts`):
- 6 routes × 2 modes (light/dark) = **12 snapshots**
- Routes: homepage, about, projects, teamflow-case-study, resume, contact

Dashboard spec (`e2e/dashboard/visual-regression.spec.ts`):
- 3 tests × 2 modes = **6 snapshots** (project-board tests are conditional/skipped)
- Confirmed snapshots: teams-list, profile, team-detail (light + dark each)

Total confirmed: **18 snapshots** (matches COLOR-08 requirement)

### Update command

```bash
# Run from apps/web directory
npx playwright test --config=playwright.visual.config.ts --update-snapshots
```

### Verification strategy

After updating portfolio baselines, run WITHOUT `--update-snapshots` to confirm all 18 pass:

```bash
npx playwright test --config=playwright.visual.config.ts
```

Dashboard snapshots must NOT change — any delta in dashboard snapshots means Matrix green leaked into dashboard routes (token scoping failure). If dashboard snapshots change, the new token definitions leaked out of `.matrix-theme` into `:root`.

### Baseline management

The snapshots live in:
- `e2e/portfolio/visual-regression.spec.ts-snapshots/` (12 PNGs)
- `e2e/dashboard/visual-regression.spec.ts-snapshots/` (6 PNGs)

Both sets are committed to git. After `--update-snapshots`, the 12 portfolio PNGs will change; the 6 dashboard PNGs must remain byte-for-byte identical.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Matrix green token values | Custom color picker / hex guessing | Use existing `--matrix-green: #00FF41` as the source of truth | The bright green is already established across MatrixRainCanvas, nav, evervault-card, cursor-blink — must match exactly |
| Dashboard isolation | Complex scoping logic | `.matrix-theme {}` CSS block (already in globals.css) | The pattern already exists and is proven to work from Phase 22 |
| Terminal label formatting | Complex component with animations | Simple `<div>` with `font-mono text-xs uppercase tracking-widest` | Static presentational element — no JS needed |

**Key insight:** All the hard architectural work (token isolation, `.matrix-theme` class, dashboard bleed prevention) was solved in Phase 22/v2.5. Phase 32 is purely applying consistent token usage across pages that were written before the token system was complete.

---

## Common Pitfalls

### Pitfall 1: Putting New Tokens in `:root` Instead of `.matrix-theme`
**What goes wrong:** New tokens defined in `:root` are available globally — dashboard routes inherit them and could render Matrix green in unexpected places.
**Why it happens:** It's the natural place to put CSS variables, and the three existing Matrix tokens (`--matrix-green`, `--matrix-green-dim`, `--matrix-green-ghost`) ARE in `:root`.
**How to avoid:** The distinction is that the three `:root` tokens are READ-ONLY source values — they define color values, not semantic meanings. The four new tokens (`--matrix-green-subtle`, `--matrix-green-border`, `--matrix-scan-line`, `--matrix-terminal`) define portfolio-specific semantics and belong in `.matrix-theme`.
**Warning signs:** If dashboard Playwright snapshots change after this phase, tokens leaked into `:root`.

### Pitfall 2: Using `@theme inline` to Register New Tokens as Tailwind Utilities
**What goes wrong:** If `--matrix-green-border` is registered in `@theme inline` as `--color-matrix-green-border`, it becomes a global Tailwind utility `border-matrix-green-border` that works everywhere, including the dashboard.
**Why it happens:** Tailwind v4 `@theme inline` is the normal way to create custom utilities.
**How to avoid:** Never register Matrix tokens in `@theme inline`. Always use arbitrary-value syntax: `border-[var(--matrix-green-border)]`. This is the established project decision from v2.5.
**Warning signs:** If you find yourself writing `@theme inline { --color-matrix-green-border: ... }`, stop.

### Pitfall 3: Missing `<h2>` Headings on Some Pages
**What goes wrong:** The resume page, projects page, and homepage have `<h2>` tags that won't be caught if only looking at about/contact/case-studies.
**Why it happens:** The COLOR-07 requirement says "all portfolio `<h2>` section headings" — it's easy to miss pages that don't have obvious section structures.
**How to avoid:** Do a full grep for `<h2` across all portfolio pages before marking COLOR-07 complete.
**Command:** `grep -rn "<h2" apps/web/app/\(portfolio\)/`

### Pitfall 4: `parallax-divider.tsx` Token Confusion
**What goes wrong:** The divider line currently uses `bg-primary/30`. In `.matrix-theme`, `--primary` resolves to blue-11 (the Radix blue). So the current divider line IS blue, even though Phase 30 comments said "Matrix green at 30% opacity within .matrix-theme" — that comment was incorrect at the time (bg-primary/30 in .matrix-theme context still uses `--primary` which maps to blue-11 via @theme inline).
**How to avoid:** Replace with `bg-[var(--matrix-green-border)]` to make the intent correct and explicit.

### Pitfall 5: Snapshot Update Without Visual Review
**What goes wrong:** Running `--update-snapshots` blindly accepts all changes including regressions. A bug introduced in Phase 32 could be baked into baselines.
**How to avoid:** After updating snapshots, open the Playwright HTML report and visually review each diff before committing. Specifically check that:
- No blue remains visible on any portfolio page
- Dashboard snapshots show zero change
- Section labels (`> SECTION_NAME`) appear correctly above each `<h2>`

---

## Code Examples

### COLOR-01: Adding tokens to `.matrix-theme`

```css
/* globals.css — add to existing .matrix-theme block */
.matrix-theme {
  background-color: #0a0a0a;
  color: #e8e8e8;

  /* Phase 32: Matrix Color Harmony tokens */
  --matrix-green-subtle: #00FF4108;
  --matrix-green-border: #00FF4133;
  --matrix-scan-line: #00FF410D;
  --matrix-terminal: #00FF41;
}
```

### COLOR-02: About page CTA gradient

```tsx
{/* Before */}
<section className="text-center bg-gradient-to-br from-primary/10 to-transparent rounded-lg p-8 md:p-12">

{/* After */}
<section className="text-center bg-gradient-to-br from-[var(--matrix-green-subtle)] to-transparent rounded-lg p-8 md:p-12">
```

### COLOR-04: Case study metric numbers (monospace)

```tsx
{/* Before */}
<div className="text-3xl font-bold text-primary mb-2">v1.0</div>

{/* After */}
<div className="text-3xl font-bold font-mono text-[var(--matrix-terminal)] mb-2">v1.0</div>
```

### COLOR-06: Footer hover states

```tsx
{/* Before */}
<Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">

{/* After */}
<Link href="/" className="text-sm text-muted-foreground hover:text-[var(--matrix-green)] transition-colors">
```

### COLOR-07: SectionLabel component

```tsx
// apps/web/components/portfolio/section-label.tsx
interface SectionLabelProps {
  label: string;
}

export function SectionLabel({ label }: SectionLabelProps) {
  return (
    <div
      className="font-mono text-xs text-[var(--matrix-green)] tracking-widest uppercase mb-2"
      aria-hidden="true"
    >
      {'>'} {label.toUpperCase().replace(/\s+/g, '_')}
    </div>
  );
}
```

Note: `aria-hidden="true"` because the label is decorative — the `<h2>` already provides the accessible heading. Screen readers don't need to announce `> PROFESSIONAL_SUMMARY` before "Professional Summary".

### COLOR-08: Playwright baseline update

```bash
# Step 1: Update baselines (run from apps/web)
npx playwright test --config=playwright.visual.config.ts --update-snapshots

# Step 2: Verify all pass without update flag
npx playwright test --config=playwright.visual.config.ts

# Step 3: Check dashboard snapshots are unchanged
git diff --stat e2e/dashboard/visual-regression.spec.ts-snapshots/
# Expected: no output (0 files changed)
```

---

## Open Questions

1. **hero-section.tsx `text-primary` on the hero subtitle**
   - What we know: Line 49 `<span className="block text-primary">Full-Stack Engineer Building Production-Ready SaaS</span>` is blue. The spec (COLOR-02 through COLOR-06) doesn't explicitly call out the hero subtitle.
   - What's unclear: Is the hero subtitle meant to stay blue as a brand accent, or go Matrix green for full harmony?
   - Recommendation: Swap to `text-[var(--matrix-green)]`. The hero is inside `.matrix-theme`, MatrixRainCanvas green rain is the dominant visual, and the nav already uses `text-[var(--matrix-green)]` for active links. Blue is inconsistent here.

2. **Resume page `<h2>` headings — how many need SectionLabel?**
   - What we know: Resume has `<h2>` for Summary, Technical Skills, Experience, Education, Projects (5 headings). These currently have `border-b border-border pb-2` as their visual separator.
   - What's unclear: Does the SectionLabel prefix work visually with the existing border-bottom separator on resume headings? They have a different style than other pages.
   - Recommendation: Add SectionLabel above each resume `<h2>`. The `border-b` separator stays — the terminal label goes above, then the `<h2>` with its underline border.

3. **`parallax-divider.tsx` and COLOR-05 scope**
   - What we know: `bg-primary/30` on the divider line resolves to blue in `.matrix-theme` context. The Phase 30 comment in STATE.md said "Matrix green at 30% opacity" but that was aspirational — the Tailwind utility `bg-primary` still uses the `--primary` (blue) token via `@theme inline`.
   - What's unclear: Should `--matrix-green-border` at `#00FF4133` be used, or should it be explicit hex with opacity like `bg-[#00FF4133]`?
   - Recommendation: Use `bg-[var(--matrix-green-border)]` since that token is being defined as part of COLOR-01 at `#00FF4133` (approximately 20% opacity Matrix green).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `:root` for all Matrix tokens | `.matrix-theme {}` for portfolio-specific semantic tokens | Phase 22/v2.5 | Dashboard isolation maintained |
| `@theme inline` for custom utilities | Raw `var()` in arbitrary Tailwind classes | Phase 22/v2.5 | No Tailwind color utility pollution |
| Blue `--primary` throughout portfolio | Matrix green `var(--matrix-terminal)` etc. | Phase 32 (this phase) | Visual coherence with terminal theme |

---

## Sources

### Primary (HIGH confidence)
- `apps/web/app/globals.css` — Confirmed token definitions, `.matrix-theme` block, `@theme inline` scope
- `apps/web/app/(portfolio)/layout.tsx` — Confirmed `.matrix-theme` class placement
- `apps/web/app/(portfolio)/about/page.tsx` — Confirmed all primary references
- `apps/web/app/(portfolio)/contact/page.tsx` — Confirmed primary references
- `apps/web/app/(portfolio)/projects/teamflow/page.tsx` — Confirmed all metric + border + link references
- `apps/web/app/(portfolio)/projects/devcollab/page.tsx` — Confirmed all metric + border + link references
- `apps/web/app/(portfolio)/page.tsx` — Confirmed featured project card borders and stat numbers
- `apps/web/components/portfolio/footer.tsx` — Confirmed all 9 hover:text-primary references
- `apps/web/components/portfolio/tech-stack.tsx` — Confirmed hover:border-primary/50
- `apps/web/components/portfolio/parallax-divider.tsx` — Confirmed bg-primary/30
- `apps/web/e2e/portfolio/visual-regression.spec.ts` — Confirmed 6 routes × 2 modes = 12 snapshots
- `apps/web/e2e/dashboard/visual-regression.spec.ts` — Confirmed 3 dashboard tests × 2 modes = 6 snapshots
- `apps/web/playwright.visual.config.ts` — Confirmed baseURL, maxDiffPixelRatio: 0.02 per test
- `.planning/STATE.md` — Confirmed Matrix token scoping decisions from Phase 22/v2.5

### Secondary (MEDIUM confidence)
- `apps/web/DESIGN-SYSTEM.md` — Component list confirms Badge, Card, Button as components needing token swap
- `apps/web/components/portfolio/case-study-section.tsx` — CaseStudySection wraps all case study `<h2>` — single change propagates to both case studies

---

## Metadata

**Confidence breakdown:**
- Token definitions (COLOR-01): HIGH — existing `.matrix-theme` block location confirmed, values derived from existing `--matrix-green: #00FF41`
- File-by-file audit (COLOR-02 through COLOR-06): HIGH — all instances grep-verified from live codebase with line numbers
- Section label pattern (COLOR-07): HIGH — simple CSS, no library dependency, `aria-hidden` pattern is standard for decorative prefixes
- Playwright gate (COLOR-08): HIGH — spec files read directly, snapshot count confirmed at 18, update command verified

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable codebase, no fast-moving dependencies)
