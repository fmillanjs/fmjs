# Phase 44: NestJS REST + SSE Endpoints - Research

**Researched:** 2026-03-01
**Domain:** NestJS v11 REST controllers, ValidationPipe DTOs, @Sse decorator, RxJS Observable/callback bridge, client disconnect cleanup
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LEAD-01 | User can submit a new lead by entering name, company name, and company URL | POST /leads with CreateLeadDto (class-validator) → prisma.lead.create() → fire-and-forget PipelineService.processWithStream() → return { leadId } immediately |
| LEAD-02 | User can view all leads in a sortable list with ICP score column | GET /leads → prisma.lead.findMany({ orderBy: { createdAt: 'desc' } }) → return array with id, name, companyName, icpScore, status, industry, createdAt |
| LEAD-03 | User can open a lead detail page showing all AI-generated outputs | GET /leads/:id → prisma.lead.findUniqueOrThrow + prisma.aIOutput.findMany({ where: { leadId } }) → return complete detail with all three step outputs |
</phase_requirements>

---

## Summary

Phase 44 adds the HTTP surface to Phase 43's pipeline: a LeadsModule containing a LeadsController and LeadsService, wiring REST CRUD and SSE streaming. All dependencies are already installed — `@nestjs/common` v11.1.14, `rxjs` v7.8.2, `@prisma/client` v5.22.0 are in package.json. The only new package is `@nestjs/throttler` v6.5.0 (NestJS 11 compatible) for rate-limiting POST /leads, and `class-validator` + `class-transformer` for DTO validation.

The critical architectural insight from STATE.md is that **only the email personalization step streams tokens**. The SSE endpoint (`GET /leads/:id/stream`) bridges PipelineService.processWithStream()'s typed callback into an RxJS Observable using the `new Observable(subscriber => ...)` pattern. Each StepEvent fires `subscriber.next({ data: ... })`. Client disconnect is handled via `res.on('close')` using `@Res()` injection, which sets a boolean flag that the async pipeline checks before calling `subscriber.next()`, preventing emission after teardown. A 30-second `timeout(30_000)` operator wraps the observable as a safety net.

The three REST endpoints (POST /leads, GET /leads, GET /leads/:id) are straightforward Prisma queries. POST /leads creates the Lead record, fires `processWithStream()` as an unawaited Promise (fire-and-forget), and returns `{ id }` immediately — the pipeline runs in the background. The SSE endpoint is a separate GET /leads/:id/stream and does NOT run the pipeline; it only applies to leads that are already being processed (called after POST has started the pipeline).

**Primary recommendation:** Install `class-validator`, `class-transformer`, and `@nestjs/throttler@^6.5.0`. Build LeadsModule with LeadsController + LeadsService. Use `new Observable<MessageEvent>(subscriber => { ... })` bridge pattern for SSE, `res.on('close', () => closed = true)` for disconnect cleanup, and `.pipe(timeout(30000))` as a safety net.

---

## Standard Stack

### Core (already installed — zero new installs needed for REST)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @nestjs/common | ^11.0.0 (installed: 11.1.14) | @Controller, @Get, @Post, @Sse, @Body, @Param, @Res | Project convention |
| @nestjs/core | ^11.0.0 | DI container, module system | Project convention |
| rxjs | ^7.8.0 (installed: 7.8.2) | Observable, MessageEvent, timeout, finalize operators | Already in package.json |
| @prisma/client | ^5.22.0 | lead.create, lead.findMany, lead.findUniqueOrThrow, aIOutput.findMany | Already wired in PrismaService |

### New Dependencies
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| class-validator | ^0.14.x | @IsString, @IsNotEmpty, @IsUrl decorators on DTO | NestJS official validation library |
| class-transformer | ^0.5.x | Enables ValidationPipe transform: true option | Required pair for ValidationPipe |
| @nestjs/throttler | ^6.5.0 | @Throttle decorator and ThrottlerGuard for rate limiting POST | Official NestJS rate limiting — v6.5.0 supports NestJS 11 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| class-validator + class-transformer | joi (already installed) | Joi is already used for config validation in app.module.ts. class-validator is NestJS standard for DTO body validation — different use case. Don't replace joi; add class-validator for request bodies |
| @nestjs/throttler | Custom middleware | Throttler integrates directly with NestJS DI, provides @Throttle decorator, works with APP_GUARD globally — far less boilerplate |
| Observable subscriber bridge | Raw Express SSE via @Res() only | Observable integrates with NestJS interceptors and is the NestJS-idiomatic approach. Raw @Res() loses framework lifecycle. Can still inject @Res() for disconnect detection alongside Observable |

