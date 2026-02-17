# Stack Research: TeamFlow

**Domain:** Work Management SaaS
**Researched:** 2026-02-14
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Next.js | 15.x (latest: 15.4) | Frontend framework with App Router | Industry standard for React SSR with production-ready features: React 19 support, Server Actions stable, Turbopack dev, improved caching semantics. App Router provides optimal real-time UX patterns | HIGH |
| NestJS | 10.x (latest stable) | Backend framework | TypeScript-first Node.js framework with decorator-driven architecture, built-in WebSocket support, dependency injection, and production-grade patterns. Industry standard for enterprise Node.js APIs | HIGH |
| Prisma | 7.x | ORM and type-safe database access | Leading TypeScript ORM with excellent DX, migration tooling, and type safety. Full support for audit trails via extensions and PostgreSQL RLS for multi-tenancy | HIGH |
| PostgreSQL | 16.x | Primary database | Industry standard RDBMS with Row Level Security for multi-tenancy, JSON support for flexible schemas, excellent performance for work management queries, and mature ecosystem | HIGH |
| NextAuth.js (Auth.js) | v5 | Authentication and session management | Official Next.js auth solution with built-in RBAC support, database adapter for Prisma, and production-ready session handling. v5 adds improved middleware patterns | HIGH |
| Socket.io | 4.x | WebSocket library for real-time features | Battle-tested WebSocket abstraction with native NestJS integration, automatic reconnection, Redis adapter for horizontal scaling, and excellent browser compatibility | HIGH |

### Real-Time & WebSocket

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| @nestjs/websockets | Latest (10.x) | NestJS WebSocket integration | Core package for WebSocket gateway implementation in NestJS | HIGH |
| @nestjs/platform-socket.io | Latest (10.x) | Socket.io platform adapter | Required adapter for using Socket.io with NestJS gateways | HIGH |
| @socket.io/redis-adapter | 8.x | Redis adapter for Socket.io | Required for horizontal scaling across multiple server instances. Uses Redis pub/sub for message distribution | HIGH |
| ioredis | 5.x | Redis client | High-performance Redis client for Socket.io adapter and general caching | HIGH |

### RBAC & Authorization

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| @casl/ability | 6.x | Fine-grained authorization | Industry standard for RBAC/ABAC. Supports both role-based and attribute-based permissions with type safety | HIGH |
| @casl/prisma | 6.x | CASL integration for Prisma | Converts CASL rules to Prisma queries for database-level permission filtering using `accessibleBy()` helper | HIGH |

### Audit Logging

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| Prisma Client Extensions | Built-in | Custom audit trail middleware | Use for context-aware audit trails. Can inject user context into PostgreSQL triggers via session variables | HIGH |
| PostgreSQL Triggers | Native | Database-level audit capture | Creates audit_log table automatically capturing INSERT/UPDATE/DELETE with timestamps and user context | HIGH |

### Validation

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| zod | 3.x | Runtime schema validation | TypeScript-first validation. Use with nestjs-zod for DTO validation and zod-prisma-types to generate schemas from Prisma models | HIGH |
| nestjs-zod | Latest | NestJS + Zod integration | Replaces class-validator. Provides createZodDto for type-safe DTOs with automatic OpenAPI schema generation | HIGH |
| zod-prisma-types | Latest | Generate Zod schemas from Prisma | Automatically creates Zod validators from your Prisma schema comments for end-to-end type safety | MEDIUM |

### Testing

