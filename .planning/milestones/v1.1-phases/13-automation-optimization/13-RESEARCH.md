# Phase 13: Automation & Optimization - Research

**Researched:** 2026-02-17
**Domain:** CI/CD accessibility automation, Playwright visual regression, bundle analysis, ESLint governance hardening
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MIG-04 | Regression testing suite (visual regression tests in both light and dark modes) | Portfolio visual regression already exists with 12 Linux-platform baseline PNGs committed. Dashboard routes need a parallel visual regression spec using `storageState` for auth + `addInitScript` dark mode pattern. Playwright `toHaveScreenshot` with `--update-snapshots` manages baselines. |
| COMP-05 | Component governance via ESLint (rules preventing old component imports) | Phase 9 already created `eslint.config.mjs` with `no-restricted-imports` blocking deprecated components. Phase 13's job is to **harden** this: remove all exemptions for paths that Phase 10-12 migrated away from deprecated imports, and add CI lint step that fails on violations. |
</phase_requirements>

---

## Summary

Phase 13 is the automation layer on top of the completed design system migration. The project already has significant test infrastructure: `@axe-core/playwright` 4.11.1 installed, Playwright 1.58.2 configured, Linux-platform baseline screenshots committed for all 6 portfolio routes in both themes, and a GitHub Actions workflow (`deploy.yml`) running E2E tests in CI. What is missing is: (1) the tests for dashboard routes are accessibility-only, with no visual regression; (2) Lighthouse CI is not integrated; (3) the CI workflow does not have dedicated accessibility or visual regression stages; (4) the ESLint governance ignores list still exempts Phase 10-12 migration targets that are now fully migrated.

The core work for this phase is additive to what exists. The Playwright patterns for dark mode (`addInitScript` + `waitForTimeout(200)`) and axe integration (`AxeBuilder.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])`) are already established in the codebase and just need to be applied to dashboard visual regression. Lighthouse CI requires installing `@lhci/cli`, a `lighthouserc.json` config, and a new GitHub Actions job. Bundle analysis requires `@next/bundle-analyzer` added to `next.config.ts` and a baseline measurement. ESLint hardening requires narrowing the `ignores` list in `eslint.config.mjs`.

**Primary recommendation:** Wire up what already exists (Playwright patterns, GitHub Actions CI) rather than introducing new tools. Add `@lhci/cli` and `@next/bundle-analyzer` as the only two new installs. Update `eslint.config.mjs` to remove exemptions for fully-migrated paths.

---

## Codebase Audit — What Already Exists

| Already Done | Evidence | Phase 13 Action Needed |
|-------------|----------|------------------------|
| `@axe-core/playwright` 4.11.1 installed | `apps/web/package.json` devDependencies | None — already installed |
| Playwright 1.58.2 configured | `apps/web/playwright.config.ts` | Add `test:e2e:a11y` and `test:e2e:visual` scripts, or tag-based filtering |
| Portfolio visual regression (12 PNG baselines, Linux) | `e2e/portfolio/visual-regression.spec.ts-snapshots/` | Dashboard visual regression spec needed |
| Axe accessibility tests for portfolio | `e2e/portfolio/accessibility.spec.ts` | Already passing, wire to CI |
| Axe accessibility tests for auth forms | `e2e/auth/form-accessibility.spec.ts` | Already passing, wire to CI |
| Axe accessibility tests for dashboard | `e2e/dashboard/component-accessibility.spec.ts` | Already passing, wire to CI |
| GitHub Actions workflow | `.github/workflows/deploy.yml` | Already runs Playwright tests — add dedicated accessibility/Lighthouse jobs |
| `eslint.config.mjs` with `no-restricted-imports` | `apps/web/eslint.config.mjs` | Remove exemptions for migrated paths (Phase 10-12 delivered) |
| `next.config.ts` with webpack config | `apps/web/next.config.ts` | Add `@next/bundle-analyzer` wrapper |
| Auth state persisted for CI | `apps/web/playwright/.auth/user.json` | Dashboard visual regression needs this for auth routes |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@axe-core/playwright` | 4.11.1 (already installed) | WCAG AA accessibility auditing via axe engine | Official Deque integration; `AxeBuilder` API wraps Playwright `page` object; already used in project |
| `@playwright/test` | 1.58.2 (already installed) | Visual regression (`toHaveScreenshot`), E2E tests | Already configured with Linux baselines in project |
| `@lhci/cli` | 0.15.x (new install) | Lighthouse CI — performance/accessibility score gating | Official Google tool; `lhci autorun` integrates with GitHub Actions; enforces Lighthouse ≥90 |
| `@next/bundle-analyzer` | 15.x / latest (new install) | Bundle size visualization; wraps `webpack-bundle-analyzer` | Official Next.js plugin; generates client/edge/nodejs HTML reports; activated with `ANALYZE=true npm run build` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `eslint` | N/A (Next.js internal) | `no-restricted-imports` governance | Already in project via `next lint`; only need to update `eslint.config.mjs` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@lhci/cli` | `treosh/lighthouse-ci-action` | The action wraps `@lhci/cli` anyway; direct CLI gives more control |
| `@next/bundle-analyzer` | `npx next experimental-analyze` (Turbopack) | Turbopack analyzer is experimental (v16.1+); project is on v15.1.0 — use webpack plugin |
| Playwright `toHaveScreenshot` | Percy / Chromatic | External paid services; project already has built-in Playwright snapshots with Linux baselines committed |

