import { describe, it, expect, beforeEach } from 'vitest';
import { AbilityFactory, UserContext } from '../../../src/core/rbac/ability.factory';

describe('RBAC Ability Factory', () => {
  let abilityFactory: AbilityFactory;

  beforeEach(() => {
    abilityFactory = new AbilityFactory();
  });

  describe('ADMIN Role', () => {
    it('should allow ADMIN to manage all resources', () => {
      const adminUser: UserContext = {
        id: 'admin-1',
        role: 'ADMIN',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(adminUser);

      expect(ability.can('manage', 'all')).toBe(true);
    });

    it('should allow ADMIN to create organizations', () => {
      const adminUser: UserContext = {
        id: 'admin-1',
        role: 'ADMIN',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(adminUser);

      expect(ability.can('create', 'Organization')).toBe(true);
    });

    it('should allow ADMIN to delete projects', () => {
      const adminUser: UserContext = {
        id: 'admin-1',
        role: 'ADMIN',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(adminUser);

      expect(ability.can('delete', 'Project')).toBe(true);
    });

    it('should allow ADMIN to manage audit logs', () => {
      const adminUser: UserContext = {
        id: 'admin-1',
        role: 'ADMIN',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(adminUser);

      expect(ability.can('manage', 'AuditLog')).toBe(true);
      expect(ability.can('read', 'AuditLog')).toBe(true);
    });

    it('should allow ADMIN to remove members', () => {
      const adminUser: UserContext = {
        id: 'admin-1',
        role: 'ADMIN',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(adminUser);

      expect(ability.can('delete', 'Membership')).toBe(true);
    });
  });

  describe('MANAGER Role', () => {
    it('should allow MANAGER to create projects', () => {
      const managerUser: UserContext = {
        id: 'manager-1',
        role: 'MANAGER',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(managerUser);

      expect(ability.can('create', 'Project')).toBe(true);
    });

    it('should allow MANAGER to manage tasks', () => {
      const managerUser: UserContext = {
        id: 'manager-1',
        role: 'MANAGER',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(managerUser);

      expect(ability.can('create', 'Task')).toBe(true);
      expect(ability.can('update', 'Task')).toBe(true);
      expect(ability.can('read', 'Task')).toBe(true);
    });

    it('should allow MANAGER to invite members', () => {
      const managerUser: UserContext = {
        id: 'manager-1',
        role: 'MANAGER',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(managerUser);

      expect(ability.can('create', 'Membership')).toBe(true);
    });

    it('should NOT allow MANAGER to delete projects', () => {
      const managerUser: UserContext = {
        id: 'manager-1',
        role: 'MANAGER',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(managerUser);

      expect(ability.can('delete', 'Project')).toBe(false);
    });

    it('should NOT allow MANAGER to view organization-wide audit logs', () => {
      const managerUser: UserContext = {
        id: 'manager-1',
        role: 'MANAGER',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(managerUser);

      expect(ability.can('manage', 'AuditLog')).toBe(false);
      expect(ability.can('read', 'AuditLog')).toBe(false);
    });

    it('should NOT allow MANAGER to remove members', () => {
      const managerUser: UserContext = {
        id: 'manager-1',
        role: 'MANAGER',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(managerUser);

      expect(ability.can('delete', 'Membership')).toBe(false);
    });

    it('should NOT allow MANAGER to delete tasks', () => {
      const managerUser: UserContext = {
        id: 'manager-1',
        role: 'MANAGER',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(managerUser);

      expect(ability.can('delete', 'Task')).toBe(false);
    });
  });

  describe('MEMBER Role', () => {
    it('should allow MEMBER to read projects', () => {
      const memberUser: UserContext = {
        id: 'member-1',
        role: 'MEMBER',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(memberUser);

      expect(ability.can('read', 'Project')).toBe(true);
    });

    it('should allow MEMBER to update own tasks', () => {
      const memberUser: UserContext = {
        id: 'member-1',
        role: 'MEMBER',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(memberUser);

      expect(ability.can('update', 'Task')).toBe(true);
    });

    it('should allow MEMBER to read tasks', () => {
      const memberUser: UserContext = {
        id: 'member-1',
        role: 'MEMBER',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(memberUser);

      expect(ability.can('read', 'Task')).toBe(true);
    });

    it('should NOT allow MEMBER to create projects', () => {
      const memberUser: UserContext = {
        id: 'member-1',
        role: 'MEMBER',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(memberUser);

      expect(ability.can('create', 'Project')).toBe(false);
    });

    it('should NOT allow MEMBER to invite members', () => {
      const memberUser: UserContext = {
        id: 'member-1',
        role: 'MEMBER',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(memberUser);

      expect(ability.can('create', 'Membership')).toBe(false);
    });

    it('should NOT allow MEMBER to delete other users tasks', () => {
      const memberUser: UserContext = {
        id: 'member-1',
        role: 'MEMBER',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(memberUser);

      expect(ability.can('delete', 'Task')).toBe(false);
    });

    it('should NOT allow MEMBER to create tasks', () => {
      const memberUser: UserContext = {
        id: 'member-1',
        role: 'MEMBER',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(memberUser);

      expect(ability.can('create', 'Task')).toBe(false);
    });
  });

  describe('Unknown Role', () => {
    it('should deny all permissions for unknown role', () => {
      const unknownUser: UserContext = {
        id: 'unknown-1',
        role: 'UNKNOWN_ROLE',
        organizationId: 'org-1',
      };

      const ability = abilityFactory.createForUser(unknownUser);

      expect(ability.can('manage', 'all')).toBe(false);
      expect(ability.can('read', 'Project')).toBe(false);
      expect(ability.can('create', 'Task')).toBe(false);
    });
  });
});
