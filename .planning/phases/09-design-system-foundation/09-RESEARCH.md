# Phase 9: Design System Foundation - Research

**Researched:** 2026-02-16
**Domain:** Shadcn UI + Radix Colors + Tailwind v4 + ESLint governance
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Component selection & priority
- Install all components at once (single installation pass, not incremental)
- Claude decides which 5-8 primitives to install based on Phase 10 (portfolio migration) needs — at minimum Button, Card, Input, Label, Dialog
- Skip Storybook — verify components in-app instead (Claude chooses the verification approach)

#### Color system & WCAG fixes
- Apply Phase 8 WCAG audit fixes **during** Shadcn setup — single unified color migration, not separate steps
- Use **Radix Colors as the color foundation** (`@radix-ui/colors`) — map scales to CSS variables
- Primary color selection: Claude picks a WCAG-compliant Radix blue scale (looks professional — NO purple)
- Token naming convention: Claude decides, aligned with Shadcn CSS variable conventions

#### Dark mode strategy
- **Replace** the existing dark mode system with new Radix Colors-based system (not extend)
- Use **separate light and dark scales** from Radix Colors (e.g., blue + blueDark) — separately tuned for each mode, not inverted
- Toggle behavior: **System preference default + manual override** — user preference persisted
- Color format (OKLCH vs P3/sRGB): Claude decides based on Tailwind v4 + Radix Colors compatibility

#### Governance & migration rules
- ESLint rules: **Hard errors (build fails)** on deprecated patterns
- Scope: Hard errors apply to **new files only** — existing files exempt until migrated in Phases 10-12
- What to flag: Claude audits existing `/components/ui` and determines what patterns to restrict
- Documentation: Create a brief **DESIGN-SYSTEM.md** README listing available components with basic usage examples

### Claude's Discretion
- Exact component set beyond the core 5 (Button, Card, Input, Label, Dialog)
- In-app verification approach for component light/dark rendering
- Primary blue scale selection from Radix Colors
- CSS variable naming conventions for design tokens
- Color format (OKLCH/P3/HSL) choice for Tailwind v4 integration
- Which specific old patterns the ESLint rules should target

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COLOR-01 | Color system migrated to Radix Colors foundation | Radix Colors v3 CSS import patterns, aliasing strategy |
| COLOR-02 | WCAG AA compliance for all color tokens (0 violations) | Phase 8 audit identified 10 violations, 6 CSS property fixes documented |
| COLOR-03 | Dual-mode (light/dark) with separate Radix scales | @radix-ui/colors provides `blue.css` + `blue-dark.css` with `.dark` class targeting |
| COLOR-04 | System preference default + manual override persisted | next-themes already installed, supports `defaultTheme="system"` + localStorage |
| COMP-01 | Shadcn UI CLI initialized and configured with Tailwind v4 | `npx shadcn@latest init -c ./apps/web` in Tailwind v4 mode |
| COMP-02 | 5-8 primitives installed rendering in light and dark modes | CLI `add` command for multiple components in one pass |
| COMP-05 | ESLint rules prevent importing old component patterns | `no-restricted-imports` in flat config with file-scoped overrides |
</phase_requirements>

---

## Summary

Phase 9 installs Shadcn UI on an existing Next.js 15 + Tailwind v4 project. The project already has `next-themes`, `clsx`, `tailwind-merge`, `cmdk`, `lucide-react`, and several `@radix-ui/*` primitives installed. Shadcn has NOT been initialized yet — no `components.json` exists. The project uses `@tailwindcss/postcss` (Tailwind v4 CSS-first, no tailwind.config.js). Globals.css already uses `@theme {}` with OKLCH values and `.dark {}` class overrides via `next-themes` attribute="class".

The Radix Colors integration strategy is: import raw CSS files from `@radix-ui/colors` (e.g., `blue.css`, `blue-dark.css`) which auto-scope to `:root` and `.dark` respectively. Then alias specific scale steps to Shadcn-compatible semantic variables (`--background`, `--primary`, etc.) within `@theme inline {}`. This replaces the existing hand-rolled OKLCH tokens and fixes all 10 Phase 8 WCAG violations in one pass.

