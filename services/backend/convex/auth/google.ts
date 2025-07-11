import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';

/**
 * Gets Google authentication configuration for client use.
 * Returns public configuration data (client ID and enabled status).
 */
export const getConfig = query({
  args: {},
  handler: async (ctx, _args) => {
    // Get Google Auth configuration from database
    const config = await ctx.db
      .query('thirdPartyAuthConfig')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();

    if (!config) {
      return {
        enabled: false,
        clientId: null,
      };
    }

    return {
      enabled: config.enabled,
      clientId: config.clientId || null,
    };
  },
});

/**
 * Mutation to create a new login request for third-party auth (e.g., Google OAuth).
 * Returns the id of the inserted login request as loginId.
 */
export const createLoginRequest = mutation({
  args: {
    sessionId: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.redirectUri) {
      throw new Error('redirectUri is required');
    }

    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes from now
    const id = await ctx.db.insert('auth_loginRequests', {
      sessionId: args.sessionId,
      status: 'pending',
      createdAt: now,
      expiresAt,
      provider: 'google',
      redirectUri: args.redirectUri,
    });
    return { loginId: id };
  },
});

/**
 * Mutation to complete or fail a login request after OAuth callback.
 * Updates status, completedAt, and error fields.
 */
export const completeLoginRequest = mutation({
  args: {
    loginRequestId: v.id('auth_loginRequests'),
    status: v.union(v.literal('completed'), v.literal('failed')),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const completedAt = Date.now();
    await ctx.db.patch(args.loginRequestId, {
      status: args.status,
      completedAt,
      error: args.error,
    });
    return { success: true };
  },
});

/**
 * Query to get a login request by ID (public for frontend polling).
 */
export const getLoginRequest = query({
  args: {
    loginRequestId: v.id('auth_loginRequests'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.loginRequestId);
  },
});

/**
 * Query to get expired login requests for cleanup.
 */
export const getExpiredLoginRequests = query({
  args: {},
  handler: async (ctx, _args) => {
    const now = Date.now();
    return await ctx.db
      .query('auth_loginRequests')
      .filter((q) => q.and(q.lt(q.field('expiresAt'), now), q.neq(q.field('status'), 'completed')))
      .collect();
  },
});

/**
 * Mutation to clean up expired login requests.
 */
export const cleanupExpiredLoginRequests = mutation({
  args: {},
  handler: async (ctx, _args) => {
    const now = Date.now();
    const expiredRequests = await ctx.db
      .query('auth_loginRequests')
      .filter((q) => q.and(q.lt(q.field('expiresAt'), now), q.neq(q.field('status'), 'completed')))
      .collect();

    // Delete expired requests
    for (const request of expiredRequests) {
      await ctx.db.delete(request._id);
    }

    return {
      success: true,
      deletedCount: expiredRequests.length,
    };
  },
});
