import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RbacGuard } from '../../../src/core/rbac/rbac.guard';
import { AbilityFactory } from '../../../src/core/rbac/ability.factory';

describe('RBAC Guard', () => {
  let rbacGuard: RbacGuard;
  let reflector: Reflector;
  let abilityFactory: AbilityFactory;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    reflector = new Reflector();
    abilityFactory = new AbilityFactory();
    eventEmitter = {
      emit: vi.fn(),
    } as any;

    rbacGuard = new RbacGuard(reflector, abilityFactory, eventEmitter);
  });

  describe('Public Routes (No CheckAbility Decorator)', () => {
    it('should allow access when no ability requirement is set', () => {
      const mockContext = createMockExecutionContext({});
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = rbacGuard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe('Protected Routes', () => {
    it('should throw ForbiddenException when user is missing', () => {
      const mockContext = createMockExecutionContext({});
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        action: 'read',
        subject: 'Project',
      });

      expect(() => rbacGuard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => rbacGuard.canActivate(mockContext)).toThrow('Forbidden: User not authenticated');
    });

    it('should throw ForbiddenException when user lacks required ability', () => {
      const mockContext = createMockExecutionContext({
        user: { id: 'member-1', role: 'MEMBER', organizationId: 'org-1' },
      });

      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        action: 'delete',
        subject: 'Project',
      });

      expect(() => rbacGuard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => rbacGuard.canActivate(mockContext)).toThrow(/do not have permission/);
    });

    it('should emit authorization.denied event when permission is denied', () => {
      const mockContext = createMockExecutionContext({
        user: { id: 'member-1', role: 'MEMBER', organizationId: 'org-1' },
      });

      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        action: 'delete',
        subject: 'Project',
      });

      try {
        rbacGuard.canActivate(mockContext);
      } catch (e) {
        // Expected to throw
      }

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'authorization.denied',
        expect.objectContaining({
          entityType: 'Project',
          action: 'AUTHORIZATION_DENIED',
          actorId: 'member-1',
          outcome: 'DENIED',
        })
      );
    });

    it('should allow access when user has required ability', () => {
      const mockContext = createMockExecutionContext({
        user: { id: 'admin-1', role: 'ADMIN', organizationId: 'org-1' },
      });

      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        action: 'delete',
        subject: 'Project',
      });

      const result = rbacGuard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should allow MANAGER to create projects', () => {
      const mockContext = createMockExecutionContext({
        user: { id: 'manager-1', role: 'MANAGER', organizationId: 'org-1' },
      });

      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        action: 'create',
        subject: 'Project',
      });

      const result = rbacGuard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should deny MEMBER from creating projects', () => {
      const mockContext = createMockExecutionContext({
        user: { id: 'member-1', role: 'MEMBER', organizationId: 'org-1' },
      });

      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        action: 'create',
        subject: 'Project',
      });

      expect(() => rbacGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
  });
});

// Helper function to create mock execution context
function createMockExecutionContext(requestData: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: requestData.user,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}