ESLint governance is achievable via flat config `no-restricted-imports` scoped to new files using the `files` property — existing files are excluded by not matching them, achieving the "new files only" requirement without touching existing code.

**Primary recommendation:** Run `npx shadcn@latest init -c ./apps/web` from the repo root, then `npx shadcn@latest add button card input label dialog badge separator sonner -c ./apps/web`. Replace globals.css entirely with Radix Colors imports + semantic aliasing. Add `@custom-variant dark` for Tailwind v4 dark mode compatibility.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui CLI | latest | Component scaffold, installs to `apps/web/components/ui/` | Official CLI handles all import/path wiring |
| @radix-ui/colors | 3.0.0 | Color foundation CSS files | Official Radix color system, WCAG-designed scales |
| tw-animate-css | latest | Shadcn animation utilities | Replaces deprecated `tailwindcss-animate` in Tailwind v4 |
| next-themes | 0.4.6 (already installed) | System/manual theme toggle, localStorage persistence | Already used in project, compatible |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.1.1 (already installed) | Conditional class names | Already used — no change needed |
| tailwind-merge | 3.4.1 (already installed) | Deduplicate Tailwind classes | Already used — no change needed |
| lucide-react | 0.564.0 (already installed) | Icons for Shadcn components | Already used — no change needed |
| eslint-config-next | (via Next.js) | Base ESLint config for Next.js | Required for flat config setup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @radix-ui/colors raw CSS | tailwindcss-radix-colors plugin | Plugin approach works in v4 but adds a dependency; raw CSS is simpler and official |
| @radix-ui/colors raw CSS | radix-colors-tailwind | Community package, less stable than official |
| Shadcn new-york style | Shadcn default style | `new-york` is the new standard (default was deprecated in 2025) |
| sonner (toast) | deprecated shadcn toast | Toast component officially deprecated; sonner is the replacement |

**Installation commands (from repo root):**
```bash
# Step 1: Install Radix Colors
npm install @radix-ui/colors --workspace=apps/web

# Step 2: Install tw-animate-css (Shadcn Tailwind v4 animation dep)
npm install tw-animate-css --workspace=apps/web

# Step 3: Initialize Shadcn (creates components.json, updates globals.css)
npx shadcn@latest init -c ./apps/web -y

# Step 4: Add components in single pass
npx shadcn@latest add button card input label dialog badge separator sonner -c ./apps/web -y
```

---

## Architecture Patterns

### Recommended Project Structure
```
apps/web/
├── components/
│   └── ui/                     # Shadcn-installed components (NEW)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── dialog.tsx
│       ├── badge.tsx
│       ├── separator.tsx
│       ├── sonner.tsx
│       ├── skeleton.tsx        # EXISTING — migrated in Phase 10
│       ├── theme-toggle.tsx    # EXISTING — migrated in Phase 10
│       ├── command-palette.tsx # EXISTING — migrated in Phase 10
│       ├── empty-state.tsx     # EXISTING — migrated in Phase 10
│       └── conflict-warning.tsx # EXISTING — migrated in Phase 10
├── app/
│   └── globals.css             # REPLACED — Radix Colors imports + @theme inline
├── lib/
│   └── utils.ts                # UNCHANGED — cn() already correct
├── components.json             # NEW — Shadcn configuration
├── DESIGN-SYSTEM.md            # NEW — Component catalog
└── eslint.config.mjs           # NEW — Governance rules
```

### Pattern 1: Shadcn Init for Existing Tailwind v4 Project

**What:** `npx shadcn@latest init` detects Tailwind v4 (via `@tailwindcss/postcss` in postcss.config.mjs) and configures appropriately.

**Key:** Run from repo root with `-c ./apps/web` — CLI writes `components.json` into the app directory, not the monorepo root.

**What init creates:**
- `apps/web/components.json` — component registry config
- Updates `apps/web/app/globals.css` — adds Shadcn CSS variable stubs
- Adds dependencies to `apps/web/package.json`

