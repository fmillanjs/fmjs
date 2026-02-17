# Phase 16: Workspaces + Membership + RBAC - Research

**Researched:** 2026-02-17
**Domain:** NestJS 11 workspace RBAC (CASL), Prisma schema additions, time-limited invite links, Next.js 15 workspace routing
**Confidence:** HIGH (based on direct codebase inspection + verified library documentation)

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WORK-01 | User can create a new workspace with name and slug | Prisma `Workspace` model with `name`, `slug` (unique), cuid ID; creator auto-joined as Admin; slug generation pattern from TeamFlow teams service verified |
| WORK-02 | Admin can generate an invite link (time-limited, single-use) | `InviteLink` model with `token` (UUID, unique), `expiresAt`, `usedAt` (nullable), `workspaceId`; Node.js `crypto.randomUUID()` for token; 72-hour expiry = `new Date(Date.now() + 72 * 60 * 60 * 1000)` |
| WORK-03 | User can join a workspace via invite link | `POST /workspaces/join` with token body; service validates: token exists, not expired (expiresAt > now), usedAt is null; marks usedAt on success; creates WorkspaceMember with Contributor role |
| WORK-04 | Admin can view and manage workspace members | `GET /workspaces/:slug/members` and `PATCH /workspaces/:slug/members/:userId/role`; requires Admin role check in service layer |
| WORK-05 | Admin cannot remove the last Admin from a workspace | Service counts Admin members before delete/demote; throws `BadRequestException` if count === 1; pattern directly from TeamFlow teams.service.ts line verified |
| RBAC-01 | Admin can manage workspace members, roles, and all content | `WorkspaceRole.Admin` maps to `can('manage', 'all')` in ability factory scoped to workspace |
| RBAC-02 | Contributor can create and edit own snippets, posts, and comments | `WorkspaceRole.Contributor` maps to `can('create', 'Post')`, `can('create', 'Snippet')`, `can('update', 'Post', {authorId: userId})` etc. |
| RBAC-03 | Viewer can read all workspace content but cannot create or edit | `WorkspaceRole.Viewer` maps to `can('read', 'all')` only |
| RBAC-04 | All API endpoints deny access by default when no role decorator present | Already enforced by `CaslAuthGuard` as `APP_GUARD` — `ForbiddenException` thrown when neither `@Public()` nor `@CheckAbility()` is present |
</phase_requirements>

---

## Summary

Phase 16 extends DevCollab with workspaces, membership, and workspace-scoped RBAC. The infrastructure from Phases 14-15 is fully in place: `CaslAuthGuard` as `APP_GUARD` enforcing deny-by-default, `@CheckAbility()` and `@Public()` decorators, `PrismaService` in a shared `DatabaseModule`, and JWT in httpOnly cookie. The phase has four distinct concerns: (1) Prisma schema additions (Workspace, WorkspaceMember, InviteLink models with migration); (2) workspace CRUD API (`WorkspaceModule`); (3) time-limited single-use invite link flow; and (4) upgrading `CaslAuthGuard` to evaluate CASL rules by loading workspace membership from the database per request.

The critical architectural decision is how RBAC enforcement works. The current guard only checks `@CheckAbility()` presence (deny-by-default invariant). For workspace-scoped permissions, the guard must be made **async** and upgraded to: load the user's workspace membership role from the database, build a CASL ability, and check `ability.can(action, subject)`. The `workspaceSlug` is extracted from `request.params`. This matches the pattern used in TeamFlow's `RbacGuard` (verified in `apps/api/src/core/rbac/rbac.guard.ts`), adapted for cookie auth and workspace scope.

The `@casl/ability` 6.8.0 is already installed at monorepo root. `@casl/prisma` is also installed (version 1.6.1) but using it adds complexity without benefit here — the simple `createMongoAbility` pattern with role-based `can()/cannot()` definitions is the correct approach, identical to how TeamFlow's `AbilityFactory` works.

**Primary recommendation:** Build a `WorkspaceAbilityFactory` service that takes `(userId, workspaceSlug)`, loads the membership role from Prisma, and returns a CASL ability. Upgrade `CaslAuthGuard.canActivate()` to async, inject `WorkspaceAbilityFactory`, extract slug from params, and call `ability.can()`. Service-layer last-admin protection follows the exact pattern from TeamFlow.

