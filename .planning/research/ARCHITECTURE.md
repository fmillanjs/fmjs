# Architecture Research

**Domain:** Work Management SaaS
**Researched:** 2026-02-14
**Confidence:** MEDIUM-HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Next.js)                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Pages/  │  │ API      │  │ WS       │  │ Auth     │             │
│  │  App Dir │  │ Routes   │  │ Client   │  │ Context  │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │             │             │                    │
│       └─────────────┴─────────────┴─────────────┘                    │
│                            ↓                                         │
├─────────────────────────────────────────────────────────────────────┤
│                         API GATEWAY (Next.js API)                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐       │
│  │        Auth Middleware → RBAC Check → Route Handler      │       │
│  └──────────────────────────────────────────────────────────┘       │
│                            ↓                                         │
├─────────────────────────────────────────────────────────────────────┤
│                      BACKEND LAYER (NestJS)                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   Projects   │  │    Tasks     │  │     Teams    │               │
│  │   Module     │  │   Module     │  │    Module    │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         │                 │                 │                        │
│         ├─ Controller     ├─ Controller     ├─ Controller           │
│         ├─ Service        ├─ Service        ├─ Service              │
│         ├─ Repository     ├─ Repository     ├─ Repository           │
│         └─ DTOs/Events    └─ DTOs/Events    └─ DTOs/Events          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │              Cross-Cutting Concerns                       │       │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │       │
│  │  │  RBAC   │  │  Audit  │  │  Event  │  │  WS     │     │       │
│  │  │ Service │  │  Log    │  │  Bus    │  │Gateway  │     │       │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │       │
│  └──────────────────────────────────────────────────────────┘       │
│                            ↓                                         │
├─────────────────────────────────────────────────────────────────────┤
│                      DATA LAYER (Prisma + Postgres)                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Projects │  │  Tasks   │  │  Users   │  │  Audit   │             │
│  │  Table   │  │  Table   │  │  Table   │  │  Logs    │             │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    REALTIME LAYER (Redis + WS)                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐       │
│  │   Redis Pub/Sub → WebSocket Gateway → Connected Clients  │       │
│  └──────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Next.js Frontend** | UI rendering, client-side routing, SSR/SSG, API proxying | App Router with React Server Components |
| **Next.js API Routes** | Auth middleware, RBAC enforcement at edge, request proxying to NestJS | Middleware chain + tRPC or REST endpoints |
| **NestJS Modules** | Business logic encapsulation per bounded context (Projects, Tasks, Teams) | Domain modules with controllers, services, repositories |
| **RBAC Service** | Centralized permission checking across all layers | Policy-as-code with decorators, guards, and interceptors |
| **Audit Logger** | Immutable event recording of all state changes | Append-only event log with metadata capture |
| **Event Bus** | Asynchronous event propagation between modules | NestJS EventEmitter2 or Bull queues |
| **WebSocket Gateway** | Bidirectional realtime communication | NestJS Gateway with Socket.IO + Redis adapter |
| **Prisma Client** | Type-safe database access with migrations | Generated client with custom middleware |
| **Redis** | Session storage, pub/sub for WebSockets, caching | ioredis with connection pooling |

## Recommended Project Structure

