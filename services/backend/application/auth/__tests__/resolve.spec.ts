import { describe, expect, it } from 'vitest';

import { allPermissions, type Permission } from '../permissions';
import {
  getPermissionsForUser,
  getRolesForUser,
  hasPermission,
  permissionGrantMatches,
  unionPermissionsForRoles,
} from '../resolve';
import { systemAdminPermissions } from '../roles';

describe('permissionGrantMatches', () => {
  it('matches exact permissions', () => {
    expect(permissionGrantMatches('users:list', 'users:list')).toBe(true);
    expect(permissionGrantMatches('users:list', 'users:read')).toBe(false);
  });

  it('matches global wildcard', () => {
    expect(permissionGrantMatches('*', 'users:list')).toBe(true);
  });

  it('matches resource wildcards', () => {
    expect(permissionGrantMatches('users:*', 'users:list')).toBe(true);
    expect(permissionGrantMatches('users:*', 'users:write')).toBe(true);
    expect(permissionGrantMatches('users:*', 'settings:read')).toBe(false);
  });
});

describe('getRolesForUser', () => {
  it('maps accessLevel to roles', () => {
    expect(getRolesForUser({ accessLevel: undefined })).toEqual(['user']);
    expect(getRolesForUser({ accessLevel: 'user' })).toEqual(['user']);
    expect(getRolesForUser({ accessLevel: 'system_admin' })).toEqual(['system_admin']);
  });
});

describe('hasPermission', () => {
  it('grants default user permissions', () => {
    const user = { accessLevel: 'user' as const };
    expect(hasPermission(user, 'attendance:read')).toBe(true);
    expect(hasPermission(user, 'users:list')).toBe(false);
    expect(hasPermission(user, 'admin:access')).toBe(false);
  });

  it('grants explicit system_admin permissions', () => {
    const user = { accessLevel: 'system_admin' as const };
    for (const permission of systemAdminPermissions) {
      expect(hasPermission(user, permission)).toBe(true);
    }
    expect(hasPermission(user, 'auth:provider:manage')).toBe(true);
    expect(hasPermission(user, 'admin:access')).toBe(true);
  });
});

describe('systemAdminPermissions', () => {
  it('includes every registered permission', () => {
    expect(new Set(systemAdminPermissions)).toEqual(new Set(allPermissions));
  });
});

describe('unionPermissionsForRoles', () => {
  it('merges grants from multiple roles without duplicates', () => {
    const grants = unionPermissionsForRoles(['user', 'manager']);
    expect(grants.has('attendance:read')).toBe(true);
    expect(grants.has('users:list')).toBe(true);
  });
});

describe('getPermissionsForUser', () => {
  it('returns explicit grants for system admin (no wildcard)', () => {
    const grants = getPermissionsForUser({ accessLevel: 'system_admin' });
    expect(grants.has('*')).toBe(false);
    expect(hasPermission({ accessLevel: 'system_admin' }, 'settings:write' as Permission)).toBe(
      true
    );
  });
});
