# Architecture Research: DevCollab Monorepo Integration

**Domain:** Developer Collaboration Platform — Turborepo Monorepo Integration
**Researched:** 2026-02-17
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Turborepo Monorepo (teamflow)                          │
│                                                                                     │
│  ┌─────────────────────────┐    ┌─────────────────────────┐                         │
│  │      apps/web           │    │   apps/devcollab-web    │                         │
│  │   Next.js 15 + Auth v5  │    │     Next.js 15          │                         │
│  │   Portfolio + TeamFlow  │    │    DevCollab frontend   │                         │
│  │   Port: 3000            │    │    Port: 3002           │                         │
│  └───────────┬─────────────┘    └──────────┬──────────────┘                         │
│              │ REST+WS                      │ REST+WS                               │
│  ┌─────────────────────────┐    ┌─────────────────────────┐                         │
│  │      apps/api           │    │   apps/devcollab-api    │                         │
│  │     NestJS 11           │    │      NestJS 11          │                         │
│  │   TeamFlow API          │    │    DevCollab API        │                         │
│  │   Port: 3001            │    │    Port: 3003           │                         │
│  └───────────┬─────────────┘    └──────────┬──────────────┘                         │
│              │                             │                                        │
├──────────────┼─────────────────────────────┼────────────────────────────────────────┤
│              │   Shared Packages           │                                        │
│  ┌───────────▼─────────────────────────────▼──────────────┐                         │
│  │  @repo/shared   │  @repo/database  │  @repo/config     │                         │
│  │  Zod schemas    │  Prisma client   │  tsconfig bases   │                         │
│  │  Types          │  TeamFlow schema │                   │                         │
│  └─────────────────────────────────────────────────────────┘                         │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                              Infrastructure Layer                                   │
│                                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────────────┐  │
│  │  teamflow-postgres   │  │  devcollab-postgres   │  │    teamflow-redis         │  │
│  │  Port: 5434          │  │  Port: 5435           │  │    Port: 6380             │  │
│  │  (existing)          │  │  (new)                │  │    (existing, shared)     │  │
│  └──────────────────────┘  └──────────────────────┘  └───────────────────────────┘  │
│                                                                                     │
│  ┌──────────────────────┐                                                           │
│  │   devcollab-minio    │                                                           │
│  │   Port: 9000/9001    │                                                           │
│  │   (new)              │                                                           │
│  └──────────────────────┘                                                           │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `apps/devcollab-web` | DevCollab frontend — workspaces, snippets, posts, file UI, notifications | Next.js 15 App Router, Shadcn UI, custom JWT auth (NOT NextAuth) |
| `apps/devcollab-api` | DevCollab backend — all business logic, file uploads, search, WS | NestJS 11, CASL RBAC, Socket.IO + Redis adapter |
| `apps/web` | Portfolio + TeamFlow (unchanged) | Existing Next.js 15 + NextAuth v5 |
| `apps/api` | TeamFlow API (unchanged) | Existing NestJS 11 |
| `@repo/shared` | Zod validators and TypeScript types shared across apps | Extended with DevCollab types in separate sub-exports |
| `@repo/database` | TeamFlow Prisma client (existing, TeamFlow only) | Prisma v5, PostgreSQL, TeamFlow schema |
| `packages/devcollab-database` | DevCollab Prisma client (new) | Prisma v5, separate PostgreSQL DB |
| `@repo/config` | tsconfig bases for Next.js and NestJS (existing, reused) | TypeScript config inheritance |

---

## Decision Records

### Decision 1: Separate Postgres Database (NOT shared DB or separate schema)

**Recommendation: Separate PostgreSQL instance for DevCollab.**

DevCollab has its own auth (separate user accounts, separate JWT secret). A shared Postgres database creates an operational coupling that contradicts this separation. Using a single DB with PostgreSQL schemas (`search_path`) would require both Prisma clients to share migration history and the same DATABASE_URL base, creating confusion for a portfolio project where the goal is to demonstrate clean separation of concerns.

**Rationale:**
- DevCollab users are not TeamFlow users — no foreign key linkage needed
- Migration drift is impossible when schemas live in completely separate DBs
- Demonstrates production-quality isolation (recruiters evaluate architecture decisions)
- Container port 5435 (host) → 5432 (container) is trivial to add to docker-compose

**Rejected alternatives:**
- Shared DB + Postgres schemas: Prisma multi-schema support works, but both apps would share `DATABASE_URL` with `?schema=` parameter, creating confusion and requiring careful orchestration of migrations
- Shared DB + prefixed tables: Defeats the purpose of Prisma's type safety, leaks TeamFlow table names into DevCollab client

### Decision 2: Separate Prisma Package (packages/devcollab-database)

**Recommendation: Create `packages/devcollab-database` alongside existing `packages/database`.**

The existing `packages/database` exports a Prisma client bound to TeamFlow's schema. DevCollab needs its own generated client from its own schema. Trying to merge both schemas into one Prisma file would require a single `DATABASE_URL` pointing at a shared server (contradicting Decision 1), or using Prisma's multi-schema feature which adds complexity without benefit given the databases are truly separate.