---

## Standard Stack

### Core (already installed — no new packages required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@casl/ability` | 6.8.0 (monorepo root) | CASL ability builder and checker | Already installed; `AbilityBuilder` + `createMongoAbility` for role-based rules |
| `@prisma/client` | 5.22.0 (devcollab-database) | Database access for new models | Already in `packages/devcollab-database`; add new models via migration |
| `crypto` (Node built-in) | Node 20 (already in use) | `crypto.randomUUID()` for invite tokens | Built into Node.js 20+; no extra install needed |

### Supporting (already installed — no new packages required)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@nestjs/common` | 11.0.0 | Exception classes, decorators | Already in devcollab-api |
| `nestjs-zod` | 5.1.1 (monorepo root) | DTO validation | NOT currently used in devcollab-api; use plain class fields with manual validation OR add nestjs-zod consistently |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Simple role check in service layer | Full CASL ability in guard | Service-layer only means guard returns true for any authenticated user; RBAC-04 requires API-level denial — guard must do it |
| `@casl/prisma` (`createPrismaAbility`) | Plain `createMongoAbility` | `@casl/prisma` adds SQL-level filtering (useful for returning only records user can access); overkill for Phase 16's simple role-based rules — use `createMongoAbility` |
| `uuid` npm package | `crypto.randomUUID()` | Node built-in is sufficient; no extra install |

**Installation:** No new packages required. All dependencies are already in `node_modules`.

---

## Architecture Patterns

### Current State After Phase 15

```
apps/devcollab-api/src/
├── app.module.ts               # AppModule: CaslAuthGuard APP_GUARD, ConfigModule, JwtModule, DatabaseModule, AuthModule
├── main.ts                     # cookieParser() middleware, CORS for devcollab-web
├── common/decorators/
│   ├── public.decorator.ts     # @Public()
│   ├── current-user.decorator.ts  # @CurrentUser()
│   └── check-ability.decorator.ts # @CheckAbility(action, subject)
├── guards/
│   └── casl-auth.guard.ts      # Sync guard: JWT verify + @CheckAbility presence check
├── core/database/
│   ├── prisma.service.ts       # Exposes only .user accessor (needs workspace/member/invite accessors)
│   └── database.module.ts
├── auth/
│   ├── auth.controller.ts      # POST /auth/signup, /auth/login, /auth/logout, GET /auth/me
│   ├── auth.service.ts         # signup, login
│   └── strategies/jwt.strategy.ts
└── test/unit/meta/
    └── controller-coverage.spec.ts  # Meta-test: all controllers must have @Public or @CheckAbility

packages/devcollab-database/prisma/
└── schema.prisma               # User model only (id, email, name, password, createdAt, updatedAt)
```

### Phase 16 Target Structure

```
apps/devcollab-api/src/
├── app.module.ts               # ADD: WorkspaceModule
├── guards/
│   └── casl-auth.guard.ts      # UPGRADED: async, injects WorkspaceAbilityFactory, checks ability.can()
├── core/database/
│   └── prisma.service.ts       # ADD: .workspace, .workspaceMember, .inviteLink accessors
├── workspaces/
│   ├── workspaces.module.ts    # NEW
│   ├── workspaces.controller.ts # NEW: workspace CRUD + invite + member management endpoints
│   ├── workspaces.service.ts   # NEW: business logic, last-admin protection
│   ├── workspace-ability.factory.ts  # NEW: builds CASL ability from user's membership role
│   └── dto/
│       ├── create-workspace.dto.ts
│       ├── join-workspace.dto.ts
│       └── update-member-role.dto.ts

packages/devcollab-database/prisma/
└── schema.prisma               # ADD: WorkspaceRole enum, Workspace, WorkspaceMember, InviteLink models

apps/devcollab-web/app/
├── w/
│   └── [slug]/
│       ├── layout.tsx          # NEW: workspace layout (fetch workspace, provide context)
│       └── page.tsx            # NEW: workspace home page
└── dashboard/
    └── page.tsx                # UPDATE: add "Create Workspace" and list workspaces
```

