import type { Doc } from '../../convex/_generated/dataModel';

/**
 * Access level utility functions for user authorization.
 * Provides type-safe access level checking for the application.
 *
 * MIGRATION NOTE: This module provides backward compatibility with the legacy
 * accessLevel field. For new code, prefer using the RBAC module:
 *
 * ```typescript
 * import { hasPermission, requirePermission } from '../rbac';
 * ```
 *
 * The RBAC system provides granular permissions while this module
 * only supports binary admin/non-admin checks.
 */

export type AccessLevel = 'user' | 'system_admin';

/**
 * Gets a user's access level with fallback to 'user' if undefined.
 * This centralizes the logic for handling optional accessLevel fields during migration.
 *
 * NOTE: This uses the legacy accessLevel field. For RBAC-based checks,
 * use getUserRoles() from the RBAC module instead.
 *
 * @param user - The user document to check
 * @returns The user's access level, defaulting to 'user' if undefined
 */
export function getAccessLevel(user: Doc<'users'>): AccessLevel {
  return user.accessLevel ?? 'user';
}

/**
 * Checks if a user has system administrator access level.
 *
 * NOTE: This uses the legacy accessLevel field for synchronous checks.
 * For RBAC-aware async checks, use isSystemAdminRbac() from the RBAC module:
 *
 * ```typescript
 * import { isSystemAdminRbac } from '../rbac';
 * const isAdmin = await isSystemAdminRbac(ctx, user);
 * ```
 *
 * @param user - The user document to check
 * @returns true if the user is a system administrator, false otherwise
 */
export function isSystemAdmin(user: Doc<'users'>): boolean {
  return getAccessLevel(user) === 'system_admin';
}

/**
 * Checks if a user has at least the specified access level.
 *
 * NOTE: For granular permission checks, use the RBAC module:
 *
 * ```typescript
 * import { hasPermission } from '../rbac';
 * const canEdit = await hasPermission(ctx, user._id, 'users.write');
 * ```
 *
 * @param user - The user document to check
 * @param requiredLevel - The minimum required access level
 * @returns true if the user meets the access level requirement, false otherwise
 */
export function hasAccessLevel(user: Doc<'users'>, requiredLevel: AccessLevel): boolean {
  if (requiredLevel === 'user') {
    return true; // All users have 'user' level access
  }

  if (requiredLevel === 'system_admin') {
    return isSystemAdmin(user);
  }

  return false;
}

/**
 * Gets a user's access level as a string.
 * @param user - The user document
 * @returns The user's access level
 * @deprecated Use getAccessLevel instead for consistency
 */
export function getUserAccessLevel(user: Doc<'users'>): AccessLevel {
  return getAccessLevel(user);
}
