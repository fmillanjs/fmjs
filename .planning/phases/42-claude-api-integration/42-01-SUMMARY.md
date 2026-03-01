---
phase: 42-claude-api-integration
plan: 01
subsystem: api
tags: [anthropic, claude, zod, nestjs, structured-outputs, streaming]

# Dependency graph
requires:
  - phase: 41-project-foundation
    provides: NestJS app scaffold with ConfigModule (ANTHROPIC_API_KEY validation), DatabaseModule, HealthModule, AppModule wiring pattern

provides:
  - ClaudeService with structuredOutput<T>() using messages.parse + zodOutputFormat and streamText() AsyncGenerator
  - ClaudeModule as the single SDK ownership boundary — all other modules call ClaudeService, never import Anthropic SDK directly
  - QualifySchema (icpScore int 0-100, reasoning, matchedCriteria, weakCriteria)
  - EnrichSchema (companySize/industry nullable, techStack/painPoints arrays)

affects:
  - 43-pipeline — imports ClaudeService for qualify, enrich, and email personalization steps
  - any feature module needing AI calls

# Tech tracking
tech-stack:
  added: ["@anthropic-ai/sdk@0.78.0", "zod@3.25.76"]
  patterns:
    - "Single SDK ownership: ClaudeService is the only file that imports @anthropic-ai/sdk"
    - "Structured outputs via messages.parse() + zodOutputFormat() with temperature:0"
    - "Streaming via messages.stream() with AsyncGenerator<string> text-delta yield"
    - "nullable() not optional() for nullable Zod fields — Anthropic requires all fields in required array"

key-files:
  created:
    - ai-sdr/src/claude/claude.service.ts
    - ai-sdr/src/claude/claude.module.ts
    - ai-sdr/src/claude/schemas/qualify.schema.ts
    - ai-sdr/src/claude/schemas/enrich.schema.ts
  modified:
    - ai-sdr/src/app.module.ts
    - ai-sdr/package.json
    - ai-sdr/package-lock.json

key-decisions:
  - "zodOutputFormat() takes 1 arg (schema only) — plan template had wrong 2-arg call; fixed during execution"
  - "Use claude-sonnet-4-6 model constant in ClaudeService — single place to change for all Phase 43 pipeline steps"
  - "nullable() not optional() for EnrichSchema fields — Anthropic structured outputs require all fields in JSON schema required array"
  - "No temperature on streamText() — creative variation acceptable for email personalization per research"

patterns-established:
  - "ClaudeModule: @Module({ providers: [ClaudeService], exports: [ClaudeService] }) — mirrors DatabaseModule pattern exactly"
  - "structuredOutput<T extends ZodType>(schema, systemPrompt, userMessage): Promise<ZodInfer<T>> — generic typed output"
  - "streamText(systemPrompt, userMessage): AsyncGenerator<string> — yields only text_delta events"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 42 Plan 01: ClaudeModule — ClaudeService, Zod Schemas, AppModule Registration Summary

**ClaudeService with structuredOutput<T>() and streamText() behind a single SDK boundary, QualifySchema + EnrichSchema, registered in NestJS AppModule and container boots healthy**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T07:08:57Z
- **Completed:** 2026-03-01T07:11:10Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Installed @anthropic-ai/sdk@0.78.0 and zod@3 in ai-sdr, TypeScript compiles clean
- Created ClaudeService with structuredOutput<T>() (messages.parse + zodOutputFormat, temperature:0) and streamText() (AsyncGenerator yielding text deltas)
- Created QualifySchema (icpScore int 0-100, reasoning, matchedCriteria, weakCriteria) and EnrichSchema (companySize/industry nullable, techStack/painPoints arrays) with correct nullable vs optional usage
- Registered ClaudeModule in AppModule — Docker container rebuilt and GET /health returns {"status":"ok"} confirming DI resolves correctly
- SDK isolation confirmed: grep shows only claude.service.ts imports @anthropic-ai/sdk

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @anthropic-ai/sdk and zod, scaffold ClaudeModule** - `1ef8fb4` (feat)
2. **Task 2: Register ClaudeModule in AppModule, verify NestJS boots** - `c745965` (feat)

## Files Created/Modified

- `ai-sdr/src/claude/claude.service.ts` - ClaudeService with structuredOutput<T>() and streamText() methods
- `ai-sdr/src/claude/claude.module.ts` - NestJS module providing and exporting ClaudeService
- `ai-sdr/src/claude/schemas/qualify.schema.ts` - QualifySchema Zod object + QualifyOutput type
- `ai-sdr/src/claude/schemas/enrich.schema.ts` - EnrichSchema Zod object + EnrichOutput type
- `ai-sdr/src/app.module.ts` - Added ClaudeModule to imports array
- `ai-sdr/package.json` - Added @anthropic-ai/sdk and zod dependencies
- `ai-sdr/package-lock.json` - Updated lockfile

## Decisions Made

- Used `claude-sonnet-4-6` as private constant in ClaudeService — single point of change for all Phase 43 pipeline steps
- Used `nullable()` not `optional()` for companySize and industry — Anthropic structured outputs require all fields in JSON schema `required` array; optional() removes the field from required and the API would reject the schema
- No temperature on streamText() — creative variation is acceptable for email personalization per research

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] zodOutputFormat called with 2 arguments — function only accepts 1**
- **Found during:** Task 1 (scaffold ClaudeService)
- **Issue:** Plan template had `zodOutputFormat(schema, 'output')` but the actual SDK type signature is `zodOutputFormat(zodObject: ZodInput): AutoParseableOutputFormat<...>` — 1 argument only
- **Fix:** Removed second argument: `zodOutputFormat(schema)`
- **Files modified:** ai-sdr/src/claude/claude.service.ts
- **Verification:** `npx tsc --noEmit` passes with 0 errors after fix
- **Committed in:** 1ef8fb4 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in plan template)
**Impact on plan:** Fix required for TypeScript compilation. No scope creep — single argument removal.

## Issues Encountered

None beyond the auto-fixed deviation above.

## User Setup Required

None - ANTHROPIC_API_KEY is already required by ConfigModule validation schema from Phase 41. Container will fail to start without it, which is the desired guard.

## Next Phase Readiness

- ClaudeService is ready for Phase 43 pipeline — structuredOutput<T>() and streamText() are wired and typed
- QualifySchema and EnrichSchema are ready for pipeline qualify/enrich steps
- ClaudeModule is in the DI graph — any Phase 43 module just needs to import ClaudeModule to inject ClaudeService
- No blockers

---
*Phase: 42-claude-api-integration*
*Completed: 2026-03-01*
