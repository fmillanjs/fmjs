# Pitfalls Research

**Domain:** Work Management SaaS (Next.js + NestJS + Prisma + Postgres + WebSockets)
**Researched:** 2026-02-14
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: WebSocket Authentication Bypass

**What goes wrong:**
WebSocket connections appear authenticated because they originate from authenticated pages, but the WebSocket protocol doesn't handle authorization or authentication by default. Attackers can establish WebSocket connections without proper authentication, accessing real-time data streams and bypassing RBAC entirely.

**Why it happens:**
Developers assume that opening a WebSocket from an authenticated page automatically secures the connection. NestJS guards are only invoked when there's an event from the client, not on the initial connection request. NestJS doesn't disconnect the socket when authentication fails, leaving a partially authenticated connection open.

**How to avoid:**
1. Create a custom WebSocket adapter with authentication middleware (middlewares cannot be added directly to WebSockets in NestJS)
2. Implement ticket-based authentication during handshake: validate JWT tokens from the WebSocket handshake authentication headers
3. Attach verified user data to the socket instance after successful authentication
4. Apply guards to every WebSocket event handler, not just connection
5. Explicitly disconnect sockets on authentication failure using `socket.disconnect()`

**Warning signs:**
- WebSocket events accessible without proper session validation
- Missing `@UseGuards()` decorators on WebSocket handlers
- No token validation in WebSocket gateway constructor or `afterInit()` hook
- Development testing shows "it works" but production lacks proper token verification

**Phase to address:**
Phase 1 (Authentication Foundation) - Must establish WebSocket auth patterns before building real-time features

---

### Pitfall 2: RBAC Enforcement Inconsistency (Session Identity Bleed)

**What goes wrong:**
Access checks are scattered across controllers, services, and UI components, making permission enforcement inconsistent. Some endpoints check permissions while others assume session context is trustworthy. Users can access resources by manipulating request parameters or exploiting endpoints that skip authorization checks. This creates both unproven caller identity at execution and privileged handlers accepting the wrong identity as authoritative.

**Why it happens:**
RBAC is often implemented as reactive policy checks that read from session context without re-validating identity. Developers enforce permissions in controllers but forget to verify in service layers, assuming "if they got here, they must have permission." Role changes or team membership updates don't propagate to all enforcement points, creating temporal security holes.

**How to avoid:**
1. **Single Source of Truth**: Create a centralized authorization service that all endpoints call
2. **Service-Layer Enforcement**: Never rely solely on controller guards—verify permissions at the data access layer
3. **Explicit Context Passing**: Pass verified user identity explicitly to service methods rather than reading from ambient session
4. **Policy-as-Code**: Define RBAC rules in a single location (e.g., using CASL or similar library)
5. **Decorator Pattern**: Use custom decorators like `@RequirePermission('task.update')` that enforce at multiple layers

**Warning signs:**
- Authorization logic duplicated across multiple files
- Services that read `request.user` directly without re-validation
- UI hides features but API doesn't enforce the same restrictions
- Tests pass with mocked users but production shows privilege escalation
- Role updates require deployment or cache clearing to take effect

**Phase to address:**
Phase 1 (Authentication Foundation) - Establish authorization patterns before building features that depend on them

---

### Pitfall 3: Audit Log Incompleteness

**What goes wrong:**
Audit logs capture some events but miss critical actions, making forensic analysis impossible. Common gaps: bulk operations log one entry instead of individual changes, failed permission checks aren't logged, WebSocket events bypass audit logging entirely, and context (IP address, user agent, affected resources) is missing from entries.

**Why it happens:**
Audit logging is added as an afterthought using scattered `logger.log()` calls. Developers log successful operations but forget failures, especially authentication failures and permission denials. Performance concerns lead to "we'll add that later" decisions. WebSocket and real-time events are particularly problematic because they don't flow through standard HTTP middleware.

