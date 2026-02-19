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

## DevCollab Stack Additions

**Focus:** New stack additions needed for DevCollab (developer collaboration platform).
**Researched:** 2026-02-17
**Confidence:** HIGH (core), MEDIUM (search integration specifics)

DevCollab re-uses the full TeamFlow stack. This section documents ONLY what needs to be added. Do not re-install anything already present in `apps/web` or `apps/api`.

---

### 1. Rich Text / Markdown Editor — Tiptap v3

**Recommendation: Tiptap v3 (`@tiptap/react` + `@tiptap/pm` + `@tiptap/starter-kit`)**

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @tiptap/react | ^3.19.0 | Rich text editor React bindings | v3 is stable (released 2025), React 19 compatible, SSR-safe with `immediatelyRender: false`. Used for Markdown posts with rich editing. |
| @tiptap/pm | ^3.19.0 | ProseMirror engine (required peer dep) | Required by @tiptap/react. Ships ProseMirror as a unified package. |
| @tiptap/starter-kit | ^3.19.0 | Bundled common extensions | Includes bold, italic, headings, lists, code blocks, blockquotes. Reduces individual extension installs. |
| @tiptap/extension-code-block-lowlight | ^3.x | Syntax-highlighted code blocks in editor | Integrates lowlight (a highlight.js wrapper) for code block highlighting within the editor itself. |
| lowlight | ^3.x | highlight.js wrapper for Tiptap | Required by extension-code-block-lowlight. Provides language-aware highlighting inside the editor. |

**Why Tiptap over alternatives:**
- ProseMirror-based: battle-tested, production-grade collaborative editing foundation
- React 19 compatible: v3.16+ confirmed React 19 support (January 2026 verification)
- SSR-safe: `immediatelyRender: false` prevents hydration mismatches in Next.js App Router
- Extensible: custom extensions for mentions, @user linking, file attachments
- Open source core: all features DevCollab needs are in the free tier

**Known limitation:** Pro drag-handle extension has a tippyjs-react dependency that has React 19 issues. Do not use `@tiptap-pro/extension-drag-handle`. Use the free `@tiptap/extension-drag-handle` alternative or omit drag handles.

**SSR configuration required:**
```typescript
// DevCollab rich text editor (client component only)
'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const editor = useEditor({
  extensions: [StarterKit],
  immediatelyRender: false, // REQUIRED for Next.js SSR safety
  content: initialContent,
});
```

---

### 2. Syntax Highlighting — Shiki v3

**Recommendation: Shiki v3 (server component rendering) + react-markdown v10 for display**

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| shiki | ^3.22.0 | Syntax highlighting engine | Ships zero client JS. Works in React Server Components via `codeToHtml()`. Used by Vercel (Next.js docs), Astro. TextMate grammar support means near-perfect highlighting for all languages. |
| react-markdown | ^10.1.0 | Markdown rendering component | Latest version (March 2025) supports React 19. Used for rendering saved Markdown posts in read-only view. |
| rehype-pretty-code | ^0.14.x | Shiki + rehype integration | Plugs Shiki into react-markdown's rehype pipeline. Handles code fence syntax highlighting in Markdown posts automatically. |

**Why Shiki over alternatives:**
- `prism-react-renderer`: ships JS to client, requires DOM manipulation — bad for RSC
- `react-syntax-highlighter`: 1MB+ bundle, client-side only
- `highlight.js` direct: no RSC support, significantly larger grammar files
- Shiki renders at build/request time, ships zero syntax highlighting JS to browser

**Usage pattern for DevCollab:**

```typescript
// For code snippets display — React Server Component
import { codeToHtml } from 'shiki';

async function CodeSnippet({ code, language }: { code: string; language: string }) {
  const html = await codeToHtml(code, {
    lang: language,
    theme: 'github-dark', // or 'github-light' based on user theme
  });
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// For Markdown posts — use react-markdown + rehype-pretty-code
import Markdown from 'react-markdown';
import rehypePrettyCode from 'rehype-pretty-code';

<Markdown rehypePlugins={[[rehypePrettyCode, { theme: 'github-dark' }]]}>
  {markdownContent}
</Markdown>
```

**Theme consideration:** Use `github-dark` / `github-light` pair for a professional developer-facing look. Shiki supports dual themes for light/dark mode via CSS variables.

---

### 3. File Storage — AWS SDK v3 + MinIO (dev) + Cloudflare R2 (prod)

**Recommendation: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` + `multer-s3` + MinIO Docker (dev) + Cloudflare R2 (prod)**

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @aws-sdk/client-s3 | ^3.991.0 | S3 API client (R2 + MinIO compatible) | AWS SDK v3 modular client. Cloudflare R2 and MinIO both expose S3-compatible APIs, so one SDK covers all environments. Actively maintained (daily releases). |
| @aws-sdk/s3-request-presigner | ^3.991.0 | Pre-signed URL generation | Generates time-limited upload/download URLs. Frontend uploads directly to storage, bypassing API server — avoids large file payloads hitting NestJS. |
| @aws-sdk/lib-storage | ^3.991.0 | Multipart upload support | Required for files >5MB (auto-selected by SDK). Handles chunked uploads to S3-compatible storage. |
| multer-s3 | ^3.0.1 | Multer storage engine for S3 | Streams files directly to S3 without disk I/O. v3.x uses AWS SDK v3 (compatible with R2 and MinIO). |
| @types/multer | latest | TypeScript types for multer | NestJS @UseInterceptors(FileInterceptor) requires multer types. |

**Environment strategy:**

| Environment | Storage Backend | SDK Configuration |
|-------------|-----------------|-------------------|
| Local dev (Docker) | MinIO (`minio/minio` container) | Point `endpoint` to `http://minio:9000`, `forcePathStyle: true` |
| Production (Coolify) | Cloudflare R2 | Point `endpoint` to R2 account URL, same AWS SDK v3 |

**Why R2 for production:**
- Zero egress fees (vs AWS S3 which charges per GB downloaded)
- S3-compatible API — same SDK, change only the endpoint/credentials
- No data transfer costs when serving to global CDN
- Generous free tier (10GB storage, 1M Class A operations/month)

**Why NOT to upload directly from NestJS buffer:**
- Large files (10MB+) would load entirely into NestJS memory
- Pre-signed URLs let the client upload directly, keeping API layer stateless
- Scales to concurrent uploads without API bottleneck

**NestJS service pattern:**
```typescript
// apps/devcollab-api/src/storage/storage.service.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3: S3Client;

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: config.get('STORAGE_ENDPOINT'), // MinIO or R2 URL
      credentials: {
        accessKeyId: config.get('STORAGE_ACCESS_KEY'),
        secretAccessKey: config.get('STORAGE_SECRET_KEY'),
      },
      forcePathStyle: config.get('STORAGE_FORCE_PATH_STYLE') === 'true', // true for MinIO
    });
  }

  async getUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.get('STORAGE_BUCKET'),
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }
}
```

**Docker compose addition for MinIO (dev only):**
```yaml
# Add to docker-compose.dev.yml
minio:
  image: minio/minio:latest
  container_name: devcollab-minio
  ports:
    - '9000:9000'   # API
    - '9001:9001'   # Console UI
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  command: server /data --console-address ":9001"
  volumes:
    - minio_data:/data
  networks:
    - teamflow-network
  healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost:9000/minio/health/live']
    interval: 10s
    timeout: 5s
    retries: 5
```

**Note on MinIO Docker Hub deprecation:** MinIO deprecated their Docker Hub image updates in October 2025. Use `minio/minio:latest` for local dev (still works), or Chainguard's maintained image for production self-hosting. For DevCollab, local dev MinIO is fine; production uses Cloudflare R2.

---

### 4. Full-Text Search — Meilisearch + nestjs-meilisearch

**Recommendation: Meilisearch v1.x (Docker, self-hosted) + `nestjs-meilisearch` v3.0.0**

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| nestjs-meilisearch | ^3.0.0 | NestJS module for Meilisearch | v3.0.0 explicitly supports NestJS v11, drops NestJS 10. Node.js 20+ required (already using node:20). Provides `@InjectMeiliSearch()` decorator and `MeiliSearchModule.forRoot()`. |
| meilisearch | ^0.49.x | Meilisearch JS client (peer dep) | Official Meilisearch JS client. Installed as peer dependency alongside nestjs-meilisearch. |

**Why Meilisearch over Postgres full-text search:**