| Tool | Version | Purpose | When to Use | Confidence |
|------|---------|---------|-------------|------------|
| Vitest | Latest (2.x) | Unit and integration testing | Modern Jest alternative with 3-4x faster test execution. Native ESM support. Recommended over Jest for 2026 projects | HIGH |
| @testing-library/react | Latest | React component testing | Standard for testing Next.js client components with Vitest | HIGH |
| Playwright | Latest | E2E testing | Required for async Server Components (Vitest doesn't support them). Industry standard for E2E tests | HIGH |

### Logging & Monitoring

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| nest-winston | 1.x | Winston integration for NestJS | Production-grade structured logging with multiple transports, log rotation, and correlation IDs for distributed tracing | HIGH |
| winston | 3.x (3.17.0+) | Logging framework | Industry standard logger with JSON formatting for log aggregation systems | HIGH |
| winston-daily-rotate-file | Latest | Log rotation | Automated log file management with size and time-based rotation | MEDIUM |

### Development Tools

| Tool | Purpose | Notes | Confidence |
|------|---------|-------|------------|
| TypeScript 5.x | Type safety across stack | Use strict mode. Required for Zod, Prisma, and full-stack type safety | HIGH |
| Turbopack | Next.js dev server | Stable in Next.js 15. Up to 96.3% faster Fast Refresh vs Webpack | HIGH |
| Prisma Studio | Database GUI | Built-in visual editor for database during development | HIGH |
| ESLint 9.x | Code quality | Next.js 15 supports ESLint 9 with flat config format | HIGH |

---

## v1.1 Design System & Accessibility Additions

**Focus:** WCAG AA compliance, Shadcn UI integration, semantic design tokens
**Researched:** 2026-02-16
**Confidence:** HIGH

### Design System Foundation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| shadcn/ui | latest | Design system foundation | Industry standard for accessible React components built on Radix UI primitives. Provides copy-paste components with full customization, integrates seamlessly with Tailwind v4 and Next.js 15. Official support for React 19. |
| Radix UI Primitives | latest | Headless UI primitives | Foundation of shadcn/ui. WAI-ARIA compliant components with built-in keyboard navigation, focus management, and screen reader support. Handles complex accessibility patterns (dialogs, dropdowns, etc.). |
| tw-animate-css | latest | Animation utilities | Tailwind v4 compatible replacement for deprecated `tailwindcss-animate`. Pure CSS solution embracing v4's CSS-first architecture. |

### Supporting Libraries (v1.1)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | latest | Component variant management | Required for shadcn/ui. Declarative API for defining component variants (size, color, state). Provides type-safe variant composition. |
| next-themes | 0.4.6+ | Theme management | **Already installed.** Handles light/dark/system themes with no flash. Works with Tailwind's `dark:` variant. Persists user preference. |
| lucide-react | 0.564.0+ | Icon library | **Already installed.** Modern, tree-shakeable icon library. Shadcn/ui's default icon set. Accessibility-friendly with proper ARIA attributes. |
| clsx | 2.1.1+ | Conditional class names | **Already installed.** Utility for constructing className strings conditionally. Part of the `cn()` utility pattern. |
| tailwind-merge | 3.4.1+ | Tailwind class merging | **Already installed.** Intelligently merges conflicting Tailwind classes. Essential for component composition. |

### Accessibility Testing & Validation

| Tool | Purpose | When to Use |
|------|---------|-------------|
| eslint-plugin-jsx-a11y | Lint-time accessibility checks | Static analysis of JSX for a11y issues. Supports ESLint 9 flat config. Use `plugin:jsx-a11y/recommended` or `plugin:jsx-a11y/strict` for stricter enforcement. |
| axe DevTools (browser) | Manual + automated WCAG testing | Development and QA. Browser extension for in-page accessibility audits. **Recommended over @axe-core/react** which does NOT support React 18+. Free tier available. |
| color-contrast-checker | WCAG contrast validation | JavaScript library for validating WCAG 2.0/2.1 color contrast ratios. Use for design token validation. Supports shorthand hex codes. |
| wcag-contrast | Programmatic contrast calculation | Low-level utility for WCAG contrast math. Use for build-time validation of design tokens. |
| Playwright + axe-core | E2E accessibility testing | CI/CD pipeline. Automated a11y regression testing. |

## Installation

### Core Dependencies

```bash
# Frontend (Next.js)
npm install next@latest react@latest react-dom@latest
npm install next-auth@beta  # v5 beta
npm install @prisma/client
npm install zod

# Backend (NestJS)
npm install @nestjs/core @nestjs/common @nestjs/platform-express
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install @prisma/client
npm install @casl/ability @casl/prisma
npm install nest-winston winston
npm install ioredis @socket.io/redis-adapter
npm install nestjs-zod zod
```

### Dev Dependencies

```bash
# Shared
npm install -D typescript @types/node
npm install -D prisma
npm install -D vitest @testing-library/react playwright
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Code generation
npm install -D zod-prisma-types

# Logging
npm install -D winston-daily-rotate-file
```

### v1.1 Design System & Accessibility

```bash
# Navigate to web app
cd apps/web

# Shadcn/ui CLI initialization (detects Next.js 15 + Tailwind v4)
npx shadcn@latest init

# Manual dependencies (if not using CLI)
npm install class-variance-authority tw-animate-css

# Development tools
npm install -D eslint-plugin-jsx-a11y color-contrast-checker wcag-contrast

# Note: lucide-react, tailwind-merge, clsx, next-themes already installed
```

### Shadcn/ui Component Installation

```bash
# Add components as needed for v1.1
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add tooltip

# Components are copied to apps/web/components/ui/
# Fully customizable - you own the code
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative | Confidence |
|----------|-------------|-------------|---------------------|------------|
| Backend Framework | NestJS | Express.js | Express lacks built-in structure for enterprise apps. No DI, decorators, or opinionated architecture. NestJS provides production patterns out of the box | HIGH |
| Backend Framework | NestJS | Fastify standalone | Fastify is faster but requires manual architecture decisions. NestJS supports Fastify as underlying platform while providing structure | MEDIUM |
| ORM | Prisma | TypeORM | TypeORM uses Active Record pattern vs Prisma's Data Mapper. Prisma has better DX, migration tooling, and type safety in 2026 | HIGH |
| ORM | Prisma | Drizzle | Drizzle is lighter but less mature. Prisma has better ecosystem for audit trails, RLS extensions, and team familiarity | MEDIUM |
| WebSocket | Socket.io | Native WebSocket API | Socket.io provides automatic reconnection, fallbacks, rooms/namespaces, and Redis scaling. Native API requires manual implementation | HIGH |
| Auth | NextAuth v5 | Clerk | Clerk is excellent but paid for production features. NextAuth is open source with full RBAC control and Prisma integration | MEDIUM |
| Auth | NextAuth v5 | Auth0 | Auth0 adds external dependency and cost. NextAuth provides same features with database ownership | MEDIUM |
| Validation | Zod | class-validator | class-validator uses decorators (runtime metadata). Zod is TypeScript-first with better DX and composability in 2026 | HIGH |
| Testing | Vitest | Jest | Jest slower (3-4x) and lacks native ESM support. Vitest is Jest-compatible API with modern features | HIGH |
| **Design System** | **shadcn/ui** | **React Aria Components** | You need Adobe's opinionated styled components OR you're building a native mobile app (React Native Aria). Shadcn provides more flexibility. | HIGH |
| **Design System** | **shadcn/ui** | **Headless UI** | You prefer Tailwind Labs' official library OR need Vue support. Less comprehensive than Radix/shadcn. | MEDIUM |
| **Primitives** | **Radix UI** | **ARIAKit** | You prefer ARIAKit's API OR need specific components Radix doesn't provide. Both are excellent WCAG-compliant options. | MEDIUM |
| **Animations** | **tw-animate-css** | **custom animations** | You have brand-specific animation requirements. Build on `@theme` animations block in Tailwind v4. | MEDIUM |
| **A11y Testing** | **axe DevTools** | **manual WCAG audit** | Final QA before launch. Automated tools catch 30-40% of issues; human testing catches the rest. | HIGH |

## What NOT to Use

| Avoid | Why | Use Instead | Confidence |
|-------|-----|-------------|------------|
| Sequelize | Outdated ORM with poor TypeScript support and lacking migration tools compared to modern alternatives | Prisma | HIGH |
| Pusher | Paid service for WebSocket. Self-hosted Socket.io + Redis provides same features with better cost/control | Socket.io + Redis | MEDIUM |
| class-validator + class-transformer | Decorator-based validation is being replaced by TypeScript-first solutions. More boilerplate than Zod | Zod + nestjs-zod | HIGH |
| Jest (for new projects) | Slower test execution, poor ESM support. Vitest provides better DX in 2026 | Vitest | HIGH |
| NextAuth v4 | Deprecated. v5 (Auth.js) has breaking changes but better middleware, edge runtime support, and patterns | NextAuth v5 (Auth.js) | HIGH |
| Prisma Middleware (deprecated) | Prisma deprecated middleware in favor of Client Extensions for better type safety | Prisma Client Extensions | HIGH |
| ws library directly | Low-level WebSocket library requires manual implementation of reconnection, rooms, Redis scaling | Socket.io | MEDIUM |
| **tailwindcss-animate** | **Deprecated in Tailwind v4 (as of March 2025)** | **tw-animate-css (v4 compatible)** | **HIGH** |
| **@axe-core/react** | **Does NOT support React 18+** | **axe DevTools browser extension OR axe Developer Hub (free tier)** | **HIGH** |
| **react-axe** | **Deprecated by Deque Labs** | **@axe-core/react (though see React 18+ note above)** | **HIGH** |
| **Tailwind v3 config (tailwind.config.js)** | **Tailwind v4 uses CSS-first `@theme` directive** | **Migrate to `@theme` in app.css** | **HIGH** |
| **Standalone Radix packages** | **Redundant with shadcn/ui** | **Use shadcn CLI - it installs Radix primitives as needed** | **MEDIUM** |

## Production Patterns by Feature

### Real-Time Collaboration

**Stack:**
- NestJS WebSocket Gateway with @nestjs/platform-socket.io
- Redis adapter for horizontal scaling
- PostgreSQL for state persistence
- Optimistic UI updates in Next.js client

**Pattern:**
```typescript
// NestJS Gateway with Redis
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL },
  adapter: RedisAdapter // for scaling
})
export class CollaborationGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('task:update')
  async handleTaskUpdate(
    @MessageBody() data: TaskUpdateDto,
    @ConnectedSocket() client: Socket
  ) {
    // Validate with Zod, check CASL permissions
    // Emit to room members
  }
}
```

### RBAC Implementation

**Stack:**
- CASL for permission rules (Admin/Manager/Member)
- NextAuth v5 session with role in JWT
- Prisma + CASL for database filtering
- NestJS guards for route protection

**Pattern:**
```typescript
// CASL ability definition
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder(PrismaAbility);

    if (user.role === 'ADMIN') {
      can('manage', 'all');
    } else if (user.role === 'MANAGER') {
      can('read', 'Project', { organizationId: user.organizationId });
      can('update', 'Task', { assigneeId: user.id });
    }

    return build();
  }
}

