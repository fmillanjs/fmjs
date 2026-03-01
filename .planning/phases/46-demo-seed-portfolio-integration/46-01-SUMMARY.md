---
phase: 46-demo-seed-portfolio-integration
plan: "01"
subsystem: ai-sdr/scripts
tags: [seed, prisma, demo-data, idempotency]
dependency_graph:
  requires: []
  provides: [DEMO-01, DEMO-02]
  affects: [ai-sdr/web leads page, Coolify demo environment]
tech_stack:
  added: []
  patterns: [DemoLead seedKey idempotency guard, standalone ts-node seed script outside NestJS]
key_files:
  created:
    - ai-sdr/scripts/seed.ts
  modified:
    - ai-sdr/package.json
decisions:
  - "Seed script uses raw new PrismaClient() — not PrismaService, which requires NestJS DI container"
  - "All 8 leads hand-authored (not faker) — DEMO-02 quality requires company-specific facts in emails"
  - "status: 'complete' on all seed leads — prevents SSE pipeline re-trigger on /leads/:id"
  - "Personalize content shape is { email: '...' } — matches pipeline.service.ts line 77 exactly"
  - "DemoLead.seedKey @unique is the idempotency guard — re-run is safe, skips existing leads"
metrics:
  duration: "2 minutes"
  completed_date: "2026-03-01"
  tasks_completed: 2
  files_created: 1
  files_modified: 1
---

# Phase 46 Plan 01: Demo Seed Script Summary

**One-liner:** Standalone ts-node seed script writes 8 hand-authored leads with qualify/enrich/personalize AIOutput rows across ICP scores 22-92 spanning 8 distinct industries, idempotent via DemoLead.seedKey.

## What Was Built

A standalone TypeScript seed script at `ai-sdr/scripts/seed.ts` that pre-populates the AI SDR database with 8 fictional leads covering the full ICP score spectrum (22-92). Each lead has three AIOutput rows with the exact step constants required by the pipeline (`'qualify'`, `'enrich'`, `'personalize'`). The script is idempotent — re-running produces no duplicate records.

The `db:seed` npm script was added to `ai-sdr/package.json`, enabling `npm run db:seed` from the `ai-sdr/` directory.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create seed script with 8 hand-authored leads | 8e074b7 | ai-sdr/scripts/seed.ts |
| 2 | Add db:seed npm script and verify score spectrum | 0b66964 | ai-sdr/package.json |

## Seed Data Overview

| seedKey | Name | Company | ICP Score | Industry |
|---------|------|---------|-----------|----------|
| demo-lead-01 | Sarah Chen | Meridian Capital | 92 | FinTech SaaS |
| demo-lead-07 | Alex Rivera | Stackline DevOps | 85 | DevTools SaaS |
| demo-lead-02 | James Okafor | ClearPath Health | 78 | Healthcare SaaS |
| demo-lead-03 | Maria Santos | Cartflow Commerce | 67 | E-commerce SaaS |
| demo-lead-08 | Priya Mehta | LogiStream | 55 | Logistics Tech |
| demo-lead-04 | David Park | Vertex HR Systems | 43 | HR Software |
| demo-lead-05 | Rachel Nguyen | BuildPilot | 31 | Construction Tech |
| demo-lead-06 | Tyler Brooks | Mosaic Mobile | 22 | Consumer Mobile Apps |

**Score spectrum:** 22-92 (covers full 20-95 range per DEMO-01)
**Industry diversity:** 8 distinct industries, no two leads share the same industry (DEMO-02)

## Verification Results

- First run: all 8 logged `[demo-lead-0X] seeded — icpScore: XX`
- Second run: all 8 logged `[demo-lead-0X] already seeded — skipping` (idempotency confirmed)
- Database confirmed: 8 leads, all `status: complete`, each with exactly 3 AIOutput rows (enrich, personalize, qualify)
- `npm run db:seed` (with DATABASE_URL env) works correctly from `ai-sdr/`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files Exist
- `ai-sdr/scripts/seed.ts` — FOUND
- `ai-sdr/package.json` (with db:seed) — FOUND

### Commits Exist
- `8e074b7` — FOUND (feat(46-01): create demo seed script with 8 hand-authored leads)
- `0b66964` — FOUND (feat(46-01): add db:seed npm script to package.json)

## Self-Check: PASSED
