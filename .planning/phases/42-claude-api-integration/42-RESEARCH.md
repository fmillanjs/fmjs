# Phase 42: Claude API Integration - Research

**Researched:** 2026-03-01
**Domain:** Anthropic SDK TypeScript, NestJS injectable service patterns, structured outputs with Zod, streaming
**Confidence:** HIGH

## Summary

Phase 42 builds the ClaudeService — the single NestJS module that owns all Anthropic SDK interaction for the ai-sdr application. Every other module that needs Claude calls ClaudeService methods; no other module imports the SDK directly. The service exposes two surface areas: `structuredOutput<T>()` for typed JSON responses (ICP qualification and CRM enrichment) and `streamText()` for async token streams (email personalization).

The Anthropic TypeScript SDK version 0.78.0 (latest as of research date) provides a native `client.messages.parse()` method combined with `zodOutputFormat()` from `@anthropic-ai/sdk/helpers/zod`, which translates a Zod schema directly into a constrained-decoding `output_config.format` parameter. This is now generally available (not beta) for Claude claude-opus-4-6, claude-sonnet-4-6, claude-sonnet-4-5, claude-opus-4-5, and claude-haiku-4-5. No beta header is required for the current API shape.

Temperature 0 produces highly consistent but not perfectly deterministic output. Claude has no seed parameter. The phase success criterion of "same ICP score both times" should be validated empirically — in practice, temperature=0 produces the same integer score on repeated calls for short, well-defined prompts, but this is probabilistic not guaranteed. The ICP scoring prompt must be engineered carefully: explicit integer-only output with a rubric, few-shot examples, and `.describe()` hints on the Zod field all improve consistency.

**Primary recommendation:** Use `client.messages.parse()` + `zodOutputFormat()` for structuredOutput and `client.messages.stream()` with the `.on('text', cb)` event for streamText. Install `@anthropic-ai/sdk` and `zod` together. Wire ClaudeService as a global NestJS provider following the same DatabaseModule pattern already established in Phase 41.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | 0.78.0 | Official Anthropic TypeScript SDK — messages.create, messages.parse, streaming | Only official Anthropic SDK; handles retries, auth, SSE protocol |
| `zod` | ^3.25.0 or ^4.0.0 | Schema definition for structuredOutput types | SDK has native Zod integration via `zodOutputFormat()`; schemas become runtime validators and TypeScript types simultaneously |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@nestjs/config` | ^4.0.0 | Already installed — inject ANTHROPIC_API_KEY into ClaudeService | Already wired in app.module.ts Joi validation schema |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@anthropic-ai/sdk` native structured output | Vercel AI SDK (`ai` package) | AI SDK adds abstraction over multiple providers — unnecessary complexity for single-provider project |
| `zodOutputFormat` helper | Manual `zodToJsonSchema()` + `output_config` | Manual conversion works but is more verbose and bypasses the SDK's `parsed_output` convenience |
| NestJS `@Injectable` service | Module-level factory | No advantage for a stateless service; `@Injectable()` singleton is simpler and matches DatabaseModule pattern |

**Installation:**
```bash
npm install @anthropic-ai/sdk zod
```

Note: `zod` is an optional peer dependency of `@anthropic-ai/sdk`. It is required to use `zodOutputFormat()` and `messages.parse()`. Install both together.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── claude/
│   ├── claude.module.ts       # exports ClaudeService, imports ConfigModule (global, so no explicit import needed)
│   ├── claude.service.ts      # ClaudeService with structuredOutput<T>() and streamText()
│   └── schemas/
│       ├── qualify.schema.ts  # QualifySchema Zod object — ICP score + reasoning
│       └── enrich.schema.ts   # EnrichSchema Zod object — companySize, industry, techStack, painPoints
├── database/                  # Phase 41 (unchanged)
└── health/                    # Phase 41 (unchanged)
```

### Pattern 1: NestJS Injectable Service wrapping Anthropic SDK

**What:** ClaudeService is a singleton `@Injectable()` that initializes the Anthropic client from ConfigService in the constructor, following the same lifecycle pattern as PrismaService.
**When to use:** Always — this is the only pattern for Phase 42.

**Example:**
```typescript
// Source: official Anthropic SDK docs + NestJS DI patterns established in Phase 41
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { ZodType, infer as ZodInfer } from 'zod';

