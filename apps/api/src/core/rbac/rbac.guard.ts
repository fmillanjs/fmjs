import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AbilityFactory } from './ability.factory';
import { CHECK_ABILITY_KEY, AbilityRequirement } from './decorators/check-ability.decorator';
import { AuthorizationDeniedEvent } from '@repo/shared';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilityFactory: AbilityFactory,
    private eventEmitter: EventEmitter2,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Get ability requirement from decorator metadata
    const requirement = this.reflector.getAllAndOverride<AbilityRequirement>(CHECK_ABILITY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no @CheckAbility decorator, allow access (no RBAC restriction)
    if (!requirement) {
      return true;
    }

    // Get user from request (set by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Forbidden: User not authenticated');
    }

    // Build ability for user
    const ability = this.abilityFactory.createForUser(user);

    // Check if user has required permission
    const can = ability.can(requirement.action as any, requirement.subject as any);

    if (!can) {
      // Emit authorization denied event
      const metadata = (request as any).auditMetadata || {
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
      };

      const deniedEvent: AuthorizationDeniedEvent = {
        entityType: requirement.subject,
        action: 'AUTHORIZATION_DENIED',
        actorId: user.id,
        outcome: 'DENIED',
        metadata,
        changes: {
          attemptedAction: requirement.action,
          requiredPermission: `${requirement.action} ${requirement.subject}`,
        },
      };
      this.eventEmitter.emit('authorization.denied', deniedEvent);

      // IMPORTANT: Throw explicit exception with message (not just return false)
      throw new ForbiddenException(
        `Forbidden: You do not have permission to perform this action (${requirement.action} ${requirement.subject})`,
      );
    }

    return true;
  }
}
