# Phase 4: Portfolio & Polish - Research

**Researched:** 2026-02-15
**Domain:** Portfolio website development, UI/UX polish, testing infrastructure, and production deployment
**Confidence:** HIGH

## Summary

Phase 4 integrates three distinct technical domains: (1) professional portfolio website development with Next.js 15, (2) production-quality UX polish including responsive design, loading states, error handling, and dark mode, and (3) comprehensive testing and deployment infrastructure. The research reveals mature, well-documented patterns for all requirements with high ecosystem stability.

**Key findings:** Next.js 15 App Router provides built-in conventions for error handling (error.tsx, not-found.tsx), loading states (loading.tsx), and metadata/SEO. Tailwind CSS v4 offers CSS-first configuration with 70% smaller production CSS and native dark mode support via next-themes. Testing uses Vitest for unit/integration tests and Playwright for E2E authentication flows. Coolify provides zero-config deployments with automatic SSL, supporting monorepo structures via Turborepo's prune command for optimized Docker builds. PostgreSQL Row Level Security with Prisma requires careful tenant context management but provides database-enforced multi-tenancy isolation.

**Primary recommendation:** Build portfolio as separate app route (`app/portfolio`) within existing Next.js web app rather than standalone site - enables shared theme/components, single deployment, consistent authentication if needed later, and demonstrates full-stack app organization. Use shadcn/ui for UI components (skeleton loaders, command palette, form components), Vitest + React Testing Library for component/API tests, Playwright for critical auth/RBAC E2E flows, and Coolify's GitHub Actions integration for automated deployments with Docker registry approach.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.1+ | App framework with App Router | Official framework, built-in conventions for loading/error states, metadata API, App Router is production-ready as of Next.js 13.4+ |
| Tailwind CSS | v4.1+ | Styling with CSS-first config | 70% smaller production CSS vs v3, mobile-first responsive design, native dark mode support, used by 70%+ of Next.js apps |
| shadcn/ui | Latest | Copy-paste component library | Built on Radix UI primitives, full TypeScript support, works seamlessly with Next.js 15 Server Components, accessible by default |
| Vitest | Latest | Unit and integration testing | 10-20x faster than Jest on large codebases, native ESM support, works with Next.js App Router, official Next.js recommendation |
| Playwright | Latest | E2E testing | Official Next.js recommendation, cross-browser testing (Chromium, Firefox, WebKit), excellent authentication testing patterns |
| next-themes | 0.3+ | Dark mode management | Prevents flash of incorrect theme, localStorage persistence, system preference detection, designed for Next.js App Router |
| React Hook Form | 7.71+ | Form state management | Already in project, works with Zod validation, Server Actions support, minimal re-renders |
| cmdk | Latest | Command palette (keyboard shortcuts) | Lightweight, handles focus/keyboard/search automatically, used by Linear, Vercel, GitHub |
| Coolify | Latest | Self-hosted PaaS deployment | Automatic SSL via Let's Encrypt, GitHub integration, Docker-native, supports monorepos, environment variable management |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | Latest | Component testing utilities | Use with Vitest for user-focused component tests |
| @vitejs/plugin-react | Latest | Vite plugin for React | Required for Vitest + React integration |
| jsdom | Latest | DOM implementation for tests | Required for Vitest to test React components |
| vite-tsconfig-paths | Latest | Resolve TypeScript paths in Vitest | Enables path aliases like `@/components` in tests |
| nodemailer | Latest | Email sending for contact form | Simple SMTP integration, supports attachments, templates with Handlebars |
| Resend | Alternative to nodemailer | Modern email API | Better developer experience, but adds external dependency |
| Prisma Optimize | Commercial add-on | N+1 query detection | Production monitoring for database performance issues |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate portfolio site | Portfolio as app route in web app | Separate site = duplicate infrastructure; app route = shared components, single deployment, easier maintenance |
| Jest | Vitest | Jest works but slower, Vitest has better ESM support and faster execution |
| Cypress | Playwright | Cypress requires more configuration, Playwright has better API and cross-browser support |
| Vercel | Coolify | Vercel easier but shows dependency; Coolify demonstrates DevOps skills and self-hosting capability |
| next-seo | Built-in Metadata API | next-seo is legacy approach; Next.js 13+ has first-class metadata support via App Router |
| kbar | cmdk | Both excellent; cmdk is more lightweight and actively maintained by Vercel team |

**Installation:**

```bash
# Testing dependencies (root or web package)
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
npm install -D @playwright/test

# UI components and utilities
npm install next-themes cmdk
# shadcn/ui uses CLI to add components individually
npx shadcn@latest init

# Contact form email (choose one)
npm install nodemailer
# OR
npm install resend
```

## Architecture Patterns

### Recommended Project Structure

**Portfolio Integration Approach:**

