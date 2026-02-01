import { v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';

import { query, mutation, internalMutation } from './_generated/server';
import { isSystemAdmin } from '../modules/auth/accessControl';
import { getAuthUser } from '../modules/auth/getAuthUser';
import { hasPermission, getUserPermissionList } from '../modules/rbac/permissions';
import {
  getUserRoles,
  getUserRoleNames,
  getRoleByName,
  getAllRoles,
  assignRoleByName,
  removeRoleByName,
  getRolePermissions,
  hasRole,
} from '../modules/rbac/roles';
import { INITIAL_PERMISSIONS, DEFAULT_ROLES, USER_ROLE_PERMISSIONS } from '../modules/rbac/types';

// ============================================================================
// Queries
// ============================================================================

/**
 * Get the current user's roles.
 */
export const getMyRoles = query({
  args: { ...SessionIdArg },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    if (!user) {
      return [];
    }

    const roles = await getUserRoles(ctx, user._id);
    return roles.map((role) => ({
      id: role._id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
    }));
  },
});

/**
 * Get the current user's permissions.
 */
export const getMyPermissions = query({
  args: { ...SessionIdArg },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    if (!user) {
      return [];
    }

    return await getUserPermissionList(ctx, user._id);
  },
});

/**
 * Check if the current user has a specific permission.
 */
export const checkPermission = query({
  args: {
    ...SessionIdArg,
    permission: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    if (!user) {
      return false;
    }

    return await hasPermission(ctx, user._id, args.permission);
  },
});

/**
 * Check if the current user has a specific role.
 */
export const checkRole = query({
  args: {
    ...SessionIdArg,
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    if (!user) {
      return false;
    }

    return await hasRole(ctx, user._id, args.role);
  },
});

/**
 * Get all available roles (admin only).
 */
export const listRoles = query({
  args: { ...SessionIdArg },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    if (!user || !isSystemAdmin(user)) {
      return [];
    }

    const roles = await getAllRoles(ctx);
    return roles.map((role) => ({
      id: role._id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystemRole: role.isSystemRole,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));
  },
});

/**
 * Get all available permissions (admin only).
 */
export const listPermissions = query({
  args: { ...SessionIdArg },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    if (!user || !isSystemAdmin(user)) {
      return [];
    }

    const permissions = await ctx.db.query('rbac_permissions').collect();
    return permissions.map((p) => ({
      id: p._id,
      name: p.name,
      displayName: p.displayName,
      description: p.description,
      resource: p.resource,
      action: p.action,
    }));
  },
});

/**
 * Get permissions for a specific role (admin only).
 */
export const getRolePermissionsQuery = query({
  args: {
    ...SessionIdArg,
    roleName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    if (!user || !isSystemAdmin(user)) {
      return [];
    }

    const role = await getRoleByName(ctx, args.roleName);
    if (!role) {
      return [];
    }

    const permissions = await getRolePermissions(ctx, role._id);
    return permissions.map((p) => ({
      id: p._id,
      name: p.name,
      displayName: p.displayName,
      description: p.description,
      resource: p.resource,
      action: p.action,
    }));
  },
});

/**
 * Get a user's roles (admin only).
 */
export const getUserRolesQuery = query({
  args: {
    ...SessionIdArg,
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    if (!user || !isSystemAdmin(user)) {
      return [];
    }

    return await getUserRoleNames(ctx, args.userId);
  },
});

// ============================================================================
// Mutations
// ============================================================================

/**
 * Assign a role to a user (admin only).
 */
export const assignUserRole = mutation({
  args: {
    ...SessionIdArg,
    userId: v.id('users'),
    roleName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Must be system admin
    if (!isSystemAdmin(user)) {
      throw new Error('Only system administrators can assign roles');
    }

    // Verify target user exists
    const targetUser = await ctx.db.get('users', args.userId);
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Assign the role
    const result = await assignRoleByName(ctx, args.userId, args.roleName, user._id);
    if (result === null) {
      // Role doesn't exist or already assigned
      const role = await getRoleByName(ctx, args.roleName);
      if (!role) {
        throw new Error(`Role '${args.roleName}' does not exist`);
      }
      // Already assigned - not an error
      return { success: true, alreadyAssigned: true };
    }

    return { success: true, alreadyAssigned: false };
  },
});

/**
 * Remove a role from a user (admin only).
 */
export const removeUserRole = mutation({
  args: {
    ...SessionIdArg,
    userId: v.id('users'),
    roleName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Must be system admin
    if (!isSystemAdmin(user)) {
      throw new Error('Only system administrators can remove roles');
    }

    // Prevent removing own admin role
    if (user._id === args.userId && args.roleName === 'system_admin') {
      throw new Error('Cannot remove your own system_admin role');
    }

    const result = await removeRoleByName(ctx, args.userId, args.roleName);
    return { success: result };
  },
});

// ============================================================================
// Seed Data (Internal)
// ============================================================================

/**
 * Seed default roles and permissions.
 * This is an internal mutation that should be called during initial setup.
 */