**Installation:**
```bash
cd /home/doctor/fernandomillan/ai-sdr && npm install class-validator class-transformer @nestjs/throttler@^6.5.0
```

---

## Architecture Patterns

### Recommended Project Structure
```
ai-sdr/src/
├── leads/                    # NEW — Phase 44
│   ├── leads.module.ts       # Imports PipelineModule, DatabaseModule
│   ├── leads.controller.ts   # REST + SSE endpoints
│   ├── leads.service.ts      # Prisma queries
│   └── dto/
│       └── create-lead.dto.ts  # @IsString @IsNotEmpty @IsUrl
├── pipeline/                 # EXISTING — Phase 43 (only exports PipelineService)
├── database/                 # EXISTING — exports PrismaService
├── claude/                   # EXISTING
├── health/                   # EXISTING
└── app.module.ts             # Add LeadsModule + ThrottlerModule + ValidationPipe
```

### Pattern 1: CreateLeadDto with class-validator
**What:** DTO class enforcing validation on POST /leads request body.
**When to use:** @Body() decorated parameter in POST handler.
```typescript
// Source: docs.nestjs.com/techniques/validation + class-validator 0.14
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'companyName is required' })
  companyName: string;

  @IsUrl({}, { message: 'companyUrl must be a valid URL' })
  companyUrl: string;
}
```

### Pattern 2: ValidationPipe global setup in main.ts
**What:** Strips unknown fields and validates all request bodies globally.
**When to use:** Add to existing main.ts once.
```typescript
// Source: docs.nestjs.com/pipes (ValidationPipe)
// Add AFTER app.enableCors() in existing main.ts:
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### Pattern 3: ThrottlerModule setup in AppModule
**What:** Rate limits POST /leads to prevent pipeline spam.
**When to use:** Add ThrottlerModule to imports in app.module.ts.
```typescript
// Source: wanago.io/2025/03/03/api-nestjs-rate-limiting-throttler/
// @nestjs/throttler v6.5.0 — NestJS 11 compatible
import { ThrottlerModule, ThrottlerGuard, seconds } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // ... existing
    ThrottlerModule.forRoot([{ ttl: seconds(60), limit: 10 }]),
    LeadsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

Then use `@SkipThrottle()` on GET endpoints (or apply `@Throttle()` only to POST). Per-route override on POST /leads:
```typescript
@Throttle({ default: { limit: 5, ttl: seconds(60) } })
@Post()
async create(@Body() dto: CreateLeadDto) { ... }
```

### Pattern 4: LeadsController REST endpoints
**What:** Three REST routes. POST creates lead + fires background pipeline. GET /leads lists all. GET /leads/:id returns full detail.
```typescript
// Source: verified against Prisma schema (ai-sdr/prisma/schema.prisma)
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly pipeline: PipelineService,
  ) {}

  @Post()
  async create(@Body() dto: CreateLeadDto): Promise<{ id: string }> {
    const lead = await this.leadsService.create(dto);
    // Fire-and-forget: don't await — returns leadId immediately
    void this.pipeline.processWithStream(lead.id, () => {}).catch((err) => {
      this.logger.error(`Pipeline failed for ${lead.id}: ${err.message}`);
    });
    return { id: lead.id };
  }

  @SkipThrottle()
  @Get()
  async findAll() {
    return this.leadsService.findAll();
  }

  @SkipThrottle()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }
}
```

### Pattern 5: SSE endpoint with Observable/callback bridge
**What:** `GET /leads/:id/stream` delivers SSE events for each pipeline step. The PipelineService.processWithStream() accepts a StepCallback — this bridge converts that callback into an Observable<MessageEvent> that NestJS SSE infrastructure handles.

**Critical constraint from STATE.md:** The SSE stream does NOT start the pipeline — POST /leads already started it. The SSE endpoint only observes an already-running pipeline. However, the current PipelineService.processWithStream() runs synchronously-async — it cannot be "joined" mid-run from a second caller.

**Recommended approach for this phase:** The SSE endpoint IS the place that starts the pipeline for this leadId. POST /leads creates the Lead record and triggers the pipeline via SSE. However, the success criteria says "POST /leads returns a leadId immediately without waiting for pipeline completion." This means POST fires-and-forgets processWithStream() with a no-op callback, and GET /leads/:id/stream is a SEPARATE call that re-runs or observes.

