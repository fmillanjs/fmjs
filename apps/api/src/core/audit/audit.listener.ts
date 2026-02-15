import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from './audit.service';
import { AuthEvent, RbacEvent, AuthorizationDeniedEvent } from '@repo/shared';

@Injectable()
export class AuditListener {
  constructor(private auditService: AuditService) {}

  @OnEvent('auth.login', { async: true })
  async handleLoginSuccess(event: AuthEvent) {
    await this.auditService.log(event);
  }

  @OnEvent('auth.login.failed', { async: true })
  async handleLoginFailed(event: AuthEvent) {
    await this.auditService.log(event);
  }

  @OnEvent('auth.signup', { async: true })
  async handleSignup(event: AuthEvent) {
    await this.auditService.log(event);
  }

  @OnEvent('auth.logout', { async: true })
  async handleLogout(event: AuthEvent) {
    await this.auditService.log(event);
  }

  @OnEvent('auth.password.reset.request', { async: true })
  async handlePasswordResetRequest(event: AuthEvent) {
    await this.auditService.log(event);
  }

  @OnEvent('auth.password.reset.complete', { async: true })
  async handlePasswordResetComplete(event: AuthEvent) {
    await this.auditService.log(event);
  }

  @OnEvent('auth.password.changed', { async: true })
  async handlePasswordChanged(event: AuthEvent) {
    await this.auditService.log(event);
  }

  @OnEvent('rbac.role.changed', { async: true })
  async handleRoleChanged(event: RbacEvent) {
    await this.auditService.log(event);
  }

  @OnEvent('authorization.denied', { async: true })
  async handleAuthorizationDenied(event: AuthorizationDeniedEvent) {
    await this.auditService.log(event);
  }
}
