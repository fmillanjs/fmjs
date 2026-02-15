# Roadmap: v1.1 - Real-Time Collaboration Activation

## Overview

Version 1.1 focuses on **unblocking and activating the fully-implemented real-time collaboration features** that are currently non-functional due to authentication integration issues. All WebSocket code, event listeners, frontend hooks, and conflict detection logic exist and are committed. The work required is **debugging and fixing the authentication layer compatibility** between Next.js 15, NextAuth v5, and NestJS.

**Goal:** Activate real-time task updates, presence indicators, and optimistic UI to complete the 88% → 100% journey.

**Timeline:** 1-2 weeks (debugging-focused, not feature development)

## Current State Assessment

### What Already Works (v1.0 - 88%)
- ✅ Complete HTTP-based task management (CRUD operations)
- ✅ JWT authentication for API endpoints
- ✅ RBAC enforcement across all routes
- ✅ EventEmitter2 domain events emitting correctly
- ✅ Audit logging capturing all mutations
- ✅ Frontend forms and UI components

### What's Blocked (12% - Code Complete)
- ❌ WebSocket connections (immediate disconnect on auth failure)
- ❌ Dashboard SSR access (session null during SSR prefetch)
- ❌ Real-time task updates (events emitted but not received)
- ❌ Presence tracking (hooks exist, WebSocket disconnected)
- ❌ Conflict detection UI (backend works, frontend untested)

### Root Causes (Documented in Phase 3 .continue-here.md)

**Blocker 1: WebSocket Authentication Failure**
- **Symptom:** `WS connected` → `WS disconnected` (immediate)
- **Backend logs:** `WS Connection rejected: Invalid token`
- **Verified:** JWT_SECRET synchronized across all .env files
- **Hypothesis:** Token format mismatch between NextAuth JWT signing and NestJS validation
- **Evidence:** `.planning/phases/03-real-time-collaboration/.continue-here.md` line 108-140

**Blocker 2: SSR Session Access Issue**
- **Symptom:** `Failed to fetch teams: ApiError: Unauthorized` during post-login navigation
- **Root cause:** Next.js 15 Server Components cannot access NextAuth session during SSR prefetch
- **Impact:** Cannot navigate to dashboard, blocks all manual testing
- **Evidence:** `.planning/phases/03-real-time-collaboration/.continue-here.md` line 77-106

## Phases

### Phase 5.1: Authentication Architecture Investigation
**Goal:** Understand the exact token format mismatch and SSR session access patterns

**Depends on:** Nothing (starts immediately)

**Requirements:** REAL-01 through REAL-07 prerequisites

**Success Criteria:**
1. WebSocket handshake token extraction logged and debugged
2. NextAuth JWT signing algorithm identified
3. NestJS JWT validation algorithm identified
4. SSR session access pattern documented for Next.js 15 + NextAuth v5
5. Clear understanding of what needs to change where

**Tasks:**
1. Add detailed logging to `apps/api/src/common/guards/ws-auth.guard.ts`
   - Log raw handshake.auth object
   - Log token extraction attempt
   - Log JWT verification error details
2. Add logging to `apps/web/lib/auth.ts` JWT token creation
   - Log token structure before signing
   - Log signing algorithm used
   - Compare with NestJS expected format
3. Research Next.js 15 + NextAuth v5 Server Component session access
   - Review official Next.js 15 migration docs
   - Check NextAuth v5 SSR documentation
   - Search for known issues in GitHub repos
4. Test WebSocket connection with manually crafted token
   - Create token manually with correct format
   - Verify validation succeeds
   - Identify the delta

**Duration:** 2-3 days (research and debugging)

---

### Phase 5.2: WebSocket Authentication Fix
**Goal:** Resolve JWT token format mismatch to enable persistent WebSocket connections

**Depends on:** Phase 5.1

**Requirements:** REAL-01, REAL-02, REAL-03, REAL-04, TECH-09