// Prisma query with CASL
const accessibleProjects = await prisma.project.findMany({
  where: accessibleBy(ability, 'read').Project
});
```

### Audit Logging

**Stack:**
- Prisma Client Extension for user context injection
- PostgreSQL triggers for audit table
- Structured JSON logging with Winston

**Pattern:**
```typescript
// Prisma extension with user context
const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query, operation, model }) {
        // Inject user ID into session variable
        await prisma.$executeRaw`SET LOCAL app.user_id = ${userId}`;
        return query(args);
      }
    }
  }
});

// PostgreSQL trigger reads app.user_id from session
CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION log_audit();
```

### Multi-Tenancy

**Stack:**
- PostgreSQL Row Level Security (RLS)
- Prisma Client Extension for tenant context
- NextAuth session with organizationId

**Pattern:**
```typescript
// Prisma extension for RLS
export function createTenantPrisma(organizationId: string) {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          await prisma.$executeRaw`SET LOCAL app.tenant_id = ${organizationId}`;
          return query(args);
        }
      }
    }
  });
}

// PostgreSQL RLS policy
CREATE POLICY tenant_isolation ON projects
  USING (organization_id = current_setting('app.tenant_id')::uuid);
```

### v1.1: Design System Component Pattern

**Stack:**
- shadcn/ui components in `components/ui/`
- class-variance-authority for variants
- Tailwind v4 `@theme` for design tokens
- next-themes for dark mode

**Pattern:**
```typescript
// Button component with CVA variants
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[--color-primary] text-[--color-primary-foreground] hover:bg-[--color-primary]/90",
        destructive: "bg-[--color-destructive] text-[--color-destructive-foreground]",
        outline: "border border-[--color-border] bg-transparent hover:bg-[--color-accent]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  className?: string;
}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}
```

### v1.1: WCAG AA Color Validation

**Stack:**
- color-contrast-checker for validation
- Tailwind v4 `@theme` for semantic tokens
- Design token build script

**Pattern:**
```typescript
// scripts/validate-colors.ts
import { ColorContrastChecker } from 'color-contrast-checker';

