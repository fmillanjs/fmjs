# Phase 7: Phase 3 Verification & Real-Time Features Validation - Research

**Researched:** 2026-02-16
**Domain:** Manual testing verification methodology for real-time WebSocket collaboration features
**Confidence:** MEDIUM-HIGH

## Summary

Phase 7 is a pure verification phase focused on systematically validating that Phase 3's real-time collaboration features work end-to-end through comprehensive manual testing. Unlike typical development phases, this phase requires no code implementation—the WebSocket infrastructure, Redis pub/sub broadcasting, presence tracking, optimistic UI, and conflict detection were all completed in Phase 3 (plans 03-01 through 03-04). The gap identified in the v1.0 Milestone Audit is the missing VERIFICATION.md document proving these features function correctly.

The research reveals that manual testing of real-time WebSocket features requires specific test scenarios covering connection management, message delivery, presence synchronization, conflict resolution, and reconnection handling. Industry best practices emphasize testing with multiple concurrent clients (browser tabs/windows), simulating network failures, verifying message ordering, and validating security boundaries. The existing Phase 3 plan 03-04 already defined 7 comprehensive test scenarios, but human verification was never completed and documented.

This phase differs from other verification phases (Phase 1, 2, 4) in that it's entirely human-executed—WebSocket interactions across multiple clients cannot be automated effectively with the current test infrastructure. The planner must create a single PLAN with detailed test scenarios, clear pass/fail criteria, data recording templates, and structured documentation requirements that mirror the format established in Phase 1's VERIFICATION.md.

**Primary recommendation:** Create a single comprehensive manual testing plan with 7 test scenarios (connection, task updates, comments, presence, conflicts, optimistic rollback, reconnection), provide detailed step-by-step instructions for multi-tab testing, define observable evidence for each requirement (REAL-01 through REAL-07), and document results in 07-VERIFICATION.md following the established verification format.

## Standard Stack

### Testing Tools (No Installation Required)

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Browser DevTools | Built-in | WebSocket connection inspection, network monitoring | Standard debugging tool, available in Chrome/Firefox/Edge, shows WS frames in Network tab |
| Multiple Browser Tabs | Built-in | Simulate concurrent users viewing same project | Simple multi-client testing without additional infrastructure |
| Docker Desktop | Current | Run Postgres and Redis containers for backend | Already in use, ensures consistent test environment |
| npm scripts | Current | Start API and web servers in development mode | Already configured in monorepo |

### Documentation Format

| Component | Reference | Purpose | Why This Format |
|-----------|-----------|---------|-----------------|
| VERIFICATION.md | Phase 1 example | Document test results, evidence, requirement mapping | Established pattern from Phase 1, maps to ROADMAP success criteria |
| Test scenario template | Plan 03-04 Task 2 | Step-by-step test instructions with expected outcomes | Already defined comprehensive scenarios, reuse and enhance |
| Evidence format | Phase 1 verification | Screenshots, console logs, database queries, code references | Proven format for auditable verification |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual testing | Automated WebSocket E2E tests (Playwright) | Automation is ideal but requires significant test infrastructure setup; Phase 7 is time-boxed for manual verification only |
| Browser tabs | Multiple machines or VMs | Unnecessary complexity; tabs provide sufficient multi-client simulation for verification purposes |
| Detailed test plan | Quick smoke test | Smoke tests miss edge cases; comprehensive scenarios required for production confidence and portfolio quality |

**Installation:** None required—all tools already available

## Architecture Patterns

### VERIFICATION.md Structure (Follow Phase 1 Format)

```markdown
---
phase: 07-phase-3-verification
verified: [ISO timestamp]
status: [passed/failed/partial]
score: [X/10 success criteria verified]
re_verification: false
---

# Phase 7: Phase 3 Verification & Real-Time Features Validation - Verification Report

## Goal Achievement

### Observable Truths (Success Criteria from ROADMAP.md)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | VERIFICATION.md exists for Phase 3... | ✓/✗ | File path, commit hash |
| 2 | WebSocket authentication works... | ✓/✗ | Console logs, network tab screenshots |
| ... | ... | ... | ... |

### Requirements Coverage

| Requirement | Feature | Status | Evidence |
|-------------|---------|--------|----------|
| REAL-01 | Live task creation updates | ✓/✗ | Test scenario 2 results, video/screenshots |
| REAL-02 | Live task drag-drop updates | ✓/✗ | Test scenario 2 results |
| ... | ... | ... | ... |
```