```
apps/web/
├── app/
│   ├── (dashboard)/          # Existing TeamFlow dashboard routes
│   │   ├── layout.tsx
│   │   └── ...
│   ├── (portfolio)/          # NEW: Portfolio routes with separate layout
│   │   ├── layout.tsx        # Portfolio layout (different from dashboard)
│   │   ├── page.tsx          # Home/hero page
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx      # Projects list
│   │   │   └── teamflow/     # TeamFlow case study
│   │   │       └── page.tsx
│   │   ├── resume/
│   │   │   └── page.tsx
│   │   └── contact/
│   │       └── page.tsx
│   ├── (auth)/               # Existing auth routes
│   │   └── ...
│   ├── api/                  # API routes (contact form endpoint, etc.)
│   │   └── contact/
│   │       └── route.ts
│   ├── not-found.tsx         # Global 404
│   ├── error.tsx             # Global error boundary
│   └── global-error.tsx      # Root error boundary
├── components/
│   ├── ui/                   # shadcn/ui components
│   │   ├── skeleton.tsx
│   │   ├── command.tsx
│   │   └── ...
│   ├── portfolio/            # Portfolio-specific components
│   │   ├── hero-section.tsx
│   │   ├── project-card.tsx
│   │   └── contact-form.tsx
│   └── dashboard/            # Existing dashboard components
│       └── ...
├── __tests__/                # Vitest unit/integration tests
│   ├── components/
│   ├── api/
│   └── utils/
├── e2e/                      # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── rbac.spec.ts
│   └── critical-paths.spec.ts
└── public/
    ├── resume.pdf
    └── ...
```

**Testing Structure:**

```
apps/web/
├── vitest.config.mts         # Vitest configuration
├── playwright.config.ts      # Playwright configuration
├── __tests__/                # Unit and integration tests
│   ├── setup.ts              # Test setup/globals
│   ├── components/
│   │   ├── ui/
│   │   │   └── skeleton.test.tsx
│   │   └── portfolio/
│   │       └── contact-form.test.tsx
│   └── api/
│       └── contact.test.ts
└── e2e/                      # E2E tests
    ├── auth/
    │   ├── login.spec.ts
    │   └── signup.spec.ts
    ├── rbac/
    │   └── permissions.spec.ts
    └── fixtures/
        └── test-users.ts

apps/api/
└── test/                     # NestJS tests (can use Vitest or Jest)
    ├── unit/
    │   ├── auth/
    │   └── rbac/
    └── integration/
        └── tasks/
```

### Pattern 1: Portfolio Route Group with Separate Layout

**What:** Use Next.js route groups `(portfolio)` to create separate layout context from dashboard without affecting URLs

**When to use:** Portfolio needs different navigation, header, footer than authenticated dashboard

**Example:**
```typescript
// app/(portfolio)/layout.tsx
import { ThemeProvider } from 'next-themes'
import { PortfolioNav } from '@/components/portfolio/nav'
import { PortfolioFooter } from '@/components/portfolio/footer'

export default function PortfolioLayout({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex flex-col">
        <PortfolioNav />
        <main className="flex-1">{children}</main>
        <PortfolioFooter />
      </div>
    </ThemeProvider>
  )
}
```

**Source:** [Next.js Route Groups Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-groups)

### Pattern 2: File-Based Loading and Error States

**What:** Use Next.js conventions `loading.tsx`, `error.tsx`, `not-found.tsx` for automatic loading/error UI

**When to use:** Every route segment that fetches data or might error

**Example:**
```typescript
// app/(portfolio)/projects/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

// app/(portfolio)/projects/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Try again
      </button>
    </div>
  )
}
```

**Source:** [Next.js Loading UI and Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)

### Pattern 3: Dark Mode with Tailwind v4 and next-themes

**What:** Configure Tailwind v4 CSS-first dark mode with next-themes for persistence and system detection

**When to use:** Any app requiring light/dark theme switching

**Example:**
```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Light mode colors */
  --color-background: oklch(100% 0 0);
  --color-foreground: oklch(0% 0 0);

  /* Dark mode colors - use @media (prefers-color-scheme: dark) */
  @media (prefers-color-scheme: dark) {
    --color-background: oklch(15% 0 0);
    --color-foreground: oklch(100% 0 0);
  }
}

/* Also support class-based dark mode for next-themes */
.dark {
  --color-background: oklch(15% 0 0);
  --color-foreground: oklch(100% 0 0);
}
```

```typescript
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationMismatch>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Source:** [Light and Dark Mode in Tailwind CSS v4 with Next.js](https://www.storieasy.com/blog/light-and-dark-mode-in-tailwind-css-v4-with-next-js)

### Pattern 4: Server Actions with React Hook Form and Zod

**What:** Combine client-side validation (React Hook Form + Zod) with server-side validation (Server Actions + Zod)

**When to use:** Contact forms, any form requiring server processing

**Example:**
```typescript
// app/api/contact/actions.ts
'use server'

import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
})

export async function submitContactForm(formData: FormData) {
  // Server-side validation
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  })

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten() }
  }

  // Send email via nodemailer or Resend
  // ...

  return { success: true }
}

