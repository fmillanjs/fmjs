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

    // Not public: require valid JWT in devcollab_token cookie
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

    // Set req.user so @CurrentUser() works in controllers
    request.user = payload;

    // Deny-by-default: every non-public endpoint must declare @CheckAbility
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
