# Phase 15: Authentication System - Research

**Researched:** 2026-02-17
**Domain:** NestJS 11 JWT authentication (cookie-based), CASL deny-by-default RBAC guard, Prisma schema migration, Next.js 15 login/logout UI, Vitest unit test for guard enforcement
**Confidence:** HIGH (based on codebase inspection and verified library documentation)

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up for a DevCollab account (separate from TeamFlow) | Prisma schema needs `password` field added; bcrypt hashing; separate `DEVCOLLAB_JWT_SECRET` env var confirmed absent from docker-compose — must be added |
| AUTH-02 | User can log in with email and password | `@nestjs/passport` + `passport-jwt` already installed at monorepo root; `ExtractJwt.fromExtractors` with cookie extractor pattern verified; `AuthService.login` + `AuthService.validateUser` pattern from TeamFlow is the template |
| AUTH-03 | User session persists across browser refresh (httpOnly cookie) | `cookie-parser` NOT yet installed; must be added to `devcollab-api`; `res.cookie(name, token, { httpOnly: true, sameSite: 'strict' })` is the NestJS standard; Next.js 15 App Router reads cookies server-side via `cookies()` from `next/headers` |
| AUTH-04 | User can log out | `res.clearCookie(name)` or `res.cookie(name, '', { maxAge: 0 })` in the logout endpoint; Next.js client calls POST /auth/logout then redirects |
</phase_requirements>

---

## Summary

Phase 15 builds the complete DevCollab authentication system. The infrastructure from Phase 14 is verified in place: `CaslAuthGuard` is registered as `APP_GUARD` (deny-by-default returning `false`), the `@Public()` decorator exists, and the Prisma `devcollab-client` is isolated. Phase 15 has three concerns: (1) upgrade the guard so that after JWT validation it enforces `@CheckAbility` presence (403 without it) and sets `req.user`; (2) wire signup/login/logout endpoints with httpOnly cookie JWT; (3) build a minimal Next.js login/logout UI that stores session in the httpOnly cookie.

The critical architectural distinction from TeamFlow: TeamFlow extracts JWT from the `Authorization: Bearer` header; DevCollab extracts from an httpOnly cookie. TeamFlow's `RbacGuard` _allows_ routes without `@CheckAbility`; DevCollab's guard must _deny_ routes without it. Both differences are deliberate per the Phase 14 decision log.

The unit test requirement is a meta-test: it imports all controller classes, enumerates their route handler methods via `Reflect.getMetadata('path', prototype, methodName)`, checks each for `@Public()` or `@CheckAbility()` metadata, and asserts that every non-public method has `@CheckAbility` defined. This is a structural test (no HTTP requests), purely using `reflect-metadata`.

**Primary recommendation:** Add `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `cookie-parser` to `devcollab-api`; add `password` field to Prisma User model; follow the TeamFlow auth service pattern adapted for cookies.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/jwt` | 11.0.2 (installed at root) | JWT signing and verification | NestJS official JWT integration; `JwtModule.registerAsync` with config service |
| `@nestjs/passport` | 11.0.5 (installed at root) | Passport.js integration for NestJS | Official NestJS passport bridge; `PassportStrategy`, `AuthGuard` |
| `passport-jwt` | 4.0.1 (installed at root) | JWT extraction and validation strategy | Standard Passport strategy for JWT; supports `fromExtractors` for cookie |
| `bcrypt` | 6.0.0 (installed at root) | Password hashing | Installed at monorepo root; same version TeamFlow uses |
| `cookie-parser` | NOT installed — must add | Populate `req.cookies` from Cookie header | NestJS official technique; required for `req.cookies.token` access in passport strategy |
| `@casl/ability` | 6.8.0 (installed at root) | CASL ability building | Already installed; `AbilityBuilder` used in guard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `nestjs-zod` or `class-validator` | nestjs-zod 5.1.1 at root | DTO validation for signup/login body | Use `nestjs-zod` (already in TeamFlow) or plain class-validator; pick one per team convention |
| `@types/cookie-parser` | latest | TypeScript types for cookie-parser | Install alongside `cookie-parser` in devDependencies |
| `@types/bcrypt` | 6.0.0 (in TeamFlow API) | TypeScript types for bcrypt | Add to devcollab-api devDependencies |
| `@types/passport-jwt` | 4.0.1 (in TeamFlow API) | TypeScript types for passport-jwt | Add to devcollab-api devDependencies |
| `vitest` | 4.0.18 (installed at root) | Unit test runner | Already at root; use same vitest config as TeamFlow API |
| `vite-tsconfig-paths` | 6.1.1 (in TeamFlow API) | Vitest tsconfig path resolution | Required for `@devcollab/database` path alias in tests |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `cookie-parser` middleware | Manual `req.headers.cookie` parsing | `cookie-parser` is the NestJS official technique — don't hand-parse cookies |
| `bcrypt` | `argon2` | bcrypt already installed, team already familiar, good enough |
| `passport-jwt` with `fromExtractors` | Manual JWT verification in guard | passport-jwt is already installed and the TeamFlow JwtStrategy is the direct template |

