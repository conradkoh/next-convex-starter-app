import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction, internalMutation, internalQuery } from './_generated/server';

const BATCH_SIZE = 100; // Process 100 sessions per batch

// Internal mutation to unset expiration fields for a single session
export const unsetSessionExpiration = internalMutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      expiresAt: undefined,
      expiresAtLabel: undefined,
    });
  },
});

// Internal action to iterate through all sessions and unset expiration
export const migrateUnsetSessionExpiration = internalAction({
  args: { cursor: v.optional(v.string()) }, // Convex cursor for pagination
  handler: async (ctx, args) => {
    const paginationOpts = {
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

// Helper query to get sessions with pagination (used by the action)
export const getSessionsBatch = internalQuery({
  args: { paginationOpts: v.any() }, // Using v.any() for simplicity, consider a stricter type
  handler: async (ctx, args) => {
    return await ctx.db.query('sessions').paginate(args.paginationOpts);
  },
});

// ========================================
// USER ACCESS LEVEL MIGRATION
// ========================================

// Internal mutation to set accessLevel to 'user' for a single user if undefined
export const setUserAccessLevelDefault = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return; // User doesn't exist, skip
    }

    // Only update if accessLevel is undefined
    if (user.accessLevel === undefined) {
      await ctx.db.patch(args.userId, {
        accessLevel: 'user',
      });
    }
  },
});

// Internal action to migrate all users to have accessLevel set to 'user' if undefined
export const migrateUserAccessLevels = internalAction({
  args: { cursor: v.optional(v.string()) }, // Convex cursor for pagination
  handler: async (ctx, args) => {
    const paginationOpts = {
      numItems: BATCH_SIZE,
      cursor: args.cursor ?? null,
    };

    // Fetch a batch of users
    const results = await ctx.runQuery(internal.migration.getUsersBatch, {
      paginationOpts,
    });

    let updatedCount = 0;

    // Schedule mutations to update each user in the batch if needed
    for (const user of results.page) {
      if (user.accessLevel === undefined) {
        await ctx.runMutation(internal.migration.setUserAccessLevelDefault, {
          userId: user._id,
        });
        updatedCount++;
      }
    }

    console.log(`Processed batch: ${results.page.length} users, updated: ${updatedCount}`);

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

// Helper query to get users with pagination (used by the migration action)
export const getUsersBatch = internalQuery({
  args: { paginationOpts: v.any() }, // Using v.any() for simplicity, consider a stricter type
  handler: async (ctx, args) => {
    return await ctx.db.query('users').paginate(args.paginationOpts);
  },
});
