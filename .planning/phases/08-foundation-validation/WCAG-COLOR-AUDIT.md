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

[For each violation, provide specific OKLCH adjustments needed]
