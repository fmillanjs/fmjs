# Architecture Research: Design System Integration

**Domain:** Design System Integration with Next.js 15 + Tailwind v4
**Researched:** 2026-02-16
**Confidence:** HIGH

## Integration Overview

This architecture document focuses on how Shadcn UI, design tokens, and accessibility features integrate with the existing TeamFlow monorepo architecture (Next.js 15 App Router + Tailwind v4).

### Existing Architecture Summary

```
teamflow/
├── apps/
│   ├── web/              # Next.js 15 + React 19 frontend
│   └── api/              # NestJS backend
├── packages/
│   ├── shared/           # Types and validators
│   ├── database/         # Prisma client
│   └── config/           # Shared configurations
```

**Current State:**
- Tailwind CSS v4 installed (`@tailwindcss/postcss: ^4.1.18`)
- PostCSS configured (`postcss.config.mjs`)
- Design tokens already defined in `globals.css` using `@theme` directive
- Path aliases configured (`@/*` pointing to app root)
- Utility functions exist (`lib/utils.ts` with `cn()` helper)
- Five existing UI components in `components/ui/`

## Recommended Architecture for v1.1

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router Layer                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Pages/Routes │  │   Layouts    │  │  Templates   │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
├─────────┴─────────────────┴─────────────────┴────────────────┤
│                    Component Layer                           │
│  ┌──────────────────────────────────────────────────────┐    │
│  │         Feature Components (team/, task/)            │    │
│  └────────────────────┬─────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │    Shadcn UI Components (components/ui/)             │    │
│  │  [Button] [Card] [Dialog] [Table] [Form]             │    │
│  └────────────────────┬─────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │    Radix UI Primitives (headless, accessible)        │    │
│  └──────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Styling Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Tailwind   │→ │   Design    │← │   @theme    │          │
│  │  Utilities  │  │   Tokens    │  │  Directive  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│         ↑                ↑                 ↑                 │
│         │                │                 │                 │
│  ┌──────────────────────────────────────────────────┐        │
│  │         globals.css (CSS Variables)              │        │
│  └──────────────────────────────────────────────────┘        │
├─────────────────────────────────────────────────────────────┤
│                    Utility Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  cn()    │  │  Hooks   │  │  Utils   │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| **Radix UI Primitives** | Headless UI primitives with built-in accessibility (ARIA, keyboard nav, focus management) | Installed as dependencies by Shadcn CLI |
| **Shadcn UI Components** | Styled, composable components copied into project (Button, Card, Dialog, etc.) | Installed to `apps/web/components/ui/` via CLI |
| **Feature Components** | Domain-specific compositions (TeamCard, TaskList, ProjectView) | Built on top of Shadcn components |
| **Design Tokens** | Single source of truth for colors, spacing, typography | Defined in `globals.css` via `@theme` directive |
| **Tailwind Utilities** | Generated utility classes from design tokens | Auto-generated from `@theme` tokens |
| **Theme Provider** | Runtime theme switching (light/dark) | Already exists via `next-themes` |

## Integration Points with Existing Architecture

### 1. Shadcn UI Installation in Monorepo

**Decision: Install directly in `apps/web` (NOT in shared package)**

**Rationale:**
- TeamFlow monorepo has only ONE Next.js app currently
- Premature abstraction to shared package adds complexity without benefit
- Shadcn components can be moved to `packages/ui` later if second Next.js app is added
- Official Shadcn monorepo guide recommends shared package ONLY for multi-app scenarios

**Installation Path:**
```
apps/web/
├── components/
│   ├── ui/                    # Shadcn components (CLI installs here)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── team/                  # Feature components
│   ├── task/
│   └── portfolio/
├── lib/
│   ├── utils.ts              # Already exists (cn helper)
│   └── ...
└── app/
    └── globals.css           # Design tokens
```

**CLI Command:**
```bash
cd apps/web
npx shadcn@latest init
```

### 2. Path Alias Configuration

**Current State:**
```json
{
  "paths": {
    "@/*": ["./*"],                    // Maps to apps/web/
    "@repo/shared": ["../../packages/shared/src"],
    "@repo/database": ["../../packages/database/src"]
  }
}
```

