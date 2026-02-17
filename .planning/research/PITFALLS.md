# Pitfalls Research: Design System Retrofit to Existing Next.js + Tailwind Application

**Domain:** Adding design system and WCAG compliance to existing Next.js 15 + Tailwind CSS v4 application
**Researched:** 2026-02-16
**Confidence:** HIGH (based on project failure analysis + web research + official documentation)

## Critical Pitfalls

### Pitfall 1: Spot Fixes for Systemic Problems

**What goes wrong:**
Attempting to fix WCAG contrast violations or design inconsistencies with piecemeal color class replacements across dozens of files. Changes appear correct in code but don't reflect in browser, or fixing Issue A reveals Issue B, which reveals Issue C, cycling endlessly without resolution.

**Why it happens:**
Developers see a visible problem (white text on white background) and make the obvious fix (change the class). This works for bugs but fails for systemic design issues because the root cause is improper design token configuration, not incorrect class usage. From Phase 07.1-03: 58 files modified, 7 commits, 90 minutes spent, 0 problems solved.

**How to avoid:**
Before touching component files, audit the design system foundation:
1. Check if CSS custom properties (Tailwind v4 @theme tokens) have WCAG-compliant values
2. Verify that semantic tokens exist (text-primary, text-secondary) vs. direct color values (text-gray-500)
3. If either is missing, STOP component fixes and fix the foundation first
4. Use established design systems (Shadcn UI + Radix Colors) that are pre-validated for WCAG compliance

**Warning signs:**
- Multiple files changed but browser output unchanged
- Fixing one area breaks another area
- Pattern of "still broken" feedback after each commit
- grep shows "correct" classes but rendered output shows problems
- Over 5 emergency fix rounds in single session

**Phase to address:**
Phase 1 of design system milestone must establish token foundation BEFORE migrating any components. Do not proceed to Phase 2 component migration until Lighthouse accessibility audit passes on foundation pages.

---

### Pitfall 2: Incomplete Tailwind CSS v4 Migration

**What goes wrong:**
CSS changes in globals.css using @theme directive don't reflect in browser. Developer makes correct modifications to color tokens, restarts dev server, but sees no visual changes. This leads to confusion about whether Tailwind v4 is actually working or if there's a deeper configuration issue.