### Pattern 1: Prisma Schema for Workspaces

**What:** Three new models added to `packages/devcollab-database/prisma/schema.prisma`.
**When to use:** Run `prisma migrate dev` to generate migration and regenerate client.

```prisma
// Source: Verified against Prisma docs + TeamFlow schema pattern

enum WorkspaceRole {
  Admin
  Contributor
  Viewer
}

model Workspace {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members     WorkspaceMember[]
  inviteLinks InviteLink[]

  @@index([slug])
}

model WorkspaceMember {
  id          String        @id @default(cuid())
  role        WorkspaceRole @default(Contributor)
  joinedAt    DateTime      @default(now())

  userId      String
  workspaceId String

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
  @@index([userId])
  @@index([workspaceId])
}

model InviteLink {
  id          String    @id @default(cuid())
  token       String    @unique
  expiresAt   DateTime
  usedAt      DateTime?
  createdAt   DateTime  @default(now())

  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([workspaceId])
}
```

**IMPORTANT:** Add relation back-references on `User` model:
```prisma
model User {
  // ... existing fields ...
  workspaceMemberships WorkspaceMember[]
}
```

### Pattern 2: WorkspaceAbilityFactory (CASL)

**What:** Injectable service that loads user's workspace role from DB and builds a CASL ability.
**When to use:** Injected into `CaslAuthGuard` and `WorkspacesService`.

```typescript
// Source: Based on TeamFlow AbilityFactory pattern (apps/api/src/core/rbac/ability.factory.ts)
// Adapted for workspace-scoped roles

import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { PrismaService } from '../core/database/prisma.service';

type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';
type Subject = 'Workspace' | 'WorkspaceMember' | 'InviteLink' | 'Post' | 'Snippet' | 'Comment' | 'all';

export type AppAbility = MongoAbility<[Action, Subject]>;

@Injectable()
export class WorkspaceAbilityFactory {
  constructor(private readonly prisma: PrismaService) {}

  async createForUserInWorkspace(
    userId: string,
    workspaceSlug: string,
  ): Promise<AppAbility | null> {
    // Load workspace by slug
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
      select: { id: true },
    });

    if (!workspace) return null;

    // Load user's membership
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: workspace.id },
      },
      select: { role: true },
    });

    if (!membership) return null;

    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (membership.role === 'Admin') {
      can('manage', 'all');
    } else if (membership.role === 'Contributor') {
      can('read', 'all');
      can('create', 'Post');
      can('create', 'Snippet');
      can('create', 'Comment');
      can('update', 'Post');
      can('update', 'Snippet');
      can('update', 'Comment');
      // Cannot manage workspace or members
      cannot('manage', 'Workspace');
      cannot('manage', 'WorkspaceMember');
      cannot('create', 'InviteLink');
    } else if (membership.role === 'Viewer') {
      can('read', 'all');
      cannot('create', 'all');
      cannot('update', 'all');
      cannot('delete', 'all');
    } else {
      cannot('manage', 'all');
    }

    return build();
  }
}
```

### Pattern 3: Upgraded CaslAuthGuard (Async + Ability Evaluation)

**What:** `CaslAuthGuard` upgraded from sync to async. Loads user's workspace ability when `workspaceSlug` param is present. Checks `ability.can(action, subject)`.
**When to use:** Guard runs on every request as `APP_GUARD`.

```typescript
// Source: Extended from existing apps/devcollab-api/src/guards/casl-auth.guard.ts
// Pattern: async canActivate with DB lookup (verified as valid NestJS pattern)

@Injectable()
export class CaslAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private workspaceAbilityFactory: WorkspaceAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.['devcollab_token'];
    if (!token) throw new UnauthorizedException('No authentication token');

    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    request.user = payload;

    const abilityReq = this.reflector.getAllAndOverride<{ action: string; subject: string }>(
      CHECK_ABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!abilityReq) {
      throw new ForbiddenException('Endpoint must declare @CheckAbility — deny-by-default');
    }

    // If no workspaceSlug in params, the endpoint is workspace-agnostic.
    // Return true — the service layer handles further authorization.
    const workspaceSlug: string | undefined = request.params?.slug;
    if (!workspaceSlug) return true;

    // Workspace-scoped: build ability and check
    const ability = await this.workspaceAbilityFactory.createForUserInWorkspace(
      payload.sub,
      workspaceSlug,
    );

    if (!ability) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    const allowed = ability.can(abilityReq.action as Action, abilityReq.subject as Subject);
    if (!allowed) {
      throw new ForbiddenException(
        `Forbidden: cannot ${abilityReq.action} ${abilityReq.subject} in this workspace`,
      );
    }

    return true;
  }
}
```

