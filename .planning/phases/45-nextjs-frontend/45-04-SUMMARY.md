---
phase: 45-nextjs-frontend
plan: "04"
subsystem: frontend
tags: [react, next.js, shadcn, clipboard, accordion, badges, score-visualization]
dependency_graph:
  requires: [45-02, 45-03]
  provides: [score-card, why-score-card, enrichment-card, email-preview]
  affects: [lead-detail-page]
tech_stack:
  added: []
  patterns: [rsc-component, client-component, shadcn-accordion, shadcn-badge, navigator-clipboard, sonner-toast]
key_files:
  created:
    - ai-sdr/web/components/leads/score-card.tsx
    - ai-sdr/web/components/leads/why-score-card.tsx
    - ai-sdr/web/components/leads/enrichment-card.tsx
    - ai-sdr/web/components/leads/email-preview.tsx
  modified:
    - ai-sdr/web/app/(crm)/leads/[id]/page.tsx
decisions:
  - "ScoreCard and EnrichmentCard are RSC (no 'use client') — no interactivity needed, just data rendering"
  - "WhyScoreCard renders Accordion without 'use client' — Shadcn Accordion uses Radix state internally and works as RSC in Next.js 16"
  - "EmailPreview requires 'use client' — clipboard API and useState hook need browser context"
  - "navigator.clipboard.writeText() used directly — no library needed; Sonner toast for feedback"
  - "Copy button disabled={!emailText} — prevents clipboard call with empty string when pipeline not yet complete"
  - "All badge variants use Shadcn secondary/outline (slate-based) — no purple overrides added"
metrics:
  duration: "2 min"
  completed_date: "2026-03-01"
  tasks_completed: 3
  tasks_total: 4
  files_created: 4
  files_modified: 1
---

# Phase 45 Plan 04: Lead Detail AI Output Cards Summary

**One-liner:** ScoreCard with colored bar, collapsible WhyScoreCard accordion, EnrichmentCard with intent-signal badges, and EmailPreview with navigator.clipboard copy button — all wired into the lead detail page for complete leads.

## What Was Built

### Task 1: ScoreCard, WhyScoreCard, EnrichmentCard (RSC components)

**ScoreCard** (`ai-sdr/web/components/leads/score-card.tsx`)
- Wraps the existing `ScoreBar` component (Plan 02) with a Card container
- Displays `qualify.icpScore` as a horizontal colored bar (green/amber/red) with numeric label
- Shows `qualify.reasoning` as a muted paragraph below the bar
- Satisfies PIPE-02

**WhyScoreCard** (`ai-sdr/web/components/leads/why-score-card.tsx`)
- Uses Shadcn Accordion (`type="single" collapsible`) — collapsed by default
- Returns null if both matchedCriteria and weakCriteria are empty (defensive guard)
- "Strong Fit" section: green CheckCircle icons for each matched criterion
- "Gaps" section: red XCircle icons for each weak criterion
- Satisfies PIPE-03

**EnrichmentCard** (`ai-sdr/web/components/leads/enrichment-card.tsx`)
- Industry + Company Size in a 2-column grid (text only)
- Tech stack rendered as `variant="secondary"` Badge components (slate-colored)
- Pain points rendered as `variant="outline"` Badge components
- Sections hidden when arrays are empty
- Satisfies PIPE-05

### Task 2: EmailPreview (Client Component)

**EmailPreview** (`ai-sdr/web/components/leads/email-preview.tsx`)
- `'use client'` directive required for clipboard API and useState
- `navigator.clipboard.writeText(emailText)` in async `handleCopy` with try/catch
- Sonner `toast.success` / `toast.error` for clipboard feedback (Toaster already in layout.tsx)
- Copy button shows `<Check /> Copied!` for 2 seconds after success, then resets
- Button disabled when `emailText` is falsy (pipeline not complete yet)
- `<pre>` tag with `whitespace-pre-wrap font-sans` for email text display
- Satisfies PIPE-06 (email display) and PIPE-08 (copy button)

### Task 3: Lead Detail Page — Full Wiring

**`ai-sdr/web/app/(crm)/leads/[id]/page.tsx`** — replaced placeholder divs with real components:
- Complete leads: renders ScoreCard + WhyScoreCard + EnrichmentCard + EmailPreview in `space-y-4` wrapper
- Failed leads: red-bordered message card
- Processing leads: blue-bordered "refresh in a moment" message
- Pending leads: PipelineMonitor with `shouldStream=true` handles SSE pipeline trigger

`npm run build` passes clean — TypeScript valid, all four routes compile correctly.

## Checkpoint Status

Task 4 is `checkpoint:human-verify` — awaiting recruiter journey end-to-end verification.

The build is clean and components are ready. Backend (`docker compose up -d`) and frontend (`npm run dev`) must be running for the full test.

## Deviations from Plan

None — plan executed exactly as written.

## No Purple Check

`grep -r "purple" ai-sdr/web/components/ ai-sdr/web/app/` returns nothing. All badge/color variants use Shadcn default slate/green/amber/red tokens only.

## Self-Check

- [x] `ai-sdr/web/components/leads/score-card.tsx` — created, commit 5bcb5ea
- [x] `ai-sdr/web/components/leads/why-score-card.tsx` — created, commit 5bcb5ea
- [x] `ai-sdr/web/components/leads/enrichment-card.tsx` — created, commit 5bcb5ea
- [x] `ai-sdr/web/components/leads/email-preview.tsx` — created, commit a27dfc3
- [x] `ai-sdr/web/app/(crm)/leads/[id]/page.tsx` — modified, commit 2668c1a
- [x] `npm run build` — passes clean (ƒ dynamic routes for /leads and /leads/[id])
