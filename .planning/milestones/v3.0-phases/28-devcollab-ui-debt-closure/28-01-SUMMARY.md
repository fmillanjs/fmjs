---
phase: 28-devcollab-ui-debt-closure
plan: "01"
subsystem: devcollab-web + portfolio
tags: [auth-guard, server-component, resume, social-links, portfolio-copy]
dependency_graph:
  requires: []
  provides:
    - Server-side auth redirect on /dashboard
    - CreateWorkspaceForm extracted as client component
    - Real resume PDF at /resume.pdf
    - Correct social links (fmillanjs GitHub + CodeSignal)
  affects:
    - apps/devcollab-web/app/dashboard/page.tsx
    - apps/devcollab-web/components/CreateWorkspaceForm.tsx
    - apps/web/public/resume.pdf
    - apps/web/components/portfolio/footer.tsx
    - apps/web/components/portfolio/hero-section.tsx
    - apps/web/app/(portfolio)/about/page.tsx
    - apps/web/app/(portfolio)/resume/page.tsx
    - apps/web/app/(portfolio)/projects/devcollab/page.tsx
    - apps/web/app/(portfolio)/projects/teamflow/page.tsx
tech_stack:
  added: []
  patterns:
    - Next.js 15 server component auth guard with await cookies() + redirect()
    - Client component extraction for interactive forms (CreateWorkspaceForm)
    - router.refresh() for server component re-fetch after client mutation
key_files:
  created:
    - apps/devcollab-web/components/CreateWorkspaceForm.tsx
    - apps/web/public/resume.pdf
  modified:
    - apps/devcollab-web/app/dashboard/page.tsx
    - apps/web/components/portfolio/footer.tsx
    - apps/web/components/portfolio/hero-section.tsx
    - apps/web/app/(portfolio)/about/page.tsx
    - apps/web/app/(portfolio)/resume/page.tsx
    - apps/web/app/(portfolio)/projects/devcollab/page.tsx
    - apps/web/app/(portfolio)/projects/teamflow/page.tsx
decisions:
  - "dashboard/page.tsx converted to async server component — auth guard runs before any HTML is rendered, eliminating auth flash"
  - "CreateWorkspaceForm uses router.refresh() not callback prop — server component parent has no mutable state"
  - "LinkedIn replaced with CodeSignal (ExternalLink icon) — matches minimal portfolio aesthetic"
  - "Removed generic 'Previous Experience (customizable)' and 'University Name (customizable)' entries from resume — placeholder content is harmful to recruiter impression"
metrics:
  duration: "3 minutes"
  completed_date: "2026-02-20"
  tasks_completed: 2
  tasks_planned: 2
  files_modified: 9
---

# Phase 28 Plan 01: Dashboard Auth Guard + Portfolio Fixes Summary

Server-side auth redirect on /dashboard, extracted CreateWorkspaceForm client component, real resume PDF at /resume.pdf, corrected GitHub (fmillanjs) and CodeSignal social links, and recruiter-optimized copy across about/resume pages.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Convert dashboard to server component with auth guard | f6d01ab | dashboard/page.tsx, CreateWorkspaceForm.tsx |
| 2 | Resume PDF + portfolio social link fixes | c444da8 | resume.pdf, footer.tsx, hero-section.tsx, about/page.tsx, resume/page.tsx, devcollab/page.tsx, teamflow/page.tsx |

## What Was Built

### Task 1: Dashboard Server Component

Converted `apps/devcollab-web/app/dashboard/page.tsx` from a `'use client'` component (with no auth guard) to an async server component. The new server component:

1. Reads `devcollab_token` cookie server-side via `await cookies()`
2. Calls `redirect('/login')` immediately if no token — zero HTML rendered for unauthenticated users
3. Fetches `/workspaces` server-side using the token as Cookie header
4. Renders workspace list + `<CreateWorkspaceForm />` child component

Extracted all interactive form state into a new `CreateWorkspaceForm` client component that uses `router.refresh()` after successful workspace creation to re-trigger the server component's workspace fetch.

### Task 2: Portfolio Fixes

- Copied `resume.pdf` (4.4KB) from project root to `apps/web/public/resume.pdf` — served as static asset at `/resume.pdf`
- Footer: GitHub link `fernandomillan` -> `fmillanjs`, LinkedIn replaced with CodeSignal profile
- Hero section: GitHub button `fernandomillan` -> `fmillanjs`
- DevCollab project page: GitHub source link `fernandomillan` -> `fmillanjs`
- TeamFlow project page: GitHub source link `fernandomillan` -> `fmillanjs`
- About page: Professional Summary replaced with recruiter-optimized copy highlighting both deployed SaaS apps
- Resume page: Summary updated with specific tech/achievements; Experience bullets updated to cover both TeamFlow and DevCollab; placeholder notice removed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing correctness] Removed additional placeholder content from resume/page.tsx**
- **Found during:** Task 2 verification (`grep "customizable"` caught extra entries)
- **Issue:** "Previous Experience (customizable)" and "University Name (customizable)" entries remained in resume page — placeholder content visible to recruiters
- **Fix:** Removed the entire "Previous Experience (customizable)" experience block; changed "University Name (customizable)" to "Self-taught" in education section
- **Files modified:** apps/web/app/(portfolio)/resume/page.tsx
- **Commit:** c444da8 (included in Task 2 commit)

## Verification Results

All 7 plan verification checks passed:
1. `grep "'use client'" dashboard/page.tsx` — empty (PASS)
2. `grep "await cookies|redirect('/login')" dashboard/page.tsx` — both present (PASS)
3. `ls -la apps/web/public/resume.pdf` — 4434 bytes (PASS)
4. `git status apps/web/public/resume.pdf` — clean/committed (PASS)
5. `grep "fmillanjs"` in footer + hero — correct URL in both (PASS)
6. `grep "codesignal" footer.tsx` — CodeSignal link present (PASS)
7. `grep "linkedin" footer.tsx` — no LinkedIn (PASS)

## Self-Check: PASSED

All created/modified files exist and commits are verified:
- `f6d01ab` — feat(28-01): convert dashboard to server component with auth guard
- `c444da8` — feat(28-01): resume PDF + portfolio social link fixes