```
apps/
├── web/                      # Next.js frontend application
│   ├── app/                  # App Router directory
│   │   ├── (auth)/          # Auth route group
│   │   ├── (dashboard)/     # Dashboard route group
│   │   ├── api/             # API routes (proxy to backend)
│   │   └── layout.tsx       # Root layout
│   ├── components/          # React components
│   │   ├── ui/              # Shadcn/ui components
│   │   ├── features/        # Feature-specific components
│   │   └── layouts/         # Layout components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and helpers
│   │   ├── auth.ts          # Auth utilities (NextAuth)
│   │   ├── rbac.ts          # Client-side RBAC helpers
│   │   └── websocket.ts     # WebSocket client wrapper
│   └── middleware.ts        # Next.js middleware for auth/RBAC
│
├── api/                      # NestJS backend application
│   ├── src/
│   │   ├── modules/         # Feature modules (bounded contexts)
│   │   │   ├── projects/    # Project management module
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── repositories/
│   │   │   │   ├── dto/
│   │   │   │   ├── entities/
│   │   │   │   ├── events/  # Domain events
│   │   │   │   └── projects.module.ts
│   │   │   ├── tasks/       # Task management module
│   │   │   ├── teams/       # Team management module
│   │   │   ├── users/       # User management module
│   │   │   └── comments/    # Comments/activity module
│   │   │
│   │   ├── common/          # Cross-cutting concerns
│   │   │   ├── guards/      # Auth, RBAC guards
│   │   │   ├── interceptors/# Logging, transform interceptors
│   │   │   ├── decorators/  # Custom decorators (@Roles, @CurrentUser)
│   │   │   ├── filters/     # Exception filters
│   │   │   └── pipes/       # Validation pipes
│   │   │
│   │   ├── core/            # Core infrastructure
│   │   │   ├── auth/        # Authentication service
│   │   │   ├── rbac/        # RBAC service and policies
│   │   │   ├── audit/       # Audit logging service
│   │   │   ├── events/      # Event bus configuration
│   │   │   ├── websocket/   # WebSocket gateway
│   │   │   └── database/    # Database configuration
│   │   │
│   │   ├── app.module.ts    # Root module
│   │   └── main.ts          # Application entry point
│   │
│   └── test/                # E2E tests
│
packages/
├── database/                 # Prisma schema and migrations
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Migration files
│   │   └── seed.ts          # Seed data
│   └── src/
│       ├── client.ts        # Prisma client export
│       └── types.ts         # Generated types
│
├── shared/                   # Shared code between web and api
│   ├── types/               # Shared TypeScript types
│   ├── constants/           # Shared constants
│   ├── validators/          # Zod schemas (shared validation)
│   └── utils/               # Shared utility functions
│
├── config/                   # Shared configuration
│   ├── eslint-config/       # ESLint configurations
│   ├── tsconfig/            # TypeScript configurations
│   └── prettier-config/     # Prettier configuration
│
└── ui/                       # Shared UI components (optional)
    └── src/
        └── components/      # Reusable components
```

### Structure Rationale

- **Monorepo:** Turborepo enables code sharing, unified tooling, and atomic commits across frontend/backend while maintaining separation of concerns.
- **Modular Monolith (NestJS):** Each business domain (projects, tasks, teams) is a self-contained module. Enables future extraction to microservices if needed without architectural rewrite.
- **Shared Package:** Zod validators and TypeScript types shared between frontend and backend ensure end-to-end type safety and single source of truth for validation.
- **Database Package:** Centralizes Prisma schema and migrations. Both apps import from this package, ensuring consistent database access patterns.
- **Feature-Based Organization:** Frontend organized by features (not technical layers), making code discovery intuitive and enabling incremental development.

## Architectural Patterns

### Pattern 1: Layered RBAC Enforcement

**What:** Role-Based Access Control implemented at multiple architectural layers for defense-in-depth security.

**When to use:** Any multi-tenant application with complex permissions where a single authorization point creates a security risk or performance bottleneck.

**Trade-offs:**
- **Pros:** Defense in depth, clear security boundaries, easier to audit, prevents data leakage even if one layer fails
- **Cons:** Code duplication across layers, requires coordination to keep policies in sync, slightly higher development overhead

**Example:**
```typescript
// Layer 1: Next.js Middleware (Edge)
// apps/web/middleware.ts
export function middleware(req: NextRequest) {
  const session = await getSession(req);
  const path = req.nextUrl.pathname;

  // Coarse-grained: Route-level access
  if (path.startsWith('/admin') && !session?.user.roles.includes('ADMIN')) {
    return NextResponse.redirect('/unauthorized');
  }
}

// Layer 2: Next.js API Route (Application)
// apps/web/app/api/projects/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();

  // Medium-grained: Resource access
  const canView = await rbac.can(session.user, 'view', 'Project', params.id);
  if (!canView) throw new ForbiddenError();

  return fetch(`${API_URL}/projects/${params.id}`, {
    headers: { 'Authorization': `Bearer ${session.accessToken}` }
  });
}

// Layer 3: NestJS Guard (API)
// apps/api/src/common/guards/rbac.guard.ts
@Injectable()
export class RbacGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requiredPermission = this.reflector.get('permission', context.getHandler());

    return this.rbacService.hasPermission(user, requiredPermission);
  }
}

// Layer 4: Database (Row-Level Security)
// Prisma middleware adds tenant filtering
prisma.$use(async (params, next) => {
  if (params.model === 'Project') {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = {
        ...params.args.where,
        organizationId: currentUser.organizationId
      };
    }
  }
  return next(params);
});
```

