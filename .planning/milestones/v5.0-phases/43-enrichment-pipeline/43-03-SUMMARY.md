---
phase: 43-enrichment-pipeline
plan: "03"
subsystem: ai-sdr/pipeline
tags: [pipeline, orchestrator, nestjs, prisma, streaming]
dependency_graph:
  requires: [43-01, 43-02]
  provides: [PipelineService, StepEvent, StepCallback, validate-pipeline]
  affects: [Phase 44 LeadsController, Phase 45 AIOutput queries]
tech_stack:
  added: []
  patterns: [sequential-orchestrator, callback-based-streaming, fail-safe-status-update]
key_files:
  created:
    - ai-sdr/src/pipeline/pipeline.service.ts
    - ai-sdr/scripts/validate-pipeline.ts
  modified:
    - ai-sdr/src/pipeline/pipeline.module.ts
decisions:
  - "PipelineService exported only from PipelineModule — thin AI services remain internal"
  - "STEP_QUALIFY/ENRICH/PERSONALIZE constants ensure Phase 45 AIOutput query literals never drift"
  - "buildLeadProfile() omits scraped section entirely when empty — clean fallback"
  - "Error handler uses nested .catch() on the fallback update — guarantees status=failed even if second Prisma call throws"
metrics:
  duration: "2 min"
  completed_date: "2026-03-01"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
requirements_satisfied: [PIPE-01, PIPE-04]
---

# Phase 43 Plan 03: PipelineService Orchestrator Summary

PipelineService sequential orchestrator wiring all four pipeline steps (scrape → qualify → enrich → personalize) into a single processWithStream() method with Prisma persistence, confirmed end-to-end with real Claude API calls: icpScore=62, industry='No-Code SaaS / Marketing Automation', companySize='1-50 employees', 111 streaming tokens.

## What Was Built

### PipelineService (`ai-sdr/src/pipeline/pipeline.service.ts`)

The central Phase 43 orchestrator that ties together all prior building blocks:

1. Sets `Lead.status = 'processing'` before any AI calls
2. Loads Lead from Postgres via `prisma.lead.findUniqueOrThrow()`
3. Calls `ScraperService.scrape()` — returns '' on any error, never throws
4. Builds lead profile string with optional scraped website content
5. Calls `QualifyService.qualify()` → writes AIOutput row with `step='qualify'` → emits `qualify-complete` event
6. Calls `EnrichService.enrich()` → writes AIOutput row with `step='enrich'` → emits `enrich-complete` event
7. Iterates `PersonalizeService.streamEmail()` async generator → writes `personalize-token` events per chunk → writes AIOutput row with `step='personalize'` → emits `personalize-complete`
8. Updates Lead record: `icpScore`, `industry`, `companySize`, `status='complete'`
9. On any exception: sets `Lead.status = 'failed'` then re-throws

Key exports:
- `PipelineService` — NestJS injectable
- `StepEvent` — discriminated union for all event types
- `StepCallback` — `(event: StepEvent) => void`
- `STEP_QUALIFY`, `STEP_ENRICH`, `STEP_PERSONALIZE` — string literal constants

### PipelineModule update (`ai-sdr/src/pipeline/pipeline.module.ts`)

Added `PipelineService` to providers. Changed exports from all four thin services to **only** `PipelineService` — internal services are encapsulated within the module. Phase 44 will inject `PipelineService` via `PipelineModule` import.

### validate-pipeline.ts (`ai-sdr/scripts/validate-pipeline.ts`)

End-to-end console validation script:
- Bootstraps NestJS app context (no HTTP server)
- Creates a real `Lead` row (`Sarah Chen / Flowmatic / https://flowmatic.io`)
- Calls `processWithStream()` with event tracking
- Streams email tokens to stdout in real-time
- Runs 13 assertions against Prisma state
- Cleans up test lead after assertions

## Actual Pipeline Execution Results

Run performed: 2026-03-01 against real Postgres (port 5436) + real Claude API

| Field | Value |
|-------|-------|
| icpScore | 62 |
| industry | No-Code SaaS / Marketing Automation |
| companySize | 1-50 employees |
| tokens received | 111 |
| AIOutput rows | 3 (qualify, enrich, personalize) |
| Lead.status | complete |

### Script Output (assertions section)

```
=== ASSERTIONS ===
  PASS: icpScore is non-null (got: 62)
  PASS: icpScore in range 0-100 (got: 62)
  PASS: status is 'complete' (got: complete)
  PASS: industry is non-null (got: No-Code SaaS / Marketing Automation)
  PASS: companySize is non-null (got: 1-50 employees)
  PASS: 3 AIOutput rows created (got: 3)
  PASS: AIOutput with step="qualify" exists
  PASS: AIOutput with step="enrich" exists
  PASS: AIOutput with step="personalize" exists
  PASS: qualify-complete event fired
  PASS: enrich-complete event fired
  PASS: personalize-complete event fired
  PASS: personalize-token events fired (got: 111 tokens)

=== ALL ASSERTIONS PASSED ===
```

### Generated Email (streaming output)

```
Hi Sarah,

Building an all-in-one platform that replaces 14 tools is a compelling story — but I
imagine getting that message to cut through against the GoHighLevels and HubSpots of
the world is a real challenge.

A lot of no-code SaaS companies we work with struggle with the same thing: the product
is genuinely better for their audience, but onboarding drop-off and positioning dilute
the growth curve before word-of-mouth kicks in.

We help platforms like Flowmatic tighten their activation sequences and sharpen their
messaging so non-technical users actually *get* the value fast — reducing churn in
those critical first 30 days.

Given that you're serving entrepreneurs, agencies, and marketers across the board,
there's likely a quick win in segmenting how you communicate value to each group.

Worth a quick 15-min chat to see if any of this is relevant to where Flowmatic is headed?
```

## Deviations from Plan

None — plan executed exactly as written. All files match the plan specification. TypeScript compiled with zero errors. All 13 assertions passed on first run.

## Self-Check: PASSED

- FOUND: ai-sdr/src/pipeline/pipeline.service.ts
- FOUND: ai-sdr/src/pipeline/pipeline.module.ts
- FOUND: ai-sdr/scripts/validate-pipeline.ts
- FOUND: .planning/phases/43-enrichment-pipeline/43-03-SUMMARY.md
- FOUND: commit 791c22b (Task 1 — PipelineService)
- FOUND: commit ec70aa4 (Task 2 — validate-pipeline.ts)