**Why it happens:**
Tailwind v4 fundamentally changed from JavaScript config to CSS-first configuration. Common issues:
- CSS filename wrong (globals.css vs. global.css - must be singular)
- Missing @import "tailwindcss" directive (not @tailwind base/components/utilities)
- Content paths in old v3 format
- Browser caching old stylesheets
- Hot reload issues with Next.js 15 + Tailwind v4 (markup updates but styles don't)
- @apply in separate CSS files without proper references

**How to avoid:**
1. Run official migration tool: `npx @tailwindcss/upgrade@next`
2. Verify CSS file is named `global.css` (singular) not `globals.css`
3. Confirm @import "tailwindcss" is first line, not @tailwind directives
4. Check browser DevTools Network tab to verify CSS is not cached (304 status)
5. Hard reload browser (Ctrl+Shift+R) after every CSS change
6. Delete `.next` cache directory between tests
7. Test with simple utility class first (bg-red-500) before complex tokens

**Warning signs:**
- Code looks correct but browser doesn't match
- Changes to @theme values have no effect
- Utility classes work but custom tokens don't
- Need full page reload instead of hot module replacement
- Old v3 @tailwind directives still in CSS file

**Phase to address:**
Phase 0 (Pre-work) must validate Tailwind v4 setup BEFORE creating design tokens. Acceptance criteria: Change a @theme token, see it reflect in browser within 2 seconds without hard reload.

---

### Pitfall 3: Design System Adoption Without Change Management

**What goes wrong:**
Design system components are created but teams continue building features with old components. The product ends up with three different button styles, two navigation patterns, and components in "old style" that take years to revisit. This is the exact problem the design system was meant to solve, now compounded by one more incomplete fix.

**Why it happens:**
Engineers, product managers, and designers have different priorities. Without laying out the value proposition relative to their roles, team members see the design system as extra work. Developers use what they know (old components) rather than learning the new system. Product deadlines don't account for migration time.

**How to avoid:**
1. Document the "why" for each role:
   - Engineers: Faster feature development, fewer bugs, less CSS hunting
   - Product: Consistent UX, faster iteration, fewer accessibility issues
   - Designers: Design once, reuse everywhere, enforced standards
2. Establish component governance: New features MUST use design system components
3. Create migration plan with incremental deadlines (not "eventually migrate")
4. Add linting rules to prevent importing old components
5. Feature flag new components in staging for validation before rollout
6. Deprecate old components explicitly (mark as deprecated, console warnings)

**Warning signs:**
- New PRs still import old component library
- Same component with 3 different import paths in codebase
- Design system docs exist but aren't referenced in code reviews
- "Quick fix" PRs that duplicate instead of using system components
- No timeline for deprecating old components

**Phase to address:**
Phase 1 must include component governance rules and linting setup. Phase 2+ should have "migration checkpoints" where old component imports are removed, not just deprecated.

---

### Pitfall 4: Building Too Much Too Soon

**What goes wrong:**
Design system team attempts to create a full component library covering every scenario before launching. This delays actual usage by months, and by the time components are "ready," product requirements have changed, making many components obsolete or mismatched to actual needs.

**Why it happens:**
Fear of incomplete coverage leads to perfectionism. Teams aim to handle every edge case, every variant, every possible state. This is especially common when retrofitting, thinking "we need to replace everything the old system had."

**How to avoid:**
1. Start with high-leverage primitives: Button, Input, Select, Typography, Card
2. Migrate one page/feature at a time, discovering components as needed
3. Use "found in the wild" approach: When you need a component, THEN add it to the system
4. Limit initial scope to table stakes (buttons, inputs, type scale)
5. Ship incremental updates: v0.1 with 5 components > v1.0 with 50 components in 6 months
6. Design parts of the system WHILE rewriting applications, not before

**Warning signs:**
- Design system backlog has 40+ components, 0 shipped
- Waiting for design system to be "complete" before using it
- Components built for hypothetical future features, not current needs
- No actual product pages migrated yet after 2 months of work
- Design system has more LOC than the actual product

**Phase to address:**
Phase 1: Ship 5-8 primitive components. Phase 2: Migrate 2-3 real pages using primitives. Phase 3: Add composites discovered during migration. Do NOT build all components upfront.

---

### Pitfall 5: Color Tokens Without WCAG Validation

**What goes wrong:**
Custom color palette is created with tokens like `--color-muted-foreground: oklch(45% 0 0)` that fail WCAG contrast requirements (45% lightness = ~3.4:1 contrast, needs 4.5:1). Developers apply these tokens throughout the application, then discover during accessibility audit that the entire color system needs to be rebuilt.

**Why it happens:**
Color design happens in isolation from contrast requirements. Designers create aesthetically pleasing palettes without checking contrast ratios. Developers trust that design tokens are accessible because they're "official design system values." From Phase 07.1-03: Custom OKLCH tokens were created but never validated against WCAG standards.

**How to avoid:**
1. Use pre-validated color systems: Radix Colors (WCAG AA compliant), Tailwind UI official palettes, Material Design 3
2. If creating custom palette, validate EVERY token pair:
   - Text on backgrounds: 4.5:1 minimum (7:1 for AAA)
   - Large text: 3:1 minimum
   - UI components: 3:1 minimum
3. Use automated tools during design: Contrast checker plugins in Figma, WebAIM contrast checker
4. Document contrast ratios in design system docs
5. Add automated contrast tests in CI: axe-core, pa11y, Lighthouse CI
6. Test both light AND dark mode (don't just invert)

**Warning signs:**
- Custom color tokens defined without documented contrast ratios
- No accessibility audit in design system acceptance criteria
- Colors chosen purely for aesthetics
- Light gray text (400-500 range) used for body copy
- Dark mode created by mechanically inverting light mode

**Phase to address:**
Phase 0 (Pre-work): Validate color palette BEFORE creating components. Phase 1: Automated contrast testing in CI. Do NOT proceed to Phase 2 until all Phase 1 components pass WCAG AA.

---

### Pitfall 6: Multiple Style Systems in Parallel

**What goes wrong:**
Design system components are added alongside existing styles, creating a product where different parts of the UI use completely different styling systems. Page A uses the new design system, Page B uses old inline Tailwind classes, Page C uses a mix. The result is visual inconsistency and increased bundle size.

**Why it happens:**
Incomplete retrofits leave design debt that gets baked into future feature work. Some parts of the product take years to revisit. Teams ship features faster by using whatever styling is already on that page. No clear "migration complete" milestone prevents the state from being temporary.

**How to avoid:**
1. Incremental but complete migration strategy:
   - Identify migration units (features, pages, sections)
   - Set deadline for each unit
   - Mark unit as "migration complete" when ALL old styles removed
2. Use component versioning to track progress
3. Add bundle analysis to catch duplicate style systems
4. Create migration dashboard showing % complete per area
5. Feature freeze on unmigrated areas (forces migration before new features)
6. Add ESLint rules preventing old pattern usage in migrated files

**Warning signs:**
- Same visual component styled 3 different ways in codebase
- Bundle includes both old and new CSS frameworks
- Migration tracking shows "80% complete" for 6+ months
- New features mix old and new component libraries
- No git grep for old component imports returns hundreds of results

**Phase to address:**
Each phase must have "complete" criteria: Old styles removed, not just new components added. Phase 3: Full codebase audit to find and migrate remaining old patterns.

---

### Pitfall 7: Dark Mode as Afterthought

**What goes wrong:**
Dark mode is implemented by adding `.dark` classes to components after light mode is "complete." This results in inconsistent dark mode behavior, visual regressions, components that look good in light mode but broken in dark mode, and hard-coded colors that don't switch themes.

**Why it happens:**
Teams build features in default (light) mode, ship them, then try to add dark mode support later. Hard-coded color values (text-gray-500) instead of semantic tokens (text-muted-foreground) don't adapt to theme changes. No dark mode testing during development.

**How to avoid:**
1. Token-driven implementation from day 1: ALL colors must be CSS variables that change with theme
2. NO hard-coded Tailwind color classes (text-gray-500), ONLY semantic tokens (text-muted)
3. Design system components must include both modes in initial design
4. Component development checklist: Light mode ✓ Dark mode ✓ before PR approved
5. Visual regression testing in both modes (Percy, Chromatic, Playwright screenshots)
6. Browser extension to toggle dark mode during development
7. Storybook stories showing both modes side-by-side

**Warning signs:**
- Components ship with only light mode tested
- grep for "text-gray-", "bg-white" shows hundreds of hard-coded values
- Dark mode "works" but has different visual hierarchy than light mode
- Contrast violations only in dark mode
- Theme toggle causes layout shifts or flickers

**Phase to address:**
Phase 1: Establish semantic token architecture (must support theming). Every phase: Dual-mode testing required for acceptance. Phase 4: Visual regression test suite covering both modes.

---

### Pitfall 8: CSS Configuration Caching Issues

**What goes wrong:**
Developer modifies @theme tokens in global.css, restarts dev server, but sees no visual changes in browser. Assumes Tailwind isn't working or changes are wrong. Spends hours debugging correct code because browser is serving cached CSS.

**Why it happens:**
Next.js dev server caches CSS aggressively for performance. Browser also caches stylesheets. Tailwind v4's new architecture uses PostCSS plugin that may not trigger full recompilation on theme changes. Hot Module Replacement (HMR) updates markup but not always styles.

**How to avoid:**
1. Hard reload browser (Ctrl+Shift+R / Cmd+Shift+R) after CSS changes
2. Delete .next directory when switching branches or major config changes
3. Use "Disable cache" in DevTools Network tab during development
4. Restart Next.js dev server after @theme modifications
5. Verify CSS file timestamp in Network tab matches recent changes
6. Test CSS changes with simple utility first (bg-red-500) to isolate caching vs. config issues
7. Use CSS-in-JS debugging: Add temporary `* { border: 1px solid red; }` to verify CSS loads

**Warning signs:**
- Multiple restarts needed to see CSS changes
- Changes work for teammate but not for you (browser cache)
- Git diff shows correct CSS but browser doesn't match
- CSS file size in Network tab doesn't change after adding rules
- Need to clear browser data to see style updates

**Phase to address:**
Phase 0 (Pre-work): Document CSS debugging workflow. Include in onboarding docs. Add npm script: "dev:clean" that removes .next and starts fresh dev server.

---

### Pitfall 9: Shadcn UI Integration Conflicts

**What goes wrong:**
Installing Shadcn UI components into existing application causes class name conflicts, style collisions, or components that look different from designs because existing Tailwind config overrides Shadcn's expected tokens.

**Why it happens:**
Shadcn expects specific Tailwind configuration structure. If your existing setup has custom class prefixes, different color token names, or conflicting global styles, Shadcn components won't render as designed. Additionally, Shadcn requires tailwind-merge for class conflict resolution.

**How to avoid:**
1. Add prefix in components.json to namespace Shadcn classes: `ui-bg-primary` instead of `bg-primary`
2. Verify tailwind-merge is installed and configured correctly
3. Check existing Tailwind config doesn't override Shadcn token names
4. Use Shadcn's manual installation mode to understand dependencies
5. Test each Shadcn component in isolation before integrating into pages
6. Create Storybook stories for Shadcn components to verify styling
7. Don't modify Shadcn component source files directly (defeats upgrade path)

**Warning signs:**
- Shadcn components look different from documentation examples
- Class name conflicts in browser DevTools (two classes with same name)
- Components styled correctly in isolation but broken when integrated
- Can't upgrade Shadcn components without breaking changes
- Need to copy-paste fixes from GitHub issues instead of using stable components

**Phase to address:**
Phase 1: Shadcn integration setup with prefix configuration. Phase 2: Component isolation testing in Storybook. Do NOT add Shadcn components directly to production pages until isolation testing passes.

---

### Pitfall 10: @apply Directive Issues in Tailwind v4

**What goes wrong:**
Using @apply in separate CSS files causes errors or doesn't work because the CSS file doesn't reference where the main Tailwind configuration is imported. Developers write component-specific CSS with @apply expecting Tailwind classes to be available but get "unknown class" errors.

**Why it happens:**
Tailwind v4's CSS-first approach requires explicit imports. In v3, @apply worked anywhere because config was JavaScript-based and globally available. In v4, CSS files using @apply need to reference the file where @import "tailwindcss" exists.

**How to avoid:**
1. Minimize @apply usage - prefer utility classes directly in components
2. If using @apply, add explicit reference to main Tailwind file:
   ```css
   @import "../globals.css";
   ```
3. Keep @apply usage in the same file as @import "tailwindcss"
4. Use CSS modules or styled-components for component-specific styles instead of @apply
5. Document which CSS files can safely use @apply

**Warning signs:**
- @apply works in global.css but not in component CSS files
- Build errors about unknown Tailwind classes in @apply
- Need to duplicate utility definitions across CSS files
- CSS architecture becomes confusing with multiple import chains

**Phase to address:**
Phase 1: Establish CSS architecture patterns. Document @apply usage guidelines. Phase 2: Migrate existing @apply usage to either direct utilities or CSS-in-JS.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hard-coded color classes (text-gray-500) | Faster to write than semantic tokens | Breaks dark mode, requires find-replace for theme changes, no single source of truth | Never in design system retrofit |
| Skipping visual regression tests | Ship features faster | Silent dark mode regressions, contrast violations discovered in production | Only for internal-only features |
| Mixing old and new component libraries | Don't block feature development during migration | Multiple style systems, larger bundle, visual inconsistency | Temporary (< 1 sprint) during active migration |
| Custom color palette without WCAG audit | Unique brand identity | Fails accessibility, requires complete rebuild | Never - use Radix Colors or validate first |
| Modifying Shadcn component source directly | Quick fix for styling issues | Breaks upgrade path, defeats purpose of owning code | Never - extend via composition |
| Browser hard-reload instead of fixing caching | Get CSS changes working quickly | Hides configuration issues, slows development | During Phase 0 only while debugging |

## Integration Gotchas

Common mistakes when integrating Shadcn UI and Tailwind v4 with existing Next.js application.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Shadcn UI | Installing all components at once | Add components as needed, test each in isolation |
| Tailwind v4 | Using old @tailwind directives | Use @import "tailwindcss" only |
| Next.js 15 + Tailwind v4 HMR | Expecting automatic style updates | Hard reload after @theme changes, delete .next cache |
| Dark mode | Adding .dark classes after building light mode | Build semantic tokens first, design both modes simultaneously |
| Color tokens | Creating custom OKLCH values | Use pre-validated Radix Colors or audit with contrast tools |
| Design system governance | Assuming team will naturally adopt new components | Add ESLint rules, deprecation warnings, migration deadlines |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Parallel style systems | Bundle size increases 30-50% | Complete migration unit-by-unit, remove old styles | Immediately (slows all page loads) |
| Hard-coded colors everywhere | Global theme change requires modifying 100+ files | Use semantic tokens from day 1 | At scale (unmaintainable) |
| No component versioning | Breaking changes affect entire codebase | Version design system components, use feature flags | First breaking change |
| Manual accessibility testing | WCAG violations discovered in production | Automated testing in CI (axe-core, Lighthouse) | Production launch |
| CSS file organization chaos | Can't find where styles are defined | Document CSS architecture, enforce file naming | 50+ components |

## UX Pitfalls

Common user experience mistakes when retrofitting design systems.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Visual inconsistency during migration | Feels like unfinished product, erodes trust | Migrate by user journey, not by component type |
| Dark mode regressions | Can't read text, features unusable at night | Visual regression testing in both modes |
| WCAG contrast failures | Inaccessible to users with low vision | Pre-validate color palette, automated CI tests |
| Breaking existing workflows during migration | Users need to relearn interface | Feature parity verification before replacing components |
| Flash of unstyled content (FOUC) | Janky theme switching | Use CSS variables for theming, not class swapping |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Design system foundation:** Often missing WCAG validation - verify all color token pairs meet 4.5:1 contrast minimum
- [ ] **Dark mode:** Often missing systematic testing - verify EVERY page in dark mode, not just homepage
- [ ] **Component migration:** Often missing old style removal - verify grep for old component imports returns zero results
- [ ] **Tailwind v4 setup:** Often missing content path updates - verify classes in ALL directories are detected
- [ ] **Accessibility compliance:** Often missing keyboard navigation - verify tab order and focus states
- [ ] **Shadcn integration:** Often missing conflict resolution setup - verify tailwind-merge is configured
- [ ] **Browser testing:** Often missing hard-coded color detection - verify grep for "text-gray-", "bg-white" finds only design tokens file
- [ ] **CSS architecture:** Often missing @apply guidelines - verify team knows when and where @apply can be used

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Spot fixes attempted (Pitfall 1) | HIGH | 1. Revert all component changes, 2. Audit design tokens, 3. Fix tokens first, 4. Re-migrate components with correct foundation |
| Tailwind v4 misconfigured (Pitfall 2) | LOW | 1. Run official upgrade tool, 2. Rename CSS file to global.css, 3. Replace @tailwind with @import, 4. Delete .next cache, 5. Test |
| Multiple style systems (Pitfall 6) | MEDIUM | 1. Create migration dashboard, 2. Set deadlines per area, 3. Remove old styles as each area completes, 4. Add linting to prevent regression |
| Failed WCAG audit (Pitfall 5) | HIGH | 1. Switch to Radix Colors, 2. Rebuild semantic token layer, 3. Re-test all components, 4. Add automated contrast checks |
| Dark mode broken (Pitfall 7) | MEDIUM | 1. Find all hard-coded colors (grep), 2. Replace with semantic tokens, 3. Add visual regression tests, 4. Require both modes in PR reviews |
| Shadcn conflicts (Pitfall 9) | LOW | 1. Add class prefix in components.json, 2. Reinstall conflicting components, 3. Test in isolation, 4. Document prefix usage |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Pitfall 1: Spot fixes | Phase 0: Foundation audit | Token changes reflect in browser within 2 seconds |
| Pitfall 2: Tailwind v4 | Phase 0: Migration validation | Official upgrade tool runs cleanly, HMR works |
| Pitfall 3: Adoption | Phase 1: Governance setup | ESLint fails on old component imports |
| Pitfall 4: Building too much | Phase 1: Primitive-only scope | Ship 5-8 components max, migrate 2 real pages |
| Pitfall 5: Color tokens | Phase 0: WCAG validation | All token pairs meet 4.5:1 contrast, documented |
| Pitfall 6: Parallel systems | Phase 2+: Complete migration | Bundle analysis shows single style system |
| Pitfall 7: Dark mode | Phase 1: Dual-mode design | Every component has both modes in Storybook |
| Pitfall 8: CSS caching | Phase 0: Dev workflow docs | Team knows hard-reload shortcut, .next cleanup |
| Pitfall 9: Shadcn conflicts | Phase 1: Integration setup | Shadcn components match docs in isolation |
| Pitfall 10: @apply issues | Phase 1: CSS architecture | Document shows which files can use @apply |

## Sources

**Design System Retrofit:**
- [Design System Adoption Pitfalls](https://www.netguru.com/blog/design-system-adoption-pitfalls)
- [Design Systems in 2026: Predictions, Pitfalls, and Power Moves](https://medium.com/@rydarashid/design-systems-in-2026-predictions-pitfalls-and-power-moves-f401317f7563)
- [Pro Tips for Design System Migration in Large Projects](https://medium.com/@houhoucoop/pro-tips-for-ui-library-migration-in-large-projects-d54f0fbcd083)
- [Incremental Migration: Evolving Without Breaking Production](https://medium.com/@navidbarsalari/incremental-migration-evolving-without-breaking-production-edf679769918)

**Tailwind CSS v4 Migration:**
- [Tailwind CSS v4 Migration Guide](https://designrevision.com/blog/tailwind-4-migration)
- [Tailwind v4 Migration: From JavaScript Config to CSS-First](https://medium.com/better-dev-nextjs-react/tailwind-v4-migration-from-javascript-config-to-css-first-in-2025-ff3f59b215ca)
- [How to Upgrade Tailwind CSS to v4 in Next.js 15](https://github.com/vercel/next.js/discussions/82623)
- [Tailwind CSS v4 Not Working in Next.js? Check Your CSS Filename!](https://medium.com/@bloodturtle/the-problem-f71da1eb9faa)
- [Fast Refresh / Hot Reload not working with Next.js 15 and Tailwind CSS 4](https://github.com/tailwindlabs/tailwindcss/discussions/18180)

**WCAG Compliance:**
- [The 6 most common WCAG failures and how to fix them](https://reciteme.com/us/news/6-most-common-wcag-failures/)
- [Top 10 WCAG Violations Found on Business Websites](https://www.adacompliancepros.com/blog/top-10-wcag-violations-found-on-business-websites)
- [Accessibility vs. Compliance: Why the Difference Matters](https://www.dbswebsite.com/blog/accessible-vs-compliant-accessibility/)
- [2026 WCAG & ADA Website Compliance Requirements & Standards](https://www.accessibility.works/blog/wcag-ada-website-compliance-standards-requirements/)

**Design Tokens & Migration:**
- [How to Manage Breaking Changes in Design Tokens](https://designtokens.substack.com/p/how-to-manage-breaking-changes-in)
- [Color tokens: guide to light and dark modes in design systems](https://medium.com/design-bootcamp/color-tokens-guide-to-light-and-dark-modes-in-design-systems-146ab33023ac)
- [Dark Mode Design Systems: A Practical Guide](https://medium.com/design-bootcamp/dark-mode-design-systems-a-practical-guide-13bc67e43774)

**Shadcn UI Integration:**
- [shadcn UI: Complete Guide](https://designrevision.com/blog/shadcn-ui-guide)
- [Integrating Shadcn UI with React 19: Step-by-Step Tutorial](https://mobisoftinfotech.com/resources/blog/react-19-shadcn-ui-integration-tutorial)

**Testing & Regression:**
- [Testing a Component System Like Infrastructure](https://hackernoon.com/testing-a-component-system-like-infrastructure-contract-tests-visual-regression-and-accessibility-gates)
- [Effective Regression Testing Strategy](https://www.testingxperts.com/blog/regression-testing-strategy)

**Project-Specific:**
- Phase 07.1-03 Failure Analysis (internal documentation)
- Current codebase analysis (globals.css, package.json)

---

*Pitfalls research for: Adding design system and WCAG compliance to existing TeamFlow application*
*Researched: 2026-02-16*
*Confidence: HIGH (validated against real project failure + industry best practices)*