**CRITICAL NOTE:** `WorkspaceAbilityFactory` depends on `PrismaService`. Since `CaslAuthGuard` is provided as `APP_GUARD`, `WorkspaceAbilityFactory` and `DatabaseModule` must be importable at `AppModule` level. Register `WorkspaceAbilityFactory` as a provider in `AppModule` (or in a shared `WorkspacesModule` that is imported by `AppModule`).

### Pattern 4: Invite Link Flow

**What:** Admin generates a UUID token stored in DB with 72h expiry. User POSTs token to join.
**When to use:** POST /workspaces/:slug/invite-links, POST /workspaces/join.

```typescript
// Source: Based on time-limited token patterns verified via WebSearch (prisma expiresAt pattern)
// crypto.randomUUID() is Node.js 20 built-in — no import needed

// Generate invite link
async generateInviteLink(workspaceId: string, adminUserId: string): Promise<InviteLink> {
  // Verify caller is Admin (service-layer check)
  const membership = await this.prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: adminUserId, workspaceId } },
  });
  if (!membership || membership.role !== 'Admin') {
    throw new ForbiddenException('Only Admins can generate invite links');
  }

  return this.prisma.inviteLink.create({
    data: {
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
      workspaceId,
    },
  });
}

// Consume invite link
async joinWorkspace(token: string, userId: string): Promise<WorkspaceMember> {
  const invite = await this.prisma.inviteLink.findUnique({ where: { token } });

  if (!invite) throw new NotFoundException('Invite link not found');
  if (invite.usedAt !== null) throw new BadRequestException('Invite link already used');
  if (invite.expiresAt < new Date()) throw new BadRequestException('Invite link expired');

  // Mark as used
  await this.prisma.inviteLink.update({
    where: { id: invite.id },
    data: { usedAt: new Date() },
  });

  // Create membership (Contributor by default; throws P2002 if already member)
  try {
    return await this.prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId: invite.workspaceId,
        role: 'Contributor',
      },
    });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      throw new ConflictException('Already a member of this workspace');
    }
    throw e;
  }
}
```

### Pattern 5: Last-Admin Protection

**What:** Before removing or demoting a member, count remaining Admins. Throw `BadRequestException` if count would reach zero.
**When to use:** `WorkspacesService.removeMember()` and `WorkspacesService.updateMemberRole()`.

```typescript
// Source: Directly from TeamFlow teams.service.ts (verified) adapted for WorkspaceMember model

async removeMember(workspaceId: string, targetUserId: string, requesterId: string) {
  // Verify requester is Admin
  const requesterMembership = await this.prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: requesterId, workspaceId } },
  });
  if (!requesterMembership || requesterMembership.role !== 'Admin') {
    throw new ForbiddenException('Only Admins can remove members');
  }

  const targetMembership = await this.prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });
  if (!targetMembership) throw new NotFoundException('Member not found');

  // Last-admin protection
  if (targetMembership.role === 'Admin') {
    const adminCount = await this.prisma.workspaceMember.count({
      where: { workspaceId, role: 'Admin' },
    });
    if (adminCount === 1) {
      throw new BadRequestException('Cannot remove the last Admin from a workspace');
    }
  }

  await this.prisma.workspaceMember.delete({ where: { id: targetMembership.id } });
  return { success: true };
}
```

### Pattern 6: Next.js 15 Workspace Route

**What:** Dynamic `[slug]` route under `app/w/` for workspace pages. Params is a Promise in Next.js 15.
**When to use:** All workspace-scoped pages.