**Shadcn Requirements:**
The CLI auto-detects `@/*` alias and configures `components.json` accordingly. No changes needed.

**components.json Configuration (auto-generated):**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "postcss.config.mjs",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 3. Design Token Architecture

**Data Flow:**
```
globals.css (@theme directive)
    ↓ (CSS variables defined)
Tailwind v4 (consumes tokens)
    ↓ (generates utility classes)
Shadcn Components (uses utilities + CSS vars)
    ↓ (styled components)
Feature Components (composes Shadcn)
```

**Existing Token System (PRESERVE):**

`apps/web/app/globals.css` already defines design tokens using Tailwind v4 `@theme` directive:

```css
@import "tailwindcss";

@theme {
  /* Light theme tokens */
  --color-background: oklch(98% 0 0);
  --color-foreground: oklch(15% 0 0);
  --color-primary: oklch(55% 0.2 250);
  /* ... */
}

.dark {
  /* Dark theme overrides */
  --color-background: oklch(15% 0 0);
  --color-foreground: oklch(98% 0 0);
  /* ... */
}
```

**Integration Strategy:**

1. **Keep existing tokens** - Already WCAG AA compliant (fixed in 07.1-03)
2. **Add Shadcn-specific tokens** - Map to Tailwind classes via `@theme inline`
3. **Use OKLCH color space** - Already in use, better than HSL for perceptual uniformity

**Updated globals.css Structure:**

```css
@import "tailwindcss";

/* Existing design tokens */
@theme {
  --color-background: oklch(98% 0 0);
  --color-foreground: oklch(15% 0 0);
  /* ... all existing tokens ... */
}

/* Map tokens to Tailwind utilities (Shadcn compatibility) */
@theme inline {
  --color-background: var(--color-background);
  --color-foreground: var(--color-foreground);
  --color-primary: var(--color-primary);
  --color-secondary: var(--color-secondary);
  --color-muted: var(--color-muted);
  --color-accent: var(--color-accent);
  --color-destructive: var(--color-destructive);
  --color-border: var(--color-border);
  --color-input: var(--color-input);
  --color-ring: var(--color-ring);

  /* Radius tokens */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}

/* Dark theme (existing) */
.dark {
  --color-background: oklch(15% 0 0);
  /* ... */
}
```

**Why `@theme inline`?**
- Allows using CSS variables in Tailwind utilities: `bg-[var(--color-primary)]`
- Shadcn components can reference tokens directly: `className="bg-primary"`
- Runtime theming works without recompiling Tailwind

### 4. Component Strategy: New vs. Modified

**NEW Components (Shadcn):**
- Button (replace inline button styles)
- Card (replace manual card layouts)
- Dialog/Modal (replace current modals)
- Form components (Input, Label, Textarea, Select)
- Table (enhance @tanstack/react-table)
- Dropdown Menu, Popover, Tooltip
- Badge, Avatar, Separator
- Alert, Toast (for notifications)
- Tabs, Accordion, Collapsible

**PRESERVE Existing Components:**
- `components/ui/skeleton.tsx` - Already exists, keep as-is
- `components/ui/empty-state.tsx` - Domain-specific, not in Shadcn
- `components/ui/command-palette.tsx` - Already uses `cmdk`, keep
- `components/ui/conflict-warning.tsx` - Domain-specific
- `components/ui/theme-toggle.tsx` - Keep, may enhance with Shadcn Button

**MODIFY/ENHANCE:**
- **Theme Toggle**: Replace button element with Shadcn Button component
- **Command Palette**: Wrap in Shadcn Dialog/Modal for better accessibility
- **Forms**: Replace existing form inputs with Shadcn Form components + react-hook-form

