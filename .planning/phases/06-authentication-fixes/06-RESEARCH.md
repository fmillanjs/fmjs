# Phase 6: Authentication Fixes - Research

**Researched:** 2026-02-15
**Domain:** JWT authentication configuration, environment variable management, WebSocket security
**Confidence:** HIGH

## Summary

Phase 6 resolves the WebSocket authentication failure identified in Phase 5.1 investigation, which is blocking all real-time collaboration features from Phase 3. The root cause is confirmed: JWT_SECRET environment variable mismatch between the Next.js frontend (NextAuth) and NestJS backend due to fallback secret configuration and environment variable loading issues in the monorepo.

The investigation revealed that the code implementation is 100% correct - all Server Components properly await auth(), all WebSocket authentication logic follows best practices, and SSR session handling is compliant with Next.js 15. The issue is purely configuration: the frontend has a fallback secret that differs from the .env value, and the .env.local file in apps/web/ does not include JWT_SECRET, causing NextAuth to use the fallback instead of the shared secret.

This phase implements a straightforward configuration fix with validation and security hardening: ensure consistent JWT_SECRET loading across both applications, remove dangerous fallback secrets that mask misconfiguration, add startup validation to fail fast, rotate to a cryptographically secure 512-bit secret, and implement end-to-end testing to verify all Phase 3 real-time features work correctly.

**Primary recommendation:** Fix JWT_SECRET consistency by adding it to apps/web/.env.local, remove all fallback secrets to fail fast on misconfiguration, rotate to a 64-byte (512-bit) cryptographically secure secret, add startup validation on both apps, and verify real-time features work with manual and automated testing.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-auth | ~5.0.0-beta.25 | NextAuth.js authentication | Already installed, generates JWT tokens for WebSocket auth |
| @nestjs/jwt | ^11.0.1 | NestJS JWT module | Already installed, verifies JWT tokens in WebSocket connections |
| jsonwebtoken | ^9.0.2 | JWT signing/verification | Already used in NextAuth session callback for accessToken generation |
| @nestjs/config | ^3.4.0 | NestJS configuration management | Already installed, loads environment variables with validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| joi | ^17.15.0 | Schema validation | Already installed, recommended for environment variable validation in NestJS ConfigModule |
| crypto (Node.js built-in) | Built-in | Cryptographically secure random generation | For generating production JWT_SECRET (64 bytes for HS256) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shared .env file | Separate .env per app | Shared reduces duplication but requires proper loading; separate allows app-specific values but risks drift |
| Fail-fast validation | Silent fallbacks | Fail-fast prevents production issues; fallbacks mask misconfiguration and waste debugging time |
| 512-bit secrets | 256-bit minimum | 512-bit provides security margin and future algorithm flexibility; 256-bit is RFC minimum but less margin |

**Installation:**
No new dependencies required - all necessary libraries already installed.

**Secret Generation:**
```bash
# Generate cryptographically secure 512-bit (64-byte) JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## Architecture Patterns

### Recommended Configuration Structure
```
/home/doctor/fernandomillan/
├── .env                           # Shared monorepo secrets (gitignored)
│   └── JWT_SECRET=<shared-secret> # Backend reads this via ConfigService
├── apps/web/
│   ├── .env.local                 # Next.js environment overrides (gitignored)
│   │   ├── NEXTAUTH_SECRET=<same> # NextAuth encryption secret
│   │   ├── JWT_SECRET=<same>      # CRITICAL: Must match .env value
│   │   ├── NEXTAUTH_URL=...
│   │   └── ...other Next.js vars
│   └── lib/auth.ts                # Remove fallback, fail fast if JWT_SECRET missing
└── apps/api/
    └── src/modules/auth/
        └── auth.module.ts         # Already has fail-fast validation
```

### Pattern 1: Fail-Fast Environment Validation

**What:** Validate critical environment variables at application startup and throw clear errors if missing or invalid
**When to use:** ALWAYS for production applications - prevents silent failures and security issues
**Why critical:** Fallback secrets mask misconfiguration, causing hard-to-debug authentication failures in production

**Example (Frontend - Next.js):**
```typescript
// apps/web/lib/auth.ts - Session callback
// BEFORE (Current - has fallback):
const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';

