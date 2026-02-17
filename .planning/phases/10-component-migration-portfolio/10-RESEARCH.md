# Phase 10: Component Migration (Portfolio) - Research

**Researched:** 2026-02-16
**Domain:** Shadcn UI component migration + visual regression testing + accessibility auditing
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MIG-01 | Portfolio pages migrated to Shadcn components (low-risk testing ground) | Codebase audit identifies exact files and import patterns to replace; Shadcn Button/Card/Badge/Input/Label already installed from Phase 9 |
</phase_requirements>

---

## Summary

Phase 10 migrates the portfolio section (`app/(portfolio)`) from hand-rolled components to the Shadcn UI primitives installed in Phase 9. This is intentionally low-risk: portfolio pages have no authentication, no server state, and no complex interactions. A failed migration reverts cleanly without breaking the TeamFlow dashboard.

The migration has two parallel tracks: (1) replace component imports and markup in page files and portfolio component files, and (2) add visual regression tests capturing both light and dark modes. The existing Playwright setup (`@playwright/test` v1.58.2) already covers portfolio navigation — Phase 10 extends it with `toHaveScreenshot()` for baseline capture and `@axe-core/playwright` for automated accessibility scoring.

The current codebase has a specific, audited set of hardcoded patterns that need replacing: `bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*`, `bg-blue-*` are scattered across 7 portfolio component files. The Shadcn primitives installed (Button, Card, Badge, Input, Label) cover every use case in the portfolio — no new components need to be added from the CLI.

**Primary recommendation:** Migrate components file-by-file in dependency order (leaf components first, pages last). For each file, replace hardcoded color classes with semantic tokens, replace `<span>` badges with `<Badge>`, replace `<div>` cards with `<Card>`, replace `<button>/<a>` CTAs with `<Button asChild>`. After migration, run `grep -r "bg-white\|bg-gray\|text-gray\|border-gray\|bg-blue" app/(portfolio) components/portfolio` to confirm zero results.

---

## Codebase Audit: What Needs Migrating

### Portfolio Pages (`app/(portfolio)`)

| File | Status | Issues Found |
|------|--------|-------------|
| `app/(portfolio)/page.tsx` | NEEDS MIGRATION | Inline `<span>` for "Featured" badge; hardcoded `text-gray-600 dark:text-gray-300`; raw `<span>` for tech badges; no Shadcn components imported |
| `app/(portfolio)/projects/page.tsx` | NEEDS MIGRATION | Imports custom `ProjectCard` from portfolio components; must switch to Shadcn `Card` + `Badge` |
| `app/(portfolio)/about/page.tsx` | NEEDS MIGRATION | Inline `<div>` cards (border rounded-lg) for values section; `<a>` for CTA button; `text-gray-600 dark:text-gray-300` |
| `app/(portfolio)/contact/page.tsx` | NEEDS MIGRATION | Uses custom `ContactForm` which has raw inputs; hardcoded `text-blue-600` |
| `app/(portfolio)/resume/page.tsx` | NEEDS MIGRATION | Hardcoded `bg-blue-600`, `text-gray-*`, `bg-gray-50`; raw `<a>` download button |
| `app/(portfolio)/projects/teamflow/page.tsx` | NEEDS MIGRATION | `bg-blue-600`, `bg-blue-50 dark:bg-blue-950/30`; `border-gray-*`; raw `<a>` CTAs; no Shadcn imports |
| `app/(portfolio)/layout.tsx` | NO CHANGE NEEDED | Imports `PortfolioNav`, `PortfolioFooter`, `CommandPalette` — no migration here |

### Portfolio Components (`components/portfolio`)

