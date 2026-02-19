# Phase 14: Monorepo Scaffold + Infrastructure - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold two new Turborepo apps (devcollab-web on port 3002, devcollab-api on port 3003), extend Docker Compose to run them alongside TeamFlow without breaking existing containers, isolate the Prisma database client in its own package, and install a deny-by-default CASL guard before any feature controllers exist. Auth, RBAC logic, and all feature code are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Docker Compose organization
- Extend the existing docker-compose.yml directly (add devcollab services alongside TeamFlow services in the same file)
- Both TeamFlow and DevCollab services start together with `docker compose up` — no profile separation needed
- Health checks on BOTH devcollab-api (GET /health → 200) AND devcollab-web (curl check) — visible in `docker ps` status
- `migrate` service wired with `depends_on: condition: service_completed_successfully` — devcollab-api waits for migrate to exit cleanly before starting

### Turborepo package sharing
- DevCollab apps are fully isolated from TeamFlow — no shared @repo/ui, @repo/eslint-config, or @repo/tsconfig packages
- App locations: `apps/devcollab-web` and `apps/devcollab-api` (standard Turborepo convention alongside TeamFlow)
- Prisma schema + generated client lives in `packages/devcollab-database` as its own workspace package (imported as @repo/devcollab-database); custom output path prevents overwriting TeamFlow's @prisma/client
- DevCollab apps included automatically in Turborepo pipeline tasks (turbo build runs all apps together)

### Claude's Discretion
- Docker Compose file structure (whether to extend existing file or use override — Claude decides based on existing structure)
- Docker profile strategy (all-together vs profiles — Claude decides what's most practical)
- migrate service healthcheck implementation detail
- NestJS module structure for devcollab-api scaffold
- Next.js App Router baseline structure for devcollab-web
- CI/CD pipeline trigger strategy and workflow structure
- CASL guard initial configuration and test approach

</decisions>

<specifics>
## Specific Ideas

- No specific references — open to standard Turborepo/NestJS/Next.js scaffold patterns
- The login placeholder page on devcollab-web just needs to visually confirm the app is running (no auth yet)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-monorepo-scaffold-infrastructure*
*Context gathered: 2026-02-17*