const checker = new ColorContrastChecker();

// Design tokens from @theme
const tokens = {
  background: '#FFFFFF',
  foreground: '#18181B', // zinc-900
  primary: '#3B82F6',    // blue-500
  primaryForeground: '#FFFFFF',
};

// WCAG AA requirements: 4.5:1 normal text, 3:1 large text/UI
const results = {
  text: checker.isLevelAA(tokens.foreground, tokens.background, 14), // normal text
  primaryText: checker.isLevelAA(tokens.primaryForeground, tokens.primary, 14),
  uiComponents: checker.isLevelAA(tokens.primary, tokens.background, 18), // 3:1 for UI
};

console.log('WCAG AA Validation:', results);
// Fail build if any check fails
```

### v1.1: Accessibility Testing Workflow

**Development:**
1. eslint-plugin-jsx-a11y catches issues at write-time
2. axe DevTools browser extension for manual testing
3. Keyboard navigation testing (Tab, Enter, Escape, Arrow keys)

**CI/CD:**
```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have WCAG violations', async ({ page }) => {
  await page.goto('/dashboard');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## Version Compatibility Matrix

| Package | Version | Compatible With | Critical Notes |
|---------|---------|-----------------|----------------|
| Next.js 15.x | 15.4+ | React 19, NextAuth v5 | Requires React 19 for App Router. Pages Router supports React 18 for backwards compatibility |
| NestJS 10.x | 10.0+ | Prisma 7.x, Socket.io 4.x | Use @nestjs/platform-socket.io for Socket.io integration |
| Prisma 7.x | 7.0+ | PostgreSQL 12+, TypeScript 5.x | Requires strict mode in tsconfig.json. Client Extensions replace deprecated middleware |
| NextAuth v5 | 5.0.0-beta | Next.js 15, Prisma adapter | Breaking changes from v4. Use auth.config.ts for middleware callbacks |
| Socket.io 4.x | 4.7+ | @nestjs/websockets 10.x | Redis adapter 8.x required for scaling. Binary support improved in 4.7+ |
| Zod 3.x | 3.22+ | TypeScript 5.x | Requires strict mode. Use with nestjs-zod for NestJS integration |
| Vitest 2.x | 2.0+ | TypeScript 5.x, React 19 | Cannot test async Server Components - use Playwright for those |
| **shadcn/ui** | **latest** | **Next.js 15 + React 19** | **Official support announced October 2024. Use `--force` or `--legacy-peer-deps` if npm shows peer dependency warnings.** |
| **Radix UI** | **latest** | **React 19** | **Fully compatible. Underlying primitives for shadcn/ui.** |
| **Tailwind v4** | **4.1.18+** | **Next.js 15** | **Requires `@tailwindcss/postcss@4.x`. Already configured in project.** |
| **tw-animate-css** | **latest** | **Tailwind v4** | **Built specifically for v4's CSS-first architecture.** |
| **class-variance-authority** | **latest** | **TypeScript 5.6** | **Works seamlessly. Type inference for variants.** |
| **next-themes** | **0.4.6+** | **Next.js 15 App Router** | **Already installed. Use `<ThemeProvider attribute="class">` for Tailwind dark mode.** |
| **lucide-react** | **0.564.0+** | **React 19** | **Already installed. Tree-shakeable, actively maintained.** |
| **eslint-plugin-jsx-a11y** | **latest** | **ESLint 9 flat config** | **Supports both legacy `.eslintrc` and modern flat config. Use `jsxA11y.flatConfigs.recommended`.** |

