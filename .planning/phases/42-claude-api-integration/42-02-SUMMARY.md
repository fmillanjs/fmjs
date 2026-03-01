---
phase: 42-claude-api-integration
plan: "02"
subsystem: api
tags: [claude, anthropic, zod, prompt-engineering, structured-output, streaming]

# Dependency graph
requires:
  - phase: 42-01
    provides: ClaudeService with structuredOutput<T>() and streamText(), QualifySchema, EnrichSchema
provides:
  - QUALIFY_SYSTEM_PROMPT with ICP rubric (4 criteria, weights sum to 100) and two few-shot examples
  - ENRICH_SYSTEM_PROMPT for CRM field extraction with null handling
  - PERSONALIZE_SYSTEM_PROMPT for cold email generation
  - scripts/validate-claude.ts — standalone validation script confirming all three ClaudeService paths work end-to-end
  - Confirmed: icpScore=100 for perfect-fit lead, delta=0 between two runs (temperature 0 determinism verified)
affects:
  - 43-pipeline (builds qualify/enrich/personalize pipeline on top of these prompts)

# Tech tracking
tech-stack:
  added: [zod@4.3.6 (upgrade from v3 — zodOutputFormat requires z.toJSONSchema from zod v4)]
  patterns:
    - Prompt constants co-located in src/claude/prompts/ — never hardcoded in service files
    - Standalone validation script with ConfigService stub — tests ClaudeService outside NestJS DI
    - ICP rubric uses weighted criteria summing to 100 with few-shot anchoring for score stability

key-files:
  created:
    - ai-sdr/src/claude/prompts/qualify.prompt.ts
    - ai-sdr/src/claude/prompts/enrich.prompt.ts
    - ai-sdr/src/claude/prompts/personalize.prompt.ts
    - ai-sdr/scripts/validate-claude.ts
  modified:
    - ai-sdr/package.json (zod upgrade to v4.3.6)
    - ai-sdr/package-lock.json

key-decisions:
  - "Zod v4 required — zodOutputFormat() calls z.toJSONSchema() which only exists in zod@4+; upgraded from v3 to v4.3.6"
  - "Prompt constants live in src/claude/prompts/ — co-location enforced so Phase 43 pipeline imports from single canonical location"
  - "Two few-shot examples in QUALIFY_SYSTEM_PROMPT anchor the score distribution — prevents wild variance with temperature 0"
  - "Validation script uses dotenv directly and stubs ConfigService — no NestJS bootstrap overhead for ad-hoc validation"

patterns-established:
  - "Pattern 1: ICP rubric: four weighted criteria (companySize 30, industryFit 25, painPoints 25, decisionMaker 20) summing to 100"
  - "Pattern 2: Enrich prompt: null for missing fields, empty array for missing lists — never guess"
  - "Pattern 3: Personalize prompt: lead with value, under 150 words, single CTA — enforced by system prompt"

requirements-completed: []

# Metrics
duration: 15min
completed: 2026-03-01
---

# Phase 42 Plan 02: Prompt Engineering and Validation Summary

**Three Claude prompt constants validated end-to-end against real API: ICP score 100 for perfect-fit lead, delta 0 between two runs, streaming yielded 109 tokens — prompt engineering confirmed stable for Phase 43 pipeline**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-01T07:11:10Z
- **Completed:** 2026-03-01T07:30:00Z
- **Tasks:** 3 (including checkpoint)
- **Files modified:** 6

## Accomplishments

- Three prompt constants written and co-located in `src/claude/prompts/` — QUALIFY, ENRICH, PERSONALIZE
- Standalone `validate-claude.ts` script runs all three ClaudeService paths against the real Anthropic API
- ICP scoring confirmed deterministic: icpScore=100 for Sarah Chen (B2B SaaS CEO, 45 employees, explicit outbound pain), delta=0 between run 1 and run 2
- Enrich fields correct: companySize="45 employees", industry="B2B SaaS", techStack=[Notion, Linear, Slack], painPoints=[outbound pipeline]
- streamText yielded 109 tokens with personalized email referencing Flowmatic and Sarah's specific challenges
- Human reviewed and approved all four outputs before phase closes

