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
| --color-foreground | --color-background | oklch(15% 0 0) | oklch(98% 0 0) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-muted-foreground | --color-muted | oklch(45% 0 0) | oklch(96% 0 0) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-card-foreground | --color-card | oklch(15% 0 0) | oklch(100% 0 0) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-accent-foreground | --color-accent | oklch(20% 0 0) | oklch(94% 0.05 250) | [ratio]:1 | [PASS/FAIL] | [notes] |

### Button Text (4.5:1 required)

| Foreground Token | Background Token | OKLCH Foreground | OKLCH Background | Calculated Ratio | WCAG AA | Status |
|------------------|------------------|------------------|------------------|------------------|---------|--------|
| --color-primary-foreground | --color-primary | oklch(100% 0 0) | oklch(55% 0.2 250) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-secondary-foreground | --color-secondary | oklch(15% 0 0) | oklch(96% 0 0) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-destructive-foreground | --color-destructive | oklch(100% 0 0) | oklch(55% 0.22 25) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-success-foreground | --color-success | oklch(100% 0 0) | oklch(60% 0.18 145) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-warning-foreground | --color-warning | oklch(15% 0 0) | oklch(70% 0.15 65) | [ratio]:1 | [PASS/FAIL] | [notes] |

### UI Components (3:1 required)

| Foreground Token | Background Token | OKLCH Foreground | OKLCH Background | Calculated Ratio | WCAG AA | Status |
|------------------|------------------|------------------|------------------|------------------|---------|--------|
| --color-border | --color-background | oklch(89% 0 0) | oklch(98% 0 0) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-border | --color-muted | oklch(89% 0 0) | oklch(96% 0 0) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-input | --color-background | oklch(89% 0 0) | oklch(98% 0 0) | [ratio]:1 | [PASS/FAIL] | [notes] |

## Dark Mode Token Pairs

### Body Text (4.5:1 required)

| Foreground Token | Background Token | OKLCH Foreground | OKLCH Background | Calculated Ratio | WCAG AA | Status |
|------------------|------------------|------------------|------------------|------------------|---------|--------|
| --color-foreground | --color-background | oklch(98% 0 0) | oklch(15% 0 0) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-muted-foreground | --color-muted | oklch(65% 0 0) | oklch(20% 0 0) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-card-foreground | --color-card | oklch(98% 0 0) | oklch(18% 0 0) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-accent-foreground | --color-accent | oklch(98% 0 0) | oklch(25% 0.05 250) | [ratio]:1 | [PASS/FAIL] | [notes] |

### Button Text (4.5:1 required)

| Foreground Token | Background Token | OKLCH Foreground | OKLCH Background | Calculated Ratio | WCAG AA | Status |
|------------------|------------------|------------------|------------------|------------------|---------|--------|
| --color-primary-foreground | --color-primary | oklch(100% 0 0) | oklch(65% 0.2 250) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-secondary-foreground | --color-secondary | oklch(98% 0 0) | oklch(25% 0 0) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-destructive-foreground | --color-destructive | oklch(100% 0 0) | oklch(60% 0.22 25) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-success-foreground | --color-success | oklch(100% 0 0) | oklch(65% 0.18 145) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-warning-foreground | --color-warning | oklch(10% 0 0) | oklch(75% 0.15 65) | [ratio]:1 | [PASS/FAIL] | [notes] |

### UI Components (3:1 required)

| Foreground Token | Background Token | OKLCH Foreground | OKLCH Background | Calculated Ratio | WCAG AA | Status |
|------------------|------------------|------------------|------------------|------------------|---------|--------|
| --color-border | --color-background | oklch(27% 0 0) | oklch(15% 0 0) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-border | --color-muted | oklch(27% 0 0) | oklch(20% 0 0) | [ratio]:1 | [PASS/FAIL] | [notes] |
| --color-input | --color-background | oklch(27% 0 0) | oklch(15% 0 0) | [ratio]:1 | [PASS/FAIL] | [notes] |

## Summary

**Light Mode**:
- Total pairs audited: [N]
- Passing: [N] ([%]%)
- Failing: [N] ([%]%)

**Dark Mode**:
- Total pairs audited: [N]
- Passing: [N] ([%]%)
- Failing: [N] ([%]%)

## Violations

[List each failing pair with current ratio and required ratio]

## Remediation Plan

[For each violation, provide specific OKLCH adjustments needed]