**Installation:**
```bash
# From apps/web directory
npm install --save-dev @lhci/cli@0.15.x @next/bundle-analyzer
```

---

## Architecture Patterns

### Recommended Test File Structure
```
apps/web/e2e/
├── auth/
│   ├── auth.setup.ts              # (exists) creates playwright/.auth/user.json
│   ├── form-accessibility.spec.ts # (exists) axe on /login, /signup, /reset-password
│   ├── login.spec.ts              # (exists) E2E login flow
│   └── signup.spec.ts             # (exists) E2E signup flow
├── portfolio/
│   ├── accessibility.spec.ts      # (exists) axe on all portfolio routes
│   ├── navigation.spec.ts         # (exists)
│   ├── visual-regression.spec.ts  # (exists) 12 baseline PNGs committed
│   └── visual-regression.spec.ts-snapshots/  # (exists) 12 Linux PNGs
├── dashboard/
│   ├── component-accessibility.spec.ts  # (exists) axe on team/project routes
│   └── visual-regression.spec.ts        # NEW — visual regression for dashboard
│       └── visual-regression.spec.ts-snapshots/  # NEW — must be generated + committed
├── edge-cases/                    # (exists)
└── user-journey/                  # (exists)
```

### Pattern 1: Dashboard Visual Regression with Auth
**What:** `toHaveScreenshot` on authenticated dashboard routes using stored auth state
**When to use:** Routes behind `/teams`, `/profile` that require login
**Example:**
```typescript
// Source: https://playwright.dev/docs/test-snapshots
// Pattern derived from existing e2e/portfolio/visual-regression.spec.ts
import { test, expect } from '@playwright/test'

// Use stored auth state from setup
test.use({ storageState: 'playwright/.auth/user.json' })

const dashboardRoutes = [
  { name: 'teams-list', path: '/teams' },
  { name: 'profile', path: '/profile' },
]

test.describe('Dashboard Visual Regression - Light Mode', () => {
  for (const { name, path } of dashboardRoutes) {
    test(name, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot(`${name}-light.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      })
    })
  }
})