@Injectable()
export class ClaudeService {
  private readonly client: Anthropic;
  private readonly model = 'claude-opus-4-6';

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async structuredOutput<T extends ZodType>(
    schema: T,
    systemPrompt: string,
    userMessage: string,
  ): Promise<ZodInfer<T>> {
    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: 1024,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      output_config: { format: zodOutputFormat(schema) },
    });
    return response.parsed_output as ZodInfer<T>;
  }

  async *streamText(
    systemPrompt: string,
    userMessage: string,
  ): AsyncGenerator<string> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }
}
```

### Pattern 2: Zod Schema Definitions for qualify and enrich steps

**What:** Separate schema files in `src/claude/schemas/` that define the typed output shapes. These schemas are imported by both ClaudeService callers (Phase 43 PipelineService) and TypeScript types throughout the app.
**When to use:** Always define schemas in their own files — they are imported by Phase 43 and used as TypeScript type sources.

**Example — qualify schema:**
```typescript
// Source: Anthropic structured outputs docs + ICP rubric research
import { z } from 'zod';

export const QualifySchema = z.object({
  icpScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe('ICP fit score from 0 (worst fit) to 100 (best fit). Integer only.'),
  reasoning: z
    .string()
    .describe('One paragraph explaining why this score was assigned, referencing specific criteria.'),
  matchedCriteria: z
    .array(z.string())
    .describe('ICP criteria this lead satisfies.'),
  weakCriteria: z
    .array(z.string())
    .describe('ICP criteria this lead does not satisfy.'),
});

export type QualifyOutput = z.infer<typeof QualifySchema>;
```

**Example — enrich schema:**
```typescript
// Source: Anthropic structured outputs docs
import { z } from 'zod';

export const EnrichSchema = z.object({
  companySize: z
    .string()
    .nullable()
    .describe('Company headcount range, e.g. "50-200 employees". Null if unknown.'),
  industry: z
    .string()
    .nullable()
    .describe('Industry vertical, e.g. "FinTech SaaS". Null if unknown.'),
  techStack: z
    .array(z.string())
    .describe('Technologies the company uses. Empty array if none detected.'),
  painPoints: z
    .array(z.string())
    .describe('Business problems this company likely faces based on profile. Empty array if none detected.'),
});

export type EnrichOutput = z.infer<typeof EnrichSchema>;
```

### Pattern 3: ICP Scoring Rubric Prompt Engineering

**What:** A system prompt that defines the scoring rubric explicitly with criteria weights and few-shot examples. Temperature 0 alone is not enough — the prompt structure determines score consistency.
**When to use:** In the qualify step, as the `systemPrompt` argument to `structuredOutput()`.

**Rubric dimensions (from ICP scoring research):**
```
ICP criteria for a B2B SaaS AI SDR tool (weights sum to 100):
- Company size: 10-500 employees = +30 pts
- Industry fit: SaaS/tech/professional services = +25 pts
- Pain point match: mentions outbound sales challenges = +25 pts
- Decision-maker signals: founder/VP Sales/Head of Growth = +20 pts
Score 0-100 integer only. No decimals.
```

**Few-shot example to anchor scoring:**
```
Example — high fit (score 85):
Lead: Sarah Chen, CEO at Flowmatic (B2B SaaS, 45 employees, struggling with outbound)
Score: 85 — SaaS, right size, strong pain match, decision-maker