**What init does NOT do:** It does not replace your existing color tokens or fix WCAG violations — that is a manual step.

**Expected `components.json` for this project:**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**Note:** `tailwind.config` is intentionally empty for Tailwind v4. The `@` alias maps to the app root via tsconfig.json `paths` (already configured as `"@/*": ["./*"]`).

### Pattern 2: Radix Colors CSS Import + Semantic Aliasing

**What:** Import Radix Colors CSS files directly into globals.css. Light scales auto-apply to `:root`. Dark scales auto-apply to `.dark` class (which next-themes adds to `<html>`).

**Color format decision:** Use Radix Colors' native format (hex/P3 in CSS files). Do NOT convert to OKLCH. Radix Colors are WCAG-validated in their native format; converting introduces rounding errors. Map to Tailwind via `@theme inline {}` which accepts any CSS value.

**Recommended globals.css structure:**
```css
@import "tailwindcss";
@import "tw-animate-css";

/* Radix Colors — light scales (apply to :root and .light) */
@import "@radix-ui/colors/slate.css";
@import "@radix-ui/colors/blue.css";
@import "@radix-ui/colors/red.css";
@import "@radix-ui/colors/green.css";
@import "@radix-ui/colors/amber.css";
@import "@radix-ui/colors/slate-alpha.css";
@import "@radix-ui/colors/blue-alpha.css";

/* Radix Colors — dark scales (apply to .dark and .dark-theme) */
@import "@radix-ui/colors/slate-dark.css";
@import "@radix-ui/colors/blue-dark.css";
@import "@radix-ui/colors/red-dark.css";
@import "@radix-ui/colors/green-dark.css";
@import "@radix-ui/colors/amber-dark.css";
@import "@radix-ui/colors/slate-dark-alpha.css";
@import "@radix-ui/colors/blue-dark-alpha.css";

/* Enable class-based dark mode (next-themes uses attribute="class") */
@custom-variant dark (&:where(.dark, .dark *));

/* Semantic token aliasing — map Radix steps to Shadcn variable names */
:root {
  --radius: 0.5rem;

  /* Backgrounds */
  --background: var(--slate-1);
  --foreground: var(--slate-12);

  --card: var(--slate-2);
  --card-foreground: var(--slate-12);

  --popover: var(--slate-1);
  --popover-foreground: var(--slate-12);

  /* Primary (Blue) */
  --primary: var(--blue-9);
  --primary-foreground: white;

  /* Secondary */
  --secondary: var(--slate-3);
  --secondary-foreground: var(--slate-11);

  /* Muted */
  --muted: var(--slate-3);
  --muted-foreground: var(--slate-11);

  /* Accent */
  --accent: var(--blue-3);
  --accent-foreground: var(--blue-11);

  /* Destructive */
  --destructive: var(--red-9);
  --destructive-foreground: white;

  /* Success */
  --success: var(--green-9);
  --success-foreground: white;

  /* Warning — use amber-9 (dark text) NOT amber as background with dark fg */
  --warning: var(--amber-9);
  --warning-foreground: var(--amber-12);

  /* UI elements */
  --border: var(--slate-6);
  --input: var(--slate-6);
  --ring: var(--blue-8);
}

/* @theme inline — expose semantic tokens as Tailwind utilities */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius: var(--radius);
}
```

**Why blue-9 for primary?** Blue-9 is Radix's highest-chroma step — purest, most saturated blue. It pairs with white text (WCAG verified by Radix). The separate dark-scale `blue-dark.css` auto-applies under `.dark`, so `--blue-9` in dark mode is a lighter, display-optimized blue that also pairs with white.

**Why this fixes Phase 8 violations:**
- `muted-foreground/muted`: slate-11 on slate-3 — Radix guarantees Lc 60+ APCA for step 11 on step 3
- `accent-foreground/accent`: blue-11 on blue-3 — Radix guarantees text contrast for step 11
- `warning-foreground/warning`: amber-12 on amber-9 — step 12 on step 9 satisfies 4.5:1
- `border/background`: slate-6 on slate-1 — Radix step 6 designed for visible non-interactive borders (3:1+)
- `input/background`: slate-6 on slate-1 — same fix
- Dark mode border/input: `blue-dark.css` re-tunes slate-6 for dark backgrounds automatically

