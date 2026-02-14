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

### Production Patterns (HIGH to MEDIUM confidence)
- [How to Implement WebSockets in NestJS](https://oneuptime.com/blog/post/2026-02-02-nestjs-websockets/view) - Recent 2026 production patterns
- [Building a Production-Ready Real-Time Notification System in NestJS](https://medium.com/@marufpulok98/building-a-production-ready-real-time-notification-system-in-nestjs-websockets-redis-offline-6cc2f1bd0b05) - WebSocket + Redis patterns
- [Scalable WebSockets with NestJS and Redis](https://blog.logrocket.com/scalable-websockets-with-nestjs-and-redis/) - Scaling patterns
- [Implementing Prisma RBAC](https://www.permit.io/blog/implementing-prisma-rbac-fine-grained-prisma-permissions) - CASL + Prisma integration
- [Securing Multi-Tenant Applications Using RLS in PostgreSQL with Prisma](https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35) - Multi-tenancy patterns
- [Prisma Audit Trail Guide for Postgres](https://medium.com/@arjunlall/prisma-audit-trail-guide-for-postgres-5b09aaa9f75a) - Audit logging implementation

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
*Researched: 2026-02-14*
*Overall Confidence: HIGH - All core technologies verified with official docs and recent 2026 sources*