**Pattern (mirrors existing packages/database):**
```
packages/devcollab-database/
├── prisma/
│   ├── schema.prisma     # DevCollab models
│   └── seed.ts
├── src/
│   ├── client.ts         # PrismaClient singleton
│   └── index.ts          # exports
└── package.json          # name: "@repo/devcollab-database"
```

`apps/devcollab-api` imports `@repo/devcollab-database` only. `apps/devcollab-web` does NOT import the database package (Next.js fetches from devcollab-api via REST).

### Decision 3: Redis is Shared (reuse teamflow-redis)

**Recommendation: Both TeamFlow API and DevCollab API connect to the same Redis instance.**

Redis is stateless pub/sub — there is no data coupling concern. Both NestJS apps use Socket.IO with the Redis adapter for WebSocket broadcasting. Using separate Redis instances doubles container overhead for zero benefit. Channel namespacing (e.g., `teamflow:*` vs `devcollab:*` key prefixes) is sufficient isolation.

**DevCollab API connects via:** `DEVCOLLAB_REDIS_URL=redis://teamflow-redis:6379` (internal Docker network name).

### Decision 4: Separate JWT Secret for DevCollab Auth

**Recommendation: DevCollab uses its own `DEVCOLLAB_JWT_SECRET` env var, completely separate from TeamFlow's `JWT_SECRET`.**

This is already stated as a requirement. The devcollab-api `ConfigModule` validates `DEVCOLLAB_JWT_SECRET`. The devcollab-web frontend stores the token in httpOnly cookie or localStorage (same pattern as TeamFlow). No NextAuth required — DevCollab implements its own email/password auth in NestJS.

---

## Recommended Project Structure

### New files/directories to create (new = marked with +)

```
fernandomillan/                              # Root (existing)
├── apps/
│   ├── web/                                # Existing — no changes
│   ├── api/                                # Existing — no changes
│   ├── devcollab-web/                      # + NEW Next.js 15 app
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── signup/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── workspaces/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [slug]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       ├── snippets/
│   │   │   │   │       ├── posts/
│   │   │   │   │       └── files/
│   │   │   │   ├── notifications/page.tsx
│   │   │   │   └── search/page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                         # Shadcn components (own copy)
│   │   │   ├── workspace/
│   │   │   ├── content/
│   │   │   ├── notifications/
│   │   │   └── search/
│   │   ├── lib/
│   │   │   ├── auth.ts                     # Custom JWT client-side helpers
│   │   │   ├── api-client.ts               # Typed fetch wrapper
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   ├── package.json                    # name: "devcollab-web"
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   └── devcollab-api/                      # + NEW NestJS 11 app
│       ├── src/
│       │   ├── main.ts                     # Port 3003
│       │   ├── app.module.ts
│       │   ├── core/
│       │   │   ├── config/
│       │   │   │   └── env.validation.ts   # DEVCOLLAB_ prefixed vars
│       │   │   ├── database/
│       │   │   │   ├── prisma.service.ts   # Uses @repo/devcollab-database
│       │   │   │   └── database.module.ts
│       │   │   ├── auth/                   # JWT strategy, guards
│       │   │   ├── rbac/                   # CASL ability factory
│       │   │   └── storage/               # MinIO/S3 service
│       │   └── modules/
│       │       ├── auth/                   # Signup, login, refresh
│       │       ├── workspace/              # Workspace CRUD, membership
│       │       ├── content/                # Snippets + Posts
│       │       ├── files/                  # File upload/download
│       │       ├── threads/                # Threaded discussions
│       │       ├── search/                 # tsvector full-text search
│       │       ├── notifications/          # Mention notifications
│       │       ├── activity/               # Activity feed
│       │       └── events/                 # WebSocket gateway
│       ├── package.json                    # name: "devcollab-api"
│       ├── tsconfig.json
│       ├── tsconfig.build.json
│       ├── nest-cli.json
│       └── Dockerfile
├── packages/
│   ├── shared/                             # Existing — extend with DevCollab exports
│   │   └── src/
│   │       ├── validators/
│   │       │   └── devcollab/              # + New DevCollab Zod schemas
│   │       └── types/
│   │           └── devcollab/              # + New DevCollab TypeScript types
│   ├── database/                           # Existing TeamFlow — no changes
│   ├── devcollab-database/                 # + NEW package
│   │   ├── prisma/
│   │   │   ├── schema.prisma              # DevCollab models
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   └── index.ts
│   │   └── package.json
│   └── config/                            # Existing tsconfigs — reused as-is
├── docker-compose.yml                      # MODIFY: add devcollab services
├── docker-compose.dev.yml                  # MODIFY: add devcollab to dev container
├── turbo.json                              # MODIFY: add test task
└── .github/workflows/deploy.yml           # MODIFY: add devcollab build/push
```

---

## Architectural Patterns

### Pattern 1: Isolated NestJS Module Structure

**What:** Each DevCollab feature is a NestJS module with its own controller, service, and DTOs. Global guards (`JwtAuthGuard`, `RbacGuard`) applied at `AppModule` level — identical pattern to `apps/api`.

