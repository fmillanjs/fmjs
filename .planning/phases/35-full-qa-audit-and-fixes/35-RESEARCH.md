# Phase 35: Full QA Audit & Fixes - Research

**Researched:** 2026-02-25
**Domain:** End-to-end QA, Playwright against live production, Lighthouse CI performance auditing
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QA-01 | All critical DevCollab recruiter flows complete without errors (login → workspace → view/search content → notifications) | Flow mapped: login POST /auth/login → redirect /w/devcollab-demo → snippets/posts list → Cmd+K search → bell icon notifications. All surfaces identified in codebase. |
| QA-02 | All critical TeamFlow recruiter flows complete without errors (login → project → task management → real-time presence) | Flow mapped: NextAuth /login → /teams → team detail → project board → Kanban task move → presence indicator via WebSocket. Existing e2e spec (complete-flow.spec.ts) covers this. |
| QA-03 | All portfolio links on fernandomillan.me resolve correctly (nav, project cards, case study CTAs, footer) | All link surfaces audited in source: nav.tsx (5 links), footer.tsx (4 internal + 1 external), projects/page.tsx (2 project cards), devcollab case study CTA (href to devcollab.fernandomillan.me/w/devcollab-demo), teamflow case study CTA (href="/teams" — relative, points to TeamFlow app at teamflow.fernandomillan.me). |
| QA-04 | Portfolio Lighthouse scores remain >= 0.90 on all 5 public URLs after fixes applied | lighthouserc.json already exists targeting all 5 URLs. @lhci/cli 0.15.1 installed. lhci autorun supports direct production URL auditing without local server. |
</phase_requirements>

---

## Summary

Phase 35 is a QA-only phase — no new features, no architectural changes. The goal is to walk every recruiter-facing flow on both live apps and the portfolio, find every broken UI element, dead link, or 404, then fix them. Phase 34 confirmed both apps authenticate successfully in production; this phase goes deeper: do the full flows work end-to-end after login?

Three distinct audit domains exist. First, the DevCollab app (devcollab.fernandomillan.me): a Next.js 15 / NestJS 11 stack where login POSTs to the NestJS API, sets an httpOnly `devcollab_token` cookie, then redirects to `/w/devcollab-demo`. The recruiter flow continues to snippets, posts, Cmd+K search, and the notification bell. All surfaces are simple fetch-based components — bugs are likely to be cookie forwarding failures on SSR pages or CORS issues on client-side API calls. Second, the TeamFlow app (teamflow.fernandomillan.me): uses NextAuth v5 with `AUTH_TRUST_HOST=true`. The recruiter flow goes login → /teams → project board → Kanban interaction → real-time presence via Socket.IO. Third, the portfolio (fernandomillan.me): all navigation links, project card CTAs, case study CTAs, and footer links must resolve. The TeamFlow case study has a notably wrong CTA (`href="/teams"` is relative — on fernandomillan.me that would 404; it should be `https://teamflow.fernandomillan.me/teams`).

Lighthouse CI is already fully configured (`apps/web/lighthouserc.json`) targeting all five required URLs. `@lhci/cli` v0.15.1 is installed as a devDependency. The `lhci autorun` command can target production URLs directly with `--collect.url=https://...` without starting a local server. Playwright is also fully configured with e2e tests already written for portfolio navigation. The primary QA work is manual walkthroughs of the live apps, automated link-checking, and running lhci against production.

**Primary recommendation:** Run each recruiter flow manually on the live production URLs, document every breakage, fix in code, redeploy via existing CI/CD, then verify with `lhci autorun` against the five portfolio URLs. Do not build new test infrastructure — use what exists.

---

## Standard Stack

### Core (Already Installed — No New Dependencies Needed)

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|-------------|
| @lhci/cli | 0.15.1 | Lighthouse CI audits against production URLs | Already installed in apps/web; lighthouserc.json exists |
| @playwright/test | 1.58.2 | E2E browser tests for portfolio navigation | Already installed; playwright.config.ts configured; e2e/ specs exist |
| @axe-core/playwright | 4.11.1 | Accessibility checks in Playwright tests | Already installed; used in accessibility.spec.ts |
| curl / browser devtools | N/A | Manual HTTP response verification, 404 checking | Zero setup; fastest for manual flow audit |

### Supporting (For Link Audit)

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Playwright page.goto() + expect(page).toHaveURL() | existing | Automated link resolution checking | Extend existing navigation.spec.ts for CTA links |
| Browser Network tab | N/A | Check API calls return 200 during manual flow | During DevCollab/TeamFlow walkthroughs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| lhci autorun against production | lhci with local dev server | Local server gives more stable scores but requires a build; production is the source of truth for QA-04 |
| Manual flow walkthrough first | Automated Playwright against production | Playwright against production requires auth session setup; manual is faster for initial bug discovery |