```typescript
// Source: Official Next.js 15 docs (https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes)
// Verified 2026-02-11

// apps/devcollab-web/app/w/[slug]/page.tsx
export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // CRITICAL: params is a Promise in Next.js 15
  return <div>Workspace: {slug}</div>;
}

// apps/devcollab-web/app/w/[slug]/layout.tsx
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // fetch workspace data here if needed
  return (
    <div>
      <nav>Workspace: {slug}</nav>
      {children}
    </div>
  );
}
```

### Pattern 7: API Endpoint Design for WorkspacesController

```typescript
// Source: Derived from requirements WORK-01 through WORK-05, RBAC-01 through RBAC-04

@Controller('workspaces')
export class WorkspacesController {
  // WORK-01: Create workspace
  @CheckAbility('create', 'Workspace')
  @Post()
  create(@Body() dto: CreateWorkspaceDto, @CurrentUser() user: JwtPayload) {}

  // WORK-01: List user's workspaces
  @CheckAbility('read', 'Workspace')
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {}

  // WORK-01: Get workspace by slug
  @CheckAbility('read', 'Workspace')
  @Get(':slug')
  findOne(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {}

  // WORK-02: Generate invite link (Admin only — guard checks via WorkspaceAbilityFactory)
  @CheckAbility('create', 'InviteLink')
  @Post(':slug/invite-links')
  generateInviteLink(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {}

  // WORK-03: Join workspace via token (no slug param — token identifies workspace)
  @CheckAbility('create', 'WorkspaceMember')
  @Post('join')
  joinWorkspace(@Body() dto: JoinWorkspaceDto, @CurrentUser() user: JwtPayload) {}

  // WORK-04: List members
  @CheckAbility('read', 'WorkspaceMember')
  @Get(':slug/members')
  listMembers(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {}

  // WORK-04: Update member role (Admin only)
  @CheckAbility('update', 'WorkspaceMember')
  @Patch(':slug/members/:userId/role')
  updateMemberRole(
    @Param('slug') slug: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {}

  // WORK-05 + WORK-04: Remove member (Admin only)
  @CheckAbility('delete', 'WorkspaceMember')
  @Delete(':slug/members/:userId')
  removeMember(
    @Param('slug') slug: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {}
}
```

**NOTE on `POST /workspaces/join`:** This endpoint has no `:slug` param, so the guard will NOT run WorkspaceAbilityFactory (per Pattern 3). It only checks: is the user authenticated and is `@CheckAbility` present? The service layer validates the invite token and membership separately. This is correct behavior — anyone authenticated can attempt to join.

**NOTE on `POST /workspaces`:** Same — no `:slug` param, so guard allows any authenticated user through. The service layer always creates the creator as Admin. No additional gate needed.

### Pattern 8: PrismaService Accessor Additions

```typescript
// apps/devcollab-api/src/core/database/prisma.service.ts
// Add new accessors for Phase 16 models

get workspace() { return this.client.workspace; }
get workspaceMember() { return this.client.workspaceMember; }
get inviteLink() { return this.client.inviteLink; }
```

### Pattern 9: WorkspacesModule Structure

```typescript
// apps/devcollab-api/src/workspaces/workspaces.module.ts

@Module({
  imports: [DatabaseModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceAbilityFactory],
  exports: [WorkspaceAbilityFactory], // exported so AppModule can register it for the guard
})
export class WorkspacesModule {}
```

```typescript
// apps/devcollab-api/src/app.module.ts (additions)
// Import WorkspacesModule; guard now needs WorkspaceAbilityFactory

@Module({
  imports: [
    // ... existing imports ...
    WorkspacesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CaslAuthGuard,
    },
  ],
})
export class AppModule {}
```

**IMPORTANT:** Because `CaslAuthGuard` is a global guard and injects `WorkspaceAbilityFactory`, that factory must be provided at `AppModule` scope. Since `WorkspacesModule` exports it, importing `WorkspacesModule` in `AppModule` is sufficient.

### Anti-Patterns to Avoid

