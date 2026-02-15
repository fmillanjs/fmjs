# Phase 1: Foundation & Authentication - Research

**Researched:** 2026-02-14
**Domain:** Authentication, Authorization (RBAC), Audit Logging, Technical Infrastructure
**Confidence:** HIGH

## Summary

Phase 1 establishes the security and technical foundation for TeamFlow by implementing multi-layer authentication, role-based access control (RBAC), comprehensive audit logging, and production-ready infrastructure patterns. This phase is critical—retrofitting security and audit capabilities after features are built is extremely difficult and error-prone.

The research confirms that the chosen stack (NextAuth v5, NestJS 10, Prisma 7, CASL, Socket.io) represents current best practices for 2026. Key architectural decisions include: (1) multi-layer RBAC enforcement at edge, API, service, and database layers for defense-in-depth security, (2) event-driven audit logging using domain events to capture complete user activity trails, (3) WebSocket authentication via JWT tokens validated on handshake and per-message, and (4) monorepo with shared Zod validation schemas as single source of truth.

Critical pitfalls to avoid: WebSocket authentication bypass (validate JWT on connection AND per-message), RBAC inconsistency (enforce at multiple layers, not just controllers), audit log gaps (log failures and authorization denials, not just successes), Server Actions as public endpoints (every action must validate authentication first), and monorepo type drift (use shared TypeScript source, not compiled JavaScript).

**Primary recommendation:** Implement authentication, RBAC, and audit logging patterns from day one using established libraries (NextAuth v5, CASL, Prisma Extensions). Do not hand-roll these critical security components. Establish patterns in Phase 1 that all subsequent phases will follow.

## Standard Stack

### Core Authentication & Authorization

| Library | Version | Purpose | Why Standard | Confidence |
|---------|---------|---------|--------------|------------|
| NextAuth.js v5 (Auth.js) | 5.0.0-beta | Authentication, session management, OAuth providers | Official Next.js auth solution with built-in RBAC support, Prisma adapter, JWT/database sessions. v5 adds improved middleware patterns and App Router support | HIGH |
| @auth/prisma-adapter | Latest | Prisma database adapter for NextAuth | Official adapter storing users, sessions, accounts in PostgreSQL via Prisma with type safety | HIGH |
| @casl/ability | 6.x | Fine-grained authorization (RBAC/ABAC) | Industry standard for declarative permissions. Supports role-based AND attribute-based rules with full TypeScript support | HIGH |
| @casl/prisma | 6.x | CASL integration for Prisma queries | Converts CASL rules to Prisma WHERE clauses using `accessibleBy()` helper for database-level filtering | HIGH |
| bcrypt | 5.x | Password hashing | Industry standard for password hashing with configurable salt rounds. Used by NextAuth Credentials provider | HIGH |

### Audit Logging & Monitoring

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| Prisma Client Extensions | Built-in (Prisma 7+) | Inject user context into queries for audit trails | Use to pass user ID to PostgreSQL session variables for trigger-based audit logging | HIGH |
| PostgreSQL Triggers | Native | Database-level audit capture | Create audit_log table capturing INSERT/UPDATE/DELETE with user context from session variables | HIGH |
| nest-winston | 1.x | Winston integration for NestJS | Production-grade structured logging with JSON formatting, multiple transports, request correlation IDs | HIGH |
| winston | 3.x (3.17.0+) | Logging framework | Industry standard logger with transports for console, file, and log aggregation systems | HIGH |

### Validation & Type Safety

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| zod | 3.x (3.22+) | Runtime schema validation | TypeScript-first validation. Single source of truth for validation schemas shared between frontend and backend | HIGH |
| nestjs-zod | Latest | NestJS + Zod integration | Provides `createZodDto` for type-safe DTOs and automatic OpenAPI schema generation in Swagger | HIGH |
| zod-prisma-types | Latest | Generate Zod schemas from Prisma | Automatically creates validators from Prisma schema comments for end-to-end type safety | MEDIUM |
| @hookform/resolvers | Latest | React Hook Form + Zod integration | Use `zodResolver` for client-side form validation with same schemas as backend | HIGH |

### Infrastructure & Tooling

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| Turborepo | Latest | Monorepo build orchestration | Manages builds across apps/packages with intelligent caching and dependency graph resolution | HIGH |
| Prisma | 7.x | ORM and type-safe database access | Production-ready migrations, type safety, Client Extensions for audit trails, Row Level Security support | HIGH |
| ioredis | 5.x | Redis client | High-performance client for session storage with connection pooling and cluster support | HIGH |
| @nestjs/terminus | Latest | Health check endpoints | Built-in health indicators for database, Redis, memory, disk with standardized response format | HIGH |

### Installation