**Migration Path:**
1. Install Shadcn components incrementally (don't install all at once)
2. Replace components in non-critical routes first (portfolio pages)
3. Test accessibility before moving to critical routes (team/task features)
4. Keep old components until migration is complete (avoid breaking changes)

### 5. Styling Integration

**Existing Utility Usage:**

```typescript
// lib/utils.ts (already exists)
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Shadcn Component Example:**

```typescript
// components/ui/button.tsx (will be generated by CLI)
import { cn } from '@/lib/utils';

export function Button({ className, ...props }) {
  return (
    <button
      className={cn(
        "bg-primary text-primary-foreground",  // Uses design tokens
        "rounded-md px-4 py-2",
        "hover:bg-primary/90",
        className
      )}
      {...props}
    />
  );
}
```

**How It Works:**
1. `bg-primary` → Tailwind generates from `--color-primary` token
2. `cn()` merges custom classes with defaults (via `tailwind-merge`)
3. Consumer can override: `<Button className="bg-destructive" />`

## Accessibility Integration

### Built-in Accessibility (Radix UI)

Shadcn components are built on Radix UI primitives, which provide:

| Feature | Implementation | Benefit |
|---------|---------------|---------|
| **ARIA Attributes** | Auto-applied (role, aria-expanded, aria-labelledby, etc.) | Screen reader compatibility |
| **Keyboard Navigation** | Tab, Enter, Space, Arrow keys | Keyboard-only users |
| **Focus Management** | Focus trapping in modals, focus restoration | Proper focus flow |
| **Semantic HTML** | Proper element usage (button, dialog, etc.) | Accessibility tree |

### Testing Strategy

**Tools:**
- **vitest** - Already installed for unit tests
- **@testing-library/react** - Already installed (16.3.2)
- **vitest-axe** - NEW (automated accessibility testing)
- **@axe-core/react** - NEW (runtime accessibility auditing in dev)

**Test Structure:**

```typescript
// __tests__/components/ui/button.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'vitest-axe';
import { Button } from '@/components/ui/button';

expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard accessible', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    button.focus();
    expect(button).toHaveFocus();
  });
});
```

**Testing Priorities:**
1. All Shadcn components installed → accessibility tests
2. Modified existing components → regression tests
3. Feature components → integration tests with accessibility checks

### WCAG AA Compliance

**Color Contrast:**
- Existing tokens already WCAG AA compliant (contrast ratio ≥ 4.5:1)
- Shadcn components inherit token colors
- Test: Run Lighthouse audits after integration

**Focus Indicators:**
- Radix UI provides visible focus by default
- Custom focus styles use `--color-ring` token (already defined)

**Keyboard Navigation:**
- All interactive elements must be keyboard accessible
- Radix primitives handle this automatically
- Test: Manual keyboard-only testing

## Architectural Patterns

### Pattern 1: Token-Based Theming

**What:** Define design tokens in CSS, consume via Tailwind utilities and CSS variables.

**When to use:** All new components, theme-dependent styles.

**Trade-offs:**
- ✅ Single source of truth for design decisions
- ✅ Runtime theming without rebuild
- ✅ Type-safe in Tailwind utilities
- ❌ Slightly more verbose than hardcoded colors

**Example:**

```typescript
// Bad: Hardcoded colors
<div className="bg-blue-500 text-white" />

// Good: Token-based
<div className="bg-primary text-primary-foreground" />

// Also valid: CSS variable for dynamic values
<div style={{ backgroundColor: `var(--color-primary)` }} />
```

### Pattern 2: Component Composition

**What:** Build complex components by composing Shadcn primitives.

**When to use:** Feature-specific UI needs (TeamCard, TaskRow, ProjectView).

**Trade-offs:**
- ✅ Reusable, testable, accessible by default
- ✅ Consistent styling across app
- ✅ Easy to modify individual parts
- ❌ More files to manage

**Example:**

```typescript
// components/team/team-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

export function TeamCard({ team }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{team.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {team.members.map(member => (
            <Avatar key={member.id} src={member.avatar} />
          ))}
        </div>
        <Button variant="outline">View Team</Button>
      </CardContent>
    </Card>
  );
}
```

### Pattern 3: Progressive Enhancement

**What:** Replace existing components incrementally, keep old versions during migration.

**When to use:** Migrating from custom components to Shadcn.

**Trade-offs:**
- ✅ No breaking changes during migration
- ✅ Can test new components in isolated routes
- ✅ Rollback possible if issues arise
- ❌ Temporary code duplication
- ❌ Bundle size increases slightly

**Example:**

```typescript
// components/ui/button-v2.tsx (new Shadcn version)
export { Button } from './button-shadcn';