**Success Criteria:**
1. WebSocket connections remain connected (no immediate disconnect)
2. Token validation succeeds in WsAuthGuard
3. User context available in socket.data.user
4. Multiple browser tabs can connect simultaneously
5. Reconnection after server restart works

**Tasks:**
1. **Option A: Align NextAuth to NestJS format**
   - Update NextAuth JWT callback to use NestJS-compatible structure
   - Ensure token includes all required fields
   - Test compatibility with existing HTTP endpoints

2. **Option B: Align NestJS to NextAuth format**
   - Update WsAuthGuard to parse NextAuth token structure
   - Modify JWT strategy to accept NextAuth token format
   - Ensure backward compatibility with HTTP auth

3. **Option C: Separate WebSocket auth token**
   - Create dedicated WebSocket token endpoint
   - Generate WebSocket-specific JWT from session
   - Pass WebSocket token separately from HTTP token

4. **Implementation (choose option based on 5.1 findings)**
   - Implement chosen solution
   - Update token extraction in WebSocketProvider
   - Test connection lifecycle (connect, auth, disconnect, reconnect)

5. **Verify WebSocket infrastructure**
   - Test project room join/leave
   - Verify membership authorization
   - Test presence:join and presence:leave events
   - Confirm Redis pub/sub works (or re-enable if needed)

**Duration:** 3-5 days (implementation and testing)

---

### Phase 5.3: SSR Session Access Fix
**Goal:** Enable Server Components to access NextAuth session during SSR

**Depends on:** Phase 5.2 (parallel possible but sequential recommended)

**Requirements:** All dashboard route access

**Success Criteria:**
1. User can navigate to /dashboard after login without errors
2. `await auth()` returns valid session during SSR
3. `serverApi.get('/api/teams')` succeeds with valid token
4. Dashboard layout loads with team data
5. No "Unauthorized" errors in Server Component data fetching

**Tasks:**
1. **Research Next.js 15 SSR session patterns**
   - Review Next.js 15 auth documentation
   - Check NextAuth v5 SSR best practices
   - Identify recommended patterns for Server Component data fetching

2. **Option A: Convert to Client Components**
   - Move data fetching to client-side
   - Use `useEffect` + `useSession` pattern
   - Remove `await auth()` from Server Components
   - **Pros:** Guaranteed to work
   - **Cons:** Loses SSR benefits, more client-side JS

3. **Option B: Middleware-based session validation**
   - Add middleware to validate session before SSR
   - Attach session to request headers
   - Server Components read from headers
   - **Pros:** Keeps SSR benefits
   - **Cons:** More complex, requires middleware changes

4. **Option C: API route for session**
   - Create `/api/session` endpoint
   - Server Components fetch from internal API
   - Bypass SSR session access issue
   - **Pros:** Simple, works with current architecture
   - **Cons:** Extra request overhead

5. **Implementation (choose based on research)**
   - Implement chosen solution
   - Update dashboard layout
   - Update all Server Components using `auth()`
   - Test navigation flow: login → redirect → dashboard

**Duration:** 2-4 days (implementation and testing)

---

### Phase 5.4: Phase 3 Verification & E2E Testing
**Goal:** Complete Phase 3 end-to-end verification that was blocked in v1.0

**Depends on:** Phase 5.2, Phase 5.3

**Requirements:** REAL-01 through REAL-07, all real-time features

**Success Criteria:**
1. All 7 manual verification tests from Phase 3 Plan 04 pass
2. Real-time task updates work across browser tabs
3. Presence indicators show active users
4. Conflict detection warns on concurrent edits
5. Optimistic UI reverts on API failure
6. WebSocket reconnection refetches data
7. E2E tests for auth flows implemented

**Tasks:**
1. **Run Phase 3 Plan 04 manual tests** (from .planning/phases/03-real-time-collaboration/03-04-PLAN.md)
   - Test 1: WebSocket connection verified
   - Test 2: Real-time task updates (2 tabs)
   - Test 3: Real-time comments
   - Test 4: Presence indicators
   - Test 5: Conflict detection
   - Test 6: Optimistic UI rollback
   - Test 7: Reconnection

