import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { internalAction, internalMutation } from './_generated/server';

// Internal mutation to clean up expired login codes
export const cleanupExpiredLoginCodes = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expiredCodes = await ctx.db
      .query('loginCodes')
      .filter((q) => q.lt(q.field('expiresAt'), now))
      .collect();

    // Delete all expired codes in parallel
    await Promise.all(expiredCodes.map((code) => ctx.db.delete(code._id)));

    return { deletedCount: expiredCodes.length };
  },
});

// Action to orchestrate the cleanup of deleted chats
export const cleanupDeletedChats = internalAction({
  handler: async (ctx) => {
    // Get up to 10,000 deleted chats that need cleanup
    const { chats, hasNext } = await ctx.runMutation(internal.chat.getDeletedChats, {
      limit: 10000,
    });

    if (chats.length === 0) {
      console.log('Chat cleanup completed: No chats found for cleanup');
      return;
    }

    // Extract chat IDs for deletion
    const chatIds = chats.map((chat) => chat._id);

    // Delete all the chats and their associated data
    const { chatsProcessed, filesDeleted, errorCount } = await ctx.runMutation(
      internal.chat.hardDeleteChats,
      { chatIds }
    );

    // Log single summary line
    console.log(
      `Chat cleanup completed: ${chatsProcessed} chats deleted, ${filesDeleted} files deleted, ${errorCount} errors`
    );

    // If there are more chats to process, schedule another run immediately
    if (hasNext) {
      await ctx.scheduler.runAfter(0, internal.cleanupTasks.cleanupDeletedChats, {});
    }
  },
});

// Register the cron jobs
const cleanupCronJobs = cronJobs();

cleanupCronJobs.interval(
  'cleanup expired login codes',
  { minutes: 5 },
  internal.cleanupTasks.cleanupExpiredLoginCodes
);

cleanupCronJobs.interval(
  'cleanup deleted chats',
  { minutes: 5 },
  internal.cleanupTasks.cleanupDeletedChats
);

export default cleanupCronJobs;