## Integration Notes (v1.1)

### Tailwind v4 + shadcn/ui

shadcn/ui works with Tailwind v4 out of the box. The CLI detects v4 and configures accordingly:

- **Design tokens**: Define in `@theme` block in `app/globals.css`
- **Animations**: Use tw-animate-css instead of deprecated tailwindcss-animate
- **Dark mode**: Use `next-themes` with `attribute="class"` (no tailwind.config.js darkMode setting needed)

### WCAG AA Compliance

All Radix/shadcn components follow WCAG AA guidelines by default:

- **Color contrast**: 4.5:1 for normal text, 3:1 for large text and UI components
- **Keyboard navigation**: Full keyboard support with proper focus management
- **Screen readers**: Semantic HTML + ARIA attributes
- **Focus indicators**: Visible focus states (customize via Tailwind)

**Validation workflow:**

1. **Design phase**: Use `color-contrast-checker` to validate token combinations
2. **Development**: `eslint-plugin-jsx-a11y` catches static issues
3. **Testing**: axe DevTools for page-level audits
4. **CI/CD**: Playwright + axe-core for regression testing

### Component Architecture (v1.1)

```
apps/web/
├── components/
│   ├── ui/           # shadcn components (copied via CLI)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── custom/       # Your custom components
│       └── ...
├── lib/
│   └── utils.ts      # cn() utility (tailwind-merge + clsx)
└── app/
    └── globals.css   # @theme design tokens
```

