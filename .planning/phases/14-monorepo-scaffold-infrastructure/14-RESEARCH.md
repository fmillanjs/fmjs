# Phase 14: Monorepo Scaffold + Infrastructure - Research

**Researched:** 2026-02-17
**Domain:** Turborepo monorepo scaffolding, NestJS 11, Next.js 15, Prisma multi-client, Docker Compose, CASL, GitHub Actions GHCR
**Confidence:** HIGH (based on existing codebase inspection + official docs)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Docker Compose organization:** Extend the existing docker-compose.yml directly (add devcollab services alongside TeamFlow services in the same file). Both TeamFlow and DevCollab services start together with `docker compose up` — no profile separation needed. Health checks on BOTH devcollab-api (GET /health → 200) AND devcollab-web (curl check) — visible in `docker ps` status. `migrate` service wired with `depends_on: condition: service_completed_successfully` — devcollab-api waits for migrate to exit cleanly before starting.
- **Turborepo app scaffolding:** Use `turbo gen workspace` to scaffold devcollab-web and devcollab-api from templates. devcollab-api: NestJS 11 (latest). devcollab-web: Next.js 15 (latest). No shared UI components in this phase — devcollab-web gets its own standalone components.
- **Database isolation:** `packages/devcollab-database` package holds Prisma schema and generated client. Separate Prisma client output path: `../../../node_modules/.prisma/devcollab-client` — does NOT overwrite `@prisma/client`. Schema: User (id, email, name, createdAt, updatedAt) — single table to bootstrap migrations. Seed: NO seed script in this phase.
- **Port allocations (confirmed):** devcollab-web: 3002, devcollab-api: 3003, devcollab-postgres: 5435
- **CASL guard installation:** Install @casl/ability + NestJS integration in devcollab-api. Guard registered as APP_GUARD (deny-by-default — blocks everything unless explicitly allowed). @Public() decorator to opt out. HealthController is decorated with @Public() so /health works without auth.
- **MinIO:** Add MinIO service to docker-compose in this phase (port 9002 for API, 9003 for console). No application-level MinIO integration code in this phase.
- **CI/CD:** Add build + push jobs for devcollab-web and devcollab-api to existing GitHub Actions workflows. Same pattern as TeamFlow CI/CD (build Docker image, push to GHCR). Trigger: push to main branch.
- **TypeScript:** Shared tsconfig.base.json in the monorepo root — devcollab apps extend it.
- **Testing:** No tests in this phase (testing scaffold addressed separately).

### Claude's Discretion

- Exact tsconfig structure (what to extend, what to override per app)
- NestJS module structure for devcollab-api beyond the health endpoint
- Next.js app structure beyond the login placeholder
- Prisma schema specifics (field types, index choices for the User model)
- GitHub Actions job names and step structure

### Deferred Ideas (OUT OF SCOPE)

- Auth implementation
- RBAC logic or permission definitions
- Feature modules in devcollab-api
- Shared UI component library
- Seed scripts
- Testing scaffold
- Application-level MinIO integration
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | devcollab-web (Next.js 15, port 3002) and devcollab-api (NestJS 11, port 3003) scaffold in existing Turborepo monorepo | turbo gen workspace command, NestJS/Next.js package structures, tsconfig extension |
| INFRA-02 | `packages/devcollab-database` with separate Postgres (port 5435), Prisma schema, and generated client | Prisma custom output path `../../../node_modules/.prisma/devcollab-client`, User model schema, prisma-client-js generator pattern matching existing TeamFlow package |
| INFRA-03 | Docker compose extended with devcollab-postgres, devcollab-api, devcollab-web, and MinIO services | `depends_on: condition: service_completed_successfully` migrate pattern, health checks, MinIO Docker image config |
| INFRA-04 | CI/CD extended to build and push devcollab-web and devcollab-api images to GHCR | Existing deploy.yml `build-and-push` job as template, docker/build-push-action@v5, turbo prune pattern |
</phase_requirements>

---

## Summary

This phase scaffolds two new Turborepo app workspaces (devcollab-web on Next.js 15 and devcollab-api on NestJS 11) inside the existing TeamFlow monorepo. The monorepo is an npm-workspace + Turborepo 2.8.9 setup. The existing patterns — NestJS `app.module.ts` with APP_GUARD, Dockerfile multi-stage turbo-prune builds, and `packages/database` as a workspace package — all have established conventions that devcollab mirrors, not invents.