### Pattern 2: Event-Driven Audit Logging

**What:** All state-changing operations emit domain events that are captured by an audit logger. Instead of scattered logging calls, audit trail is built from event stream.

**When to use:** Systems requiring compliance, audit trails, or event sourcing capabilities. Essential for work management where "who changed what when" is critical.

**Trade-offs:**
- **Pros:** Complete audit trail for free, enables event sourcing, decouples logging from business logic, supports temporal queries
- **Cons:** Eventual consistency, requires event schema versioning, storage grows continuously, debugging can be harder

**Example:**
```typescript
// Domain event definition
// packages/shared/types/events.ts
export class TaskStatusChangedEvent {
  constructor(
    public readonly taskId: string,
    public readonly previousStatus: TaskStatus,
    public readonly newStatus: TaskStatus,
    public readonly userId: string,
    public readonly timestamp: Date,
    public readonly metadata: Record<string, any>
  ) {}
}

// Service emits events
// apps/api/src/modules/tasks/services/task.service.ts
@Injectable()
export class TaskService {
  constructor(
    private eventEmitter: EventEmitter2,
    private auditLogger: AuditLogger
  ) {}

  async updateTaskStatus(taskId: string, newStatus: TaskStatus, userId: string) {
    const task = await this.taskRepository.findById(taskId);
    const previousStatus = task.status;

    task.status = newStatus;
    await this.taskRepository.save(task);

    // Emit domain event
    const event = new TaskStatusChangedEvent(
      taskId,
      previousStatus,
      newStatus,
      userId,
      new Date(),
      { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
    );

    this.eventEmitter.emit('task.status.changed', event);
    return task;
  }
}

// Audit logger listens to all events
// apps/api/src/core/audit/audit.listener.ts
@Injectable()
export class AuditListener {
  @OnEvent('**') // Listen to all events
  async handleEvent(event: any) {
    await this.prisma.auditLog.create({
      data: {
        eventType: event.constructor.name,
        entityType: this.extractEntityType(event),
        entityId: this.extractEntityId(event),
        userId: event.userId,
        timestamp: event.timestamp,
        changes: event, // Store full event as JSON
        metadata: event.metadata
      }
    });
  }
}
```

### Pattern 3: WebSocket Gateway with Redis Pub/Sub

**What:** Horizontal scaling pattern for WebSocket connections. Backend publishes events to Redis, which broadcasts to all connected WebSocket server instances.

**When to use:** Real-time applications that need to scale beyond a single server instance. Critical for work management where multiple users collaborate on same entities.

**Trade-offs:**
- **Pros:** Horizontally scalable, connection state distributed, supports multiple backend instances, simple failover
- **Cons:** Adds Redis dependency, slightly higher latency (< 10ms typically), requires connection state management, network overhead

**Example:**
```typescript
// WebSocket Gateway with Redis adapter
// apps/api/src/core/websocket/events.gateway.ts
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL },
  adapter: createAdapter(redisClient, redisClient.duplicate())
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private redisService: RedisService,
    private rbacService: RbacService
  ) {}

  async handleConnection(client: Socket) {
    const user = await this.validateToken(client.handshake.auth.token);

    // Store connection metadata in Redis
    await this.redisService.set(
      `ws:connection:${client.id}`,
      JSON.stringify({ userId: user.id, organizationId: user.organizationId }),
      'EX', 3600
    );

    // Join room for organization
    client.join(`org:${user.organizationId}`);
  }

  // Backend service publishes event
  async notifyTaskUpdate(taskId: string, organizationId: string) {
    // Redis pub/sub broadcasts to all connected instances
    this.server.to(`org:${organizationId}`).emit('task.updated', {
      taskId,
      timestamp: new Date()
    });
  }
}

// Domain service integration
// apps/api/src/modules/tasks/services/task.service.ts
@OnEvent('task.status.changed')
async handleTaskStatusChanged(event: TaskStatusChangedEvent) {
  // Automatically propagate to WebSocket clients
  this.eventsGateway.notifyTaskUpdate(event.taskId, event.organizationId);
}
```