Example — low fit (score 15):
Lead: John Smith, Operations at Retail Giant (50,000 employees, B2C)
Score: 15 — B2C, wrong size, no pain match
```

### Pattern 4: ClaudeModule with Global Export

**What:** A NestJS module that provides ClaudeService and exports it for consumption by Phase 43's PipelineModule.
**When to use:** Always — other modules must not import the Anthropic SDK directly.

```typescript
// Source: NestJS module pattern matching Phase 41 DatabaseModule
import { Module } from '@nestjs/common';
import { ClaudeService } from './claude.service';

@Module({
  providers: [ClaudeService],
  exports: [ClaudeService],
})
export class ClaudeModule {}
```

Register in AppModule's imports array alongside DatabaseModule and HealthModule.

### Anti-Patterns to Avoid

- **Importing Anthropic SDK outside ClaudeService:** Any `import Anthropic from '@anthropic-ai/sdk'` in a file other than `claude.service.ts` violates the single-SDK-owner requirement (success criterion 5).
- **Using `client.messages.create()` for structured output instead of `client.messages.parse()`:** `create()` returns raw text — you'd need manual JSON.parse and Zod validation. `parse()` does this automatically and returns `parsed_output`.
- **Using `temperature` on streamText:** Streaming for personalization does not need temperature=0 — creative variation is acceptable and expected for email content.
- **Mixing structuredOutput and streaming in one call:** The Anthropic API does not support streaming structured output (constrained decoding). Keep them as separate methods.
- **Nullable fields without `.nullable()` in Zod:** Anthropic's structured outputs require all properties to be in `required`. Make optional fields `.nullable()` rather than `.optional()` so they appear in `required` with a null type.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema from Zod | Manual `zodToJsonSchema()` + schema construction | `zodOutputFormat()` from `@anthropic-ai/sdk/helpers/zod` | SDK helper handles schema transformation, wraps in correct `output_config.format` shape, and wires `parsed_output` parsing |
| JSON validation of LLM response | Manual `JSON.parse()` + Zod `.parse()` | `client.messages.parse()` with `zodOutputFormat` | SDK guarantees schema compliance via constrained decoding — parse errors are impossible by construction |
| Streaming token accumulation | Manual `on('text')` buffer with interval flushing | `client.messages.stream()` with `for await...of` on raw events | SDK wraps SSE protocol; using the async iterator is simpler and handles back-pressure |
| Retry logic for API errors | Custom exponential backoff loop | SDK built-in retry (default: 2 retries) | SDK automatically retries 408, 409, 429, 5xx errors with exponential backoff |

**Key insight:** The `@anthropic-ai/sdk` already handles the hard parts — JSON schema generation, constrained decoding, SSE parsing, and retry. ClaudeService is a thin NestJS wrapper that adds ConfigService injection and the app's type contracts.

## Common Pitfalls

### Pitfall 1: Zod `.optional()` instead of `.nullable()` for null fields

**What goes wrong:** Using `z.string().optional()` makes the field optional in the JSON schema (not in `required`). Anthropic structured outputs require all schema properties to be in `required`. The API rejects schemas with optional fields.
**Why it happens:** Zod's `.optional()` means "may be absent" (no key), while `.nullable()` means "present but null". Anthropic needs the key present.
**How to avoid:** Use `.nullable()` for all fields that might not have data. `z.string().nullable()` maps to `{type: ["string", "null"]}` with the field still in `required`.
**Warning signs:** API error "schema property X is not in required array" or structured output response missing expected fields.

### Pitfall 2: Temperature 0 does not guarantee identical scores across runs

**What goes wrong:** The phase success criterion says "same ICP score both times." In practice, temperature=0 greatly increases consistency but does not mathematically guarantee identical outputs. Anthropic's own documentation states results will not be fully deterministic even at temperature=0.
**Why it happens:** Large models use mixture-of-experts routing and floating-point arithmetic that varies with batch composition. Claude has no seed parameter.
**How to avoid:** Design the qualify prompt to produce a score from a bounded integer rubric with explicit criteria weights. The more constrained the scoring rubric, the more consistent the output. Validate with 3-5 repeated calls during prompt iteration (Plan 42-02), accept a ±5 point tolerance.
**Warning signs:** Score varies by more than 5 points across identical inputs — indicates the prompt is under-specified and needs a tighter rubric or more few-shot examples.

### Pitfall 3: Streaming stops at ClaudeService boundary — callers need AsyncGenerator

**What goes wrong:** If `streamText()` returns `AsyncGenerator<string>`, callers (Phase 43 PipelineService, Phase 44 SSE endpoint) must understand async iteration. Returning a `Promise<string>` accumulates all tokens first, defeating streaming.
**Why it happens:** Treating streamText as a normal async function when it needs to be a generator.
**How to avoid:** Implement `streamText()` as an `async function*` that yields text deltas. Callers iterate with `for await ... of`. Document this contract clearly.
**Warning signs:** Email text appears all at once instead of token-by-token in Phase 45.

### Pitfall 4: Missing `system` prompt vs. stuffing everything in `user`

**What goes wrong:** Putting the ICP rubric in the user message instead of `system` reduces compliance. The `system` parameter is the correct place for the scoring rubric and instructions; `user` should contain only the lead data.
**Why it happens:** Not using the system/user split intentionally.
**How to avoid:** ClaudeService.structuredOutput() accepts `systemPrompt` and `userMessage` as separate parameters. Always pass the rubric/instructions as `systemPrompt`.

### Pitfall 5: ANTHROPIC_API_KEY leaking to client modules

**What goes wrong:** The key is read by ConfigService in multiple services or controllers, not just ClaudeService.
**Why it happens:** Following generic NestJS examples that inject ConfigService anywhere.
**How to avoid:** Only ClaudeService reads `ANTHROPIC_API_KEY`. All other modules interact with Claude only through ClaudeService methods. Phase 41 already validates the key at startup via Joi — ClaudeService just reads the already-validated value.

## Code Examples

Verified patterns from official sources:

### Structured Output with Zod (messages.parse)
```typescript
// Source: https://platform.claude.com/docs/en/docs/build-with-claude/structured-outputs
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