2. **Create 03-VERIFICATION.md**
   - Document all 6 Phase 3 success criteria as verified
   - Confirm REAL-01 through REAL-07 requirements satisfied
   - List any remaining tech debt
   - Mark phase as PASSED

3. **Implement auth flow E2E tests**
   - Create `apps/web/e2e/auth/login.spec.ts`
   - Create `apps/web/e2e/auth/signup.spec.ts`
   - Create `apps/web/e2e/auth/password-reset.spec.ts`
   - Test full auth flows including session persistence

4. **Implement dashboard E2E tests**
   - Create `apps/web/e2e/dashboard/navigation.spec.ts`
   - Test protected route access
   - Test RBAC enforcement (Admin vs Manager vs Member)

5. **Run full test suite**
   - Unit tests (Vitest + Jest)
   - E2E tests (Playwright)
   - Verify CI/CD pipeline runs all tests

**Duration:** 2-3 days (testing and documentation)

---

### Phase 5.5: Production Polish & Deployment
**Goal:** Final polish and deploy v1.1 to production

**Depends on:** Phase 5.4

**Requirements:** DEPLOY-02, DEPLOY-04, DEPLOY-05

**Success Criteria:**
1. Coolify applications configured for web and API
2. Environment variables set in Coolify
3. Custom domains configured and SSL working
4. Deployment webhook triggers on main branch push
5. Application accessible at production URLs
6. Real-time features working in production

**Tasks:**
1. **Complete Coolify setup**
   - Create Coolify applications for web and API
   - Configure build settings (Docker images from GHCR)
   - Set all required environment variables
   - Configure domains and SSL

2. **Add COOLIFY_WEBHOOK_URL secret**
   - Get webhook URL from Coolify dashboard
   - Add to GitHub repository secrets
   - Test webhook trigger

3. **Deploy to production**
   - Push to main branch
   - Monitor CI/CD pipeline
   - Verify Docker images build and push
   - Verify Coolify deployment succeeds

4. **Production verification**
   - Test all auth flows in production
   - Test real-time features with multiple users
   - Verify SSL certificates
   - Test custom domain access

5. **Update portfolio links**
   - Update portfolio to link to live deployment
   - Update README with production URLs
   - Update case study with live demo links

**Duration:** 1-2 days (deployment and verification)

---

## Progress Tracking

**Execution Order:** 5.1 → 5.2 → 5.3 → 5.4 → 5.5 (sequential)

| Phase | Focus | Status | Duration |
|-------|-------|--------|----------|
| 5.1. Authentication Investigation | Debug token format, SSR patterns | Not Started | 2-3 days |
| 5.2. WebSocket Auth Fix | Fix JWT mismatch | Not Started | 3-5 days |
| 5.3. SSR Session Fix | Enable dashboard access | Not Started | 2-4 days |
| 5.4. Phase 3 Verification | Complete testing | Not Started | 2-3 days |
| 5.5. Production Deployment | Deploy v1.1 live | Not Started | 1-2 days |

**Total Estimated Duration:** 10-17 days

---

## Requirements Coverage

### v1.0 Status (for reference)
- ✅ Authentication: 6/6 satisfied (100%)
- ✅ Authorization: 6/6 satisfied (100%)
- ✅ Teams: 5/5 satisfied (100%)
- ✅ Projects: 5/5 satisfied (100%)
- ✅ Tasks: 9/9 satisfied (100%)
- ✅ Views: 6/6 satisfied (100%)
- ❌ Real-Time: 0/8 satisfied (0%) ← **v1.1 target**
- ✅ Audit: 7/7 satisfied (100%)
- ✅ UI/UX: 7/7 satisfied (100%)
- ✅ Portfolio: 8/8 satisfied (100%)
- ⚠️ Technical: 7/9 satisfied (78%)
- ⚠️ Testing: 2/5 satisfied (40%) ← **v1.1 improvement**
- ⚠️ Deployment: 2/5 satisfied (40%) ← **v1.1 completion**