### Pattern 4: Repository Pattern with Prisma

**What:** Abstraction layer between business logic and database access. Each domain module has a repository that encapsulates Prisma queries.

**When to use:** Domain-driven designs where you want to isolate database concerns from business logic and enable future database swaps.

**Trade-offs:**
- **Pros:** Testability (easy to mock), clear separation of concerns, database-agnostic business logic, centralized query optimization
- **Cons:** Additional abstraction layer, potential over-engineering for simple CRUD, Prisma already provides abstraction

**Example:**
```typescript
// Repository interface
// apps/api/src/modules/tasks/repositories/task.repository.interface.ts
export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findByProject(projectId: string): Promise<Task[]>;
  create(data: CreateTaskDto): Promise<Task>;
  update(id: string, data: UpdateTaskDto): Promise<Task>;
  delete(id: string): Promise<void>;
}

// Prisma implementation
// apps/api/src/modules/tasks/repositories/task.repository.ts
@Injectable()
export class TaskRepository implements ITaskRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Task | null> {
    return this.prisma.task.findUnique({
      where: { id },
      include: { assignee: true, project: true, comments: true }
    });
  }

  async findByProject(projectId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { projectId },
      include: { assignee: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: CreateTaskDto): Promise<Task> {
    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        assigneeId: data.assigneeId,
        status: 'TODO',
        priority: data.priority || 'MEDIUM'
      }
    });
  }
}

// Service uses repository
// apps/api/src/modules/tasks/services/task.service.ts
@Injectable()
export class TaskService {
  constructor(private taskRepository: ITaskRepository) {}

  async getTaskById(id: string): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
}
```

### Pattern 5: Shared Validation with Zod

**What:** Define validation schemas once using Zod in shared package, generate TypeScript types, and use in both frontend and backend.

**When to use:** Monorepos with TypeScript across frontend/backend where validation logic should be identical on both sides.

**Trade-offs:**
- **Pros:** Single source of truth, compile-time type safety, automatic API contract, reduced duplication, consistent error messages
- **Cons:** Shared package dependency, Zod bundle size on frontend, requires monorepo setup

**Example:**
```typescript
// Shared validation schema
// packages/shared/validators/task.schema.ts
import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  projectId: z.string().uuid(),
  assigneeId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.date().optional()
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;

// Backend validation
// apps/api/src/modules/tasks/dto/create-task.dto.ts
import { createTaskSchema } from '@acme/shared/validators';

export class CreateTaskDto implements z.infer<typeof createTaskSchema> {
  // Zod schema validates in NestJS pipe
}

// NestJS pipe
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodSchema) {}

  transform(value: unknown) {
    return this.schema.parse(value); // Throws if invalid
  }
}

// Controller
@Post()
@UsePipes(new ZodValidationPipe(createTaskSchema))
async create(@Body() dto: CreateTaskDto) {
  return this.taskService.create(dto);
}

// Frontend validation
// apps/web/components/forms/create-task-form.tsx
import { createTaskSchema } from '@acme/shared/validators';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function CreateTaskForm() {
  const form = useForm({
    resolver: zodResolver(createTaskSchema), // Same schema!
    defaultValues: { priority: 'MEDIUM' }
  });

  const onSubmit = async (data: CreateTaskDto) => {
    await fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };
}
```

## Data Flow

### Request Flow (CRUD Operations)