const Schema = z.object({
  name: z.string(),
  email: z.string(),
});

const client = new Anthropic();

const response = await client.messages.parse({
  model: 'claude-opus-4-6',
  max_tokens: 1024,
  temperature: 0,
  messages: [{ role: 'user', content: '...' }],
  output_config: { format: zodOutputFormat(Schema) },
});

// parsed_output is fully typed as { name: string; email: string }
console.log(response.parsed_output.email);
```

### Streaming Text Tokens (async iterator)
```typescript
// Source: https://platform.claude.com/docs/en/api/sdks/typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const stream = await client.messages.create({
  model: 'claude-opus-4-6',
  max_tokens: 2048,
  messages: [{ role: 'user', content: 'Write a personalized cold email...' }],
  stream: true,
});

for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    process.stdout.write(event.delta.text); // or yield event.delta.text in generator
  }
}
```

### Error Handling
```typescript
// Source: https://platform.claude.com/docs/en/api/sdks/typescript
import Anthropic from '@anthropic-ai/sdk';

try {
  const response = await client.messages.parse({ /* ... */ });
} catch (err) {
  if (err instanceof Anthropic.APIError) {
    console.error(err.status, err.name, err.message);
    // 401 AuthenticationError — bad API key
    // 429 RateLimitError — auto-retried by SDK, but can still exhaust
    // 500+ InternalServerError — auto-retried by SDK
  }
}
```

### NestJS ClaudeModule Registration (AppModule)
```typescript
// Source: Phase 41 established pattern (DatabaseModule)
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ClaudeModule } from './claude/claude.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: /* existing Joi */ }),
    DatabaseModule,
    HealthModule,
    ClaudeModule,  // <-- add here
  ],
})
export class AppModule {}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Beta header `structured-outputs-2025-11-13` + `output_format` param | `output_config.format` with no beta header required | Nov 2025 → GA in early 2026 | No beta header needed for claude-opus-4-6 and claude-sonnet-4-6 |
| Manual `JSON.parse()` + Zod validation of LLM response | `client.messages.parse()` with `zodOutputFormat()` | Nov 2025 | Constrained decoding guarantees schema compliance; parse errors impossible |
| Polling/webhook for long Claude calls | Streaming with SSE via `client.messages.stream()` | Stable in SDK v0.x | Real-time token delivery; critical for email personalization UX |