### Pattern 3: next-themes Already Configured Correctly

**What:** The project already has the correct next-themes setup:
- `layout.tsx` has `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`
- This writes `class="dark"` to `<html>` element, which is what both next-themes and Radix Colors dark scales target
- The existing `ThemeToggle` component cycles light → dark → system correctly
- `localStorage` persistence is built into next-themes — no changes needed

**What changes:** Add `@custom-variant dark (&:where(.dark, .dark *))` to globals.css so Tailwind v4's `dark:` utilities activate on the `.dark` class (not just system media query).

**Note:** The existing `ThemeToggle` does not need to change in Phase 9. It already persists the theme correctly. Migration to use Shadcn Button happens in Phase 10.

### Pattern 4: ESLint Governance — New Files Only

**What:** ESLint flat config (`eslint.config.mjs`) with `no-restricted-imports` rule scoped to new files only. Existing files remain untouched.

**Strategy:** Instead of listing every existing file to exempt, scope restrictions to a future-forward path: any file NOT in the existing component directories. The practical approach: restrict hardcoded patterns in `components/**/*.tsx` but add `ignores` for the existing files.

**Simpler approach:** Apply restrictions globally but use `ignores` array to exclude all currently-existing files:

```javascript
// eslint.config.mjs
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // Governance: hard errors on deprecated patterns in NEW files only
  // Existing files are listed in ignores below
  {
    files: ['components/**/*.tsx', 'app/**/*.tsx'],
    ignores: [
      // Existing files exempt until migrated in Phases 10-12
      'components/ui/skeleton.tsx',
      'components/ui/theme-toggle.tsx',
      'components/ui/command-palette.tsx',
      'components/ui/empty-state.tsx',
      'components/ui/conflict-warning.tsx',
      'components/tasks/**',
      'components/projects/**',
      'components/portfolio/**',
      'components/activity/**',
      'components/auth/**',
      'components/layout/**',
      'components/teams/**',
      'components/providers/**',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['**/components/ui/skeleton', '**/components/ui/empty-state'],
            message: 'Import from @/components/ui/* Shadcn components instead. Old custom UI components are deprecated.',
          },
        ],
        paths: [
          // Prevent importing from old hand-rolled pattern locations
        ],
      }],
      // Restrict hardcoded Tailwind color classes in new files
      // Note: ESLint cannot check className strings — use custom rule or code review
    },
  },
];
```

**Limitation (CRITICAL):** ESLint `no-restricted-imports` only restricts import statements, NOT className string contents. The 285 uses of `dark:`, `bg-gray-*`, etc. in className attributes cannot be caught by standard ESLint rules. Options:
1. Use `eslint-plugin-tailwindcss` with restricted class patterns (MEDIUM confidence — may not support Tailwind v4 fully)
2. Accept that className restrictions are enforced via code review + PR checklist in Phases 10-12
3. Add a comment in DESIGN-SYSTEM.md stating new files must use semantic tokens

**Recommended:** Use `no-restricted-imports` for import-level restrictions, document className token requirement in DESIGN-SYSTEM.md, treat as code review gate.

### Pattern 5: In-App Component Verification (No Storybook)

**What:** Create a `/app/(dashboard)/design-system/page.tsx` route that renders all installed components in both light and dark modes side by side.

**Approach:**
```tsx
// apps/web/app/(dashboard)/design-system/page.tsx
// Protected route showing all Shadcn components
// ThemeToggle in layout allows testing light/dark switching
// Verify: visual appearance, no console errors, WCAG contrast
```

**Verification checklist:**
1. Visit `/design-system` in browser
2. Toggle light mode — all components render correctly
3. Toggle dark mode — all components render correctly (colors shift via Radix dark scales)
4. Run axe DevTools browser extension — target: 0 color contrast violations
5. Inspect CSS variables in DevTools: confirm `--blue-9` resolves to Radix value in light, different value in dark

