/**
 * RBAC (Role-Based Access Control) Module
 *
 * This module provides a flexible permission system based on roles.
 * Key concepts:
 * - Permissions: Individual actions (e.g., 'users.read', 'settings.write')
 * - Roles: Named groups of permissions (e.g., 'admin', 'moderator')
 * - User-Role assignments: Users are assigned roles to gain permissions
 *
 * Usage:
 * ```typescript
 * import { hasPermission, requirePermission, hasRole } from '../modules/rbac';
 *
 * // In a query/mutation handler:
 * if (await hasPermission(ctx, user._id, 'users.read')) {
 *   // User can read users
 * }
 *
 * // Or throw if missing:
 * await requirePermission(ctx, user._id, 'settings.write');
 * ```
 */

// Types
export * from './types';

// Permission checking
export {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  requirePermission,
  requireAllPermissions,
  getUserPermissions,
  getUserPermissionList,
  isSystemAdminRbac,
} from './permissions';

// Role management
export {
  getRoleByName,
  getRoleById,
  getAllRoles,
  getUserRoles,
  getUserRoleNames,
  hasRole,
  assignRole,
  assignRoleByName,
  removeRole,
  removeRoleByName,
  getRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
} from './roles';