**Installation for devcollab-api:**
```bash
# In monorepo root (already at root; devcollab-api resolves from root node_modules)
npm install cookie-parser

# In apps/devcollab-api (add to package.json dependencies)
# @nestjs/jwt, @nestjs/passport, passport, passport-jwt, bcrypt, cookie-parser
# — these are in root node_modules but must be declared in devcollab-api/package.json
# so turbo prune includes them in the Docker build context
```

---

## Architecture Patterns

### Current State After Phase 14

```
apps/devcollab-api/src/
├── app.module.ts               # AppModule with CaslAuthGuard as APP_GUARD
├── main.ts                     # NestFactory.create, listens on 3003
├── common/decorators/
│   └── public.decorator.ts     # @Public() = SetMetadata('isPublic', true)
├── guards/
│   └── casl-auth.guard.ts      # Deny-by-default: returns false unless @Public()
└── health/
    ├── health.controller.ts    # GET /health with @Public()
    └── health.module.ts

packages/devcollab-database/prisma/schema.prisma:
  User { id, email, name, createdAt, updatedAt }
  -- MISSING: password field
```

### Phase 15 Target Structure

```
apps/devcollab-api/src/
├── app.module.ts               # Add AuthModule, ConfigModule, DatabaseModule
├── main.ts                     # Add app.use(cookieParser()), enableCors
├── common/decorators/
│   ├── public.decorator.ts     # (unchanged)
│   ├── current-user.decorator.ts  # NEW: extract req.user
│   └── check-ability.decorator.ts # NEW: SetMetadata('check_ability', {action, subject})
├── guards/
│   └── casl-auth.guard.ts      # UPGRADED: JWT cookie validation + deny-by-default
├── health/
│   ├── health.controller.ts    # (unchanged, @Public())
│   └── health.module.ts
├── core/
│   ├── config/                 # NEW: ConfigModule with DEVCOLLAB env validation
│   └── database/               # NEW: PrismaService wrapping @devcollab/database
└── auth/
    ├── auth.module.ts          # NEW
    ├── auth.controller.ts      # NEW: POST /auth/signup, /auth/login, POST /auth/logout, GET /auth/me
    ├── auth.service.ts         # NEW: signup, login, logout logic
    ├── strategies/
    │   └── jwt.strategy.ts     # NEW: cookie-based extraction
    └── dto/
        ├── signup.dto.ts       # NEW
        └── login.dto.ts        # NEW

apps/devcollab-web/app/
├── layout.tsx                  # (unchanged)
├── page.tsx                    # REPLACED: real login form
└── (auth)/
    ├── login/page.tsx          # NEW: login form (client component)
    └── logout/route.ts         # NEW: server action or API route to call /auth/logout

packages/devcollab-database/prisma/
└── schema.prisma               # ADD: password String field to User model + migration

test/ (new in devcollab-api)
└── unit/
    ├── guards/
    │   └── casl-auth.guard.spec.ts    # Guard unit tests
    └── meta/
        └── controller-coverage.spec.ts # Enumerate all controllers, verify @CheckAbility
```