| Criterion | Postgres FTS (`fullTextSearchPostgres`) | Meilisearch |
|-----------|----------------------------------------|-------------|
| Status in Prisma | Preview feature (not GA for Postgres as of 2026) | External, no Prisma dependency |
| Typo tolerance | No | Yes (built-in) |
| Relevance ranking | Basic (ts_rank) | Advanced multi-factor |
| Search-as-you-type | Requires additional setup | Sub-100ms out of box |
| Infrastructure | Already running Postgres | One additional Docker container |
| Sync complexity | None (query directly) | Must sync data on write |

**For DevCollab specifically:** Users searching code snippets by language/tags, posts by title/content, and members by name need typo tolerance and instant results. Postgres FTS would require GIN indexes and manual ranking — more work for worse UX. Meilisearch delivers better search experience with minimal code.

**Docker compose addition:**
```yaml
# Add to docker-compose.dev.yml
meilisearch:
  image: getmeili/meilisearch:latest
  container_name: devcollab-meilisearch
  ports:
    - '7700:7700'
  environment:
    MEILI_MASTER_KEY: ${MEILI_MASTER_KEY:-devmaster}
    MEILI_ENV: development
  volumes:
    - meilisearch_data:/meili_data
  networks:
    - teamflow-network
  healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost:7700/health']
    interval: 10s
    timeout: 5s
    retries: 5
```

**NestJS module configuration:**
```typescript
// apps/devcollab-api/src/app.module.ts
import { MeiliSearchModule } from 'nestjs-meilisearch';

@Module({
  imports: [
    MeiliSearchModule.forRoot({
      host: process.env.MEILI_HOST ?? 'http://meilisearch:7700',
      apiKey: process.env.MEILI_MASTER_KEY ?? 'devmaster',
    }),
  ],
})
export class AppModule {}

// In any service:
import { InjectMeiliSearch } from 'nestjs-meilisearch';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class SearchService {
  constructor(@InjectMeiliSearch() private meili: MeiliSearch) {}

  async indexSnippet(snippet: CodeSnippet) {
    const index = this.meili.index('snippets');
    await index.addDocuments([snippet]);
  }

  async search(query: string) {
    return this.meili.index('snippets').search(query, {
      attributesToHighlight: ['title', 'description'],
      limit: 20,
    });
  }
}
```

**Sync pattern:** Use NestJS `@nestjs/event-emitter` (already installed in `apps/api`) to trigger Meilisearch indexing when snippets/posts are created or updated. This keeps Postgres as source of truth and Meilisearch as the search replica.

---

### 5. Monorepo Additions — New Apps and Packages

**New Turborepo apps:**

| App | Path | Purpose | Notes |
|-----|------|---------|-------|
| devcollab-web | `apps/devcollab-web/` | Next.js 15 frontend for DevCollab | New app, mirrors `apps/web/` structure. Own NextAuth config, own app router. |
| devcollab-api | `apps/devcollab-api/` | NestJS 11 backend for DevCollab | New app, mirrors `apps/api/` structure. Own auth, own Prisma client instance. |

**Shared packages (reuse existing, extend as needed):**

| Package | Path | DevCollab Usage |
|---------|------|-----------------|
| @repo/database | `packages/database/` | Add DevCollab Prisma models to `schema.prisma`. Use the SAME Prisma client — one database, separate model namespaces. |
| @repo/shared | `packages/shared/` | Add shared DevCollab types/Zod schemas used by both devcollab-web and devcollab-api. |
| @repo/config | `packages/config/` | Reuse existing ESLint, TypeScript configs. |

**Why one schema.prisma (not two):** Prisma recommends a single schema per database. Both TeamFlow and DevCollab share the same Postgres instance (separate tables, same DB). If schemas diverge significantly later, evaluate splitting to separate databases — but that adds operational overhead for a portfolio project.

**Turborepo task additions (turbo.json):** The existing `build`, `dev`, and `lint` tasks already cover all apps via `apps/*` glob — no turbo.json changes needed.

**Port allocation:**

| Service | Port | App |
|---------|------|-----|
| Next.js (TeamFlow) | 3000 | apps/web |
| NestJS (TeamFlow) | 4000 | apps/api |
| Next.js (DevCollab) | 3001 | apps/devcollab-web |
| NestJS (DevCollab) | 4001 | apps/devcollab-api |
| MinIO API | 9000 | Docker (dev) |
| MinIO Console | 9001 | Docker (dev) |
| Meilisearch | 7700 | Docker (dev) |

**Scaffold commands:**
```bash
# From monorepo root
# Create devcollab-web
cp -r apps/web apps/devcollab-web
# Then update: package.json name, next.config.js port, auth config

# Create devcollab-api
cp -r apps/api apps/devcollab-api
# Then update: package.json name, main.ts port (4001), env vars

# Install new libraries in devcollab-web
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-code-block-lowlight lowlight \
  shiki react-markdown rehype-pretty-code \
  --workspace=apps/devcollab-web

# Install new libraries in devcollab-api
npm install nestjs-meilisearch meilisearch \
  @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/lib-storage \
  multer-s3 \
  --workspace=apps/devcollab-api

npm install -D @types/multer \
  --workspace=apps/devcollab-api
```

---

### 6. NestJS Modules and Prisma Schema for DevCollab

**New NestJS modules needed in `apps/devcollab-api`:**

| Module | Purpose | Key Dependencies |
|--------|---------|------------------|
| WorkspaceModule | Workspace CRUD, membership management | Prisma, CASL |
| AuthModule | DevCollab-specific JWT auth (own secret, own token) | @nestjs/jwt, passport-jwt, bcrypt |
| SnippetsModule | Code snippet CRUD, language tagging | Prisma, StorageModule (for file attachments) |
| PostsModule | Markdown post CRUD, publishing | Prisma |
| DiscussionsModule | Threaded discussions on snippets/posts | Prisma, Socket.io Gateway |
| ActivityFeedModule | Activity events aggregation | Prisma, EventEmitter |
| MentionsModule | @user mention parsing and notifications | Prisma, EventEmitter, Socket.io |
| SearchModule | Meilisearch indexing and query API | nestjs-meilisearch |
| StorageModule | S3/R2 pre-signed URL generation | @aws-sdk/client-s3 |
| NotificationsGateway | WebSocket for real-time mentions/activity | @nestjs/websockets, Socket.io |

**DevCollab RBAC roles (separate from TeamFlow):**

```typescript
// packages/shared/src/devcollab-roles.ts
export enum DevCollabRole {
  ADMIN = 'ADMIN',        // Can manage workspace, members, all content
  CONTRIBUTOR = 'CONTRIBUTOR', // Can create/edit own snippets/posts, comment
  VIEWER = 'VIEWER',      // Read-only access
}
```

**Prisma schema additions to `packages/database/prisma/schema.prisma`:**

