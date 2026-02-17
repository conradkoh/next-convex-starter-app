import { v } from 'convex/values';

import { internal } from './_generated/api';
import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { assignRoleByName } from '../modules/rbac/roles';

const BATCH_SIZE = 100; // Process 100 sessions per batch

interface PaginationOpts {
  numItems: number;
  cursor: string | null;
}

/**
 * Internal mutation to remove deprecated expiration fields from a single session.
 * Part of the session expiration deprecation migration.
 */
export const unsetSessionExpiration = internalMutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    await ctx.db.patch('sessions', args.sessionId, {
      expiresAt: undefined,
      expiresAtLabel: undefined,
    });
  },
});

/**
 * Internal action to migrate all sessions by removing deprecated expiration fields.
 * Processes sessions in batches to avoid timeout issues.
 */
export const migrateUnsetSessionExpiration = internalAction({
  args: { cursor: v.optional(v.string()) }, // Convex cursor for pagination
  handler: async (ctx, args) => {
    const paginationOpts: PaginationOpts = {
      numItems: BATCH_SIZE,
      cursor: args.cursor ?? null,
    };

    // Fetch a batch of sessions
    const results = await ctx.runQuery(internal.migration.getSessionsBatch, {
      paginationOpts,
    });

    // Schedule mutations to update each session in the batch
    for (const session of results.page) {
      await ctx.runMutation(internal.migration.unsetSessionExpiration, {
        sessionId: session._id,
      });
    }

    // If there are more sessions, schedule the next batch
    if (!results.isDone) {
      await ctx.runAction(internal.migration.migrateUnsetSessionExpiration, {
        cursor: results.continueCursor,
      });
    }
  },
});

/**
 * Helper query to fetch sessions in batches for pagination during migration.
 */
export const getSessionsBatch = internalQuery({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query('sessions').paginate(args.paginationOpts);
  },
});

// ========================================
// USER ACCESS LEVEL MIGRATION
// ========================================

/**
 * Internal mutation to set default accessLevel for a user if currently undefined.
 * Part of the user access level migration to ensure all users have explicit access levels.
 */
export const setUserAccessLevelDefault = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get('users', args.userId);
    if (!user) {
      return; // User doesn't exist, skip
    }

    // Only update if accessLevel is undefined
    if (user.accessLevel === undefined) {
      await ctx.db.patch('users', args.userId, {
        accessLevel: 'user',
      });
    }
  },
});

/**
 * Internal mutation to set all users with undefined accessLevel to 'user' in a single batch.
 * Updates are executed in parallel for better performance.
 * WARNING: This processes all users at once and may timeout for large user bases.
 * For large datasets, use migrateUserAccessLevels (action) instead.
 *
 * @returns Object with count of users updated
 */
export const setAllUndefinedAccessLevelsToUser = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Fetch all users with undefined accessLevel
    const allUsers = await ctx.db.query('users').collect();

    // Filter users that need updating
    const usersToUpdate = allUsers.filter((user) => user.accessLevel === undefined);

    // Update all users in parallel
    await Promise.all(
      usersToUpdate.map((user) =>
        ctx.db.patch('users', user._id, {
          accessLevel: 'user',
        })
      )
    );

    console.log(
      `Migration complete: Updated ${usersToUpdate.length} users to accessLevel: 'user' (out of ${allUsers.length} total users)`
    );

    return {
      success: true,
      updatedCount: usersToUpdate.length,
      totalUsers: allUsers.length,
    };
  },
});

/**
 * Internal action to migrate all users to have explicit accessLevel values.
 * Sets undefined accessLevel fields to 'user' as the default.
 * Processes users in batches to handle large datasets safely.
 * Updates within each batch are executed in parallel for better performance.
 */
