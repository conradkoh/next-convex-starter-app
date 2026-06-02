/**
 * Application permission registry.
 * Add new permissions here before referencing them in roles.
 */
export const permissions = {
  'users:list': { description: 'List users' },
  'users:read': { description: 'View user details' },
  'users:write': { description: 'Create or update users' },
  'settings:read': { description: 'View application settings' },
  'settings:write': { description: 'Update application settings' },
  'auth:provider:manage': { description: 'Configure authentication providers' },
  'attendance:read': { description: 'View attendance records' },
  'attendance:manage': { description: 'Manage attendance records' },
  'presentation:read': { description: 'View presentations' },
} as const;

export type Permission = keyof typeof permissions;

export const allPermissions = Object.keys(permissions) as Permission[];