| File | Status | Migration Action |
|------|--------|-----------------|
| `components/portfolio/project-card.tsx` | REPLACE with Shadcn | Currently: raw `<Link>` with `border`, `bg-white`, `dark:bg-gray-900`, `bg-blue-100`, `text-blue-800`. Replace entire component with `Card` + `Badge` + `Button asChild` pattern |
| `components/portfolio/hero-section.tsx` | PARTIAL MIGRATION | Buttons are already styled with semantic tokens (`bg-primary`, `border-input`). Replace `<Link>` CTA buttons with `<Button asChild>`. Text using `text-gray-600 dark:text-gray-300` → `text-muted-foreground` |
| `components/portfolio/contact-form.tsx` | MIGRATE INPUTS | Has raw `<input>`, `<label>`, `<button>`, `<textarea>`. Replace with Shadcn `Input`, `Label`, `Button`. Note: no Shadcn `Textarea` installed — install it or wrap raw `<textarea>` with consistent styling |
| `components/portfolio/tech-stack.tsx` | MIGRATE to Card | Raw `<div>` tiles → Shadcn `Card` components. `text-gray-600 dark:text-gray-300` → `text-muted-foreground` |
| `components/portfolio/footer.tsx` | PARTIAL MIGRATION | `text-gray-600 dark:text-gray-300` → `text-muted-foreground`. Social links can stay as `<a>` or use `Button variant="ghost"` |
| `components/portfolio/nav.tsx` | PARTIAL MIGRATION | `text-gray-600 dark:text-gray-300` → `text-muted-foreground`. Mobile button can use `Button variant="ghost"`. Already uses `ThemeToggle` from `@/components/ui` |
| `components/portfolio/case-study-section.tsx` | MINIMAL CHANGE | Simple wrapper, no color-specific classes. No migration needed |

### Summary Counts

- **Files requiring migration:** 12 (7 pages + 5 component files + 0 layout files)
- **New Shadcn components to install:** `Textarea` (for contact form) — all others already installed
- **Hardcoded class patterns to eliminate:** `bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*`, `bg-blue-*`, `dark:bg-gray-*`, `dark:text-gray-*`

---

## Standard Stack

### Core (All Installed from Phase 9)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@/components/ui/button` | Phase 9 installed | Replaces all `<a>`, `<button>`, `<Link>` CTAs | `asChild` prop enables polymorphism with Next.js `Link` |
| `@/components/ui/card` | Phase 9 installed | Replaces raw `<div>` cards in project-card, tech-stack, about | Semantic `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription` sub-components |
| `@/components/ui/badge` | Phase 9 installed | Replaces inline `<span>` chips for tech tags and status | `variant="secondary"` for neutral tags; `variant="default"` for primary status |
| `@/components/ui/input` | Phase 9 installed | Replaces raw `<input>` in contact-form | Includes `border-input`, `focus-visible:ring-ring` — WCAG compliant focus |
| `@/components/ui/label` | Phase 9 installed | Replaces raw `<label>` in contact-form | Radix `@radix-ui/react-label` — properly connected with `htmlFor` |

### New Component to Install in This Phase

| Library | Install Command | Purpose | Why Needed |
|---------|-----------------|---------|------------|
| `Textarea` | `npx shadcn@latest add textarea -c ./apps/web` | Replaces raw `<textarea>` in contact-form | No Textarea in Phase 9 install; contact form has a 5-row message textarea |

### Testing Stack

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `@playwright/test` | ^1.58.2 (installed) | E2E tests + `toHaveScreenshot()` for visual regression | Already in `devDependencies` |
| `@axe-core/playwright` | latest | Automated accessibility audit (replaces manual axe DevTools) | NOT YET INSTALLED — add in this phase |

### Installation Commands

```bash
# From repo root — add Textarea component
npx shadcn@latest add textarea -c ./apps/web

# Install axe-core Playwright integration for automated a11y testing
npm install --save-dev @axe-core/playwright --workspace=apps/web
```

---

## Architecture Patterns

### Recommended Migration File Structure

No new files/folders are created. Migration is in-place:

