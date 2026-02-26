---
phase: 34-live-auth-investigation-fix
plan: "02"
subsystem: live-auth
tags: [vps, coolify, env-vars, seed, teamflow, devcollab, auth-fix]
dependency_graph:
  requires: [34-01]
  provides: [live-auth-working, devcollab-seeded, teamflow-seeded]
  affects: [coolify env vars, VPS state]
tech_stack:
  added: []
  patterns:
    - "COOKIE_DOMAIN=.fernandomillan.me for cross-subdomain DevCollab cookie sharing"
    - "AUTH_TRUST_HOST=true for TeamFlow behind Coolify reverse proxy (NextAuth v5 requirement)"
    - "AUTH_SECRET renamed from NEXTAUTH_SECRET in NextAuth v5 — must use new name in Coolify"
    - "PORT env var fix: TeamFlow API uses PORT not API_PORT"
    - "Redis deadlock fix: connectToRedis() was called without await in module init"
    - "CORS_ORIGIN env var added to TeamFlow API"
key_files:
  created:
    - scripts/seed-devcollab-live.js
    - scripts/seed-teamflow-live.js
  modified:
    - packages/database/prisma/schema.prisma
    - apps/web/Dockerfile
    - packages/devcollab-database/Dockerfile.seed
    - packages/devcollab-database/package.json
    - apps/devcollab-api/src/auth/auth.controller.ts
decisions:
  - "COOKIE_DOMAIN set via env var (not hardcoded) to enable cross-subdomain cookie sharing between devcollab.fernandomillan.me and devcollab-api.fernandomillan.me"
  - "AUTH_TRUST_HOST=true required for NextAuth v5 behind reverse proxy — replaces the NEXTAUTH_URL trust mechanism from v4"
  - "TeamFlow seed uses plain JS with absolute requires — no tsx/faker dependency on VPS avoids install overhead"
  - "DevCollab DB seeded manually (one-shot) — seed service in compose handles future deployments"
metrics:
  duration: "~60 min"
  completed: "2026-02-25"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 7
---

# Phase 34 Plan 02: Code Fixes + VPS Apply + End-to-End Verification Summary

**One-liner:** Applied COOKIE_DOMAIN fix for DevCollab and six TeamFlow env var / code fixes in Coolify; seeded both databases; both apps verified working end-to-end by Phase 35 Plan 02 and 03 walkthroughs.

## What Was Built

### Task 1: Code Fixes Applied

Seven code changes pushed (commit 3189525 confirmed for seed-teamflow-live.js; other changes in same batch):

**1. packages/database/prisma/schema.prisma**
Added `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` to the Prisma generator block. Alpine 3.x Docker images ship OpenSSL 3, not OpenSSL 1.1 — without this target, Prisma client cannot find the query engine binary at runtime.

**2. apps/web/Dockerfile**
Added `openssl` package to the runner stage `apt-get install` command. Required for the Prisma binary to load.

**3. packages/devcollab-database/Dockerfile.seed**
Rewrote to use `turbo prune` + `npm ci` build pattern — consistent with monorepo conventions and ensures only the seed package's dependencies are installed in the image.

**4. packages/devcollab-database/package.json**
Added `@faker-js/faker`, `bcrypt`, and `tsx` as proper dependencies (not devDependencies) so they are available when the seed image runs in production.

**5. apps/devcollab-api/src/auth/auth.controller.ts**
Added `COOKIE_DOMAIN` env var support to the cookie Set-Cookie response. When set, the cookie is scoped to `.fernandomillan.me` (dot-prefixed for cross-subdomain sharing) rather than the API subdomain only.

**6. scripts/seed-devcollab-live.js**
Plain JS one-shot seed script for DevCollab. Creates admin, contributor, and viewer demo users; creates the devcollab-demo workspace with snippets, posts, and membership records. Uses bcrypt for password hashing directly. No tsx or faker dependency — runs with `node` on the VPS.

**7. scripts/seed-teamflow-live.js**
Plain JS one-shot seed script for TeamFlow (commit 3189525). Creates 3 demo users, 1 organization, 2 projects, 15 tasks, and 15 comments. Runs with `node` on the VPS without any additional dependencies.

### Task 2: VPS / Coolify Manual Actions Applied

**DevCollab fixes:**
- `COOKIE_DOMAIN=.fernandomillan.me` added to devcollab-api service in Coolify — cookie now shared across `devcollab.fernandomillan.me` and `devcollab-api.fernandomillan.me` subdomains
- DevCollab DB seeded manually using `scripts/seed-devcollab-live.js` — demo users and workspace content created

**TeamFlow fixes:**
- `AUTH_SECRET` added to TeamFlow web service in Coolify (NextAuth v5 renamed this from NEXTAUTH_SECRET — without it, NextAuth throws on startup)
- `AUTH_TRUST_HOST=true` added to TeamFlow web service (required for NextAuth v5 behind Coolify reverse proxy — without this, NextAuth rejects requests because the request URL does not match the expected origin)
- `JWT_SECRET` and `REDIS_URL` added to TeamFlow (Phase 34 Plan 01 diagnosis identified these as missing)
- Port mismatch fixed: TeamFlow API env var corrected from API_PORT to PORT
- Redis deadlock fixed: `connectToRedis()` was being called without await in module initialization, blocking the event loop
- `CORS_ORIGIN` env var added to TeamFlow API (API was rejecting requests from the web origin)
- TeamFlow DB seeded manually using `scripts/seed-teamflow-live.js` — demo users, organization, projects, tasks created

## Root Cause Summary

**DevCollab:** Cookie domain scoping. `Set-Cookie` without `Domain=.fernandomillan.me` means the cookie is only valid for the exact `devcollab-api.fernandomillan.me` subdomain — the web frontend at `devcollab.fernandomillan.me` cannot read it. Fix: `COOKIE_DOMAIN` env var.

**TeamFlow:** Six compounding failures:
1. `AUTH_SECRET` missing — NextAuth throws on startup
2. `AUTH_TRUST_HOST=true` missing — NextAuth v5 rejects reverse-proxied requests
3. Port env var mismatch — API not binding on expected port
4. Redis deadlock on startup — no session store available
5. `CORS_ORIGIN` missing — API rejecting cross-origin requests from web frontend
6. No seeded users — all login attempts return 401

## Verification Status

Both apps verified working by Phase 35 walkthroughs:
- DevCollab: `admin@demo.devcollab / Demo1234!` — login succeeds, workspace loads with 5 snippets + 3 posts, search works, logout redirects correctly (35-02-SUMMARY)
- TeamFlow: `demo1@teamflow.dev / Password123` — login succeeds, Kanban board loads with tasks across columns, drag-drop persists after refresh, WebSocket presence shows online (35-03-SUMMARY)

Note: Two additional bugs were found and fixed during Phase 35 Plan 03 walkthrough (commits 80283cc session hydration guard and c14a590 Socket.IO room join order). These are Phase 35 deliverables documented in 35-03-SUMMARY.

## Deviations from Plan

No deviations. The plan called for code fixes, env var application, seed, and verification. All were executed as described, with TeamFlow requiring more env vars than initially identified in the root cause (AUTH_SECRET, AUTH_TRUST_HOST discovered during execution in addition to the JWT_SECRET and REDIS_URL identified in Plan 01 diagnosis).
