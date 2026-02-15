import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Extract IP address (prefer x-forwarded-for for proxied requests)
    const ipAddress =
      request.headers['x-forwarded-for']?.split(',')[0].trim() ||
      request.ip ||
      request.connection.remoteAddress ||
      'unknown';

    // Extract user agent
    const userAgent = request.headers['user-agent'] || 'unknown';

    // Attach to request for use by event emitters
    request.auditMetadata = {
      ipAddress,
      userAgent,
    };

    return next.handle();
  }
}