**How to avoid:**
1. **Centralized Audit Service**: Create a dedicated audit logging service separate from application logs
2. **Decorator-Based Capture**: Use method decorators like `@AuditLog('task.update')` on service methods
3. **Complete Context**: Every entry must include: UTC timestamp, actor ID, action verb, resource type/ID, outcome (success/failure), IP address, user agent, request ID for correlation
4. **Log Failures**: Explicitly log authentication failures, authorization denials, and validation errors
5. **WebSocket Coverage**: Implement custom WebSocket middleware that wraps handlers with audit logging
6. **Bulk Operations**: For bulk actions, log individual item changes, not just the bulk request
7. **Separate Storage**: Use dedicated audit log table with append-only constraint and strict access controls

**Warning signs:**
- Audit logs that say "User 234 updated record 987" without context about what changed
- Missing entries for failed login attempts or permission denials
- Real-time collaboration changes not appearing in audit trail
- Log queries showing gaps in sequential operations
- Inability to answer "who changed this field from X to Y and when?"
- Audit logs stored in the same table as application logs
- No retention policy or log rotation strategy

**Phase to address:**
Phase 1 (Authentication Foundation) - Establish audit patterns from day one; retrofitting is extremely difficult

---

### Pitfall 4: Prisma N+1 Query Explosions

**What goes wrong:**
Loading a list of 100 items with related data executes 101 database queries (1 for items, 100 for relations), degrading performance from 50ms to 2+ seconds. In work management SaaS, this manifests when loading projects with tasks, tasks with comments, users with teams, etc. With 100 users, applications execute 201 queries per page load where only one is needed.

**Why it happens:**
Developers loop through results and fetch relations individually:
```typescript
for (const task of tasks) {
  task.assignee = await prisma.user.findUnique({ where: { id: task.userId } });
}
```
This pattern feels natural when coming from REST APIs but is catastrophic for performance. GraphQL resolvers are particularly vulnerable because field resolution encourages this pattern.

**How to avoid:**
1. **Use `include` for eager loading**:
```typescript
prisma.task.findMany({
  include: { assignee: true, comments: true }
})
```
2. **Use `relationLoadStrategy: 'join'`** for single-query fetches (Prisma 5+)
3. **Select only needed fields** to minimize data transfer:
```typescript
include: { assignee: { select: { id: true, name: true, avatar: true } } }
```
4. **Implement Dataloader pattern** for GraphQL resolvers to batch and deduplicate queries
5. **Use Prisma middleware** to detect and alert on slow queries during development
6. **Monitor query counts** in tests—fail builds if a single request exceeds threshold (e.g., 10 queries)

**Warning signs:**
- Page load times increase linearly with result count
- Database connection pool exhaustion under moderate load
- Logs showing identical queries with different IDs in rapid succession
- Query count metrics showing 50+ queries for single page render
- Users reporting slowness when viewing lists but details load fast

**Phase to address:**
Phase 2 (Data Modeling) - Establish patterns during initial schema design; harder to fix after features are built

---

### Pitfall 5: Server Actions as Unauthenticated Public Endpoints

**What goes wrong:**
Next.js Server Actions with `'use server'` create public HTTP endpoints that anyone can invoke with any payload, even if the action is never imported or called from the UI. Attackers can directly POST to these endpoints with crafted payloads, bypassing client-side validation and UI-based permission checks entirely.

**Why it happens:**
Server Actions look like regular TypeScript functions, leading developers to treat them as internal implementation details. The mental model is "this is called from my component, so it's protected," but the reality is every `'use server'` function creates a publicly accessible HTTP endpoint. Teams skip authentication checks assuming "the user is already logged in to see this page."

**How to avoid:**
1. **Every action MUST start with authentication validation**:
```typescript
'use server'
async function updateTask(taskId: string, data: UpdateTaskInput) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  // Validate input
  const validated = updateTaskSchema.parse(data);

  // Check authorization
  await requirePermission(session.user.id, 'task.update', taskId);

  // Execute
  return updateTask(taskId, validated);
}
```
2. **Input validation with Zod** on every argument
3. **Authorization checks** verifying ownership or permissions
4. **Rate limiting** using middleware or tools like Arcjet
5. **CAPTCHA for sensitive operations** (sign-ups, password resets, bulk operations)
6. **Audit logging** of action invocations