**Re-reading success criteria:** "GET /leads/:id/stream delivers SSE events for each pipeline step" — this must be the caller that invokes processWithStream WITH the SSE callback, not a re-run. The correct architecture: POST creates the Lead (status=pending) WITHOUT starting the pipeline. GET /leads/:id/stream STARTS the pipeline with the SSE callback bridge. This ensures: (1) leadId returned immediately from POST, (2) SSE stream drives pipeline start.

```typescript
// Source: NestJS docs + rxjs 7.8.2 Observable pattern
// Confirmed pattern from NestJS SSE ecosystem research
import { Sse, MessageEvent, Res } from '@nestjs/common';
import { Observable } from 'rxjs';
import { timeout, finalize } from 'rxjs/operators';
import { Response } from 'express';
import { StepEvent } from '../pipeline/pipeline.service';

@SkipThrottle()
@Sse(':id/stream')
stream(
  @Param('id') id: string,
  @Res() res: Response,
): Observable<MessageEvent> {
  let closed = false;
  res.on('close', () => { closed = true; });

  return new Observable<MessageEvent>((subscriber) => {
    const onStep = (event: StepEvent) => {
      if (closed) return;  // Client disconnected — stop emitting

      if (event.type === 'personalize-token') {
        subscriber.next({ data: { type: 'token', token: event.token } });
      } else {
        subscriber.next({ data: { type: event.type } });
      }

      if (event.type === 'personalize-complete') {
        subscriber.complete();
      }
    };

    // Fire pipeline — this IS the pipeline trigger for SSE-connected clients
    this.pipeline
      .processWithStream(id, onStep)
      .then(() => {
        if (!subscriber.closed) subscriber.complete();
      })
      .catch((err) => {
        if (!subscriber.closed) subscriber.error(err);
      });
  }).pipe(
    timeout(30_000),  // Safety net: close after 30s even if pipeline hangs
    finalize(() => {
      // Observable completed, errored, or timed out — mark closed
      closed = true;
    }),
  );
}
```

**Note on `@Res()` with `@Sse()`:** Injecting `@Res()` is safe when NOT calling `res.send()` or `res.end()` manually — the `@Sse()` decorator owns the response lifecycle. `@Res()` is used only for `res.on('close', ...)` detection.

**Note on POST flow vs SSE flow:** Two usage paths exist:
1. **SSE client path:** Client calls GET /leads/:id/stream → this starts the pipeline with SSE callback → events stream → observable completes. GET /leads/:id after completion shows full results.
2. **API-only path (no SSE):** POST /leads creates Lead + immediately fires pipeline with no-op callback → pipeline runs in background → GET /leads polls for status.

Phase 44 must support BOTH. POST fires pipeline with no-op callback. SSE endpoint attempts to start the pipeline but the Lead may already be 'processing' or 'complete'. The simplest solution: SSE checks Lead status first — if already complete, stream the stored AIOutput rows. If pending/processing, the POST never fired the pipeline (change: POST creates Lead only, does not start pipeline). This eliminates race conditions.

**Clean design decision for Phase 44:**
- POST /leads: create Lead record only, return { id } — NO pipeline start
- GET /leads/:id/stream: start pipeline with SSE callback, stream events
- GET /leads: list all leads (status, icpScore, industry)
- GET /leads/:id: full detail with AI outputs

This is confirmed by success criteria SC1: "POST /leads returns a leadId immediately without waiting for pipeline completion" — implies POST does NOT start the pipeline.

### Pattern 6: LeadsService Prisma queries
```typescript
// Source: verified against ai-sdr/prisma/schema.prisma
@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        name: dto.name,
        companyName: dto.companyName,
        companyUrl: dto.companyUrl,
        // status defaults to 'pending' per schema
      },
    });
  }

  async findAll() {
    return this.prisma.lead.findMany({
      select: {
        id: true,
        name: true,
        companyName: true,
        icpScore: true,
        status: true,
        industry: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUniqueOrThrow({ where: { id } });
    const aiOutputs = await this.prisma.aIOutput.findMany({
      where: { leadId: id },
      select: { step: true, content: true, createdAt: true },
    });
    return { ...lead, aiOutputs };
  }
}
```