The critical novelty in this phase is the Prisma multi-client isolation: `packages/devcollab-database` must use `output = "../../../node_modules/.prisma/devcollab-client"` in its generator block, which is the Prisma 5 (`prisma-client-js`) idiom for hosting a second generated client alongside the existing one in node_modules without collision. Importing works via `from '.prisma/devcollab-client'` (resolved from node_modules). The existing TeamFlow `packages/database` already uses the default `.prisma/client` path so the names do not clash.

The CASL deny-by-default guard pattern is already fully implemented in TeamFlow's `apps/api` — the `@Public()` decorator, `IS_PUBLIC_KEY` metadata, and `APP_GUARD` registration are the exact same pattern needed for `apps/devcollab-api`. The Docker Compose `depends_on: condition: service_completed_successfully` is a standard Compose v3.9+ feature that ensures the `devcollab-migrate` one-shot service completes before `devcollab-api` starts.

**Primary recommendation:** Copy and adapt existing TeamFlow patterns rather than building from scratch. The codebase already proves every pattern this phase needs.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| turbo | 2.8.9 (installed) | Monorepo task runner + workspace scaffolding | Already in monorepo, `turbo gen workspace` command used for scaffolding |
| @nestjs/common + core | 11.1.13 (installed) | NestJS 11 for devcollab-api | Locked decision, matches existing API |
| next | 15.5.12 (installed in web) | Next.js 15 for devcollab-web | Locked decision, matches existing web app |
| @casl/ability | 6.8.0 (installed at root) | Authorization object capabilities | Already in monorepo, deny-by-default guard |
| prisma + @prisma/client | 5.22.0 (installed) | ORM for devcollab-database | Consistent with TeamFlow's Prisma version |
| @nestjs/terminus | 11.0.0 (installed) | Health check module | Already in TeamFlow API, minimal health endpoint |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @nestjs/config | 4.0.3 (installed) | Environment variable management | devcollab-api config module |
| @nestjs/platform-express | 11.1.13 | HTTP adapter for NestJS | Default NestJS HTTP platform |
| reflect-metadata | 0.2.0 | NestJS decorator metadata | Required peer dep for NestJS |
| typescript | ~5.6.0 | Type checking | Both apps extend shared tsconfig |
| docker/build-push-action | v5 | GitHub Actions build+push | Already used in existing deploy.yml |
| docker/setup-buildx-action | v3 | GitHub Actions buildx | Already used in existing deploy.yml |
| docker/login-action | v3 | GHCR authentication | Already used in existing deploy.yml |

### Alternatives Considered (N/A — all decisions locked)
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| turbo gen workspace | Manual file creation | `turbo gen workspace` produces valid workspace with correct package.json name and Turborepo integration |
| node_modules/.prisma/devcollab-client | src/generated/prisma | The node_modules path allows imports from the package without relative path complexity in application code |

**Installation for devcollab-api:**
```bash
# Inside apps/devcollab-api after scaffolding
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config @nestjs/terminus reflect-metadata rxjs
npm install @casl/ability
npm install --save-dev @nestjs/cli typescript @types/node
```

**Installation for packages/devcollab-database:**
```bash
# Inside packages/devcollab-database
npm install @prisma/client
npm install --save-dev prisma typescript
```

---

## Architecture Patterns

### Existing Monorepo Structure (read-only, for context)
```
fernandomillan/
├── apps/
│   ├── api/                    # TeamFlow NestJS 11 API (port 3001)
│   └── web/                    # TeamFlow Next.js 15 web (port 3000)
├── packages/
│   ├── config/tsconfig/        # Shared tsconfig (base.json, nestjs.json, nextjs.json)
│   ├── database/               # TeamFlow Prisma package (@repo/database)
│   └── shared/                 # Shared types/validators (@repo/shared)
├── package.json                # npm workspaces root
├── turbo.json                  # Turborepo task config
└── docker-compose.yml          # Existing (TeamFlow services only)
```

