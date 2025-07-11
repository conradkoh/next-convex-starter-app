import { v } from 'convex/values';
import type { SessionId } from 'convex-helpers/server/sessions';
import { api } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { action, mutation, query } from '../_generated/server';

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
 * Handles Google OAuth callback for login flow.
 * Processes the OAuth code, exchanges it for a profile, logs in the user, and marks the request as completed.
 */
export const handleGoogleLoginCallback = action({
  args: {
    code: v.string(),
    state: v.string(), // This is the loginRequestId
  },
  handler: async (ctx, args) => {
    const { code, state } = args;

    try {
      // Get the login request to extract sessionId and redirectUri
      const loginRequest = await ctx.runQuery(api.auth.google.getLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
      });
      if (!loginRequest || loginRequest.provider !== 'google') {
        throw new Error('Invalid login request');
      }

      // SECURITY: Check if login request has expired
      const now = Date.now();
      if (loginRequest.expiresAt && now > loginRequest.expiresAt) {
        throw new Error('Login request expired');
      }

      // Use the redirect URI that was stored with the login request
      const redirectUri = loginRequest.redirectUri;
      if (!redirectUri) {
        throw new Error('No redirect URI found in login request');
      }

      // Exchange code for Google profile
      const { profile, success } = await ctx.runAction(api.googleAuth.exchangeGoogleCode, {
        code,
        state,
        redirectUri,
      });
      if (!success) throw new Error('Google OAuth failed');

      // Find or create user and update session - using mutation
      const loginResult = await ctx.runMutation(api.googleAuth.loginWithGoogle, {
        profile,
        sessionId: loginRequest.sessionId as SessionId, // SessionId type casting
      });
      if (!loginResult.success) throw new Error('Login failed');

      // Mark login request as completed
      await ctx.runMutation(api.auth.google.completeLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
        status: 'completed',
      });

      return {
        success: true,
        message: 'Login successful. You may close this window.',
      };
    } catch (err) {
      // Mark login request as failed
      await ctx.runMutation(api.auth.google.completeLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      });

      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },
});

/**
 * Handles Google OAuth callback for profile connect flow.
 * Processes the OAuth code, exchanges it for a profile, connects the account to existing user, and marks the request as completed.
 */
export const handleGoogleConnectCallback = action({
  args: {
    code: v.string(),
    state: v.string(), // This is the loginRequestId
  },
  handler: async (ctx, args) => {
    const { code, state } = args;

    try {
      // Get the login request to extract sessionId and redirectUri
      const loginRequest = await ctx.runQuery(api.auth.google.getLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
      });
      if (!loginRequest || loginRequest.provider !== 'google') {
        throw new Error('Invalid login request');
      }

      // SECURITY: Check if login request has expired
      const now = Date.now();
      if (loginRequest.expiresAt && now > loginRequest.expiresAt) {
        throw new Error('Login request expired');
      }

      // Use the redirect URI that was stored with the login request
      const redirectUri = loginRequest.redirectUri;
      if (!redirectUri) {
        throw new Error('No redirect URI found in login request');
      }

      // Exchange code for Google profile
      const { profile, success } = await ctx.runAction(api.googleAuth.exchangeGoogleCode, {
        code,
        state,
        redirectUri,
      });
      if (!success) throw new Error('Google OAuth failed');

      // Connect Google account to existing user - using mutation
      const connectResult = await ctx.runMutation(api.googleAuth.connectGoogle, {
        profile,
        sessionId: loginRequest.sessionId as SessionId, // SessionId type casting
      });
      if (!connectResult.success) throw new Error('Connect failed');

      // Mark login request as completed
      await ctx.runMutation(api.auth.google.completeLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
        status: 'completed',
      });

      return {
        success: true,
        message: 'Account connected successfully. You may close this window.',
      };
    } catch (err) {
      // Mark login request as failed
      await ctx.runMutation(api.auth.google.completeLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      });

      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },
});
