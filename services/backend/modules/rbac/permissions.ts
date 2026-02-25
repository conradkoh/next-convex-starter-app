import { WILDCARD_PERMISSION, type PermissionName, type UserPermissions } from './types';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import type { QueryCtx, MutationCtx } from '../../convex/_generated/server';

/**
 * RBAC Permission Checking Module
 * Provides utilities for checking user permissions.
 */

type Context = QueryCtx | MutationCtx;

// ============================================================================
// Permission Checking
// ============================================================================

/**
 * Check if a user has a specific permission.
 * Uses the RBAC system to check permissions via roles.
 *
 * @param ctx - Convex context
 * @param userId - The user ID to check
 * @param permission - The permission to check (e.g., 'users.read')
 * @returns true if user has the permission, false otherwise
 */
export async function hasPermission(
  ctx: Context,
  userId: Id<'users'>,
  permission: PermissionName
): Promise<boolean> {
  const userPermissions = await getUserPermissions(ctx, userId);

  // System admins with wildcard have all permissions
  if (userPermissions.hasWildcard) {
    return true;
  }

  // Check exact permission
  if (userPermissions.permissions.has(permission)) {
    return true;
  }

  // Check for resource wildcard (e.g., 'users.*' grants 'users.read')
  const [resource] = permission.split('.');
  if (userPermissions.permissions.has(`${resource}.*`)) {
    return true;
  }

  return false;
}

/**
 * Check if a user has ALL of the specified permissions.
 *
 * @param ctx - Convex context
 * @param userId - The user ID to check
 * @param permissions - Array of permissions to check
 * @returns true if user has all permissions, false otherwise
 */
export async function hasAllPermissions(
  ctx: Context,
  userId: Id<'users'>,
  permissions: PermissionName[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(ctx, userId, permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Check if a user has ANY of the specified permissions.
 *
 * @param ctx - Convex context
 * @param userId - The user ID to check
 * @param permissions - Array of permissions to check
 * @returns true if user has at least one permission, false otherwise
 */
export async function hasAnyPermission(
  ctx: Context,
  userId: Id<'users'>,
  permissions: PermissionName[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(ctx, userId, permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Require a permission, throwing an error if not granted.
 * Use this in mutations/queries to enforce permission checks.
 *
 * @param ctx - Convex context
 * @param userId - The user ID to check
 * @param permission - The required permission
 * @throws Error if user lacks the permission
 */
export async function requirePermission(
  ctx: Context,
  userId: Id<'users'>,
  permission: PermissionName
): Promise<void> {
  if (!(await hasPermission(ctx, userId, permission))) {
    throw new Error(`Permission denied: requires '${permission}'`);
  }
}

/**
 * Require all of the specified permissions.
 *
 * @param ctx - Convex context
 * @param userId - The user ID to check
 * @param permissions - Array of required permissions
 * @throws Error if user lacks any permission
 */
export async function requireAllPermissions(
  ctx: Context,
  userId: Id<'users'>,
  permissions: PermissionName[]
): Promise<void> {
  for (const permission of permissions) {
    await requirePermission(ctx, userId, permission);
  }
}

// ============================================================================
// Permission Resolution
// ============================================================================

/**
 * Get all effective permissions for a user.
 * Resolves permissions through role assignments.
 *
 * @param ctx - Convex context
 * @param userId - The user ID
 * @returns UserPermissions object with roles, permissions set, and wildcard flag
 */
export async function getUserPermissions(
  ctx: Context,
  userId: Id<'users'>
): Promise<UserPermissions> {
  // Get all role assignments for the user
  const userRoles = await ctx.db
    .query('rbac_userRoles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();

  // Fetch the actual role documents
  const roles: Doc<'rbac_roles'>[] = [];
  for (const userRole of userRoles) {
    const role = await ctx.db.get('rbac_roles', userRole.roleId);
    if (role) {
      roles.push(role);
    }
  }

  // Check for system_admin role (has wildcard)
  const hasWildcard = roles.some((role) => role.name === 'system_admin');

  // If system admin, return early with wildcard
  if (hasWildcard) {
    return {
      roles,
      permissions: new Set([WILDCARD_PERMISSION]),
      hasWildcard: true,
    };
  }

  // Collect all permissions from all roles
  const permissions = new Set<PermissionName>();

  for (const role of roles) {
    // Get all permission mappings for this role
    const rolePermissions = await ctx.db
      .query('rbac_rolePermissions')
      .withIndex('by_role', (q) => q.eq('roleId', role._id))
      .collect();

    // Fetch the actual permission documents and add to set
    for (const rp of rolePermissions) {
      const permission = await ctx.db.get('rbac_permissions', rp.permissionId);
      if (permission) {
        permissions.add(permission.name);
      }
    }
  }

  return {
    roles,
    permissions,
    hasWildcard: false,
  };
}

/**
 * Get all permission names for a user as an array.
 * Convenience method for serialization.
 *
 * @param ctx - Convex context
 * @param userId - The user ID
 * @returns Array of permission names
 */
export async function getUserPermissionList(
  ctx: Context,
  userId: Id<'users'>
): Promise<PermissionName[]> {
  const userPermissions = await getUserPermissions(ctx, userId);
  return Array.from(userPermissions.permissions);
}

// ============================================================================
// Legacy Compatibility
// ============================================================================

/**
 * Check if a user has system admin access.
 * This provides backward compatibility with the old accessLevel system.
 * Checks both the legacy accessLevel field AND the RBAC system.
 *
 * @param ctx - Convex context
 * @param user - The user document
 * @returns true if user is a system admin
 */
export async function isSystemAdminRbac(ctx: Context, user: Doc<'users'>): Promise<boolean> {
  // Legacy check (for transition period)
  if (user.accessLevel === 'system_admin') {
    return true;
  }

  // RBAC check - see if user has system_admin role
  const systemAdminRole = await ctx.db
    .query('rbac_roles')
    .withIndex('by_name', (q) => q.eq('name', 'system_admin'))
    .unique();

  if (!systemAdminRole) {
    return false;
  }

  const userRole = await ctx.db
    .query('rbac_userRoles')
    .withIndex('by_user_role', (q) => q.eq('userId', user._id).eq('roleId', systemAdminRole._id))
    .unique();

  return userRole !== null;
}