// app/(portfolio)/contact/contact-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { submitContactForm } from '@/app/api/contact/actions'

export function ContactForm() {
  const form = useForm({
    resolver: zodResolver(contactSchema),
  })

  async function onSubmit(data) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value)
    })

    const result = await submitContactForm(formData)
    // Handle result
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
```

**Source:** [Type-Safe Form Validation in Next.js 15: Zod, RHF, & Server Actions](https://www.abstractapi.com/guides/email-validation/type-safe-form-validation-in-next-js-15-with-zod-and-react-hook-form)

### Pattern 5: Vitest with Next.js Component Testing

**What:** Configure Vitest with React Testing Library for client and synchronous server components

**When to use:** Unit testing components, utilities, API route handlers

**Example:**
```typescript
// vitest.config.mts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
  },
})

// __tests__/components/ui/skeleton.test.tsx
import { expect, test, describe } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton } from '@/components/ui/skeleton'

describe('Skeleton', () => {
  test('renders with correct classes', () => {
    const { container } = render(<Skeleton className="h-4 w-full" />)
    const skeleton = container.firstChild
    expect(skeleton).toHaveClass('h-4', 'w-full')
  })

  test('renders with animation', () => {
    const { container } = render(<Skeleton />)
    const skeleton = container.firstChild
    expect(skeleton).toHaveClass('animate-pulse')
  })
})
```

**Source:** [Next.js Testing with Vitest](https://nextjs.org/docs/app/guides/testing/vitest)

### Pattern 6: Playwright Authentication State Management

**What:** Reuse authenticated state across E2E tests to avoid repeated login flows

**When to use:** Testing authenticated features, RBAC enforcement

**Example:**
```typescript
// e2e/auth/auth.setup.ts
import { test as setup } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await page.goto('http://localhost:3000/auth/login')
  await page.fill('[name="email"]', 'admin@test.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  await page.waitForURL('http://localhost:3000/dashboard')
  await page.context().storageState({ path: authFile })
})

// e2e/rbac/permissions.spec.ts
import { test, expect } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/user.json' })

test('admin can delete project', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/projects/1')
  await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible()
})
```

**Source:** [Authentication | Playwright](https://playwright.dev/docs/auth)

### Pattern 7: Turborepo Docker Pruning for Monorepo

**What:** Use `turbo prune` to create minimal build context for Docker deployments

**When to use:** Deploying monorepo apps to reduce Docker build times and image size

**Example:**
```dockerfile
# Dockerfile (apps/web/Dockerfile)
FROM node:18-alpine AS base

# Prune stage - create minimal workspace
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune web --docker

# Installer stage - install dependencies
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci

# Builder stage - build the app
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/node_modules ./node_modules
RUN npm run build -- --filter=web

# Runner stage - production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