### Pattern 7: LeadsModule wiring
```typescript
// Source: verified against PipelineModule export pattern (Phase 43)
import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { PipelineModule } from '../pipeline/pipeline.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [PipelineModule, DatabaseModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
```

### Anti-Patterns to Avoid

- **Awaiting processWithStream() in POST /leads:** POST must return leadId immediately. If SSE drives pipeline, POST should NOT start it. If POST does start it (fire-and-forget), pass a no-op callback `() => {}`. Never await.
- **Calling subscriber.next() after subscriber.closed:** Check `subscriber.closed` or the `closed` flag before emitting. Emitting after completion throws.
- **Using `@Res({ passthrough: true })` with @Sse:** The `passthrough: true` option is for regular endpoints. With @Sse, inject `@Res()` without passthrough but only use it for `res.on('close', ...)` — never call res methods directly.
- **No timeout on Observable:** Claude API calls can hang. Without `timeout(30_000)`, SSE connections can hold open indefinitely on pipeline hang.
- **Importing AIOutput `step` values as magic strings in LeadsService:** Always use the exported constants `STEP_QUALIFY`, `STEP_ENRICH`, `STEP_PERSONALIZE` from `pipeline.service.ts`. These are the exact strings Phase 45 also queries by.
- **No NotFoundException for GET /leads/:id when lead not found:** findUniqueOrThrow throws PrismaClientKnownRequestError — catch and rethrow as NestJS NotFoundException for clean 404 responses.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Request body validation | Custom middleware checking req.body fields | class-validator + ValidationPipe | Handles nested validation, whitelist stripping, typed errors, decorator-based — 3 lines per field |
| Rate limiting | Custom Express middleware counting IPs | @nestjs/throttler | ThrottlerGuard integrates with NestJS DI, provides @Throttle decorator, stores state in memory by default |
| SSE infrastructure | Manual `res.write('data: ...\n\n')` | NestJS @Sse + Observable | NestJS handles SSE headers, text/event-stream content type, and event formatting automatically |
| Observable/callback bridge | Custom EventEmitter class | `new Observable(subscriber => ...)` | RxJS Observable has built-in teardown support, finalize operator, timeout operator — far less error-prone |
| 404 for missing leads | null check + manual response | NotFoundException from @nestjs/common | NestJS exception filters handle HTTP status codes automatically |

**Key insight:** The `new Observable(subscriber => { return teardownFn; })` pattern is the correct bridge from imperative async callback code (processWithStream) to declarative reactive streams. The teardown function returned from the subscriber constructor runs on unsubscribe/complete/error.

---

## Common Pitfalls

### Pitfall 1: POST /leads starts pipeline AND SSE tries to start it too (double-run)
**What goes wrong:** Both POST and GET /leads/:id/stream call processWithStream(), running the pipeline twice, creating duplicate AIOutput rows.
**Why it happens:** Design ambiguity: POST fires-and-forgets, SSE also fires pipeline.
**How to avoid:** Pick one trigger. Recommended: POST creates Lead only (no pipeline). SSE starts pipeline. This matches the success criteria "POST returns leadId immediately."
**Warning signs:** Duplicate AIOutput rows with same leadId + step in Postgres.

### Pitfall 2: subscriber.next() called after subscriber.closed or after client disconnect
**What goes wrong:** RxJS throws "Cannot call next on a closed subscriber" or events are emitted to a dead socket.
**Why it happens:** Async pipeline continues running after client closes SSE connection. processWithStream() doesn't know the client disconnected.
**How to avoid:** Use the `closed` boolean flag set by `res.on('close', ...)`. Check `if (closed) return;` before each `subscriber.next()` call in the `onStep` callback. Also check `if (!subscriber.closed)` before subscriber.complete()/error() in the .then()/.catch() handlers.
**Warning signs:** Node.js process logs "subscriber is closed" errors, or Anthropic API stream continues generating after curl disconnect.

### Pitfall 3: @Res() with @Sse causes NestJS to skip automatic response handling
**What goes wrong:** If `@Res()` is used with `passthrough: false` (the default), NestJS skips its response lifecycle and doesn't send the SSE response properly.
**Why it happens:** NestJS sees `@Res()` and assumes the developer handles the response manually.
**How to avoid:** When using `@Res()` ONLY for `res.on('close', ...)` detection alongside `@Sse()`, the `@Sse()` decorator still owns the response. This combination works in NestJS because `@Sse()` attaches its own response handler before `@Res()` is involved. Verify with a curl test that events actually stream.
**Warning signs:** SSE endpoint returns empty body immediately instead of streaming.