### Anti-Patterns to Avoid

- **Importing Shadcn components from `packages/ui`:** This project installs Shadcn into `apps/web` directly, not into a shared package. No shared UI package exists yet.
- **Leaving `.dark` block in globals.css:** The old hand-rolled `.dark {}` block must be REMOVED. Radix dark CSS files handle dark mode automatically.
- **Using `@theme {}` (not inline):** Shadcn Tailwind v4 requires `@theme inline {}` — the `inline` keyword is required to make variables available as utility class references.
- **Running init from `apps/web` directory:** Run from repo root with `-c ./apps/web` — this ensures workspace-level package.json is found correctly.
- **Installing the deprecated `toast` component:** Use `sonner` instead. `npx shadcn@latest add toast` shows deprecation error.
- **Using OKLCH to represent Radix Colors:** Radix Colors CSS files use hex/P3 format. Mapping them to OKLCH requires conversion — unnecessary complexity. Use the imported CSS variables directly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color scales for light/dark | Custom OKLCH variables | @radix-ui/colors CSS files | 12-step WCAG-validated scales, dark variants auto-scoped to `.dark` |
| Component styling primitives | Custom Button/Card/Input | shadcn/ui via CLI | Components copy to codebase, fully customizable, no runtime dependency |
| Animation utilities | Custom CSS keyframes | tw-animate-css | Built for Tailwind v4, includes accordion-down/up, caret-blink |
| Theme persistence | Custom localStorage hooks | next-themes | Already installed, handles SSR hydration mismatch, system preference |
| Class merging | Custom merge utility | tailwind-merge (already used) | Handles Tailwind variant deduplication correctly |

**Key insight:** Shadcn's value is copy-to-codebase ownership, not a runtime library. The CLI scaffolds components that you fully own — resist the urge to customize before installing, install first then modify.

---

## Common Pitfalls

### Pitfall 1: Tailwind v4 Dark Mode Not Activating

**What goes wrong:** Dark mode CSS variables don't apply even when `class="dark"` is on `<html>`. Components render identically in light and dark.

**Why it happens:** Tailwind v4 defaults to `prefers-color-scheme` media query for `dark:` utilities. The `@custom-variant dark` line is missing from globals.css.

**How to avoid:** Add `@custom-variant dark (&:where(.dark, .dark *));` to globals.css BEFORE any `@theme` declarations. This must appear before `@theme inline` or component imports.

**Warning signs:** ThemeToggle switches class on `<html>` but no visual change occurs.

### Pitfall 2: Shadcn Init Overwrites Custom globals.css

**What goes wrong:** `npx shadcn@latest init` replaces globals.css with Shadcn's default HSL variables, erasing the Radix Colors imports.

**Why it happens:** Init generates a boilerplate globals.css with HSL-based variables. The Radix Colors migration is a SEPARATE step after init.

**How to avoid:** Run init first, then REPLACE the generated globals.css content with the Radix Colors import structure. Init creates `components.json` — that's the main artifact needed. The globals.css content from init is a starting reference, not the final state.

**Warning signs:** globals.css contains `--background: hsl(0 0% 100%)` — this means Radix Colors have not been applied yet.

### Pitfall 3: @radix-ui/colors CSS Files Not Found at Import

**What goes wrong:** Browser shows 404 or build errors for `@import "@radix-ui/colors/blue.css"`.

**Why it happens:** The package is not installed, or the workspace install didn't link it to `apps/web/node_modules`.

**How to avoid:** Install with `npm install @radix-ui/colors --workspace=apps/web` (not at root). Verify `apps/web/node_modules/@radix-ui/colors/` exists. Tailwind v4 resolves `@import` statements relative to the CSS file's location and node_modules.

**Warning signs:** Hot reload shows `Cannot resolve module '@radix-ui/colors/blue.css'`.

### Pitfall 4: ESLint Config Not Found by Next.js Build

**What goes wrong:** `npm run build` does not fail on deprecated import violations — governance has no effect.

