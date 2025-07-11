import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';

/**
 * Gets Google authentication configuration for client use.
 * Returns public configuration data (client ID, enabled status, and redirect URIs for login/connect).
 */
export const getConfig = query({
  args: {},
  handler: async (ctx, _args) => {
    // Get Google Auth configuration from database
    const config = await ctx.db
      .query('thirdPartyAuthConfig')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();

    const base = process.env.CONVEX_SITE_URL;
    const redirectUris = {
      login: `${base}/auth/google/callback`,
      connect: `${base}/app/profile/connect/google/callback`,
    };

    if (!config) {
      return {
        enabled: false,
        clientId: null,
        redirectUris,
      };
    }

    return {
      enabled: config.enabled,
      clientId: config.clientId || null,
      redirectUris,
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes from now
    const id = await ctx.db.insert('auth_loginRequests', {
      sessionId: args.sessionId,
      status: 'pending',
      createdAt: now,
      expiresAt,
      provider: 'google',
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
 * Query to get the correct Google OAuth redirect URI for login or connect flows.
 */
export const getGoogleRedirectUri = query({
  args: {
    type: v.union(v.literal('login'), v.literal('connect')),
  },
  handler: async (_ctx, args) => {
    const base = process.env.CONVEX_SITE_URL;
    if (args.type === 'login') {
      return { redirectUri: `${base}/auth/google/callback` };
    }
    return { redirectUri: `${base}/app/profile/connect/google/callback` };
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
