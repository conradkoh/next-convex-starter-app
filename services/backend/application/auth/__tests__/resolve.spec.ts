import { describe, expect, it } from 'vitest';

import type { Permission } from '../permissions';
import {
  getPermissionsForUser,
  getRolesForUser,
  hasPermission,
  permissionGrantMatches,
  unionPermissionsForRoles,
} from '../resolve';

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
  });

  it('grants all permissions to system_admin via wildcard', () => {
    const user = { accessLevel: 'system_admin' as const };
    expect(hasPermission(user, 'users:list')).toBe(true);
    expect(hasPermission(user, 'auth:provider:manage')).toBe(true);
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
  it('returns a stable grant set for system admin', () => {
    const grants = getPermissionsForUser({ accessLevel: 'system_admin' });
    expect(grants.has('*')).toBe(true);
    expect(hasPermission({ accessLevel: 'system_admin' }, 'settings:write' as Permission)).toBe(
      true
    );
  });
});