- **Synchronous guard:** The existing guard is sync. Workspace RBAC requires a DB lookup — `canActivate` must return `Promise<boolean>`. If left sync, it cannot await the Prisma call.
- **Checking ability in controller only:** RBAC-04 requires API-level denial. Do not move the ability check exclusively into service methods — the guard must enforce it.
- **Using `createPrismaAbility` for simple roles:** `@casl/prisma` is overkill for Admin/Contributor/Viewer role-based rules without field-level conditions. Use `createMongoAbility` from `@casl/ability` (already installed).
- **Forgetting the JOIN endpoint has no slug:** `POST /workspaces/join` has no `:slug` param — the guard skips `WorkspaceAbilityFactory` for it intentionally. Do not add slug to this endpoint.
- **Not updating meta-test:** `controller-coverage.spec.ts` lists `ALL_CONTROLLERS` manually. Add `WorkspacesController` to it or the meta-test won't cover it.
- **Slug collision not handled:** The service must check `@unique` slug conflicts and throw `ConflictException` with a clear message (Prisma error code P2002).
- **Invite link not marked used atomically:** Mark `usedAt` before creating the membership to prevent race conditions. If membership creation fails, the link is consumed — acceptable for simplicity.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom random string | `crypto.randomUUID()` (Node built-in) | Cryptographically secure, no install needed, available in Node 20+ |
| Ability building | Custom role-checking logic | `AbilityBuilder` from `@casl/ability` | Already installed; type-safe; `can()/cannot()` DSL is idiomatic |
| Prisma unique constraint handling | Manual DB check before insert | Catch Prisma `P2002` error | Prisma throws `PrismaClientKnownRequestError` with `code: 'P2002'` — catch it and throw `ConflictException` |
| Workspace membership DB lookup | In-controller membership check | In factory + guard pipeline | Centralizes auth logic; keeps controllers thin |

**Key insight:** The CASL ability factory pattern (load role → build ability → check) is the correct abstraction. Do not scatter `if (membership.role === 'Admin')` checks across controllers — put them in the factory.

---

## Common Pitfalls

### Pitfall 1: Guard Circular Dependency

**What goes wrong:** `CaslAuthGuard` (in `AppModule`) injects `WorkspaceAbilityFactory` (in `WorkspacesModule`), which depends on `PrismaService` (in `DatabaseModule`). If `WorkspacesModule` imports `DatabaseModule` and `AppModule` imports both, circular dependencies can arise.
**Why it happens:** NestJS module resolution is graph-based; circular module imports cause instantiation failures.
**How to avoid:** `WorkspacesModule` imports `DatabaseModule` and exports `WorkspaceAbilityFactory`. `AppModule` imports `WorkspacesModule` only. Do not have `WorkspacesModule` import `AppModule`.
**Warning signs:** "Nest cannot create the WorkspacesModule instance" or "circular dependency" at startup.

### Pitfall 2: Next.js 15 params is a Promise

**What goes wrong:** Accessing `params.slug` synchronously in a page or layout component throws a runtime error.
**Why it happens:** Next.js 15 made `params` a Promise (breaking change from Next.js 14).
**How to avoid:** Always `await params` before destructuring: `const { slug } = await params;`
**Warning signs:** `TypeError: Cannot read properties of a Promise`.

### Pitfall 3: Last-Admin Count Race Condition

**What goes wrong:** Two concurrent requests both read `adminCount === 2` and both succeed in removing/demoting Admins, leaving zero Admins.
**Why it happens:** Count-then-delete is not atomic.
**How to avoid:** For Phase 16 scope, the simple count check is acceptable (low concurrency). If stricter guarantees needed: use Prisma's `$transaction` with `SELECT ... FOR UPDATE` (raw query). Flag as known limitation.
**Warning signs:** Admin count reaches 0 under load testing.

### Pitfall 4: Guard Skips WorkspaceAbilityFactory for Non-Slug Routes

**What goes wrong:** Assuming ALL routes go through the workspace ability check. Routes without `:slug` param (e.g., `POST /workspaces`, `POST /workspaces/join`, `GET /workspaces`) bypass the ability check in the guard.
**Why it happens:** By design — these routes are workspace-agnostic (user creates workspace, or lists their workspaces).
**How to avoid:** For `GET /workspaces` (list), filter in service to return only workspaces where user is a member. For `POST /workspaces`, any authenticated user can create. This is correct and intentional.
**Warning signs:** Incorrect assumption that only workspace members can call `POST /workspaces`.

