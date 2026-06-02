import type { Permission } from './permissions';

/** Wildcard grants used in role definitions (not in the permission registry). */
export type WildcardGrant = '*' | `${string}:*`;

export type RolePermissionGrant = Permission | WildcardGrant;

export const roleDefinitions = [
  {
    role: 'user',
    permissions: ['attendance:read', 'presentation:read'] as const satisfies readonly Permission[],
  },
  {
    role: 'manager',
    permissions: [
      'users:list',
      'users:read',
      'attendance:manage',
    ] as const satisfies readonly Permission[],
  },
  {
    role: 'system_admin',
    permissions: ['*'] as const satisfies readonly WildcardGrant[],
  },
] as const;

export type AppRole = (typeof roleDefinitions)[number]['role'];

const roleMap = new Map<AppRole, readonly RolePermissionGrant[]>(
  roleDefinitions.map((definition) => [definition.role, definition.permissions])
);

export function getPermissionsForRole(role: AppRole): readonly RolePermissionGrant[] {
  const grants = roleMap.get(role);
  if (!grants) {
    throw new Error(`Unknown role: ${role}`);
  }
  return grants;
}