// AFTER (Fail-fast - no fallback):
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error(
    'JWT_SECRET environment variable is required for WebSocket authentication. ' +
    'Add JWT_SECRET to apps/web/.env.local with the same value as the root .env file.'
  );
}
if (jwtSecret.length < 32) {
  throw new Error(
    `JWT_SECRET must be at least 32 characters (256 bits). Current length: ${jwtSecret.length}`
  );
}

console.log('[NextAuth Session] JWT configuration validated:', {
  secretLength: jwtSecret.length,
  secretHashSHA256: crypto.createHash('sha256').update(jwtSecret).digest('hex').substring(0, 16),
});
```

**Example (Backend - NestJS):**
```typescript
// apps/api/src/modules/auth/auth.module.ts
// ALREADY IMPLEMENTED - no changes needed:
JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables'); // ✓ Already fails fast
    }
    // Already logs secret presence and length
    console.log('[Auth Module] JWT configured:', {
      secretPresent: !!secret,
      secretLength: secret?.length,
      expiresIn,
      algorithm: 'HS256',
    });
    return { secret, signOptions: { expiresIn, algorithm: 'HS256' }, verifyOptions: { algorithms: ['HS256'] } };
  },
}),
```

### Pattern 2: Secret Hash Logging (Not Full Secret)

**What:** Log a hash or fingerprint of secrets to verify consistency without exposing the actual secret value
**When to use:** Startup validation, debugging environment variable loading issues
**Why important:** Allows verification that both apps load the same secret without logging sensitive data

**Example:**
```typescript
// apps/web/lib/auth.ts - Startup validation
import crypto from 'crypto';

function logSecretFingerprint(secret: string, label: string) {
  const hash = crypto.createHash('sha256').update(secret).digest('hex');
  console.log(`[${label}] Secret fingerprint (SHA256):`, hash.substring(0, 16)); // First 16 chars of hash
}

// In session callback or startup:
logSecretFingerprint(jwtSecret, 'NextAuth JWT');
// Output: [NextAuth JWT] Secret fingerprint (SHA256): a3f2d8e9c1b4a5f6

// Compare with backend logs to verify they match
```

### Pattern 3: Monorepo Environment Variable Strategy

**What:** Use root .env for shared backend secrets, app-specific .env.local for frontend overrides, document precedence
**When to use:** Turborepo/monorepo setups where multiple apps share infrastructure (database, Redis, JWT secrets)
**Why this approach:** Next.js doesn't automatically load root .env for server-side code - must explicitly configure

**Configuration:**
```bash
# Root .env (backend loads this via NestJS ConfigService)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<64-byte-base64-encoded-secret>