**When to use:** Every DevCollab feature module.

**Trade-offs:**
- Consistent with existing TeamFlow API — any developer reading both APIs can transfer knowledge immediately
- Global guards mean auth is never accidentally bypassed on new routes

**Example:**
```typescript
// apps/devcollab-api/src/app.module.ts
@Module({
  imports: [
    ConfigModule,       // validates DEVCOLLAB_ env vars
    DatabaseModule,     // provides DevCollabPrismaService
    RbacModule,         // CASL ability factory for workspace roles
    AuthModule,         // DevCollab-specific JWT (NOT NextAuth)
    WorkspaceModule,
    ContentModule,
    FilesModule,
    ThreadsModule,
    SearchModule,
    NotificationsModule,
    ActivityModule,
    EventsModule,       // WebSocket gateway
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },   // global JWT
    { provide: APP_GUARD, useClass: RbacGuard },      // global RBAC
  ],
})
export class AppModule {}
```

### Pattern 2: Turborepo Pipeline Extension

**What:** Add `test` as a cacheable pipeline task. Add `devcollab-web` and `devcollab-api` as workspace members automatically (they are discovered via `apps/*` glob).

**When to use:** Monorepo task execution.

**Trade-offs:**
- Turbo's `--filter` flag scopes builds to specific apps — CI can build only changed apps
- `outputs` for NestJS dist + Next.js `.next` are already covered by `dist/**` and `.next/**`

**Updated turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

No package.json `name` fields need changing — Turborepo discovers all `apps/*` and `packages/*` automatically via workspace glob.

### Pattern 3: Prisma Service Encapsulation (Per App)

**What:** Each NestJS app owns its own `PrismaService` that wraps the correct client. `apps/api` uses `@repo/database` (TeamFlow client). `apps/devcollab-api` uses `@repo/devcollab-database` (DevCollab client).

**When to use:** All database access in NestJS apps.

**Trade-offs:**
- Prevents accidental cross-database queries (compiler will catch import errors)
- Mirrors the established pattern in `apps/api/src/core/database/prisma.service.ts`

**Example:**
```typescript
// apps/devcollab-api/src/core/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prisma } from '@repo/devcollab-database';

@Injectable()
export class DevCollabPrismaService implements OnModuleInit, OnModuleDestroy {
  private client = prisma;

  async onModuleInit() { await this.client.$connect(); }
  async onModuleDestroy() { await this.client.$disconnect(); }

  get workspace() { return this.client.workspace; }
  get member() { return this.client.member; }
  get snippet() { return this.client.snippet; }
  get post() { return this.client.post; }
  get file() { return this.client.file; }
  get thread() { return this.client.thread; }
  get comment() { return this.client.comment; }
  get notification() { return this.client.notification; }
  get activityEvent() { return this.client.activityEvent; }
  $queryRaw = this.client.$queryRaw.bind(this.client);
  $executeRaw = this.client.$executeRaw.bind(this.client);
  $transaction = this.client.$transaction.bind(this.client);
}
```

### Pattern 4: S3-Compatible File Storage via AWS SDK v3

**What:** Use `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` with `forcePathStyle: true`. In dev, endpoint points to MinIO container. In production, endpoint points to Cloudflare R2 or AWS S3 — same code, different env vars.

**When to use:** All file upload and retrieval operations in `FilesModule`.

**Trade-offs:**
- Single code path for dev and prod (no `if (isDev) use MinIO else use S3`)
- Presigned URLs mean devcollab-web uploads directly to storage, bypassing devcollab-api bandwidth
- `@nestjs-s3` wrapper exists but is a thin wrapper — using AWS SDK directly is more reliable and maintainable

**Example:**
```typescript
// apps/devcollab-api/src/core/storage/storage.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3: S3Client;

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      region: config.get('STORAGE_REGION'),         // 'us-east-1' for MinIO
      endpoint: config.get('STORAGE_ENDPOINT'),      // http://devcollab-minio:9000 in dev
      forcePathStyle: true,                          // Required for MinIO
      credentials: {
        accessKeyId: config.get('STORAGE_ACCESS_KEY'),
        secretAccessKey: config.get('STORAGE_SECRET_KEY'),
      },
    });
  }

  async getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
    const cmd = new PutObjectCommand({
      Bucket: this.config.get('STORAGE_BUCKET'),
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3, cmd, { expiresIn: 300 });
  }
}
```

### Pattern 5: Full-Text Search via tsvector + $queryRaw

**What:** PostgreSQL `tsvector` column generated automatically via a trigger. Prisma cannot declare `tsvector` columns natively — use `Unsupported("tsvector")` in schema and manage the trigger via a custom Prisma migration SQL file.

**When to use:** `SearchModule` in devcollab-api.

**Trade-offs:**
- Native Postgres FTS is faster and simpler than adding Elasticsearch for a portfolio project
- GIN index on the tsvector column enables sub-millisecond search on thousands of records
- `$queryRaw` is safe when parameters are passed as Prisma parameterized values (prevents SQL injection)
- Prisma's `fullTextSearchPostgres` preview feature is less flexible than raw tsvector for multi-table search