test.describe('Dashboard Visual Regression - Dark Mode', () => {
  for (const { name, path } of dashboardRoutes) {
    test(name, async ({ page }) => {
      // Set dark mode BEFORE navigation — same pattern as portfolio/visual-regression.spec.ts
      await page.addInitScript(() => {
        localStorage.setItem('theme', 'dark')
      })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(200)
      await expect(page).toHaveScreenshot(`${name}-dark.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      })
    })
  }
})
```

### Pattern 2: Lighthouse CI Configuration
**What:** `lighthouserc.json` asserting performance ≥90 for critical routes
**When to use:** CI job that runs after `npm run build && npm run start`
**Example:**
```json
// Source: https://googlechrome.github.io/lighthouse-ci/docs/configuration.html
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run start",
      "startServerReadyPattern": "ready",
      "startServerReadyTimeout": 15000,
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/about",
        "http://localhost:3000/projects",
        "http://localhost:3000/login"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["warn", { "minScore": 1 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**IMPORTANT SCOPING NOTE:** Lighthouse CI can only audit **public (unauthenticated) routes**. Dashboard routes at `/teams` require auth session cookies that `lhci collect` cannot provide. Scope `lighthouserc.json` urls to portfolio routes only: `/`, `/about`, `/projects`, `/projects/teamflow`, `/resume`, `/contact`, `/login`.

### Pattern 3: Bundle Analyzer in TypeScript Config
**What:** `@next/bundle-analyzer` wrapper in `next.config.ts`
**When to use:** `ANALYZE=true npm run build` to generate visual reports
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/guides/package-bundling
import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@repo/shared', '@repo/database'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default bundleAnalyzer(nextConfig);
```

### Pattern 4: ESLint Governance Hardening
**What:** Remove Phase 10-12 migration targets from `ignores` in `eslint.config.mjs`
**When to use:** After confirming all exempted files no longer import deprecated components
**Current state:** `eslint.config.mjs` exempts all `components/tasks/**`, `components/projects/**`, `components/teams/**`, `components/layout/**`, etc.
**Phase 13 action:** Remove exemptions for paths that Phase 10-12 fully migrated. Verify with `next lint` passes.

```typescript
// Source: apps/web/eslint.config.mjs — updated ignores list
// REMOVE these exemptions (fully migrated in phases 10-12):
// 'components/tasks/**',
// 'components/projects/**',
// 'components/project/**',
// 'components/portfolio/**',
// 'components/activity/**',
// 'components/layout/**',
// 'components/teams/**',
// KEEP these (still need exemption or Shadcn-installed):
// 'components/providers/**',
// 'components/ui/button.tsx', etc.
```

### Pattern 5: GitHub Actions CI — Dedicated Accessibility Job
**What:** Separate job in `.github/workflows/deploy.yml` for accessibility tests
**When to use:** On every PR and push to prevent regression

```yaml
# Source: https://playwright.dev/docs/ci
# Add to .github/workflows/deploy.yml alongside existing test job
jobs:
  accessibility:
    name: Accessibility & Visual Regression
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate --schema=packages/database/prisma/schema.prisma
      - run: cd apps/web && npx playwright install --with-deps chromium
      - name: Start Next.js dev server
        run: cd apps/web && npm run dev &
      - name: Wait for server
        run: timeout 60 bash -c 'until curl -sf http://localhost:3000/; do sleep 2; done'
      - name: Run accessibility tests (portfolio + auth - no DB needed)
        run: cd apps/web && npx playwright test e2e/portfolio/accessibility.spec.ts e2e/auth/form-accessibility.spec.ts
      - name: Run visual regression tests (portfolio - no DB needed)
        run: cd apps/web && npx playwright test e2e/portfolio/visual-regression.spec.ts
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-accessibility-report
          path: apps/web/playwright-report/
          retention-days: 7
```

**NOTE:** Dashboard accessibility tests and visual regression require a database + auth seed. They should remain in the existing `test` job that already starts Docker + database, or create a separate job with the same infrastructure.

### Anti-Patterns to Avoid
- **Running Lighthouse CI on dashboard routes:** Lighthouse cannot authenticate; use portfolio public routes only
- **Generating snapshot baselines locally on macOS:** CI runs on Linux; baselines must be Linux-generated or `--update-snapshots` run in CI. Project already has Linux baselines in git — maintain this.
- **Using `maxDiffPixels` instead of `maxDiffPixelRatio`:** Ratio (0.02 = 2%) scales with screenshot dimensions; more stable than fixed pixel count
- **Enabling `ANALYZE=true` in the default build script:** Only activate via environment variable — never set `enabled: true` directly in config
- **Asserting Lighthouse accessibility at `error` level:** Axe tests are authoritative for accessibility; use `warn` for Lighthouse accessibility to avoid duplicate failures. Use `error` only for performance.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Visual diffing | Custom pixel comparison | Playwright `toHaveScreenshot` | Built-in pixelmatch, threshold config, baseline management, CI artifact upload |
| Performance gating | Custom Lighthouse script | `@lhci/cli` | Handles multi-run median, assertion DSL, GitHub status checks |
| Bundle visualization | Custom webpack stats parser | `@next/bundle-analyzer` | Generates interactive treemaps for client/edge/nodejs bundles; official plugin |
| Accessibility auditing | Manual ARIA checks | `@axe-core/playwright` | 60+ WCAG rules; CSS variable-aware; already in project |
| Import governance | Custom AST transform | ESLint `no-restricted-imports` | Zero-runtime, build-time enforcement; already in `eslint.config.mjs` |

**Key insight:** All infrastructure already exists in this project. Phase 13 is wiring and configuration, not building new tooling.

---

## Common Pitfalls

### Pitfall 1: Snapshot Platform Mismatch
**What goes wrong:** Snapshots generated on macOS (developer machine) differ from CI Ubuntu rendering due to font rendering and subpixel antialiasing differences. Tests always fail in CI.
**Why it happens:** Playwright embeds OS in snapshot filename (`-darwin.png` vs `-linux.png`).
**How to avoid:** The project already has Linux-platform baselines (`-chromium-linux.png`). When adding dashboard baselines: generate them in CI or in a Linux Docker container. The `--update-snapshots` flag in CI generates Linux-compatible baselines.
**Warning signs:** Snapshot files with `-darwin.png` or `-win32.png` suffix in the repo alongside CI failures.

### Pitfall 2: Dashboard Visual Regression Without Stable Seed Data
**What goes wrong:** Dashboard routes render dynamic data (team names, task counts, user info) that changes between runs, causing visual diffs even when UI is unchanged.
**Why it happens:** Screenshots capture dynamic content.
**How to avoid:** Seed the test database deterministically before the visual regression job (existing auth setup already does this). Alternatively, scope dashboard visual regression to routes/states that are data-independent (empty states, loading states). Or `mask` dynamic elements using `toHaveScreenshot`'s mask option.
**Warning signs:** Spurious failures on every run with small pixel diffs in text areas.

### Pitfall 3: Lighthouse CI Cannot Access Dashboard Routes
**What goes wrong:** Adding `/teams` or authenticated routes to `lighthouserc.json` urls causes `lhci collect` to get redirected to `/login`, auditing the login page instead of the dashboard.
**Why it happens:** `lhci collect` starts a new browser with no cookies/session.
**How to avoid:** Scope Lighthouse exclusively to public portfolio routes. Accessibility of authenticated routes is covered by axe/Playwright, not Lighthouse.
**Warning signs:** Lighthouse reporting `/login` performance when you expected `/teams` performance.

### Pitfall 4: ESLint Governance — Removing Wrong Exemptions
**What goes wrong:** Removing `components/providers/**` from ignores causes ESLint to error on imports that don't use deprecated components, or removing too few paths leaves Phase 10-12 migrations unenforced.
**Why it happens:** The `ignores` list was written as "to-migrate" list; after Phase 12 all task/team/project paths are migrated but providers may still be legitimately exempt.
**How to avoid:** Before removing an exemption, verify with `grep -r "skeleton\|empty-state\|conflict-warning" components/tasks/` that no deprecated imports remain. Remove exemptions only for confirmed-clean paths.
**Warning signs:** `next lint` fails after ESLint update with unrelated import errors.

### Pitfall 5: Lighthouse CI `startServerCommand` for Standalone Output
**What goes wrong:** `next.config.ts` uses `output: 'standalone'` which produces `.next/standalone/server.js`, not the standard `npm run start` path. `lhci collect` hangs waiting for server.
**Why it happens:** Standalone output must be run with `node .next/standalone/server.js`, not `npm run start`.
**How to avoid:** Use `npm run build && npm run start` — `npm run start` executes `next start` which serves the `.next` directory correctly (not standalone). The `standalone` output is for Docker production; `next start` works for CI Lighthouse auditing.
**Warning signs:** `lhci collect` times out with `startServerReadyTimeout` error.

### Pitfall 6: `@next/bundle-analyzer` TypeScript Import
**What goes wrong:** `require()` syntax in `next.config.ts` causes TypeScript errors; ESM import doesn't work with the default export.
**Why it happens:** The package uses CommonJS exports; TypeScript config files need `import` syntax.
**How to avoid:** Use `import withBundleAnalyzer from '@next/bundle-analyzer'` — the package includes TypeScript declarations. The function returns a config wrapper, not a default export requiring `.default`.
**Warning signs:** TypeScript error "Module ... has no exported member 'default'" or "Cannot find module".

---

## Code Examples

Verified patterns from official sources and existing codebase:

### Axe Fixture Pattern (Reusable)
```typescript
// Source: https://playwright.dev/docs/accessibility-testing#using-a-test-fixture
// Use when multiple test files need same axe configuration
import { test as base } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

export const test = base.extend<{ makeAxeBuilder: () => AxeBuilder }>({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    await use(makeAxeBuilder)
  },
})

export { expect } from '@playwright/test'
```

### Playwright `toHaveScreenshot` with Dark Mode
```typescript
// Source: Based on existing e2e/portfolio/visual-regression.spec.ts
// Dark mode pattern: set localStorage BEFORE navigation
test('page-dark', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark')
  })
  await page.goto('/teams')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(200) // next-themes applies dark class
  await expect(page).toHaveScreenshot('teams-dark.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
```

### Update Baseline Snapshots (run in CI or Linux environment)
```bash
# Source: https://playwright.dev/docs/test-snapshots#updating-snapshots
cd apps/web
npx playwright test e2e/dashboard/visual-regression.spec.ts --update-snapshots
# Commit the generated -chromium-linux.png files
```

### `@next/bundle-analyzer` TypeScript Config
```typescript
// Source: https://nextjs.org/docs/app/guides/package-bundling
// apps/web/next.config.ts
import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@repo/shared', '@repo/database'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, net: false, tls: false, dns: false, child_process: false,
      };
    }
    return config;
  },
};

export default bundleAnalyzer(nextConfig);
```

### Run Bundle Analysis
```bash
# Source: https://nextjs.org/docs/app/guides/package-bundling
cd apps/web
ANALYZE=true npm run build
# Opens client.html, edge.html, nodejs.html in .next/analyze/
```

### Lighthouse CI Config (`apps/web/lighthouserc.json`)
```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run start",
      "startServerReadyPattern": "ready",
      "startServerReadyTimeout": 30000,
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/about",
        "http://localhost:3000/projects",
        "http://localhost:3000/login"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["warn", { "minScore": 1 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### GitHub Actions Lighthouse Job
```yaml
# Source: https://googlechrome.github.io/lighthouse-ci/docs/getting-started.html
lighthouse:
  name: Lighthouse CI
  runs-on: ubuntu-latest
  needs: test  # Run after E2E tests pass
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: cd apps/web && npm run build
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5434/teamflow
    - name: Run Lighthouse CI
      run: |
        npm install -g @lhci/cli@0.15.x
        cd apps/web && lhci autorun
      env:
        LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### ESLint Governance — Hardened `ignores` List
```typescript
// apps/web/eslint.config.mjs — after Phase 13 cleanup
// REMOVE from ignores: components/tasks/**, components/projects/**, components/teams/**,
//   components/portfolio/**, components/activity/**
// (All above paths were fully migrated in Phases 10-12 and no longer import deprecated components)
// KEEP in ignores (still valid):
//   components/ui/theme-toggle.tsx, components/ui/command-palette.tsx,
//   components/ui/empty-state.tsx, components/ui/conflict-warning.tsx,
//   components/ui/skeleton.tsx (these ARE the deprecated components themselves)
//   components/providers/**, components/layout/**
//   components/ui/button.tsx, card.tsx, etc. (Shadcn-installed, not restricted)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual accessibility audits | `@axe-core/playwright` in CI | Industry standard by 2023 | Automated WCAG AA enforcement per PR |
| `jest-axe` for component tests | `@axe-core/playwright` for page-level | ~2022 | Full-page tests catch more interaction-state violations |
| Separate visual testing service (Percy/Chromatic) | Playwright `toHaveScreenshot` | Playwright 1.18+ (2022) | No external service; baselines in git; free |
| Bundle analysis as manual step | `@next/bundle-analyzer` in CI pipeline | Next.js 11+ | Automated size tracking per PR |
| ESLint `.eslintrc.json` | Flat config `eslint.config.mjs` | ESLint 9+ (2024) | Already using flat config in this project |

**Deprecated/outdated:**
- `jest-axe`: Renders in jsdom, misses CSS variable contrast violations — use `@axe-core/playwright` for real browser testing
- Old `eslint.config.js` with `module.exports`: Project uses `.mjs` (ESM) — keep as-is
- `npx next experimental-analyze`: Requires Next.js 16.1+; project is on 15.1.0 — use `@next/bundle-analyzer` webpack plugin

---

## Open Questions

1. **Dashboard visual regression: team-specific routes (e.g. `/teams/[teamId]`)**
   - What we know: Auth state exists at `playwright/.auth/user.json`; `component-accessibility.spec.ts` navigates to team detail by clicking first `a[href^="/teams/"]`
   - What's unclear: Whether the seeded test data is stable enough (same team ID every time) to screenshot `/teams/[teamId]` directly without dynamic navigation
   - Recommendation: Use the dynamic navigation pattern from `component-accessibility.spec.ts` (click first team link) rather than hardcoding IDs. Mask the team-name header if it varies.

2. **Lighthouse CI: `LHCI_GITHUB_APP_TOKEN` requirement**
   - What we know: LHCI uploads reports to `temporary-public-storage` (Google GCS); without the token, GitHub status check annotations don't appear on PRs
   - What's unclear: Whether the project owner wants to install the GitHub App and store the secret
   - Recommendation: Configure `upload.target: "temporary-public-storage"` which works without the token (just no GitHub PR annotations). Token can be added later. The `lhci autorun` will still pass/fail based on assertions.

3. **Monorepo structure: `lighthouserc.json` placement**
   - What we know: `lhci autorun` looks for `lighthouserc.json` or `.lighthouserc.json` in working directory
   - What's unclear: Should config live at monorepo root or `apps/web/`?
   - Recommendation: Place at `apps/web/lighthouserc.json` and run `lhci autorun` from `apps/web` — this keeps it co-located with the Next.js app and avoids monorepo root pollution.

4. **Bundle baseline: Phase 11 baseline not documented**
   - What we know: Phase 11 finished form migrations; phase 13 success criterion says "decreased compared to Phase 11 baseline"
   - What's unclear: No bundle size was measured in Phase 11
   - Recommendation: Run `ANALYZE=true npm run build` in the first plan of phase 13 to establish current baseline, document the numbers, then verify at end of phase. The "decrease" metric is aspirational — document findings honestly.

---

## Sources

### Primary (HIGH confidence)
- [Playwright accessibility testing docs](https://playwright.dev/docs/accessibility-testing) — AxeBuilder API, withTags, include/exclude, CI integration pattern
- [Playwright snapshot testing docs](https://playwright.dev/docs/test-snapshots) — toHaveScreenshot, baseline management, update-snapshots flag
- [Next.js package bundling docs](https://nextjs.org/docs/app/guides/package-bundling) — @next/bundle-analyzer configuration, ANALYZE flag, TypeScript setup
- [Lighthouse CI getting started](https://googlechrome.github.io/lighthouse-ci/docs/getting-started.html) — lhci autorun, GitHub Actions YAML
- [Lighthouse CI configuration docs](https://googlechrome.github.io/lighthouse-ci/docs/configuration.html) — assertions schema, categories:performance, minScore

### Secondary (MEDIUM confidence)
- Existing `apps/web/eslint.config.mjs` — verified current COMP-05 state, ignores list, no-restricted-imports patterns
- Existing `apps/web/e2e/portfolio/visual-regression.spec.ts` — verified dark mode pattern (addInitScript + waitForTimeout(200))
- Existing `apps/web/e2e/portfolio/visual-regression.spec.ts-snapshots/` — verified 12 Linux-platform baselines committed
- Existing `.github/workflows/deploy.yml` — verified CI structure, E2E test step, artifact upload pattern
- Existing `apps/web/playwright.config.ts` — verified auth setup dependency, webServer config

### Tertiary (LOW confidence)
- WebSearch results for Lighthouse CI with Next.js standalone output — unverified whether `npm run start` vs `node .next/standalone/server.js` works correctly for lhci collect. Recommendation based on Next.js docs that `next start` serves `.next/` directory.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing installs confirmed from package.json; new installs (lhci, bundle-analyzer) verified against official docs
- Architecture: HIGH — Playwright patterns copied directly from existing codebase; Lighthouse/ESLint patterns verified from official docs
- Pitfalls: HIGH — platform mismatch verified from Playwright docs and existing Linux baselines; auth limitation verified from Lighthouse CI docs; import pattern verified from existing eslint.config.mjs

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (Playwright and lhci are stable; 30 days)
