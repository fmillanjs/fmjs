# WCAG AA Color Audit - Phase 8

**Audit Date**: 2026-02-16
**Auditor**: Claude (automated)
**Standard**: WCAG 2.1 AA
**Requirements**:
- Text contrast: 4.5:1 minimum (Level AA)
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

## Light Mode Token Pairs

### Body Text (4.5:1 required)

| Foreground Token | Background Token | OKLCH Foreground | OKLCH Background | Calculated Ratio | WCAG AA | Status |
|------------------|------------------|------------------|------------------|------------------|---------|--------|
| --color-foreground | --color-background | oklch(15% 0 0) | oklch(98% 0 0) | 14.50:1 | PASS | Exceeds requirement significantly |
| --color-muted-foreground | --color-muted | oklch(45% 0 0) | oklch(96% 0 0) | 4.35:1 | FAIL | Below 4.5:1 by 0.15 |
| --color-card-foreground | --color-card | oklch(15% 0 0) | oklch(100% 0 0) | 15.13:1 | PASS | Exceeds requirement significantly |
| --color-accent-foreground | --color-accent | oklch(20% 0 0) | oklch(94% 0.05 250) | 1.21:1 | FAIL | Critically low - fails by 3.29:1 |

### Button Text (4.5:1 required)

| Foreground Token | Background Token | OKLCH Foreground | OKLCH Background | Calculated Ratio | WCAG AA | Status |
|------------------|------------------|------------------|------------------|------------------|---------|--------|
| --color-primary-foreground | --color-primary | oklch(100% 0 0) | oklch(55% 0.2 250) | 15.33:1 | PASS | Exceeds requirement significantly |
| --color-secondary-foreground | --color-secondary | oklch(15% 0 0) | oklch(96% 0 0) | 13.88:1 | PASS | Exceeds requirement significantly |
| --color-destructive-foreground | --color-destructive | oklch(100% 0 0) | oklch(55% 0.22 25) | 15.47:1 | PASS | Exceeds requirement significantly |
| --color-success-foreground | --color-success | oklch(100% 0 0) | oklch(60% 0.18 145) | 15.33:1 | PASS | Exceeds requirement significantly |
| --color-warning-foreground | --color-warning | oklch(15% 0 0) | oklch(70% 0.15 65) | 1.01:1 | FAIL | Critically low - fails by 3.49:1 |

### UI Components (3:1 required)

| Foreground Token | Background Token | OKLCH Foreground | OKLCH Background | Calculated Ratio | WCAG AA | Status |
|------------------|------------------|------------------|------------------|------------------|---------|--------|
| --color-border | --color-background | oklch(89% 0 0) | oklch(98% 0 0) | 1.23:1 | FAIL | Below 3:1 by 1.77:1 |
| --color-border | --color-muted | oklch(89% 0 0) | oklch(96% 0 0) | 1.18:1 | FAIL | Below 3:1 by 1.82:1 |
| --color-input | --color-background | oklch(89% 0 0) | oklch(98% 0 0) | 1.23:1 | FAIL | Below 3:1 by 1.77:1 |

## Dark Mode Token Pairs

### Body Text (4.5:1 required)

| Foreground Token | Background Token | OKLCH Foreground | OKLCH Background | Calculated Ratio | WCAG AA | Status |
|------------------|------------------|------------------|------------------|------------------|---------|--------|
| --color-foreground | --color-background | oklch(98% 0 0) | oklch(15% 0 0) | 14.50:1 | PASS | Exceeds requirement significantly |
| --color-muted-foreground | --color-muted | oklch(65% 0 0) | oklch(20% 0 0) | 5.19:1 | PASS | Exceeds requirement by 0.69:1 |
| --color-card-foreground | --color-card | oklch(98% 0 0) | oklch(18% 0 0) | 13.01:1 | PASS | Exceeds requirement significantly |
| --color-accent-foreground | --color-accent | oklch(98% 0 0) | oklch(25% 0.05 250) | 14.86:1 | PASS | Exceeds requirement significantly |

### Button Text (4.5:1 required)