**Schema pattern:**
```prisma
// packages/devcollab-database/prisma/schema.prisma
model Snippet {
  id          String    @id @default(cuid())
  title       String
  code        String    @db.Text
  description String?   @db.Text
  searchVector Unsupported("tsvector")?

  @@index([searchVector], type: Gin)  // GIN index for FTS performance
}
```

**Migration SQL (in custom migration file):**
```sql
-- Create trigger to auto-update tsvector
CREATE OR REPLACE FUNCTION update_snippet_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.code, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER snippet_search_vector_update
BEFORE INSERT OR UPDATE ON "Snippet"
FOR EACH ROW EXECUTE FUNCTION update_snippet_search_vector();
```

**Query in SearchService:**
```typescript
async search(query: string, workspaceId: string) {
  return this.prisma.$queryRaw`
    SELECT id, title, description,
           ts_rank("searchVector", plainto_tsquery('english', ${query})) AS rank
    FROM "Snippet"
    WHERE "workspaceId" = ${workspaceId}
      AND "searchVector" @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT 20
  `;
}
```

---

## Data Flow

### Request Flow (DevCollab API)

```
Browser (devcollab-web)
    ↓ HTTP Request + Bearer JWT
NestJS JwtAuthGuard (validates DEVCOLLAB_JWT_SECRET)
    ↓ sets req.user
NestJS RbacGuard (CASL — checks workspace role)
    ↓ passes if authorized
Controller (e.g., WorkspaceController)
    ↓ validates DTO via nestjs-zod
Service (e.g., WorkspaceService)
    ↓ queries
DevCollabPrismaService → PostgreSQL (devcollab-postgres:5432)
    ↓ result
Service → Controller → Response
```

### WebSocket Event Flow

```
User action in devcollab-web
    ↓ Socket.IO client emit (with JWT in handshake auth)
EventsGateway (WsAuthGuard validates token)
    ↓ business logic
Service emits event
    ↓
Redis pub/sub (via @socket.io/redis-adapter on teamflow-redis)
    ↓ broadcast to all devcollab-api instances
Socket.IO → all connected devcollab-web clients in the workspace room
```

### File Upload Flow (Presigned URL Pattern)

```
devcollab-web: POST /files/presign { filename, contentType }
    ↓
devcollab-api: FilesController → StorageService
    ↓ generates presigned URL (valid 5 min)
Response: { uploadUrl, fileKey }
    ↓
devcollab-web: PUT {uploadUrl} (direct browser → MinIO/S3, bypasses API)
    ↓ upload complete
devcollab-web: POST /files/confirm { fileKey, workspaceId }
    ↓
devcollab-api: creates File record in Postgres
    ↓
Response: File record with download URL
```

### DevCollab Auth Flow

```
POST /auth/signup { email, password, name }
    ↓ bcrypt hash password
    ↓ create User in devcollab-postgres
    ↓ sign JWT with DEVCOLLAB_JWT_SECRET
Response: { accessToken, refreshToken }

POST /auth/login { email, password }
    ↓ verify password via bcrypt
    ↓ sign JWT with DEVCOLLAB_JWT_SECRET
Response: { accessToken, refreshToken }

All subsequent requests:
Authorization: Bearer <accessToken>
    ↓ JwtAuthGuard validates DEVCOLLAB_JWT_SECRET
    ↓ req.user = { id, email, role }
```

---

## Docker Compose Integration

### Port Assignments (No Conflicts)

| Service | Container Port | Host Port | Notes |
|---------|---------------|-----------|-------|
| `teamflow-web` (apps/web) | 3000 | 3000 | Existing |
| `teamflow-api` (apps/api) | 4000 | 3001 | Existing (Dockerfile EXPOSE 4000, host 3001) |
| `devcollab-web` | 3002 | 3002 | New |
| `devcollab-api` | 3003 | 3003 | New |
| `teamflow-postgres` | 5432 | 5434 | Existing |
| `devcollab-postgres` | 5432 | 5435 | New |
| `teamflow-redis` | 6379 | 6380 | Existing — shared |
| `devcollab-minio` (API) | 9000 | 9000 | New |
| `devcollab-minio` (Console) | 9001 | 9001 | New |

### docker-compose.dev.yml additions

The existing dev compose uses a single `dev` service running the entire monorepo via `npm run dev` (Turborepo). This pattern should be extended — Turborepo's `dev` task runs all apps in parallel. Adding devcollab apps to the monorepo means they start automatically when `npm run dev` is run inside the `dev` container.

New infrastructure services to add to `docker-compose.dev.yml`:

```yaml
# Add these services to the existing docker-compose.dev.yml

devcollab-postgres:
  image: postgres:16-alpine
  container_name: devcollab-postgres
  restart: unless-stopped
  ports:
    - '5435:5432'
  environment:
    POSTGRES_USER: ${DEVCOLLAB_POSTGRES_USER}
    POSTGRES_PASSWORD: ${DEVCOLLAB_POSTGRES_PASSWORD}
    POSTGRES_DB: ${DEVCOLLAB_POSTGRES_DB}
  volumes:
    - devcollab-pgdata:/var/lib/postgresql/data
  networks:
    - teamflow-network
  healthcheck:
    test: ['CMD-SHELL', 'pg_isready -U ${DEVCOLLAB_POSTGRES_USER}']
    interval: 10s
    timeout: 5s
    retries: 5

devcollab-minio:
  image: minio/minio:latest
  container_name: devcollab-minio
  restart: unless-stopped
  ports:
    - '9000:9000'
    - '9001:9001'
  environment:
    MINIO_ROOT_USER: ${DEVCOLLAB_MINIO_ACCESS_KEY}
    MINIO_ROOT_PASSWORD: ${DEVCOLLAB_MINIO_SECRET_KEY}
  volumes:
    - devcollab-minio-data:/data
  networks:
    - teamflow-network
  command: server /data --console-address ":9001"
  healthcheck:
    test: ['CMD', 'mc', 'ready', 'local']
    interval: 10s
    timeout: 5s
    retries: 5
```

Also update the `dev` service `depends_on` to include:
```yaml
devcollab-postgres:
  condition: service_healthy
devcollab-minio:
  condition: service_healthy
```

And add volumes:
```yaml
volumes:
  devcollab-pgdata:
  devcollab-minio-data:
```

### docker-compose.dev.yml: dev service environment additions

```yaml
environment:
  # Existing vars preserved...
  - DEVCOLLAB_DATABASE_URL=${DEVCOLLAB_DATABASE_URL}
  - DEVCOLLAB_JWT_SECRET=${DEVCOLLAB_JWT_SECRET}
  - DEVCOLLAB_JWT_EXPIRES_IN=15m
  - DEVCOLLAB_STORAGE_ENDPOINT=http://devcollab-minio:9000
  - DEVCOLLAB_STORAGE_BUCKET=${DEVCOLLAB_STORAGE_BUCKET}
  - DEVCOLLAB_STORAGE_ACCESS_KEY=${DEVCOLLAB_MINIO_ACCESS_KEY}
  - DEVCOLLAB_STORAGE_SECRET_KEY=${DEVCOLLAB_MINIO_SECRET_KEY}
  - DEVCOLLAB_STORAGE_REGION=us-east-1
  - NEXT_PUBLIC_DEVCOLLAB_API_URL=${NEXT_PUBLIC_DEVCOLLAB_API_URL}
  - NEXT_PUBLIC_DEVCOLLAB_WS_URL=${NEXT_PUBLIC_DEVCOLLAB_WS_URL}
```

---

## Turborepo Pipeline

### turbo.json modifications

The existing `turbo.json` has `build`, `dev`, and `lint`. Add `test` as a cacheable task:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

DevCollab apps have `package.json` scripts matching:
- `"dev": "next dev --port 3002"` (devcollab-web)
- `"dev": "nest start --watch"` (devcollab-api)
- `"build": "next build"` / `"build": "nest build"`
- `"test": "vitest run"` (both)
- `"lint": "next lint"` / `"lint": "echo 'No lint configured yet'"`

Turborepo picks them up automatically since they are in `apps/*`.

### Turborepo filter usage (CI)

Build only DevCollab apps:
```bash
turbo build --filter=devcollab-web --filter=devcollab-api
```

Build all apps:
```bash
turbo build
```

Prune for Docker (uses `name` from package.json):
```bash
turbo prune devcollab-api --docker
turbo prune devcollab-web --docker
```

---

## NestJS DevCollab API Module Structure

```
src/
├── main.ts                          # Bootstrap, port 3003
├── app.module.ts                    # Root module
├── core/
│   ├── config/
│   │   ├── config.module.ts
│   │   └── env.validation.ts        # DEVCOLLAB_* env var schema
│   ├── database/
│   │   ├── database.module.ts
│   │   └── prisma.service.ts        # Uses @repo/devcollab-database
│   ├── auth/
│   │   ├── auth.module.ts           # JwtModule with DEVCOLLAB_JWT_SECRET
│   │   ├── jwt.strategy.ts          # passport-jwt strategy
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       └── ws-auth.guard.ts
│   ├── rbac/
│   │   ├── rbac.module.ts
│   │   ├── ability.factory.ts       # CASL — Admin/Contributor/Viewer
│   │   ├── rbac.guard.ts
│   │   └── decorators/
│   │       └── check-ability.decorator.ts
│   └── storage/
│       ├── storage.module.ts
│       └── storage.service.ts       # AWS SDK v3, MinIO-compatible
├── modules/
│   ├── auth/                        # Signup, login, refresh, profile
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── dto/
│   ├── workspace/                   # Workspace CRUD + membership
│   │   ├── workspace.module.ts
│   │   ├── workspace.controller.ts
│   │   ├── workspace.service.ts
│   │   ├── members.controller.ts
│   │   ├── members.service.ts
│   │   └── dto/
│   ├── content/                     # Snippets + Markdown posts (unified)
│   │   ├── content.module.ts
│   │   ├── snippets.controller.ts
│   │   ├── snippets.service.ts
│   │   ├── posts.controller.ts
│   │   ├── posts.service.ts
│   │   └── dto/
│   ├── files/                       # Presigned upload, confirm, list, delete
│   │   ├── files.module.ts
│   │   ├── files.controller.ts
│   │   ├── files.service.ts
│   │   └── dto/
│   ├── threads/                     # Threaded discussions on content
│   │   ├── threads.module.ts
│   │   ├── threads.controller.ts
│   │   ├── threads.service.ts
│   │   └── dto/
│   ├── search/                      # Cross-content tsvector FTS
│   │   ├── search.module.ts
│   │   ├── search.controller.ts
│   │   └── search.service.ts
│   ├── notifications/               # Mention notifications (REST + WS push)
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   └── notifications.service.ts
│   ├── activity/                    # Activity feed (workspace-scoped)
│   │   ├── activity.module.ts
│   │   ├── activity.controller.ts
│   │   └── activity.service.ts
│   └── events/                      # Socket.IO gateway
│       ├── events.module.ts
│       └── events.gateway.ts
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── pipes/
│       └── zod-validation.pipe.ts
└── health/
    ├── health.module.ts
    └── health.controller.ts
```