### New Structure After Phase 14
```
fernandomillan/
├── apps/
│   ├── api/                    # TeamFlow (unchanged)
│   ├── web/                    # TeamFlow (unchanged)
│   ├── devcollab-api/          # NEW: NestJS 11, port 3003
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── health/
│   │   │       ├── health.module.ts
│   │   │       └── health.controller.ts
│   │   ├── Dockerfile
│   │   ├── nest-cli.json
│   │   ├── package.json        # name: "devcollab-api"
│   │   └── tsconfig.json
│   └── devcollab-web/          # NEW: Next.js 15, port 3002
│       ├── app/
│       │   └── page.tsx        # Login placeholder page
│       ├── Dockerfile
│       ├── next.config.ts
│       ├── package.json        # name: "devcollab-web"
│       └── tsconfig.json
└── packages/
    ├── config/                 # Unchanged
    ├── database/               # Unchanged (@repo/database, TeamFlow)
    ├── devcollab-database/     # NEW: @devcollab/database
    │   ├── prisma/
    │   │   └── schema.prisma   # User model, custom output path
    │   ├── src/
    │   │   ├── index.ts        # Exports PrismaClient from custom path
    │   │   └── client.ts       # PrismaClient singleton
    │   └── package.json        # name: "@devcollab/database"
    └── shared/                 # Unchanged
```

### Pattern 1: turbo gen workspace Scaffolding
**What:** Creates a new workspace entry with correct package.json name and directory.
**When to use:** Initial creation of devcollab-api and devcollab-web.
**Example:**
```bash
# Source: https://turborepo.dev/docs/reference/generate
# Scaffold devcollab-api as an app workspace
npx turbo gen workspace --name devcollab-api --type app

# Scaffold devcollab-web as an app workspace
npx turbo gen workspace --name devcollab-web --type app
```
Note: `turbo gen workspace` creates an empty workspace. You then manually install NestJS or Next.js packages into it. Alternatively, use `create-next-app` inside `apps/devcollab-web` and `@nestjs/cli new` inside `apps/devcollab-api` and then register them in the root package.json workspaces (they already cover `apps/*`).

### Pattern 2: Prisma Custom Output Path (Non-Conflicting Client)
**What:** Generate a second Prisma client that coexists with TeamFlow's `@prisma/client`.
**When to use:** packages/devcollab-database/prisma/schema.prisma
**Example:**
```prisma
// Source: Prisma docs + CONTEXT.md locked decision
// packages/devcollab-database/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../../../node_modules/.prisma/devcollab-client"
}

datasource db {
  provider = "postgresql"
  url      = env("DEVCOLLAB_DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}
```

```typescript
// packages/devcollab-database/src/client.ts
// Import from the custom output path
import { PrismaClient } from '.prisma/devcollab-client';

const globalForPrisma = globalThis as unknown as { devcollabPrisma: PrismaClient };

export const prisma =
  globalForPrisma.devcollabPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.devcollabPrisma = prisma;
```

```typescript
// packages/devcollab-database/src/index.ts
export { prisma } from './client';
export * from '.prisma/devcollab-client';
```

### Pattern 3: CASL Deny-by-Default APP_GUARD
**What:** Register a global guard that blocks all requests unless @Public() decorator is present. Identical pattern to TeamFlow.
**When to use:** apps/devcollab-api/src/app.module.ts
**Example:**
```typescript
// Source: Existing apps/api/src/modules/auth/decorators/public.decorator.ts
// apps/devcollab-api/src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// apps/devcollab-api/src/guards/casl-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

@Injectable()
export class CaslAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    // Deny-by-default: no @Public() means blocked
    return false;
  }
}

// apps/devcollab-api/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CaslAuthGuard } from './guards/casl-auth.guard';
import { HealthModule } from './health/health.module';

@Module({
  imports: [HealthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CaslAuthGuard, // Deny-by-default
    },
  ],
})
export class AppModule {}
```

### Pattern 4: Minimal Health Controller with @Public()
**What:** Simple GET /health returning 200. No terminus needed for bootstrap phase.
**When to use:** apps/devcollab-api/src/health/
**Example:**
```typescript
// apps/devcollab-api/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
```