### Pattern 1: Updated CaslAuthGuard (JWT Cookie + Deny Without CheckAbility)

**What:** The existing `CaslAuthGuard` only checks `@Public()`. Phase 15 upgrades it to: (a) extract and verify JWT from cookie, (b) deny with 403 if no `@Public()` AND no `@CheckAbility`, (c) set `req.user` from JWT payload.

**Critical:** The guard must use `JwtService` to verify the token from cookie, then check `@CheckAbility` metadata. If neither `@Public()` nor `@CheckAbility` is present, throw `ForbiddenException`.

```typescript
// apps/devcollab-api/src/guards/casl-auth.guard.ts
// Source: TeamFlow jwt-auth.guard.ts + rbac.guard.ts adapted for cookie + deny-by-default
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { CHECK_ABILITY_KEY } from '../common/decorators/check-ability.decorator';

@Injectable()
export class CaslAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    // Not public: require JWT cookie
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.['devcollab_token'];

    if (!token) {
      throw new UnauthorizedException('No authentication token');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Set req.user so @CurrentUser() works downstream
    request.user = payload;

    // Deny-by-default: require @CheckAbility on every non-public endpoint
    const ability = this.reflector.getAllAndOverride<{ action: string; subject: string }>(
      CHECK_ABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!ability) {
      throw new ForbiddenException(
        'Endpoint must declare @CheckAbility — deny-by-default security invariant',
      );
    }

    return true;
  }
}
```

**Note on dependency injection:** The upgraded guard needs `JwtService`. This means `JwtModule` must be imported in `AppModule` (or in a shared module that the guard can access). Use `JwtModule.registerAsync` in `AppModule` itself, or export it from `AuthModule` and import `AuthModule` in `AppModule`.

### Pattern 2: JwtStrategy with Cookie Extraction

**What:** Passport strategy that reads JWT from `req.cookies.devcollab_token` cookie. Used only when routes use `@UseGuards(AuthGuard('jwt'))` directly — but in this architecture the guard is `CaslAuthGuard` which uses `JwtService.verify` directly. The Passport strategy is optional for Phase 15 if `CaslAuthGuard` handles verification manually. Including it is cleaner for future use.

```typescript
// apps/devcollab-api/src/auth/strategies/jwt.strategy.ts
// Source: tigran.tech/nestjs-cookie-based-jwt-authentication + TeamFlow jwt.strategy.ts adapted
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request as RequestType } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-devcollab') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: RequestType): string | null => {
          if (req?.cookies?.devcollab_token) {
            return req.cookies.devcollab_token as string;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('DEVCOLLAB_JWT_SECRET'),
      passReqToCallback: false,
    });
  }

  validate(payload: JwtPayload): { id: string; email: string } {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return { id: payload.sub, email: payload.email };
  }
}
```

### Pattern 3: Auth Controller — Signup / Login / Logout

**What:** Three public endpoints. Login sets httpOnly cookie. Logout clears it.

```typescript
// apps/devcollab-api/src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.signup(dto);
    this.setAuthCookie(res, token);
    return { user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.login(dto);
    this.setAuthCookie(res, token);
    return { user };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('devcollab_token', { httpOnly: true, sameSite: 'strict' });
    return { message: 'Logged out' };
  }

  private setAuthCookie(res: Response, token: string): void {
    res.cookie('devcollab_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
```