# apps/web/.env.local (Next.js server loads this)
# Must duplicate critical shared secrets:
JWT_SECRET=<same-64-byte-secret>  # CRITICAL: Must match root .env
NEXTAUTH_SECRET=<same-or-different> # Can be same or separate secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Database/Redis can reference root or duplicate:
DATABASE_URL=postgresql://... # Next.js needs this for Prisma client
REDIS_URL=redis://...         # Next.js needs this for session storage
```

**Next.js Environment Loading Priority (highest to lowest):**
1. `.env.local` (server-side only, gitignored)
2. `.env.development` or `.env.production` (committed)
3. `.env` (root - NOT loaded by Next.js by default)

**Key Insight:** Next.js does NOT automatically load root .env file. Must explicitly add JWT_SECRET to apps/web/.env.local.

### Anti-Patterns to Avoid

- **Fallback secrets in production code:** Silent failures mask misconfiguration - fail fast instead
- **Logging full secret values:** Security risk - log hashes/fingerprints only
- **Assuming Next.js loads root .env:** Next.js requires app-specific .env.local for server-side variables
- **Short JWT secrets (< 256 bits):** Vulnerable to brute force - use 512 bits minimum
- **Same secret for NEXTAUTH_SECRET and JWT_SECRET:** Not required, but acceptable if both are 512-bit
- **Committing .env.local to git:** Contains production secrets - must be gitignored

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT secret rotation | Custom rotation scripts | HashiCorp Vault, AWS Secrets Manager, Azure Key Vault | Professional secret managers handle rotation, audit logs, access control, versioning automatically |
| Environment validation | Custom validation code | Joi schemas with @nestjs/config, envalid library | Schema-based validation catches errors early, well-tested, type-safe |
| Secret generation | Math.random(), simple strings | crypto.randomBytes(64) (Node.js built-in) | crypto module uses CSPRNG (cryptographically secure), Math.random() is NOT secure |
| Environment variable precedence | Custom .env loader | Next.js built-in .env support, @nestjs/config | Framework solutions handle edge cases (caching, type conversion, precedence rules) |

**Key insight:** Authentication and secret management are security-critical. Use battle-tested libraries and frameworks, not custom implementations.

## Common Pitfalls

### Pitfall 1: Next.js Server-Side Environment Variable Loading in Monorepos

**What goes wrong:** Developers assume Next.js automatically loads root .env file for server-side code (API routes, Server Components), leading to undefined process.env.JWT_SECRET

**Why it happens:**
- Next.js loads .env files relative to the app directory (apps/web/), not monorepo root
- Turborepo documentation focuses on globalDependencies but not explicit loading
- Root .env is loaded by NestJS ConfigService but NOT Next.js

**How to avoid:**
- Always add critical shared secrets to apps/web/.env.local
- Document environment variable requirements in README
- Use fail-fast validation to catch missing variables at startup
- Log secret fingerprints (not full values) to verify consistency

**Warning signs:**
- Backend logs show secret length 61+ characters, frontend uses fallback (40 chars)
- WebSocket "invalid signature" errors despite correct code
- Authentication works locally but fails in different environments

### Pitfall 2: Fallback Secrets Masking Configuration Errors

**What goes wrong:** Code includes fallback values like `process.env.JWT_SECRET || 'dev-secret'`, which silently use wrong secret when environment variable loading fails

**Why it happens:**
- Developers want applications to "just work" in development
- Copy-paste from tutorials that include fallbacks for simplicity
- Fear of breaking local development environments

**How to avoid:**
- Remove ALL fallback secrets in authentication code
- Fail fast with clear error messages pointing to solution
- Provide .env.example files with instructions
- Use development-specific .env.development files (committed) with safe placeholder values that clearly indicate they must be changed

**Warning signs:**
- Authentication failures with no clear error message
- "Invalid signature" errors in logs but no indication of environment variable issues
- Different behavior between developers' machines (some load .env correctly, others use fallback)

### Pitfall 3: Insufficient JWT Secret Length

**What goes wrong:** Developers use short, memorable strings as JWT secrets (e.g., "mysecret123"), making tokens vulnerable to brute-force attacks

**Why it happens:**
- Lack of awareness of HS256 security requirements
- Convenience during development
- Tutorials using simple examples without security warnings

**How to avoid:**
- RFC 7518 requires minimum 256 bits (32 bytes) for HS256
- Best practice: 512 bits (64 bytes) for security margin
- Generate with `crypto.randomBytes(64).toString('base64')`
- Add validation at startup to enforce minimum length
- Document secret generation in deployment guide

**Warning signs:**
- JWT_SECRET shorter than 32 characters
- Readable/memorable secret strings (not random)
- Same secret across all environments

### Pitfall 4: No Secret Rotation Strategy

**What goes wrong:** JWT_SECRET never changed after initial deployment, increasing blast radius if compromised

**Why it happens:**
- Rotation breaks existing tokens (requires coordinated deployment)
- No automated rotation tooling configured
- Developers assume "secure secret = never rotate"

**How to avoid:**
- Plan rotation strategy from day 1 (every 90 days recommended)
- Use dual-key verification during rotation (verify with new secret, fall back to old for grace period)
- Document rotation procedure
- Consider secret management tools (AWS Secrets Manager, Vault) for automated rotation

**Warning signs:**
- JWT_SECRET unchanged for > 90 days
- No documented rotation procedure
- Hard-coded secret in application config (not environment variable)

### Pitfall 5: Testing Only Happy Path

**What goes wrong:** Developers test successful authentication but not failure cases (missing secret, wrong secret, expired token), missing production-breaking issues

**Why it happens:**
- Happy path testing is faster and easier
- Failure cases require environment manipulation
- Assumption that "if login works, everything works"

**How to avoid:**
- Test missing JWT_SECRET (expect startup failure)
- Test mismatched secrets (expect connection rejection)
- Test expired tokens (expect re-authentication)
- Add E2E tests for WebSocket authentication flow
- Use CI/CD to validate environment configuration

**Warning signs:**
- No E2E tests for WebSocket connections
- Manual testing only (no automated validation)
- Failures discovered in production, not staging

## Code Examples

Verified patterns from Phase 5.1 investigation findings and official documentation:

### JWT Secret Validation (Frontend)

```typescript
// apps/web/lib/auth.ts - Session callback
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// In session callback (around line 204):
const jwtSecret = process.env.JWT_SECRET;