```prisma
// =================== DEVCOLLAB MODELS ===================

enum DevCollabRole {
  ADMIN
  CONTRIBUTOR
  VIEWER
}

enum SnippetVisibility {
  PUBLIC
  WORKSPACE
  PRIVATE
}

model Workspace {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members     WorkspaceMember[]
  snippets    Snippet[]
  posts       Post[]
  activities  ActivityEvent[]

  @@index([slug])
}

model WorkspaceMember {
  id          String        @id @default(cuid())
  role        DevCollabRole @default(VIEWER)
  userId      String
  workspaceId String
  joinedAt    DateTime      @default(now())

  user      User      @relation("DevCollabMemberships", fields: [userId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
  @@index([userId])
  @@index([workspaceId])
}

model Snippet {
  id          String             @id @default(cuid())
  title       String
  description String?            @db.Text
  content     String             @db.Text  // Raw code
  language    String             // e.g., "typescript", "python"
  visibility  SnippetVisibility  @default(WORKSPACE)
  authorId    String
  workspaceId String
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  author      User              @relation("SnippetAuthor", fields: [authorId], references: [id])
  workspace   Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  tags        SnippetTag[]
  discussions Discussion[]
  attachments FileAttachment[]

  @@index([authorId])
  @@index([workspaceId])
  @@index([language])
  @@index([createdAt])
}

model SnippetTag {
  id        String  @id @default(cuid())
  name      String
  snippetId String

  snippet Snippet @relation(fields: [snippetId], references: [id], onDelete: Cascade)

  @@unique([snippetId, name])
  @@index([name])
}

model Post {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text  // Markdown / Tiptap JSON
  published   Boolean  @default(false)
  authorId    String
  workspaceId String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  author      User         @relation("PostAuthor", fields: [authorId], references: [id])
  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  discussions Discussion[]

  @@index([authorId])
  @@index([workspaceId])
  @@index([published])
  @@index([createdAt])
}

model Discussion {
  id        String    @id @default(cuid())
  content   String    @db.Text
  authorId  String
  parentId  String?   // For threading: null = top-level, set = reply
  snippetId String?
  postId    String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  author   User        @relation("DiscussionAuthor", fields: [authorId], references: [id])
  parent   Discussion? @relation("DiscussionThread", fields: [parentId], references: [id])
  replies  Discussion[] @relation("DiscussionThread")
  snippet  Snippet?    @relation(fields: [snippetId], references: [id], onDelete: Cascade)
  post     Post?       @relation(fields: [postId], references: [id], onDelete: Cascade)
  mentions Mention[]

  @@index([authorId])
  @@index([snippetId])
  @@index([postId])
  @@index([parentId])
  @@index([createdAt])
}

model Mention {
  id           String   @id @default(cuid())
  mentionedId  String   // User being mentioned
  discussionId String
  read         Boolean  @default(false)
  createdAt    DateTime @default(now())

  mentioned  User       @relation("Mentioned", fields: [mentionedId], references: [id], onDelete: Cascade)
  discussion Discussion @relation(fields: [discussionId], references: [id], onDelete: Cascade)

  @@index([mentionedId])
  @@index([discussionId])
  @@index([read])
}

model ActivityEvent {
  id          String   @id @default(cuid())
  type        String   // snippet.created, post.published, discussion.replied, etc.
  actorId     String
  workspaceId String
  entityType  String   // Snippet, Post, Discussion
  entityId    String
  metadata    Json?    // Extra context (title, preview, etc.)
  createdAt   DateTime @default(now())

  actor     User      @relation("ActivityActor", fields: [actorId], references: [id])
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@index([actorId])
  @@index([createdAt])
  @@index([workspaceId, createdAt])
}

model FileAttachment {
  id        String   @id @default(cuid())
  filename  String
  storageKey String  // S3/R2 object key
  mimeType  String
  sizeBytes Int
  snippetId String?
  uploaderId String
  createdAt DateTime @default(now())

  snippet  Snippet? @relation(fields: [snippetId], references: [id], onDelete: SetNull)
  uploader User     @relation("FileUploader", fields: [uploaderId], references: [id])

  @@index([snippetId])
  @@index([uploaderId])
}
```

**User model additions needed** (add relations to existing `User` model in schema.prisma):
```prisma
// Add to existing User model:
devCollabMemberships WorkspaceMember[] @relation("DevCollabMemberships")
snippets             Snippet[]         @relation("SnippetAuthor")
posts                Post[]            @relation("PostAuthor")
discussions          Discussion[]      @relation("DiscussionAuthor")
mentions             Mention[]         @relation("Mentioned")
activityEvents       ActivityEvent[]   @relation("ActivityActor")
fileUploads          FileAttachment[]  @relation("FileUploader")
```

---

### DevCollab Installation Commands

```bash
# From monorepo root — install in devcollab-web
npm install \
  @tiptap/react@^3.19.0 \
  @tiptap/pm@^3.19.0 \
  @tiptap/starter-kit@^3.19.0 \
  @tiptap/extension-code-block-lowlight@^3.0.0 \
  lowlight@^3.0.0 \
  shiki@^3.22.0 \
  react-markdown@^10.1.0 \
  rehype-pretty-code@^0.14.0 \
  --workspace=apps/devcollab-web

# From monorepo root — install in devcollab-api
npm install \
  nestjs-meilisearch@^3.0.0 \
  meilisearch@latest \
  @aws-sdk/client-s3@^3.991.0 \
  @aws-sdk/s3-request-presigner@^3.991.0 \
  @aws-sdk/lib-storage@^3.991.0 \
  multer-s3@^3.0.1 \
  --workspace=apps/devcollab-api

npm install -D @types/multer --workspace=apps/devcollab-api

# Generate updated Prisma client (after schema.prisma changes)
npx prisma generate --schema=packages/database/prisma/schema.prisma

# Create Meilisearch indexes (run once after first start)
# POST http://localhost:7700/indexes with body: { "uid": "snippets", "primaryKey": "id" }
# POST http://localhost:7700/indexes with body: { "uid": "posts", "primaryKey": "id" }
```

---

### DevCollab Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative | Confidence |
|----------|-------------|-------------|---------------------|------------|
| Rich Text Editor | Tiptap v3 | Lexical (Meta) | Lexical is excellent but less mature, fewer ready-made extensions. Tiptap has broader ecosystem and ProseMirror battle-tested stability. | MEDIUM |
| Rich Text Editor | Tiptap v3 | Quill v2 | Quill is unmaintained (v2 arrived late 2023, no active development). Security concerns, no React 19 support path. | HIGH |
| Rich Text Editor | Tiptap v3 | TinyMCE | TinyMCE requires commercial license for cloud. Self-hosted is complex. Tiptap is simpler for developer-facing portfolio. | HIGH |
| Syntax Highlighting | Shiki v3 | react-syntax-highlighter | Bundles Prism/highlight.js on client. 400KB+ bundle hit. No RSC support. Shiki ships zero JS to client. | HIGH |
| Syntax Highlighting | Shiki v3 | Prism.js | Client-side only, requires DOM manipulation. Does not work in RSC. | HIGH |
| Search | Meilisearch | Postgres FTS (`fullTextSearchPostgres`) | Still in Preview for Postgres in Prisma (not GA). No typo tolerance. Requires GIN indexes and manual ranking. Worse search UX. | HIGH |
| Search | Meilisearch | Typesense | Both are excellent. Meilisearch has slightly better DX, more community tutorials for NestJS. Typesense is a valid alternative if Meilisearch proves difficult. | MEDIUM |
| Search | Meilisearch | Elasticsearch | Overkill for a portfolio project. High memory usage (1GB+ JVM). DevCollab's dataset is small. | HIGH |
| File Storage (prod) | Cloudflare R2 | AWS S3 | R2 has zero egress fees. S3 charges per GB downloaded. Same SDK. R2 is the obvious choice for cost when serving files via CDN. | HIGH |
| File Storage (dev) | MinIO Docker | Localstack | LocalStack emulates the full AWS stack (overkill). MinIO is purpose-built S3-compatible storage, simpler setup. | HIGH |
| File Storage (dev) | MinIO Docker | Filesystem (local disk) | Filesystem storage diverges from production behavior. MinIO ensures dev/prod parity with S3 API. | HIGH |

---

### DevCollab What NOT to Use

| Avoid | Why | Use Instead | Confidence |
|-------|-----|-------------|------------|
| @tiptap-pro extensions (drag-handle) | Requires paid account + React 19 compatibility issues with tippyjs-react dependency | Free @tiptap/extension-drag-handle or omit | HIGH |
| react-syntax-highlighter | Ships Prism/highlight.js to client, 400KB+, no React Server Component support | shiki with codeToHtml() in RSC | HIGH |
| AWS S3 for production | Egress fees add up. DevCollab serves files publicly — every download costs money | Cloudflare R2 (zero egress) | HIGH |
| Elasticsearch | JVM dependency, 1GB+ memory, complex configuration. Portfolio project doesn't need this scale | Meilisearch | HIGH |
| Postgres FTS as primary search | Preview feature in Prisma for Postgres (not GA). No typo tolerance. Poor relevance for code search UX | Meilisearch | HIGH |
| Multer in-memory storage for large files | Files buffered entirely in Node.js heap before upload. Breaks on files >100MB, degrades server performance | multer-s3 streaming + pre-signed URLs | HIGH |
| Two separate Prisma schemas | Adds operational complexity (two migration histories, two clients). Use one schema.prisma for both apps. | Single packages/database/schema.prisma | MEDIUM |
| localStorage for Tiptap content | Content is lost on browser close, no collaboration or history. | Save to Postgres via NestJS API | HIGH |

---

### DevCollab Version Compatibility Matrix