export const migrateUserAccessLevels = internalAction({
  args: { cursor: v.optional(v.string()) }, // Convex cursor for pagination
  handler: async (ctx, args) => {
    const paginationOpts: PaginationOpts = {
      numItems: BATCH_SIZE,
      cursor: args.cursor ?? null,
    };

    // Fetch a batch of users
    const results = await ctx.runQuery(internal.migration.getUsersBatch, {
      paginationOpts,
    });

    // Filter users that need updating
    const usersToUpdate = results.page.filter((user) => user.accessLevel === undefined);

    // Schedule mutations to update all users in the batch in parallel
    await Promise.all(
      usersToUpdate.map((user) =>
        ctx.runMutation(internal.migration.setUserAccessLevelDefault, {
          userId: user._id,
        })
      )
    );

    console.log(`Processed batch: ${results.page.length} users, updated: ${usersToUpdate.length}`);

    // If there are more users, schedule the next batch
    if (!results.isDone) {
      await ctx.runAction(internal.migration.migrateUserAccessLevels, {
        cursor: results.continueCursor,
      });
    } else {
      console.log('User access level migration completed');
    }
  },
});

/**
 * Helper query to fetch users in batches for pagination during migration.
 */
export const getUsersBatch = internalQuery({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query('users').paginate(args.paginationOpts);
  },
});

// ========================================
// RBAC MIGRATION
// ========================================

/**
 * Internal mutation to assign RBAC roles to a user based on their accessLevel.
 * Part of the migration from accessLevel to RBAC system.
 */
export const assignRbacRoleToUser = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get('users', args.userId);
    if (!user) {
      return { success: false, reason: 'user_not_found' };
    }

    // Determine which role to assign based on accessLevel
    const roleName = user.accessLevel === 'system_admin' ? 'system_admin' : 'user';

    // Assign the role
    const result = await assignRoleByName(ctx, args.userId, roleName);

    return {
      success: true,
      roleName,
      alreadyAssigned: result === null,
    };
  },
});

/**
 * Internal action to migrate all users to RBAC by assigning roles based on accessLevel.
 * Processes users in batches to handle large datasets safely.
 */
export const migrateUsersToRbac = internalAction({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const paginationOpts: PaginationOpts = {
      numItems: BATCH_SIZE,
      cursor: args.cursor ?? null,
    };

    // Fetch a batch of users
    const results = await ctx.runQuery(internal.migration.getUsersBatch, {
      paginationOpts,
    });

    // Assign RBAC roles to all users in the batch in parallel
    const migrationResults = await Promise.all(
      results.page.map((user) =>
        ctx.runMutation(internal.migration.assignRbacRoleToUser, {
          userId: user._id,
        })
      )
    );

    const assignedCount = migrationResults.filter((r) => r.success && !r.alreadyAssigned).length;
    const alreadyAssignedCount = migrationResults.filter(
      (r) => r.success && r.alreadyAssigned
    ).length;

    console.log(
      `RBAC Migration batch: ${results.page.length} users processed, ` +
        `${assignedCount} roles assigned, ${alreadyAssignedCount} already had roles`
    );

    // If there are more users, schedule the next batch
    if (!results.isDone) {
      await ctx.runAction(internal.migration.migrateUsersToRbac, {
        cursor: results.continueCursor,
      });
    } else {
      console.log('RBAC migration completed');
    }
  },
});

/**
 * Internal mutation to migrate all users to RBAC in a single batch.
 * WARNING: This processes all users at once and may timeout for large user bases.
 * For large datasets, use migrateUsersToRbac (action) instead.
 */
export const migrateAllUsersToRbac = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Fetch all users
    const allUsers = await ctx.db.query('users').collect();

    let assignedCount = 0;
    let alreadyAssignedCount = 0;

    // Assign roles to all users
    for (const user of allUsers) {
      const roleName = user.accessLevel === 'system_admin' ? 'system_admin' : 'user';
      const result = await assignRoleByName(ctx, user._id, roleName);

      if (result !== null) {
        assignedCount++;
      } else {
        alreadyAssignedCount++;
      }
    }

    console.log(
      `RBAC Migration complete: ${allUsers.length} users processed, ` +
        `${assignedCount} roles assigned, ${alreadyAssignedCount} already had roles`
    );

    return {
      success: true,
      totalUsers: allUsers.length,
      assignedCount,
      alreadyAssignedCount,
    };
  },
});