```
[User Action in Browser]
    ↓
[Next.js Client Component] → form submission / button click
    ↓
[Client-side validation] → Zod schema validation
    ↓
[Next.js API Route] → /app/api/tasks/route.ts
    ↓
[Auth Middleware] → Verify JWT session (NextAuth)
    ↓
[RBAC Check Layer 1] → Can user access this route?
    ↓
[Proxy to NestJS] → Forward with auth header
    ↓
[NestJS Controller] → @Post() create(@Body() dto)
    ↓
[Auth Guard] → Validate JWT
    ↓
[RBAC Guard Layer 2] → Can user perform this action?
    ↓
[Validation Pipe] → Zod schema validation
    ↓
[Service Layer] → Business logic execution
    ↓
[Repository Layer] → Database query construction
    ↓
[Prisma Middleware] → Tenant isolation, soft deletes
    ↓
[Database Query] → Postgres transaction
    ↓
[Event Emission] → Emit domain event (task.created)
    ↓
    ├─→ [Audit Logger] → Record to audit_logs table
    └─→ [WebSocket Gateway] → Broadcast to connected clients
    ↓
[Response] ← Transform DTO ← Service ← Controller
    ↓
[Next.js API] ← JSON response
    ↓
[Client] ← Update UI + Optimistic update
```

### Real-Time Event Flow

```
[Backend Service] → State change occurs
    ↓
[Domain Event Emitted] → task.status.changed
    ↓
    ├─→ [Audit Listener] → Log to database
    │
    └─→ [WebSocket Listener] → Trigger real-time broadcast
            ↓
        [Redis Pub/Sub] → Publish to channel
            ↓
        [All WebSocket Instances] → Receive from Redis
            ↓
        [Room-Based Broadcast] → Filter by organization/project
            ↓
        [Connected Clients] → Receive event
            ↓
        [Client Event Handler] → Update React state
            ↓
        [UI Re-render] → Display updated data
```

### Authentication & Session Flow

```
[User Login] → Email/password or OAuth
    ↓
[NextAuth.js] → Authenticate with provider
    ↓
[JWT Creation] → Generate access token with claims
    ↓
[Session Storage] → Store in Redis (server-side session)
    ↓
[HTTP-only Cookie] → Set session cookie
    ↓
[Subsequent Requests]
    ↓
[Next.js Middleware] → Read session from cookie
    ↓
[Session Lookup] → Fetch from Redis
    ↓
[Attach to Request] → Add user context
    ↓
[Forward to NestJS] → Include JWT in Authorization header
    ↓
[NestJS Auth Guard] → Validate JWT signature
    ↓
[User Context] → Attach to request object
```

### Audit Query Flow (Temporal Queries)

```
[Query: "What did Task X look like on Date Y?"]
    ↓
[Audit Log Query] → SELECT * FROM audit_logs
                    WHERE entityId = X
                    AND timestamp <= Y
                    ORDER BY timestamp DESC
    ↓
[Event Replay] → Apply events in chronological order
    ↓
[State Reconstruction] → Build object state at point in time
    ↓
[Response] → Historical state of entity
```

## Scaling Considerations

| Scale | Architecture Adjustments | Rationale |
|-------|--------------------------|-----------|
| **0-1k users** | Single Next.js + NestJS instance, single Postgres, Redis for sessions only | Monolith is simplest, no premature optimization. Focus on feature development. |
| **1k-10k users** | Add database read replicas, enable Postgres connection pooling (PgBouncer), implement query caching in Redis, optimize slow queries | Database becomes first bottleneck. Read-heavy workloads benefit from replicas. |
| **10k-50k users** | Horizontal scaling: Multiple NestJS instances behind load balancer, Redis cluster for WebSocket pub/sub, CDN for Next.js static assets, separate WebSocket server pool | WebSocket connections consume memory. Separate concerns to scale independently. |
| **50k-100k users** | Database sharding by organization, message queue for async tasks (Bull), separate audit log database, implement rate limiting | Write throughput becomes bottleneck. Sharding isolates tenant data. |
| **100k+ users** | Microservices extraction (Projects, Tasks, Teams as separate services), Event-driven architecture with message broker (Kafka/RabbitMQ), CQRS pattern, multi-region deployment | Coordination overhead of monolith becomes limiting factor. Independent scaling and deployment. |