---

## DevCollab Prisma Schema Outline

```prisma
// packages/devcollab-database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/devcollab-client"  // separate generated client
}

datasource db {
  provider = "postgresql"
  url      = env("DEVCOLLAB_DATABASE_URL")
}

enum WorkspaceRole {
  ADMIN
  CONTRIBUTOR
  VIEWER
}

enum ContentType {
  SNIPPET
  POST
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  password      String    // bcrypt
  avatarUrl     String?
  createdAt     DateTime  @default(now())

  workspaceMemberships WorkspaceMember[]
  snippets             Snippet[]
  posts                Post[]
  threadComments       ThreadComment[]
  notifications        Notification[] @relation("NotificationRecipient")
  sentNotifications    Notification[] @relation("NotificationSender")
  activityEvents       ActivityEvent[]
}

model Workspace {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?  @db.Text
  createdAt   DateTime @default(now())

  members     WorkspaceMember[]
  snippets    Snippet[]
  posts       Post[]
  files       File[]
  threads     Thread[]
  activity    ActivityEvent[]
}

model WorkspaceMember {
  id          String        @id @default(cuid())
  userId      String
  workspaceId String
  role        WorkspaceRole @default(VIEWER)
  joinedAt    DateTime      @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
}

model Snippet {
  id           String     @id @default(cuid())
  title        String
  language     String     @default("text")
  code         String     @db.Text
  description  String?    @db.Text
  workspaceId  String
  authorId     String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  searchVector Unsupported("tsvector")?

  workspace Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  author    User            @relation(fields: [authorId], references: [id])
  thread    Thread?

  @@index([workspaceId])
  @@index([searchVector], type: Gin)
}

model Post {
  id           String     @id @default(cuid())
  title        String
  content      String     @db.Text  // Markdown
  workspaceId  String
  authorId     String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  searchVector Unsupported("tsvector")?

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  author    User      @relation(fields: [authorId], references: [id])
  thread    Thread?

  @@index([workspaceId])
  @@index([searchVector], type: Gin)
}

model File {
  id           String   @id @default(cuid())
  name         String
  key          String   @unique  // S3/MinIO object key
  contentType  String
  size         Int
  workspaceId  String
  uploadedById String
  createdAt    DateTime @default(now())

  workspace  Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
}

model Thread {
  id          String        @id @default(cuid())
  contentType ContentType   // SNIPPET or POST
  snippetId   String?       @unique
  postId      String?       @unique
  createdAt   DateTime      @default(now())

  snippet  Snippet?       @relation(fields: [snippetId], references: [id], onDelete: Cascade)
  post     Post?          @relation(fields: [postId], references: [id], onDelete: Cascade)
  comments ThreadComment[]
}

model ThreadComment {
  id        String   @id @default(cuid())
  content   String   @db.Text  // Markdown with @mention support
  threadId  String
  authorId  String
  parentId  String?  // for nested replies (1 level)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  thread  Thread        @relation(fields: [threadId], references: [id], onDelete: Cascade)
  author  User          @relation(fields: [authorId], references: [id])
  parent  ThreadComment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies ThreadComment[] @relation("CommentReplies")

  @@index([threadId])
  @@index([authorId])
}

model Notification {
  id          String   @id @default(cuid())
  type        String   // MENTION, COMMENT_REPLY, WORKSPACE_INVITE
  recipientId String
  senderId    String
  entityType  String   // Snippet, Post, Comment
  entityId    String
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())

  recipient User @relation("NotificationRecipient", fields: [recipientId], references: [id], onDelete: Cascade)
  sender    User @relation("NotificationSender", fields: [senderId], references: [id])

  @@index([recipientId, read])
}

model ActivityEvent {
  id          String   @id @default(cuid())
  workspaceId String
  actorId     String
  action      String   // SNIPPET_CREATED, POST_UPDATED, FILE_UPLOADED, MEMBER_JOINED, etc.
  entityType  String
  entityId    String
  metadata    Json?
  createdAt   DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  actor     User      @relation(fields: [actorId], references: [id])

  @@index([workspaceId, createdAt])
}
```