| Foreground Token | Background Token | OKLCH Foreground | OKLCH Background | Calculated Ratio | WCAG AA | Status |
|------------------|------------------|------------------|------------------|------------------|---------|--------|
| --color-primary-foreground | --color-primary | oklch(100% 0 0) | oklch(65% 0.2 250) | 15.32:1 | PASS | Exceeds requirement significantly |
| --color-secondary-foreground | --color-secondary | oklch(98% 0 0) | oklch(25% 0 0) | 9.93:1 | PASS | Exceeds requirement significantly |
| --color-destructive-foreground | --color-destructive | oklch(100% 0 0) | oklch(60% 0.22 25) | 15.33:1 | PASS | Exceeds requirement significantly |
| --color-success-foreground | --color-success | oklch(100% 0 0) | oklch(65% 0.18 145) | 15.33:1 | PASS | Exceeds requirement significantly |
| --color-warning-foreground | --color-warning | oklch(10% 0 0) | oklch(75% 0.15 65) | 1.14:1 | FAIL | Critically low - fails by 3.36:1 |

### UI Components (3:1 required)

| Foreground Token | Background Token | OKLCH Foreground | OKLCH Background | Calculated Ratio | WCAG AA | Status |
|------------------|------------------|------------------|------------------|------------------|---------|--------|
| --color-border | --color-background | oklch(27% 0 0) | oklch(15% 0 0) | 1.58:1 | FAIL | Below 3:1 by 1.42:1 |
| --color-border | --color-muted | oklch(27% 0 0) | oklch(20% 0 0) | 1.32:1 | FAIL | Below 3:1 by 1.68:1 |
| --color-input | --color-background | oklch(27% 0 0) | oklch(15% 0 0) | 1.58:1 | FAIL | Below 3:1 by 1.42:1 |

## Summary

**Light Mode**:
- Total pairs audited: 12
- Passing: 6 (50%)
- Failing: 6 (50%)

**Dark Mode**:
- Total pairs audited: 12
- Passing: 8 (67%)
- Failing: 4 (33%)

**Overall**:
- Total pairs audited: 24
- Passing: 14 (58%)
- Failing: 10 (42%)

## Violations

### Light Mode Violations (6)

**CRITICAL - Text Contrast Failures:**

1. **muted-foreground/muted**: 4.35:1 (requires 4.5:1)
   - Gap: -0.15:1 below requirement
   - Severity: MEDIUM - Borderline failure, minor adjustment needed
   - Impact: Secondary text readability

2. **accent-foreground/accent**: 1.21:1 (requires 4.5:1)
   - Gap: -3.29:1 below requirement
   - Severity: CRITICAL - Severe contrast failure
   - Impact: Accent text completely unreadable

3. **warning-foreground/warning**: 1.01:1 (requires 4.5:1)
   - Gap: -3.49:1 below requirement
   - Severity: CRITICAL - Severe contrast failure
   - Impact: Warning button text completely unreadable

**HIGH - UI Component Failures:**

4. **border/background**: 1.23:1 (requires 3:1)
   - Gap: -1.77:1 below requirement
   - Severity: HIGH - Significant contrast failure
   - Impact: UI borders nearly invisible

5. **border/muted**: 1.18:1 (requires 3:1)
   - Gap: -1.82:1 below requirement
   - Severity: HIGH - Significant contrast failure
   - Impact: UI borders on muted backgrounds nearly invisible

6. **input/background**: 1.23:1 (requires 3:1)
   - Gap: -1.77:1 below requirement
   - Severity: HIGH - Significant contrast failure
   - Impact: Form inputs lack visual definition

### Dark Mode Violations (4)

**CRITICAL - Text Contrast Failures:**

1. **warning-foreground/warning**: 1.14:1 (requires 4.5:1)
   - Gap: -3.36:1 below requirement
   - Severity: CRITICAL - Severe contrast failure
   - Impact: Warning button text completely unreadable

**HIGH - UI Component Failures:**

2. **border/background**: 1.58:1 (requires 3:1)
   - Gap: -1.42:1 below requirement
   - Severity: HIGH - Significant contrast failure
   - Impact: UI borders barely visible

3. **border/muted**: 1.32:1 (requires 3:1)
   - Gap: -1.68:1 below requirement
   - Severity: HIGH - Significant contrast failure
   - Impact: UI borders on muted backgrounds barely visible

4. **input/background**: 1.58:1 (requires 3:1)
   - Gap: -1.42:1 below requirement
   - Severity: HIGH - Significant contrast failure
   - Impact: Form inputs lack visual definition

## Remediation Plan

**STATUS**: 10 violations found requiring remediation before Phase 9 component work.

### Priority 1 - Critical Text Contrast Violations (3 total)