### Pitfall 5: Invite Link Token Reuse Without usedAt Check

**What goes wrong:** Marking the invite link used with `usedAt = now()` inside the same transaction as membership creation — if membership creation fails (P2002), the link is consumed but the user isn't joined.
**Why it happens:** Non-transactional approach.
**How to avoid:** For Phase 16, accept this edge case (user can contact Admin for new link). Alternatively, use Prisma `$transaction`. Document the known limitation.
**Warning signs:** User reports "invite link expired/used" but never successfully joined.

### Pitfall 6: `createMongoAbility` vs deprecated `Ability` class

**What goes wrong:** Using `new Ability(rules)` from `@casl/ability` — this is marked as deprecated in v6.
**Why it happens:** Older tutorials use the deprecated constructor.
**How to avoid:** Use `createMongoAbility(rules)` — verified in `@casl/ability` 6.8.0 type definitions (Ability.d.ts: `@deprecated use createMongoAbility function instead`).
**Warning signs:** TypeScript deprecation warnings in IDE.

---

## Code Examples

Verified patterns from official sources and codebase inspection:

### Prisma Unique Compound Constraint for Membership

```prisma
// Source: Prisma docs https://www.prisma.io/docs/orm/prisma-schema/data-model/models
// Pattern: @@unique([userId, workspaceId]) prevents duplicate memberships

model WorkspaceMember {
  userId      String
  workspaceId String

  @@unique([userId, workspaceId])
}
```

This generates a named constraint `userId_workspaceId` usable in Prisma queries:
```typescript
// Generated by @@unique([userId, workspaceId]):
await prisma.workspaceMember.findUnique({
  where: { userId_workspaceId: { userId, workspaceId } },
});
```

### Next.js 15 Dynamic Params Access

```typescript
// Source: Official Next.js 15 docs (verified 2026-02-11)
// params is Promise<{ slug: string }> — must await

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <div>Workspace: {slug}</div>;
}
```

### CASL AbilityBuilder Pattern (createMongoAbility)

```typescript
// Source: @casl/ability 6.8.0 type definitions (verified from node_modules)
// AbilityBuilder.d.ts, Ability.d.ts — createMongoAbility is the current API

import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';

type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';
type Subject = 'Workspace' | 'WorkspaceMember' | 'all';

type AppAbility = MongoAbility<[Action, Subject]>;

const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
can('manage', 'all'); // Admin
const ability = build();
ability.can('create', 'Workspace'); // true
```

### Slug Generation Pattern (from TeamFlow)

```typescript
// Source: apps/api/src/modules/teams/teams.service.ts (verified in codebase)
const slug = name
  .toLowerCase()
  .trim()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '');
```

### Last-Admin Count Pattern (from TeamFlow)

```typescript
// Source: apps/api/src/modules/teams/teams.service.ts (verified in codebase)
const adminCount = await this.prisma.workspaceMember.count({
  where: { workspaceId, role: 'Admin' },
});
if (adminCount === 1) {
  throw new BadRequestException('Cannot remove the last Admin from a workspace');
}
```

### Invite Token Generation

