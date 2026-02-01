import type { RoleName, RbacRole, RbacRoleId } from './types';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import type { QueryCtx, MutationCtx } from '../../convex/_generated/server';

/**
 * RBAC Role Management Module
 * Provides utilities for managing roles and role assignments.
 */

type Context = QueryCtx | MutationCtx;

// ============================================================================
// Role Queries
// ============================================================================

/**
 * Get a role by its name.
 *
 * @param ctx - Convex context
 * @param name - The role name
 * @returns The role document or null if not found
 */
export async function getRoleByName(ctx: Context, name: RoleName): Promise<RbacRole | null> {
  return await ctx.db
    .query('rbac_roles')
    .withIndex('by_name', (q) => q.eq('name', name))
    .unique();
}

/**
 * Get a role by its ID.
 *
 * @param ctx - Convex context
 * @param roleId - The role ID
 * @returns The role document or null if not found
 */
export async function getRoleById(ctx: Context, roleId: RbacRoleId): Promise<RbacRole | null> {
  return await ctx.db.get('rbac_roles', roleId);
}

/**
 * Get all roles.
 *
 * @param ctx - Convex context
 * @returns Array of all role documents
 */
export async function getAllRoles(ctx: Context): Promise<RbacRole[]> {
  return await ctx.db.query('rbac_roles').collect();
}

/**
 * Get all roles assigned to a user.
 *
 * @param ctx - Convex context
 * @param userId - The user ID
 * @returns Array of role documents assigned to the user
 */