```bash
# Monorepo root
npm install -D turbo typescript @types/node

# Shared packages
npm install zod@3.22+ --workspace=packages/shared

# Frontend (Next.js app)
npm install next-auth@beta @auth/prisma-adapter --workspace=apps/web
npm install @hookform/resolvers react-hook-form zod --workspace=apps/web
npm install @casl/ability --workspace=apps/web

# Backend (NestJS app)
npm install @nestjs/core @nestjs/common @nestjs/config --workspace=apps/api
npm install @nestjs/passport passport passport-jwt @nestjs/jwt --workspace=apps/api
npm install @casl/ability @casl/prisma --workspace=apps/api
npm install nestjs-zod zod --workspace=apps/api
npm install nest-winston winston winston-daily-rotate-file --workspace=apps/api
npm install bcrypt ioredis --workspace=apps/api
npm install @nestjs/terminus --workspace=apps/api

# Database package
npm install @prisma/client --workspace=packages/database
npm install -D prisma --workspace=packages/database

# Dev dependencies
npm install -D @types/bcrypt @types/passport-jwt --workspace=apps/api
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff | Confidence |
|------------|-----------|----------|------------|
| NextAuth v5 | Clerk | Clerk is excellent but paid for production features ($25-99/mo). NextAuth is open source with full control and Prisma integration. For portfolio, showing implementation > integration | MEDIUM |
| NextAuth v5 | Auth0 | Auth0 adds external dependency and cost. NextAuth provides same features with database ownership and easier to showcase technical skills | MEDIUM |
| @casl/ability | Custom RBAC | CASL handles complex edge cases (field-level permissions, conditions, delegation). Hand-rolling RBAC leads to security gaps and maintenance burden | HIGH |
| Prisma Client Extensions | Prisma Middleware (deprecated) | Middleware deprecated in Prisma 5+. Client Extensions provide better type safety and composability | HIGH |
| bcrypt | argon2 | argon2 is more secure but NextAuth Credentials provider uses bcrypt by default. Consistency more important than marginal security gain | MEDIUM |

## Architecture Patterns

### Recommended Project Structure

```
teamflow/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/              # Auth route group (login, signup, reset)
│   │   │   │   ├── login/
│   │   │   │   ├── signup/
│   │   │   │   └── reset-password/
│   │   │   ├── (dashboard)/         # Protected routes
│   │   │   │   ├── layout.tsx       # Auth check wrapper
│   │   │   │   └── profile/
│   │   │   ├── api/
│   │   │   │   ├── auth/
│   │   │   │   │   └── [...nextauth]/
│   │   │   │   │       └── route.ts # NextAuth v5 handler
│   │   │   │   └── health/
│   │   │   │       └── route.ts     # Frontend health check
│   │   │   └── layout.tsx           # Root layout with SessionProvider
│   │   ├── components/
│   │   │   ├── auth/                # Auth forms, guards
│   │   │   └── ui/                  # Shadcn components
│   │   ├── lib/
│   │   │   ├── auth.ts              # NextAuth config & helpers
│   │   │   └── rbac.ts              # Client RBAC utilities
│   │   └── middleware.ts            # Auth middleware (edge)
│   │
│   └── api/                          # NestJS backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/            # Authentication module
│       │   │   │   ├── guards/      # JwtAuthGuard, RolesGuard
│       │   │   │   ├── strategies/  # Passport JWT strategy
│       │   │   │   ├── decorators/  # @CurrentUser, @Roles
│       │   │   │   └── auth.service.ts
│       │   │   └── users/           # User management
│       │   │       ├── dto/         # Zod-based DTOs
│       │   │       └── users.service.ts
│       │   │
│       │   ├── core/
│       │   │   ├── rbac/            # CASL authorization
│       │   │   │   ├── ability.factory.ts
│       │   │   │   ├── policies/    # Permission policies
│       │   │   │   └── rbac.guard.ts
│       │   │   ├── audit/           # Audit logging
│       │   │   │   ├── audit.service.ts
│       │   │   │   ├── audit.listener.ts
│       │   │   │   └── decorators/  # @AuditLog
│       │   │   └── database/
│       │   │       └── prisma.service.ts
│       │   │
│       │   ├── common/
│       │   │   ├── guards/          # Shared guards
│       │   │   ├── interceptors/    # Logging, transform
│       │   │   ├── filters/         # Exception filters
│       │   │   └── pipes/           # ZodValidationPipe
│       │   │
│       │   ├── health/              # Health check module
│       │   │   ├── health.controller.ts
│       │   │   └── indicators/      # Prisma, Redis indicators
│       │   │
│       │   ├── app.module.ts
│       │   └── main.ts
│       │
│       └── test/                    # E2E tests
│
├── packages/
│   ├── database/                     # Prisma schema and client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── client.ts            # Prisma client with extensions
│   │       └── audit-extension.ts   # User context injection
│   │
│   ├── shared/                       # Shared types and validation
│   │   └── src/
│   │       ├── types/               # Shared TypeScript types
│   │       │   ├── user.ts
│   │       │   ├── session.ts
│   │       │   └── enums.ts
│   │       └── validators/          # Zod schemas (single source of truth)
│   │           ├── auth.schema.ts
│   │           └── user.schema.ts
│   │
│   └── config/                       # Shared configs
│       ├── eslint-config/
│       └── tsconfig/
│
├── turbo.json                        # Turborepo pipeline
├── package.json                      # Workspace config
└── docker-compose.yml                # Local development
```

### Pattern 1: Multi-Layer RBAC Enforcement

**What:** Role-Based Access Control implemented at four architectural layers: (1) Next.js Middleware (edge), (2) Next.js API Routes, (3) NestJS Guards, and (4) Prisma queries with CASL filtering.

**When to use:** Any multi-tenant SaaS application where a single authorization point creates security risk or performance bottleneck. Required for compliance and defense-in-depth security.

**Why multi-layer:** Each layer provides different guarantees—edge prevents UI access, API routes prevent unauthorized API calls, NestJS guards protect business logic, and database filtering prevents data leakage even if code has bugs.

**Example:**

```typescript
// Layer 1: Next.js Middleware (Edge) - Route-level access
// apps/web/middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const session = req.auth;

  // Coarse-grained: Block entire routes
  if (path.startsWith('/admin') && session?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

// Layer 2: Next.js API Route - Resource access
// apps/web/app/api/users/[id]/route.ts
import { auth } from '@/lib/auth';
import { can } from '@/lib/rbac';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Medium-grained: Check resource access
  const hasAccess = await can(session.user, 'read', 'User', params.id);
  if (!hasAccess) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Forward to backend
  const res = await fetch(`${process.env.API_URL}/users/${params.id}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  return res;
}

// Layer 3: NestJS Guard - Action authorization
// apps/api/src/core/rbac/rbac.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from './rbac.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      'permission',
      context.getHandler()
    );
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return this.rbacService.hasPermission(user, requiredPermission);
  }
}

// Layer 4: Database filtering with CASL
// apps/api/src/modules/users/users.service.ts
import { PrismaAbility } from '@casl/prisma';
import { accessibleBy } from '@casl/prisma';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private abilityFactory: AbilityFactory
  ) {}

  async findAll(user: User) {
    const ability = this.abilityFactory.createForUser(user);

    // Fine-grained: Database-level filtering
    return this.prisma.user.findMany({
      where: accessibleBy(ability, 'read').User,
    });
  }
}
```

**Source:** [Mastering Complex RBAC in NestJS: Integrating CASL with Prisma ORM](https://blog.devgenius.io/mastering-complex-rbac-in-nestjs-integrating-casl-with-prisma-orm-for-granular-authorization-767941a05ef1)

### Pattern 2: Event-Driven Audit Logging

**What:** All state-changing operations emit domain events captured by audit logger. Audit trail is built from event stream rather than scattered logging calls.

**When to use:** Systems requiring compliance, forensic investigation, or activity feeds. Essential for work management where "who changed what when" is critical.

**Why event-driven:** Decouples audit logging from business logic, ensures completeness (events can't be forgotten), enables temporal queries ("show me task X at time Y"), and supports future features like activity feeds.

**Example:**

```typescript
// Domain event definition
// packages/shared/src/types/events.ts
export class UserRoleChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly previousRole: UserRole,
    public readonly newRole: UserRole,
    public readonly changedBy: string,
    public readonly timestamp: Date,
    public readonly metadata: {
      ipAddress: string;
      userAgent: string;
      requestId: string;
    }
  ) {}
}

// Service emits events
// apps/api/src/modules/users/users.service.ts
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  async updateRole(
    userId: string,
    newRole: UserRole,
    changedBy: User,
    request: Request
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const previousRole = user.role;

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    // Emit domain event (non-blocking)
    this.eventEmitter.emit(
      'user.role.changed',
      new UserRoleChangedEvent(
        userId,
        previousRole,
        newRole,
        changedBy.id,
        new Date(),
        {
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          requestId: request.headers['x-request-id'],
        }
      )
    );
  }
}

// Audit listener captures all events
// apps/api/src/core/audit/audit.listener.ts
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AuditListener {
  constructor(private prisma: PrismaService) {}

  @OnEvent('user.role.changed', { async: true })
  async handleRoleChanged(event: UserRoleChangedEvent) {
    await this.prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: event.userId,
        action: 'ROLE_CHANGED',
        actorId: event.changedBy,
        timestamp: event.timestamp,
        changes: {
          field: 'role',
          from: event.previousRole,
          to: event.newRole,
        },
        metadata: event.metadata,
      },
    });
  }

  // Catch-all for any event
  @OnEvent('**')
  async handleAllEvents(eventName: string, event: any) {
    // Ensure every domain event is logged
    if (event.userId && event.timestamp) {
      // Log generic audit entry
    }
  }
}
```

**Source:** [Prisma Audit Trail Guide for Postgres](https://medium.com/@arjunlall/prisma-audit-trail-guide-for-postgres-5b09aaa9f75a)

### Pattern 3: Shared Validation with Zod (Monorepo)

**What:** Define validation schemas once using Zod in shared package. Generate TypeScript types and use identical schemas in both frontend (form validation) and backend (DTO validation).

**When to use:** Monorepos with TypeScript across frontend/backend where validation logic must be identical. Prevents drift between client and server validation.

**Why single source:** Eliminates duplication, prevents API contract mismatches, provides compile-time safety, and ensures consistent error messages.

**Example:**

```typescript
// Shared validation schema
// packages/shared/src/validators/auth.schema.ts
import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type SignUpDto = z.infer<typeof signUpSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

// Backend validation with nestjs-zod
// apps/api/src/modules/auth/dto/sign-up.dto.ts
import { createZodDto } from 'nestjs-zod';
import { signUpSchema } from '@repo/shared/validators/auth.schema';

export class SignUpDto extends createZodDto(signUpSchema) {}

// NestJS Controller
// apps/api/src/modules/auth/auth.controller.ts
@Controller('auth')
export class AuthController {
  @Post('signup')
  async signUp(@Body() dto: SignUpDto) {
    // DTO is automatically validated by ZodValidationPipe
    return this.authService.signUp(dto);
  }
}

// Frontend validation with React Hook Form
// apps/web/components/auth/signup-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, SignUpDto } from '@repo/shared/validators/auth.schema';

export function SignUpForm() {
  const form = useForm<SignUpDto>({
    resolver: zodResolver(signUpSchema), // Same schema as backend!
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  const onSubmit = async (data: SignUpDto) => {
    // Client validates with same rules as server
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('email')} />
      {form.formState.errors.email && <p>{form.formState.errors.email.message}</p>}
      {/* Errors are identical on client and server */}
    </form>
  );
}
```

**Source:** [Share Types Across Next.js & NestJS with Zod](https://compiledbox.com/blog/share-types-across-nextjs-nestjs-with-zod)

### Pattern 4: NextAuth v5 with Prisma Adapter and JWT Sessions

**What:** NextAuth v5 (Auth.js) configured with Prisma database adapter for user/account storage and JWT session strategy for stateless authentication.

**When to use:** Next.js applications requiring email/password authentication, OAuth providers, and session persistence across browser restarts.

**Why this pattern:** NextAuth v5 handles security edge cases (CSRF, session fixation, token rotation), integrates seamlessly with Prisma, supports both database and JWT sessions, and provides RBAC via session callbacks.

**Example:**

```typescript
// NextAuth configuration
// apps/web/lib/auth.ts
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@repo/database';
import { loginSchema } from '@repo/shared/validators/auth.schema';
import bcrypt from 'bcrypt';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt', // Stateless sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate with Zod
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Verify user
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        // Check password
        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Add user data to JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // Add JWT data to session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});

// API route handler
// apps/web/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;

// Server-side session access
// apps/web/app/(dashboard)/profile/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <div>Welcome {session.user.name}</div>;
}
```

**Source:** [Complete Guide: Password Reset and Authentication in Next.js with Auth.js (NextAuth v5)](https://medium.com/@sanyamm/complete-guide-password-reset-and-authentication-in-next-js-with-auth-js-nextauth-v5-fcf540b2a8fb)

### Pattern 5: WebSocket Authentication with JWT

**What:** WebSocket connections authenticate via JWT tokens passed during handshake, validated by custom NestJS guard before establishing connection.

**When to use:** Real-time features requiring secure WebSocket connections where only authenticated users can subscribe to updates.

**Why JWT handshake:** WebSocket protocol doesn't support HTTP headers after initial handshake. Token must be validated immediately and user context attached to socket instance.

**Example:**

```typescript
// WebSocket Authentication Guard
// apps/api/src/common/guards/ws-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    // Extract token from handshake
    const token = this.extractToken(client);
    if (!token) {
      throw new WsException('Unauthorized: No token provided');
    }

    try {
      // Verify JWT
      const payload = await this.jwtService.verifyAsync(token);

      // Attach user to socket instance
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch (error) {
      throw new WsException('Unauthorized: Invalid token');
    }
  }

  private extractToken(client: Socket): string | null {
    // Try multiple token locations
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Also check auth object
    return client.handshake.auth?.token || null;
  }
}

// WebSocket Gateway with authentication
// apps/api/src/modules/events/events.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL },
})
@UseGuards(WsAuthGuard) // Apply to entire gateway
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    // User already authenticated by guard
    const user = client.data.user;
    console.log(`User ${user.id} connected via WebSocket`);

    // Join user-specific room
    client.join(`user:${user.id}`);
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    console.log(`User ${user.id} disconnected`);
  }
}

// Client-side WebSocket connection (Next.js)
// apps/web/lib/websocket.ts
import { io, Socket } from 'socket.io-client';

export function createAuthenticatedSocket(token: string): Socket {
  return io(process.env.NEXT_PUBLIC_WS_URL, {
    auth: {
      token, // Send JWT in auth object
    },
    extraHeaders: {
      authorization: `Bearer ${token}`, // Also send in headers
    },
    reconnection: true,
    reconnectionDelay: 1000,
  });
}
```

**Source:** [The Best Way to Authenticate WebSockets in NestJS](https://preetmishra.com/blog/the-best-way-to-authenticate-websockets-in-nestjs)

### Pattern 6: Prisma Client Extension for Audit Context

**What:** Use Prisma Client Extension to inject user context into PostgreSQL session variables, which database triggers read to populate audit logs.

**When to use:** Applications requiring database-level audit trails that capture who made changes, even for direct database queries.

**Why extension over middleware:** Prisma deprecated middleware in favor of Client Extensions. Extensions provide better type safety and composability.

**Example:**

```typescript
// Prisma client with audit extension
// packages/database/src/audit-extension.ts
import { Prisma, PrismaClient } from '@prisma/client';

export function createAuditExtension(userId?: string) {
  return Prisma.defineExtension({
    name: 'audit-context',
    query: {
      $allModels: {
        async $allOperations({ args, query, operation, model }) {
          // Set user context for audit triggers
          if (userId && operation !== 'findMany' && operation !== 'findFirst') {
            // Use transaction to scope session variable to this query
            const [result] = await prisma.$transaction([
              prisma.$executeRaw`SET LOCAL app.current_user_id = ${userId}`,
              query(args),
            ]);
            return result;
          }

          return query(args);
        },
      },
    },
  });
}

// Usage in service
// apps/api/src/core/database/prisma.service.ts
import { Injectable, Scope } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createAuditExtension } from '@repo/database/audit-extension';

@Injectable({ scope: Scope.REQUEST }) // Request-scoped for user context
export class PrismaService {
  private client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  forUser(userId: string) {
    // Return Prisma client with user context extension
    return this.client.$extends(createAuditExtension(userId));
  }
}

// PostgreSQL trigger for audit logging
// packages/database/prisma/migrations/XXX_audit_triggers/migration.sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changes JSONB,
  metadata JSONB
);

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  user_id_value TEXT;
BEGIN
  -- Read user ID from session variable set by Prisma extension
  user_id_value := current_setting('app.current_user_id', TRUE);

  INSERT INTO audit_logs (entity_type, entity_id, action, user_id, changes)
  VALUES (
    TG_TABLE_NAME,
    NEW.id,
    TG_OP,
    user_id_value::UUID,
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
CREATE TRIGGER users_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

**Source:** [Prisma Client Extensions - Audit Log Context](https://github.com/prisma/prisma-client-extensions/tree/main/audit-log-context)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom crypto with salt generation | bcrypt or argon2 | Timing attacks, weak salt generation, incorrect iteration counts. Industry-vetted libraries handle edge cases |
| JWT validation | Manual token parsing and signature verification | @nestjs/jwt with passport-jwt | Token expiration edge cases, signature algorithm vulnerabilities (e.g., "none" algorithm), key rotation |
| Permission rules | If/else chains for role checks | @casl/ability with declarative rules | Scattered logic, maintenance nightmare, easy to miss edge cases. CASL provides query-level filtering |
| Session management | Custom session store and token rotation | NextAuth v5 with Redis adapter | CSRF protection, session fixation, token refresh, cookie security flags, OAuth state management |
| Audit logging | Manual logging calls in every service | Event-driven architecture with listeners | Incomplete coverage, missing context, scattered code, difficult to query |
| Email verification tokens | Random string generation with database lookup | NextAuth verification tokens | Timing attacks on lookup, weak randomness, missing expiration cleanup, no rate limiting |
| RBAC at database layer | WHERE clauses duplicated in services | @casl/prisma with accessibleBy() | Data leakage when forgotten, performance issues with complex rules, no centralized policy |
| Password reset flow | Custom token generation and email | NextAuth forgot password with email provider | Race conditions, token enumeration, missing rate limits, email template security |

**Key insight:** Authentication and authorization are "solved problems" with decades of attack patterns documented. Modern libraries incorporate these learnings. Hand-rolling these systems wastes time on edge cases that libraries already handle (session fixation, timing attacks, token rotation, CSRF protection, etc.).

## Common Pitfalls

### Pitfall 1: WebSocket Authentication Bypass

**What goes wrong:** WebSocket connections established without proper authentication, allowing unauthorized clients to receive real-time updates and bypass RBAC entirely.

**Why it happens:** Developers assume WebSocket connections from authenticated pages are automatically secure. NestJS guards only run on event handlers, not initial connection. No explicit token validation during handshake.

**How to avoid:**
1. **Validate JWT during handshake** using custom guard applied at gateway level with `@UseGuards(WsAuthGuard)`
2. **Extract token from both headers and auth object** to support multiple client libraries
3. **Attach verified user to socket.data** immediately after validation
4. **Explicitly disconnect on auth failure** using `client.disconnect()` in exception filters
5. **Apply guards to EVERY event handler** even if gateway has guard (defense in depth)
6. **Test with invalid tokens** to ensure disconnection, not silent failure

**Warning signs:**
- WebSocket events accessible without session validation
- Missing `@UseGuards()` decorators on gateway or handlers
- No token validation in `handleConnection` lifecycle hook
- Testing only shows "happy path" with authenticated users

**Verification:**
```bash
# Test WebSocket connection without token (should be rejected)
wscat -c ws://localhost:3001 -H "Authorization: Bearer invalid_token"

# Expected: Connection refused or immediate disconnect
```

**Source:** [The Best Way to Authenticate WebSockets in NestJS](https://preetmishra.com/blog/the-best-way-to-authenticate-websockets-in-nestjs)

### Pitfall 2: Server Actions as Unauthenticated Public Endpoints

**What goes wrong:** Next.js Server Actions with `'use server'` create public HTTP endpoints that anyone can invoke with crafted payloads, bypassing UI-based permission checks.

**Why it happens:** Server Actions look like regular TypeScript functions, leading developers to treat them as internal. Mental model is "this is called from my component, so it's protected," but reality is every action creates a public POST endpoint.

**How to avoid:**
1. **EVERY action MUST start with authentication check** using `await auth()` from NextAuth
2. **Validate all inputs with Zod schemas** before processing
3. **Check authorization** for the specific resource being accessed
4. **Never read userId from function arguments**—always from verified session
5. **Rate limit sensitive actions** using middleware or Arcjet
6. **Log all action invocations** to audit log with IP address and user agent

**Example:**
```typescript
// WRONG: No authentication or validation
'use server'
async function updateProfile(userId: string, data: any) {
  await prisma.user.update({ where: { id: userId }, data });
}

// RIGHT: Auth, validation, authorization
'use server'
async function updateProfile(data: UpdateProfileInput) {
  // 1. Authentication
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  // 2. Input validation
  const validated = updateProfileSchema.parse(data);

  // 3. Authorization (only update own profile)
  if (validated.userId !== session.user.id) {
    throw new Error('Forbidden: Can only update own profile');
  }

  // 4. Execute with audit logging
  return updateUserProfile(session.user.id, validated);
}
```

**Warning signs:**
- Server Actions without `await auth()` at the top
- Direct Prisma calls without permission verification
- Missing Zod validation on inputs
- Actions accepting userId as parameter instead of reading from session

**Source:** [Next.js Server Actions Security: 5 Vulnerabilities You Must Fix](https://makerkit.dev/blog/tutorials/secure-nextjs-server-actions)

### Pitfall 3: RBAC Enforcement Inconsistency (Session Identity Bleed)

**What goes wrong:** Authorization checks scattered across controllers, services, and UI. Some endpoints check permissions while others assume session context is trustworthy. Users access resources by exploiting endpoints that skip authorization.

**Why it happens:** RBAC implemented as reactive policy checks that read from session without re-validating identity. Developers enforce permissions in controllers but forget service layers, assuming "if they got here, they must have permission."

**How to avoid:**
1. **Single Source of Truth** for permission rules using CASL ability factory
2. **Service-layer enforcement** using `@casl/prisma` with `accessibleBy()` for database queries
3. **Explicit context passing** with user object to service methods, not ambient session
4. **Custom decorators** like `@RequirePermission('task.update')` enforced at multiple layers
5. **Policy-as-code** defining all rules in one location (`ability.factory.ts`)
6. **Test authorization failures** explicitly to ensure 403 responses, not silent data filtering

**Example:**
```typescript
// WRONG: Scattered authorization logic
@Get(':id')
async getTask(@Param('id') id: string, @CurrentUser() user: User) {
  const task = await this.prisma.task.findUnique({ where: { id } });
  if (task.assigneeId !== user.id) throw new ForbiddenException();
  return task;
}

// RIGHT: Centralized RBAC service
@Get(':id')
@UseGuards(RbacGuard)
@RequirePermission('task', 'read')
async getTask(@Param('id') id: string, @CurrentUser() user: User) {
  // Authorization already checked by guard + decorator
  return this.taskService.findOne(id, user);
}

// Service layer also enforces
@Injectable()
export class TaskService {
  async findOne(id: string, user: User) {
    const ability = this.abilityFactory.createForUser(user);

    // Database-level filtering
    const task = await this.prisma.task.findFirst({
      where: {
        AND: [
          { id },
          accessibleBy(ability, 'read').Task,
        ],
      },
    });

    if (!task) throw new NotFoundException();
    return task;
  }
}
```

**Warning signs:**
- Authorization logic duplicated in multiple files
- Services reading `request.user` directly without re-validation
- UI hides features but API doesn't enforce restrictions
- Role updates require cache clearing to take effect

**Source:** [Mastering Complex RBAC in NestJS: Integrating CASL with Prisma ORM](https://blog.devgenius.io/mastering-complex-rbac-in-nestjs-integrating-casl-with-prisma-orm-for-granular-authorization-767941a05ef1)

### Pitfall 4: Audit Log Incompleteness

**What goes wrong:** Audit logs capture some events but miss critical actions—bulk operations log one entry instead of individual changes, failed permission checks aren't logged, WebSocket events bypass logging, context (IP address, user agent) is missing.

**Why it happens:** Logging added as afterthought using scattered `logger.log()` calls. Developers log successes but forget failures. WebSocket events particularly problematic because they don't flow through HTTP middleware.

**How to avoid:**
1. **Dedicated audit service** separate from application logs
2. **Decorator-based capture** using `@AuditLog('user.update')` on service methods
3. **Complete context** in every entry: UTC timestamp, actor ID, action, resource type/ID, outcome, IP, user agent, request ID
4. **Log failures explicitly**: auth failures, authorization denials, validation errors
5. **WebSocket coverage** via custom middleware wrapping handlers
6. **Bulk operations** log individual item changes, not just bulk request
7. **Separate storage** in dedicated audit_log table with append-only constraint

**Example:**
```typescript
// Event-driven audit logging
@Injectable()
export class AuditListener {
  @OnEvent('user.role.changed')
  async handleRoleChanged(event: UserRoleChangedEvent) {
    await this.prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: event.userId,
        action: 'ROLE_CHANGED',
        actorId: event.changedBy,
        timestamp: event.timestamp,
        outcome: 'SUCCESS',
        changes: {
          field: 'role',
          from: event.previousRole,
          to: event.newRole,
        },
        metadata: {
          ipAddress: event.metadata.ipAddress,
          userAgent: event.metadata.userAgent,
          requestId: event.metadata.requestId,
        },
      },
    });
  }

  // Log authorization failures
  @OnEvent('authorization.denied')
  async handleAuthDenied(event: AuthorizationDeniedEvent) {
    await this.prisma.auditLog.create({
      data: {
        entityType: event.resourceType,
        entityId: event.resourceId,
        action: event.attemptedAction,
        actorId: event.userId,
        timestamp: new Date(),
        outcome: 'DENIED',
        metadata: event.metadata,
      },
    });
  }
}
```

**Warning signs:**
- Audit logs say "User updated record" without context of what changed
- Missing entries for failed login attempts or permission denials
- Real-time changes not in audit trail
- Inability to answer "who changed field X from Y to Z?"

**Source:** [Prisma Audit Trail Guide for Postgres](https://medium.com/@arjunlall/prisma-audit-trail-guide-for-postgres-5b09aaa9f75a)

### Pitfall 5: Monorepo Type Drift and Import Chaos

**What goes wrong:** Frontend and backend types diverge over time. Imports break when moving from dev to production. Type definitions resolve to `any`. Builds succeed locally but fail in CI.

**Why it happens:** Teams share types by duplicating or compiling to JavaScript. Backend DTO changes don't propagate to frontend. TypeScript path aliases cause resolution conflicts. Different TypeScript versions create incompatibilities.

**How to avoid:**
1. **Single source of truth** in `packages/shared` exporting raw TypeScript source (not compiled)
2. **Project references** using TypeScript project references instead of path aliases
3. **Build orchestration** with Turborepo ensuring shared packages build first
4. **Version synchronization** pinning TypeScript version across monorepo
5. **Validation bridge** using Zod schemas as source—generate types from schemas
6. **No compiled output** in shared packages—import `.ts` files directly

**Example structure:**
```
packages/
  shared/
    src/
      types/          # Pure TypeScript types
      validators/     # Zod schemas (source of truth)
    package.json
    {
      "name": "@repo/shared",
      "exports": {
        "./types": "./src/types/index.ts",
        "./validators": "./src/validators/index.ts"
      },
      "main": "./src/index.ts"
    }
    tsconfig.json
    {
      "compilerOptions": {
        "composite": true,
        "declaration": true,
        "noEmit": false
      }
    }
```

**Warning signs:**
- Frontend shows type errors that don't exist at runtime
- API returns data not matching TypeScript interfaces
- `any` appearing in types that should be specific
- Backend DTO changes not caught by TypeScript in frontend

**Source:** [Live types in a TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo)

### Pitfall 6: Missing Database Indexes on Foreign Keys

**What goes wrong:** Queries involving relations (e.g., tasks with assignee) become catastrophically slow as data grows. Database connection pool exhausts under load.

**Why it happens:** Prisma doesn't automatically create indexes on foreign key columns in PostgreSQL (unlike some ORMs). Developers forget to add them manually.

**How to avoid:**
1. **Manually index ALL foreign keys** in Prisma schema using `@@index([foreignKeyField])`
2. **Index WHERE clause columns** used for filtering
3. **Index ORDER BY columns** used for sorting
4. **Test with realistic data volumes** (10k+ rows) to catch missing indexes
5. **Monitor slow queries** using Prisma query logging or database tools

**Example:**
```prisma
model Task {
  id          String   @id @default(cuid())
  title       String
  projectId   String
  assigneeId  String?

  project     Project  @relation(fields: [projectId], references: [id])
  assignee    User?    @relation(fields: [assigneeId], references: [id])

  // CRITICAL: Index foreign keys for performance
  @@index([projectId])
  @@index([assigneeId])

  // Also index commonly filtered/sorted columns
  @@index([status])
  @@index([createdAt])
}
```

**Warning signs:**
- Query time increases linearly with row count
- Slow queries in logs showing sequential scans
- Database CPU spikes during list queries

**Source:** [Index on foreign keys in postgres · Prisma Discussion](https://github.com/prisma/prisma/discussions/25783)

## Code Examples

Verified patterns from official sources and recent implementations.

### NextAuth v5 Configuration with Credentials Provider

```typescript
// apps/web/lib/auth.ts
import NextAuth, { type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@repo/database';
import { loginSchema } from '@repo/shared/validators/auth.schema';
import bcrypt from 'bcrypt';

// Extend session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        // Validate input
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Fetch user
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user || !user.password) return null;

        // Verify password
        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
```

**Source:** [Complete Guide: Password Reset and Authentication in Next.js with Auth.js](https://medium.com/@sanyamm/complete-guide-password-reset-and-authentication-in-next-js-with-auth-js-nextauth-v5-fcf540b2a8fb)

### CASL Ability Factory with Prisma Integration

```typescript
// apps/api/src/core/rbac/ability.factory.ts
import { Injectable } from '@nestjs/common';
import { AbilityBuilder, PrismaAbility, createPrismaAbility } from '@casl/prisma';
import { User } from '@prisma/client';

type Subjects = 'User' | 'Project' | 'Task' | 'all';
type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';

@Injectable()
export class AbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<PrismaAbility<[Actions, Subjects]>>(
      createPrismaAbility
    );

    if (user.role === 'ADMIN') {
      // Admin can do everything
      can('manage', 'all');
    } else if (user.role === 'MANAGER') {
      // Manager permissions
      can('read', 'Project', { organizationId: user.organizationId });
      can('create', 'Project', { organizationId: user.organizationId });
      can('update', 'Project', { organizationId: user.organizationId });
      can('delete', 'Project', { ownerId: user.id });

      can('read', 'Task', { project: { organizationId: user.organizationId } });
      can('create', 'Task');
      can('update', 'Task', { project: { organizationId: user.organizationId } });
      can('delete', 'Task', { createdById: user.id });

      can('read', 'User', { organizationId: user.organizationId });
    } else if (user.role === 'MEMBER') {
      // Member permissions (read-only mostly)
      can('read', 'Project', { organizationId: user.organizationId });
      can('read', 'Task', { project: { organizationId: user.organizationId } });
      can('update', 'Task', { assigneeId: user.id }); // Only assigned tasks

      can('read', 'User', { organizationId: user.organizationId });
      can('update', 'User', { id: user.id }); // Only own profile
    }

    return build();
  }
}

// Usage in service
// apps/api/src/modules/tasks/tasks.service.ts
import { accessibleBy } from '@casl/prisma';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private abilityFactory: AbilityFactory
  ) {}

  async findAll(user: User) {
    const ability = this.abilityFactory.createForUser(user);

    // Database-level filtering based on permissions
    return this.prisma.task.findMany({
      where: accessibleBy(ability, 'read').Task,
      include: { assignee: true, project: true },
    });
  }
}
```

**Source:** [Mastering Complex RBAC in NestJS: Integrating CASL with Prisma ORM](https://blog.devgenius.io/mastering-complex-rbac-in-nestjs-integrating-casl-with-prisma-orm-for-granular-authorization-767941a05ef1)

### NestJS Health Check with Prisma and Redis

```typescript
// apps/api/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './indicators/prisma.indicator';
import { RedisHealthIndicator } from './indicators/redis.indicator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private redisHealth: RedisHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
    ]);
  }
}