### Pattern 5: Docker Compose — migrate service with depends_on
**What:** A one-shot service that runs `prisma migrate deploy` then exits; devcollab-api waits for it.
**When to use:** docker-compose.yml extension for DevCollab services.
**Example:**
```yaml
# Addition to existing docker-compose.yml

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
      - devcollab-network
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DEVCOLLAB_POSTGRES_USER}']
      interval: 10s
      timeout: 5s
      retries: 5

  devcollab-migrate:
    build:
      context: .
      dockerfile: packages/devcollab-database/Dockerfile.migrate
    depends_on:
      devcollab-postgres:
        condition: service_healthy
    networks:
      - devcollab-network
    environment:
      DEVCOLLAB_DATABASE_URL: postgresql://${DEVCOLLAB_POSTGRES_USER}:${DEVCOLLAB_POSTGRES_PASSWORD}@devcollab-postgres:5432/${DEVCOLLAB_POSTGRES_DB}

  devcollab-api:
    build:
      context: .
      dockerfile: apps/devcollab-api/Dockerfile
    container_name: devcollab-api
    restart: unless-stopped
    ports:
      - '3003:3003'
    depends_on:
      devcollab-migrate:
        condition: service_completed_successfully
    networks:
      - devcollab-network
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3003/health']
      interval: 10s
      timeout: 5s
      retries: 5

  devcollab-web:
    build:
      context: .
      dockerfile: apps/devcollab-web/Dockerfile
    container_name: devcollab-web
    restart: unless-stopped
    ports:
      - '3002:3002'
    networks:
      - devcollab-network
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3002']
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: quay.io/minio/minio
    container_name: devcollab-minio
    restart: unless-stopped
    ports:
      - '9002:9000'
      - '9003:9001'
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio-data:/data
    networks:
      - devcollab-network
    command: server /data --console-address ":9001"
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:9000/minio/health/live']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  devcollab-pgdata:
  minio-data:

networks:
  devcollab-network:
    driver: bridge
```

### Pattern 6: Dockerfile for devcollab-api (turbo prune pattern)
**What:** Multi-stage Dockerfile using `turbo prune devcollab-api --docker` pattern identical to existing API.
**When to use:** apps/devcollab-api/Dockerfile
**Example:**
```dockerfile
# Source: Existing apps/api/Dockerfile (adapted)
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune devcollab-api --docker

FROM node:20-alpine AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci

FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/node_modules ./node_modules
RUN npx prisma generate --schema=packages/devcollab-database/prisma/schema.prisma
RUN npx turbo build --filter=devcollab-api

FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat curl
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs
COPY --from=builder --chown=nestjs:nestjs /app/apps/devcollab-api/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/packages ./packages
USER nestjs
EXPOSE 3003
ENV PORT=3003
CMD ["node", "dist/main.js"]
```