**Critical:** Use `@Res({ passthrough: true })` — NOT `@Res()` without passthrough. Without `passthrough: true`, NestJS hands full response control to Express and its JSON serialization lifecycle breaks (interceptors won't fire, return value is ignored). This is a common and painful mistake.

### Pattern 4: Auth Service

```typescript
// apps/devcollab-api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../core/database/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<{ user: object; token: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        password: hashedPassword,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  }

  async login(dto: LoginDto): Promise<{ user: object; token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  }
}
```

### Pattern 5: Prisma Schema — Add password Field

**What:** Add `password String` to the User model and generate + run a migration.

```prisma
// packages/devcollab-database/prisma/schema.prisma (updated)
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String   // bcrypt hash — NOT nullable; required for signup
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}
```

Migration command:
```bash
# From monorepo root
npx prisma migrate dev \
  --schema=packages/devcollab-database/prisma/schema.prisma \
  --name add_password_to_user
```

### Pattern 6: main.ts — Add cookie-parser and CORS

```typescript
// apps/devcollab-api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // REQUIRED: populate req.cookies for passport-jwt cookie extraction
  app.use(cookieParser());

  // CORS for devcollab-web on port 3002
  app.enableCors({
    origin: process.env.DEVCOLLAB_WEB_URL || 'http://localhost:3002',
    credentials: true, // REQUIRED: allows cookies to be sent cross-origin
  });

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`DevCollab API running on port ${port}`);
}

bootstrap();
```

**Critical:** `credentials: true` in CORS config is required for cookies to be included in cross-origin requests. Without it, browsers block the Set-Cookie response header.

### Pattern 7: CheckAbility Decorator

```typescript
// apps/devcollab-api/src/common/decorators/check-ability.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CHECK_ABILITY_KEY = 'check_ability';

export interface AbilityRequirement {
  action: string;
  subject: string;
}

export const CheckAbility = (action: string, subject: string) =>
  SetMetadata(CHECK_ABILITY_KEY, { action, subject } as AbilityRequirement);
```

### Pattern 8: CurrentUser Decorator

```typescript
// apps/devcollab-api/src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### Pattern 9: Unit Test — Controller Method Coverage (deny-by-default verification)

**What:** This is the critical meta-test from the success criteria. It enumerates all controller methods and verifies that each is either `@Public()` OR has `@CheckAbility()`.

```typescript
// apps/devcollab-api/test/unit/meta/controller-coverage.spec.ts
import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { IS_PUBLIC_KEY } from '../../../src/common/decorators/public.decorator';
import { CHECK_ABILITY_KEY } from '../../../src/common/decorators/check-ability.decorator';
import { HealthController } from '../../../src/health/health.controller';
import { AuthController } from '../../../src/auth/auth.controller';

// List ALL controller classes here. When a new controller is added, it MUST be added
// to this array — the test will then enforce the invariant automatically.
const ALL_CONTROLLERS = [HealthController, AuthController];

describe('Controller deny-by-default invariant', () => {
  for (const Controller of ALL_CONTROLLERS) {
    const prototype = Controller.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) => name !== 'constructor' && typeof prototype[name] === 'function',
    );

    describe(`${Controller.name}`, () => {
      for (const methodName of methodNames) {
        it(`method "${methodName}" must be @Public() or have @CheckAbility()`, () => {
          const handler = prototype[methodName];

          const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, handler);
          const hasCheckAbility = Reflect.getMetadata(CHECK_ABILITY_KEY, handler);
          const isPublicOnClass = Reflect.getMetadata(IS_PUBLIC_KEY, Controller);

          expect(
            isPublic || isPublicOnClass || hasCheckAbility,
            `${Controller.name}.${methodName} has neither @Public() nor @CheckAbility() — this violates the deny-by-default invariant`,
          ).toBeTruthy();
        });
      }
    });
  }
});
```

**Why this works:** NestJS decorators (`SetMetadata`) store values via `Reflect.defineMetadata` on the decorated function. `Reflect.getMetadata(key, handler)` retrieves it. This is a pure reflection test — no HTTP, no DI container needed.

### Pattern 10: AppModule Updated

```typescript
// apps/devcollab-api/src/app.module.ts (Phase 15 version)
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CaslAuthGuard } from './guards/casl-auth.guard';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './core/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: process.env.DEVCOLLAB_JWT_SECRET,
        signOptions: { expiresIn: '7d', algorithm: 'HS256' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
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

**Note on `JwtModule.registerAsync` with `global: true`:** This makes `JwtService` injectable everywhere without importing `JwtModule` in each feature module. It is needed because `CaslAuthGuard` is registered as `APP_GUARD` at root level and needs `JwtService`.

### Pattern 11: Environment Variables to Add

The following env vars must be added to `.env` and `.env.example` for Phase 15:

```bash
# DevCollab Auth
DEVCOLLAB_JWT_SECRET=your-separate-devcollab-jwt-secret-here
DEVCOLLAB_WEB_URL=http://localhost:3002
```

And to `docker-compose.yml` under the `devcollab-api` service environment:
```yaml
DEVCOLLAB_JWT_SECRET: ${DEVCOLLAB_JWT_SECRET}
DEVCOLLAB_WEB_URL: ${DEVCOLLAB_WEB_URL:-http://localhost:3002}
```

### Pattern 12: Next.js Login Form (devcollab-web)

```tsx
// apps/devcollab-web/app/page.tsx (or app/login/page.tsx)
// Client component that POSTs to devcollab-api /auth/login
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('http://localhost:3003/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // REQUIRED: sends/receives cookies
    });
    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setError(data.message || 'Login failed');
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>DevCollab Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email<br />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
        </div>
        <div>
          <label>Password<br />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Log In</button>
      </form>
    </main>
  );
}
```

**Critical:** `credentials: 'include'` in `fetch` is required for cross-origin cookie exchange. Without it, the browser discards the `Set-Cookie` response header.

### Anti-Patterns to Avoid

- **`@Res()` without `passthrough: true`:** Using `@Res()` alone takes full control of the response lifecycle, breaking NestJS interceptors and serialization. Always use `@Res({ passthrough: true })` when setting cookies while returning values normally.
- **`cookie-parser` imported without `app.use(cookieParser())`:** Installing the package does nothing unless it's registered as middleware in `main.ts`. Without it, `req.cookies` is undefined.
- **`JwtModule` not global:** If `JwtModule` is only in `AuthModule` and not exported/global, `CaslAuthGuard` (an `APP_GUARD` at AppModule level) cannot inject `JwtService`. Use `global: true` option in `JwtModule.registerAsync`.
- **Same cookie name as TeamFlow:** TeamFlow uses Authorization headers, not cookies, so name collision isn't an issue. But use a distinct cookie name like `devcollab_token` for clarity.
- **`credentials: true` missing from CORS enableCors:** Without this, browsers block `Set-Cookie` on the `/auth/login` response even if `httpOnly: true` is set. Required when the web app is on port 3002 and the API is on port 3003.
- **`credentials: 'include'` missing from fetch:** The browser will not send or accept cookies without this flag.
- **Not declaring dependencies in devcollab-api/package.json:** Even if `bcrypt`, `passport-jwt`, etc. are installed at root node_modules, they must be in `devcollab-api/package.json` dependencies for `turbo prune devcollab-api --docker` to include them in the Docker build context.
- **TeamFlow's RbacGuard behavior (allow-by-default without CheckAbility):** The DevCollab guard must be the OPPOSITE — deny without `@CheckAbility`. Do not copy TeamFlow's RbacGuard logic which returns `true` when no requirement is set.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom SHA/MD5 hashing | `bcrypt` (already installed) | bcrypt provides built-in salting, work factor, and constant-time comparison; raw crypto is insecure |
| Cookie parsing | Manual `req.headers.cookie` split | `cookie-parser` middleware | Handles escaping, encoding, signed cookies; one `app.use()` call |
| JWT signing/verification | `jsonwebtoken` directly | `@nestjs/jwt` + `JwtService` | NestJS DI-aware wrapper; handles config injection cleanly |
| Cross-origin cookie setup | Manual CORS headers | `app.enableCors({ credentials: true })` | NestJS built-in; handles preflight OPTIONS correctly |
| Metadata inspection in tests | HTTP integration tests | `Reflect.getMetadata` structural tests | Orders of magnitude faster; no DB or HTTP needed; tests the decorator invariant directly |

**Key insight:** The existing TeamFlow auth module is the direct template. Adapt, don't rebuild.

---

## Common Pitfalls

### Pitfall 1: `@Res()` Without `passthrough: true` Breaks Response Lifecycle

**What goes wrong:** Controller method returns a value and sets cookies, but the response is empty or interceptors don't run.
**Why it happens:** `@Res()` without `passthrough: true` switches NestJS to library mode — NestJS stops managing the response, so the return value is ignored.
**How to avoid:** Always use `@Res({ passthrough: true })` when you need access to the Response object for cookie setting but still want NestJS to serialize the return value.
**Warning signs:** `login()` returns undefined/null to the client even though the function returns `{ user }`.

### Pitfall 2: cookies Not Sent Cross-Origin — Missing `credentials` Configuration

**What goes wrong:** Login sets cookie on API, but browser refresh shows no session; cookie is missing from subsequent requests.
**Why it happens:** Two separate requirements must BOTH be satisfied: (1) `credentials: true` in `app.enableCors()` on the API; (2) `credentials: 'include'` in every `fetch()` call from the web app.
**How to avoid:** Set both. Even one missing breaks the cookie flow.
**Warning signs:** DevTools Network tab shows `Set-Cookie` header in login response but no `Cookie` header on subsequent requests.

### Pitfall 3: `JwtService` Not Injectable in `CaslAuthGuard`

**What goes wrong:** `Nest can't resolve dependencies of the CaslAuthGuard (?, Reflector). Please make sure that the "JwtService" argument is available in the context of the "AppModule".`
**Why it happens:** `JwtModule` is declared in `AuthModule` but `AuthModule` is a child module. `CaslAuthGuard` is an `APP_GUARD` at `AppModule` level and needs `JwtService` from `AppModule`'s DI context.
**How to avoid:** Register `JwtModule.registerAsync({ global: true, ... })` in `AppModule` directly (not in `AuthModule` only). This makes `JwtService` globally available.
**Warning signs:** NestJS dependency injection error on startup mentioning `CaslAuthGuard` and `JwtService`.

### Pitfall 4: `DEVCOLLAB_JWT_SECRET` Missing at Runtime

**What goes wrong:** `JwtService.sign()` throws or produces unverifiable tokens; or `configService.getOrThrow('DEVCOLLAB_JWT_SECRET')` throws on startup.
**Why it happens:** The env var is in `docker-compose.yml` referencing `${DEVCOLLAB_JWT_SECRET}` but not in the `.env` file at the monorepo root.
**How to avoid:** Add `DEVCOLLAB_JWT_SECRET=<value>` to `.env` (and `.env.example`). Add it to docker-compose.yml under `devcollab-api` environment. Confirm it is a DIFFERENT value from `JWT_SECRET` (TeamFlow).
**Warning signs:** "Invalid token" errors even immediately after login; or startup failure with env validation error.

### Pitfall 5: Prisma Migration Not Run After Adding `password` Field

**What goes wrong:** `devcollab-api` starts but `auth.service.ts` throws `PrismaClientKnownRequestError` about unknown field `password`.
**Why it happens:** The schema file was updated but `prisma migrate dev` was not run, so the database column doesn't exist.
**How to avoid:** Run `npx prisma migrate dev --schema=packages/devcollab-database/prisma/schema.prisma --name add_password_to_user` and commit the generated migration file.
**Warning signs:** Prisma error referencing unknown field or column "password" not found.

### Pitfall 6: `cookie-parser` Not Declared in `devcollab-api/package.json`

**What goes wrong:** Docker build for devcollab-api fails with `Cannot find module 'cookie-parser'` because `turbo prune` excluded it.
**Why it happens:** `turbo prune` traces the dependency graph from `devcollab-api/package.json`. Packages only in root `node_modules` but not declared in the app's `package.json` are not included in the pruned output.
**How to avoid:** Add `"cookie-parser": "^1.4.7"` to `apps/devcollab-api/package.json` dependencies.
**Warning signs:** Build succeeds locally but fails in Docker.

### Pitfall 7: `reflect-metadata` Not Imported in Test Files

**What goes wrong:** `Reflect.getMetadata` returns `undefined` for everything in the meta coverage test.
**Why it happens:** `reflect-metadata` must be imported before any decorator metadata is accessed. NestJS does this in main.ts via `import 'reflect-metadata'`. In tests, there's no main.ts bootstrapping.
**How to avoid:** Add `import 'reflect-metadata';` as the FIRST import in the controller coverage spec file.
**Warning signs:** All `Reflect.getMetadata` calls return `undefined`; all tests pass vacuously or fail unexpectedly.

### Pitfall 8: Deny-by-Default Logic Prevents Auth Endpoints

**What goes wrong:** POST /auth/login returns 403 from `CaslAuthGuard` because the guard checks for `@CheckAbility` even on auth routes.
**Why it happens:** Auth routes need `@Public()` — they're the one exception to "must have @CheckAbility". The guard checks `@Public()` first and returns `true` before checking `@CheckAbility`.
**How to avoid:** Decorate all auth controller methods (signup, login, logout) with `@Public()`. Auth routes are public by definition — they're how users get their JWT in the first place.
**Warning signs:** POST /auth/login → 403 Forbidden immediately (not 401).

---

## Code Examples

### Vitest Config for devcollab-api

```typescript
// apps/devcollab-api/vitest.config.ts
// Source: TeamFlow API vitest.config.ts (identical pattern)
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
  },
});
```

```json
// Add to apps/devcollab-api/package.json scripts:
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

### PrismaService for DevCollab

```typescript
// apps/devcollab-api/src/core/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prisma } from '@devcollab/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client = prisma;

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  get user() {
    return this.client.user;
  }
}
```

### Auth Module

```typescript
// apps/devcollab-api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseModule } from '../core/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Bearer token auth (TeamFlow) | httpOnly cookie auth (DevCollab) | Phase 15 design decision | Requires `cookie-parser` middleware; `credentials: true` CORS; `credentials: 'include'` in fetch |
| RbacGuard allows routes without `@CheckAbility` (TeamFlow) | CaslAuthGuard denies routes without `@CheckAbility` (DevCollab) | Phase 14/15 design decision | Every new controller method MUST have `@CheckAbility` or `@Public()` — enforced by unit test |
| `JwtModule` in feature module only | `JwtModule` global in `AppModule` | Required by APP_GUARD pattern | `JwtService` must be available in the root DI context for the global guard |
| `@nestjs/jwt` 10.x | `@nestjs/jwt` 11.0.2 (installed) | NestJS 11 release | `global: true` in `registerAsync` is the current idiom |