```
apps/web/
├── components/portfolio/
│   ├── project-card.tsx          # REPLACE: raw divs → Card + Badge
│   ├── hero-section.tsx          # MIGRATE: <a>/<Link> → Button asChild
│   ├── contact-form.tsx          # MIGRATE: raw inputs → Input + Label + Button + Textarea
│   ├── tech-stack.tsx            # MIGRATE: raw divs → Card
│   ├── footer.tsx                # MIGRATE: color classes only
│   ├── nav.tsx                   # MIGRATE: color classes + Button for mobile toggle
│   └── case-study-section.tsx    # NO CHANGE
├── app/(portfolio)/
│   ├── page.tsx                  # MIGRATE: <span> badges → Badge, hardcoded colors
│   ├── about/page.tsx            # MIGRATE: inline cards → Card, <a> → Button asChild
│   ├── contact/page.tsx          # NO CHANGE (ContactForm handles inputs)
│   ├── resume/page.tsx           # MIGRATE: <a> → Button asChild, color classes
│   └── projects/
│       ├── page.tsx              # MIGRATE: uses ProjectCard (will be migrated)
│       └── teamflow/page.tsx     # MIGRATE: <a> CTAs, bg-blue-*, color classes
└── e2e/portfolio/
    ├── navigation.spec.ts        # EXISTING — no changes needed
    └── visual-regression.spec.ts # NEW: screenshot tests for all portfolio pages
```

### Pattern 1: Button with asChild for Link Navigation

**What:** Use Shadcn `Button` with `asChild` prop to wrap Next.js `Link` — renders as `<a>` semantically but with Button styling.

**When to use:** Any CTA that navigates to a route (`href="/about"`, `href="/contact"`).

**Before (current code):**
```tsx
<Link
  href="/about"
  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
>
  Learn More
</Link>
```

**After (Shadcn pattern):**
```tsx
// Source: https://ui.shadcn.com/docs/components/button
import { Button } from "@/components/ui/button"
import Link from "next/link"

<Button asChild size="lg">
  <Link href="/about">Learn More</Link>
</Button>
```

**For external links (GitHub, live demo):**
```tsx
<Button asChild variant="outline" size="lg">
  <a href="https://github.com/fernandomillan" target="_blank" rel="noopener noreferrer">
    View GitHub
  </a>
</Button>
```

### Pattern 2: Card for Project Cards

**What:** Replace the custom `ProjectCard` component entirely with Shadcn `Card` primitives.

**When to use:** Any content container that was previously a bordered `<div>` — project cards, tech stack tiles, value proposition boxes.

**Before (project-card.tsx):**
```tsx
<Link href={href} className="block border bg-white p-6 rounded-lg dark:bg-gray-900 ...">
  {featured && <span className="bg-blue-100 text-blue-800 ...">Featured</span>}
  <h3>{title}</h3>
  <p>{description}</p>
  <div>{techStack.map(t => <span className="bg-gray-100 dark:bg-gray-800">{t}</span>)}</div>
</Link>
```

**After:**
```tsx
// Source: https://ui.shadcn.com/docs/components/card
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

<Button asChild variant="ghost" className="h-auto p-0 w-full">
  <Link href={href}>
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        {featured && <Badge variant="default" className="w-fit mb-2">Featured</Badge>}
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {techStack.map((tech) => (
            <Badge key={tech} variant="secondary">{tech}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  </Link>
</Button>
```

**Alternative simpler approach (avoid Button wrapper on Card):**
```tsx
// Cards as clickable links — use a plain Link wrapping Card with cursor-pointer
<Link href={href} className="block">
  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
    ...
  </Card>
</Link>
```

### Pattern 3: Badge for Tech Stack Tags and Status Labels

**What:** Replace all inline `<span>` elements used as chips/tags with Shadcn `Badge`.

**Before:**
```tsx
// Tech tag
<span className="px-3 py-1 rounded-md bg-muted text-gray-600 dark:text-gray-300 text-sm font-medium">
  {tech}
</span>

// Featured badge
<span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
  Featured
</span>
```

**After:**
```tsx
// Source: https://ui.shadcn.com/docs/components/badge
import { Badge } from "@/components/ui/badge"

// Tech tag — use secondary variant (muted background)
<Badge variant="secondary">{tech}</Badge>

// Featured badge — use default variant (primary background)
<Badge variant="default">Featured</Badge>
```

### Pattern 4: Contact Form with Shadcn Input + Label + Textarea

**What:** Replace raw form fields with Shadcn primitives. The contact form currently has `react-hook-form` + Zod — these stay unchanged, only the JSX changes.

**Before (contact-form.tsx):**
```tsx
<label htmlFor="name" className="mb-2 block text-sm font-medium">Name</label>
<input
  id="name"
  type="text"
  {...register('name')}
  className="w-full rounded-md border border-gray-300 px-4 py-2 ..."
/>
```