**Installation:**
No new installations required. All tools are already in package.json.

To run existing tools:
```bash
# Lighthouse CI against production (from apps/web)
npx lhci autorun --collect.url=https://fernandomillan.me \
  --collect.url=https://fernandomillan.me/projects \
  --collect.url=https://fernandomillan.me/projects/teamflow \
  --collect.url=https://fernandomillan.me/projects/devcollab \
  --collect.url=https://fernandomillan.me/contact \
  --collect.settings.chromeFlags="--no-sandbox --disable-dev-shm-usage" \
  --assert.assertions.categories:performance=error \
  --assert.assertions.categories:performance.minScore=0.9 \
  --upload.target=temporary-public-storage

# Portfolio Playwright e2e (from apps/web)
npx playwright test e2e/portfolio/navigation.spec.ts --project=chromium
```

---

## Architecture Patterns

### Pattern 1: Manual Recruiter Walkthrough Before Automated Fixes

**What:** Walk the exact flow a recruiter would take — open the live URL, perform each action in sequence, note every error (console errors, visual breaks, failed API calls, 404s).
**When to use:** First pass — before writing any fixes. Automated tests can't catch everything a human notices (broken copy, confusing UX states, wrong redirect destinations).
**Walkthrough script:**

DevCollab flow:
```
1. Open https://devcollab.fernandomillan.me
2. Observe: login page visible with demo credentials shown?
3. Login as admin@demo.devcollab / Demo1234!
4. Observe: redirected to /w/devcollab-demo?
5. Navigate to snippets → does list load with seeded data?
6. Click a snippet → does detail page render?
7. Navigate to posts → does list load?
8. Click a post → does Markdown render?
9. Press Cmd+K → does search modal open?
10. Type a search term → do results appear?
11. Click bell icon → do notifications load?
12. Log out (check /api/logout endpoint works)
```

TeamFlow flow:
```
1. Open https://teamflow.fernandomillan.me
2. Observe: NextAuth login page visible?
3. Login with seeded demo credentials
4. Observe: redirected to /teams?
5. Navigate to a project → Kanban board loads?
6. Create a task or move a task → does it persist?
7. Open task detail → all fields visible?
8. Check presence indicator (online users) visible?
```

Portfolio link audit:
```
1. Open https://fernandomillan.me
2. Check every nav link (Home, About, Projects, Resume, Contact) → all resolve?
3. Click TeamFlow project card → goes to /projects/teamflow?
4. Click DevCollab project card → goes to /projects/devcollab?
5. On /projects/teamflow: click "View Live Demo" → goes to teamflow.fernandomillan.me?
6. On /projects/devcollab: click "View Live Demo" → goes to devcollab.fernandomillan.me/w/devcollab-demo?
7. Check all footer links (Home, About, Projects, Contact, GitHub) → all resolve?
```

### Pattern 2: Fix-Then-Redeploy via Existing CI/CD

**What:** Make code fix in monorepo → commit → push to main → GitHub Actions builds and pushes Docker images → Coolify redeploys from new image.
**When to use:** For every bug found that requires a code change. Do not SSH into VPS to hotfix — use the pipeline.
**Example:**

```bash
# Example: fix TeamFlow case study CTA href
# Edit apps/web/app/(portfolio)/projects/teamflow/page.tsx
# Change: href="/teams"
# To:     href="https://teamflow.fernandomillan.me"

git add apps/web/app/\(portfolio\)/projects/teamflow/page.tsx
git commit -m "fix(portfolio): fix TeamFlow live demo CTA to point to production URL"
git push origin main
# CI rebuilds portfolio-web image → Coolify redeploys → verify fix
```

### Pattern 3: Lighthouse CI Against Production URLs Directly

**What:** Run `lhci autorun` pointing `--collect.url` at the live production URLs — no local server required.
**When to use:** For QA-04 verification after all fixes are applied. Run from any machine with Chrome installed.
**Example:**

```bash
# From apps/web directory (where lighthouserc.json lives):
npx lhci autorun \
  --collect.url=https://fernandomillan.me/ \
  --collect.url=https://fernandomillan.me/projects \
  --collect.url=https://fernandomillan.me/projects/teamflow \
  --collect.url=https://fernandomillan.me/projects/devcollab \
  --collect.url=https://fernandomillan.me/contact \
  --collect.numberOfRuns=3 \
  --collect.settings.chromeFlags="--no-sandbox --disable-dev-shm-usage" \
  --assert.assertions.categories:performance=["error",{"minScore":0.9}] \
  --upload.target=temporary-public-storage
```