**Warning signs:**
- Server Actions without authentication checks at the top
- Direct Prisma calls in actions without permission verification
- Missing Zod validation schemas for action inputs
- Client-side validation but no server-side validation
- "It works in dev" but no consideration for malicious actors
- Actions that read `userId` from input instead of session

**Phase to address:**
Phase 1 (Authentication Foundation) - Must establish Server Action patterns before building features

---

### Pitfall 6: Monorepo Type Drift and Import Chaos

**What goes wrong:**
Frontend and backend types diverge over time, causing runtime errors when API contracts change but TypeScript shows no errors. Imports break when moving from development to production. Type definitions resolve to `any`, silently removing type safety. Builds succeed locally but fail in CI/CD.

**Why it happens:**
Teams share types by duplicating them across apps or compiling to JavaScript before publishing to the monorepo. Changes to backend DTOs don't automatically propagate to frontend code. TypeScript path aliases (`tsconfig.paths`) cause module resolution conflicts between Next.js and NestJS. Different TypeScript versions or compiler settings between apps create incompatibilities.

**How to avoid:**
1. **Single Source of Truth**: Create a `@repo/types` package that exports raw TypeScript source (not compiled JavaScript)
2. **Shared Package Structure**:
```
packages/
  types/
    src/
      entities/  (User, Task, Project)
      dtos/      (CreateTaskDto, UpdateTaskDto)
      enums/     (TaskStatus, Priority)
      errors/    (AppError types)
    package.json (exports: "./src/*")
    tsconfig.json
```
3. **Project References**: Use TypeScript project references instead of path aliases
4. **Build Orchestration**: Use Turborepo or Nx to ensure shared packages build before consuming apps
5. **Version Synchronization**: Pin TypeScript version across entire monorepo
6. **Validation Bridge**: Use Zod schemas as the source of truth—generate types from schemas

**Warning signs:**
- Frontend shows type errors that don't exist at runtime
- API returns data that doesn't match TypeScript interfaces
- `any` appearing in types that should be specific
- Import paths that work in dev but break in production
- Changes to backend DTOs not caught by TypeScript in frontend
- Different team members seeing different type errors

**Phase to address:**
Phase 0 (Project Setup) - Must be correct from day one; extremely painful to retrofit

---

### Pitfall 7: NextAuth Secret Rotation Logout Cascade

**What goes wrong:**
Changing `NEXTAUTH_SECRET` in production invalidates all existing JWT sessions, logging out every user simultaneously. Users see "JWEDecryptionFailed" errors. Customer support is flooded with "I can't log in" tickets. Trust in the platform erodes.

**Why it happens:**
Developers treat `NEXTAUTH_SECRET` as a configuration parameter that can be rotated for security. In development, `.env` files change frequently without consequence. The connection between the secret and session validity isn't obvious from the documentation. Teams discover this during incident response when they rotate secrets to mitigate a suspected breach.

**How to avoid:**
1. **Generate strong secret once** during initial deployment and never change it:
```bash
openssl rand -base64 32
```
2. **Store in secure vault** (AWS Secrets Manager, Vercel Environment Variables) with strict access controls
3. **Document the consequences** of rotation in team runbook
4. **If rotation is necessary**:
   - Switch to database sessions instead of JWT
   - Implement graceful migration with dual-secret validation period
   - Notify users in advance of forced logout
5. **Separate secrets by environment** but keep each environment's secret stable
6. **Monitor for JWEDecryptionFailed errors** as an indicator of secret mismatch

**Warning signs:**
- Secrets stored in unencrypted files or Slack messages
- Different secrets on different deployment instances
- Secrets being regenerated on each deployment
- No documentation about which secrets can be rotated safely
- Planning to rotate secrets "for security" without understanding impact

**Phase to address:**
Phase 0 (Project Setup) - Must be configured correctly before first user signs up

---