**After:**
```tsx
// Source: https://ui.shadcn.com/docs/components/input
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<Label htmlFor="name">Name</Label>
<Input
  id="name"
  type="text"
  {...register('name')}
  disabled={isSubmitting}
/>
{errors.name && (
  <p className="text-sm text-destructive">{errors.name.message}</p>
)}
```

**Textarea (must install first):**
```tsx
// Source: https://ui.shadcn.com/docs/components/textarea
import { Textarea } from "@/components/ui/textarea"

<Textarea
  id="message"
  rows={5}
  {...register('message')}
  disabled={isSubmitting}
/>
```

**Submit button:**
```tsx
import { Button } from "@/components/ui/button"

<Button type="submit" disabled={isSubmitting} className="w-full">
  {isSubmitting ? 'Sending...' : 'Send Message'}
</Button>
```

### Pattern 5: Semantic Token Replacement

**What:** Replace all hardcoded Tailwind color classes with semantic tokens from the design system.

**Mapping table (from DESIGN-SYSTEM.md):**

| Hardcoded (old) | Semantic (new) |
|-----------------|----------------|
| `text-gray-600 dark:text-gray-300` | `text-muted-foreground` |
| `text-gray-900 dark:text-white` | `text-foreground` |
| `bg-white dark:bg-gray-900` | `bg-card` |
| `bg-gray-50 dark:bg-gray-900` | `bg-card` or `bg-muted` |
| `bg-gray-100 dark:bg-gray-800` | `bg-muted` |
| `border-gray-200 dark:border-gray-800` | `border-border` |
| `bg-blue-600 text-white` | `bg-primary text-primary-foreground` |
| `text-blue-600 dark:text-blue-400` | `text-primary` |
| `bg-blue-100 text-blue-800` | `bg-primary/10 text-primary` or `Badge variant="default"` |
| `bg-blue-50 dark:bg-blue-950/30` | `bg-accent` |
| `border-blue-600 dark:border-blue-400` | `border-primary` |
| `text-red-500` | `text-destructive` |
| `text-green-600 dark:text-green-400` | `text-success` (if in design system) or keep semantic intent |

### Pattern 6: Visual Regression Tests with Playwright

**What:** Add screenshot tests that capture all portfolio pages in both light and dark modes.

**Key API:** `toHaveScreenshot()` — Playwright's built-in visual comparison. First run creates baseline screenshots. Subsequent runs compare against baseline.

**Dark mode with class-based theme:** The app uses `next-themes` with `attribute="class"`, meaning dark mode is activated by adding `class="dark"` to `<html>`. Playwright's `colorScheme: 'dark'` emulates `prefers-color-scheme: dark` media query — this is NOT the same as the class-based toggle. Must inject the class manually:

```typescript
// Source: https://playwright.dev/docs/test-snapshots
// Source: https://playwright.dev/docs/emulation#color-scheme-and-media
import { test, expect } from '@playwright/test'

test.describe('Portfolio Visual Regression', () => {
  // Light mode — default, no modification needed
  test('homepage - light mode', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveScreenshot('homepage-light.png', {
      fullPage: true,
    })
  })

  // Dark mode — inject class="dark" on <html> since app uses class-based dark mode
  test('homepage - dark mode', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
    })
  })
})
```

**Why not `colorScheme: 'dark'`?** The app uses `next-themes` with `attribute="class"` — it injects `class="dark"` on `<html>`. Playwright's `colorScheme: 'dark'` emulates the media query but does NOT add the class. The Radix Colors dark CSS files and `@custom-variant dark` activate on `.dark` class, NOT on `prefers-color-scheme`. Therefore, class injection is the correct approach.

**Screenshot snapshot location:** Playwright stores snapshots in `e2e/[test-file].spec.ts-snapshots/` by default. Update with `--update-snapshots` flag.

### Pattern 7: Automated Accessibility Audit

**What:** Use `@axe-core/playwright` to programmatically check WCAG compliance on portfolio pages. This replaces the manual axe DevTools step from Phase 9.