**Deprecated/outdated:**
- `ExtractJwt.fromAuthHeaderAsBearerToken()` for DevCollab: Use `fromExtractors` with cookie extractor instead.
- `cookieParser()` import style: In ESM, `import cookieParser from 'cookie-parser'` may work; in CommonJS NestJS, `import * as cookieParser from 'cookie-parser'` is correct.

---

## Open Questions

1. **Should `devcollab-api` use a full DatabaseModule + PrismaService pattern, or use `@devcollab/database` prisma singleton directly?**
   - What we know: TeamFlow wraps the Prisma singleton in a `PrismaService` class for DI testability. The singleton in `@devcollab/database` is `export const prisma`.
   - What's unclear: Whether Phase 15 is the right time to add the full DI wrapper, or whether direct import is simpler for bootstrap.
   - Recommendation: Add `PrismaService` as a proper NestJS service in `core/database/` — the DI wrapper makes unit testing `AuthService` cleaner (mock the service, not the module).

2. **Should `@CheckAbility` be enforced in the guard or only via the meta-test?**
   - What we know: The success criterion says the invariant is "verified by unit test enumeration of all controller methods." The guard in Pattern 1 also enforces it at runtime.
   - What's unclear: Whether both guard enforcement AND the structural test are needed, or just the test.
   - Recommendation: Both. The guard provides runtime protection; the test provides CI-time verification. They serve different purposes.