### Pitfall 8: Real-Time State Synchronization Conflicts

**What goes wrong:**
Two users edit the same task simultaneously. User A sets status to "In Progress" while User B assigns it to themselves. The final state depends on network timing, causing one user's change to silently overwrite the other's. Users report "I just changed that and it reverted" or "my edits disappeared." In work management SaaS, this destroys user trust.

**Why it happens:**
WebSocket handlers implement "last write wins" by directly updating the database without checking current state:
```typescript
@SubscribeMessage('task.update')
async handleUpdate(client: Socket, payload: UpdateTaskDto) {
  await prisma.task.update({
    where: { id: payload.taskId },
    data: payload.changes
  });
  this.server.emit('task.updated', payload);
}
```
This works perfectly in isolation but creates race conditions under concurrent edits. No conflict detection or resolution strategy exists.

**Why it happens (deeper):**
Developers optimize for the happy path where users don't collide. Real-time collaboration is added incrementally without rethinking data access patterns. Eventual consistency is misunderstood—teams assume WebSocket broadcasts will "eventually sync" without implementing actual conflict resolution.

**How to avoid:**
1. **Optimistic Locking with Version Numbers**:
```typescript
await prisma.task.update({
  where: { id: taskId, version: currentVersion },
  data: { ...changes, version: { increment: 1 } }
});
// If no rows updated, version mismatch = conflict
```
2. **Field-Level Timestamps** to detect which field changed last
3. **Operational Transform (OT)** for text editing (use libraries like ShareDB)
4. **Conflict Detection + User Prompts**:
   - Detect conflict server-side
   - Emit conflict event to both clients
   - Show UI: "User B edited this task. Choose: Keep yours | Take theirs | Merge"
5. **Causal Consistency**: Track operation causality with vector clocks for distributed systems
6. **Atomic Operations**: Use database transactions for multi-field updates that must be atomic

**Warning signs:**
- User reports of "disappearing changes"
- Updates that work in single-user testing but fail in multi-user scenarios
- WebSocket event handlers that don't check current database state
- No version or timestamp fields on frequently updated entities
- Lack of conflict resolution UI
- Tests that don't cover concurrent edits

**Phase to address:**
Phase 3 (Real-Time Collaboration) - Critical before enabling multi-user editing of same resources

---

### Pitfall 9: RBAC Role Explosion and Stale Permissions

**What goes wrong:**
The system starts with clean roles (Admin, Member, Viewer) but over time accumulates dozens of roles (Admin, Owner, ProjectAdmin, TaskAdmin, TeamLead, Moderator, etc.). When users change roles or teams, old permissions linger because there's no cleanup mechanism. Administrators can't figure out what permissions a user actually has. Security audits become discovery exercises instead of validation.

**Why it happens:**
Teams address edge cases by creating new roles instead of using permission composition. "Can this user do X?" is answered by creating a new role rather than rethinking the permission model. No automated cleanup when users leave teams or change roles. Over-engineering RBAC too early, before understanding actual access patterns.

**How to avoid:**
1. **Start Simple**: Begin with 3-4 roles (Admin, Member, Viewer) and resist creating more until absolutely necessary
2. **Permission Composition**: Use permissions not roles for granular control:
```typescript
// Instead of: isProjectAdmin(user, project)
// Use: hasPermission(user, 'project.settings.update', project)
```
3. **Temporal Permissions**: Use team membership + role rather than direct user-to-role assignment
4. **Automated Cleanup**: When user leaves team, automatically revoke team-based permissions
5. **Audit Trails**: Log permission grants and revocations with expiration dates
6. **Regular Reviews**: Automated reports of users with unusual permission combinations
7. **Defer Relationship-Based Access Control (ReBAC)**: Don't implement until you actually need resource-based permissions

**Warning signs:**
- More than 10 distinct roles in the system
- Roles with overlapping responsibilities (both can do the same thing)
- Users with multiple roles simultaneously
- No automated way to list "all permissions this user has"
- Permission checks that read directly from database without caching
- Creating new roles to solve one-off access requests
- Role names like "AdminButCantDeleteProjects"