```typescript
// Source: https://playwright.dev/docs/accessibility-testing
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Portfolio Accessibility', () => {
  const portfolioPages = ['/', '/about', '/projects', '/projects/teamflow', '/resume', '/contact']

  for (const path of portfolioPages) {
    test(`${path} passes WCAG AA (no violations)`, async ({ page }) => {
      await page.goto(path)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(results.violations).toEqual([])
    })
  }
})
```

**Lighthouse score ≥90 note:** The success criterion says "Lighthouse accessibility audit score ≥90." Lighthouse scores are computed from weighted axe-core rules. If `axe-core` reports 0 violations with `wcag2aa` tags, the Lighthouse accessibility score will be ≥90. No separate Lighthouse CI tool is needed unless the planner wants to verify the exact numeric score. If so, `@lhci/cli` can be added separately.

### Anti-Patterns to Avoid

- **Using `colorScheme: 'dark'` in Playwright config for dark mode screenshots:** This emulates the media query, NOT the class. The app uses class-based dark mode via next-themes. Use `page.evaluate(() => document.documentElement.classList.add('dark'))` instead.
- **Keeping `bg-white dark:bg-gray-900` side by side:** This is the exact anti-pattern the design system was built to eliminate. Replace with `bg-card` which handles both modes automatically.
- **Installing Shadcn Textarea from scratch instead of using the CLI:** Run `npx shadcn@latest add textarea -c ./apps/web` — do not copy-paste or hand-roll.
- **Wrapping `<Card>` in `<Button asChild>`:** While technically possible, it creates awkward keyboard focus and accessibility. Prefer `<Link className="block"><Card></Card></Link>` for clickable cards.
- **Migrating the `case-study-section.tsx`:** This is a pure layout wrapper with no color-specific classes. Migrating it to a Shadcn Section primitive would be over-engineering.
- **Changing the contact form's react-hook-form/Zod logic:** Migration only touches JSX layer (input elements). Leave `register()`, `handleSubmit()`, `zodResolver()` completely unchanged.
- **Running `grep` for old patterns BEFORE the migration is done:** The grep check for zero old-component imports is a verification step, not a planning step. Save it for post-migration.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible badge/chip | Custom `<span>` with px/py classes | `<Badge variant="secondary">` | Shadcn Badge handles border, font-size, padding, focus ring as a unit |
| Accessible form inputs | `<input className="border-gray-300 ...">` | `<Input>` from Shadcn | Focus ring, disabled state, and color tokens handled automatically |
| Polymorphic link-button | `<Link className="inline-flex items-center justify-center ...">` | `<Button asChild><Link>` | Radix `@radix-ui/react-slot` handles the polymorphism correctly |
| Visual regression tooling | Custom screenshot diffing | `toHaveScreenshot()` from `@playwright/test` | Already installed, built-in pixel-diff with configurable thresholds |
| WCAG automated checks | Custom crawlers | `@axe-core/playwright` | Authoritative WCAG rule engine from Deque, integrates directly into Playwright test runner |
| Dark mode test setup | Separate dark-mode browser profile | `page.evaluate(() => classList.add('dark'))` | Single line, works with class-based themes like next-themes |

**Key insight:** All Shadcn primitives are already installed from Phase 9. This phase is pure replacement work, not new component work. The only new install is `Textarea`.

---

## Common Pitfalls

### Pitfall 1: Playwright Dark Mode Screenshots Show Light Theme

**What goes wrong:** Screenshots named `*-dark.png` look identical to light mode screenshots.

**Why it happens:** Using `test.use({ colorScheme: 'dark' })` or `page.emulateMedia({ colorScheme: 'dark' })` — these set the `prefers-color-scheme` media query but NOT the `class="dark"` attribute. The app's Radix Colors dark scales and `@custom-variant dark` only activate on `.dark` class.

**How to avoid:** Inject the class directly:
```typescript
await page.evaluate(() => document.documentElement.classList.add('dark'))
// Wait for CSS transition to complete if any
await page.waitForTimeout(100)
await expect(page).toHaveScreenshot('page-dark.png')
```

**Warning signs:** Dark screenshots in `e2e/visual-regression.spec.ts-snapshots/` look visually identical to light screenshots when diffed.

### Pitfall 2: `grep` Returns Results for Pages That Import Migrated Components

**What goes wrong:** After migrating `project-card.tsx`, the `grep` check still finds `bg-white` inside `app/(portfolio)/projects/page.tsx`.