**Source:** [Turborepo Docker Guide](https://turbo.build/repo/docs/guides/tools/docker)

### Pattern 8: PostgreSQL Row Level Security with Prisma

**What:** Implement tenant isolation using Postgres RLS policies with Prisma Client Extensions

**When to use:** Multi-tenant SaaS requiring database-level security isolation

**Example:**
```typescript
// lib/prisma-rls.ts
import { PrismaClient } from '@prisma/client'

export function prismaWithRLS(organizationId: string) {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          // Set organization context before every query
          await prisma.$executeRaw`SET app.current_organization_id = ${organizationId}`
          return query(args)
        },
      },
    },
  })
}

// Database migration - create RLS policy
-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see tasks in their organization
CREATE POLICY tasks_isolation_policy ON tasks
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- Grant access
GRANT ALL ON tasks TO app_user;
```

**Source:** [Securing Multi-Tenant Applications Using Row Level Security in PostgreSQL with Prisma ORM](https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35)

### Anti-Patterns to Avoid

- **Mixing next-seo with Metadata API:** Next.js 13+ has built-in metadata support; next-seo is legacy and causes conflicts
- **Building separate portfolio site:** Duplicates infrastructure, deployment complexity, theme inconsistencies - use app routes instead
- **Skipping error boundaries:** Every route segment should have error.tsx for graceful degradation
- **Missing loading states:** Users see blank screens during data fetching - always provide loading.tsx or Suspense fallbacks
- **Client-side only dark mode:** Causes flash of incorrect theme - use next-themes with suppressHydrationMismatch
- **Testing async Server Components with Vitest:** Not supported - use E2E tests (Playwright) for async components
- **Hardcoding NEXT_PUBLIC_ vars in Docker:** Must be defined at build time - use App Router dynamic rendering for runtime env vars
- **N+1 queries in production:** Use Prisma's `include` or `relationLoadStrategy: 'join'` - log queries in development to detect
- **Omitting keyboard navigation:** Command palette and keyboard shortcuts are stretch goals but show attention to UX polish

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Component library | Custom UI components from scratch | shadcn/ui + Radix UI | Accessibility is hard - keyboard nav, ARIA, focus management. shadcn handles this, is customizable, and TypeScript-first |
| Command palette | Custom search/nav overlay | cmdk | Focus management, fuzzy search, keyboard navigation all handled. Used by Linear, Vercel |
| Dark mode toggle | Manual localStorage + class toggling | next-themes | Prevents theme flash, handles system preferences, SSR-safe, works with Tailwind v4 |
| Form validation | Manual validation logic | React Hook Form + Zod | Validation is complex - nested objects, async validation, error messages. RHF optimizes re-renders, Zod provides type safety |
| Loading skeletons | Custom pulse animations | shadcn/ui Skeleton | Consistent animation timing, proper accessibility, matches content layout |
| Email sending | Raw SMTP implementation | nodemailer or Resend | SMTP protocol is complex, error handling, retries, templates. Libraries handle edge cases |
| SSL certificates | Manual Let's Encrypt integration | Coolify auto-SSL | Certificate renewal, DNS validation, edge cases. Coolify handles via Traefik |
| Docker optimization | Manual Dockerfile caching | turbo prune | Lockfile cascading issues, cache invalidation. Turborepo creates minimal workspace automatically |
| E2E test infrastructure | Custom browser automation | Playwright | Cross-browser compatibility, screenshot/video recording, parallel execution, flake detection |
| Metadata/SEO | Manual meta tags | Next.js Metadata API | Type-safe, validates structure, generates sitemap/robots.txt, supports dynamic Open Graph images |

**Key insight:** Production-ready UX (accessibility, loading states, error handling, dark mode) and testing infrastructure (E2E, unit, performance monitoring) have well-established libraries. Time spent building these from scratch is time not spent on unique project features. Choose battle-tested libraries that handle edge cases.

## Common Pitfalls

### Pitfall 1: Flash of Unstyled Content (FOUC) in Dark Mode

**What goes wrong:** User sees light theme flash before dark theme applies on page load

**Why it happens:** Theme preference read from localStorage happens after React hydration, causing re-render

**How to avoid:**
- Use next-themes with `attribute="class"` and `suppressHydrationMismatch` on `<html>` tag
- next-themes injects blocking script before React hydration to read localStorage immediately
- Configure Tailwind v4 to support both `@media (prefers-color-scheme: dark)` and `.dark` class

**Warning signs:**
- Theme flickers on page load
- Console warning about hydration mismatch
- localStorage read happening in useEffect

**Source:** [How to Add Dark Mode in Next.js 15 App Router with Tailwind CSS V4](https://www.sujalvanjare.com/blog/dark-mode-nextjs15-tailwind-v4)

### Pitfall 2: Testing Async Server Components with Vitest

**What goes wrong:** Tests fail or hang when trying to render async Server Components

**Why it happens:** Vitest doesn't support React Server Components with async data fetching

**How to avoid:**
- Use Vitest ONLY for synchronous Server Components and Client Components
- Use Playwright E2E tests for async Server Components
- Structure code to separate data fetching (async SC) from presentation (sync SC or Client Component)

**Warning signs:**
- Test hangs indefinitely
- "Cannot read properties of undefined" in async component tests
- Tests work for Client Components but fail for Server Components

**Source:** [Next.js Testing: Vitest](https://nextjs.org/docs/app/guides/testing/vitest)

### Pitfall 3: NEXT_PUBLIC_ Environment Variables in Docker

**What goes wrong:** Environment variables don't update between staging/production when using same Docker image

**Why it happens:** `NEXT_PUBLIC_` variables are replaced at build time, not runtime - Docker builds bake them into JavaScript bundles

**How to avoid:**
- For runtime config, use Next.js App Router with dynamic rendering (read env vars on server at request time)
- For build-time config, build separate Docker images per environment OR use Coolify's build hooks
- Never put secrets in `NEXT_PUBLIC_` variables - they're exposed to browser

**Warning signs:**
- Same API URL in staging and production
- Secrets visible in browser DevTools
- Need to rebuild Docker image to change config

**Source:** [Security advice for self-hosting Next.js in Docker](https://blog.arcjet.com/security-advice-for-self-hosting-next-js-in-docker/)

### Pitfall 4: N+1 Queries in Prisma

**What goes wrong:** Application slows down dramatically as data grows - response times increase 5-10x

**Why it happens:** Looping through query results and executing additional query per item (e.g., fetch users, then loop and fetch posts for each user)

**How to avoid:**
- Use Prisma `include` to fetch related data in single operation: `findMany({ include: { posts: true } })`
- Use `relationLoadStrategy: 'join'` for database-level joins
- Enable Prisma query logging in development: `log: ['query']` in PrismaClient config
- Monitor with Prisma Optimize in production or AppSignal

**Warning signs:**
- Dozens/hundreds of similar queries in logs
- Response time grows linearly with data size
- Database CPU spikes under load

**Source:** [Query optimization using Prisma Optimize](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance)

### Pitfall 5: Missing Loading States Cause Layout Shift

**What goes wrong:** Content jumps around as it loads, poor Core Web Vitals (CLS), janky user experience

**Why it happens:** No placeholder UI during data fetch - browser renders empty space, then content pops in

**How to avoid:**
- Add `loading.tsx` file next to every `page.tsx` that fetches data
- Design skeleton loaders to match final content dimensions (height, width, aspect ratio)
- Use React Suspense boundaries for granular loading states
- Test with slow 3G throttling in Chrome DevTools

**Warning signs:**
- Blank screen before content appears
- Content jumping as images/data loads
- Poor Lighthouse CLS score

**Source:** [Best Practices for Loading States in Next.js](https://www.getfishtank.com/insights/best-practices-for-loading-states-in-nextjs)

### Pitfall 6: Row Level Security Bypass via Missing Context

**What goes wrong:** Users see data from other tenants/organizations despite RLS policies in place

**Why it happens:** Forgot to set `app.current_organization_id` context before query, or set wrong organization ID

**How to avoid:**
- Use Prisma Client Extensions to automatically set context on every query
- Validate organization_id against user's session before setting context
- Add integration tests that verify RLS isolation
- Log context setting in development to verify it's happening

**Warning signs:**
- Data leakage between tenants in testing
- RLS policies defined but not enforcing
- Queries succeed even when organization_id doesn't match user

**Source:** [Securing Multi-Tenant Applications Using Row Level Security in PostgreSQL with Prisma ORM](https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35)

### Pitfall 7: Playwright Tests Failing in CI but Passing Locally

**What goes wrong:** E2E tests pass on local machine but fail in GitHub Actions or Coolify pipelines

**Why it happens:** Missing Playwright browser dependencies, wrong base URL, timing issues, missing auth state persistence

**How to avoid:**
- Run `npx playwright install-deps` in CI pipeline before tests
- Configure `webServer` in playwright.config.ts to start Next.js automatically
- Use `await page.waitForURL()` and `await page.waitForSelector()` instead of fixed delays
- Commit `.auth` directory to share auth state between tests
- Test in headed mode locally: `npx playwright test --headed` to debug

**Warning signs:**
- "Timeout waiting for selector" errors in CI
- Tests pass 3/5 times (flaky)
- Different behavior local vs CI

**Source:** [Next.js Testing: Playwright](https://nextjs.org/docs/app/guides/testing/playwright)

### Pitfall 8: Coolify Deployment Fails Due to Build Context Size

**What goes wrong:** Docker build times out or fails with "no space left on device" in monorepo

**Why it happens:** Copying entire monorepo (including all node_modules) into Docker build context

**How to avoid:**
- Use `turbo prune <app-name> --docker` to create minimal workspace in /out directory
- Multi-stage Dockerfile: pruner → installer → builder → runner
- Add `.dockerignore` file to exclude .git, node_modules, .next, etc.
- Coolify setting: set "Base Directory" to just the app being deployed if not using prune

**Warning signs:**
- Build takes >10 minutes
- "COPY . ." step very slow
- Out of disk space errors
- Unnecessary files in final Docker image

**Source:** [Turborepo Docker Guide](https://turbo.build/repo/docs/guides/tools/docker)

## Code Examples

Verified patterns from official sources:

### Portfolio Hero Section with Dark Mode

```typescript
// app/(portfolio)/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Fernando Millan - Full-Stack Engineer',
  description: 'Senior full-stack engineer specializing in Next.js, NestJS, and scalable SaaS applications',
  openGraph: {
    title: 'Fernando Millan - Full-Stack Engineer',
    description: 'Senior full-stack engineer specializing in Next.js, NestJS, and scalable SaaS applications',
    type: 'website',
  },
}

export default function HomePage() {
  return (
    <section className="container py-24 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Full-Stack Engineer Building{' '}
          <span className="text-primary">Production-Ready</span> SaaS
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          I architect and build scalable applications with modern tech stacks.
          Currently showcasing TeamFlow - a real-time collaboration platform
          with authentication, RBAC, and WebSocket-based live updates.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/projects/teamflow">View Case Study</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact">Get in Touch</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
```

**Source:** [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)

### Loading Skeleton for Project Cards

```typescript
// app/(portfolio)/projects/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectsLoading() {
  return (
    <div className="container py-12">
      <Skeleton className="h-12 w-64 mb-8" /> {/* Page title */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Source:** [shadcn/ui Skeleton Component](https://ui.shadcn.com/docs/components/radix/skeleton)

### Custom 404 Error Page

```typescript
// app/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-3xl font-semibold">Page Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/projects">View Projects</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Source:** [How to Configure Custom 404/500 Pages in Next.js](https://oneuptime.com/blog/post/2026-01-24-nextjs-custom-404-500-pages/view)

### Command Palette for Keyboard Shortcuts

```typescript
// components/command-palette.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
            Home
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/projects'))}>
            Projects
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/about'))}>
            About
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/contact'))}>
            Contact
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Projects">
          <CommandItem onSelect={() => runCommand(() => router.push('/projects/teamflow'))}>
            TeamFlow Case Study
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

**Source:** [cmdk Documentation](https://react-cmdk.com/)

### Contact Form with Server Action

```typescript
// app/api/contact/actions.ts
'use server'

import { z } from 'zod'
import nodemailer from 'nodemailer'

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export async function submitContactForm(formData: FormData) {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  })

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors
    }
  }

  const { name, email, message } = parsed.data

  // Configure email transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.CONTACT_EMAIL,
      subject: `Portfolio Contact: ${name}`,
      text: `From: ${name} (${email})\n\n${message}`,
      replyTo: email,
    })

    return { success: true }
  } catch (error) {
    console.error('Email error:', error)
    return {
      success: false,
      errors: { _form: ['Failed to send message. Please try again.'] }
    }
  }
}

