---
phase: 21-seed-data-portfolio-integration
plan: 01
subsystem: devcollab-database
tags: [seed, database, docker, demo-data]
dependency_graph:
  requires: []
  provides: [demo-workspace-seed, devcollab-seed-docker-service]
  affects: [docker-compose, devcollab-api-startup]
tech_stack:
  added: ["@faker-js/faker (seed(42) deterministic)", "bcrypt (password hashing)", "tsx (seed runner)"]
  patterns: ["idempotency guard via unique email check", "faker.seed(42) determinism", "Dockerfile.seed with prisma/ + src/ copy"]
key_files:
  created:
    - packages/devcollab-database/prisma/seed.ts
    - packages/devcollab-database/Dockerfile.seed
  modified:
    - packages/devcollab-database/package.json
    - docker-compose.yml
decisions:
  - "Separate Dockerfile.seed (not Dockerfile.migrate) needed — migrate image does not copy src/ required for relative import '../src/client'"
  - "faker.seed(42) as first statement in main() — ensures deterministic PRNG state before any faker calls"
  - "Idempotency guard checks admin@demo.devcollab unique email — exits immediately with clear message on second run"
  - "devcollab-api depends on devcollab-seed:service_completed_successfully — ensures demo data exists before API starts"
metrics:
  duration: 2 minutes
  completed: 2026-02-18
  tasks_completed: 2
  files_changed: 4
---

# Phase 21 Plan 01: Seed Data — Deterministic Demo Workspace Summary

**One-liner:** Deterministic seed script with faker.seed(42) populating 3 role-based demo users, 1 workspace, 5 multi-language snippets, 3 published posts with @mention comments and reactions, registered as docker-compose devcollab-seed service.

## What Was Built

A complete demo data seed system for the DevCollab portfolio application:

- `packages/devcollab-database/prisma/seed.ts`: Deterministic seed script using `@faker-js/faker` with `faker.seed(42)` as the first statement. Creates 3 users (admin@demo.devcollab, contributor@demo.devcollab, viewer@demo.devcollab) all with password `Demo1234!`, a `devcollab-demo` workspace with proper role assignments, 5 code snippets in TypeScript/Python/Rust/Go/SQL, 3 Published posts with @mention comments, notifications, viewer replies, reactions, and ActivityEvent records (MemberJoined, PostCreated, SnippetCreated).

- `packages/devcollab-database/Dockerfile.seed`: Separate Dockerfile for the seed service that copies both `prisma/` and `src/` directories — required because the seed script uses a relative import `../src/client` that resolves to the `src/client.ts` Prisma client singleton.

- `packages/devcollab-database/package.json`: Added `"seed": "tsx prisma/seed.ts"` script and `"prisma": { "seed": "tsx prisma/seed.ts" }` section for `prisma db seed` support.

- `docker-compose.yml`: Added `devcollab-seed` service depending on `devcollab-migrate:service_completed_successfully`. Updated `devcollab-api` to depend on `devcollab-seed:service_completed_successfully` — guarantees demo data exists before the API starts.

## Verification Results

- Seed ran successfully against live devcollab-postgres on first execution: "Seed complete — DevCollab demo workspace ready"
- Second run confirmed idempotency: "Seed already applied — skipping"
- Database confirmed: 3 demo users, devcollab-demo workspace, 5 snippets, 3 posts, 9 new activity events

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write deterministic seed script | 8ccd839 | packages/devcollab-database/prisma/seed.ts |
| 2 | Register seed in package.json and add docker-compose service | 334eb34 | packages/devcollab-database/package.json, packages/devcollab-database/Dockerfile.seed, docker-compose.yml |

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Separate Dockerfile.seed required** — Dockerfile.migrate only copies `prisma/` but not `src/`. The seed script's relative import `'../src/client'` needs `src/client.ts` to be present. Created Dockerfile.seed that copies both directories.

2. **faker.seed(42) placement** — Confirmed as first statement in `main()` function before any faker calls to guarantee deterministic output.

3. **Idempotency via unique email** — Checking `admin@demo.devcollab` by unique email is reliable because the email has a `@unique` constraint in the Prisma schema.

4. **devcollab-api startup dependency chain** — `devcollab-api` depends on both `devcollab-migrate` and `devcollab-seed` with `service_completed_successfully` conditions, ensuring migrations run first, seed runs second, API starts last.