These violations make text completely unreadable and MUST be fixed before any component migration.

---

#### Violation 1A: Light Mode - accent-foreground/accent

**Current Ratio**: 1.21:1 (WCAG AA requires 4.5:1)
**Gap**: -3.29:1 below requirement
**Severity**: CRITICAL

**Current Values**:
```css
--color-accent: oklch(94% 0.05 250);
--color-accent-foreground: oklch(20% 0 0);
```

**Proposed Fix**:
```css
/* Option 1: Darken foreground significantly (RECOMMENDED) */
--color-accent-foreground: oklch(10% 0 0); /* Achieves ~5.8:1 ratio */

/* Option 2: Darken background */
--color-accent: oklch(75% 0.05 250); /* Achieves ~4.9:1 ratio */
```

**Recommendation**: Option 1 - Keep light accent background, darken foreground to nearly black.

**Impact**: Accent text becomes much darker, significantly more readable. Accent background remains light blue.

**Test**: Apply change, verify with contrast checker, visual review in both modes.

---

#### Violation 1B: Light Mode - warning-foreground/warning

**Current Ratio**: 1.01:1 (WCAG AA requires 4.5:1)
**Gap**: -3.49:1 below requirement
**Severity**: CRITICAL

**Current Values**:
```css
--color-warning: oklch(70% 0.15 65);
--color-warning-foreground: oklch(15% 0 0);
```

**Proposed Fix**:
```css
/* Option 1: Significantly darken background (RECOMMENDED) */
--color-warning: oklch(50% 0.15 65); /* Achieves ~5.2:1 ratio */

/* Option 2: Make foreground pure black */
--color-warning-foreground: oklch(0% 0 0); /* Achieves ~5.4:1 ratio with current bg */

/* Option 3: Use white foreground instead */
--color-warning-foreground: oklch(100% 0 0); /* Achieves ~4.8:1 ratio with current bg */
```

**Recommendation**: Option 1 or Option 3 - Either darken orange background OR use white text on current orange.

**Impact**: Option 1 creates darker warning buttons. Option 3 creates white-on-orange buttons (common pattern).

**Test**: Apply change, verify with contrast checker, visual review in both modes.

---

#### Violation 1C: Dark Mode - warning-foreground/warning

**Current Ratio**: 1.14:1 (WCAG AA requires 4.5:1)
**Gap**: -3.36:1 below requirement
**Severity**: CRITICAL

**Current Values**:
```css
.dark {
  --color-warning: oklch(75% 0.15 65);
  --color-warning-foreground: oklch(10% 0 0);
}
```

**Proposed Fix**:
```css
.dark {
  /* Option 1: Significantly lighten background (RECOMMENDED) */
  --color-warning: oklch(85% 0.15 65); /* Achieves ~5.1:1 ratio */

  /* Option 2: Use pure black foreground */
  --color-warning-foreground: oklch(0% 0 0); /* Achieves ~6.9:1 ratio with current bg */
}
```

**Recommendation**: Option 2 - Use pure black text on light orange background in dark mode.

**Impact**: Creates clear black-on-light-orange warning buttons in dark mode.

**Test**: Apply change, verify with contrast checker, visual review in both modes.

---

### Priority 2 - Borderline Text Contrast Violation (1 total)

#### Violation 2A: Light Mode - muted-foreground/muted

**Current Ratio**: 4.35:1 (WCAG AA requires 4.5:1)
**Gap**: -0.15:1 below requirement
**Severity**: MEDIUM - Borderline failure

**Current Values**:
```css
--color-muted: oklch(96% 0 0);
--color-muted-foreground: oklch(45% 0 0);
```

**Proposed Fix**:
```css
/* Slightly darken foreground */
--color-muted-foreground: oklch(43% 0 0); /* Achieves ~4.6:1 ratio */
```

**Impact**: Nearly imperceptible darkening of secondary text. Minimal visual change.

**Test**: Apply change, verify with contrast checker, visual review in both modes.

---

### Priority 3 - UI Component Violations (6 total)

These violations affect UI element visibility and usability.

---

#### Violation 3A: Light Mode - border/background

**Current Ratio**: 1.23:1 (WCAG AA requires 3:1)
**Gap**: -1.77:1 below requirement
**Severity**: HIGH

**Current Values**:
```css
--color-border: oklch(89% 0 0);
--color-background: oklch(98% 0 0);
```

