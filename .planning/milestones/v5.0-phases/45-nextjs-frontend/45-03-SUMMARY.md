---
phase: 45-nextjs-frontend
plan: 03
subsystem: ui
tags: [nextjs, react, sse, eventsource, streaming, typescript, tailwind]

# Dependency graph
requires:
  - phase: 45-01
    provides: Next.js app scaffold with Shadcn/Radix design system and utility lib
  - phase: 45-02
    provides: getLead/getLeads API functions and LeadDetail/QualifyOutput/EnrichOutput types in lib/api.ts
  - phase: 44-02
    provides: GET /leads/:id/stream SSE endpoint that triggers pipeline and emits qualify-complete/enrich-complete/token/personalize-complete events
provides:
  - Lead detail page at /leads/:id (RSC, dynamic route)
  - PipelineMonitor client component with EventSource SSE state machine
  - Real-time three-step progress indicators (qualify/enrich/personalize)
  - Token-by-token email streaming preview
  - shouldStream guard preventing double pipeline runs for non-pending leads
affects:
  - 45-04 (adds ScoreCard and EnrichmentCard into the placeholder sections in leads/[id]/page.tsx)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - EventSource opened conditionally via shouldStream prop — prevents duplicate pipeline triggers
    - useEffect cleanup returns es.close() — prevents orphaned SSE connections on navigation
    - onerror closes EventSource without reconnect — NestJS 30s timeout is terminal not transient
    - RSC fetches lead, passes status to Client Component — clean server/client boundary
    - params: Promise<{id}> awaited in RSC — Next.js 16 async params pattern
    - NEXT_PUBLIC_API_URL env var — required for Client Component browser-side fetch

key-files:
  created:
    - ai-sdr/web/components/leads/pipeline-monitor.tsx
    - ai-sdr/web/app/(crm)/leads/[id]/page.tsx
  modified: []

key-decisions:
  - "shouldStream = lead.status === 'pending' only — processing/complete/failed leads get static render, no EventSource opened"
  - "onerror does NOT reconnect EventSource — NestJS 30s pipeline timeout is a terminal condition, not a transient network error"
  - "Placeholder score-section and enrich-section divs added to leads/[id]/page.tsx for Plan 04 components"
  - "NEXT_PUBLIC_API_URL with localhost:3001 fallback — Client Component cannot access server-side API_URL"

patterns-established:
  - "SSE Client Component pattern: shouldStream prop gates EventSource creation; cleanup in useEffect return"
  - "Step state machine: qualify starts 'running', transitions to 'complete' then advances next step on each SSE event"

requirements-completed: [PIPE-06, PIPE-07]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 45 Plan 03: Lead Detail Page + PipelineMonitor Summary

**RSC lead detail page and PipelineMonitor client component delivering live three-step pipeline progress (qualify/enrich/personalize) with token-by-token email streaming via native EventSource SSE**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T12:23:22Z
- **Completed:** 2026-03-01T12:25:02Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- PipelineMonitor client component with EventSource SSE opened only for pending leads — prevents double pipeline runs
- Three-step progress indicators (Qualify Lead / Enrich CRM / Generate Email) with pending/running/complete visual states driven by SSE events
- Token-by-token email streaming with blinking cursor during personalize step; full email rendered statically for complete leads
- RSC lead detail page at /leads/[id] with shouldStream guard, breadcrumb nav, and placeholder sections for Plan 04 components
- Build passes clean — /leads/[id] renders as dynamic route with no TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: PipelineMonitor client component with EventSource SSE** - `a8ef1ef` (feat)
2. **Task 2: Lead detail RSC page with PipelineMonitor integration** - `2cdfbee` (feat)

## Files Created/Modified
- `ai-sdr/web/components/leads/pipeline-monitor.tsx` - 'use client' component: EventSource SSE, step state machine, streaming email preview, error handling
- `ai-sdr/web/app/(crm)/leads/[id]/page.tsx` - RSC page: fetches lead, derives shouldStream, renders PipelineMonitor with initialEmailText

## Decisions Made
- `shouldStream = lead.status === 'pending'` only — avoids double pipeline trigger for processing/complete/failed leads; this is documented as CRITICAL in the plan and the SSE endpoint itself IS the pipeline trigger
- `onerror` closes EventSource without reconnect — the NestJS SSE endpoint has a 30s timeout after which it closes; this is terminal behavior, not a transient network error that should be retried
- Placeholder `id="score-section"` and `id="enrich-section"` divs added so Plan 04 components have a clear slot to fill without modifying page structure again
- `NEXT_PUBLIC_API_URL` with `localhost:3001` fallback — Client Components execute in the browser and cannot access server-side `API_URL` env var

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Build produced an expected console warning "Failed to fetch leads" during static generation (NestJS not running at build time), which is caught gracefully. Routes `/leads` and `/leads/[id]` are both marked as dynamic (ƒ) in the build output.

## User Setup Required

None — no external service configuration required. `NEXT_PUBLIC_API_URL` is optional (defaults to `localhost:3001`).

## Next Phase Readiness
- Lead detail page with PipelineMonitor ready for Plan 45-04 (ScoreBar + EnrichmentCard components)
- `id="score-section"` and `id="enrich-section"` placeholder divs in place for Plan 04 to replace
- EventSource SSE wired to `GET /leads/:id/stream` — ready for end-to-end testing once NestJS is running

## Self-Check: PASSED

- FOUND: ai-sdr/web/components/leads/pipeline-monitor.tsx
- FOUND: ai-sdr/web/app/(crm)/leads/[id]/page.tsx
- FOUND: .planning/phases/45-nextjs-frontend/45-03-SUMMARY.md
- FOUND commit a8ef1ef: feat(45-03): add PipelineMonitor client component with EventSource SSE
- FOUND commit 2cdfbee: feat(45-03): add lead detail RSC page with PipelineMonitor integration

---
*Phase: 45-nextjs-frontend*
*Completed: 2026-03-01*