### Scaling Priorities

1. **First bottleneck: Database connection pool exhaustion**
   - **Symptom:** Connection timeouts, slow queries under concurrent load
   - **Solution:** Add PgBouncer for connection pooling, implement read replicas for SELECT queries
   - **Timeline:** Around 5k-10k concurrent users

2. **Second bottleneck: WebSocket connection limits**
   - **Symptom:** New WebSocket connections rejected, memory pressure on backend
   - **Solution:** Separate WebSocket server pool, implement Redis pub/sub for cross-instance communication
   - **Timeline:** Around 10k-20k concurrent WebSocket connections (1 connection per active user)

3. **Third bottleneck: Audit log write throughput**
   - **Symptom:** Slow transactions due to audit log writes, database write contention
   - **Solution:** Async event processing with message queue, separate audit database, batch inserts
   - **Timeline:** Around 50k users with high activity (lots of state changes)

## Anti-Patterns

### Anti-Pattern 1: Scattered RBAC Logic

**What people do:** Implement permission checks directly in controllers, services, and database queries without a centralized RBAC service.

```typescript
// WRONG: Permission logic scattered everywhere
async updateTask(taskId: string, userId: string) {
  const task = await this.prisma.task.findUnique({ where: { id: taskId } });

  // Permission check in service
  if (task.assigneeId !== userId && task.project.ownerId !== userId) {
    throw new ForbiddenException();
  }

  // Business logic
  task.status = 'DONE';
  return this.prisma.task.update({ where: { id: taskId }, data: task });
}
```

**Why it's wrong:**
- Permission logic duplicated across codebase
- Changes to permission model require updating multiple files
- Difficult to audit what permissions exist
- Testing requires mocking permission checks everywhere
- No single source of truth for access control policies

**Do this instead:** Centralize RBAC in a dedicated service with declarative policies.

```typescript
// RIGHT: Centralized RBAC service
@Injectable()
export class RbacService {
  async can(
    user: User,
    action: Action,
    resource: Resource,
    resourceId?: string
  ): Promise<boolean> {
    // Load user's roles and permissions
    const permissions = await this.getUserPermissions(user);

    // Check resource-specific rules
    if (resourceId && resource === 'Task') {
      const task = await this.prisma.task.findUnique({
        where: { id: resourceId },
        include: { project: true }
      });

      // Policy evaluation
      return this.evaluatePolicy(user, action, task, permissions);
    }
  }
}

// Use with guard/decorator
@Put(':id')
@RequirePermission('task', 'update')
async updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
  // No permission logic here - handled by guard
  return this.taskService.update(id, dto);
}
```

### Anti-Pattern 2: Direct Prisma Access in Controllers

**What people do:** Call Prisma client directly from controllers, bypassing service and repository layers.

```typescript
// WRONG: Database access in controller
@Controller('tasks')
export class TaskController {
  constructor(private prisma: PrismaClient) {}

  @Get(':id')
  async getTask(@Param('id') id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: { assignee: true, comments: true }
    });
  }
}
```

**Why it's wrong:**
- No place for business logic (validation, authorization, event emission)
- Cannot intercept queries for audit logging or tenant filtering
- Difficult to test (must mock entire Prisma client)
- Tight coupling to database schema
- No opportunity for caching or optimization

**Do this instead:** Use Service → Repository layering.

```typescript
// RIGHT: Layered architecture
@Controller('tasks')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get(':id')
  async getTask(@Param('id') id: string, @CurrentUser() user: User) {
    return this.taskService.getTaskById(id, user);
  }
}

@Injectable()
export class TaskService {
  constructor(
    private taskRepository: TaskRepository,
    private rbacService: RbacService,
    private eventEmitter: EventEmitter2
  ) {}

  async getTaskById(id: string, user: User): Promise<TaskDto> {
    // Business logic: RBAC check
    const canView = await this.rbacService.can(user, 'view', 'Task', id);
    if (!canView) throw new ForbiddenException();

    // Delegate to repository
    const task = await this.taskRepository.findById(id);
    if (!task) throw new NotFoundException();

    // Business logic: event emission
    this.eventEmitter.emit('task.viewed', { taskId: id, userId: user.id });

    return this.toDto(task);
  }
}

@Injectable()
export class TaskRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Task | null> {
    return this.prisma.task.findUnique({
      where: { id },
      include: { assignee: true, comments: true }
    });
  }
}
```

