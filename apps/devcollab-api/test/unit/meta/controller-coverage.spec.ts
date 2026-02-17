// CRITICAL: reflect-metadata MUST be the FIRST import.
// Without it, Reflect.getMetadata returns undefined for all decorator metadata.
import 'reflect-metadata';
import { describe, it, expect } from 'vitest';

import { IS_PUBLIC_KEY } from '../../../src/common/decorators/public.decorator';
import { CHECK_ABILITY_KEY } from '../../../src/common/decorators/check-ability.decorator';
import { HealthController } from '../../../src/health/health.controller';
import { AuthController } from '../../../src/auth/auth.controller';

// MAINTAINABILITY NOTE: When a new controller is added to devcollab-api, add its class here.
// The test will then automatically enforce the deny-by-default invariant on all its methods.
const ALL_CONTROLLERS = [HealthController, AuthController] as const;

describe('DevCollab deny-by-default invariant', () => {
  for (const Controller of ALL_CONTROLLERS) {
    const proto = Controller.prototype;
    // Only test methods that are NestJS route handlers (have HTTP method path metadata)
    const methods = Object.getOwnPropertyNames(proto).filter((name) => {
      if (name === 'constructor' || typeof proto[name] !== 'function') return false;
      // Check if this method has a route path metadata (i.e., is decorated with @Get/@Post/etc.)
      const hasRoutePath = Reflect.getMetadata('path', proto[name] as object) !== undefined;
      return hasRoutePath;
    });

    describe(`${Controller.name}`, () => {
      for (const methodName of methods) {
        it(`"${methodName}" must have @Public() or @CheckAbility()`, () => {
          const handler = proto[methodName] as unknown;

          // Check @Public() at method level
          const isPublicOnMethod = Reflect.getMetadata(IS_PUBLIC_KEY, handler as object);
          // Check @Public() at class level (applies to all methods)
          const isPublicOnClass = Reflect.getMetadata(IS_PUBLIC_KEY, Controller);
          // Check @CheckAbility() at method level
          const hasCheckAbility = Reflect.getMetadata(CHECK_ABILITY_KEY, handler as object);

          expect(
            isPublicOnMethod || isPublicOnClass || hasCheckAbility,
            `\n\nVIOLATION: ${Controller.name}.${methodName}() has neither @Public() nor @CheckAbility().\n` +
              `This violates the deny-by-default security invariant.\n` +
              `Fix: Add @Public() if this is a public endpoint, or @CheckAbility(action, subject) if it requires authentication.\n`,
          ).toBeTruthy();
        });
      }
    });
  }
});