```typescript
// Source: Node.js 20 crypto module (built-in, no import needed in .ts files with node types)
// Note: crypto is globalThis.crypto in Node 20+; for explicit access:
import { randomUUID } from 'crypto';

const token = randomUUID(); // e.g. '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `new Ability(rules)` from `@casl/ability` | `createMongoAbility(rules)` | CASL v6 | Use `createMongoAbility`; old constructor deprecated |
| Next.js 14 sync `params` | Next.js 15 async `params` Promise | Next.js 15.0 | Must `await params` in server components |
| Separate auth guard + RBAC guard (two guards) | Single combined guard checking both JWT + ability | TeamFlow style | Simplifies configuration; one `APP_GUARD` |

**Deprecated/outdated:**
- `Ability` class from `@casl/ability`: deprecated in v6, use `createMongoAbility`.
- Next.js synchronous params access: deprecated in Next.js 15, will be removed.

---

## Open Questions

1. **Snippet/Post subjects for RBAC-02 and RBAC-03**
   - What we know: RBAC-02 says Contributor can create/edit snippets, posts, comments. RBAC-03 says Viewer read-only.
   - What's unclear: Are Snippet and Post models being added in Phase 16 or later? The ability factory needs subjects.
   - Recommendation: Define Snippet, Post, Comment as subject strings in the ability factory now (even if models don't exist yet). The guard can check `ability.can('create', 'Post')` without the model existing. Add the actual Prisma models in a later phase.

2. **Role for `/workspaces/:slug` base route vs `/workspaces` list**
   - What we know: `GET /workspaces` lists user's workspaces (no membership check needed — filter in service). `GET /workspaces/:slug` requires user to be a workspace member.
   - What's unclear: `GET /workspaces` uses `@CheckAbility('read', 'Workspace')` but there's no slug param, so guard doesn't invoke ability factory. The service must filter to only the user's workspaces.
   - Recommendation: Guard passes through (no slug → no ability factory). Service uses `findMany({ where: { members: { some: { userId } } } })`.

3. **Web UI scope for Phase 16**
   - What we know: Success criteria mentions `/w/:slug` route, creating workspace, and join via link.
   - What's unclear: How much UI is needed? Full workspace home page or just stub?
   - Recommendation: Minimal stub: workspace home (`/w/[slug]/page.tsx`) shows name and member count. Dashboard (`/dashboard/page.tsx`) shows workspace list with "Create Workspace" form. Join page at `/join/[token]` or `/join?token=...`.

4. **devcollab-postgres Docker container not running**
   - What we know: `docker ps` shows only teamflow containers running. devcollab-postgres (port 5435) is not running.
   - What's unclear: Is there a separate devcollab docker-compose or does the main one need to be started?
   - Recommendation: Before running migrations, start devcollab services: `docker compose up devcollab-postgres devcollab-migrate -d`. The main docker-compose.yml has `devcollab-postgres` service defined.

---

## Sources

### Primary (HIGH confidence)
- **Codebase inspection**: `apps/devcollab-api/src/guards/casl-auth.guard.ts` — verified existing guard implementation
- **Codebase inspection**: `apps/devcollab-api/src/common/decorators/*.ts` — verified decorator patterns
- **Codebase inspection**: `apps/api/src/core/rbac/ability.factory.ts` — verified CASL AbilityFactory pattern (TeamFlow)
- **Codebase inspection**: `apps/api/src/modules/teams/teams.service.ts` — verified slug generation and last-admin protection
- **Codebase inspection**: `packages/database/prisma/schema.prisma` — verified Membership/Organization schema pattern
- **Codebase inspection**: `node_modules/@casl/ability/dist/types/*.d.ts` — verified `createMongoAbility` as current API, `Ability` class as deprecated
- **Official docs**: Next.js 15 Dynamic Segments — https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes (fetched 2026-02-17, version 16.1.6, last-updated 2026-02-11)
- **Official docs**: Prisma Models — https://www.prisma.io/docs/orm/prisma-schema/data-model/models (fetched 2026-02-17)

### Secondary (MEDIUM confidence)
- CASL multi-tenant workspace scoping: conditions like `{ tenantId: user.tenantId }` from "Using CASL and roles with persisted permissions" (ruleoftech.com) — pattern cross-referenced with TeamFlow codebase
- Prisma P2002 error handling: confirmed as standard pattern for unique constraint violations

### Tertiary (LOW confidence)
- Last-admin protection race condition mitigation via `$transaction` — mentioned in passing; not verified in official Prisma docs for this specific use case

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in node_modules; no new installs required
- Prisma schema additions: HIGH — verified against Prisma docs + TeamFlow schema pattern
- CASL ability factory: HIGH — verified against installed type definitions + TeamFlow reference implementation
- Invite link pattern: HIGH — standard time-limited token pattern; `crypto.randomUUID()` confirmed Node 20+ built-in
- Guard async upgrade: HIGH — NestJS guards support async `canActivate`, verified in docs
- Next.js 15 routing: HIGH — verified against official docs (2026-02-11)
- Last-admin protection: HIGH — pattern verified directly in TeamFlow codebase
- Race condition handling: LOW — mitigation strategy not verified against Prisma docs

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable stack; 30-day validity)