### Anti-Pattern 3: Synchronous Audit Logging in Transaction

**What people do:** Write audit logs synchronously within the same database transaction as the business operation.

```typescript
// WRONG: Synchronous audit logging
async updateTask(id: string, data: UpdateTaskDto) {
  return this.prisma.$transaction(async (tx) => {
    const task = await tx.task.update({ where: { id }, data });

    // Audit log blocks transaction
    await tx.auditLog.create({
      data: {
        entityType: 'Task',
        entityId: id,
        action: 'UPDATE',
        changes: data
      }
    });

    return task;
  });
}
```

**Why it's wrong:**
- Audit log write failures cause business transaction rollback (audit shouldn't block operations)
- Increases transaction duration (holding locks longer)
- Audit table contention impacts business operations
- Cannot handle high-volume audit logging
- Tight coupling between business logic and audit system

**Do this instead:** Event-driven asynchronous audit logging.

```typescript
// RIGHT: Asynchronous event-based audit logging
async updateTask(id: string, data: UpdateTaskDto) {
  const previousTask = await this.taskRepository.findById(id);
  const updatedTask = await this.taskRepository.update(id, data);

  // Emit event (non-blocking)
  this.eventEmitter.emit('task.updated', new TaskUpdatedEvent(
    id,
    previousTask,
    updatedTask,
    currentUser.id,
    new Date()
  ));

  return updatedTask;
}

// Separate listener handles audit logging
@Injectable()
export class AuditListener {
  @OnEvent('task.updated', { async: true })
  async handleTaskUpdated(event: TaskUpdatedEvent) {
    // Async, doesn't block business operation
    await this.auditLogger.log({
      entityType: 'Task',
      entityId: event.taskId,
      userId: event.userId,
      action: 'UPDATE',
      before: event.previousState,
      after: event.newState,
      timestamp: event.timestamp
    });
  }
}
```

### Anti-Pattern 4: Client-Side Only Authorization

**What people do:** Rely on frontend UI hiding/showing based on user roles without backend enforcement.

```typescript
// WRONG: Client-side only
function TaskCard({ task, user }) {
  return (
    <div>
      <h3>{task.title}</h3>
      {user.role === 'ADMIN' && (
        <button onClick={() => deleteTask(task.id)}>Delete</button>
      )}
    </div>
  );
}

// Backend has no authorization check
@Delete(':id')
async deleteTask(@Param('id') id: string) {
  return this.prisma.task.delete({ where: { id } });
}
```

**Why it's wrong:**
- Anyone can call API endpoints directly (bypass UI controls)
- Browser developer tools can manipulate client state
- Security through obscurity is not security
- Regulatory compliance requires backend enforcement

**Do this instead:** Defense in depth with backend enforcement as source of truth.

```typescript
// RIGHT: Backend enforcement + frontend UX hints
// Frontend
function TaskCard({ task, user, permissions }) {
  const canDelete = permissions.includes('task:delete');

  return (
    <div>
      <h3>{task.title}</h3>
      {canDelete && (
        <button onClick={() => deleteTask(task.id)}>Delete</button>
      )}
    </div>
  );
}

// Backend ALWAYS enforces
@Delete(':id')
@UseGuards(RbacGuard)
@RequirePermission('task', 'delete')
async deleteTask(@Param('id') id: string, @CurrentUser() user: User) {
  // Even if client bypasses UI, guard blocks unauthorized users
  return this.taskService.delete(id, user);
}
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **NextAuth.js** | OAuth providers + JWT sessions | Configure in `apps/web/app/api/auth/[...nextauth]/route.ts`. Store sessions in Redis for invalidation support. |
| **Redis** | ioredis client, connection pooling | Single Redis instance for sessions, cache, and pub/sub. Consider Redis Cluster at 50k+ users. |
| **Email (SendGrid/Postmark)** | NestJS email module, template-based | Async via Bull queue. Store email events in audit log. |
| **File Storage (S3)** | Pre-signed URLs for direct upload | Generate URLs in backend, client uploads directly. Store metadata in DB. |
| **Analytics (PostHog/Amplitude)** | Client-side + server-side events | User interactions from frontend, backend events from audit log. |
| **Error Tracking (Sentry)** | SDK in both Next.js and NestJS | Use source maps, attach user context, breadcrumbs from audit log. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Next.js ↔ NestJS** | REST API over HTTP, WebSocket for realtime | Next.js API routes proxy to NestJS. Consider tRPC for type safety. |
| **NestJS Modules ↔ Modules** | Direct imports (monolith), EventEmitter for async | Prefer events for cross-module communication to maintain loose coupling. |
| **Backend ↔ Database** | Prisma Client with middleware | Connection pooling via PgBouncer. Use transactions for multi-table updates. |
| **Backend ↔ Redis** | Direct client access, BullMQ for queues | Separate Redis databases: 0 for sessions, 1 for cache, 2 for pub/sub. |
| **WebSocket Gateway ↔ Clients** | Socket.IO with auth handshake | Authenticate on connection. Use rooms for broadcast targeting. |

## Sources

### High Confidence (Official Documentation & Current Resources)

- [SaaS Architecture Fundamentals - AWS Whitepapers](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/saas-architecture-fundamentals.html)
- [NestJS Monorepo Documentation](https://docs.nestjs.com/cli/monorepo)
- [Building a Scalable RBAC System in Next.js](https://medium.com/@muhebollah.diu/building-a-scalable-role-based-access-control-rbac-system-in-next-js-b67b9ecfe5fa)
- [WebSocket Architecture Best Practices](https://ably.com/topic/websocket-architecture-best-practices)
- [Event Sourcing Pattern - Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)
- [Microservices Pattern: Audit Logging](https://microservices.io/patterns/observability/audit-logging.html)

### Medium Confidence (Verified Patterns & Best Practices)

- [Architecture Patterns for SaaS Platforms: Billing, RBAC, and Onboarding](https://medium.com/appfoster/architecture-patterns-for-saas-platforms-billing-rbac-and-onboarding-964ea071f571)
- [Full-stack TypeScript Monorepo Guide](https://gist.github.com/realcc/c08ff57de93274ec3e0d5809bd5a54ef)
- [Structuring NestJS with DDD and Onion Architecture](https://medium.com/@patrick.cunha336/structuring-a-nestjs-project-with-ddd-and-onion-architecture-65b04b7f2754)
- [Schema-Based Multi-Tenancy with NestJS and Prisma](https://darioielardi.dev/schema-based-multi-tenancy-with-nestjs-and-prisma)
- [How to Build a Role-Based Access Control Layer](https://www.osohq.com/learn/rbac-role-based-access-control)
- [WebSocket Events Architecture: Real-Time Updates at Scale](https://www.thedjpetersen.com/thoughts/websocket-events-architecture/)
- [Building Real-Time Applications with WebSockets](https://render.com/articles/building-real-time-applications-with-websockets)

### Research Context (Domain Understanding)

- [SaaS Development in 2026: Features, Stack & Architecture](https://www.tvlitsolutions.com/saas-development-in-2026-features-stack-architecture/)
- [Modern HTTP Stack in 2026](https://hemaks.org/posts/modern-http-stack-in-2026-http3-grpc-websockets-and-when-to-use-what/)
- [Database Schema Design Best Practices](https://www.bytebase.com/blog/top-database-schema-design-best-practices/)
- [Guide to Design Database for Task Manager](https://mysql.tutorials24x7.com/blog/guide-to-design-database-for-task-manager-in-mysql)

---
*Architecture research for: TeamFlow Work Management SaaS*
*Researched: 2026-02-14*
*Confidence: MEDIUM-HIGH (Verified with official docs and multiple authoritative sources)*