// Fail-fast validation
if (!jwtSecret) {
  throw new Error(
    'JWT_SECRET environment variable is required. ' +
    'Add it to apps/web/.env.local matching the root .env value.'
  );
}

if (jwtSecret.length < 32) {
  throw new Error(
    `JWT_SECRET must be at least 32 characters (256 bits). ` +
    `Current length: ${jwtSecret.length}. ` +
    `Generate a secure secret with: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"`
  );
}

// Log fingerprint for verification (not full secret)
const secretHash = crypto.createHash('sha256').update(jwtSecret).digest('hex');
console.log('[NextAuth Session] JWT Secret validated:', {
  length: jwtSecret.length,
  fingerprint: secretHash.substring(0, 16), // First 16 chars of SHA256 hash
});

// Generate access token (existing code - no changes)
const accessToken = jwt.sign(
  { sub: user.id, email: user.email, role: user.role },
  jwtSecret,
  { expiresIn: '15m' }
);
```

### Environment Configuration File Updates

```bash
# apps/web/.env.local - ADD JWT_SECRET
# BEFORE: Missing JWT_SECRET, NextAuth uses fallback

# AFTER: Add JWT_SECRET matching root .env
DATABASE_URL=postgresql://teamflow:teamflow_dev@localhost:5434/teamflow
REDIS_URL=redis://localhost:6380

# NextAuth
NEXTAUTH_SECRET=dev-secret-change-in-production-min-32-chars-required-for-jwt
NEXTAUTH_URL=http://localhost:3000

# JWT (CRITICAL - must match root .env)
JWT_SECRET=dev-secret-change-in-production-min-32-chars-required-for-jwt

# API endpoints
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Production Secret Generation

```bash
# Generate 512-bit (64-byte) cryptographically secure secret
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Example output (USE THIS FORMAT):
# vK8mQ7nP2xR5wT9yF4hJ6kL3sD8fG1aZ5cV7bN9mX2qW4eR6tY8uI0oP3aS5dF7g...
```

### Manual Verification Test

```bash
# 1. Start backend (verify secret fingerprint in logs)
cd apps/api
npm run dev
# Look for: [Auth Module] JWT configured: { secretPresent: true, secretLength: 61, ... }

# 2. Start frontend (verify secret fingerprint matches)
cd apps/web
npm run dev
# Look for: [NextAuth Session] JWT Secret validated: { length: 61, fingerprint: 'a3f2d8e9...' }

# 3. Login and check WebSocket connection
# Open browser: http://localhost:3000/login
# Login as: demo1@teamflow.dev / Password123!
# Open browser DevTools Console
# Navigate to a team workspace
# Look for: [WebSocket Client] Connected to server

# 4. Verify backend accepted connection
# Backend terminal should show:
# [WS Auth] Verification SUCCESS: { sub: '...', email: 'demo1@teamflow.dev' }
```

### E2E Test Pattern (Playwright)