**Phase to address:**
Phase 1 (Authentication Foundation) - Design the permission model correctly before features depend on it

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing WebSocket connections in memory | Simple implementation, no database overhead | Doesn't work across multiple server instances, breaks horizontal scaling | Never—use Redis pub/sub from day one |
| Client-only form validation | Faster user feedback, less server code | Security vulnerability, data integrity issues | Only as UX enhancement, never as the sole validation |
| Skipping database indexes on foreign keys | Faster writes during development | Catastrophic query performance as data grows | Never—add indexes during migration creation |
| Polling instead of WebSockets for real-time | Easier to implement, works with simple HTTP | Higher server load, delays in updates, poor UX | Acceptable for low-frequency updates (>30s intervals) |
| Hardcoding tenant/user IDs in queries | Faster prototyping | Data leaks across tenants, impossible to test multi-user scenarios | Never in production code; only in migration scripts |
| Using `any` type for complex types | Bypass TypeScript compilation errors | Loss of type safety, runtime errors, refactoring nightmares | Never—invest time in proper typing |
| Single database transaction for entire request | Simpler error handling, ACID guarantees | Long-held locks, deadlocks under load, poor performance | Acceptable for small, fast operations (<100ms) |
| Sharing Prisma Client instance without checking | Avoids connection pool exhaustion | Leaks transaction context across requests in serverless | Only in traditional servers with proper singleton pattern |
| Global error handlers without context | DRY principle, centralized error handling | Loses request context, makes debugging impossible | Never—always include request ID, user ID, action context |
| Co-locating audit logs with application logs | Single logging infrastructure | Audit logs get lost in noise, can't apply strict access controls | Never—audit logs must be separate with append-only constraint |

## Integration Gotchas

Common mistakes when connecting to external services or internal systems.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| NextAuth Providers | Trusting provider profile data without validation | Validate all fields from OAuth providers; emails can be unverified, names can be missing |
| Prisma in Serverless | Creating new PrismaClient on every request | Use singleton pattern with connection pooling; consider Prisma Accelerate for edge |
| WebSocket Gateway | Not handling disconnects gracefully | Implement `handleDisconnect()`, clean up subscriptions, remove from active user lists |
| Postgres Row-Level Security | Applying RLS but not testing with `SET ROLE` | Test every query as different users; verify RLS policies block unauthorized access |
| Redis Pub/Sub | Using Redis as a message queue with guaranteed delivery | Use proper message queue (Bull/BullMQ) for job processing; Redis pub/sub loses messages if no subscribers |
| Email Sending | Blocking requests waiting for email delivery | Queue emails asynchronously; never await SMTP calls in request handlers |
| File Uploads | Storing files directly in database as bytea | Use object storage (S3, Cloudflare R2); store only URLs/keys in database |
| External API Calls | No timeout or retry logic | Set aggressive timeouts (5-10s), implement exponential backoff, circuit breaker patterns |
| Database Migrations | Running migrations during app startup | Run migrations as separate deployment step before new code deploys |
| Environment Variables | Reading process.env directly in application code | Parse and validate all env vars at startup; fail fast if required vars missing |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading full entities when only IDs needed | Slow queries, high memory usage | Use `select: { id: true }` instead of full entity | >1000 records per query |
| Broadcasting WebSocket events to all connected clients | High bandwidth, client-side filtering | Implement room-based subscriptions by project/team | >100 concurrent users |
| Sequentially processing bulk operations | Long request timeouts, poor UX | Use Promise.all() for parallel processing or background jobs | >10 items per operation |
| Full table scans without indexes | Query time increases linearly with data | Index all foreign keys, WHERE clause columns, ORDER BY fields | >10,000 rows in table |
| Storing session data in JWT | Large cookie size, slow authentication | Switch to database sessions with session ID in cookie | >2KB of session data |
| Eager loading all relations by default | Query returns megabytes per record | Load relations only when needed; use lazy loading for large collections | Relations with >100 items |
| Synchronous audit logging in request path | Adds 50-200ms to every write operation | Queue audit logs asynchronously with guaranteed delivery | >10 writes/second |
| No pagination on list endpoints | Memory exhaustion, browser hangs | Implement cursor-based pagination from day one | >100 items per list |
| Using COUNT(*) for pagination | Slow on large tables, locks table | Use cursor-based pagination or estimate from statistics | >100,000 rows |
| Loading user permissions on every request | Database query on every request | Cache permissions in Redis with 5-10 minute TTL | >100 requests/second |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Not validating resource ownership before operations | Horizontal privilege escalation—users modify others' tasks | Every service method must verify `resource.ownerId === user.id` or team membership |
| Trusting client-provided IDs in authorization checks | User passes `userId` in request to access other accounts | Always read user ID from verified session, never from request body/params |
| Exposing internal IDs in URLs | Information disclosure, enumeration attacks | Use UUIDs or slugs instead of sequential integers for public-facing IDs |
| Missing rate limiting on authentication endpoints | Brute force attacks, credential stuffing | Rate limit login, registration, password reset (5 attempts per 15 minutes) |
| Logging sensitive data in audit trails | PII exposure in logs | Mask or hash sensitive fields (passwords, tokens, credit cards) before logging |
| Not invalidating sessions on password change | Stolen sessions remain valid after password reset | Clear all sessions for user when password changes or suspicious activity detected |
| WebSocket message injection | Users can send crafted messages impersonating others | Validate sender identity server-side; never trust client-provided `userId` in WebSocket payload |
| Insecure direct object references in APIs | Users guess IDs to access unauthorized resources | Implement authorization middleware that checks permissions on every request |
| Missing CORS configuration for WebSockets | Cross-origin WebSocket hijacking | Configure CORS properly; validate Origin header on WebSocket handshake |
| SQL injection via raw queries | Full database compromise | Use Prisma's type-safe query builder; if using `$queryRaw`, always use parameterized queries |