### v1.1 Target Requirements

**Real-Time Collaboration (8 requirements)**
- REAL-01: Live updates on task creation
- REAL-02: Live updates on task moves
- REAL-03: Live updates on task changes
- REAL-04: Live updates on comments
- REAL-05: Presence indicators
- REAL-06: Optimistic UI with rollback
- REAL-07: Conflict detection
- TECH-09: Redis pub/sub for scaling

**Testing (3 additional requirements)**
- TEST-02: E2E tests for authentication flows
- TEST-03: RBAC enforcement tests (already have unit tests, add E2E)
- TEST-04: API endpoint validation tests (enhance coverage)

**Deployment (3 requirements)**
- DEPLOY-02: Deploy to Coolify
- DEPLOY-04: CI/CD pipeline (already works, complete with E2E)
- DEPLOY-05: Custom domains

**v1.1 Target:** 67/67 requirements satisfied (100%)

---

## Success Criteria

### Technical Success
- [x] WebSocket connections stay connected
- [x] Dashboard accessible after login
- [x] Real-time task updates work across tabs
- [x] Presence indicators show active users
- [x] Conflict detection prevents data loss
- [x] E2E tests run in CI/CD
- [x] Application deployed to production

### Business Success
- [x] Portfolio showcases working real-time features
- [x] Demo environment allows recruiters to test live updates
- [x] Case study accurately reflects completed features
- [x] GitHub repository demonstrates senior engineering
- [x] Production deployment shows DevOps capabilities

---

## Risk Mitigation

### Risk 1: Token format incompatible
**Mitigation:** Phase 5.1 investigation identifies exact format needed. If formats are fundamentally incompatible, Option C (separate WebSocket token) provides fallback.

### Risk 2: Next.js 15 SSR session issue unsolvable
**Mitigation:** Multiple options available (Client Components, middleware, API route). At least one will work.

### Risk 3: Timeline extends beyond 2 weeks
**Mitigation:** Phases 5.2 and 5.3 can run in parallel if needed. Phase 5.5 deployment can be deferred if testing takes longer.

### Risk 4: Real-time features still don't work in production
**Mitigation:** Extensive local testing in Phase 5.4 before deployment. Production environment should match local Docker setup.

---

## Definition of Done (v1.1)

**Phase 3 Verification Complete:**
- [ ] 03-VERIFICATION.md exists and shows PASSED status
- [ ] All 6 Phase 3 success criteria verified
- [ ] All 8 REAL requirements satisfied

**E2E Testing Complete:**
- [ ] Auth flow E2E tests implemented
- [ ] Dashboard E2E tests implemented
- [ ] All E2E tests run in CI/CD
- [ ] Test coverage ≥40% for critical paths

**Production Deployment Complete:**
- [ ] Coolify applications configured
- [ ] Application deployed and accessible
- [ ] Custom domains working with SSL
- [ ] Real-time features working in production

**Documentation Updated:**
- [ ] Portfolio case study updated (remove "Coming in v1.1")
- [ ] README updated with production URLs
- [ ] ROADMAP.md marked complete
- [ ] Milestone v1.1 audit report created

**Result:** 100% feature completion, production-deployed, job-hunt ready

---

## Next Steps After v1.1

With v1.0 deployed now and v1.1 completing real-time features:

**Immediate (v1.1 completion):**
1. Update resume with TeamFlow live link
2. Update LinkedIn with project showcase
3. Begin active job applications
4. Use TeamFlow in recruiter conversations

**Future (v2.0 - optional):**
- Email notifications
- File attachments
- Advanced analytics
- External integrations

**Focus:** v1.1 completes the job-hunting portfolio. v2.0 is optional enhancement.

---

*Roadmap created: 2026-02-15*
*Target completion: 2026-03-01 (2 weeks)*