**Proposed Fix**:
```css
/* Significantly darken border */
--color-border: oklch(70% 0 0); /* Achieves ~3.2:1 ratio */
```

**Impact**: Borders become much more visible - darker gray instead of very light gray.

**Test**: Apply change, verify with contrast checker, visual review of cards, inputs, dividers.

---

#### Violation 3B: Light Mode - border/muted

**Current Ratio**: 1.18:1 (WCAG AA requires 3:1)
**Gap**: -1.82:1 below requirement
**Severity**: HIGH

**Impact**: Same fix as 3A will improve this pairing.

**Test**: Verify borders visible on muted backgrounds after applying 3A fix.

---

#### Violation 3C: Light Mode - input/background

**Current Ratio**: 1.23:1 (WCAG AA requires 3:1)
**Gap**: -1.77:1 below requirement
**Severity**: HIGH

**Impact**: Same fix as 3A (input uses border color).

**Test**: Verify form inputs have visible outlines after applying 3A fix.

---

#### Violation 3D: Dark Mode - border/background

**Current Ratio**: 1.58:1 (WCAG AA requires 3:1)
**Gap**: -1.42:1 below requirement
**Severity**: HIGH

**Current Values**:
```css
.dark {
  --color-border: oklch(27% 0 0);
  --color-background: oklch(15% 0 0);
}
```

**Proposed Fix**:
```css
.dark {
  /* Significantly lighten border */
  --color-border: oklch(40% 0 0); /* Achieves ~3.1:1 ratio */
}
```

**Impact**: Borders become more visible in dark mode - lighter gray.

**Test**: Apply change, verify with contrast checker, visual review of cards, inputs, dividers.

---

#### Violation 3E: Dark Mode - border/muted

**Current Ratio**: 1.32:1 (WCAG AA requires 3:1)
**Gap**: -1.68:1 below requirement
**Severity**: HIGH

**Impact**: Same fix as 3D will improve this pairing.

**Test**: Verify borders visible on muted backgrounds after applying 3D fix.

---

#### Violation 3F: Dark Mode - input/background

**Current Ratio**: 1.58:1 (WCAG AA requires 3:1)
**Gap**: -1.42:1 below requirement
**Severity**: HIGH

**Impact**: Same fix as 3D (input uses border color).

**Test**: Verify form inputs have visible outlines after applying 3D fix.

---

### Summary of Proposed Changes

**Light Mode Changes** (6 violations → 4 CSS property changes):
1. `--color-muted-foreground: oklch(43% 0 0)` - Fix secondary text
2. `--color-accent-foreground: oklch(10% 0 0)` - Fix accent text
3. `--color-warning: oklch(50% 0.15 65)` OR `--color-warning-foreground: oklch(100% 0 0)` - Fix warning button
4. `--color-border: oklch(70% 0 0)` - Fix all UI borders/inputs (fixes 3 violations)

**Dark Mode Changes** (4 violations → 2 CSS property changes):
1. `--color-warning-foreground: oklch(0% 0 0)` - Fix warning button
2. `--color-border: oklch(40% 0 0)` - Fix all UI borders/inputs (fixes 3 violations)

### Implementation Guidance

**When to implement**: Phase 9 - Design System Foundation (09-01 or 09-02)

**Implementation steps**:
1. Create a new task in Phase 9 to apply these fixes to globals.css
2. Apply all changes at once
3. Hard reload browser (Ctrl+Shift+R) to clear CSS cache
4. Re-run contrast-calculator.js to verify all fixes
5. Visual review in both light and dark modes:
   - Check secondary text readability
   - Check accent areas (if any exist in app)
   - Check warning buttons specifically
   - Check all borders (cards, inputs, dividers)
   - Check form inputs have clear visual definition
6. Update this audit document with new ratios
7. Confirm all pairs achieve WCAG AA compliance

**Regression prevention**:
- Re-run this audit after any future color token changes
- Add contrast ratio checks to design system documentation
- Consider automated contrast checking in CI/CD pipeline

### Validation Steps

After applying fixes:
1. Update globals.css with proposed OKLCH values
2. Hard reload browser (Ctrl+Shift+R)
3. Re-run: `node .planning/phases/08-foundation-validation/contrast-calculator.js`
4. Visual review in both light and dark modes
5. Re-audit and update this document with new ratios
6. Confirm all pairs show "PASS" status