// app/(portfolio)/contact/contact-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema, submitContactForm } from '@/app/api/contact/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function ContactForm() {
  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', message: '' },
  })

  async function onSubmit(data: z.infer<typeof contactSchema>) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => formData.append(key, value))

    const result = await submitContactForm(formData)

    if (result.success) {
      form.reset()
      // Show success toast
    } else {
      // Set form errors
      if (result.errors) {
        Object.entries(result.errors).forEach(([key, value]) => {
          form.setError(key as any, { message: value[0] })
        })
      }
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input {...form.register('name')} placeholder="Your Name" />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
      <div>
        <Input {...form.register('email')} type="email" placeholder="your@email.com" />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <div>
        <Textarea {...form.register('message')} placeholder="Your message..." rows={5} />
        {form.formState.errors.message && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.message.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  )
}
```

**Source:** [Type-Safe Form Validation in Next.js 15: Zod, RHF, & Server Actions](https://www.abstractapi.com/guides/email-validation/type-safe-form-validation-in-next-js-15-with-zod-and-react-hook-form)

### Vitest Test for API Route

```typescript
// __tests__/api/contact.test.ts
import { expect, test, describe, vi } from 'vitest'
import { submitContactForm } from '@/app/api/contact/actions'
import nodemailer from 'nodemailer'

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
    })),
  },
}))

