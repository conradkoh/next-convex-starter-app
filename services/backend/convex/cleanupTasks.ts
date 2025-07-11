import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
import { internalMutation } from './_generated/server';

/**
 * Cleanup task for expired login requests.
 * This can be called periodically to clean up expired OAuth login requests.
 */
export const cleanupExpiredLoginRequests = internalMutation({
  args: {},
  handler: async (ctx, _args) => {
    const now = Date.now();

    // Find expired login requests that haven't been completed
    const expiredRequests = await ctx.db
      .query('auth_loginRequests')
      .filter((q) => q.and(q.lt(q.field('expiresAt'), now), q.neq(q.field('status'), 'completed')))
      .collect();

    // Delete expired requests
    let deletedCount = 0;
    for (const request of expiredRequests) {
      await ctx.db.delete(request._id);
      deletedCount++;
    }

    console.log(`Cleaned up ${deletedCount} expired login requests`);

    return {
      success: true,
      deletedCount,
    };
  },
});

/**
 * Cleanup task for expired login codes.
 * This can be called periodically to clean up expired login codes.
 */
export const cleanupExpiredLoginCodes = internalMutation({
  args: {},
  handler: async (ctx, _args) => {
    const now = Date.now();

    // Find expired login codes
    const expiredCodes = await ctx.db
      .query('loginCodes')
      .filter((q) => q.lt(q.field('expiresAt'), now))
      .collect();

    // Delete expired codes
    let deletedCount = 0;
    for (const code of expiredCodes) {
      await ctx.db.delete(code._id);
      deletedCount++;
    }

    console.log(`Cleaned up ${deletedCount} expired login codes`);

    return {
      success: true,
      deletedCount,
    };
  },
});

/**
 * Master cleanup function that runs all cleanup tasks.
 */
export const runAllCleanupTasks = internalMutation({
  args: {},
  handler: async (
    ctx,
    _args
  ): Promise<{
    success: boolean;
    results: {
      loginRequests: { success: boolean; deletedCount: number };
      loginCodes: { success: boolean; deletedCount: number };
    };
  }> => {
    const results = {
      loginRequests: await ctx.runMutation(internal.cleanupTasks.cleanupExpiredLoginRequests, {}),
      loginCodes: await ctx.runMutation(internal.cleanupTasks.cleanupExpiredLoginCodes, {}),
    };

    console.log('Cleanup completed:', results);

    return {
      success: true,
      results,
    };
  },
});

// Register cron jobs for automatic cleanup
const cleanupCronJobs = cronJobs();

// Run cleanup every 10 minutes
cleanupCronJobs.interval(
  'cleanup expired auth data',
  { minutes: 10 },
  internal.cleanupTasks.runAllCleanupTasks
);

export default cleanupCronJobs;