## UX Pitfalls

Common user experience mistakes in work management SaaS.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No optimistic updates on real-time actions | UI feels laggy despite WebSocket connection | Update UI immediately, revert if server rejects; show loading state only if >500ms |
| Silent failures without user feedback | Users don't know if action succeeded | Toast notifications for all state-changing operations; error modals for failures |
| No loading skeletons during data fetch | Jarring layout shifts, feels broken | Show skeleton loaders matching final layout; avoid spinners that block content |
| Overwhelming onboarding with all features | Users abandon during setup, don't see value | One clear task to accomplish; progressive disclosure of features |
| No empty states guiding next action | Users see blank screen and leave | Empty states with clear CTA: "Create your first project" with inline creation |
| Real-time updates without notification | Changes happen silently, users miss them | Show subtle indicator (blue dot, toast) when content updates in background |
| No conflict resolution UI | User's work gets overwritten by others | Detect conflicts, show diff, let user choose which version to keep |
| Identical experiences for new vs. returning users | New users see empty dashboard, get confused | Seed demo data for new accounts or show interactive tour |
| No offline handling for real-time features | Connection loss breaks entire app | Show "Reconnecting..." banner; queue operations to sync when back online |
| Poor mobile responsiveness for collaborative features | Mobile users can't participate in real-time work | Design mobile-first; real-time notifications work on small screens |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **RBAC Implementation**: Often missing service-layer enforcement—verify authorization at data access layer, not just controllers
- [ ] **WebSocket Security**: Often missing per-message authorization—verify every event handler has guards, not just connection
- [ ] **Audit Logging**: Often missing failure logging—verify failed auth attempts, denied permissions, and validation errors are logged
- [ ] **Real-Time Updates**: Often missing conflict resolution—verify concurrent edits are detected and user is prompted
- [ ] **Server Actions**: Often missing input validation—verify Zod schemas validate all inputs, not just authentication
- [ ] **Database Queries**: Often missing N+1 prevention—verify all relation loads use `include` or explicit joins
- [ ] **Error Handling**: Often missing user-facing messages—verify all errors show actionable messages, not stack traces
- [ ] **Session Management**: Often missing cleanup—verify sessions expire, revoke on logout, and invalidate on password change
- [ ] **File Uploads**: Often missing validation—verify file types, sizes, and scan for malware before accepting
- [ ] **Multi-Tenancy**: Often missing isolation tests—verify queries can't access other tenant's data even with manipulated IDs
- [ ] **Rate Limiting**: Often missing on non-auth endpoints—verify bulk operations and expensive queries have rate limits
- [ ] **Environment Config**: Often missing validation—verify app fails fast on startup if required env vars missing or invalid

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| WebSocket Auth Bypass | MEDIUM | 1. Deploy authentication middleware immediately 2. Audit logs for unauthorized access 3. Force disconnect all current sockets 4. Notify affected users |
| RBAC Inconsistency | HIGH | 1. Audit all authorization checks 2. Centralize in authorization service 3. Add service-layer enforcement 4. Regression test all protected endpoints |
| Audit Log Gaps | HIGH (impossible to fully recover) | 1. Implement complete logging going forward 2. Document gap period 3. Consider gap permanent for compliance purposes |
| Prisma N+1 Queries | MEDIUM | 1. Identify slow endpoints with APM 2. Add `include` to offending queries 3. Add integration tests verifying query count |
| Server Actions Unprotected | HIGH | 1. Emergency: Add authentication to all actions 2. Audit access logs for unauthorized calls 3. Add Zod validation 4. Security review all actions |
| Type Drift | MEDIUM | 1. Create shared types package 2. Migrate to TypeScript project references 3. Add CI check for type consistency |
| NextAuth Secret Rotation | LOW (but user-impacting) | 1. Users must re-login (unavoidable) 2. Switch to database sessions to prevent future issues 3. Communicate to users via email/banner |
| State Sync Conflicts | MEDIUM | 1. Add version field to entities 2. Implement optimistic locking 3. Build conflict resolution UI 4. Document known conflicts for users |
| RBAC Role Explosion | HIGH | 1. Map existing roles to simplified permission model 2. Migrate users to new model 3. Remove redundant roles 4. Add automated cleanup |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| WebSocket Authentication Bypass | Phase 1: Authentication Foundation | Integration test: Attempt WebSocket connection without valid token; verify disconnection |
| RBAC Enforcement Inconsistency | Phase 1: Authentication Foundation | Test: Try accessing resource via API with invalid permissions; verify 403 response |
| Audit Log Incompleteness | Phase 1: Authentication Foundation | Review: Check audit logs for failed login attempts and permission denials exist |
| Prisma N+1 Query Explosions | Phase 2: Data Modeling | Test: Assert query count <10 for all list endpoints in integration tests |
| Server Actions Unprotected | Phase 1: Authentication Foundation | Security review: Every Server Action has auth check in first 5 lines |
| Monorepo Type Drift | Phase 0: Project Setup | CI Check: TypeScript compilation succeeds in all packages with strict mode |
| NextAuth Secret Rotation | Phase 0: Project Setup | Runbook: Document secret management procedures and rotation consequences |
| Real-Time State Sync Conflicts | Phase 3: Real-Time Collaboration | Test: Two concurrent WebSocket updates to same task; verify conflict detection |
| RBAC Role Explosion | Phase 1: Authentication Foundation | Review: Permission model uses <10 roles; composition pattern documented |