### Manual Test Scenario Template

**Pattern:** Each test scenario follows this structure

```markdown
### Test [N]: [Feature Name]

**Objective:** [What this test validates]
**Requirements:** [REAL-XX mapping]
**Setup:**
- Prerequisite steps
- Required data/state

**Steps:**
1. Action in Tab A → Expected immediate result
2. Verify in Tab B → Expected synchronized result
3. Edge case action → Expected error handling

**Pass Criteria:**
- [ ] Observable behavior 1
- [ ] Observable behavior 2
- [ ] No console errors
- [ ] Data consistency verified

**Evidence to Capture:**
- Screenshot: [what to show]
- Console log: [specific messages]
- Network tab: [WebSocket frames]
- Database query: [verification query]

**Results:** [PASS/FAIL + notes]
```

**Source:** Adapted from Phase 3 Plan 03-04 Task 2 verification checklist

### Multi-Tab Testing Pattern

**What:** Testing real-time synchronization requires at least two browser contexts viewing the same data

**When to use:** For all REAL-01 through REAL-05 tests (task updates, comments, presence)

**Setup:**
1. Open browser in normal mode (Tab A)
2. Open same browser in incognito/private mode (Tab B) OR use two different browsers
3. Log in with different user accounts in each context (or same user to test self-update filtering)
4. Navigate both to the same project page
5. Position windows side-by-side for visual comparison

**Why incognito:** Ensures separate session cookies, prevents WebSocket connection conflicts, simulates true multi-user scenario