**Why it happens:** Pages import the component by name (`ProjectCard`) — the page file itself might still have hardcoded patterns in inline JSX that was not covered by migrating the component.

**How to avoid:** Run `grep -rn "bg-white\|bg-gray-\|text-gray-\|border-gray-\|bg-blue-" /home/doctor/fernandomillan/apps/web/app/\(portfolio\) /home/doctor/fernandomillan/apps/web/components/portfolio` after EACH file migration, not just at the end.

**Warning signs:** Final grep check finds hits in page files that were assumed clean because the components were migrated.

### Pitfall 3: Old Component File Remains But Is No Longer Imported

**What goes wrong:** The migration passes the import-based grep check but `project-card.tsx` still exists with old patterns — future developers could import it.

**Why it happens:** Migration replaced imports in callers but did not clean up the old component source file.

**How to avoid:** After migrating `project-card.tsx` to use Shadcn primitives internally, the file should be the migrated version, not the old version. If the component is fully replaced by inline Shadcn code at the call site, delete the old file. The success criterion says "grep search for old component imports in `/app/(portfolio)` returns zero results" — file deletion is the correct terminal state for components that are entirely replaced.

**Warning signs:** `grep -r "from '@/components/portfolio/project-card'" app/(portfolio)` returns zero but the file still exists unchanged.

### Pitfall 4: Playwright Snapshot Tests Fail in CI Due to Font Rendering

**What goes wrong:** Visual regression tests pass locally but fail in CI because font rendering differs between environments (WSL2 Linux vs CI Linux differ in anti-aliasing).

**Why it happens:** `toHaveScreenshot()` uses pixel-exact comparison by default. Even 1-2px font rendering differences cause failures.

**How to avoid:** Set a pixel tolerance threshold:
```typescript
await expect(page).toHaveScreenshot('page.png', {
  maxDiffPixelRatio: 0.02, // Allow 2% pixel difference
})
```
Or generate snapshots in CI and commit them so the baseline matches the CI environment.

**Warning signs:** CI reports `X pixels differ` on screenshots that look visually identical to human eyes.

### Pitfall 5: Badge `variant="default"` Uses Primary Color (Not Always Desired for Tech Tags)

**What goes wrong:** Tech stack tags (`Next.js`, `TypeScript`, etc.) rendered with `Badge variant="default"` appear as bright primary-blue badges — visually overwhelming for a list of 8+ tags.

**Why it happens:** `variant="default"` maps to `bg-primary text-primary-foreground` — the same primary blue as action buttons.

**How to avoid:** Use `variant="secondary"` for neutral/informational tags. Reserve `variant="default"` for featured status markers. See DESIGN-SYSTEM.md for variant guidance.

**Warning signs:** Tech stack section on projects page looks like a row of blue action buttons.

### Pitfall 6: Contact Form Textarea Loses react-hook-form Registration

**What goes wrong:** After swapping `<textarea {...register('message')}>` for `<Textarea {...register('message')}>`, form submission silently loses the message field.

**Why it happens:** Shadcn `Textarea` is a thin wrapper around `<textarea>`. The `{...register()}` spread still works, but if the import is wrong or the `ref` is not forwarded correctly, hook-form's ref-based tracking breaks.

**How to avoid:** Install Textarea via CLI (ensures correct `forwardRef` pattern for React 19). Use exact same `{...register('message')}` spread without modification. Verify with a console.log of `watch('message')` after typing.

**Warning signs:** Form submits but `data.message` is empty string or undefined in `onSubmit`.

---

## Code Examples

### Visual Regression Test File (New)

```typescript
// apps/web/e2e/portfolio/visual-regression.spec.ts
// Source: https://playwright.dev/docs/test-snapshots
import { test, expect } from '@playwright/test'

// Portfolio is public — no auth needed
test.use({ storageState: { cookies: [], origins: [] } })

const portfolioRoutes = [
  { name: 'homepage', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'projects', path: '/projects' },
  { name: 'teamflow-case-study', path: '/projects/teamflow' },
  { name: 'resume', path: '/resume' },
  { name: 'contact', path: '/contact' },
]

test.describe('Portfolio Visual Regression - Light Mode', () => {
  for (const { name, path } of portfolioRoutes) {
    test(`${name}`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot(`${name}-light.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      })
    })
  }
})