---

## Shared Packages: What DevCollab Reuses vs. What Is New

### Reuse from existing packages (no modifications needed)

| Package | What DevCollab reuses | How |
|---------|----------------------|-----|
| `@repo/config` | `packages/config/tsconfig/nextjs.json` and `nestjs.json` | devcollab-web and devcollab-api `tsconfig.json` extend these |
| `packages/config/tsconfig/base.json` | TypeScript base configuration | Inherited via chain |

### Extend existing packages (add without breaking)

| Package | What to add | Location |
|---------|------------|----------|
| `@repo/shared` | DevCollab Zod validators (`workspace.schema.ts`, `snippet.schema.ts`, etc.) | `packages/shared/src/validators/devcollab/` |
| `@repo/shared` | DevCollab TypeScript types (`workspace.ts`, `content.ts`, `notifications.ts`) | `packages/shared/src/types/devcollab/` |
| `@repo/shared` | DevCollab WebSocket event types | `packages/shared/src/types/devcollab/events.ts` |

Add a new export path in `packages/shared/package.json`:
```json
{
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./validators": "./src/validators/index.ts",
    "./devcollab/types": "./src/types/devcollab/index.ts",
    "./devcollab/validators": "./src/validators/devcollab/index.ts"
  }
}
```

This avoids merging DevCollab types into the main TeamFlow type exports, preventing namespace collisions.

### Do NOT reuse (DevCollab must have its own)

| Concern | Why not shared |
|---------|---------------|
| `@repo/database` (Prisma client) | Bound to TeamFlow schema — DevCollab has different models |
| `NEXTAUTH_SECRET` / `JWT_SECRET` | DevCollab auth is completely separate |
| `apps/api` modules | Separate domain, separate DB |
| `apps/web` auth providers | DevCollab uses custom JWT, not NextAuth |

---

## CI/CD: GitHub Actions Extension

### Additions to `.github/workflows/deploy.yml`

The existing workflow has `test`, `lighthouse`, `build-and-push`, and `deploy` jobs. Add:

1. **In `test` job:** Add Prisma generate for DevCollab schema, run devcollab-api tests, start devcollab-api and devcollab-postgres in docker-compose, run devcollab E2E tests.

2. **In `build-and-push` job:** Add two new steps to build and push devcollab images:
```yaml
- name: Build and push devcollab-web image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: apps/devcollab-web/Dockerfile
    push: true
    tags: |
      ghcr.io/${{ github.repository }}/devcollab-web:latest
      ghcr.io/${{ github.repository }}/devcollab-web:${{ github.sha }}
    cache-from: type=registry,ref=ghcr.io/${{ github.repository }}/devcollab-web:latest
    cache-to: type=inline

- name: Build and push devcollab-api image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: apps/devcollab-api/Dockerfile
    push: true
    tags: |
      ghcr.io/${{ github.repository }}/devcollab-api:latest
      ghcr.io/${{ github.repository }}/devcollab-api:${{ github.sha }}
    cache-from: type=registry,ref=ghcr.io/${{ github.repository }}/devcollab-api:latest
    cache-to: type=inline
```

3. **In `deploy` job:** The existing Coolify webhook triggers deployment. In Coolify, configure two additional services pointing to the new GHCR images. No workflow changes needed beyond adding a second (optional) webhook call for devcollab services if Coolify requires separate triggers.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **Portfolio (< 100 users)** | Single container each, shared Redis, separate Postgres instances. Current setup is sufficient. |
| **Growth (100–10k users)** | Add read replicas for devcollab-postgres. Redis is already a separate service so scaling is independent. MinIO can be replaced with Cloudflare R2 at this stage. |
| **Large (10k+ users)** | Horizontal scaling of devcollab-api (NestJS is stateless with Redis adapter for WS). Consider separating search to a dedicated service (Meilisearch or Typesense). |

### Scaling Priorities

1. **First bottleneck:** DevCollab Postgres under read-heavy search queries — add GIN indexes (already in schema above), add connection pooling via PgBouncer.
2. **Second bottleneck:** File storage bandwidth — switch from MinIO to Cloudflare R2 with presigned URL pattern already in place.

---

## Anti-Patterns

### Anti-Pattern 1: Merging DevCollab Into TeamFlow's Prisma Schema

**What people do:** Add DevCollab models directly to `packages/database/prisma/schema.prisma`.

**Why it's wrong:**
- TeamFlow and DevCollab have separate user tables — merging forces a single User model with conflicting fields
- Single migration history means DevCollab schema changes can break TeamFlow migrations
- Impossible to demonstrate clean "separate app" architecture for portfolio purposes

**Do this instead:** `packages/devcollab-database/` with its own schema, migrations, and Prisma client.

### Anti-Pattern 2: Single Prisma Output Directory for Both Clients

**What people do:** Have two Prisma schemas but both generate to `node_modules/@prisma/client`, causing one to overwrite the other.

**Why it's wrong:** The second `prisma generate` invocation silently overwrites the first generated client. Importing from `@prisma/client` returns only the last-generated schema's types.