## Sources

### WebSocket Security
- [WebSocket Security - OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html)
- [The Developer's Guide to WebSockets Security: Pitfalls and Protections - Qwiet](https://qwiet.ai/appsec-resources/the-developers-guide-to-websockets-security-pitfalls-and-protections/)
- [Essential guide to WebSocket authentication - Ably](https://ably.com/blog/websocket-authentication)
- [WebSocket Security: Top 8 Vulnerabilities and How to Solve Them - Bright Security](https://brightsec.com/blog/websocket-security-top-vulnerabilities/)

### RBAC Implementation
- [6 Common Role Based Access Control (RBAC) Implementation Pitfalls - Idenhaus](https://idenhaus.com/rbac-implementation-pitfalls/)
- [How to Implement RBAC with Custom Guards in NestJS - OneUpTime](https://oneuptime.com/blog/post/2026-01-25-rbac-custom-guards-nestjs/view)
- [The Best Way to Authenticate WebSockets in NestJS - Preet Mishra](https://preetmishra.com/blog/the-best-way-to-authenticate-websockets-in-nestjs)
- [Guards - Gateways | NestJS Documentation](https://docs.nestjs.com/websockets/guards)

### Audit Logging
- [Audit Logging Best Practices, Components & Challenges - Sonar](https://www.sonarsource.com/resources/library/audit-logging/)
- [Audit Logging: What It Is & How It Works - Datadog](https://www.datadoghq.com/knowledge-center/audit-logging/)
- [Audit Log Best Practices For Information Security - ZenGRC](https://www.zengrc.com/blog/audit-log-best-practices-for-information-security/)

### Prisma Performance
- [N+1 Query Problem: The Database Killer You're Creating - Saad Minhas](https://medium.com/@saad.minhas.codes/n-1-query-problem-the-database-killer-youre-creating-f68104b99a2d)
- [N+1 Query Problem: Fixing It with SQL and Prisma ORM - Furkan Baytekin](https://www.furkanbaytekin.dev/blogs/software/n1-query-problem-fixing-it-with-sql-and-prisma-orm)
- [Query optimization using Prisma Optimize - Prisma Documentation](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance)

### Next.js Server Actions Security
- [Next.js Server Actions Security: 5 Vulnerabilities You Must Fix - MakerKit](https://makerkit.dev/blog/tutorials/secure-nextjs-server-actions)
- [How to Think About Security in Next.js - Next.js Blog](https://nextjs.org/blog/security-nextjs-server-components-actions)
- [Next.js Security Hardening: Five Steps to Bulletproof Your App in 2026 - Made Adi Widyananda](https://medium.com/@widyanandaadi22/next-js-security-hardening-five-steps-to-bulletproof-your-app-in-2026-61e00d4c006e)
- [Guides: Data Security - Next.js Documentation](https://nextjs.org/docs/app/guides/data-security)

### NextAuth Session Management
- [Next.js Session Management: Solving NextAuth Persistence Issues in 2025 - Clerk](https://clerk.com/articles/nextjs-session-management-solving-nextauth-persistence-issues)
- [Common Next.js & NextAuth.js Authentication Pitfalls - InfiniteJS](https://infinitejs.com/posts/nextjs-nextauth-auth-pitfalls/)

### Monorepo TypeScript
- [Live types in a TypeScript monorepo - Colin McDonnell](https://colinhacks.com/essays/live-types-typescript-monorepo)
- [Client/Server code sharing in Typescript monorepos - Carles Capellas](https://capelski.medium.com/effective-code-sharing-in-typescript-monorepos-475f9600f6b4)
- [GitHub - belgattitude/nextjs-monorepo-example: Collection of monorepo tips & tricks](https://github.com/belgattitude/nextjs-monorepo-example)

### Real-Time Collaboration
- [Strong vs Eventual Consistency in Distributed Systems - Level Up Coding](https://blog.levelupcoding.com/p/strong-vs-eventual-consistency)
- [Consistency Patterns in Distributed Systems: A Complete Guide - DesignGurus](https://www.designgurus.io/blog/consistency-patterns-distributed-systems)

### Work Management SaaS
- [Project Management Statistics & Trends for 2026 - ProProfs](https://www.proprofsproject.com/blog/project-management-statistics/)
- [SaaS Onboarding Best Practices: Turn Trial Users Into Customers - Sybill](https://www.sybill.ai/blogs/saas-onboarding-best-practices)

---
*Pitfalls research for: TeamFlow Work Management SaaS*
*Researched: 2026-02-14*
*Confidence: HIGH - Based on official documentation, current blog posts, and 2026 resources*