export async function getUserRoles(ctx: Context, userId: Id<'users'>): Promise<RbacRole[]> {
  const userRoles = await ctx.db
    .query('rbac_userRoles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();

  const roles: RbacRole[] = [];
  for (const userRole of userRoles) {
    const role = await ctx.db.get('rbac_roles', userRole.roleId);
    if (role) {
      roles.push(role);
    }
  }

  return roles;
}

/**
 * Get role names for a user.
 *
 * @param ctx - Convex context
 * @param userId - The user ID
 * @returns Array of role names assigned to the user
 */
export async function getUserRoleNames(ctx: Context, userId: Id<'users'>): Promise<RoleName[]> {
  const roles = await getUserRoles(ctx, userId);
  return roles.map((role) => role.name);
}

/**
 * Check if a user has a specific role.
 *
 * @param ctx - Convex context
 * @param userId - The user ID
 * @param roleName - The role name to check
 * @returns true if user has the role, false otherwise
 */
export async function hasRole(
  ctx: Context,
  userId: Id<'users'>,
  roleName: RoleName
): Promise<boolean> {
  const role = await getRoleByName(ctx, roleName);
  if (!role) {
    return false;
  }

  const userRole = await ctx.db
    .query('rbac_userRoles')
    .withIndex('by_user_role', (q) => q.eq('userId', userId).eq('roleId', role._id))
    .unique();

  return userRole !== null;
}

// ============================================================================
// Role Mutations (for MutationCtx only)
// ============================================================================

/**
 * Assign a role to a user.
 * Does nothing if the user already has the role.
 *
 * @param ctx - Mutation context
 * @param userId - The user ID
 * @param roleId - The role ID to assign
 * @param assignedBy - Optional user ID of who is assigning (null for system)
 * @returns The user role assignment ID, or null if already assigned
 */
export async function assignRole(
  ctx: MutationCtx,
  userId: Id<'users'>,
  roleId: RbacRoleId,
  assignedBy?: Id<'users'>
): Promise<Id<'rbac_userRoles'> | null> {
  // Check if already assigned
  const existing = await ctx.db
    .query('rbac_userRoles')
    .withIndex('by_user_role', (q) => q.eq('userId', userId).eq('roleId', roleId))
    .unique();

  if (existing) {
    return null; // Already assigned
  }

  // Create the assignment
  return await ctx.db.insert('rbac_userRoles', {
    userId,
    roleId,
    assignedAt: Date.now(),
    assignedBy,
  });
}

/**
 * Assign a role to a user by role name.
 *
 * @param ctx - Mutation context
 * @param userId - The user ID
 * @param roleName - The role name to assign
 * @param assignedBy - Optional user ID of who is assigning
 * @returns The user role assignment ID, or null if role doesn't exist or already assigned
 */
export async function assignRoleByName(
  ctx: MutationCtx,
  userId: Id<'users'>,
  roleName: RoleName,
  assignedBy?: Id<'users'>
): Promise<Id<'rbac_userRoles'> | null> {
  const role = await getRoleByName(ctx, roleName);
  if (!role) {
    return null;
  }

  return await assignRole(ctx, userId, role._id, assignedBy);
}

/**
 * Remove a role from a user.
 *
 * @param ctx - Mutation context
 * @param userId - The user ID
 * @param roleId - The role ID to remove
 * @returns true if role was removed, false if user didn't have the role
 */
export async function removeRole(
  ctx: MutationCtx,
  userId: Id<'users'>,
  roleId: RbacRoleId
): Promise<boolean> {
  const userRole = await ctx.db
    .query('rbac_userRoles')
    .withIndex('by_user_role', (q) => q.eq('userId', userId).eq('roleId', roleId))
    .unique();

  if (!userRole) {
    return false;
  }

  await ctx.db.delete('rbac_userRoles', userRole._id);
  return true;
}

/**
 * Remove a role from a user by role name.
 *
 * @param ctx - Mutation context
 * @param userId - The user ID
 * @param roleName - The role name to remove
 * @returns true if role was removed, false if role doesn't exist or user didn't have it
 */
export async function removeRoleByName(
  ctx: MutationCtx,
  userId: Id<'users'>,
  roleName: RoleName
): Promise<boolean> {
  const role = await getRoleByName(ctx, roleName);
  if (!role) {
    return false;
  }

  return await removeRole(ctx, userId, role._id);
}

// ============================================================================
// Role Permission Management
// ============================================================================

/**
 * Get all permissions for a role.
 *
 * @param ctx - Convex context
 * @param roleId - The role ID
 * @returns Array of permission documents
 */
export async function getRolePermissions(
  ctx: Context,
  roleId: RbacRoleId
): Promise<Doc<'rbac_permissions'>[]> {
  const rolePermissions = await ctx.db
    .query('rbac_rolePermissions')
    .withIndex('by_role', (q) => q.eq('roleId', roleId))
    .collect();

  const permissions: Doc<'rbac_permissions'>[] = [];
  for (const rp of rolePermissions) {
    const permission = await ctx.db.get('rbac_permissions', rp.permissionId);
    if (permission) {
      permissions.push(permission);
    }
  }

  return permissions;
}

/**
 * Add a permission to a role.
 *
 * @param ctx - Mutation context
 * @param roleId - The role ID
 * @param permissionId - The permission ID to add
 * @returns The role-permission mapping ID, or null if already exists
 */
export async function addPermissionToRole(
  ctx: MutationCtx,
  roleId: RbacRoleId,
  permissionId: Id<'rbac_permissions'>
): Promise<Id<'rbac_rolePermissions'> | null> {
  // Check if already exists
  const existing = await ctx.db
    .query('rbac_rolePermissions')
    .withIndex('by_role_permission', (q) => q.eq('roleId', roleId).eq('permissionId', permissionId))
    .unique();

  if (existing) {
    return null;
  }

  return await ctx.db.insert('rbac_rolePermissions', {
    roleId,
    permissionId,
  });
}

/**
 * Remove a permission from a role.
 *
 * @param ctx - Mutation context
 * @param roleId - The role ID
 * @param permissionId - The permission ID to remove
 * @returns true if removed, false if mapping didn't exist
 */
export async function removePermissionFromRole(
  ctx: MutationCtx,
  roleId: RbacRoleId,
  permissionId: Id<'rbac_permissions'>
): Promise<boolean> {
  const mapping = await ctx.db
    .query('rbac_rolePermissions')
    .withIndex('by_role_permission', (q) => q.eq('roleId', roleId).eq('permissionId', permissionId))
    .unique();

  if (!mapping) {
    return false;
  }

  await ctx.db.delete('rbac_rolePermissions', mapping._id);
  return true;
}