| Package | Version | Compatible With | Critical Notes | Confidence |
|---------|---------|-----------------|----------------|------------|
| @tiptap/react | ^3.19.0 | React 19, Next.js 15 | Set `immediatelyRender: false`. Must be in `'use client'` component. | HIGH |
| @tiptap/pm | ^3.19.0 | @tiptap/react 3.x | Required peer dep. Must match @tiptap/react version. | HIGH |
| @tiptap/starter-kit | ^3.19.0 | @tiptap/react 3.x | Includes bold, italic, code, headings, lists. Check extensions included before adding duplicates. | HIGH |
| shiki | ^3.22.0 | Node.js 18+, React RSC | Works in Server Components. For client use, import from `shiki/bundle/web` (smaller bundle). | HIGH |
| react-markdown | ^10.1.0 | React 19 | v9.0.2 fixed React 19 types. v10 is current stable. | HIGH |
| rehype-pretty-code | ^0.14.x | shiki ^3.x | Requires shiki as peer dep. Installs via rehype plugin system. | MEDIUM |
| nestjs-meilisearch | ^3.0.0 | NestJS 11, Node.js 20+ | v3.0.0 dropped NestJS 10. Node 20+ required. Already on node:20 in Docker. | HIGH |
| meilisearch | ^0.49.x | Node.js 18+ | Installed as peer dep of nestjs-meilisearch. Official Meilisearch client. | HIGH |
| @aws-sdk/client-s3 | ^3.991.0 | Node.js 18+, R2, MinIO | R2 endpoint: `https://<account-id>.r2.cloudflarestorage.com`. MinIO: `http://minio:9000`. | HIGH |
| multer-s3 | ^3.0.1 | @aws-sdk/client-s3 v3 | v3.x uses AWS SDK v3. v2.x uses AWS SDK v2 (do not mix). | HIGH |

---

### DevCollab Sources

