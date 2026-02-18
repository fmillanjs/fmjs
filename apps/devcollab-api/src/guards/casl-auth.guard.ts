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
import { WorkspaceAbilityFactory, Action, Subject } from '../workspaces/workspace-ability.factory';

@Injectable()
export class CaslAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private workspaceAbilityFactory: WorkspaceAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.['devcollab_token'];

    if (!token) {
      throw new UnauthorizedException('No authentication token');
    }

    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = payload;

    // Deny-by-default: every non-public endpoint must declare @CheckAbility
    const abilityReq = this.reflector.getAllAndOverride<{ action: string; subject: string }>(
      CHECK_ABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!abilityReq) {
      throw new ForbiddenException(
        'Endpoint must declare @CheckAbility — deny-by-default security invariant',
      );
    }

    // Workspace-agnostic routes (no :slug param): authenticated + @CheckAbility is sufficient.
    // The service layer handles further workspace-scoped authorization.
    const workspaceSlug: string | undefined = request.params?.slug;
    if (!workspaceSlug) return true;

    // Workspace-scoped route: build ability from user's membership role and evaluate
    const ability = await this.workspaceAbilityFactory.createForUserInWorkspace(
      payload.sub,
      workspaceSlug,
    );

    if (!ability) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    const allowed = ability.can(abilityReq.action as Action, abilityReq.subject as Subject);
    if (!allowed) {
      throw new ForbiddenException(
        `Forbidden: cannot ${abilityReq.action} ${abilityReq.subject} in this workspace`,
      );
    }

    return true;
  }
}