Alternatively, use the existing `lighthouserc.json` but override the `startServerCommand` (omit it) so lhci uses the `url` list directly without starting a server.

### Pattern 4: Portfolio Navigation Playwright Spec (Already Exists)

**What:** `apps/web/e2e/portfolio/navigation.spec.ts` already tests all nav links and page loads.
**When to use:** Run after any portfolio code fixes to confirm nothing regressed.

```bash
# From project root or apps/web:
cd /home/doctor/fernandomillan/apps/web
npx playwright test e2e/portfolio/navigation.spec.ts --project=chromium
```

### Anti-Patterns to Avoid

- **SSH hotfix on VPS:** Bypasses CI/CD; next redeploy will revert. All fixes must go through git → push → CI → Coolify.
- **Running lhci against localhost instead of production:** QA-04 requires production scores. Dev server scores will differ.
- **Fixing Lighthouse score by disabling audits:** The `assert` config already only enforces performance >= 0.90. Do not weaken the assertion.
- **Testing DevCollab flows in devcollab-web code with localhost API:** The production bug may not reproduce locally. Test on production first, fix in code, redeploy.

---

## Known Bug: TeamFlow Case Study CTA

**Identified in source review (HIGH confidence):**

File: `apps/web/app/(portfolio)/projects/teamflow/page.tsx` line 56

```tsx
// CURRENT (BROKEN on fernandomillan.me):
<a href="/teams" target="_blank" rel="noopener noreferrer">
  View Live Demo
</a>

// CORRECT (must be absolute production URL):
<a href="https://teamflow.fernandomillan.me" target="_blank" rel="noopener noreferrer">
  View Live Demo
</a>
```

This is a definitive 404 for any recruiter clicking "View Live Demo" on the TeamFlow case study. `href="/teams"` is a relative link — on `fernandomillan.me` it resolves to `fernandomillan.me/teams` which does not exist on the portfolio app.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Performance audit | Custom perf script | `lhci autorun` | Already installed; handles throttling, multiple runs, assertions |
| Link checker | Custom crawl script | Playwright navigation.spec.ts extension | Already configured; can add CTA link tests in 10 lines |
| Accessibility audit | Manual inspection | @axe-core/playwright (accessibility.spec.ts) | Already installed and running |
| Browser flow testing | Unit tests mocking fetch | Manual walkthrough + Playwright | Production auth state is real; can't be mocked cheaply |

**Key insight:** This phase is about finding and fixing real bugs in live production. The tooling is already 90% in place. The work is walkthroughs, observation, targeted fixes, and re-verification.

---

## Common Pitfalls

### Pitfall 1: DevCollab Cookie Not Forwarded on SSR Pages

**What goes wrong:** A page like `/w/devcollab-demo` is a Server Component that calls `cookies()` to get `devcollab_token` and forwards it to the NestJS API. If the cookie domain is wrong or the SSR fetch fails silently, the page renders "Workspace not found" with no error.
**Why it happens:** The `devcollab_token` cookie is set by the NestJS API with `COOKIE_DOMAIN=.fernandomillan.me`. If the browser is on `devcollab.fernandomillan.me` and the cookie domain is correct, the cookie will be present. SSR pages forward it manually — if the token is missing from `cookieStore.get()`, the API call returns 401.
**How to avoid:** After login, check browser devtools → Application → Cookies for `devcollab.fernandomillan.me`. Confirm `devcollab_token` is present and not expired. If missing, the login step itself failed.
**Warning signs:** Dashboard page shows "No workspaces yet" when there should be a seeded workspace. Workspace page shows "Workspace not found."

### Pitfall 2: TeamFlow Real-Time Presence Requires Socket.IO Connection

**What goes wrong:** The Kanban board loads but presence indicators (online users) are empty or show errors.
**Why it happens:** Socket.IO requires a separate WebSocket connection. The Redis adapter (`@socket.io/redis-adapter`) must be running. The TeamFlow fixes in Phase 34 resolved the Redis deadlock — but presence indicators depend on a successful Socket.IO handshake with the correct CORS origin.
**How to avoid:** After login, open browser devtools → Network → WS tab. Confirm a WebSocket connection to `teamflow.fernandomillan.me` is established. If connection fails, check CORS_ORIGIN env var in the NestJS API container matches `teamflow.fernandomillan.me`.
**Warning signs:** Console shows `WebSocket connection to 'wss://teamflow.fernandomillan.me/socket.io/...' failed`.

### Pitfall 3: Lighthouse Performance Score Penalized by Animation Libraries