```typescript
// e2e/websocket-auth.spec.ts (EXAMPLE - not yet implemented)
import { test, expect } from '@playwright/test';

test.describe('WebSocket Authentication', () => {
  test('should connect to WebSocket after login', async ({ page }) => {
    // Track WebSocket connections
    const wsConnections: string[] = [];
    page.on('websocket', (ws) => {
      wsConnections.push(ws.url());
      ws.on('framereceived', (event) => {
        if (event.payload.includes('auth')) {
          console.log('[Test] WebSocket auth frame:', event.payload);
        }
      });
    });

    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'demo1@teamflow.dev');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Navigate to team (triggers WebSocket connection)
    await page.waitForURL('**/teams/**');

    // Verify WebSocket connected
    await page.waitForTimeout(2000); // Wait for connection
    expect(wsConnections.length).toBeGreaterThan(0);
    expect(wsConnections[0]).toContain('ws://localhost:3001');

    // Verify no authentication errors in console
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    expect(consoleErrors.filter(e => e.includes('Invalid token'))).toHaveLength(0);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single .env for entire monorepo | App-specific .env.local + root .env | Turborepo 1.0+ (2022) | Better isolation, but requires duplicate shared secrets |
| Fallback secrets everywhere | Fail-fast validation | Security best practice (ongoing) | Catches misconfiguration early, prevents production issues |
| 256-bit JWT secrets | 512-bit secrets | RFC 7518 + brute-force research (2023+) | Future-proof security margin |
| Manual secret rotation | Automated with secret managers | Cloud-native adoption (2020+) | Reduces human error, audit trail |
| JWT in localStorage | JWT in memory + HttpOnly cookies for refresh | XSS attack awareness (2021+) | Reduces XSS attack surface |

**Deprecated/outdated:**
- **NEXTAUTH_SECRET as only secret**: NextAuth v5 now supports separate JWT_SECRET for API tokens vs NEXTAUTH_SECRET for session encryption
- **RS256 for simple apps**: HS256 is sufficient and simpler when not distributing public keys; RS256 adds complexity without benefit for monolithic apps
- **.env without validation**: Modern practice requires schema validation (Joi, Zod) at startup
- **NEXT_PUBLIC_ prefix for secrets**: Never expose secrets to client; NEXT_PUBLIC_ embeds in client bundle

## Open Questions

### Question 1: Should JWT_SECRET and NEXTAUTH_SECRET be the same value?

**What we know:**
- NEXTAUTH_SECRET encrypts session tokens and email verification tokens
- JWT_SECRET signs API access tokens for WebSocket/API authentication
- Both currently use the same value in .env
- Security-wise, separate secrets provide better isolation

**What's unclear:**
- Does using separate secrets provide meaningful security improvement for this use case?
- Would separate secrets complicate rotation?
- Industry best practice for NextAuth + NestJS integration?

**Recommendation:**
- **Phase 6 (immediate):** Keep same value for simplicity, rotate to 512-bit secure secret
- **Future consideration:** Evaluate separate secrets if implementing advanced rotation strategy
- Document decision in deployment guide

### Question 2: Should we implement dual-key verification for zero-downtime rotation?

**What we know:**
- Current setup: single JWT_SECRET, no rotation strategy
- Dual-key approach: verify with new secret first, fall back to old secret during grace period
- Rotation window: 15 minutes (current token lifetime)

**What's unclear:**
- Frequency of rotation in production (90 days? 180 days?)
- Whether 15-minute token lifetime is sufficient for simple rotation (pause → rotate → restart)
- Cost/benefit of dual-key complexity vs downtime tolerance

**Recommendation:**
- **Phase 6 (immediate):** Document simple rotation procedure (low-traffic window, coordinated restart)
- **Future phase:** Implement dual-key verification if uptime SLA requires zero-downtime rotation
- Defer to production monitoring data (if token expirations cause user complaints, invest in dual-key)

### Question 3: Should we add JWT refresh tokens?

**What we know:**
- Current: 15-minute access token expiration, no refresh tokens
- Redis session stores 30-day session data
- Users must re-authenticate every 15 minutes if WebSocket connection drops

**What's unclear:**
- User experience impact of 15-minute expiration (is it too short?)
- Whether Redis session effectively acts as "refresh token" (session callback regenerates accessToken)
- Complexity vs benefit of formal refresh token flow

**Recommendation:**
- **Phase 6 (immediate):** Keep current 15-minute expiration, monitor user feedback
- **Future consideration:** Extend to 1 hour if 15 minutes causes UX issues
- Refresh tokens NOT needed - session callback already regenerates accessToken on each request

## Sources

### Primary (HIGH confidence)
- Phase 5.1 Investigation Findings (.planning/phases/05.1-authentication-investigation/05.1-FINDINGS.md)
- Phase 5.1 Plan 01 Summary (.planning/phases/05.1-authentication-investigation/05.1-01-SUMMARY.md)
- Phase 5.1 Plan 02 Summary (.planning/phases/05.1-authentication-investigation/05.1-02-SUMMARY.md)
- Current codebase auth implementation (apps/web/lib/auth.ts, apps/api/src/modules/auth/auth.module.ts)
- [Next.js Environment Variables Guide](https://nextjs.org/docs/pages/guides/environment-variables)
- [NextAuth.js Options Documentation](https://next-auth.js.org/configuration/options)
- [Auth.js Environment Variables](https://authjs.dev/guides/environment-variables)
- [NestJS ConfigModule Documentation](https://docs.nestjs.com/techniques/configuration)

### Secondary (MEDIUM confidence)
- [JWT Security Best Practices - Curity](https://curity.io/resources/learn/jwt-best-practices/)
- [Brute Forcing HS256 - Auth0](https://auth0.com/blog/brute-forcing-hs256-is-possible-the-importance-of-using-strong-keys-to-sign-jwts/)
- [How to Create a JWT Secret in Node.js - H2S Media](https://www.how2shout.com/how-to/how-to-create-jwt-secret-in-nodejs.html)
- [JWT Secret Key Generator Guide - QubitTool](https://qubittool.com/blog/jwt-secret-key-generator-guide)
- [NestJS Environment Variables Best Practices - Medium](https://mdjamilkashemporosh.medium.com/nestjs-environment-variables-best-practices-for-validating-and-structuring-configs-a24a8e8d93c1)
- [Validating Environment Variables in Node.js - Medium](https://medium.com/@davidminaya04/validating-environment-variables-in-node-js-c1c917a45d66)
- [The Best Way to Authenticate WebSockets in NestJS - Preet Mishra](https://preetmishra.com/blog/the-best-way-to-authenticate-websockets-in-nestjs)
- [Socket.IO JWT Authentication Guide](https://socket.io/how-to/use-with-jwt)
- [Turborepo Environment Variables Documentation](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables)

### Tertiary (LOW confidence - needs verification)
- [JWT in Production Security Best Practices - Medium](https://medium.com/@geoffrey.muselli/jwt-in-production-security-best-practices-a1067fb7fd02)
- [How to Configure Node.js for Production with Environment Variables - OneUptime](https://oneuptime.com/blog/post/2026-01-06-nodejs-production-environment-variables/view)
- [Guide to Playwright End-to-End Testing in 2026 - DeviQA](https://www.deviqa.com/blog/guide-to-playwright-end-to-end-testing-in-2025/)

## Metadata

**Confidence breakdown:**
- Root cause identification: HIGH - Phase 5.1 investigation conclusively identified JWT_SECRET mismatch with empirical evidence
- Fix approach: HIGH - Add JWT_SECRET to .env.local, remove fallbacks, add validation
- Environment variable loading: MEDIUM - Next.js documentation clear, but monorepo-specific behavior requires verification
- Security best practices: HIGH - RFC 7518 and industry standards well-documented
- Testing approach: MEDIUM - Patterns established, but E2E WebSocket testing needs implementation

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days - stable domain)

**Key assumptions:**
1. Next.js server-side code does NOT automatically load root .env - requires apps/web/.env.local
2. Current JWT_SECRET length (61 chars) is sufficient but should be rotated to 64-byte (512-bit) for best practice
3. Phase 3 real-time features are fully implemented and only blocked by authentication
4. 15-minute access token expiration is acceptable user experience
5. Turborepo globalDependencies configuration correctly invalidates cache on .env changes

**Validation required:**
- Verify Next.js loads apps/web/.env.local on server-side (test by logging process.env.JWT_SECRET)
- Confirm Backend logs and Frontend logs show matching secret fingerprints after fix
- End-to-end test of WebSocket connection after login
- Verify all Phase 3 real-time features (presence, task updates, comments) work after fix