## Task Commits

Each task was committed atomically:

1. **Task 1: Set ANTHROPIC_API_KEY** - `pre-existing` (pre-configured in environment)
2. **Task 2: Write prompt constants and validate-claude.ts** - `9a9d981` (feat)
3. **Task 3: Human checkpoint — outputs approved** - human-approved (no code changes)

**Plan metadata:** `(this commit)` (docs: complete plan)

## Files Created/Modified

- `ai-sdr/src/claude/prompts/qualify.prompt.ts` - QUALIFY_SYSTEM_PROMPT with 4-criteria rubric (weights sum to 100) and two few-shot examples anchoring score distribution
- `ai-sdr/src/claude/prompts/enrich.prompt.ts` - ENRICH_SYSTEM_PROMPT for CRM field extraction; null for missing scalar fields, empty array for missing list fields
- `ai-sdr/src/claude/prompts/personalize.prompt.ts` - PERSONALIZE_SYSTEM_PROMPT enforcing conversational tone, <150 words, single CTA
- `ai-sdr/scripts/validate-claude.ts` - Standalone validation script; instantiates ClaudeService with ConfigService stub, runs qualify (x2), enrich, streamText
- `ai-sdr/package.json` - zod upgraded from 3.25.76 to 4.3.6
- `ai-sdr/package-lock.json` - updated lockfile for zod v4

## Decisions Made

- **Zod v4 upgrade:** `zodOutputFormat()` calls `z.toJSONSchema()` which only exists in zod v4+. Upgraded from v3.25.76 to v4.3.6 to unblock structuredOutput calls. This is a breaking change that required testing (zod v4 has different nullable() semantics but the schema definitions were already using the correct pattern from Plan 42-01).
- **Prompt co-location in src/claude/prompts/:** All three prompt constants live under a single directory so Phase 43 pipeline services have one canonical import location. This prevents prompt drift across services.
- **Few-shot anchoring for score stability:** The QUALIFY_SYSTEM_PROMPT includes two calibrated few-shot examples (score 82 high-fit, score 12 low-fit) to anchor the distribution at temperature 0. This is why the delta between two runs is 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Upgraded zod v3 to v4 to enable zodOutputFormat()**
- **Found during:** Task 2 (writing validate-claude.ts and running it)
- **Issue:** `zodOutputFormat()` from `@anthropic-ai/sdk/helpers/zod` calls `z.toJSONSchema()` which does not exist in zod v3. The structuredOutput path threw at runtime: `TypeError: z.toJSONSchema is not a function`
- **Fix:** Upgraded zod from 3.25.76 to 4.3.6 in package.json; ran npm install to update lockfile
- **Files modified:** ai-sdr/package.json, ai-sdr/package-lock.json
- **Verification:** validate-claude.ts ran to completion with "ALL TESTS PASSED"
- **Committed in:** 9a9d981 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking dependency issue)
**Impact on plan:** Required upgrade of zod to v4. All existing schemas (QualifySchema, EnrichSchema) worked correctly in v4 without modification — the nullable() pattern established in Plan 42-01 was already correct for v4.

## Issues Encountered

- zod v3 to v4 upgrade required during Task 2 execution — blocked the validation script until resolved. Fixed automatically per deviation Rule 3.

## User Setup Required

ANTHROPIC_API_KEY must be a real sk-ant-* key (not placeholder) in ai-sdr/.env for the validation script to make live API calls. This was confirmed as pre-existing before Task 2 ran.

## Next Phase Readiness

- Phase 43 (pipeline) can now import QUALIFY_SYSTEM_PROMPT, ENRICH_SYSTEM_PROMPT, PERSONALIZE_SYSTEM_PROMPT from their canonical locations
- ClaudeService.structuredOutput<T>() and streamText() are confirmed working end-to-end
- ICP scoring rubric produces stable, deterministic scores (delta=0 at temperature 0)
- No blockers — ready for Phase 43 pipeline implementation

---

*Phase: 42-claude-api-integration*
*Completed: 2026-03-01*