3. **What is the cookie name — `token` vs `devcollab_token`?**
   - What we know: The prior decisions doc doesn't specify a cookie name.
   - What's unclear: Nothing — this is a discretion choice.
   - Recommendation: Use `devcollab_token` to prevent any accidental conflict with other cookies (TeamFlow may also use a `token` cookie name).

4. **Does Phase 15 need a `/auth/me` endpoint?**
   - What we know: The success criteria mention signup, login, logout, and session persistence — no explicit "me" endpoint.
   - What's unclear: Whether the Next.js app needs to verify the session on load without a full page's data.
   - Recommendation: Add `/auth/me` as a convenience — it requires `@CheckAbility('read', 'User')` and returns the current user from `req.user`. This also validates the full auth flow end-to-end and serves as the first `@CheckAbility`-decorated endpoint.

---

## Sources

### Primary (HIGH confidence)

- Existing codebase `/home/doctor/fernandomillan` — read directly
  - `apps/devcollab-api/src/` — current Phase 14 state (CaslAuthGuard, public decorator, health controller)
  - `apps/api/src/modules/auth/` — TeamFlow auth controller, service, JWT strategy, auth module (direct template)
  - `apps/api/src/core/rbac/` — TeamFlow RBAC guard, ability factory, check-ability decorator (template)
  - `apps/api/test/unit/rbac/guards.spec.ts` — existing vitest guard test pattern (template)
  - `packages/devcollab-database/prisma/schema.prisma` — current User model (needs `password` added)
  - `packages/devcollab-database/src/client.ts` — PrismaClient singleton pattern
  - `apps/devcollab-api/package.json` — confirms auth packages NOT yet in devcollab-api deps