export const seedRbacData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const results = {
      rolesCreated: 0,
      permissionsCreated: 0,
      rolePermissionsCreated: 0,
    };

    // Create default permissions
    const permissionIdMap = new Map<
      string,
      typeof ctx.db extends { get: (id: infer T) => unknown } ? T : never
    >();

    for (const permDef of INITIAL_PERMISSIONS) {
      // Check if permission already exists
      const existing = await ctx.db
        .query('rbac_permissions')
        .withIndex('by_name', (q) => q.eq('name', permDef.name))
        .unique();

      if (!existing) {
        const id = await ctx.db.insert('rbac_permissions', {
          name: permDef.name,
          displayName: permDef.displayName,
          description: permDef.description,
          resource: permDef.resource,
          action: permDef.action,
          createdAt: now,
        });
        permissionIdMap.set(permDef.name, id);
        results.permissionsCreated++;
      } else {
        permissionIdMap.set(permDef.name, existing._id);
      }
    }

    // Create default roles
    const roleIdMap = new Map<
      string,
      typeof ctx.db extends { get: (id: infer T) => unknown } ? T : never
    >();

    for (const roleDef of DEFAULT_ROLES) {
      // Check if role already exists
      const existing = await ctx.db
        .query('rbac_roles')
        .withIndex('by_name', (q) => q.eq('name', roleDef.name))
        .unique();

      if (!existing) {
        const id = await ctx.db.insert('rbac_roles', {
          name: roleDef.name,
          displayName: roleDef.displayName,
          description: roleDef.description,
          isSystemRole: roleDef.isSystemRole ?? false,
          createdAt: now,
          updatedAt: now,
        });
        roleIdMap.set(roleDef.name, id);
        results.rolesCreated++;
      } else {
        roleIdMap.set(roleDef.name, existing._id);
      }
    }

    // Assign permissions to user role
    const userRoleId = roleIdMap.get('user');
    if (userRoleId) {
      for (const permName of USER_ROLE_PERMISSIONS) {
        const permId = permissionIdMap.get(permName);
        if (permId) {
          // Check if mapping already exists
          const existing = await ctx.db
            .query('rbac_rolePermissions')
            .withIndex('by_role_permission', (q) =>
              q.eq('roleId', userRoleId).eq('permissionId', permId)
            )
            .unique();

          if (!existing) {
            await ctx.db.insert('rbac_rolePermissions', {
              roleId: userRoleId,
              permissionId: permId,
            });
            results.rolePermissionsCreated++;
          }
        }
      }
    }

    // Note: system_admin role doesn't need explicit permissions
    // as it uses wildcard (*) permission

    return results;
  },
});

/**
 * Public mutation to seed RBAC data (admin only).
 * Use this to initialize the RBAC system.
 */
export const initializeRbac = mutation({
  args: { ...SessionIdArg },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Must be system admin
    if (!isSystemAdmin(user)) {
      throw new Error('Only system administrators can initialize RBAC');
    }

    // Run the internal seed mutation
    const now = Date.now();
    const results = {
      rolesCreated: 0,
      permissionsCreated: 0,
      rolePermissionsCreated: 0,
    };

    // Create default permissions
    const permissionIdMap = new Map<
      string,
      typeof ctx.db extends { get: (id: infer T) => unknown } ? T : never
    >();

    for (const permDef of INITIAL_PERMISSIONS) {
      const existing = await ctx.db
        .query('rbac_permissions')
        .withIndex('by_name', (q) => q.eq('name', permDef.name))
        .unique();

      if (!existing) {
        const id = await ctx.db.insert('rbac_permissions', {
          name: permDef.name,
          displayName: permDef.displayName,
          description: permDef.description,
          resource: permDef.resource,
          action: permDef.action,
          createdAt: now,
        });
        permissionIdMap.set(permDef.name, id);
        results.permissionsCreated++;
      } else {
        permissionIdMap.set(permDef.name, existing._id);
      }
    }

    // Create default roles
    const roleIdMap = new Map<
      string,
      typeof ctx.db extends { get: (id: infer T) => unknown } ? T : never
    >();

    for (const roleDef of DEFAULT_ROLES) {
      const existing = await ctx.db
        .query('rbac_roles')
        .withIndex('by_name', (q) => q.eq('name', roleDef.name))
        .unique();

      if (!existing) {
        const id = await ctx.db.insert('rbac_roles', {
          name: roleDef.name,
          displayName: roleDef.displayName,
          description: roleDef.description,
          isSystemRole: roleDef.isSystemRole ?? false,
          createdAt: now,
          updatedAt: now,
        });
        roleIdMap.set(roleDef.name, id);
        results.rolesCreated++;
      } else {
        roleIdMap.set(roleDef.name, existing._id);
      }
    }

    // Assign permissions to user role
    const userRoleId = roleIdMap.get('user');
    if (userRoleId) {
      for (const permName of USER_ROLE_PERMISSIONS) {
        const permId = permissionIdMap.get(permName);
        if (permId) {
          const existing = await ctx.db
            .query('rbac_rolePermissions')
            .withIndex('by_role_permission', (q) =>
              q.eq('roleId', userRoleId).eq('permissionId', permId)
            )
            .unique();

          if (!existing) {
            await ctx.db.insert('rbac_rolePermissions', {
              roleId: userRoleId,
              permissionId: permId,
            });
            results.rolePermissionsCreated++;
          }
        }
      }
    }

    return results;
  },
});