**What goes wrong:** GSAP, Motion (Framer Motion), and Lenis are all loaded in the portfolio. These are heavy client-side bundles that increase TBT (Total Blocking Time) and LCP.
**Why it happens:** The portfolio already achieves high scores per the `lighthouserc.json` config (which was added deliberately). But any new code added during fixes (e.g., extra images, new JS imports) can drop performance below 0.90.
**How to avoid:** Make the smallest possible code change for each fix. Do not add new libraries. After each fix, re-run lhci to confirm score holds. The `next.config.ts` already uses `output: 'standalone'` for optimal bundle size.
**Warning signs:** LCP increases significantly after a fix (indicates new blocking resource); TBT increases (indicates new JS on the critical path).

### Pitfall 4: DevCollab Search Returns Empty for Wrong Query Terms

**What goes wrong:** The Cmd+K search modal appears but returns no results even with seeded data.
**Why it happens:** The search uses Postgres `tsvector` full-text search. The seeded data must have been indexed by the trigger. If the seed ran but the tsvector trigger wasn't applied (e.g., migration ran before trigger was created), search returns nothing.
**How to avoid:** Try multiple search terms that match seeded content (e.g., "javascript", "typescript", "demo"). If all return empty, suspect the tsvector trigger. This would be a VPS-level fix (run the migration SQL manually or reseed).
**Warning signs:** Search endpoint responds 200 but `{ posts: [], snippets: [] }` for terms that should match.

### Pitfall 5: Portfolio Footer Is Missing Some Links

**What goes wrong:** QA-03 requires checking "footer links" — but the current footer only has: Home, About, Projects, Contact (internal) and GitHub (external). There is no Resume link in the footer and no TeamFlow/DevCollab direct links.
**Why it happens:** The footer was designed to be minimal. The QA audit must confirm what IS there resolves correctly, and document if missing links are expected vs. a bug.
**How to avoid:** Audit footer.tsx source directly (already done). The current footer links are: /, /about, /projects, /contact, https://github.com/fmillanjs. Resume is only in the nav, not the footer. This is a deliberate design choice, not a bug.
**Warning signs:** N/A — just confirm existing links resolve, do not assume links are missing unless the spec mandates specific footer link content.

---

## Code Examples

### Lighthouse CI Against Production (No Server Required)

```bash
# Source: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
# Run from /home/doctor/fernandomillan/apps/web

npx lhci autorun \
  --collect.url="https://fernandomillan.me/" \
  --collect.url="https://fernandomillan.me/projects" \
  --collect.url="https://fernandomillan.me/projects/teamflow" \
  --collect.url="https://fernandomillan.me/projects/devcollab" \
  --collect.url="https://fernandomillan.me/contact" \
  --collect.numberOfRuns=3 \
  --collect.settings.chromeFlags="--no-sandbox --disable-dev-shm-usage" \
  --upload.target=temporary-public-storage
```

Note: The existing `lighthouserc.json` specifies `startServerCommand` for local use. When auditing production URLs, either override via CLI flags or modify `lighthouserc.json` to omit `startServerCommand` and use the `url` list directly.

### Playwright Portfolio Navigation Check

```typescript
// Source: apps/web/e2e/portfolio/navigation.spec.ts (existing — no auth needed)
// Run: npx playwright test e2e/portfolio/navigation.spec.ts --project=chromium

test('navigation links work', async ({ page }) => {
  await page.goto('https://fernandomillan.me')

  // Verify CTA links to case studies
  await page.goto('https://fernandomillan.me/projects/teamflow')
  const liveDemo = page.getByRole('link', { name: /View Live Demo/i })
  const href = await liveDemo.getAttribute('href')
  expect(href).toContain('teamflow.fernandomillan.me') // Catches the /teams bug
})
```

### DevCollab Cookie Auth Pattern (SSR)

```typescript
// Source: apps/devcollab-web/app/w/[slug]/page.tsx
// Pattern for SSR server-side auth forwarding:
import { cookies } from 'next/headers';

const cookieStore = await cookies();
const token = cookieStore.get('devcollab_token')?.value;
// Forward to API:
const res = await fetch(`${API_URL}/workspaces/${slug}`, {
  headers: token ? { Cookie: `devcollab_token=${token}` } : {},
  cache: 'no-store',
});
```

---

## Identified Bugs (Pre-Audit, From Code Review)

These are confirmed bugs found in the codebase during research — they must be fixed regardless of the manual walkthrough findings:

| Bug | File | Evidence | Fix |
|-----|------|----------|-----|
| TeamFlow "View Live Demo" CTA is relative `/teams` | `apps/web/app/(portfolio)/projects/teamflow/page.tsx` line 56 | `href="/teams"` relative link 404s on fernandomillan.me | Change to `href="https://teamflow.fernandomillan.me"` |
| DevCollab GitHub source link uses wrong repo | `apps/web/app/(portfolio)/projects/devcollab/page.tsx` line 67 | `href="https://github.com/fmillanjs/fmjs"` — may or may not be the actual repo | Verify actual GitHub repo URL |

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Run lhci against local dev server | Run lhci against production URLs directly via `--collect.url` | Scores reflect real-world production performance, not local dev |
| Manual link checking by clicking | Playwright navigation tests + manual walkthrough | Faster regression detection for subsequent phases |
| Fix bugs by SSHing into server | Fix in code → push → CI/CD → Coolify redeploy | Reproducible, auditable, no manual server state |

---

## Open Questions

1. **Are seeded demo users present in DevCollab production DB?**
   - What we know: Phase 34 confirms the app authenticates. The `devcollab-seed` service runs on container start.
   - What's unclear: Was the seed service able to complete successfully with the demo workspace data (workspaces, snippets, posts)? The login working only proves auth works, not that content is seeded.
   - Recommendation: Manual walkthrough will answer this immediately. If `/w/devcollab-demo` 404s or shows empty content, the seed failed and must be rerun on the VPS.

2. **Are TeamFlow seeded demo users present?**
   - What we know: Phase 34 confirms TeamFlow auth works with LIVE-02 complete.
   - What's unclear: Which demo credentials to use for the recruiter flow. The TeamFlow app uses NextAuth v5 — the seeded users need to be documented in the flow checklist.
   - Recommendation: Check `apps/api/src/` for seed data to identify the demo email/password, then include in the QA walkthrough script.

3. **Does the portfolio Lighthouse score currently pass >= 0.90?**
   - What we know: `lighthouserc.json` enforces 0.90 minimum. The config has been in place since a prior phase.
   - What's unclear: Whether recent changes (animations, GSAP, Motion library) have degraded performance below threshold.
   - Recommendation: Run `lhci autorun` against production as the first wave of this phase, before any fixes. If it passes already, QA-04 is verified immediately. If it fails, fixes are needed.

---

## Validation Architecture

> nyquist_validation is not configured in .planning/config.json — this section is omitted.

The config.json does not contain `workflow.nyquist_validation`. Skipping this section.

---

## Sources

### Primary (HIGH confidence)
- Code review of `apps/web/app/(portfolio)/projects/teamflow/page.tsx` — identified TeamFlow CTA bug directly in source
- Code review of `apps/web/app/(portfolio)/projects/devcollab/page.tsx` — confirmed DevCollab CTA points to correct subdomain path
- Code review of `apps/web/components/portfolio/nav.tsx` — all 5 nav links confirmed
- Code review of `apps/web/components/portfolio/footer.tsx` — all 5 footer links confirmed (4 internal, 1 external GitHub)
- Code review of `apps/web/lighthouserc.json` — confirms all 5 required URLs already configured, 0.90 threshold set
- Code review of `apps/web/package.json` — confirms `@lhci/cli@0.15.1`, `@playwright/test@1.58.2`, `@axe-core/playwright@4.11.1` all installed
- Code review of `apps/devcollab-web/app/w/[slug]/page.tsx` — SSR cookie forwarding pattern confirmed
- Code review of `apps/devcollab-web/components/search/SearchModal.tsx` — Cmd+K search uses `credentials: 'include'`
- Code review of `apps/devcollab-web/components/notifications/NotificationList.tsx` — notification fetch uses `credentials: 'include'`

### Secondary (MEDIUM confidence)
- [GoogleChrome/lighthouse-ci GitHub](https://github.com/GoogleChrome/lighthouse-ci) — confirmed `lhci autorun --collect.url=https://...` works without local server
- [lighthouse-ci configuration docs](https://googlechrome.github.io/lighthouse-ci/docs/configuration.html) — confirmed `--collect.url` flag overrides config `url` list
- [Playwright 2025 best practices — BetterStack](https://betterstack.com/community/guides/testing/playwright-best-practices/) — confirmed semantic selectors and production URL testing approach

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools already installed, versions confirmed from package.json
- Architecture: HIGH — all flows mapped from actual source code, not assumptions
- Pitfalls: HIGH — bugs identified directly from code review; production behavior pitfalls inferred from known Phase 34 fixes
- Known bugs: HIGH — TeamFlow CTA bug confirmed by reading the source file

**Research date:** 2026-02-25
**Valid until:** 2026-03-11 (stable stack, 14 days)