**HIGH Confidence — Official Documentation:**
- [Tiptap Next.js Installation](https://tiptap.dev/docs/editor/getting-started/install/nextjs) — `immediatelyRender: false` SSR fix, v3 packages
- [Tiptap 3.0 Stable Release](https://tiptap.dev/blog/release-notes/tiptap-3-0-is-stable) — Architecture changes, SSR improvements
- [Shiki Next.js Integration](https://shiki.style/packages/next) — v3.22.0 current, RSC usage patterns
- [AWS SDK v3 S3 Request Presigner](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-request-presigner/) — Pre-signed URL API
- [Cloudflare R2 S3 Compatibility](https://developers.cloudflare.com/r2/examples/) — R2 S3 API examples
- [Meilisearch Docker Guide](https://www.meilisearch.com/docs/guides/docker) — Official Docker setup
- [nestjs-meilisearch v3.0.0 Release](https://github.com/lambrohan/nestjs-meilisearch/releases) — NestJS 11 support confirmation

**MEDIUM Confidence — Verified Community Sources:**
- [react-markdown v10.1.0 Releases](https://github.com/remarkjs/react-markdown/releases) — React 19 compatibility in v9.0.2+
- [multer-s3 npm](https://www.npmjs.com/package/multer-s3) — v3.x AWS SDK v3 compatibility
- [Cloudflare R2 NestJS Integration](https://medium.com/@nurulislamrimon/cloudflare-r2-object-storage-functions-for-the-nestjs-in-one-shot-992225952fc8) — NestJS + R2 pattern (recent)
- [MinIO Docker Compose Setup](https://pliutau.com/local-minio-docker-compose-buckets/) — Bucket auto-creation pattern
- [Postgres FTS vs Meilisearch](https://medium.com/@simbatmotsi/postgres-full-text-search-vs-meilisearch-vs-elasticsearch-choosing-a-search-stack-that-scales-fcf17ef40a1b) — Dec 2025 comparison
- [Prisma fullTextSearchPostgres Preview Update](https://github.com/prisma/prisma/discussions/26136) — Confirms still in Preview for Postgres

---

*Stack research for: TeamFlow (Work Management SaaS) + DevCollab (Developer Collaboration Platform)*
*Researched: 2026-02-14 (TeamFlow core), 2026-02-16 (v1.1 Design System), 2026-02-17 (DevCollab additions)*
*Overall Confidence: HIGH — All DevCollab library versions verified against npm, GitHub releases, and official docs. React 19 and NestJS 11 compatibility confirmed for all new additions.*

---

## Matrix Portfolio Redesign — Animation Stack

**Focus:** Animation and visual effect libraries for Matrix-aesthetic portfolio redesign.
**Domain:** Next.js 15 App Router + React 19 + Tailwind v4 CSS-first
**Researched:** 2026-02-18
**Confidence:** HIGH (core animation libraries verified via official docs, npm registry, motion.dev changelog)

This section covers ONLY what is needed for new animation/visual features. Existing stack (Next.js 15.1, React 19.0, Tailwind v4.1.18, Radix UI, Shadcn UI, next-themes) is preserved unchanged.

---

### Critical Constraint: React 19 Peer Dependency

The project uses `react@^19.0.0` (confirmed in `apps/web/package.json`). This single constraint eliminates several animation library choices:

- `framer-motion` v11 and below: declares `peerDependencies: { react: "^18" }` — npm will error
- Any library not updated for React 19: will fail `npm install` or require `--legacy-peer-deps`

The correct package for Framer Motion features is now `motion` v12, which is the renamed, React 19-compatible rewrite. Same API, different package name.

---

### Core Animation Libraries (New Dependencies)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `motion` | `^12.4.0` | Declarative React animations: scroll reveals, hover states, page transitions, magnetic effects, cursor spring | v12 is the stable React 19-compatible rewrite of Framer Motion. Import via `motion/react`. React 19 test suite added to CI in v12.29.0 (Jan 2026), confirmed stable. Latest: v12.34.0 (Feb 9, 2026). ~85KB, tree-shakeable. No `--legacy-peer-deps` needed. |
| `gsap` | `^3.14.2` | Timeline-based animations, ScrollTrigger for parallax/scrubbing, SplitText for text reveals, magnetic button smoothing via `quickTo()` | 100% free since Webflow acquisition (v3.13+) — all plugins including SplitText, MorphSVG included. 23KB gzipped core. Framework-agnostic — bypasses React's diffing entirely, which is an advantage for high-frequency mouse events and scroll-linked position updates. v3.14.2 is latest stable (Dec 2025). |
| `@gsap/react` | `^2.1.1` | `useGSAP()` hook for React/Next.js integration | Provides `useGSAP()` which implements `useIsomorphicLayoutEffect` — SSR safe in Next.js App Router. Auto-cleans all GSAP instances, ScrollTriggers, and Draggables on unmount. Scopes GSAP selectors to component DOM tree via `scope: containerRef`. Required companion for GSAP in React. |
| `lenis` | `^1.2.3` | Smooth scroll feel (replaces browser default inertia) | Renamed from deprecated `@studio-freight/lenis`. Import via `lenis/react` for `ReactLenis` component. Tested with Next.js 15 + React 19. `autoRaf: true` handles rAF loop internally. Integrates with GSAP ScrollTrigger via `lenis.on('scroll', ScrollTrigger.update)`. |

### No Additional Libraries Needed (Use What's Already There)

| Effect | Approach | Rationale |
|--------|----------|-----------|
| Matrix digital rain | Custom `MatrixRain` component — Native Canvas API + `useRef` + `useEffect` | No npm library adds value. 100-line TypeScript component gives full control over color (`#00FF41`), character set (Katakana), density, and trail alpha. p5.js (9MB) and three.js (600KB) are way over-engineered for a 2D canvas effect. |
| Aurora gradient background | CSS `@keyframes` in Tailwind v4 `@theme` block | Zero JS. GPU composited via `opacity`. Already have `tailwindcss-animate` and `tw-animate-css` installed — use them. |
| Card hover glow | Tailwind CSS `hover:shadow-[0_0_20px_#00FF41]` + `transition-shadow` | Pure CSS, no library needed. For mouse-tracking spotlight: CSS custom properties (`--mouse-x`, `--mouse-y`) fed to `radial-gradient` on a `::before` pseudo-element. |
| Cursor glow | Single root-level `"use client"` component tracking `mousemove` | `motion` `useSpring` for cursor lag. Fixed-position `div` with `transform: translate()` (compositor-only). |

---

### Installation (Matrix Portfolio Milestone Only)

```bash
# Install in apps/web (the portfolio Next.js app)
npm install motion gsap @gsap/react lenis --workspace=apps/web
```

That is the complete installation. Four packages. No other animation libraries needed.

---

### Effect-by-Effect Implementation Patterns

**Matrix Digital Rain (canvas):**
```typescript
// components/effects/MatrixRain.tsx
"use client"
import { useRef, useEffect } from "react"

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    // Katakana + digits — authentic to the film
    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789"
    const fontSize = 14
    let columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(columns).fill(1)

    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      columns = Math.floor(canvas.width / fontSize)
      drops.length = columns
      drops.fill(1)
    })
    ro.observe(canvas)

    const draw = () => {
      // Trail fade — semi-transparent black
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${fontSize}px monospace`
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]
        // Head character: bright Matrix green
        ctx.fillStyle = i % 7 === 0 ? "#AAFFAA" : "#00FF41"
        ctx.fillText(char, i * fontSize, y * fontSize)
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }

    const interval = setInterval(draw, 50) // 20fps — enough for rain effect
    return () => {
      clearInterval(interval)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 w-full h-full opacity-20" />
}
```

**Scroll-Triggered Reveals (Motion useInView):**
```typescript
// components/effects/RevealOnScroll.tsx
"use client"
import { motion, useInView } from "motion/react"
import { useRef } from "react"

export function RevealOnScroll({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}
```

**Magnetic Button (GSAP quickTo):**
```typescript
// components/effects/MagneticButton.tsx
"use client"
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

export function MagneticButton({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const quickX = useRef<ReturnType<typeof gsap.quickTo>>()
  const quickY = useRef<ReturnType<typeof gsap.quickTo>>()

  useGSAP(() => {
    quickX.current = gsap.quickTo(containerRef.current, "x", { duration: 0.4, ease: "power3" })
    quickY.current = gsap.quickTo(containerRef.current, "y", { duration: 0.4, ease: "power3" })
  }, { scope: containerRef })

  const handleMouseMove = (e: React.MouseEvent) => {
    const { left, top, width, height } = containerRef.current!.getBoundingClientRect()
    const x = (e.clientX - left - width / 2) * 0.4
    const y = (e.clientY - top - height / 2) * 0.4
    quickX.current?.(x)
    quickY.current?.(y)
  }

  const handleMouseLeave = () => {
    quickX.current?.(0)
    quickY.current?.(0)
  }

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="inline-block">
      {children}
    </div>
  )
}
```

**GSAP ScrollTrigger Parallax:**
```typescript
// Must be "use client" — register plugins at module level, not inside component
"use client"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Inside component:
useGSAP(() => {
  gsap.to(".parallax-bg", {
    y: "-30%",
    ease: "none",
    scrollTrigger: {
      trigger: ".parallax-section",
      start: "top bottom",
      end: "bottom top",
      scrub: 1, // smooth scrub, not instant
    },
  })
  // IMPORTANT: call refresh after Next.js route change
  ScrollTrigger.refresh()
}, { scope: containerRef })
```

**Aurora Background (CSS only — no JS):**
```css
/* In apps/web/app/globals.css — inside @theme block */
@theme {
  --color-matrix: #00FF41;
  --color-matrix-dim: #00802B;
  --color-matrix-glow: rgba(0, 255, 65, 0.15);

  --animate-aurora: aurora 8s ease-in-out infinite alternate;

  @keyframes aurora {
    0%   { opacity: 0.4; transform: scale(1) rotate(0deg); }
    50%  { opacity: 0.7; transform: scale(1.05) rotate(2deg); }
    100% { opacity: 0.4; transform: scale(1) rotate(-2deg); }
  }
}

/* Usage in component (Tailwind class): animate-aurora */
/* Only animate opacity and transform — no layout properties */
```

**Lenis Smooth Scroll (Root Layout):**
```typescript
// app/SmoothScrollProvider.tsx
"use client"
import { ReactLenis } from "lenis/react"

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothTouch: false, autoRaf: true }}>
      {children}
    </ReactLenis>
  )
}

// app/layout.tsx (Server Component — wraps with client provider)
import { SmoothScrollProvider } from "./SmoothScrollProvider"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  )
}
```

---

### Alternatives Considered (Matrix Portfolio)

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `motion` v12 | `framer-motion` v11 | Peer dep declares `react@^18`. Errors with `react@19.0.0`. Same package, wrong version — v12 is the correct answer. |
| `motion` v12 | `react-spring` | No scroll-linked primitives, no timeline API. Redundant when GSAP covers DOM animation and Motion covers React component animation. |
| GSAP `ScrollTrigger` | CSS Scroll-Driven Animations API | Firefox 135 (Feb 2026) lacks full support. Interop 2026 targets it but it is not safe for a Lighthouse 90+ gated portfolio today. |
| GSAP `quickTo()` for magnetic | `motion` spring for magnetic | Motion springs are React state-based. For high-frequency mouse events, GSAP `quickTo()` directly manipulates DOM and is ~3x more responsive. |
| Native Canvas | `p5.js` | 9MB bundle — destroys Lighthouse score. Canvas API handles Matrix rain in <100 lines. |
| Native Canvas | `three.js` / WebGL | 600KB+, requires shader knowledge. No benefit over Canvas 2D for a character rain effect. |
| `lenis` | `@studio-freight/lenis` | Same library — old name, deprecated. Install `lenis` directly. |
| CSS `@keyframes` for aurora | `anime.js` for aurora | CSS runs on compositor thread. anime.js adds 7KB for zero benefit over CSS custom properties for a gradient opacity animation. |
| GSAP `SplitText` | `split-type` (npm) | GSAP SplitText is included free in `gsap@^3.13+`. `split-type` is a solid standalone, but adding a 7th library for something bundled is wasteful. |

---

### What NOT to Use (Matrix Portfolio)

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `framer-motion` (any v<=11) | React 19 peer dep conflict. Will fail `npm install` without `--legacy-peer-deps`. Don't use the flag — it masks real compatibility issues. | `motion` v12 — identical API, correct peer dep |
| `AOS` (Animate on Scroll) | Global CSS class injection conflicts with Tailwind v4 scoped CSS. Not SSR safe. Adds 15KB for what `useInView` from `motion` does in 10 lines. | `motion` `useInView` with `once: true` |
| `ScrollReveal.js` | Unmaintained for React 19. Assumes DOM access at module load — SSR crash without `dynamic()` guard. | GSAP ScrollTrigger or Motion `useInView` |
| `anime.js` alongside GSAP | Two animation engines competing for DOM control. Race conditions and unpredictable behavior when both animate the same elements. | GSAP exclusively for DOM animation |
| `react-parallax` / `react-rellax` | Both unmaintained (last commit 2022-2023). React 19 compatibility unverified. | GSAP ScrollTrigger with `scrub: true` |
| `p5.js` | 9MB — annihilates Lighthouse Performance score. Lighthouse gate is 90+. | Native Canvas 2D API |
| `three.js` for Matrix rain | 600KB minimum. WebGL overkill for a 2D character animation. | Native Canvas 2D API |
| `gsap.to()` in bare `useEffect` | GSAP instances leak on unmount. ScrollTrigger listeners stack across route changes causing memory leaks visible only after 2+ navigations. | Always use `useGSAP(() => { ... }, { scope: ref })` from `@gsap/react` |
| `will-change: transform` on all elements | Each compositing layer costs ~60MB GPU RAM. Over-promoting degrades mobile performance and can trigger Lighthouse warnings. | Apply only to actively animating elements, remove after |
| Any shade of purple / violet / indigo | Project constraint. No exceptions. | Matrix green `#00FF41` for glow accents. `#00B4D8` teal for secondary accents if needed. |

---

### SSR / Hydration Compatibility (Matrix Portfolio Effects)

| Effect | SSR Safe? | Correct Strategy |
|--------|-----------|-----------------|
| Matrix canvas rain | No | `"use client"` + `useEffect`. Use `dynamic(() => import('./MatrixRain'), { ssr: false })` when importing from RSC parent. |
| Motion scroll reveals | Partial | Motion components need `"use client"`. Server renders initial state. No hydration mismatch if initial opacity:0 matches server render. |
| GSAP ScrollTrigger | No | Always inside `useGSAP()` in a `"use client"` component. Server render is static HTML; GSAP enhances on client. |
| Lenis smooth scroll | No | `ReactLenis` is a client component. Thin `SmoothScrollProvider` wrapper with `"use client"`. |
| CSS aurora animations | Yes | Pure CSS via `@theme` `@keyframes`. Works in Server Components, RSC, anywhere. Zero JS. |
| CSS card glow hover | Yes | Pure CSS `hover:shadow-*` via Tailwind. Works everywhere. |
| JS cursor glow tracking | No | `mousemove` listener — client only. Single root-level `"use client"` component that updates CSS custom properties. |
| Magnetic buttons (GSAP) | No | `mousemove` + GSAP `quickTo` — client only. `"use client"` wrapper component. |

---

### Version Compatibility (Matrix Portfolio Additions)

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `motion@^12.4.0` | `react@^19.0.0` | React 19 test suite in CI since v12.29.0. Stable. No flags needed. |
| `motion@^12.4.0` | `next@^15.1.0` | Use `motion/react` import. For `next/dynamic` with SSR false, use `motion/react-client`. |
| `gsap@^3.14.2` | `react@^19.0.0` | Framework-agnostic. No React peer dep declared. Works with any React version. |
| `@gsap/react@^2.1.1` | `react@^19.0.0` | Hooks package. `useIsomorphicLayoutEffect` pattern is SSR safe. |
| `lenis@^1.2.3` | `next@^15.1.0` + `react@^19.0.0` | Tested with Next.js 15 + React 19. Import `lenis/react`. |
| `gsap` + `lenis` | Integration required | `lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker.lagSmoothing(0)` |
| `motion` + `gsap` | Can coexist | Motion animates React component state/style props. GSAP animates DOM directly. No collision if not animating the same property on the same element. |
| `tailwindcss@^4.1.18` | `motion@^12` | No conflict — Motion uses inline styles; Tailwind uses class-based styles. |

---

### Sources (Matrix Portfolio)

| Source | Confidence | What Was Verified |
|--------|------------|-------------------|
| [motion.dev/changelog](https://motion.dev/changelog) | HIGH | v12.34.0 latest (Feb 9, 2026); React 19 CI suite added in v12.29.0 |
| [gsap.com/resources/React/](https://gsap.com/resources/React/) | HIGH | v3.14.1 confirmed current; `useGSAP` hook pattern; Next.js `"use client"` requirement |
| [gsap.com/pricing/](https://gsap.com/pricing/) | HIGH | 100% free confirmed including SplitText, MorphSVG since v3.13 |
| [npmjs.com/package/lenis](https://www.npmjs.com/package/lenis) | HIGH | Package renamed from `@studio-freight/lenis`; v1.2.3 Next.js 15 + React 19 tested |
| Project `apps/web/package.json` | HIGH | `react@^19.0.0`, `next@^15.1.0` confirmed from source |
| [github.com/motiondivision/motion discussions #3184](https://github.com/motiondivision/motion/discussions/3184) | HIGH | `motion/react` import path confirmed for Next.js App Router |
| [css-tricks.com/interop-2026](https://css-tricks.com/interop-2026/) | HIGH | Firefox CSS Scroll-Driven Animations gap confirmed, targeted in Interop 2026 |
| [blog.olivierlarose.com/tutorials/magnetic-button](https://blog.olivierlarose.com/tutorials/magnetic-button) | MEDIUM | GSAP `quickTo()` pattern for magnetic buttons verified against GSAP docs |
| [medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15](https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232) | MEDIUM | `ScrollTrigger.refresh()` after route change, `useGSAP` cleanup patterns |
| GSAP GitHub releases | HIGH | v3.14.2 latest confirmed |

---

*Matrix Portfolio animation stack research completed 2026-02-18.*
*Existing TeamFlow + DevCollab stack sections above are preserved and unchanged.*

---

## v3.0: Coolify Deployment + DevCollab UI Tech Debt

**Focus:** Coolify-specific deployment configuration and Next.js/NestJS patterns for closing v3.0 gaps.
**Researched:** 2026-02-19
**Confidence:** HIGH (Coolify patterns), HIGH (Next.js middleware/Prisma fixes)

This section covers ONLY what is new for milestone v3.0. No new npm packages are required. All changes are configuration, environment variable structure, and small code patterns.

---

### 1. Coolify Deployment — Architecture Decision

**Recommendation: Single Docker Compose resource in Coolify (not four separate services)**

The existing CI/CD (`deploy.yml`) builds and pushes four images to GHCR:
- `ghcr.io/<owner>/fernandomillan/web:latest`
- `ghcr.io/<owner>/fernandomillan/api:latest`
- `ghcr.io/<owner>/fernandomillan/devcollab-web:latest`
- `ghcr.io/<owner>/fernandomillan/devcollab-api:latest`

**Why one Docker Compose resource, not four individual Docker Image resources:**

Coolify's "Docker Image" resource type is designed for single-container workloads. Deploying four containers this way requires four resources, four domain configurations, four separate environment variable sets, and — critically — four separate Coolify-managed networks that cannot communicate without the buggy "Connect to Predefined Network" option.

Using a single `docker-compose.coolify.yml` resource:
- All services share one Coolify-managed network automatically
- `devcollab-web` reaches `devcollab-api` at `http://devcollab-api:3003` (internal Docker DNS)
- `devcollab-api` reaches `devcollab-postgres` at `http://devcollab-postgres:5432` (internal Docker DNS)
- One webhook triggers a coordinated redeploy of all services
- Environment variables managed in one place

**Coolify deployment flow:**
1. GitHub Actions builds + pushes 4 images to GHCR on push to `main`
2. GitHub Actions sends POST to Coolify webhook URL
3. Coolify pulls updated images and restarts containers from `docker-compose.coolify.yml`

---

### 2. Coolify Docker Compose Configuration

**Create `docker-compose.coolify.yml` at repo root.** This is a separate file from `docker-compose.yml` (which is for local dev). The Coolify file references GHCR pre-built images instead of building.

```yaml
# docker-compose.coolify.yml
# Used exclusively by Coolify. References pre-built GHCR images.
# Do not use for local development — use docker-compose.yml instead.

services:
  devcollab-postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DEVCOLLAB_POSTGRES_USER}
      POSTGRES_PASSWORD: ${DEVCOLLAB_POSTGRES_PASSWORD}
      POSTGRES_DB: ${DEVCOLLAB_POSTGRES_DB}
    volumes:
      - devcollab-pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DEVCOLLAB_POSTGRES_USER}']
      interval: 10s
      timeout: 5s
      retries: 5

  devcollab-migrate:
    image: ghcr.io/${GITHUB_REPOSITORY}/devcollab-api:latest
    # Override the default CMD to run migrations instead of starting the server
    command: ["node", "-e", "require('./dist/migrate.js')"]
    depends_on:
      devcollab-postgres:
        condition: service_healthy
    environment:
      DEVCOLLAB_DATABASE_URL: postgresql://${DEVCOLLAB_POSTGRES_USER}:${DEVCOLLAB_POSTGRES_PASSWORD}@devcollab-postgres:5432/${DEVCOLLAB_POSTGRES_DB}
    # exclude_from_hc: true tells Coolify not to health-check this one-shot container
    labels:
      - coolify.exclude_from_hc=true

  devcollab-api:
    image: ghcr.io/${GITHUB_REPOSITORY}/devcollab-api:latest
    restart: unless-stopped
    depends_on:
      devcollab-migrate:
        condition: service_completed_successfully
    environment:
      NODE_ENV: production
      PORT: 3003
      DEVCOLLAB_DATABASE_URL: postgresql://${DEVCOLLAB_POSTGRES_USER}:${DEVCOLLAB_POSTGRES_PASSWORD}@devcollab-postgres:5432/${DEVCOLLAB_POSTGRES_DB}
      DEVCOLLAB_JWT_SECRET: ${DEVCOLLAB_JWT_SECRET}
      DEVCOLLAB_WEB_URL: ${DEVCOLLAB_WEB_URL}
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3003/health']
      interval: 15s
      timeout: 5s
      retries: 5

  devcollab-web:
    image: ghcr.io/${GITHUB_REPOSITORY}/devcollab-web:latest
    restart: unless-stopped
    depends_on:
      devcollab-api:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3002
      HOSTNAME: 0.0.0.0
      NEXT_PUBLIC_API_URL: ${DEVCOLLAB_API_PUBLIC_URL}
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3002']
      interval: 15s
      timeout: 5s
      retries: 5

volumes:
  devcollab-pgdata:
```

**Key decisions in this compose file:**

| Decision | Reason |
|----------|--------|
| No `networks:` block | Coolify creates and manages the network automatically for each Docker Compose resource. Adding a custom network overrides this and breaks Traefik integration. |
| No `ports:` on internal services | `devcollab-postgres` and `devcollab-api` do not need host port bindings. Traefik routes external traffic to `devcollab-web` via domain. Internal service-to-service uses Docker DNS. |
| No `container_name:` | Coolify appends its UUID to container names to avoid collisions. Setting explicit container names breaks Coolify's multi-deployment management. |
| `${GITHUB_REPOSITORY}` variable | Coolify substitutes env vars in the compose file. Set `GITHUB_REPOSITORY=fernandomillan/fernandomillan` (or repo owner/name) in Coolify's environment variable UI. |

---

### 3. Coolify Environment Variables

**How Coolify env vars work with Docker Compose:**
- Coolify detects `${VAR_NAME}` and `${VAR_NAME:-default}` syntax in the compose file
- These appear as editable fields in the Coolify UI
- Values are injected at deploy time — they never appear in source code or the compose file itself
- Coolify supports marking variables as "Secret" (encrypted at rest, masked in logs)

**Required environment variables to set in Coolify UI:**

| Variable | Value | Secret? | Notes |
|----------|-------|---------|-------|
| `GITHUB_REPOSITORY` | `fernandomillan/fernandomillan` | No | Constructs GHCR image pull paths |
| `DEVCOLLAB_POSTGRES_USER` | `devcollab` | No | PostgreSQL username |
| `DEVCOLLAB_POSTGRES_PASSWORD` | `<strong password>` | YES | PostgreSQL password |
| `DEVCOLLAB_POSTGRES_DB` | `devcollab` | No | PostgreSQL database name |
| `DEVCOLLAB_JWT_SECRET` | `<min 32 char random string>` | YES | JWT signing secret for custom auth |
| `DEVCOLLAB_WEB_URL` | `https://devcollab.fernandomillan.dev` | No | CORS origin for the API. Must match the domain assigned to devcollab-web in Coolify |
| `DEVCOLLAB_API_PUBLIC_URL` | `https://api.devcollab.fernandomillan.dev` | No | URL the browser uses to reach the API. Passed as `NEXT_PUBLIC_API_URL` to Next.js |

**Coolify built-in variables (auto-set, no action needed):**

| Variable | What It Is |
|----------|-----------|
| `COOLIFY_FQDN` | Fully qualified domain name assigned in Coolify UI |
| `PORT` | Defaults to first exposed port if not set |
| `HOST` | Defaults to `0.0.0.0` if not set |

---

### 4. Coolify Domain Assignment and HTTPS

**Traefik handles all routing and Let's Encrypt certificates automatically.**

Domain assignment per service in Coolify:
- `devcollab-web` gets assigned domain: `devcollab.fernandomillan.dev` (port 3002 internally)
- `devcollab-api` gets assigned domain: `api.devcollab.fernandomillan.dev` (port 3003 internally)
- `devcollab-postgres` gets NO domain (internal only)

**How Traefik discovers services:**
Coolify adds Traefik labels to containers automatically based on the domain you set in the UI. You do NOT need to add `traefik.*` labels manually unless using "Raw Compose Deployment" mode (do not use that mode — it strips Coolify automation).

**HTTPS requirement for CORS:**
The NestJS API's CORS configuration uses `DEVCOLLAB_WEB_URL`:
```typescript
app.enableCors({
  origin: process.env.DEVCOLLAB_WEB_URL || 'http://localhost:3002',
  credentials: true,
});
```
In production, `DEVCOLLAB_WEB_URL` must be `https://devcollab.fernandomillan.dev` (exact match, no trailing slash). The `credentials: true` setting requires the origin to match exactly — wildcard `*` cannot be used with credentials.

---

### 5. GHCR Authentication for Coolify

**Pattern: SSH into Coolify server and `docker login` to GHCR once.**

```bash
# On the Coolify host server (SSH access required)
echo "<GITHUB_PAT>" | docker login ghcr.io -u <github_username> --password-stdin
```

Coolify reads Docker's credential store (`~/.docker/config.json`) automatically. All subsequent pulls from `ghcr.io` are authenticated without any Coolify-specific configuration.

**GitHub PAT requirements:**
- Scope: `read:packages` only (pull images)
- The PAT used in `docker login` on the server is separate from `GITHUB_TOKEN` used in GitHub Actions
- Store the PAT securely — if it expires, pulls fail silently with "unauthorized" errors

**Trigger redeployment from GitHub Actions:**
The existing `deploy.yml` sends a webhook:
```yaml
- name: Trigger Coolify deployment
  uses: fjogeleit/http-request-action@v1
  with:
    url: ${{ secrets.COOLIFY_WEBHOOK_URL }}
    method: 'POST'
```
`COOLIFY_WEBHOOK_URL` is the webhook URL from Coolify's resource settings (Settings > Webhook). This triggers Coolify to pull latest images and restart.

**No `COOLIFY_TOKEN` needed for this pattern** — the webhook URL itself is the auth mechanism. Generate it in Coolify: resource > Settings > Webhook tab.

---

### 6. Health Checks in Coolify

**Traefik will only route traffic to healthy containers.** If health checks fail, Traefik returns 404 / "No available server."

The existing health checks in `docker-compose.yml` carry over to `docker-compose.coolify.yml` unchanged:

```yaml
# devcollab-api (NestJS has /health endpoint via @nestjs/terminus or manual controller)
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:3003/health']
  interval: 15s
  timeout: 5s
  retries: 5

# devcollab-web (Next.js — curl root path)
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:3002']
  interval: 15s
  timeout: 5s
  retries: 5
```

**Requirements:**
- Both Dockerfiles already install `curl` via `apk add --no-cache libc6-compat curl` — health checks will work
- NestJS must respond at `GET /health` with HTTP 200. The existing `health.controller.ts` confirms this endpoint exists
- Interval set to 15s (not 10s) in Coolify — gives containers more startup time before first check

**Startup ordering:**
```
devcollab-postgres (healthy) → devcollab-migrate (completed) → devcollab-api (healthy) → devcollab-web (starts)
```
This `depends_on` chain prevents the API from starting before migrations run.

---

### 7. Next.js Standalone Output — Static File Serving (resume.pdf)

**No npm package needed. This is a Dockerfile copy pattern.**

Next.js standalone output does NOT automatically copy the `public/` folder. The existing `devcollab-web/Dockerfile` already copies it:

```dockerfile
COPY --from=builder --chown=nextjs:nextjs /app/apps/devcollab-web/public ./apps/devcollab-web/public 2>/dev/null || true
```

The `|| true` at the end means if `public/` doesn't exist, the build continues. This is correct behavior but means if `public/resume.pdf` exists during build, it gets copied. If not, it silently skips.

**Action required:** Place `resume.pdf` in `apps/devcollab-web/public/resume.pdf`. It will be served at `https://devcollab.fernandomillan.dev/resume.pdf` automatically by `server.js`.

**Verification pattern (after confirming public/ copy in Dockerfile):**
```bash
# Test that the file is accessible in the built container
docker run --rm -p 3002:3002 ghcr.io/<owner>/fernandomillan/devcollab-web:latest node apps/devcollab-web/server.js &
curl -I http://localhost:3002/resume.pdf
# Expect: HTTP/1.1 200 OK, Content-Type: application/pdf
```

---

### 8. Next.js Auth Redirect Guard for /dashboard

**No npm package needed. Uses Next.js built-in middleware.**

The current `apps/devcollab-web/app/dashboard/page.tsx` is a `'use client'` component with no server-side auth check. The `/dashboard` route is accessible without authentication.

**Pattern: Next.js `middleware.ts` (file name, not `proxy.ts`)**

Note: The Next.js docs show `middleware.ts` being renamed to `proxy.ts` — but this is a canary/v16 change documented as of v16.0.0. The installed version is `^15.0.0` (resolved to 15.5.12 at runtime). Use `middleware.ts` for stability; check if the installed version actually uses `proxy.ts` before renaming.

```typescript
// apps/devcollab-web/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('devcollab_token');

  if (!token) {
    const loginUrl = new URL('/', request.url); // redirect to homepage/login
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

**Why this pattern:**
- `devcollab_token` is the httpOnly cookie set by the NestJS auth endpoint (already used in the app — `credentials: 'include'` fetch calls throughout the code)
- No JWT verification in middleware — edge runtime has no access to the Prisma database or NestJS service. The cookie presence check is sufficient as a first-pass guard; the NestJS API validates the JWT on every API call
- The `matcher` limits the middleware to `/dashboard` and its sub-routes only — no performance overhead on other pages
- `redirect` query param allows the login page to redirect back after auth

**Limitation (LOW confidence area):** If `devcollab_token` cookie has a custom name set by NestJS, verify it matches. Check `apps/devcollab-api/src/auth/auth.service.ts` for the exact cookie name used in `Set-Cookie`.

---

### 9. Prisma Import Fix — reactions.service.ts

**No npm package needed. One-line import change.**

Current code in `apps/devcollab-api/src/reactions/reactions.service.ts`:
```typescript
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
```

**Problem:** `@prisma/client/runtime/library` is a private, internal module. Prisma does not guarantee its stability across minor or patch versions. This is documented as a known antipattern in Prisma's GitHub discussions.

**Fix:**
```typescript
import { Prisma } from '@devcollab/database';
// Then use: Prisma.PrismaClientKnownRequestError
```

Or, since the `PrismaService` imports from `@devcollab/database`, and `@devcollab/database` re-exports from `@prisma/client`:
```typescript
import { Prisma } from '@prisma/client';
// Then use: Prisma.PrismaClientKnownRequestError
```

**In context:**
```typescript
// Before
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
// ...
if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {

// After
import { Prisma } from '@prisma/client';
// ...
if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
```

This is the pattern recommended in Prisma's official documentation and public GitHub discussions. `Prisma.PrismaClientKnownRequestError` is a public API with semver guarantees.

**Confidence:** HIGH — Verified against Prisma GitHub discussions and official documentation.

---

### 10. Invite Link UI and Member Management UI

**No npm packages needed.** The NestJS endpoints already exist. The UI work is React component authoring using what's already installed.

**Existing NestJS endpoints (confirmed from `workspaces.controller.ts`):**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `POST /workspaces/:slug/invite-links` | POST | Admin only (CASL: `create InviteLink`) | Generate a time-limited invite token, returns `{ token, expiresAt }` |
| `POST /workspaces/join` | POST | Any authenticated user | Accept invite token, join workspace |
| `GET /workspaces/:slug/members` | GET | Any workspace member (CASL: `read WorkspaceMember`) | List all members with roles |
| `PATCH /workspaces/:slug/members/:userId/role` | PATCH | Admin only (CASL: `update WorkspaceMember`) | Promote/demote member role |
| `DELETE /workspaces/:slug/members/:userId` | DELETE | Admin only (CASL: `delete WorkspaceMember`) | Remove member from workspace |

**UI pattern for invite link generation (Next.js client component):**
```typescript
// Pattern: fetch to NEXT_PUBLIC_API_URL, credentials: 'include'
// No special library needed — plain fetch with the existing cookie auth
async function generateInviteLink(slug: string) {
  const res = await fetch(`${API_URL}/workspaces/${slug}/invite-links`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  // data.token — display this as ?token=<value> appended to /join page URL
  return `${window.location.origin}/join?token=${data.token}`;
}
```

**UI pattern for member management:**
```typescript
// List members
const members = await fetch(`${API_URL}/workspaces/${slug}/members`, {
  credentials: 'include',
}).then(r => r.json());

// Promote/demote member
await fetch(`${API_URL}/workspaces/${slug}/members/${userId}/role`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ role: 'ADMIN' }), // or 'CONTRIBUTOR', 'VIEWER'
});

// Remove member
await fetch(`${API_URL}/workspaces/${slug}/members/${userId}`, {
  method: 'DELETE',
  credentials: 'include',
});
```

**Role check pattern for conditional UI rendering:**
The current `dashboard/page.tsx` already fetches workspaces. Member data includes `{ role, userId }` per member. To determine if the current user is ADMIN, compare `currentUserId` against the members list. `currentUserId` is available by calling `GET /auth/me` or reading from a cookie/local state after login.

---

### What NOT to Add (v3.0)

| Avoid | Why |
|-------|-----|
| Traefik labels in docker-compose.coolify.yml | Coolify manages Traefik labels via its UI domain assignment. Manually adding labels conflicts with Coolify's automation. Only needed for "Raw Compose Deployment" mode (do not use). |
| Coolify `Service Stack` resource type | Service stacks are for stateful Coolify-managed services (databases, Redis). Use Docker Compose build pack for our custom application stack. |
| `NEXT_PUBLIC_API_URL` baked into the Docker image at build time | Next.js `NEXT_PUBLIC_*` vars are embedded at build time, not runtime. The existing Dockerfile does not pass this variable at build — it's set as a runtime env var, which is correct for standalone output (`server.js` reads process.env at runtime for non-NEXT_PUBLIC_ vars). NEXT_PUBLIC_ vars ARE embedded at build — see note below. |
| Separate Coolify resources for each of the 4 Docker images | Four resources = four networks = no internal DNS between services. One Docker Compose resource keeps all services on one network. |
| Docker Swarm mode | Portfolio project, single server. Swarm adds complexity with zero benefit. |
| Multiple Coolify webhook secrets per service | One webhook per Docker Compose resource. One secret in GitHub Actions. Simpler. |

**NEXT_PUBLIC_ caveat (MEDIUM confidence):** `NEXT_PUBLIC_API_URL` is embedded at build time by Next.js. If the production URL isn't known at build time, use a runtime substitution pattern (window.__ENV__ or API route returning config). However, since `ghcr.io` images are built before the domain is configured in Coolify, `NEXT_PUBLIC_API_URL` defaults to `http://localhost:3003` unless passed as a build arg. Check `apps/devcollab-web/next.config.*` and the Dockerfile build args — if `NEXT_PUBLIC_API_URL` is not a build arg, the current code uses the default `http://localhost:3003` in production (bug). The current `dashboard/page.tsx` uses:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';
```

This will be `http://localhost:3003` in production unless `NEXT_PUBLIC_API_URL` is passed as a `--build-arg` during Docker image build. **This is a known gap.** The fix is to add `NEXT_PUBLIC_API_URL` as a build arg in GitHub Actions, or switch to a runtime config approach.

---

### v3.0 Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Coolify Docker Compose deployment pattern | HIGH | Verified against Coolify official docs (Docker Compose build pack, environment variables, networking) |
| GHCR authentication via `docker login` | HIGH | Coolify official docs — "Coolify automatically detects credentials" |
| Health check behavior with Traefik | HIGH | Coolify health check docs — Traefik routing blocked on unhealthy containers |
| Env var substitution in compose file | HIGH | Coolify docs confirm `${VAR}` syntax creates UI-editable fields |
| Prisma import fix | HIGH | Prisma official GitHub discussions and documentation |
| Next.js middleware cookie auth | HIGH | Next.js 15 official docs (verified 2026-02-16) |
| standalone output public/ copy | HIGH | Next.js official output docs — confirmed `public/` not auto-copied |
| `NEXT_PUBLIC_API_URL` build-time embedding | MEDIUM | Known Next.js behavior, but exact impact on this project's Dockerfile needs verification |
| `devcollab-migrate` one-shot pattern | MEDIUM | Coolify supports `service_completed_successfully` condition, but migration command override needs verification against actual image structure |

---

### v3.0 Sources

**HIGH Confidence — Official Documentation:**
- [Coolify Docker Compose Build Pack](https://coolify.io/docs/applications/build-packs/docker-compose) — Networking, env vars, service communication
- [Coolify Environment Variables](https://coolify.io/docs/knowledge-base/environment-variables) — `${VAR}` syntax, built-in variables, secrets
- [Coolify Health Checks](https://coolify.io/docs/knowledge-base/health-checks) — Traefik integration, Dockerfile vs UI priority
- [Coolify Docker Registry](https://coolify.io/docs/knowledge-base/docker/registry) — `docker login` authentication, credential detection
- [Coolify GitHub Actions](https://coolify.io/docs/applications/ci-cd/github/actions) — Webhook-triggered redeployment pattern
- [Next.js Output Docs](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output) — standalone output, public/ copy requirement
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware) — cookie access, redirect pattern, matcher config
- [Prisma GitHub Discussion #17832](https://github.com/prisma/prisma/discussions/17832) — `@prisma/client/runtime/library` deprecation, `Prisma.` namespace as fix

**MEDIUM Confidence — Verified Community Sources:**
- [Coolify Docker Compose Networking Discussion #5059](https://github.com/coollabsio/coolify/discussions/5059) — Cross-stack networking limitations confirmed
- [Coolify "Connect to Predefined Network" Issue #5597](https://github.com/coollabsio/coolify/issues/5597) — Known issue with cross-stack networking, single compose preferred
- [Environment Variables and Build Args for Docker Compose in Coolify](https://cryszon.github.io/posts/environment-variables-and-build-args-for-docker-compose-in-coolify/) — Practical env var patterns

---

*v3.0 Coolify deployment + DevCollab UI tech debt research completed 2026-02-19.*
*Existing TeamFlow, DevCollab, and Matrix Portfolio sections above are preserved unchanged.*