- Installed packages confirmed at `/home/doctor/fernandomillan/node_modules/`:
  - `@nestjs/jwt@11.0.2` — installed
  - `@nestjs/passport@11.0.5` — installed
  - `passport-jwt@4.0.1` — installed
  - `bcrypt@6.0.0` — installed
  - `@casl/ability@6.8.0` — installed
  - `cookie-parser` — NOT installed at root

### Secondary (MEDIUM confidence)

- https://tigran.tech/nestjs-cookie-based-jwt-authentication/ — complete cookie-based JWT strategy pattern; verified against NestJS passport docs
- NestJS docs (docs.nestjs.com/techniques/cookies) — cookie-parser middleware pattern; `credentials: true` CORS requirement
- https://www.passportjs.org/packages/passport-jwt/ — `ExtractJwt.fromExtractors` API

### Tertiary (LOW confidence)

- `Reflect.getMetadata` for structural controller tests — pattern described in multiple NestJS community sources; not directly verified against a running test but based on how SetMetadata/reflect-metadata work (which IS verified from NestJS source)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed from installed node_modules; versions exact
- Architecture: HIGH — patterns directly adapted from TeamFlow codebase which is production-ready in this repo
- Pitfalls: HIGH — derived from actual code inspection (e.g., missing `@Res passthrough`, missing credentials CORS), not speculation
- Unit test meta-pattern: MEDIUM — reflect-metadata API is well documented, but specific vitest execution not verified against a running test

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (30 days — NestJS 11, passport-jwt, CASL are stable)