### Design Token Strategy (v1.1)

Tailwind v4's `@theme` directive replaces the old JavaScript config:

```css
@import "tailwindcss";

@theme {
  /* Semantic color tokens */
  --color-primary: oklch(0.55 0.25 262);
  --color-primary-foreground: oklch(0.99 0 0);

  /* WCAG AA compliant contrasts */
  --color-background: oklch(0.99 0 0);
  --color-foreground: oklch(0.15 0 0); /* ~14:1 contrast */

  /* Dark mode overrides in :root.dark */
  /* ... */
}
```

**Advantages for v1.1:**

- Design tokens are native CSS variables (accessible at runtime)
- IDE autocompletion works automatically
- No build step between config and CSS
- Easy to validate with `wcag-contrast` library

## TypeScript Configuration

All projects must use strict mode for type safety with Prisma, Zod, and Next.js:

```json
{
  "compilerOptions": {
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023",
    "skipLibCheck": false,
    "esModuleInterop": true
  }
}
```

## Docker Production Setup

**Multi-stage build pattern:**

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production
RUN npx prisma generate

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

**Key patterns:**
- Next.js: Use standalone output mode (`output: 'standalone'` in next.config.js)
- NestJS: Multi-stage build, bind to 0.0.0.0:3000
- Prisma: Generate client in builder stage, set DATABASE_URL at runtime
- Health checks: Next.js at `/api/health`, NestJS at `/health`

## Sources