**Do this instead:** Use `output` in the `generator` block of `devcollab-database` schema to generate to a custom path (e.g., `../node_modules/.prisma/devcollab-client`), then export from `packages/devcollab-database/src/index.ts`. TeamFlow's `@repo/database` continues to use the default output.

### Anti-Pattern 3: Sharing NextAuth Between Apps

**What people do:** Configure devcollab-web to use the same NextAuth instance as apps/web.

**Why it's wrong:** NextAuth sessions are scoped to the app that created them. DevCollab has different user accounts. Sharing NextAuth creates user confusion and session collisions.

**Do this instead:** DevCollab implements its own JWT auth flow in `apps/devcollab-api/src/modules/auth/`. The frontend stores the token in an httpOnly cookie (`__devcollab_token`) or secure localStorage, completely independent of NextAuth.

### Anti-Pattern 4: Running Dev Container Commands for Turbo

**What people do:** Run `npm run dev` directly on the host instead of inside the existing Docker dev container.

**Why it's wrong:** The existing `docker-compose.dev.yml` runs the entire monorepo inside a `node:20-slim` container that already connects to the teamflow-network. Running outside Docker means the devcollab-api cannot reach `devcollab-postgres` or `teamflow-redis` by their container names.

**Do this instead:** All dev commands run via `docker exec teamflow-dev npm run dev` or by adding commands to the existing dev container's startup script. New infrastructure services (devcollab-postgres, devcollab-minio) are added to `docker-compose.dev.yml` and the existing dev container's `depends_on` list.

---

## Integration Points Summary

### New Components to Create

| Component | Type | Notes |
|-----------|------|-------|
| `apps/devcollab-web` | Next.js 15 app | Port 3002 |
| `apps/devcollab-api` | NestJS 11 app | Port 3003 |
| `packages/devcollab-database` | Prisma package | Separate DB, separate client |

### Files to Modify (Existing)

| File | Change |
|------|--------|
| `docker-compose.dev.yml` | Add devcollab-postgres, devcollab-minio; extend dev service env vars and depends_on |
| `docker-compose.yml` (base) | Add devcollab-postgres, devcollab-minio volumes and services |
| `turbo.json` | Add `test` task with `dependsOn: ["^build"]` |
| `.github/workflows/deploy.yml` | Add devcollab image build steps, prisma generate for devcollab schema |
| `packages/shared/package.json` | Add `devcollab/types` and `devcollab/validators` export paths |
| `packages/shared/src/` | Add `types/devcollab/` and `validators/devcollab/` subdirectories |
| `.env.example` | Add DEVCOLLAB_* vars |

### Build Order for Phases

1. **Monorepo scaffolding** — Create app directory structures, package.json files with correct `name` fields, tsconfig.json files extending `@repo/config`, docker-compose additions. Verify Turborepo discovers new apps via `turbo ls`.
2. **Database layer** — Create `packages/devcollab-database` with schema.prisma, run first migration, seed. Verify Prisma generates without overwriting TeamFlow client.
3. **DevCollab API core** — Auth module (signup/login/JWT), ConfigModule, PrismaService, health endpoint. Verify `/api/health` responds on port 3003.
4. **DevCollab API features** — Workspace, Content (snippets/posts), Files, Threads — in dependency order.
5. **DevCollab API search + notifications** — tsvector trigger migration, SearchModule, NotificationsModule, ActivityModule, EventsGateway.
6. **DevCollab web** — All frontend screens consuming devcollab-api.
7. **Portfolio integration** — Update `apps/web` to feature DevCollab (screenshots, link to live demo).
8. **CI/CD** — Add devcollab image build steps to deploy.yml, add Coolify service configs.

---

## Sources

- [Prisma Multi-Schema Documentation](https://www.prisma.io/docs/orm/prisma-schema/data-model/multi-schema) — MEDIUM confidence (official docs, verified)
- [Prisma Multiple Databases Guide](https://www.prisma.io/docs/guides/multiple-databases) — HIGH confidence (official docs)
- [Turborepo prune reference](https://turborepo.dev/docs/reference/prune) — HIGH confidence (official docs, verified)
- [Turborepo running tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks) — HIGH confidence (official docs)
- [Prisma + NestJS Guide](https://www.prisma.io/docs/guides/nestjs) — HIGH confidence (official docs)
- [Postgres tsvector with Prisma (wanago.io)](https://wanago.io/2022/11/14/api-nestjs-text-search-tsvector-sql/) — MEDIUM confidence (verified with Prisma issue tracker)
- [Bulletproof FTS with tsvector + Prisma](https://medium.com/@chauhananubhav16/bulletproof-full-text-search-fts-in-prisma-with-postgresql-tsvector-without-migration-drift-c421f63aaab3) — MEDIUM confidence (community, verified against Prisma docs)
- Existing codebase analysis: `apps/api`, `packages/database`, `docker-compose.dev.yml`, `turbo.json`, `.github/workflows/deploy.yml` — HIGH confidence (direct code inspection)

---
*Architecture research for: DevCollab Monorepo Integration (v2.0)*
*Researched: 2026-02-17*
*Confidence: HIGH — All integration points verified via direct codebase inspection + official documentation*