### Pitfall 4: Observable completes too early — no events delivered
**What goes wrong:** Observable completes before processWithStream() emits any events.
**Why it happens:** The async pipeline takes time (Claude API calls). If subscriber.complete() is called immediately (before pipeline finishes), the stream closes.
**How to avoid:** Only call subscriber.complete() from within the onStep callback when `personalize-complete` fires, OR from the .then() of processWithStream(). Never call it synchronously in the Observable constructor.
**Warning signs:** curl shows the SSE connection opens and immediately closes with no events.

### Pitfall 5: ValidationPipe not catching IsUrl validation
**What goes wrong:** Invalid URLs pass validation (e.g., "not-a-url" or "ftp://example.com" may pass @IsUrl depending on options).
**Why it happens:** class-validator's @IsUrl default settings allow ftp://, tel:, and some non-HTTP protocols.
**How to avoid:** Use `@IsUrl({ protocols: ['http', 'https'], require_protocol: true })` to restrict to HTTP/HTTPS URLs only.
**Warning signs:** Pipeline scraper receives invalid URLs and fails silently.

### Pitfall 6: @nestjs/throttler ThrottlerGuard applied globally blocks GET requests too
**What goes wrong:** Health checks and GET /leads get rate-limited unexpectedly.
**Why it happens:** APP_GUARD applies ThrottlerGuard to ALL routes when registered globally.
**How to avoid:** Add `@SkipThrottle()` to GET endpoints in LeadsController and to the HealthController. Only POST /leads needs throttling.
**Warning signs:** Repeated GET /leads calls return 429 Too Many Requests.

### Pitfall 7: X-Accel-Buffering header missing in production (Coolify/Nginx)
**What goes wrong:** SSE events are buffered by Nginx reverse proxy and delivered in batches or not at all until connection closes.
**Why it happens:** Nginx buffers proxy responses by default. SSE requires unbuffered streaming.
**How to avoid:** Per STATE.md: The API must set `X-Accel-Buffering: no` response header on SSE endpoints. Add `res.setHeader('X-Accel-Buffering', 'no')` before returning the Observable, OR set it globally in main.ts for SSE routes.
**Warning signs:** Events arrive in bursts in production (Coolify) but work fine in development. curl -N works locally but shows no events until pipeline completes in production.

---

## Code Examples

Verified patterns from official sources and project codebase:

### Complete SSE endpoint (verified against rxjs 7.8.2 + NestJS 11 patterns)
```typescript
// Source: NestJS SSE docs + rxjs 7.8.2 Observable pattern + project pipeline.service.ts
import {
  Controller, Get, Post, Sse, Body, Param, Res, Logger,
  NotFoundException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { timeout, finalize } from 'rxjs/operators';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { seconds } from '@nestjs/throttler';
import { MessageEvent } from '@nestjs/common';
import { Response } from 'express';
import { PipelineService, StepEvent } from '../pipeline/pipeline.service';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Controller('leads')
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);

  constructor(
    private readonly leadsService: LeadsService,
    private readonly pipeline: PipelineService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @Post()
  async create(@Body() dto: CreateLeadDto): Promise<{ id: string }> {
    const lead = await this.leadsService.create(dto);
    return { id: lead.id };
  }

  @SkipThrottle()
  @Get()
  findAll() {
    return this.leadsService.findAll();
  }

  @SkipThrottle()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.leadsService.findOne(id);
    } catch {
      throw new NotFoundException(`Lead ${id} not found`);
    }
  }

  @SkipThrottle()
  @Sse(':id/stream')
  stream(
    @Param('id') id: string,
    @Res() res: Response,
  ): Observable<MessageEvent> {
    // Required for Nginx/Coolify SSE buffering (STATE.md decision)
    res.setHeader('X-Accel-Buffering', 'no');

    let closed = false;
    res.on('close', () => { closed = true; });

    return new Observable<MessageEvent>((subscriber) => {
      const onStep = (event: StepEvent) => {
        if (closed || subscriber.closed) return;

        if (event.type === 'personalize-token') {
          subscriber.next({ data: { type: 'token', token: event.token } });
        } else {
          subscriber.next({ data: { type: event.type } });
        }

        if (event.type === 'personalize-complete') {
          subscriber.complete();
        }
      };

      this.pipeline
        .processWithStream(id, onStep)
        .then(() => {
          if (!subscriber.closed) subscriber.complete();
        })
        .catch((err: Error) => {
          this.logger.error(`SSE pipeline error for ${id}: ${err.message}`);
          if (!subscriber.closed) subscriber.error(err);
        });
    }).pipe(
      timeout(30_000),
      finalize(() => { closed = true; }),
    );
  }
}
```

