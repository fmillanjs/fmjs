# Phase 45: Next.js Frontend - Research

**Researched:** 2026-03-01
**Domain:** Next.js 15 App Router — Auth, RSC, SSE EventSource, real-time UI, Tailwind v4 + Shadcn
**Confidence:** HIGH (stack is already in use in apps/web; backend API is live from Phase 44)

---

## Summary

Phase 45 builds the entire recruiter-facing UI for the AI SDR system inside a new Next.js 15 standalone app (`ai-sdr/web/`). The backend NestJS API is already running on port 3001 with CORS enabled for `http://localhost:3000`. The four plans decompose cleanly: auth + session (45-01), CRM dashboard + lead form (45-02), pipeline monitor with SSE (45-03), and score/enrichment UI cards (45-04).

The critical architectural decision is **auth strategy**: the project already uses Auth.js v5 (next-auth) with a full Redis-backed session in `apps/web`, but for this standalone ai-sdr frontend, a much simpler approach is appropriate — **iron-session v8.0.4** with hardcoded demo credentials checked in a Server Action, an HttpOnly cookie, and middleware-based redirect. This avoids pulling in the full next-auth infrastructure (no Prisma, no Redis) while satisfying AUTH-01/02/03. Iron-session uses signed+encrypted cookies natively; no JWT complexity needed.

The SSE pipeline monitor (45-03) uses the native browser `EventSource` API in a Client Component (`'use client'`). Since the NestJS SSE endpoint is cross-origin (port 3001), the EventSource must be opened with `{ withCredentials: true }` if auth cookies need to be sent. However, since the SSE endpoint is currently unprotected (no auth guard in Phase 44), the EventSource can omit `withCredentials` initially, which avoids CORS cookie preflight complexity. The NestJS backend already sets `X-Accel-Buffering: no` and CORS is enabled for the frontend origin.

**Primary recommendation:** iron-session v8 for auth (simple, HttpOnly, stateless), native EventSource for SSE, react-hook-form + zod for the lead form, Shadcn components matching the existing design system (Tailwind v4, Radix Colors, new-york style).

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can log into the demo with shared credentials | Server Action checks hardcoded email+password, sets iron-session cookie, redirects to /leads |
| AUTH-02 | Demo credentials (email + password) are displayed on the login page | Static display box on login page RSC — hardcoded values visible in JSX |
| AUTH-03 | User session persists across browser refresh | iron-session cookie is HttpOnly with 14-day TTL; middleware reads cookie and redirects unauthenticated users |
| PIPE-02 | ICP score displayed as a horizontal colored bar with numeric label | Tailwind div with dynamic width % and color-coded class based on score range |
| PIPE-03 | User can expand a "Why this score?" card showing matched and weak ICP criteria | Shadcn Accordion or native <details>/<summary>; data from GET /leads/:id AIOutput step='qualify' |
| PIPE-05 | Enrichment displayed in a structured card with intent signals as badges | Card with Shadcn Badge components; data from AIOutput step='enrich' |
| PIPE-06 | AI generates personalized cold email that streams token-by-token | EventSource on GET /leads/:id/stream; token events appended to useState string |
| PIPE-07 | Pipeline shows step-by-step progress indicators while Claude API runs | EventSource events: qualify-complete, enrich-complete, personalize-token, personalize-complete each update a state machine |
| PIPE-08 | User can copy generated email to clipboard | navigator.clipboard.writeText() in onClick handler; no external library needed |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^15.1.0 | Framework (already in apps/web) | App Router RSC, Server Actions, middleware |
| react | ^19.0.0 | UI (already in apps/web) | React 19 concurrent features, no forwardRef |
| iron-session | 8.0.4 | HttpOnly cookie session | Stateless, signed+encrypted, no Redis/Prisma needed for demo auth |
| react-hook-form | ^7.71.1 | Lead input form | Already in apps/web; onBlur validation, zodResolver |
| @hookform/resolvers | ^5.2.2 | Zod integration | Already in apps/web |
| zod | ^4.3.6 | Schema validation | Already in ai-sdr backend (same version) |
| tailwindcss | v4 (CSS-first) | Styling | Already in apps/web; @import "tailwindcss" in globals.css |
| lucide-react | ^0.564.0 | Icons | Already in apps/web |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | ^2.1.1 | Conditional classes | Already in apps/web; used for dynamic score bar colors |
| tailwind-merge | ^3.4.1 | Merge Tailwind classes | Already in apps/web |
| sonner | ^2.0.7 | Toast notifications | Already in apps/web; optional for copy success feedback |
| @radix-ui/colors | ^3.0.0 | Semantic color tokens | Already in apps/web globals.css |