**Source:** [How to Manually Test WebSocket APIs](https://adequatica.medium.com/how-to-manually-test-websocket-apis-855393911d1a)

### Network Simulation Pattern

**What:** Testing reconnection and error handling requires simulating network failures

**Methods:**
- **Browser DevTools:** Network tab → Throttling dropdown → "Offline" (simulates total network loss)
- **Stop server:** `Ctrl+C` in API terminal (simulates server failure)
- **Laptop sleep/wake:** Close laptop lid for 30 seconds (simulates connection drop)

**What to verify:**
- Client detects disconnection (console log: "WS disconnected")
- Client attempts reconnection (console log: reconnection attempts)
- Client refetches data after reconnect (API calls in Network tab)
- UI shows stale data until refetch completes

**Source:** [WebSocket Testing Essentials](https://www.thegreenreport.blog/articles/websocket-testing-essentials-strategies-and-code-for-real-time-apps/websocket-testing-essentials-strategies-and-code-for-real-time-apps.html)

### Evidence Collection Pattern

**What:** Structured evidence capture for each test scenario

**Types of evidence:**

1. **Screenshots:** Capture before/after states showing synchronized UI changes
   - Filename convention: `test-[N]-[feature]-[context].png`
   - Example: `test-02-task-creation-tab-a.png`, `test-02-task-creation-tab-b.png`

2. **Console logs:** Copy relevant WebSocket connection/event logs
   - Filter for: "WS connected", "task:created", "presence:join", errors
   - Include timestamps to show event ordering

3. **Network tab:** Export HAR file or screenshot WebSocket frames
   - Show authentication handshake success
   - Show message payloads for key events

4. **Database verification:** Run queries to confirm data consistency
   ```sql
   SELECT id, title, status, version FROM "Task" WHERE project_id = '[test-project-id]' ORDER BY created_at DESC LIMIT 5;
   ```

5. **Code references:** Link to implementation files proving feature exists
   - Example: "EventsGateway.handleConnection validates JWT at line 42"

**Organization:** Create `.planning/phases/07-phase-3-verification/evidence/` directory (optional, not committed—just local reference)

**Source:** Phase 1 verification report evidence format

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test automation for WebSockets | Custom Playwright WebSocket helpers | Manual testing for Phase 7 | WebSocket testing automation is complex, requires mock servers, event replay logic—manual verification is faster and sufficient for this phase |
| Evidence management system | Custom screenshot/log aggregator | Manual file organization + markdown documentation | Simple directory structure and markdown tables are auditable and version-controllable without tool overhead |
| Load testing | Custom concurrent client simulation | Skip for Phase 7—out of scope | Load testing requires k6, Artillery, or similar tools; Phase 7 focuses on functional verification only |
| WebSocket debugging proxy | Custom message interceptor | Browser DevTools Network tab | DevTools natively shows WebSocket frames, payloads, and timing—no proxy needed |

**Key insight:** Manual testing verification is often faster and more thorough than building test automation infrastructure when time-boxed and scope is well-defined. The goal is proving features work, not achieving 100% automation coverage.

## Common Pitfalls

### Pitfall 1: Testing with Same User in Multiple Tabs (Same Browser Session)

**What goes wrong:** Open two tabs in the same browser window, log in as the same user, make changes in Tab A, expect to see updates in Tab B—but updates don't appear because both tabs share the same WebSocket connection or the `userId` filter prevents self-updates.

**Why it happens:** Socket.IO may reuse connections for the same user session, and Phase 3's real-time hooks filter events where `event.userId === currentUserId` to prevent infinite loops from self-updates.

**How to avoid:**
- Use incognito/private mode for Tab B (separate session)
- OR log in as a different user in Tab B
- OR temporarily disable userId filtering in code for testing (then re-enable)

**Warning signs:** Tab B never shows updates, console shows events arriving but state doesn't change, both tabs have identical user context in React DevTools.

### Pitfall 2: Not Waiting for WebSocket Connection Before Testing

**What goes wrong:** Navigate to project page, immediately drag a task, expect real-time broadcast—but WebSocket hasn't connected yet, so event doesn't broadcast to other clients.

**Why it happens:** WebSocket connection is asynchronous, can take 500ms-2s depending on network. Frontend may not indicate connection status visibly.

**How to avoid:**
- Check browser console for "WS connected" log before starting tests
- Add temporary connection status indicator in UI (or check existing one if Phase 3 implemented it)
- Wait 2-3 seconds after page load before executing test actions

**Warning signs:** First action doesn't broadcast but subsequent actions do, Network tab shows WebSocket connection established after test action.

### Pitfall 3: Forgetting to Clear Browser Cache Between Test Runs

**What goes wrong:** Run test, see a bug, fix code, restart servers, re-run test—but browser still shows old behavior because cached JavaScript bundle hasn't updated.

**Why it happens:** Next.js aggressive caching in development mode, service workers (if enabled), browser HTTP cache.

**How to avoid:**
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Open DevTools → Network tab → Disable cache checkbox (keeps cache disabled while DevTools open)
- Use incognito mode for each test run (no cache persistence)

**Warning signs:** Code changes don't reflect in browser, console logs show old code, Network tab shows "from cache" for bundle requests.

### Pitfall 4: Testing Presence Without Verifying Initial State

**What goes wrong:** Open Tab A, verify presence shows "1 active user," open Tab B, presence doesn't update to "2 active users"—assume presence is broken, but actually the initial presence count was wrong.

**Why it happens:** Presence tracking requires both join event broadcasting AND initial state request on mount. If initial state request fails, the baseline is wrong.

**How to avoid:**
- Before opening Tab B, verify Tab A shows correct presence count (should be 1 for current user)
- Check console for `presence:request` emit and response
- Verify backend `presence:request` handler exists and returns room membership

**Warning signs:** Presence count never increases beyond 0, presence indicator doesn't show current user, console shows no presence-related events.

### Pitfall 5: Not Testing Conflict Detection Edge Cases

**What goes wrong:** Test conflict detection by editing task in Tab A, then editing in Tab B—but both succeed, no conflict warning appears.

**Why it happens:**
- Conflict detection requires sending `version` field with updates, but test didn't verify version is included in API payload
- Or updates happened sequentially (Tab A's update completed before Tab B's started), so versions didn't conflict
- Or conflict UI is implemented but requires specific timing (both updates in-flight simultaneously)

**How to avoid:**
- Verify in Network tab that PATCH requests include `version` field in payload
- Test rapid-fire edits: edit in Tab A, DON'T wait for response, immediately edit same field in Tab B
- Test with Network throttling to slow responses and create overlap window
- Check for 409 Conflict response in Network tab, not just UI warning

**Warning signs:** API always returns 200 OK even for simultaneous edits, version field missing in request payloads, conflict UI never appears regardless of timing.

**Source:** Common WebSocket testing issues from [WebSocket Testing Essentials](https://www.thegreenreport.blog/articles/websocket-testing-essentials-strategies-and-code-for-real-time-apps/websocket-testing-essentials-strategies-and-code-for-real-time-apps.html)

## Code Examples

### Verifying WebSocket Connection in Browser Console

```javascript
// Open DevTools Console (F12) and run:

// Check if socket exists and is connected
window.socket // If undefined, WebSocket provider may not be initialized

// Manual connection test (if useWebSocket hook exposes socket globally)
const socket = window.socket || io('ws://localhost:3001', {
  auth: { token: 'YOUR_JWT_HERE' }
});

socket.on('connect', () => console.log('✓ WS Connected'));
socket.on('disconnect', () => console.log('✗ WS Disconnected'));
socket.on('connect_error', (err) => console.error('✗ Connection Error:', err));

// Listen for all events (debugging)
socket.onAny((eventName, ...args) => {
  console.log(`[WS Event] ${eventName}:`, args);
});

// Join project room manually
socket.emit('join:project', 'PROJECT_ID_HERE');

// Check which rooms you're in (server-side only, not visible to client)
// Instead, emit presence:request to verify room membership
socket.emit('presence:request', 'PROJECT_ID_HERE', (response) => {
  console.log('Presence response:', response);
});
```

**Source:** Adapted from [Socket.IO Client Tester documentation](https://8gwifi.org/socket-io-client.jsp)

### Database Verification Queries

```sql
-- Verify task version increments after updates
SELECT id, title, status, version, updated_at
FROM "Task"
WHERE project_id = 'PROJECT_ID'
ORDER BY updated_at DESC
LIMIT 10;

-- Expected: version should increment with each update
-- Example: version=0 initially, version=1 after first update, version=2 after second

-- Verify audit logs captured real-time events
SELECT id, action, entity_type, entity_id, metadata, created_at
FROM "AuditLog"
WHERE entity_type = 'Task'
  AND action IN ('task.created', 'task.updated', 'task.status_changed')
ORDER BY created_at DESC
LIMIT 20;

-- Expected: Every task CRUD operation has a corresponding audit log entry

-- Verify comment creation timestamps (for real-time comment testing)
SELECT id, content, task_id, author_id, created_at
FROM "Comment"
WHERE task_id = 'TASK_ID'
ORDER BY created_at DESC;

-- Expected: Comments appear in chronological order matching test sequence
```

**Source:** Phase 1 verification evidence format

### Network Tab Verification

**What to check in Chrome DevTools → Network tab:**

1. **WebSocket connection handshake:**
   - Filter by "WS" type
   - Should see connection to `ws://localhost:3001` or configured WS URL
   - Status: "101 Switching Protocols" (success)
   - Headers tab: Verify `Authorization` header or `auth` query param contains JWT

2. **Message frames:**
   - Click on WebSocket connection
   - "Messages" tab shows sent/received frames
   - Verify `join:project` sent after connection
   - Verify `task:created`, `task:updated` received when other tab makes changes

3. **Reconnection behavior:**
   - Go offline, wait 5 seconds, go online
   - Should see new WebSocket connection established
   - Should see API requests refetching data (GET /projects/:id/tasks)

**Screenshot example locations:**
- `.planning/phases/07-phase-3-verification/evidence/network-tab-ws-connection.png`
- `.planning/phases/07-phase-3-verification/evidence/network-tab-messages.png`

**Source:** [How to Manually Test WebSocket APIs](https://adequatica.medium.com/how-to-manually-test-websocket-apis-855393911d1a)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Automated WebSocket tests only | Manual testing for initial verification, automation later | Ongoing 2026 | Faster validation cycles, automation deferred until patterns stabilize |
| WebSocket testing via Postman | Browser DevTools native WebSocket inspection | 2020+ | No third-party tools needed, real browser environment |
| Single-user testing | Multi-tab/multi-user concurrent testing | Always required | Catches race conditions, synchronization bugs invisible in single-user tests |
| No evidence documentation | Structured verification reports with evidence links | Phase 1 (this project) | Auditable proof of testing, portfolio-quality documentation |

**Deprecated/outdated:**
- **WebSocket Echo Test websites:** Generic echo servers don't test application-specific logic (rooms, authentication, business events)
- **Postman WebSocket (beta):** Browser DevTools now natively support WebSocket inspection with better integration
- **Manual event emission without code review:** Always verify implementation exists before testing—don't assume feature works based on plan alone

## Open Questions

1. **Should Phase 7 include automated test creation?**
   - What we know: Phase 4 plan 04-09 created Playwright E2E tests, test infrastructure exists
   - What's unclear: Is WebSocket test automation in scope for Phase 7 or deferred to future work?
   - Recommendation: Manual testing only for Phase 7 (matches phase goal "manual testing"), defer WebSocket E2E automation to Phase 8 or future enhancement

2. **What level of detail for evidence capture?**
   - What we know: Phase 1 verification included code references, database queries, artifact verification
   - What's unclear: Should Phase 7 include video recordings, or are screenshots + console logs sufficient?
   - Recommendation: Screenshots + console logs sufficient; video recording adds complexity without proportional value for documentation

3. **Should testing use demo workspace or create fresh test data?**
   - What we know: Phase 2 plan 02-11 created demo workspace with seed data
   - What's unclear: Test against demo data (realistic) or fresh data (clean slate)?
   - Recommendation: Use demo workspace for realistic testing, note in VERIFICATION.md that demo data was used

4. **How to handle partial failures?**
   - What we know: Phase 1 passed 7/7 criteria; unclear what happens if only 8/10 Phase 3 criteria pass
   - What's unclear: Does phase pass with 80% success, or require 100%?
   - Recommendation: Document all results truthfully, mark status as "PARTIAL" if any criteria fail, create follow-up issues for failures

## Sources

### Primary (HIGH confidence)
- [Phase 3 Plan 03-04 Task 2](file://.planning/phases/03-real-time-collaboration/03-04-PLAN.md) - Original verification checklist with 7 test scenarios
- [Phase 1 VERIFICATION.md](file://.planning/phases/01-foundation-authentication/01-VERIFICATION.md) - Established verification report format
- [Socket.IO v4 Documentation - Debugging](https://socket.io/docs/v4/debugging/) - Official debugging guide for Socket.IO applications

### Secondary (MEDIUM confidence)
- [How to Manually Test WebSocket APIs](https://adequatica.medium.com/how-to-manually-test-websocket-apis-855393911d1a) - Practical manual testing guide (Medium, 2023)
- [WebSocket Testing Essentials](https://www.thegreenreport.blog/articles/websocket-testing-essentials-strategies-and-code-for-real-time-apps/websocket-testing-essentials-strategies-and-code-for-real-time-apps.html) - Strategies for real-time app testing
- [Top 10 WebSocket Testing Tools](https://apidog.com/blog/websocket-testing-tools/) - Tool comparison (Apidog, 2026)
- [Socket.IO Load Testing](https://socket.io/docs/v4/load-testing/) - Official guide (relevant for understanding scale, though load testing out of scope)

### Tertiary (LOW confidence - background reading)
- [WebSocket Security Best Practices](https://www.invicti.com/blog/web-security/websocket-security-best-practices) - Security testing checklist
- [WebSocket Mobile Testing](https://yrkan.com/blog/websocket-mobile-testing/) - Mobile-specific considerations (not directly applicable)

## Metadata

**Confidence breakdown:**
- Verification format: HIGH - Phase 1 provides clear template, requirements mapping established
- Test scenarios: HIGH - Phase 3 plan 03-04 already defined comprehensive scenarios, just need execution
- Evidence requirements: MEDIUM - Format established but specific to Phase 1 auth/RBAC, need to adapt for real-time features
- Manual testing best practices: MEDIUM - Industry practices verified from multiple sources, but project-specific approach needs definition

**Research date:** 2026-02-16
**Valid until:** ~30 days (2026-03-16) - Manual testing practices stable, WebSocket debugging tools unlikely to change significantly
