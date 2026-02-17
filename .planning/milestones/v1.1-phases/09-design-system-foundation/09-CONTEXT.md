# Phase 9: Design System Foundation - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Install minimal viable Shadcn UI component set with governance rules and dual-mode (light/dark) design to establish a professional design system foundation. Color system migrated to Radix Colors with WCAG AA compliance. Migration of existing components happens in Phases 10-12 — this phase installs the foundation only.

</domain>

<decisions>
## Implementation Decisions

### Component selection & priority
- Install all components at once (single installation pass, not incremental)
- Claude decides which 5-8 primitives to install based on Phase 10 (portfolio migration) needs — at minimum Button, Card, Input, Label, Dialog
- Skip Storybook — verify components in-app instead (Claude chooses the verification approach)

### Color system & WCAG fixes
- Apply Phase 8 WCAG audit fixes **during** Shadcn setup — single unified color migration, not separate steps
- Use **Radix Colors as the color foundation** (`@radix-ui/colors`) — map scales to CSS variables
- Primary color selection: Claude picks a WCAG-compliant Radix blue scale (looks professional — NO purple)
- Token naming convention: Claude decides, aligned with Shadcn CSS variable conventions

### Dark mode strategy
- **Replace** the existing dark mode system with new Radix Colors-based system (not extend)
- Use **separate light and dark scales** from Radix Colors (e.g., blue + blueDark) — separately tuned for each mode, not inverted
- Toggle behavior: **System preference default + manual override** — user preference persisted
- Color format (OKLCH vs P3/sRGB): Claude decides based on Tailwind v4 + Radix Colors compatibility

### Governance & migration rules
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

</decisions>

<specifics>
## Specific Ideas

- WCAG fixes from Phase 8 audit (6 CSS property changes, 10 violations) should be applied as part of the color system migration, not separately
- Radix Colors integration should replace existing OKLCH custom variables in globals.css
- ESLint governance must allow existing code to keep running during Phases 10-12 migration window

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-design-system-foundation*
*Context gathered: 2026-02-16*