// Old components keep working
import { Button } from '@/components/ui/button'; // Old version

// New components use v2
import { Button } from '@/components/ui/button-v2'; // Shadcn version

// After migration complete, delete old version and rename v2 → button
```

## Data Flow

### Design Token Flow

```
Developer defines tokens in globals.css
    ↓
@theme directive processes tokens
    ↓
Tailwind v4 generates utility classes (bg-primary, text-foreground, etc.)
    ↓
@theme inline makes tokens available as CSS variables (var(--color-primary))
    ↓
Shadcn components use utilities (className="bg-primary")
    ↓
Runtime theme switcher updates CSS variables (.dark class)
    ↓
Browser re-renders with new theme (no reload needed)
```

### Component Installation Flow

```
Developer runs: npx shadcn@latest add button
    ↓
CLI reads components.json (paths, aliases, config)
    ↓
CLI downloads button.tsx from Shadcn registry
    ↓
CLI installs peer dependencies (e.g., @radix-ui/react-button)
    ↓
CLI copies button.tsx to apps/web/components/ui/
    ↓
CLI updates imports to use project aliases (@/lib/utils)
    ↓
Developer imports: import { Button } from '@/components/ui/button'
```

### Theme Switching Flow

```
User clicks theme toggle
    ↓
ThemeProvider (next-themes) updates <html class="dark">
    ↓
CSS cascade applies .dark selector styles
    ↓
Design token values swap (light → dark)
    ↓
All components using tokens re-render with new colors
    ↓
localStorage persists user preference
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **Current (1 Next.js app)** | Install Shadcn in `apps/web/components/ui/`. No shared package needed. |
| **2-3 Next.js apps** | Move Shadcn components to `packages/ui`. Export via workspace protocol (`@repo/ui`). |
| **4+ Next.js apps** | Create dedicated design system package with Storybook. Publish as internal npm package. Version control for breaking changes. |

### Build Order Dependencies

**Phase 1: Foundation (No dependencies)**
1. Install Shadcn CLI and initialize `components.json`
2. Verify design tokens in `globals.css` work with Tailwind v4
3. Install `vitest-axe` for accessibility testing

**Phase 2: Core Components (Depends on Phase 1)**
4. Install primitive components: Button, Card, Input, Label
5. Write accessibility tests for each component
6. Create Storybook stories (if needed for documentation)

**Phase 3: Complex Components (Depends on Phase 2)**
7. Install composed components: Dialog, Form, Table, Dropdown
8. Test keyboard navigation and focus management
9. Update existing feature components to use new primitives

**Phase 4: Migration (Depends on Phase 3)**
10. Replace old components in non-critical routes
11. Run regression tests (visual, functional, accessibility)
12. Replace components in critical routes (team, task features)

**Phase 5: Optimization (Depends on Phase 4)**
13. Remove old component code
14. Tree-shake unused Radix primitives
15. Run Lighthouse audits for performance/accessibility

## Anti-Patterns

### Anti-Pattern 1: Installing All Shadcn Components at Once

**What people do:** Run `npx shadcn@latest add` for every component in the registry.

**Why it's wrong:**
- Bloats bundle size with unused code
- Installs unnecessary dependencies
- Harder to track which components are actually used
- More surface area for security vulnerabilities

**Do this instead:**
- Install components as needed (just-in-time)
- Start with primitives (Button, Card, Input)
- Add complex components only when building features that need them
- Use `grep` to find unused components before production

### Anti-Pattern 2: Bypassing Design Tokens

**What people do:** Use arbitrary Tailwind values or hardcoded colors.

```typescript
// Anti-pattern
<Button className="bg-[#3b82f6] text-white" />
<Card className="border-gray-200" />
```