**Why it happens:** Next.js 15 requires specific flat config setup. The `next/core-web-vitals` and `next/typescript` extends must use `FlatCompat` compatibility layer, otherwise Next.js lint ignores the config.

**How to avoid:** Use `@eslint/eslintrc` FlatCompat helper for Next.js extends. Test with `npx eslint apps/web/components/someNewFile.tsx` before declaring governance complete. Also ensure `next.config.ts` does not have `eslint: { ignoreDuringBuilds: true }`.

**Warning signs:** `next build` completes without reporting any lint errors even when you import a restricted module.

### Pitfall 5: Radix Colors Dark Scale Not Applying

**What goes wrong:** In dark mode, colors don't change — `--blue-9` resolves to same value in both modes.

**Why it happens:** `blue-dark.css` was not imported, OR the CSS import order matters (dark must come after light), OR next-themes is using `data-theme` attribute instead of `class`.

**How to avoid:** Import `blue-dark.css` after `blue.css`. Verify next-themes `attribute="class"` prop is set on `ThemeProvider` (it already is in this project's `layout.tsx`). Radix dark files target `.dark` class on root — confirm `<html class="dark">` in DevTools when dark mode is active.

**Warning signs:** DevTools shows `--blue-9` has the same hex value regardless of theme.

### Pitfall 6: components.json Alias Mismatch

**What goes wrong:** After init, `npx shadcn@latest add button` installs to wrong path or uses wrong import alias.

**Why it happens:** The `@` alias in components.json must match tsconfig.json paths. This project already has `"@/*": ["./*"]` in `apps/web/tsconfig.json`, so `@/components/ui` resolves to `apps/web/components/ui/`.

**How to avoid:** After init, verify `components.json` has `"ui": "@/components/ui"` and `"utils": "@/lib/utils"`. These must match exactly.

**Warning signs:** Installed Button component imports `@/components/ui/utils` which doesn't exist.

---

## Code Examples

Verified patterns from official sources:

### Shadcn Init (from repo root)
```bash
# Source: https://ui.shadcn.com/docs/cli
npx shadcn@latest init -c ./apps/web -y
```

### Shadcn Add Multiple Components (single pass)
```bash
# Source: https://ui.shadcn.com/docs/cli
npx shadcn@latest add button card input label dialog badge separator sonner -c ./apps/web -y
```

### Radix Colors CSS Import Pattern
```css
/* Source: https://www.radix-ui.com/colors/docs/overview/usage */
@import "@radix-ui/colors/blue.css";
@import "@radix-ui/colors/blue-dark.css";
/* Provides: --blue-1 through --blue-12, scoped to :root (light) and .dark (dark) */
```

### Tailwind v4 @custom-variant for Class Dark Mode
```css
/* Source: https://tailwindcss.com/docs/dark-mode */
@custom-variant dark (&:where(.dark, .dark *));
/* Now dark: utilities activate when .dark class is on any ancestor element */
```

### Semantic Aliasing Pattern (Radix → Shadcn style)
```css
/* Source: https://www.radix-ui.com/colors/docs/overview/aliasing */
:root {
  --primary: var(--blue-9);     /* solid background */
  --accent-foreground: var(--blue-11); /* accessible text */
  --border: var(--slate-6);     /* subtle interactive border */
}
/* .dark applied via blue-dark.css import — no manual .dark overrides needed */
```

### @theme inline Exposure
```css
/* Source: https://ui.shadcn.com/docs/theming */
@theme inline {
  --color-primary: var(--primary);
  --color-border: var(--border);
  /* etc. — now bg-primary, text-border work as Tailwind utilities */
}
```

### ESLint Flat Config with File Scoping
```javascript
/* Source: https://eslint.org/docs/latest/rules/no-restricted-imports */
export default [
  {
    files: ['components/**/*.tsx'],
    ignores: ['components/ui/skeleton.tsx', 'components/tasks/**', /* ...existing files */],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['**/components/ui/skeleton', '**/components/ui/empty-state'],
            message: 'Use Shadcn UI components from @/components/ui instead.',
          },
        ],
      }],
    },
  },
];
```

### Component Usage After Installation
```tsx
/* Source: https://ui.shadcn.com/docs/components/button */
import { Button } from "@/components/ui/button"

export default function Example() {
  return <Button variant="default">Save changes</Button>
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwindcss-animate` plugin | `tw-animate-css` CSS import | March 2025 | Must use `@import "tw-animate-css"` not `@plugin` |
| Shadcn `default` style | Shadcn `new-york` style | 2025 | `new-york` is now the standard; use it for all new installs |
| `toast` component | `sonner` component | 2024 | `toast` shows deprecation error in CLI |
| `tailwind.config.js` for dark mode | `@custom-variant dark` in CSS | Tailwind v4 | Dark mode config moved from JS to CSS |
| `forwardRef` in component code | Direct props (removed `forwardRef`) | React 19 / 2025 | Shadcn components updated to remove `forwardRef` |
| HSL color variables | OKLCH (Shadcn default) or native (Radix) | 2025 | Shadcn defaults to OKLCH; we use Radix native format |
| `@layer base` for `:root` variables | `:root` and `.dark` outside `@layer` | Tailwind v4 | CSS variables must be outside `@layer` for `@theme inline` to reference them |

**Deprecated/outdated in this project:**
- `@theme {}` (without `inline`): Must become `@theme inline {}` — the current globals.css uses the non-inline form which is less compatible with Shadcn component expectations
- Hand-rolled `.dark {}` overrides in globals.css: Replace entirely with Radix dark CSS file imports
- Hardcoded `dark:bg-gray-*` / `dark:text-gray-*` classes: Deprecated in new files (Phase 10-12 migration)

---

## Recommended Component Set (Claude's Discretion)

Based on Phase 10 (portfolio migration) needs and the existing codebase:

**Core 5 (required by user):** Button, Card, Input, Label, Dialog

**Additional 3 recommended:**
- **Badge** — used in portfolio project cards for tech stack tags, currently `bg-gray-100 rounded-md` spans
- **Separator** — used in nav and layout dividers
- **Sonner** — replaces any future toast notifications (no existing usage, but core utility)

**Final install set (8 total):** Button, Card, Input, Label, Dialog, Badge, Separator, Sonner

**Skip for Phase 9 (install in Phase 10-12 as needed):** Select, Dropdown, Sheet, Tabs, Form, Switch, Checkbox — these require specific feature migration context.

---

## CSS Variable Naming Convention (Claude's Discretion)

**Recommendation:** Use Shadcn's exact variable names without prefix. This ensures Shadcn-installed components work without modification.

- Semantic names: `--background`, `--foreground`, `--primary`, `--primary-foreground`, etc.
- NOT prefixed (avoid `--color-primary` in `:root` — that conflicts with `@theme inline --color-primary: var(--primary)`)
- `@theme inline` adds the `--color-` prefix for Tailwind utilities

This is exactly what the existing `globals.css` already does (it uses `--color-background` directly in `@theme {}`) — however, after the Radix Colors migration, we move to a two-layer approach: plain `--background` in `:root`, then `--color-background: var(--background)` in `@theme inline`.

---

## Color Format Decision (Claude's Discretion)

**Recommendation: Use Radix Colors native format (hex/P3) — do NOT convert to OKLCH**

Reasons:
1. Radix Colors v3 CSS files are WCAG-validated in their native format. Converting introduces floating-point rounding that can drift contrast ratios.
2. Tailwind v4 `@theme inline` accepts any CSS color format — no OKLCH requirement.
3. Radix Colors already handle P3 wide-gamut where supported via `@supports (color: color(display-p3 0 0 0))` fallbacks in their CSS files.
4. The existing globals.css uses OKLCH for custom tokens, but those are REPLACED — not extended.
5. One exception: `--radius` remains unitless via Shadcn convention.

---

## Open Questions

1. **Does `npx shadcn@latest init` conflict with existing globals.css @theme syntax?**
   - What we know: Init generates new globals.css content; the `-y` flag accepts defaults without prompting
   - What's unclear: Whether init detects existing Tailwind v4 `@theme` and preserves it or overwrites
   - Recommendation: Run init, then completely replace globals.css content with Radix Colors structure. Treat init as creating `components.json` only.

2. **Does `next build` enforce ESLint by default in Next.js 15?**
   - What we know: Next.js 14+ runs ESLint during `next build` unless `eslint.ignoreDuringBuilds: true` in next.config
   - What's unclear: Current next.config.ts does not set `ignoreDuringBuilds` — build should lint
   - Recommendation: Verify by running `npm run build` after adding eslint.config.mjs and check for lint output

3. **@radix-ui/colors workspace install path for npm workspaces**
   - What we know: npm workspaces with `--workspace=apps/web` flag installs to that workspace's package.json
   - What's unclear: Whether `@tailwindcss/postcss` in `apps/web` can resolve `@import "@radix-ui/colors/..."` from `apps/web/node_modules/` vs hoisted `node_modules/`
   - Recommendation: Install at workspace level AND verify with `ls apps/web/node_modules/@radix-ui/colors/` after install. If not found locally, npm may hoist to root (which also works for CSS resolution).

---

## Sources

### Primary (HIGH confidence)
- [Shadcn UI Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — init process, @theme inline, animation library change
- [Shadcn UI CLI docs](https://ui.shadcn.com/docs/cli) — all command flags including `--cwd`, `--all`, multi-component add
- [Shadcn UI Theming docs](https://ui.shadcn.com/docs/theming) — CSS variable list, naming conventions
- [Shadcn UI Monorepo docs](https://ui.shadcn.com/docs/monorepo) — components.json setup for workspace
- [Radix Colors Usage docs](https://www.radix-ui.com/colors/docs/overview/usage) — CSS import paths, light/dark scope
- [Radix Colors Aliasing docs](https://www.radix-ui.com/colors/docs/overview/aliasing) — semantic variable mapping pattern
- [Radix Colors Scale Understanding](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) — 12-step semantics, APCA guarantees for step 11/12
- [Radix Colors Installation docs](https://www.radix-ui.com/colors/docs/overview/installation) — version 3.0.0 confirmed
- [Tailwind v4 Dark Mode docs](https://tailwindcss.com/docs/dark-mode) — @custom-variant dark syntax
- Phase 8 WCAG audit: `/home/doctor/fernandomillan/.planning/phases/08-foundation-validation/WCAG-COLOR-AUDIT.md` — 10 violations, 6 CSS property fixes
- Project globals.css: `/home/doctor/fernandomillan/apps/web/app/globals.css` — existing OKLCH token structure
- Project layout.tsx: `/home/doctor/fernandomillan/apps/web/app/layout.tsx` — next-themes already configured

### Secondary (MEDIUM confidence)
- [Notes of Dev: Radix Colors + Tailwind](https://notesofdev.com/blog/using-radix-colors-with-tailwind-css) — @theme pattern for Tailwind v4, verified against official docs
- [ESLint no-restricted-imports rule](https://eslint.org/docs/latest/rules/no-restricted-imports) — files/ignores pattern for scoping
- WebSearch: Shadcn deprecates `toast` → `sonner` (confirmed by multiple sources including Shadcn GitHub issues)
- WebSearch: `tw-animate-css` replaces `tailwindcss-animate` (confirmed by Shadcn changelog reference)

### Tertiary (LOW confidence — validate during implementation)
- Workspace-level npm install behavior for CSS @import resolution (test during implementation)
- ESLint flat config with Next.js 15 flat config compatibility (active GitHub issues exist; test with build)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries verified via official docs, versions confirmed
- Architecture: HIGH — CSS import pattern verified via Radix official docs; Shadcn init flow verified via CLI docs
- WCAG fix via Radix: HIGH — Radix scale semantics documented with APCA guarantees; Phase 8 violations map directly to Radix steps
- ESLint governance: MEDIUM — `no-restricted-imports` with files scoping is documented; Next.js flat config compatibility has known edge cases
- Pitfalls: HIGH — Most derived from official docs and verified project codebase inspection

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days — Shadcn and Tailwind are stable at this point)