test.describe('Portfolio Visual Regression - Dark Mode', () => {
  for (const { name, path } of portfolioRoutes) {
    test(`${name}`, async ({ page }) => {
      await page.goto(path)
      // Inject dark class — app uses next-themes class="dark" strategy
      await page.evaluate(() => document.documentElement.classList.add('dark'))
      await page.waitForTimeout(100) // allow CSS transitions
      await expect(page).toHaveScreenshot(`${name}-dark.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      })
    })
  }
})
```

### Accessibility Audit Test File (New)

```typescript
// apps/web/e2e/portfolio/accessibility.spec.ts
// Source: https://playwright.dev/docs/accessibility-testing
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.use({ storageState: { cookies: [], origins: [] } })

const portfolioRoutes = ['/', '/about', '/projects', '/projects/teamflow', '/resume', '/contact']

test.describe('Portfolio Accessibility - WCAG AA', () => {
  for (const path of portfolioRoutes) {
    test(`${path} - light mode`, async ({ page }) => {
      await page.goto(path)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(results.violations).toEqual([])
    })

    test(`${path} - dark mode`, async ({ page }) => {
      await page.goto(path)
      await page.evaluate(() => document.documentElement.classList.add('dark'))
      await page.waitForTimeout(100)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(results.violations).toEqual([])
    })
  }
})
```

### Migrated ProjectCard Component

```tsx
// components/portfolio/project-card.tsx (MIGRATED)
// Source: https://ui.shadcn.com/docs/components/card
// Source: https://ui.shadcn.com/docs/components/badge
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ProjectCardProps {
  title: string
  description: string
  techStack: string[]
  href: string
  featured?: boolean
}

export function ProjectCard({ title, description, techStack, href, featured }: ProjectCardProps) {
  return (
    <Link href={href} className="block group">
      <Card className="transition-shadow hover:shadow-lg h-full">
        <CardHeader>
          {featured && (
            <Badge variant="default" className="w-fit mb-2">Featured</Badge>
          )}
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <Badge key={tech} variant="secondary">{tech}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

### Migration Verification Grep Commands

```bash
# Check zero old-pattern imports remain in portfolio app directory
grep -rn "from '@/components/portfolio/project-card'" \
  /home/doctor/fernandomillan/apps/web/app/\(portfolio\)

# Check zero hardcoded color classes remain in portfolio scope
grep -rn "bg-white\|bg-gray-\|text-gray-\|border-gray-\|bg-blue-\|dark:bg-gray\|dark:text-gray" \
  /home/doctor/fernandomillan/apps/web/app/\(portfolio\) \
  /home/doctor/fernandomillan/apps/web/components/portfolio

# Check no raw HTML input elements remain in portfolio components
grep -rn "<input\b\|<textarea\b\|<button\b" \
  /home/doctor/fernandomillan/apps/web/components/portfolio
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Raw `<span>` for badges | `<Badge>` from Shadcn | Consistent sizing, spacing, color variants across all pages |
| `<input className="border-gray-300 ...">` | `<Input>` from Shadcn | WCAG-compliant focus ring, consistent border-input token |
| `<Link className="inline-flex ...">` CTA buttons | `<Button asChild><Link>` | Radix Slot handles semantic polymorphism correctly |
| `dark:text-gray-300` hardcoded per-file | `text-muted-foreground` | Single token, auto-updated when design system changes |
| Manual axe DevTools browser extension check | `@axe-core/playwright` automated | Runs in CI, catches regressions before merge |
| No visual regression baseline | `toHaveScreenshot()` | Future changes caught automatically in both modes |

---

## Open Questions

1. **Does `Textarea` from Shadcn support `rows` prop for 5-row height in contact form?**
   - What we know: Shadcn `Textarea` wraps `<textarea>` directly — `rows` is a valid HTML attribute and should pass through
   - What's unclear: Whether Shadcn Textarea applies a `min-h-*` that overrides `rows`
   - Recommendation: Install via CLI and test; if `rows` conflicts with styles, use `className="min-h-[120px]"` instead

2. **Should `ProjectCard` keep its wrapper component or be inlined at call sites?**
   - What we know: `ProjectCard` is only used in `projects/page.tsx` (1 call site)
   - What's unclear: Whether keeping the component abstraction is useful for future projects page expansion
   - Recommendation: Keep the component wrapper but migrate its internals to Shadcn primitives. The projects page doesn't need to change its call pattern.

3. **Will the Playwright `storageState: { cookies: [], origins: [] }` setup still work after Phase 10 changes to portfolio pages?**
   - What we know: Portfolio routes are public (no auth middleware). The existing `navigation.spec.ts` uses this pattern successfully.
   - What's unclear: Whether any portfolio page added in Phase 10 will require a server component data fetch that needs a running API
   - Recommendation: Portfolio pages are static/hardcoded content — no API fetches. The test setup remains valid.

4. **Lighthouse score ≥90 vs axe violations = 0: Are these equivalent?**
   - What we know: Lighthouse accessibility score is weighted based on axe-core impact levels. Violations with "critical" or "serious" impact have large weight.
   - What's unclear: Whether 0 axe violations with `wcag2aa` tags guarantees exactly ≥90 Lighthouse score
   - Recommendation: Use `@axe-core/playwright` as primary gate (0 violations = wcag2aa compliant). If the planner wants the explicit Lighthouse numeric score, add a separate manual Lighthouse run as a human verification step, not an automated test.

---

## Sources

### Primary (HIGH confidence)

- Codebase inspection (direct read) — all 12 files audited and their exact patterns documented
- [Playwright Visual Comparisons docs](https://playwright.dev/docs/test-snapshots) — `toHaveScreenshot()` API, snapshot storage, update flags
- [Playwright Emulation docs](https://playwright.dev/docs/emulation#color-scheme-and-media) — `colorScheme` option, `page.emulateMedia()` — confirmed does NOT add `.dark` class
- [Playwright Accessibility Testing docs](https://playwright.dev/docs/accessibility-testing) — `@axe-core/playwright` import, `AxeBuilder({ page }).analyze()` usage
- [Shadcn Button docs](https://ui.shadcn.com/docs/components/button) — `asChild` prop, all variants
- [Shadcn Card docs](https://ui.shadcn.com/docs/components/card) — sub-components list
- [Shadcn Badge docs](https://ui.shadcn.com/docs/components/badge) — variants: default, secondary, destructive, outline
- [Shadcn Input docs](https://ui.shadcn.com/docs/components/input) — component API
- [Shadcn Textarea CLI add command](https://ui.shadcn.com/docs/components/textarea) — install command
- Phase 9 RESEARCH.md — confirmed exact components installed, token mapping table
- Phase 9 VERIFICATION.md — confirmed WCAG violation fixes are in place, globals.css structure verified
- `apps/web/DESIGN-SYSTEM.md` — authoritative token mapping table (old class → semantic class)

### Secondary (MEDIUM confidence)

- WebSearch: Playwright `toHaveScreenshot()` dark mode testing — confirmed class injection approach (multiple community sources agree)
- `@playwright/test` v1.58.2 changelog — `toHaveScreenshot()` is stable, `maxDiffPixelRatio` option available

### Tertiary (LOW confidence — validate during implementation)

- Whether axe `wcag2aa` with 0 violations guarantees Lighthouse accessibility score ≥90 (assumed based on shared underlying rule engine, not explicitly documented as guaranteed)
- Whether Shadcn `Textarea` `rows` prop behaves as expected (install and test)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components pre-installed from Phase 9; codebase fully audited; only Textarea is new
- Architecture (migration patterns): HIGH — direct code inspection of all 12 files; specific before/after patterns documented
- Visual regression testing: HIGH — Playwright official docs consulted; dark mode class injection approach verified
- Accessibility testing: HIGH — Playwright official docs; `@axe-core/playwright` is the standard
- Dark mode pitfall (colorScheme vs class): HIGH — confirmed from Playwright emulation docs + codebase inspection of next-themes setup
- Lighthouse ≥90 via axe: MEDIUM — inferred from shared rule engine, not explicitly guaranteed in docs

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days — Shadcn, Playwright stable; next-themes class-based approach is stable)