describe('Contact Form API', () => {
  test('validates required fields', async () => {
    const formData = new FormData()
    const result = await submitContactForm(formData)

    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  test('validates email format', async () => {
    const formData = new FormData()
    formData.append('name', 'John Doe')
    formData.append('email', 'invalid-email')
    formData.append('message', 'Test message that is long enough')

    const result = await submitContactForm(formData)

    expect(result.success).toBe(false)
    expect(result.errors?.email).toBeDefined()
  })

  test('sends email with valid data', async () => {
    const formData = new FormData()
    formData.append('name', 'John Doe')
    formData.append('email', 'john@example.com')
    formData.append('message', 'Test message that is long enough')

    const result = await submitContactForm(formData)

    expect(result.success).toBe(true)
    expect(nodemailer.createTransport).toHaveBeenCalled()
  })
})
```

**Source:** [Next.js Testing with Vitest](https://nextjs.org/docs/app/guides/testing/vitest)

### Playwright E2E Test for Authentication Flow

```typescript
// e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login')

    await page.fill('[name="email"]', 'admin@test.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('http://localhost:3000/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('invalid credentials show error message', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login')

    await page.fill('[name="email"]', 'wrong@test.com')
    await page.fill('[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
  })

  test('logout clears session and redirects to login', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/auth/login')
    await page.fill('[name="email"]', 'admin@test.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/dashboard')

    // Logout
    await page.click('[aria-label="User menu"]')
    await page.click('text=Logout')

    await page.waitForURL('http://localhost:3000/auth/login')
    await expect(page).toHaveURL('http://localhost:3000/auth/login')
  })
})
```

**Source:** [Next.js Testing: Playwright](https://nextjs.org/docs/app/guides/testing/playwright)

### GitHub Actions Workflow for Coolify Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to Coolify

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/web/Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository }}/web:latest
          cache-from: type=registry,ref=ghcr.io/${{ github.repository }}/web:buildcache
          cache-to: type=registry,ref=ghcr.io/${{ github.repository }}/web:buildcache,mode=max

      - name: Deploy to Coolify
        uses: fjogeleit/http-request-action@v1
        with:
          url: ${{ secrets.COOLIFY_WEBHOOK_URL }}
          method: 'POST'
```