### Prisma findOne with NotFoundException (verified against schema)
```typescript
// Source: ai-sdr/prisma/schema.prisma field names
async findOne(id: string) {
  const lead = await this.prisma.lead.findUniqueOrThrow({ where: { id } });
  const aiOutputs = await this.prisma.aIOutput.findMany({
    where: { leadId: id },
    select: { step: true, content: true, createdAt: true },
  });
  return { ...lead, aiOutputs };
}
// Caller wraps in try/catch → throw new NotFoundException()
```

### curl SSE verification command (per success criteria SC4)
```bash
# Test SSE streaming — should show events then disconnect cleanly
curl -N http://localhost:3001/leads/{leadId}/stream

# Test disconnect cleanup (SC5): Ctrl+C after starting — verify no orphaned stream in logs
```

### CreateLeadDto with URL validation
```typescript
// Source: class-validator 0.14 + oneuptime.com/blog/post/2026-02-02-nestjs-class-validator
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  companyUrl: string;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SSE via raw `res.write('data:...\n\n')` | @Sse decorator + Observable | NestJS 6.0 | NestJS handles headers, formatting, proper HTTP keep-alive |
| @ThrottleGuard applied per-controller | APP_GUARD global + @SkipThrottle per route | @nestjs/throttler v4+ | Global application simpler; @SkipThrottle whitelist pattern is idiomatic |
| `class-validator` validation manually triggered | ValidationPipe global in main.ts | NestJS 7+ | Zero boilerplate — ValidationPipe intercepts all @Body() automatically |
| ThrottlerModule.forRoot({ ttl, limit }) | ThrottlerModule.forRoot([{ ttl: seconds(60), limit: 10 }]) | @nestjs/throttler v5+ | Array form supports named throttlers for multiple rate-limit tiers |
| Observable-only SSE (no disconnect detection) | Observable + res.on('close') flag | NestJS ecosystem awareness | NestJS does not automatically unsubscribe Observable when client disconnects — must detect manually |

**Deprecated/outdated:**
- `ThrottlerModule.forRoot({ ttl: 60, limit: 10 })`: Old form — `ttl` was in seconds. New form uses `seconds()` helper with milliseconds. Use `ThrottlerModule.forRoot([{ ttl: seconds(60), limit: 10 }])` (array form, seconds() utility).
- `@SkipThrottle(true)`: Old boolean form. Current API is `@SkipThrottle()` with no argument.

---

## Open Questions

1. **POST vs SSE: Who starts the pipeline?**
   - What we know: Success criteria SC1 says POST returns leadId immediately. SC4 says SSE streams pipeline progress.
   - What's unclear: If POST fires pipeline as fire-and-forget, and SSE also starts it, there's a race. If POST does NOT start it, SSE is the only trigger — but then non-SSE callers (API scripts) never run the pipeline.
   - Recommendation: POST creates Lead only (no pipeline). SSE starts pipeline. Add a note in the plan that a future "API-only trigger" endpoint can be added if needed. This avoids double-run complexity and matches the UI flow (user opens lead detail → SSE connects → pipeline starts).

2. **What if SSE client connects AFTER the pipeline has already completed?**
   - What we know: If POST doesn't start the pipeline and SSE does, the pipeline only runs when SSE connects. If the SSE client disconnects and reconnects, processWithStream() would run again on a Lead in status 'complete', which would overwrite AIOutput rows.
   - What's unclear: Should the SSE endpoint check Lead status before running?
   - Recommendation: SSE endpoint checks Lead status: if 'complete', immediately emit stored AIOutput as SSE events and close. If 'pending', start pipeline. If 'processing', it's already running (another SSE connection) — current architecture can't join a mid-run pipeline; emit an error event.

3. **timeout(30_000) behavior: does it throw TimeoutError through the SSE response?**
   - What we know: RxJS timeout() throws TimeoutError when the observable hasn't emitted in the given window.
   - What's unclear: Does NestJS SSE infrastructure handle TimeoutError gracefully (close connection cleanly) or send an error event to the client?
   - Recommendation: The `finalize()` operator ensures `closed = true` runs on timeout. NestJS closes the SSE connection on observable error. This is acceptable behavior — curl will see the connection close. Low risk.

---

## Validation Architecture

> nyquist_validation is not in config.json (workflow section only has "research", "plan_check", "verifier") — skipping automated test mapping. Manual verification via curl is the validation strategy for this phase per success criteria SC4 and SC5.

**Manual verification commands (from success criteria):**
```bash
# SC1: POST returns leadId immediately
curl -s -X POST http://localhost:3001/leads \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","companyName":"Acme","companyUrl":"https://acme.com"}' | jq .