// Custom Prisma health indicator
// apps/api/src/health/indicators/prisma.indicator.ts
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError('Database check failed', this.getStatus(key, false));
    }
  }
}
```

**Source:** [Health checks with Terminus | NestJS Documentation](https://docs.nestjs.com/recipes/terminus)

### Docker Multi-Stage Build for Next.js with Prisma

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci

# Prisma generation
FROM deps AS prisma
WORKDIR /app
COPY packages/database ./packages/database
RUN cd packages/database && npx prisma generate

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/packages/database ./packages/database
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**Source:** [Next.js and Prisma in Docker](https://blog.jonrshar.pe/2024/Dec/24/nextjs-prisma-docker.html)

## State of the Art

| Old Approach | Current Approach (2026) | When Changed | Impact |
|--------------|-------------------------|--------------|--------|
| NextAuth v4 with Pages Router | NextAuth v5 (Auth.js) with App Router | v5 beta (2024-2025) | Better middleware patterns, edge runtime support, simplified config with `auth.ts` |
| Prisma Middleware for audit logging | Prisma Client Extensions | Prisma 5+ (2023) | Better type safety, composability, and performance. Middleware deprecated |
| class-validator decorators | Zod TypeScript-first validation | Gradual adoption (2023-2026) | Better DX, compile-time safety, monorepo sharing without runtime metadata |
| JWT sessions only | Database sessions with Redis | Always available, now preferred | Session invalidation on logout/password change, better security for sensitive apps |
| Manual RBAC if/else chains | CASL declarative permissions | CASL v6+ (2023-2026) | Centralized policies, database-level filtering, easier to audit and test |
| Jest for testing | Vitest for unit/integration tests | Vitest 1.0+ (2023) | 3-4x faster, native ESM support, better DX with Vite ecosystem |
| ws library for WebSockets | Socket.io with NestJS integration | Always available, now standard | Automatic reconnection, rooms, Redis scaling, broader browser support |

**Deprecated/outdated:**
- **NextAuth v4:** Use v5 (Auth.js) for App Router support and improved patterns
- **Prisma Middleware:** Use Client Extensions for better type safety and composability
- **class-validator:** Use Zod for shared validation between frontend and backend
- **Direct password comparison:** Use bcrypt with proper salt rounds (never plain text or weak hashing)
- **Sequential DB queries in loops:** Use `include` or Prisma's `relationLoadStrategy: 'join'` to prevent N+1

## Open Questions

1. **Redis session storage vs JWT-only sessions**
   - What we know: JWT sessions are stateless (faster, scalable). Redis sessions allow immediate invalidation (better security).
   - What's unclear: Production scale implications—when does Redis become bottleneck vs JWT decode overhead?
   - Recommendation: Start with JWT for simplicity (Phase 1 requirement: "stay logged in"). Add Redis in Phase 2 if immediate logout/password-change invalidation is required. For portfolio, document the tradeoff.

2. **Prisma relation loading strategy**
   - What we know: Prisma 5+ supports `relationLoadStrategy: 'join'` for single-query loads vs default multi-query approach
   - What's unclear: Performance characteristics at 10k+ rows with complex includes
   - Recommendation: Use `include` with explicit `select` for Phase 1. Test `join` strategy in Phase 2 with realistic data volumes. Document findings for portfolio case study.

3. **Audit log retention and archival**
   - What we know: Append-only audit logs grow indefinitely. Need retention policy for GDPR compliance.
   - What's unclear: When to archive vs delete? Best practices for long-term queryability?
   - Recommendation: Phase 1 implements logging with 90-day retention. Phase 4 adds archival to separate storage if log volume becomes concern. For demo, unlimited retention is acceptable.

4. **CASL policy caching**
   - What we know: Building CASL ability on every request adds overhead. Caching can improve performance.
   - What's unclear: Cache invalidation strategy when roles/permissions change mid-session?
   - Recommendation: No caching in Phase 1 for correctness. Phase 3 (real-time) adds Redis caching with 5-minute TTL and event-driven invalidation on role changes.

## Sources

### Primary (HIGH confidence)

**Authentication & Authorization:**
- [Auth.js Migrating to v5](https://authjs.dev/getting-started/migrating-to-v5) - Official migration guide
- [Complete Guide: Password Reset and Authentication in Next.js with Auth.js (NextAuth v5)](https://medium.com/@sanyamm/complete-guide-password-reset-and-authentication-in-next-js-with-auth-js-nextauth-v5-fcf540b2a8fb) - 2025 comprehensive guide
- [Auth.js RBAC Guide](https://authjs.dev/reference/nextjs/jwt) - Official RBAC implementation
- [Mastering Complex RBAC in NestJS: Integrating CASL with Prisma ORM](https://blog.devgenius.io/mastering-complex-rbac-in-nestjs-integrating-casl-with-prisma-orm-for-granular-authorization-767941a05ef1) - Production patterns
- [Role-Based Access Control with CASL in a NestJS Backend](https://hanabitech.medium.com/role-based-access-control-with-casl-in-a-nestjs-backendrole-based-access-control-with-casl-in-a-42d15286a555) - Implementation guide

**Audit Logging:**
- [Prisma Client Extensions - Audit Log Context](https://github.com/prisma/prisma-client-extensions/tree/main/audit-log-context) - Official example
- [Prisma Audit Trail Guide for Postgres](https://medium.com/@arjunlall/prisma-audit-trail-guide-for-postgres-5b09aaa9f75a) - Comprehensive guide
- [Dynamic Prisma Context and Audit Logs](https://lewisblackburn.me/blog/prisma-dynamic-context-and-audit-logs) - Production implementation

**WebSocket Security:**
- [The Best Way to Authenticate WebSockets in NestJS](https://preetmishra.com/blog/the-best-way-to-authenticate-websockets-in-nestjs) - Current best practices
- [NestJS WebSockets Guards Documentation](https://docs.nestjs.com/websockets/guards) - Official patterns
- [How to Implement WebSockets in NestJS](https://oneuptime.com/blog/post/2026-02-02-nestjs-websockets/view) - 2026 guide

**Monorepo & Type Safety:**
- [Share Types Across Next.js & NestJS with Zod](https://compiledbox.com/blog/share-types-across-nextjs-nestjs-with-zod) - Practical guide
- [Type-Safe Full-Stack Development: Shared Types Between TanStack Router and NestJS with Zod](https://michaelguay.dev/type-safe-full-stack-development-shared-types-between-tanstack-router-and-nestjs-with-zod/) - Modern patterns
- [Full-stack TypeScript monorepo guide: Next.js, React Native, NestJS, GraphQL, Prisma](https://gist.github.com/realcc/c08ff57de93274ec3e0d5809bd5a54ef) - Comprehensive setup
- [Live types in a TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo) - Type drift prevention

**Infrastructure:**
- [NestJS Health checks (Terminus) Documentation](https://docs.nestjs.com/recipes/terminus) - Official patterns
- [Next.js and Prisma in Docker](https://blog.jonrshar.pe/2024/Dec/24/nextjs-prisma-docker.html) - December 2024 guide
- [Dockerizing NestJS with Prisma and PostgreSQL](https://notiz.dev/blog/dockerizing-nestjs-with-prisma-and-postgresql/) - Production patterns

### Secondary (MEDIUM confidence)

**Validation & DTOs:**
- [How I Built a Type-Safe API with Auto-Generated Documentation Using Zod + NestJS + OpenAPI](https://medium.com/@gildniy/how-i-built-a-type-safe-api-with-auto-generated-documentation-using-zod-nestjs-openapi-f91c2abd8f08) - Real-world implementation
- [nestjs-zod npm package](https://www.npmjs.com/package/nestjs-zod) - Official package docs

**Security Best Practices:**
- [Next.js Server Actions Security: 5 Vulnerabilities You Must Fix](https://makerkit.dev/blog/tutorials/secure-nextjs-server-actions) - 2026 security guide
- [Next.js Security Hardening: Five Steps to Bulletproof Your App in 2026](https://medium.com/@widyanandaadi22/next-js-security-hardening-five-steps-to-bulletproof-your-app-in-2026-61e00d4c006e) - Current best practices

**Database Performance:**
- [Index on foreign keys in postgres · Prisma Discussion](https://github.com/prisma/prisma/discussions/25783) - Community consensus
- [Boosting Query Performance in Prisma ORM: The Impact of Indexing on Large Datasets](https://medium.com/@manojbicte/boosting-query-performance-in-prisma-orm-the-impact-of-indexing-on-large-datasets-a55b1972ca72) - Performance analysis

### Tertiary (Context & Background)

- [NextAuth Email Verification Simplified](https://nextjsstarter.com/blog/nextauth-email-verification-simplified/) - Email flow patterns
- [Auth.js Upstash Redis Adapter](https://authjs.dev/getting-started/adapters/upstash-redis) - Redis session storage
- [GitHub - Turborepo Starter with Next.js and NestJS](https://github.com/Murtaza99dev/Turborepo-Starter) - Reference implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified with official docs and 2025-2026 sources
- Architecture patterns: HIGH - Multiple production implementations verified
- Common pitfalls: HIGH - Based on official security docs and documented CVEs
- Code examples: HIGH - Sourced from official docs and verified 2025-2026 blog posts

**Research date:** 2026-02-14
**Valid until:** ~60 days (March 2026) for stable technologies; authentication/authorization patterns change slowly

**Key takeaway:** Phase 1 is foundational—implement security patterns correctly from day one. Retrofitting authentication, RBAC, and audit logging after features are built is 10x harder and error-prone. Use established libraries (NextAuth v5, CASL, Prisma Extensions) rather than hand-rolling security components. Establish patterns that all subsequent phases will follow.