**Source:** [Coolify GitHub Actions Integration](https://coolify.io/docs/applications/ci-cd/github/actions)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-seo library for metadata | Built-in Metadata API | Next.js 13.2 (Feb 2023) | Type-safe metadata, auto-generates Open Graph images, supports dynamic metadata via generateMetadata |
| Jest for testing | Vitest for unit/integration | Vitest 1.0 (Dec 2023) | 10-20x faster test execution, native ESM support, better watch mode |
| Tailwind config.js only | CSS-first @theme directive | Tailwind v4.0 (2025) | 70% smaller production CSS, better performance, CSS variables for theming |
| Pages Router | App Router | Next.js 13.4 stable (May 2023) | Server Components, built-in loading/error conventions, improved SEO |
| Manual Docker optimization | turbo prune --docker | Turborepo 1.10 (2023) | Automatic workspace pruning, minimal build context, faster builds |
| Custom theme scripts | next-themes | Actively maintained (2024) | No flash of incorrect theme, SSR-safe, system preference detection |
| Jest + Cypress | Vitest + Playwright | Playwright 1.0 (2021), Vitest 1.0 (2023) | Better API, faster execution, easier auth state management |
| Vercel/Netlify only | Self-hosted PaaS (Coolify) | Coolify 4.0 (2024) | Shows DevOps skills, cost control, no vendor lock-in |

**Deprecated/outdated:**
- **next-seo:** Replaced by Next.js built-in Metadata API - causes conflicts with App Router
- **getServerSideProps/getStaticProps:** Replaced by Server Components with direct async/await in components
- **_app.js and _document.js:** Replaced by root layout.tsx in App Router
- **Manual next/head:** Replaced by Metadata API exports
- **Jest (for new projects):** Vitest is faster and has better ESM/TypeScript support
- **Tailwind JIT mode:** JIT is now default in Tailwind v3+, no longer needs configuration

## Open Questions

1. **Portfolio as subdomain vs route group?**
   - What we know: Route group approach (`app/(portfolio)`) is simpler - single deployment, shared components/theme
   - What's unclear: User preference for separate subdomain (e.g., portfolio.fernandomillan.com) for professional polish
   - Recommendation: Start with route group for simplicity, can split to subdomain later if needed via Coolify custom domain

2. **Resume: PDF generation vs static file?**
   - What we know: Static PDF simpler to implement, faster to load, works offline
   - What's unclear: Dynamic PDF generation (React PDF, Puppeteer) might show more technical skills
   - Recommendation: Use static PDF initially - focus time on case study quality over PDF generation complexity

3. **Prisma RLS: Implement now or defer to later phase?**
   - What we know: RLS provides database-level security, requirement TECH-07 included in Phase 4
   - What's unclear: Phase 3 not yet implemented - RLS might be blocked by schema changes
   - Recommendation: Defer RLS implementation until Phase 3 schema is stable, add as final verification step

4. **Testing coverage targets?**
   - What we know: Requirements specify critical paths, auth flows, RBAC, API validation
   - What's unclear: Specific coverage percentage targets or which paths are "critical"
   - Recommendation: Focus on high-value tests: auth flows (E2E), RBAC permissions (unit), task CRUD (integration), contact form (unit + E2E)

5. **Coolify: single deployment or separate web/api containers?**
   - What we know: Monorepo has separate web and api apps, Turborepo supports building both
   - What's unclear: Whether to deploy as single container (web+api) or separate containers with load balancer
   - Recommendation: Deploy as separate containers - demonstrates microservices understanding, easier scaling, matches production patterns

6. **Dark mode: portfolio and dashboard themes in sync?**
   - What we know: Requirement PORT-08 specifies "dark mode matching TeamFlow"
   - What's unclear: Whether themes should sync across portfolio/dashboard or be independent
   - Recommendation: Share theme preference via next-themes ThemeProvider in root layout - consistent experience, single toggle

## Sources

### Primary (HIGH confidence)

- **Next.js Official Documentation (v16.1.6, updated 2026-02-11)**
  - Testing with Vitest: https://nextjs.org/docs/app/guides/testing/vitest
  - Testing with Playwright: https://nextjs.org/docs/app/guides/testing/playwright
  - Metadata and OG Images: https://nextjs.org/docs/app/getting-started/metadata-and-og-images
  - Loading UI and Streaming: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
  - Error Handling: https://nextjs.org/docs/app/getting-started/error-handling

- **shadcn/ui Documentation**
  - Next.js Installation: https://ui.shadcn.com/docs/installation/next
  - Skeleton Component: https://ui.shadcn.com/docs/components/radix/skeleton
  - Command Component: https://www.shadcn.io/ui/command

- **Prisma Documentation**
  - Query Optimization Performance: https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance
  - Observability & Logging: https://www.prisma.io/docs/orm/prisma-client/observability-and-logging

- **Coolify Official Documentation**
  - Next.js Deployment: https://coolify.io/docs/applications/nextjs
  - GitHub Actions: https://coolify.io/docs/applications/ci-cd/github/actions
  - Custom SSL Certificates: https://coolify.io/docs/knowledge-base/proxy/traefik/custom-ssl-certs
  - Domains Configuration: https://coolify.io/docs/knowledge-base/domains

- **Turborepo Official Documentation**
  - Docker Guide: https://turbo.build/repo/docs/guides/tools/docker
  - Constructing CI: https://turborepo.dev/docs/crafting-your-repository/constructing-ci

- **Playwright Official Documentation**
  - Authentication: https://playwright.dev/docs/auth
  - CI/CD Integration: https://playwright.dev/docs/ci

- **Vitest Official Documentation**
  - Getting Started: https://vitest.dev/guide/
  - Test Projects: https://vitest.dev/guide/projects

### Secondary (MEDIUM confidence)

- **Next.js SEO Optimization Guide (2026 Edition)** - https://www.djamware.com/post/nextjs-seo-optimization-guide-2026-edition (Jan 2026)
- **How to Configure Custom 404/500 Pages in Next.js** - https://oneuptime.com/blog/post/2026-01-24-nextjs-custom-404-500-pages/view (Jan 2026)
- **Type-Safe Form Validation in Next.js 15: Zod, RHF, & Server Actions** - https://www.abstractapi.com/guides/email-validation/type-safe-form-validation-in-next-js-15-with-zod-and-react-hook-form (2026)
- **How to Add Dark Mode in Next.js 15 App Router with Tailwind CSS V4** - https://www.sujalvanjare.com/blog/dark-mode-nextjs15-tailwind-v4 (2025)
- **Light and Dark Mode in Tailwind CSS v4 with Next.js** - https://www.storieasy.com/blog/light-and-dark-mode-in-tailwind-css-v4-with-next-js (2025)
- **Responsive Design Superpowers: Tailwind CSS 4 with Next.js 15** - https://medium.com/@sureshdotariya/responsive-design-superpowers-tailwind-css-4-with-next-js-15-4920329508ec (2025)
- **Best Practices for Loading States in Next.js** - https://www.getfishtank.com/insights/best-practices-for-loading-states-in-nextjs (2025)
- **The Next.js 15 Streaming Handbook — SSR, React Suspense, and Loading Skeleton** - https://www.freecodecamp.org/news/the-nextjs-15-streaming-handbook/ (2025)
- **Securing Multi-Tenant Applications Using Row Level Security in PostgreSQL with Prisma ORM** - https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35 (2024)
- **Using Row-Level Security in Prisma** - https://atlasgo.io/guides/orms/prisma/row-level-security (2024)
- **How to Secure Multi-Tenant Data with Row-Level Security in PostgreSQL** - https://oneuptime.com/blog/post/2026-01-25-row-level-security-postgresql/view (Jan 2026)
- **Security advice for self-hosting Next.js in Docker** - https://blog.arcjet.com/security-advice-for-self-hosting-next-js-in-docker/ (2024)
- **Next.js Send Email: Tutorial with Code Snippets [2026]** - https://mailtrap.io/blog/nextjs-send-email/ (2026)
- **Best Practices of Next.js Development in 2026** - https://www.serviots.com/blog/nextjs-development-best-practices (2026)
- **Building a Standout Developer Portfolio: Tips and Best Practices** - https://www.nucamp.co/blog/coding-bootcamp-job-hunting-building-a-standout-developer-portfolio-tips-and-best-practices (2025)
- **Testing in 2026: Jest, React Testing Library, and Full Stack Testing Strategies** - https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies (2026)
- **End-to-End Testing Auth Flows with Playwright and Next.js** - https://testdouble.com/insights/how-to-test-auth-flows-with-playwright-and-next-js (2024)

### Tertiary (LOW confidence)

- **cmdk Documentation** - https://react-cmdk.com/ (library documentation, actively maintained)
- **next-themes GitHub** - https://github.com/pacocoursey/next-themes (library repository, last updated 2024)
- **shadcn/ui Components Examples** - https://www.shadcnblocks.com/ (community examples, varying quality)

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH - All libraries are official Next.js recommendations or widely adopted (shadcn/ui, Vitest, Playwright) with extensive documentation
- **Architecture patterns:** HIGH - Route groups, loading.tsx, error.tsx are official Next.js conventions; dark mode and RLS patterns verified across multiple authoritative sources
- **Pitfalls:** MEDIUM-HIGH - Most pitfalls documented in official docs or verified developer guides; RLS context management based on community experience
- **Testing strategy:** HIGH - Official Next.js testing documentation for both Vitest and Playwright, clear guidance on when to use each
- **Deployment (Coolify):** MEDIUM - Official Coolify documentation covers basics; monorepo deployment patterns extrapolated from Turborepo + Coolify docs combined
- **Portfolio best practices:** MEDIUM - Multiple 2025-2026 sources agree on core principles (case studies over screenshots, technical decisions documented)

**Research date:** 2026-02-15
**Valid until:** 60 days (stable ecosystem, Next.js 15+ mature, Tailwind v4 stable, testing tools established)

**Validation notes:**
- Next.js 16.1.6 documentation last updated 2026-02-11 (4 days ago) - very current
- Tailwind v4 production-ready as of late 2024, stable
- Vitest and Playwright both mature projects with stable APIs
- Coolify actively developed, documentation current for 2026
- Row Level Security patterns verified across multiple sources (Prisma blog, Medium, OneUpTime)
- Portfolio best practices validated across multiple recent (2025-2026) developer guides