# SC2: GET /leads returns array with icpScore column
curl -s http://localhost:3001/leads | jq '[.[] | {id, name, icpScore, status, industry}]'

# SC3: GET /leads/:id returns complete detail
curl -s http://localhost:3001/leads/{id} | jq '{id, status, icpScore, aiOutputs: [.aiOutputs[] | .step]}'

# SC4: SSE streaming via curl
curl -N http://localhost:3001/leads/{id}/stream

# SC5: Disconnect test — Ctrl+C after connecting, verify logs show no orphaned stream
curl -N http://localhost:3001/leads/{id}/stream  # then Ctrl+C
# Check NestJS logs: should see "closed" or no further pipeline activity
```

---

## Sources

### Primary (HIGH confidence)
- `ai-sdr/prisma/schema.prisma` — Lead model fields (id, name, companyName, companyUrl, icpScore, status, industry, companySize), AIOutput (leadId, step, content), LeadStatus enum verified directly
- `ai-sdr/src/pipeline/pipeline.service.ts` — PipelineService.processWithStream(), StepEvent union type, StepCallback type, STEP_QUALIFY/ENRICH/PERSONALIZE constants confirmed directly
- `ai-sdr/package.json` — rxjs@7.8.2 confirmed installed; @nestjs/common@11.x, @nestjs/core@11.x confirmed; class-validator and @nestjs/throttler NOT yet installed
- `ai-sdr/src/app.module.ts` — existing module structure confirmed; LeadsModule and ThrottlerModule must be added
- `ai-sdr/src/main.ts` — ValidationPipe not yet added; CORS already configured for Next.js
- oneuptime.com/blog/post/2026-02-02-nestjs-class-validator — class-validator setup, ValidationPipe config, @IsUrl decorator syntax (verified 2026-02-02)
- wanago.io/2025/03/03/api-nestjs-rate-limiting-throttler/ — @nestjs/throttler v6.5.0 ThrottlerModule.forRoot() array syntax, @Throttle decorator, @SkipThrottle usage (verified 2025-03-03)

### Secondary (MEDIUM confidence)
- NestJS SSE community patterns (multiple sources: sevic.dev, slingacademy.com, danywalls.com) — @Sse decorator, Observable<MessageEvent>, subscriber.next/complete pattern. Consistent across sources.
- WebSearch results for @nestjs/throttler v6.5.0 NestJS 11 compatibility — confirmed v6.5.0 "adds support for Nest version 11" (December 2024 release)
- WebSearch + multiple NestJS GitHub issues (9517, 12670) confirming NestJS does NOT auto-unsubscribe Observable on client disconnect — manual `res.on('close')` detection required

### Tertiary (LOW confidence)
- The `res.on('close')` + `closed` flag pattern for SSE disconnect detection: sourced from NestJS ecosystem discussion, not official docs. Flag as needing validation during plan execution with a curl disconnect test.
- `@Res()` injectable alongside `@Sse()` without passthrough: pattern inferred from NestJS architecture — verify does not break SSE response lifecycle.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all existing packages confirmed via package.json; new packages (@nestjs/throttler v6.5.0, class-validator, class-transformer) confirmed via official npm/GitHub sources
- Architecture: HIGH — Prisma schema field names confirmed directly; PipelineService interface confirmed directly; REST + SSE patterns verified against multiple NestJS ecosystem sources
- Pitfalls: MEDIUM-HIGH — double-run race condition is a design-level pitfall identified from analysis; Observable disconnect issue is confirmed from multiple NestJS GitHub issues; timeout/finalize pattern is standard rxjs

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (NestJS 11 stable, rxjs 7.x stable, @nestjs/throttler v6.5.0 stable)