### Pattern 7: GitHub Actions — CI/CD job additions
**What:** Add `build-and-push-devcollab` job to existing deploy.yml, same pattern as existing `build-and-push`.
**When to use:** .github/workflows/deploy.yml
**Example:**
```yaml
  build-and-push-devcollab:
    name: Build and Push DevCollab Docker Images
    runs-on: ubuntu-latest
    needs: [test]
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

### Pattern 8: tsconfig for devcollab apps
**What:** Each devcollab app extends the existing `packages/config/tsconfig/nestjs.json` or `nextjs.json`. The root `tsconfig.base.json` mentioned in CONTEXT.md maps to the existing `packages/config/tsconfig/base.json`.
**When to use:** tsconfig.json in each devcollab app.
**Example:**
```json
// apps/devcollab-api/tsconfig.json — extends existing nestjs.json
{
  "extends": "../../packages/config/tsconfig/nestjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "outDir": "dist",
    "paths": {
      "@/*": ["src/*"],
      "@devcollab/database": ["../../packages/devcollab-database/src"],
      "@devcollab/database/*": ["../../packages/devcollab-database/src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}

// apps/devcollab-web/tsconfig.json — extends existing nextjs.json
{
  "extends": "../../packages/config/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Pattern 9: Dockerfile.migrate for devcollab-database
**What:** A lightweight image that runs `prisma migrate deploy` and exits (one-shot).
**When to use:** packages/devcollab-database/Dockerfile.migrate
**Example:**
```dockerfile
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY packages/devcollab-database/prisma ./prisma
COPY node_modules ./node_modules
ENV DEVCOLLAB_DATABASE_URL=${DEVCOLLAB_DATABASE_URL}
CMD ["npx", "prisma", "migrate", "deploy", "--schema=./prisma/schema.prisma"]
```
Note: A simpler alternative is to use a plain `node:20-alpine` image in docker-compose with a `command:` that calls `npx prisma migrate deploy` using the checked-out packages, avoiding a separate Dockerfile entirely.

### Anti-Patterns to Avoid
- **Using the same `@prisma/client` import in devcollab-database:** Must import from `.prisma/devcollab-client` not `@prisma/client` or it will use TeamFlow's generated client types.
- **Using `service_started` condition instead of `service_completed_successfully`:** `service_started` only waits for the container to start, not for the migration process to complete. Always use `service_completed_successfully` for one-shot migrate services.
- **Sharing a network between TeamFlow and DevCollab services:** Both stacks are in the same docker-compose.yml but use separate named networks (teamflow-network vs devcollab-network) to prevent accidental cross-service discovery.
- **Registering APP_GUARD without @Public() on HealthController:** Without `@Public()`, the health endpoint will return 403 because the deny-by-default guard will block it.
- **Running `turbo prune` with wrong filter name:** The filter name in `turbo prune` must exactly match the `name` field in the app's package.json (e.g., `turbo prune devcollab-api`, not `turbo prune @devcollab/api`).
- **Forgetting `curl` in the runtime Docker image:** The health check uses `curl -f http://localhost:3003/health` — the minimal Alpine image does not include curl by default. Add `apk add --no-cache curl` in the runner stage.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Health check endpoint | Custom HTTP ping handler | Simple `@Controller('health') @Get() @Public()` returning `{ status: 'ok' }` | Terminus is optional here — a plain controller suffices for this bootstrap phase |
| Deny-by-default authorization | Custom middleware with allowlist | `APP_GUARD` + `@Public()` decorator (NestJS built-in pattern) | Already proven in TeamFlow codebase; NestJS guard infrastructure handles execution context, Reflector, and metadata correctly |
| Prisma migration sequencing | Bash sleep loops | Docker Compose `depends_on: condition: service_completed_successfully` | Compose guarantees the migrate container exited 0 before starting devcollab-api |
| Package pruning for Docker builds | Copying entire monorepo | `turbo prune <app> --docker` | Produces minimal `out/json/` and `out/full/` directories with only relevant packages |
| Multiple Prisma client isolation | Separate node_modules installs | Custom `output` in generator block | Prisma supports multiple client outputs in the same node_modules via `.prisma/<name>` path |

**Key insight:** Every pattern in this phase already exists in the TeamFlow codebase. The right approach is copy-and-adapt, not build-from-scratch.

---

## Common Pitfalls

### Pitfall 1: Prisma client import path confusion
**What goes wrong:** After setting `output = "../../../node_modules/.prisma/devcollab-client"`, code tries to import from `@prisma/client` and gets TeamFlow types, or TypeScript can't find the module.
**Why it happens:** The custom output path is `.prisma/devcollab-client` (a special directory inside `node_modules`), but developers instinctively write `@prisma/client`.
**How to avoid:** Import with `import { PrismaClient } from '.prisma/devcollab-client'` (relative from within node_modules resolution). Export the fully instantiated client from `packages/devcollab-database/src/index.ts` so consuming apps never need to know the raw import path.
**Warning signs:** TypeScript error `Module '.prisma/devcollab-client' has no exported member` or models from TeamFlow appearing in devcollab-api's Prisma client.

### Pitfall 2: Docker network isolation — services can't communicate
**What goes wrong:** `devcollab-api` can't reach `devcollab-postgres` because they're on different networks, or inadvertently reaching TeamFlow's postgres.
**Why it happens:** The single docker-compose.yml has two named networks. Services only communicate with services on the same network.
**How to avoid:** Ensure both `devcollab-api`, `devcollab-migrate`, `devcollab-postgres`, `devcollab-web`, and `minio` are all placed on `devcollab-network`. TeamFlow services remain on `teamflow-network`.
**Warning signs:** `ECONNREFUSED` or `could not translate host name "devcollab-postgres" to address` in devcollab-api logs.

### Pitfall 3: `turbo prune` filter name mismatch
**What goes wrong:** Docker build fails at `RUN turbo prune devcollab-api --docker` with "no workspaces found".
**Why it happens:** The `name` field in `apps/devcollab-api/package.json` doesn't match what turbo prune expects.
**How to avoid:** Ensure `apps/devcollab-api/package.json` has `"name": "devcollab-api"` (not `@devcollab/api` or any other variant). Verify: `npx turbo prune devcollab-api --docker --dry-run`.
**Warning signs:** Empty `out/` directory after turbo prune.

### Pitfall 4: @Public() decorator missing from HealthController
**What goes wrong:** `GET /health` returns 403 Forbidden even though there's no auth token.
**Why it happens:** The deny-by-default APP_GUARD blocks all requests without explicit @Public() opt-out.
**How to avoid:** Always decorate the health controller method (or class) with `@Public()`. Test immediately after registering APP_GUARD.
**Warning signs:** Docker healthcheck fails, causing devcollab-api to show as unhealthy in `docker ps`.

### Pitfall 5: Prisma client not generated before build
**What goes wrong:** devcollab-api Dockerfile build fails with "Cannot find module '.prisma/devcollab-client'".
**Why it happens:** The builder stage must run `prisma generate` before compiling TypeScript.
**How to avoid:** Add `RUN npx prisma generate --schema=packages/devcollab-database/prisma/schema.prisma` in the builder stage before `turbo build`.
**Warning signs:** TypeScript compilation error about missing Prisma module types.

### Pitfall 6: Port collisions with existing services
**What goes wrong:** `docker compose up` fails on port binding.
**Why it happens:** TeamFlow already occupies ports 5434, 6380, 3000, 3001. The confirmed DevCollab ports (3002, 3003, 5435, 9002, 9003) must not conflict.
**How to avoid:** Verify the port map before writing docker-compose: 5434 (TeamFlow postgres), 6380 (Redis), 3000 (TeamFlow web), 3001 (TeamFlow API). DevCollab: 5435, 3002, 3003, 9002 (MinIO API), 9003 (MinIO console).
**Warning signs:** `bind: address already in use` error during `docker compose up`.

### Pitfall 7: MinIO image deprecation
**What goes wrong:** `docker pull minio/minio` gets an outdated image.
**Why it happens:** MinIO stopped updating DockerHub and Quay images in October 2025.
**How to avoid:** Use `quay.io/minio/minio` if available, or verify with `docker pull quay.io/minio/minio` before committing. The console port flag `--console-address ":9001"` is required for MinIO console to bind to a fixed port.
**Warning signs:** MinIO starts but console is unreachable at port 9003.

---

## Code Examples

### NestJS main.ts bootstrap for devcollab-api
```typescript
// apps/devcollab-api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`DevCollab API running on port ${port}`);
}

bootstrap();
```

### packages/devcollab-database/package.json
```json
{
  "name": "@devcollab/database",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "generate": "prisma generate --schema=./prisma/schema.prisma",
    "migrate:dev": "prisma migrate dev --schema=./prisma/schema.prisma",
    "migrate:deploy": "prisma migrate deploy --schema=./prisma/schema.prisma"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0"
  },
  "devDependencies": {
    "prisma": "^5.22.0",
    "typescript": "~5.6.0"
  }
}
```

### Adding devcollab-database to devcollab-api dependencies
```json
// In apps/devcollab-api/package.json dependencies:
{
  "@devcollab/database": "*"
}
```

### Next.js login placeholder page (devcollab-web)
```tsx
// apps/devcollab-web/app/page.tsx
export default function LoginPage() {
  return (
    <main>
      <h1>DevCollab</h1>
      <p>Login placeholder — auth coming in a later phase.</p>
    </main>
  );
}
```

### Next.js package.json name (devcollab-web)
```json
{
  "name": "devcollab-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start -p 3002",
    "lint": "next lint"
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prisma `prisma-client-js` generates to node_modules automatically | Prisma 6+ `prisma-client` requires explicit `output` | Prisma 6.6.0 | This phase uses Prisma 5.22.0 so `prisma-client-js` is correct; custom output is still opt-in |
| MinIO Docker Hub / Quay images updated continuously | MinIO stopped updating public registry images (Oct 2025) | Oct 2025 | Verify image availability before use; `quay.io/minio/minio` should still work |
| Docker Compose v2 `depends_on` with only `service_started` | `condition: service_completed_successfully` for one-shot services | Compose 3.9+ | This condition is the correct tool for the migrate-then-start pattern |

**Deprecated/outdated:**
- `turbo prune --scope` flag: Older Turborepo documentation used `--scope`. Turborepo 2.x uses `turbo prune <app-name>` without the `--scope` flag.
- `docker-compose` (v1 Python CLI): The existing CI uses `docker-compose` (hyphenated). Modern Docker ships `docker compose` (space). Both work in GitHub Actions runner; keep consistency with existing workflow.

---

## Open Questions

1. **How exactly does devcollab-migrate get the Prisma CLI?**
   - What we know: The migrate service needs `npx prisma migrate deploy` and the schema file.
   - What's unclear: Whether a dedicated `Dockerfile.migrate` is better than using an inline `command:` with a node image in docker-compose.
   - Recommendation: Use an inline approach in docker-compose with a pre-built node image + volume-mount of the schema, OR build a tiny migrate image. The turbo prune approach for the migrate service is cleanest but adds complexity. Simplest: use `image: node:20-alpine` + `command: sh -c "npm install prisma && npx prisma migrate deploy"` with the schema path mounted or included. Planner should decide the exact approach.

2. **Should devcollab-web Dockerfile use the turbo prune pattern or create-next-app standalone output?**
   - What we know: Existing `apps/web/Dockerfile` uses `turbo prune web --docker` + standalone Next.js output.
   - What's unclear: Whether the new devcollab-web Dockerfile should follow the same pattern exactly.
   - Recommendation: Yes — follow the identical pattern used by `apps/web/Dockerfile` but with `turbo prune devcollab-web`.

3. **CONTEXT.md mentions a tsconfig.base.json in the monorepo root — does one need to be created?**
   - What we know: The monorepo root does NOT currently have a `tsconfig.base.json`. The shared tsconfig lives in `packages/config/tsconfig/base.json`.
   - What's unclear: Whether "shared tsconfig.base.json in the monorepo root" means creating a new root-level file or using the existing packages/config path.
   - Recommendation: Create a root-level `tsconfig.base.json` that extends `./packages/config/tsconfig/base.json` so devcollab apps can use `"extends": "../../tsconfig.base.json"` for cleaner path resolution.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase at `/home/doctor/fernandomillan` — read directly, all patterns confirmed
- `apps/api/src/modules/auth/decorators/public.decorator.ts` — @Public() decorator implementation
- `apps/api/src/app.module.ts` — APP_GUARD registration pattern
- `apps/api/Dockerfile` — turbo prune multi-stage pattern
- `packages/database/prisma/schema.prisma` — generator block format (prisma-client-js)
- `docker-compose.yml` — existing service structure, network naming
- `.github/workflows/deploy.yml` — existing CI/CD pattern (docker/build-push-action@v5)
- `packages/config/tsconfig/` — base.json, nestjs.json, nextjs.json

### Secondary (MEDIUM confidence)
- https://turborepo.dev/docs/reference/generate — turbo gen workspace --name --type --copy flags
- https://turborepo.dev/docs/guides/frameworks/nextjs — create-next-app approach for adding Next.js to Turborepo
- https://docs.docker.com/reference/compose-file/services/ — `depends_on: condition: service_completed_successfully` verified
- https://hub.docker.com/r/minio/minio — MinIO Docker image, ports 9000/9001, command syntax

### Tertiary (LOW confidence)
- MinIO image deprecation (Oct 2025) — reported in WebSearch, not independently verified with official MinIO docs
- Prisma 6+ mandatory output field — mentioned in WebSearch; not verified against Prisma 5.22.0 (which this project uses and which does not require it)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed from installed node_modules and existing package.json files
- Architecture: HIGH — all patterns directly copied from existing TeamFlow codebase; no new patterns introduced
- Pitfalls: MEDIUM — port collision and Docker networking pitfalls verified from existing compose file; Prisma custom output path pitfall verified from Prisma docs; MinIO deprecation is LOW

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (30 days — stable tech; Turborepo and NestJS APIs are stable)