### Shadcn Components to Install/Copy
The ai-sdr web app will need its own Shadcn setup (it's a separate standalone app from apps/web). These components are needed:

| Component | Command | Required For |
|-----------|---------|-------------|
| button | `npx shadcn@latest add button` | Login form, lead form submit |
| input | `npx shadcn@latest add input` | Login fields, lead form fields |
| label | `npx shadcn@latest add label` | Form labels |
| card | `npx shadcn@latest add card` | Lead list rows, enrichment card, score card |
| badge | `npx shadcn@latest add badge` | Intent signal badges (tech stack, pain points) |
| accordion | `npx shadcn@latest add accordion` | "Why this score?" collapsible card |
| form | `npx shadcn@latest add form` | Form wrapper with react-hook-form |
| skeleton | `npx shadcn@latest add skeleton` | Loading states |
| sonner | `npx shadcn@latest add sonner` | Copy success toast |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| iron-session | Auth.js v5 (next-auth) | Auth.js requires session storage (Redis or DB) + provider config; overkill for hardcoded demo credentials |
| iron-session | cookies() from next/headers directly | No encryption; sensitive session data would be base64 only |
| native EventSource | @microsoft/fetch-event-source | fetch-event-source allows custom headers + POST but adds dependency; EventSource is sufficient since no auth header needed for SSE |
| Shadcn accordion | native \<details\>/\<summary\> | Both work; Shadcn accordion is already available in apps/web design system so consistency is better |
| navigator.clipboard | clipboard-copy package | navigator.clipboard is natively available in all modern browsers; no package needed |

**Installation (new ai-sdr/web standalone Next.js app):**
```bash
npx create-next-app@latest web --typescript --tailwind --app --src-dir=false --import-alias="@/*"
npm install iron-session react-hook-form @hookform/resolvers zod lucide-react clsx tailwind-merge sonner
npm install @radix-ui/colors
npx shadcn@latest init
npx shadcn@latest add button input label card badge accordion form skeleton sonner
```

---

## Architecture Patterns

### Recommended Project Structure
```
ai-sdr/web/
├── app/
│   ├── layout.tsx              # Root layout, Toaster provider
│   ├── globals.css             # Tailwind v4 @import, Radix Colors, theme tokens
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx        # RSC: demo credentials box + LoginForm client component
│   └── (crm)/
│       ├── layout.tsx          # Protected layout: reads iron-session, redirects if no session
│       ├── leads/
│       │   └── page.tsx        # RSC: fetches GET /leads, renders LeadTable
│       └── leads/[id]/
│           └── page.tsx        # RSC: fetches GET /leads/:id, renders PipelineMonitor + detail cards
├── components/
│   ├── auth/
│   │   └── login-form.tsx      # 'use client': react-hook-form, calls /api/login action
│   ├── leads/
│   │   ├── lead-table.tsx      # RSC: table with score column and status
│   │   ├── lead-input-form.tsx # 'use client': react-hook-form, POST /leads via Server Action
│   │   ├── pipeline-monitor.tsx # 'use client': EventSource, step progress state machine
│   │   ├── score-bar.tsx       # Pure component: colored div based on score 0-100
│   │   ├── why-score-card.tsx  # Accordion with matchedCriteria/weakCriteria
│   │   ├── enrichment-card.tsx # Card with badges for tech stack + pain points
│   │   └── email-preview.tsx   # 'use client': streamed email text + copy button
│   └── ui/                     # Shadcn components (auto-generated)
├── lib/
│   ├── session.ts              # iron-session config: cookieName, password, TTL
│   ├── api.ts                  # fetch wrappers for NestJS API (client + server)
│   └── utils.ts                # cn() helper from clsx + tailwind-merge
├── actions/
│   ├── auth.ts                 # login() and logout() Server Actions
│   └── leads.ts                # createLead() Server Action
└── middleware.ts               # Reads iron-session cookie; redirects /leads/* to /login if no session
```

### Pattern 1: Iron-Session Auth with Server Actions
**What:** Login Server Action validates hardcoded demo credentials, sets encrypted HttpOnly cookie via iron-session, then redirects to /leads. Middleware reads cookie to protect routes.
**When to use:** Simple demo auth with one shared account — no database user lookup needed.

```typescript
// lib/session.ts
import { SessionOptions } from 'iron-session';

export interface SessionData {
  isLoggedIn: boolean;
  email: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!, // min 32 chars
  cookieName: 'ai-sdr-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
};

export const DEMO_EMAIL = process.env.DEMO_EMAIL || 'recruiter@demo.com';
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo1234';
```

```typescript
// actions/auth.ts
'use server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData, DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/session';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    return { error: 'Invalid credentials' };
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.isLoggedIn = true;
  session.email = email;
  await session.save();
  redirect('/leads');
}

export async function logout() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.destroy();
  redirect('/login');
}
```

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const session = await getIronSession<SessionData>(
    request.cookies as any,
    sessionOptions,
  );

  const isProtected = request.nextUrl.pathname.startsWith('/leads');
  if (isProtected && !session.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isAuth = request.nextUrl.pathname.startsWith('/login');
  if (isAuth && session.isLoggedIn) {
    return NextResponse.redirect(new URL('/leads', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**CRITICAL iron-session middleware note:** In Next.js middleware (Edge Runtime), `cookies()` from `next/headers` is NOT available. Instead, pass `request.cookies` directly to `getIronSession`. This is a common trap — the iron-session README shows route handler usage with `cookies()` but middleware must use `request.cookies`.

### Pattern 2: EventSource SSE Pipeline Monitor
**What:** Client component opens EventSource to `GET /leads/:id/stream`. Each event type updates a step-progress state. Token events append to email string. Cleanup closes EventSource on unmount.
**When to use:** 45-03 PipelineMonitor component — the moment the lead detail page loads for a new (pending/processing) lead.

```typescript
// components/leads/pipeline-monitor.tsx
'use client';
import { useEffect, useRef, useState } from 'react';

type StepStatus = 'pending' | 'running' | 'complete';

interface PipelineState {
  qualify: StepStatus;
  enrich: StepStatus;
  personalize: StepStatus;
  emailText: string;
  done: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function PipelineMonitor({ leadId }: { leadId: string }) {
  const [state, setState] = useState<PipelineState>({
    qualify: 'running',
    enrich: 'pending',
    personalize: 'pending',
    emailText: '',
    done: false,
  });
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(`${API_URL}/leads/${leadId}/stream`);
    esRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'qualify-complete') {
        setState(prev => ({ ...prev, qualify: 'complete', enrich: 'running' }));
      } else if (data.type === 'enrich-complete') {
        setState(prev => ({ ...prev, enrich: 'complete', personalize: 'running' }));
      } else if (data.type === 'token') {
        setState(prev => ({ ...prev, emailText: prev.emailText + data.token }));
      } else if (data.type === 'personalize-complete') {
        setState(prev => ({ ...prev, personalize: 'complete', done: true }));
        es.close();
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [leadId]);

  // render step indicators + email preview
}
```

**Key SSE data contract** (from Phase 44 SSE endpoint):
- `qualify-complete` → `{ type: 'qualify-complete' }` (no data payload in SSE event, qualify result is in AIOutput DB)
- `enrich-complete` → `{ type: 'enrich-complete' }`
- Token → `{ type: 'token', token: '...' }`
- `personalize-complete` → `{ type: 'personalize-complete' }`

The NestJS controller sends: `subscriber.next({ data: { type: 'qualify-complete' } })` — so `event.data` is a JSON string that must be `JSON.parse()`d.

**IMPORTANT:** Only open the EventSource if the lead is in `pending` or `processing` status. If the lead is already `complete` or `failed`, skip SSE and render the static AIOutput data directly.

### Pattern 3: RSC Lead List with Server-Side Fetch
**What:** React Server Component fetches from the NestJS API without exposing credentials to the browser.
**When to use:** 45-02 leads page — list of leads with ICP score.

```typescript
// app/(crm)/leads/page.tsx
const API_URL = process.env.API_URL || 'http://localhost:3001'; // Server-side URL (no NEXT_PUBLIC_)

export default async function LeadsPage() {
  const res = await fetch(`${API_URL}/leads`, { cache: 'no-store' });
  const leads = await res.json();
  return <LeadTable leads={leads} />;
}
```

**Note:** RSC uses the internal API URL (`API_URL` not `NEXT_PUBLIC_API_URL`). Client components use `NEXT_PUBLIC_API_URL`. This aligns with the existing apps/web pattern where `serverApi` uses non-public env vars.

### Pattern 4: Score Bar with Color Coding
**What:** Horizontal div with width = `${score}%` and background color based on score range.
**When to use:** 45-04 score bar component.

```typescript
// components/leads/score-bar.tsx
function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-green-500';  // high fit
  if (score >= 40) return 'bg-amber-400';  // medium fit
  return 'bg-red-400';                      // low fit
}

export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="w-full bg-muted rounded-full h-3">
      <div
        className={`h-3 rounded-full transition-all ${getScoreColor(score)}`}
        style={{ width: `${score}%` }}
        aria-label={`ICP score: ${score} out of 100`}
      />
    </div>
  );
}
```

**MUST NOT use purple** — this is a global design requirement. Use green/amber/red for the score color scale only.

### Pattern 5: Clipboard Copy Button
**What:** onClick handler calls `navigator.clipboard.writeText()`. No library needed.

```typescript
async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
  // optionally fire a sonner toast
}
```

### Anti-Patterns to Avoid
- **Opening EventSource unconditionally:** Always check lead status before opening SSE — if lead is `complete`, render static data from AIOutput. If lead is `pending`/`processing`, open SSE.
- **Using NEXT_PUBLIC_API_URL in Server Components:** RSC can use internal URLs. Only Client Components need `NEXT_PUBLIC_` prefix.
- **Passing iron-session `cookies()` into middleware:** `cookies()` from `next/headers` is not available in Edge Runtime middleware. Use `request.cookies` instead.
- **Storing ANTHROPIC_API_KEY in web app:** Never. Key stays in NestJS backend only (State.md decision from Phase 41 research).
- **Using purple in any design element:** Explicitly excluded in project requirements (REQUIREMENTS.md Out of Scope, also in global CLAUDE.md).
- **Calling `session.destroy()` and then `redirect()` in the same Server Action:** `destroy()` is synchronous (no await), then `redirect()` works. Do NOT `await session.save()` after destroy.
- **Re-opening EventSource on every render:** Use `useEffect` with `[leadId]` dependency and return cleanup that calls `es.close()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie encryption | Custom JWT + cookie set | iron-session | Handles seal/unseal, HttpOnly, signing, TTL |
| Form validation state | Custom useState + manual error messages | react-hook-form + zodResolver | Already in apps/web; handles blur/submit modes, nested errors |
| SSE connection management | Custom XHR streaming | native EventSource | Browser-native, automatic reconnect on error, zero dependencies |
| Clipboard copy | execCommand('copy') | navigator.clipboard.writeText() | execCommand is deprecated; navigator.clipboard is async and returns Promise |
| Badge/pill components | Custom span with classes | Shadcn Badge | Consistent with design system |
| Accordion/collapsible | Custom useState toggle | Shadcn Accordion or \<details\>/\<summary\> | Accessibility (WAI-ARIA) handled automatically |

**Key insight:** The entire auth system for this demo app is deliberately simple — one shared account, no signup, no password reset, no multi-session management. Iron-session's stateless encrypted cookie is the right tool.

---

## Common Pitfalls

### Pitfall 1: iron-session in Edge Runtime Middleware
**What goes wrong:** Calling `cookies()` from `next/headers` inside `middleware.ts` throws `cookies was called outside a request scope` in Next.js 15.
**Why it happens:** Middleware runs in Edge Runtime where `cookies()` is not available. It's only available in Route Handlers and Server Actions.
**How to avoid:** Pass `request.cookies` (the `NextRequest` cookie store) directly to `getIronSession()`.
**Warning signs:** Build error mentioning Edge Runtime or Dynamic API called outside request scope.

### Pitfall 2: SSE EventSource Opens for Completed Leads
**What goes wrong:** If the lead detail page loads for a `complete` lead and the component opens an EventSource, the NestJS backend runs the full pipeline AGAIN (SSE endpoint triggers processWithStream).
**Why it happens:** Phase 44 design: SSE endpoint IS the pipeline trigger. Opening it always starts the pipeline.
**How to avoid:** In the lead detail page RSC, check `lead.status`. Pass `shouldStream: lead.status === 'pending' || lead.status === 'processing'` to PipelineMonitor. Only mount EventSource when `shouldStream` is true.
**Warning signs:** Duplicate AIOutput records in the database, doubled Claude API costs.

### Pitfall 3: CORS + withCredentials for SSE
**What goes wrong:** If iron-session cookie is needed for SSE auth, EventSource requires `{ withCredentials: true }`. But NestJS CORS must also set `credentials: true` AND specific origin (not wildcard `*`).
**Why it happens:** CORS policy blocks credentialed cross-origin requests unless server explicitly allows it.
**How to avoid:** Phase 44 already sets `enableCors({ origin: process.env.WEB_URL, credentials: true })`. The SSE endpoint currently has no auth guard, so `withCredentials` is not needed. If auth guard is added later, add `{ withCredentials: true }` to EventSource constructor.
**Warning signs:** Console CORS error mentioning "Cannot use wildcard in Access-Control-Allow-Origin with credentials".

### Pitfall 4: Next.js 15 CVE-2025-29927 Middleware Bypass
**What goes wrong:** If middleware is the sole auth gate and the app uses Next.js < 15.2.3, an attacker can bypass middleware with `x-middleware-subrequest` header.
**Why it happens:** Critical vulnerability (CVSS 9.1) in Next.js middleware.
**How to avoid:** Use Next.js >= 15.2.3. Also add server-side session check in protected layout components as defense-in-depth (not just middleware).
**Warning signs:** App deployed on version < 15.2.3; middleware-only protection.

### Pitfall 5: Zod v4 in Web App vs Zod v3 in Existing apps/web
**What goes wrong:** The ai-sdr NestJS backend uses zod v4.3.6. The existing apps/web uses zod v3.25.76. If shared schemas are copied between projects, `z.toJSONSchema()` (v4-only) will break.
**Why it happens:** Zod v4 has breaking API changes. zodOutputFormat() in the backend requires v4.
**How to avoid:** The ai-sdr/web frontend does NOT call zodOutputFormat() — it's a backend-only function. Use whichever zod version is appropriate for the standalone web app. For form validation, zod v3 works fine with react-hook-form zodResolver.
**Warning signs:** `z.toJSONSchema is not a function` error.

### Pitfall 6: AIOutput content field is Json (Prisma) — parse before use
**What goes wrong:** The NestJS `GET /leads/:id` endpoint returns `aiOutputs[].content` as a JSON object (already deserialized by Prisma). But TypeScript types on the frontend won't be inferred automatically.
**Why it happens:** Prisma `Json` type becomes `any` in the response. The frontend must cast or validate.
**How to avoid:** Define TypeScript interfaces matching QualifyOutput and EnrichOutput shapes on the frontend. Cast: `const qualify = output.content as QualifyOutput`. No need to install zod schemas from backend — just type definitions.
**Warning signs:** TypeScript `any` spreading into JSX props without type safety.

---

## Code Examples

Verified patterns from official sources and project codebase:

### Demo Credentials Box (PIPE-02 visible auth credential display)
```typescript
// app/(auth)/login/page.tsx - RSC
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Demo credentials box - AUTH-02 */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Demo Credentials</p>
          <p className="text-sm text-blue-800 dark:text-blue-200">Email: <code>recruiter@demo.com</code></p>
          <p className="text-sm text-blue-800 dark:text-blue-200">Password: <code>demo1234</code></p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
```

### Protected Layout (session check in RSC)
```typescript
// app/(crm)/layout.tsx - RSC, defense-in-depth
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData } from '@/lib/session';

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) {
    redirect('/login');
  }
  return <>{children}</>;
}
```

### Lead Input Form with Server Action
```typescript
// actions/leads.ts
'use server';
const API_URL = process.env.API_URL || 'http://localhost:3001';

export async function createLead(formData: { name: string; companyName: string; companyUrl: string }) {
  const res = await fetch(`${API_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  if (!res.ok) throw new Error('Failed to create lead');
  return res.json(); // { id: string }
}
```

### Enrichment Card with Intent Signal Badges
```typescript
// components/leads/enrichment-card.tsx
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EnrichOutput {
  companySize: string | null;
  industry: string | null;
  techStack: string[];
  painPoints: string[];
}

export function EnrichmentCard({ enrich }: { enrich: EnrichOutput }) {
  return (
    <Card>
      <CardHeader><CardTitle>Enrichment</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><span className="font-medium">Industry:</span> {enrich.industry ?? '—'}</div>
        <div><span className="font-medium">Size:</span> {enrich.companySize ?? '—'}</div>
        {enrich.techStack.length > 0 && (
          <div>
            <p className="font-medium mb-2">Tech Stack</p>
            <div className="flex flex-wrap gap-2">
              {enrich.techStack.map(tech => (
                <Badge key={tech} variant="secondary">{tech}</Badge>
              ))}
            </div>
          </div>
        )}
        {enrich.painPoints.length > 0 && (
          <div>
            <p className="font-medium mb-2">Pain Points</p>
            <div className="flex flex-wrap gap-2">
              {enrich.painPoints.map(point => (
                <Badge key={point} variant="outline">{point}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Copy to Clipboard Button
```typescript
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? 'Copied!' : 'Copy Email'}
    </Button>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-auth v4 with pages/ router | Auth.js v5 (next-auth) with App Router | Next.js 13+ | Server Components can call `auth()` directly |
| next-iron-session (deprecated) | iron-session v8 (`getIronSession`) | v8.0.0 (2023) | Single `getIronSession()` function replaces all wrappers |
| Custom EventSource reconnect logic | Browser's built-in EventSource reconnect | Always | EventSource auto-reconnects by default — may need to disable in error handlers |
| tailwind.config.js with theme extension | Tailwind v4 CSS-first with `@theme` in globals.css | Tailwind v4 (2025) | No more JS config file for theme; `--tw-*` CSS vars |
| Radix UI Accordion primitive directly | Shadcn Accordion (wraps Radix) | 2023 | Pre-styled with Tailwind, consistent with design system |
| execCommand('copy') | navigator.clipboard.writeText() | 2020+ | execCommand deprecated; clipboard API is standard |

**Deprecated/outdated:**
- `next-iron-session`: Use `iron-session` (the original, v8) instead. `next-iron-session` is an old fork that predates v8.
- `EventSource` reconnect on onerror: By default EventSource reconnects automatically. Call `es.close()` in `onerror` ONLY if the error is terminal (e.g., HTTP 4xx from NestJS). Otherwise the browser will reconnect.

---

## Open Questions

1. **Should the ai-sdr web app be inside ai-sdr/ directory or apps/web-sdr/?**
   - What we know: STATE.md says "Phases 41-45 are work in a new standalone `ai-sdr` repo". The ai-sdr directory currently only has the NestJS backend.
   - What's unclear: Whether to create `ai-sdr/web/` (collocated) or a new `apps/ai-sdr-web/` in the monorepo.
   - Recommendation: Create `ai-sdr/web/` (collocated with the backend in the standalone ai-sdr directory). This matches the standalone-repo decision and keeps frontend/backend together for deployment. The monorepo's `apps/web` is the portfolio site; this is a separate deployable.

2. **Does the PipelineMonitor need to handle the case where a lead was already processing when the page loaded (browser refresh mid-pipeline)?**
   - What we know: The SSE endpoint triggers pipeline on connection. If lead is `processing`, connecting again would try to run pipeline on a lead already in-flight.
   - What's unclear: NestJS side has no guard against double-running (Phase 44 didn't address this).
   - Recommendation: Check `lead.status === 'pending'` (not 'processing') before opening EventSource. If status is 'processing', poll `GET /leads/:id` every 2 seconds until `complete`/`failed`, then render static data. This avoids double-run risk.

3. **SSE timeout is 30 seconds — what happens in the UI if Claude API is slow?**
   - What we know: Phase 44 has `timeout(30_000)` on the Observable. The NestJS SSE will error/close after 30s.
   - Recommendation: In `onerror` handler in EventSource, set an error state and show "Pipeline timed out — refresh to retry" message. Don't auto-reconnect on a timed-out pipeline.

---

## Validation Architecture

`workflow.nyquist_validation` is not present in `.planning/config.json` — the config only has `research`, `plan_check`, and `verifier` keys. Treating as disabled; skipping Validation Architecture section.

---

## Sources

### Primary (HIGH confidence)
- Project codebase `apps/web/` — direct inspection of existing Next.js 15 + Shadcn + Tailwind v4 + Auth.js v5 patterns
- Project codebase `ai-sdr/src/` — NestJS backend API contract, SSE event shapes, Prisma schema
- iron-session GitHub README (fetched 2026-03-01) — getIronSession() API, cookie defaults, App Router patterns
- `apps/web/DESIGN-SYSTEM.md` — confirmed component library and Tailwind v4 CSS-first config

### Secondary (MEDIUM confidence)
- WebSearch: iron-session v8 Next.js 15 App Router — confirmed v8.0.4 is current, App Router compatible, httpOnly by default
- WebSearch: EventSource SSE pattern React useEffect cleanup — confirmed `es.close()` in useEffect return
- WebSearch: Next.js 15 CVE-2025-29927 middleware bypass — confirmed need for Next.js >= 15.2.3
- WebSearch: react-hook-form + zod + Next.js 15 Server Actions — confirmed onBlur mode + zodResolver pattern

### Tertiary (LOW confidence)
- WebSearch: iron-session middleware Edge Runtime behavior — not directly confirmed with official docs; inferring from Next.js Edge Runtime limitations. Flag for validation during 45-01 execution.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — apps/web already uses this exact stack; iron-session is well-documented
- Architecture: HIGH — NestJS API contract is known precisely from Phase 44 code; SSE event shapes confirmed
- Pitfalls: MEDIUM — SSE double-run pitfall is inferred from Phase 44 design decision; iron-session middleware trap is known from Next.js Edge Runtime docs
- Auth approach: HIGH — iron-session is the right tool for demo credentials; simpler than next-auth for this use case

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (iron-session and Next.js APIs are stable; check for Next.js CVE patch version before deploy)