**Deprecated/outdated:**
- `output_format` parameter (top-level): Still works during transition period but replaced by `output_config.format`. SDK helpers still accept `output_format` for convenience and translate internally.
- Beta header `structured-outputs-2025-11-13`: No longer required for GA models. Still accepted but unnecessary.

## Open Questions

1. **Which Claude model to use for qualify vs. enrich vs. personalize?**
   - What we know: claude-opus-4-6 and claude-sonnet-4-6 both support structured outputs GA. Opus is more capable; Sonnet is faster and cheaper.
   - What's unclear: Whether Haiku is sufficient for the simple structured extraction tasks in enrich (companySize, industry).
   - Recommendation: Default to `claude-sonnet-4-6` for all three steps to balance cost and quality. Make model a configurable constant in ClaudeService. Plan 42-02 can benchmark quality.

2. **Exact temperature=0 score variance in practice for this rubric**
   - What we know: Temperature=0 is not perfectly deterministic; Anthropic confirms this.
   - What's unclear: For the specific ICP scoring prompt we'll write, how much variance exists across 5+ runs?
   - Recommendation: Plan 42-02 must run the qualify call 5 times for the same test lead and document the variance. Accept ±5 as pass. If variance exceeds ±5, tighten the rubric.

3. **`zod-to-json-schema` package version compatibility**
   - What we know: `@anthropic-ai/sdk` uses Zod as an optional peer dependency (`^3.25.0 || ^4.0.0`). The `zodOutputFormat` helper is in `@anthropic-ai/sdk/helpers/zod`.
   - What's unclear: Whether Zod v4 schemas work correctly with `zodOutputFormat` or if the helper internally requires Zod v3.
   - Recommendation: Install `zod@^3` to be safe (`npm install zod@3`). Monitor SDK changelog if upgrading to Zod v4.

## Sources

### Primary (HIGH confidence)
- `https://platform.claude.com/docs/en/api/sdks/typescript` — Official SDK docs: streaming, structured outputs, error handling, installation
- `https://platform.claude.com/docs/en/docs/build-with-claude/structured-outputs` — Structured outputs: `output_config.format`, `zodOutputFormat`, `messages.parse()`, GA status, beta migration
- npm registry (`npm info @anthropic-ai/sdk`) — Confirmed version 0.78.0, peerDependencies: `{zod: '^3.25.0 || ^4.0.0', optional: true}`

### Secondary (MEDIUM confidence)
- `https://www.vincentschmalbach.com/does-temperature-0-guarantee-deterministic-llm-outputs/` — Temperature=0 determinism analysis; consistent with Anthropic's documented behavior
- `https://news.ycombinator.com/item?id=45930598` — Community discussion confirming GA structured outputs for claude-opus-4-6 and claude-sonnet-4-6

### Tertiary (LOW confidence)
- ICP scoring rubric research (`https://www.oreateai.com/blog/ideal-customer-profile-scoring-rubric-examples/`) — Rubric dimensions and weights are illustrative, not product-specific. Plan 42-02 must tune the actual rubric.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — SDK version confirmed from npm registry, Zod peer dep confirmed, official docs verified
- Architecture: HIGH — NestJS module patterns match Phase 41 conventions already in codebase, `messages.parse()` + `zodOutputFormat()` confirmed from official Anthropic docs
- Pitfalls: HIGH for Zod optional/nullable and API key isolation; MEDIUM for temperature determinism (inherently probabilistic, confirmed from multiple sources)

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (Anthropic SDK evolves rapidly; recheck if more than 30 days pass before plan execution)