**Why it's wrong:**
- Breaks theme consistency (won't work in dark mode)
- Bypasses WCAG AA compliance checks
- Makes refactoring theme colors impossible
- Defeats the purpose of design system

**Do this instead:**

```typescript
// Use design tokens
<Button className="bg-primary text-primary-foreground" />
<Card className="border-border" />

// If custom color needed, add to design tokens first
// Then use: bg-custom-blue
```

### Anti-Pattern 3: Modifying Shadcn Components Directly

**What people do:** Edit files in `components/ui/` to change default behavior.

**Why it's wrong:**
- Can't re-run `shadcn add` to update components (overwrites changes)
- Breaks expectation that Shadcn components are "stock"
- Makes debugging harder (is this Shadcn's code or custom?)

**Do this instead:**

```typescript
// Wrap Shadcn components with custom variants
// components/custom/primary-button.tsx
import { Button } from '@/components/ui/button';

export function PrimaryButton(props) {
  return <Button variant="default" size="lg" {...props} />;
}

// Or use composition
export function IconButton({ icon, children, ...props }) {
  return (
    <Button {...props}>
      {icon}
      <span className="ml-2">{children}</span>
    </Button>
  );
}
```

### Anti-Pattern 4: Ignoring Accessibility Testing

**What people do:** Assume Radix UI = 100% accessible, skip testing.

**Why it's wrong:**
- Radix provides primitives, but YOU control content (alt text, labels, etc.)
- Color contrast depends on your tokens, not Radix
- Keyboard shortcuts can conflict with browser defaults
- Dynamic content (loading states, errors) needs ARIA live regions

**Do this instead:**

```typescript
// Always test accessibility
describe('TeamCard', () => {
  it('should have no axe violations', async () => {
    const { container } = render(<TeamCard team={mockTeam} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have accessible name', () => {
    render(<TeamCard team={mockTeam} />);
    expect(screen.getByRole('article', { name: mockTeam.name })).toBeInTheDocument();
  });
});
```

### Anti-Pattern 5: Premature Shared Package Abstraction

**What people do:** Immediately create `packages/ui` for Shadcn components in monorepo with single Next.js app.

**Why it's wrong:**
- Adds build complexity (need to compile shared package)
- Slows down dev server (watches multiple packages)
- Makes debugging harder (stack traces reference compiled code)
- No benefit until second Next.js app exists

**Do this instead:**
- Keep Shadcn in `apps/web/components/ui/` until proven need
- Move to shared package ONLY when second app is added
- Use file-based sharing (symlinks) for experimentation
- Document migration path in ADR for future reference

## Integration Boundaries

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Feature Components ↔ Shadcn UI** | Direct imports (`@/components/ui/button`) | Shadcn provides primitives, features compose them |
| **Shadcn UI ↔ Design Tokens** | CSS variables + Tailwind utilities | Tokens defined in `globals.css`, consumed via `className` |
| **Theme Provider ↔ Shadcn UI** | CSS class toggle (`.dark`) | `next-themes` updates `<html>` class, tokens respond |
| **Tests ↔ Shadcn UI** | React Testing Library + vitest-axe | Test behavior, not implementation |

### External Dependencies

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Radix UI** | Peer dependencies (installed by Shadcn CLI) | Headless primitives for accessibility |
| **Tailwind CSS v4** | PostCSS plugin | Processes `@theme` directive, generates utilities |
| **next-themes** | Provider wrapper in `layout.tsx` | Already installed, handles theme persistence |
| **tailwind-merge** | Utility function (`cn()`) | Already installed, merges Tailwind classes |

## Regression Risk Areas

### High Risk (Breaking Changes Likely)

1. **Existing Forms**
   - **Risk:** Current forms use raw HTML inputs, Shadcn Form requires react-hook-form integration
   - **Mitigation:** Create parallel form components, test thoroughly, migrate route-by-route
   - **Detection:** Run E2E tests for auth flows (login, signup, reset password)

2. **Modal/Dialog Patterns**
   - **Risk:** Current modals may use different open/close state management than Shadcn Dialog
   - **Mitigation:** Map existing modal props to Shadcn Dialog props, keep state logic
   - **Detection:** Test task creation, team invites, deletion confirmations

3. **Table Components**
   - **Risk:** `@tanstack/react-table` integration with Shadcn Table components
   - **Mitigation:** Shadcn Table is styling only, keep existing `@tanstack/react-table` logic
   - **Detection:** Test team member list, task list, any sortable/filterable tables

### Medium Risk (May Require Refactoring)

4. **Theme Toggle Component**
   - **Risk:** Current implementation may not work with Shadcn Button variants
   - **Mitigation:** Wrap Shadcn Button, preserve theme switching logic
   - **Detection:** Test light/dark mode switching persists on reload

5. **Command Palette**
   - **Risk:** `cmdk` library already in use, Shadcn provides styled wrapper
   - **Mitigation:** Keep existing `cmdk` logic, optionally adopt Shadcn styles
   - **Detection:** Test keyboard shortcuts (Cmd+K), search functionality

6. **CSS Variable Naming**
   - **Risk:** Existing tokens use `--color-*` prefix, Shadcn expects specific names
   - **Mitigation:** Use `@theme inline` to map existing vars to Shadcn conventions
   - **Detection:** Visual regression tests, check dark mode colors

### Low Risk (Additive Changes)

7. **New Components** (Button, Card, Badge, Avatar, etc.)
   - **Risk:** Minimal, these are additions, not replacements
   - **Mitigation:** Install incrementally, test accessibility
   - **Detection:** Run `vitest-axe` on new components

8. **Portfolio Pages**
   - **Risk:** Low traffic, non-critical features
   - **Mitigation:** Use as testing ground for new components
   - **Detection:** Visual QA, Lighthouse audits

## Monitoring & Rollback

**Build Failures:**
- Tailwind v4 `@theme` syntax errors → Check `globals.css` for invalid tokens
- Shadcn CLI installation errors → Verify `components.json` aliases match `tsconfig.json`
- TypeScript errors → Check Radix UI peer dependencies installed

**Runtime Issues:**
- Theme not switching → Verify `next-themes` provider in `layout.tsx`
- Focus trap not working → Check Dialog/Modal `open` state management
- Keyboard navigation broken → Test with Tab key, check `tabIndex` values

**Accessibility Regressions:**
- Run `axe-core` in dev mode (`@axe-core/react` logs to console)
- Run Lighthouse CI in GitHub Actions (fail on accessibility score < 90)
- Manual keyboard testing before each deploy

**Rollback Strategy:**
- Keep old components until migration complete
- Feature flag new components (`USE_SHADCN_BUTTON`) for gradual rollout
- Git revert commits if critical accessibility violations found

## Sources

**Shadcn UI Integration:**
- [Shadcn UI - Next.js Installation](https://ui.shadcn.com/docs/installation/next)
- [Shadcn UI - React 19 Compatibility](https://ui.shadcn.com/docs/react-19)
- [Shadcn UI - Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4)
- [Shadcn UI - Monorepo Setup](https://ui.shadcn.com/docs/monorepo)
- [Shadcn UI - components.json Reference](https://ui.shadcn.com/docs/components-json)

**Tailwind CSS v4:**
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS - Theme Variables](https://tailwindcss.com/docs/theme)
- [Tailwind CSS 4 @theme: Design Tokens Guide](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06)

**Accessibility:**
- [React Accessibility Guide](https://legacy.reactjs.org/docs/accessibility.html)
- [WCAG AA Testing Best Practices](https://www.allaccessible.org/blog/react-accessibility-best-practices-guide)
- [React Testing Library Accessibility](https://medium.com/ifood-engineering/testing-components-and-accessibility-with-react-testing-library-26935374e437)
- [Vitest Component Testing](https://vitest.dev/guide/browser/component-testing)

**Design Systems:**
- [Building Design System Architecture 2026](https://medium.com/@padmacnu/building-the-ultimate-design-system-a-complete-architecture-guide-for-2026-6dfcab0e9999)
- [Design Tokens Developer Guide](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/)
- [CSS Variables Complete Guide 2026](https://devtoolbox.dedyn.io/blog/css-variables-complete-guide)

**Monorepo Patterns:**
- [Turborepo Next.js Guide](https://turborepo.dev/docs/guides/frameworks/nextjs)
- [Build Monorepo with Next.js](https://blog.logrocket.com/build-monorepo-next-js/)

**Next.js 15:**
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Next.js 15 App Router Pitfalls](https://imidef.com/en/2026-02-11-app-router-pitfalls)

---
*Architecture research for: Design System Integration (v1.1)*
*Researched: 2026-02-16*
*Confidence: HIGH - All integration points verified with official documentation*