### Official Documentation (HIGH confidence)
- [Next.js 15 Release](https://nextjs.org/blog/next-15) - Official announcement with production features
- [NestJS WebSocket Documentation](https://docs.nestjs.com/websockets/gateways) - Official WebSocket patterns
- [Socket.io Redis Adapter](https://socket.io/docs/v4/redis-adapter/) - Official scaling documentation
- [Auth.js RBAC Guide](https://authjs.dev/guides/role-based-access-control) - Official RBAC implementation
- [Prisma Client Extensions](https://www.prisma.io/docs/orm/prisma-client/client-extensions) - Official audit trail patterns

### v1.1 Official Documentation (HIGH confidence)
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next) — Installation steps and dependencies
- [shadcn/ui React 19 Support](https://ui.shadcn.com/docs/react-19) — Official React 19 compatibility announcement
- [shadcn/ui Manual Installation](https://ui.shadcn.com/docs/installation/manual) — Explicit package list
- [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) — Tailwind v4 migration guide
- [Radix UI Primitives](https://www.radix-ui.com/primitives) — Component library documentation
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility) — WAI-ARIA compliance details
- [Tailwind CSS v4 Announcement](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first configuration, @theme directive
- [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme) — Design token documentation
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) — Dark mode implementation

### Production Patterns (HIGH to MEDIUM confidence)
- [How to Implement WebSockets in NestJS](https://oneuptime.com/blog/post/2026-02-02-nestjs-websockets/view) - Recent 2026 production patterns
- [Building a Production-Ready Real-Time Notification System in NestJS](https://medium.com/@marufpulok98/building-a-production-ready-real-time-notification-system-in-nestjs-websockets-redis-offline-6cc2f1bd0b05) - WebSocket + Redis patterns
- [Scalable WebSockets with NestJS and Redis](https://blog.logrocket.com/scalable-websockets-with-nestjs-and-redis/) - Scaling patterns
- [Implementing Prisma RBAC](https://www.permit.io/blog/implementing-prisma-rbac-fine-grained-prisma-permissions) - CASL + Prisma integration
- [Securing Multi-Tenant Applications Using RLS in PostgreSQL with Prisma](https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35) - Multi-tenancy patterns
- [Prisma Audit Trail Guide for Postgres](https://medium.com/@arjunlall/prisma-audit-trail-guide-for-postgres-5b09aaa9f75a) - Audit logging implementation

### v1.1 NPM Packages (MEDIUM Confidence)
- [@axe-core/react](https://www.npmjs.com/package/@axe-core/react) — React 18+ limitation noted
- [eslint-plugin-jsx-a11y](https://www.npmjs.com/package/eslint-plugin-jsx-a11y) — ESLint integration
- [tw-animate-css](https://www.npmjs.com/package/tw-animate-css) — Tailwind v4 animation utilities
- [color-contrast-checker](https://www.npmjs.com/package/color-contrast-checker) — WCAG validation library
- [wcag-contrast](https://www.npmjs.com/package/wcag-contrast) — Contrast calculation utility
- [class-variance-authority](https://cva.style/docs) — Variant API documentation

### v1.1 Community Resources (MEDIUM Confidence)
- [Medium: Theme colors with Tailwind v4 and next-themes](https://medium.com/@kevstrosky/theme-colors-with-tailwind-css-v4-0-and-next-themes-dark-light-custom-mode-36dca1e20419) — 2026 implementation guide
- [Medium: React Tailwind reusable components with CVA](https://medium.com/@gorkemkaramolla/react-tailwind-reuseable-and-customizable-components-with-cva-clsx-and-tailwindmerge-combo-guide-c3756bdbbf16) — Pattern explanation
- [DesignRevision: shadcn UI Complete Guide (2026)](https://designrevision.com/blog/shadcn-ui-guide) — Current best practices
- [Medium: Accessibility Testing in React](https://medium.com/@ignatovich.dm/accessibility-testing-in-react-tools-and-best-practices-119f3c0aee6e) — Tool comparison
- [BrowserStack: Automating Accessibility Testing 2026](https://www.browserstack.com/guide/automate-accessibility-testing) — CI/CD integration patterns
- [W3C: Web Accessibility Evaluation Tools](https://www.w3.org/WAI/test-evaluate/tools/list/) — Official tool directory

### Best Practices (MEDIUM confidence)
- [Next.js Best Practices in 2025](https://www.raftlabs.com/blog/building-with-next-js-best-practices-and-benefits-for-performance-first-teams/) - Architecture patterns
- [Next.js Server Actions Best Practice](https://medium.com/@lior_amsalem/nextjs-15-actions-best-practice-bf5cc023301e) - Server Actions patterns
- [Complete Guide to Winston Logger in NestJS 2026](https://copyprogramming.com/howto/javascript-winston-logger-in-nestja-spp) - Production logging
- [How to Add Logging to NestJS Applications](https://oneuptime.com/blog/post/2026-02-02-nestjs-logging/view) - Structured logging patterns

### Testing and Development
- [Next.js Vitest Documentation](https://nextjs.org/docs/app/guides/testing/vitest) - Official testing guide
- [End-to-End Testing in NestJS with Vitest](https://medium.com/@aymankaddioui/end-to-end-testing-in-nestjs-the-real-way-with-vitest-postgresql-99afd4c25f65) - E2E patterns
- [Dockerizing NestJS with Prisma and PostgreSQL](https://notiz.dev/blog/dockerizing-nestjs-with-prisma-and-postgresql/) - Production containers

---
*Stack research for: TeamFlow (Work Management SaaS)*
*Researched: 2026-02-14 (core), 2026-02-16 (v1.1 additions)*
*Overall Confidence: HIGH - All core technologies verified with official docs and recent 2026 sources*
