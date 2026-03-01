---
phase: 45-nextjs-frontend
plan: 02
subsystem: web-frontend
tags: [nextjs, rsc, server-actions, react-hook-form, zod, icp-score, lead-table]
dependency_graph:
  requires: [45-01-auth-session]
  provides: [leads-dashboard, score-bar, lead-input-form, api-lib]
  affects: [45-03-lead-detail, 45-04-sse-streaming]
tech_stack:
  added: []
  patterns: [rsc-server-fetch, server-actions, zod-client-validation, react-hook-form, score-bar-component]
key_files:
  created:
    - ai-sdr/web/lib/api.ts
    - ai-sdr/web/components/leads/score-bar.tsx
    - ai-sdr/web/components/leads/lead-table.tsx
    - ai-sdr/web/components/leads/lead-input-form.tsx
    - ai-sdr/web/actions/leads.ts
  modified:
    - ai-sdr/web/app/(crm)/leads/page.tsx
decisions:
  - "leads/page.tsx uses explicit LeadSummary[] type annotation — TypeScript strict mode requires it when let [] is reassigned inside try/catch"
  - "ScoreBar uses green/amber/red color scale — no purple used anywhere in the component tree"
  - "createLead Server Action calls revalidatePath('/leads') before returning — ensures table refreshes if user navigates back"
  - "LeadInputForm navigates to /leads/:id on submit via router.push — leads user directly to SSE pipeline monitor"
metrics:
  duration: "2 min"
  completed_date: "2026-03-01"
  tasks_completed: 3
  tasks_total: 3
  files_created: 5
  files_modified: 1
---

# Phase 45 Plan 02: CRM Dashboard — Lead Table and Input Form Summary

RSC /leads dashboard with server-fetched lead table (ICP ScoreBar: green/amber/red), zod-validated client input form (react-hook-form), and createLead() Server Action posting to NestJS /leads.

## What Was Built

### lib/api.ts (Task 1)
Server-side fetch helper module using `process.env.API_URL` (no NEXT_PUBLIC_ prefix — RSC only). Exports `getLeads()` and `getLead(id)` with `cache: 'no-store'` for always-fresh data. Also exports TypeScript interfaces: `LeadSummary`, `LeadDetail`, `QualifyOutput`, `EnrichOutput`, `AIOutputRecord` — shared types for Plans 03 and 04.

### ScoreBar component (Task 1)
`ai-sdr/web/components/leads/score-bar.tsx` — horizontal progress bar rendering ICP score as percentage width. Color scale: green-500 (score >= 70), amber-400 (40-69), red-400 (< 40). Accessibility attributes: `role="progressbar"`, `aria-valuenow/min/max`, `aria-label`. No purple anywhere.

### LeadTable RSC (Task 2)
`ai-sdr/web/components/leads/lead-table.tsx` — pure RSC (no 'use client'). Renders leads as a bordered table with columns: Name (links to /leads/:id), Company, Industry, ICP Score (ScoreBar or "Pending" text), Status (colored badge), Submitted date. Empty state shows friendly message.

### LeadInputForm Client Component (Task 2)
`ai-sdr/web/components/leads/lead-input-form.tsx` — 'use client' form with react-hook-form + zodResolver. Three fields: Lead Name, Company Name, Company URL. Zod schema validates URL client-side before any API call (url() + startsWith http/https refine). On success: resets form and router.push to /leads/:id for SSE pipeline monitoring.

### createLead Server Action (Task 2)
`ai-sdr/web/actions/leads.ts` — 'use server' module. POSTs JSON to NestJS `${API_URL}/leads`. Throws on non-ok with status + body text for debugging. Calls `revalidatePath('/leads')` so the table refreshes when user navigates back.

### /leads Page RSC (Task 3)
`ai-sdr/web/app/(crm)/leads/page.tsx` — async RSC replacing the Plan 01 placeholder. Server-fetches leads with try/catch fallback (renders empty table if NestJS unavailable during build). Layout: page header, New Lead card with LeadInputForm, All Leads section with LeadTable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Implicit `any[]` type on leads variable**
- **Found during:** Task 3 (npm run build)
- **Issue:** TypeScript strict mode flagged `let leads = []` — cannot determine type when reassigned inside try/catch block
- **Fix:** Changed to `let leads: LeadSummary[] = []` and added `type LeadSummary` to import
- **Files modified:** `ai-sdr/web/app/(crm)/leads/page.tsx`
- **Commit:** 191f5e4

## Verification Results

| Check | Result |
|-------|--------|
| npm run build | PASS — compiled successfully, zero TypeScript errors |
| ScoreBar green/amber/red | PASS — all three colors present |
| No purple anywhere | PASS — grep found nothing |
| zodResolver in lead-input-form | PASS |
| API_URL without NEXT_PUBLIC_ | PASS |
| /leads route is dynamic | PASS — ƒ (Dynamic) in build output |

## Self-Check: PASSED

All created files exist on disk. All task commits verified in git log.

| Check | Status |
|-------|--------|
| lib/api.ts | FOUND |
| components/leads/score-bar.tsx | FOUND |
| components/leads/lead-table.tsx | FOUND |
| components/leads/lead-input-form.tsx | FOUND |
| actions/leads.ts | FOUND |
| app/(crm)/leads/page.tsx | FOUND (modified) |
| commit 158de02 | FOUND |
| commit 3fc190f | FOUND |
| commit 191f5e4 | FOUND |
