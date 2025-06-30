import { SessionIdArg } from 'convex-helpers/server/sessions';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';
import { featureFlags } from '../config/featureFlags';
import type { AuthState } from '../modules/auth/types/AuthState';
import { api } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import {
  type ActionCtx,
  type MutationCtx,
  type QueryCtx,
  action,
  mutation,
  query,
} from './_generated/server';

// Google OAuth endpoints
interface _GoogleProfile {
  id: string;
  email: string;
  verified_email?: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  hd?: string; // Hosted domain for Google Workspace users
}

interface _GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
}

/**
 * Exchange Google OAuth authorization code for access token and user profile.
 */
export const exchangeGoogleCode = action({
  args: {
    code: v.string(),
    state: v.string(), // CSRF protection
    redirectUri: v.string(),
  },
  handler: async (ctx, args): Promise<{ profile: _GoogleProfile; success: boolean }> => {
    // Check if Google auth is enabled dynamically
    const authConfig = await _isGoogleAuthEnabledForActions(ctx);
    if (!authConfig.enabled || !authConfig.clientId || !authConfig.clientSecret) {
      throw new ConvexError({
        code: 'FEATURE_DISABLED',
        message: 'Google authentication is currently disabled or not configured',
      });
    }

    const { clientId, clientSecret } = authConfig;

    try {
      // Step 1: Exchange authorization code for access token
      const tokenResponse = await fetch(_GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: args.code,
          grant_type: 'authorization_code',
          redirect_uri: args.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Google token exchange failed:', errorText);
        throw new ConvexError({
          code: 'OAUTH_ERROR',
          message: 'Failed to exchange authorization code for token',
        });
      }

      const tokenData: _GoogleTokenResponse = await tokenResponse.json();

      // Step 2: Use access token to get user profile
      const profileResponse = await fetch(_GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('Google profile fetch failed:', errorText);
        throw new ConvexError({
          code: 'OAUTH_ERROR',
          message: 'Failed to fetch user profile from Google',
        });
      }

      const profile: _GoogleProfile = await profileResponse.json();

      // Validate required profile fields
      if (!profile.id || !profile.email || !profile.name) {
        throw new ConvexError({
          code: 'OAUTH_ERROR',
          message: 'Invalid Google profile data received',
        });
      }

      return { profile, success: true };
    } catch (error) {
      console.error('Google OAuth exchange error:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        code: 'OAUTH_ERROR',
        message: 'Google OAuth authentication failed',
      });
    }
  },
});

/**
 * Creates or updates a Google user and establishes a session.
 */
export const loginWithGoogle = mutation({
  args: {
    profile: v.object({
      id: v.string(),
      email: v.string(),
      verified_email: v.optional(v.boolean()),
      name: v.string(),
      given_name: v.optional(v.string()),
      family_name: v.optional(v.string()),
      picture: v.optional(v.string()),
      locale: v.optional(v.string()),
      hd: v.optional(v.string()),
    }),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if Google auth is enabled dynamically
    const isEnabled = await _isGoogleAuthEnabled(ctx);
    if (!isEnabled) {
      throw new ConvexError({
        code: 'FEATURE_DISABLED',
        message: 'Google authentication is currently disabled or not configured',
      });
    }

    const { profile, sessionId } = args;

    try {
      // Check if user already exists by Google ID
      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_googleId', (q) => q.eq('googleId', profile.id))
        .first();

      const userId: Id<'users'> = existingUser
        ? await (async () => {
            // Update existing user with latest profile information
            if (existingUser.type !== 'google') {
              throw new ConvexError({
                code: 'USER_TYPE_MISMATCH',
                message: 'User exists with different authentication type',
              });
            }

            await ctx.db.patch(existingUser._id, {
              name: profile.name,
              email: profile.email,
              picture: profile.picture,
              google: profile,
            });

            return existingUser._id;
          })()
        : await (async () => {
            // Check if user exists with same email but different auth type
            const existingEmailUser = await ctx.db
              .query('users')
              .withIndex('by_email', (q) => q.eq('email', profile.email))
              .first();

            if (existingEmailUser) {
              throw new ConvexError({
                code: 'EMAIL_ALREADY_EXISTS',
                message:
                  'An account with this email already exists with a different authentication method',
              });
            }

            // Create new Google user
            return await ctx.db.insert('users', {
              type: 'google',
              name: profile.name,
              email: profile.email,
              googleId: profile.id,
              picture: profile.picture,
              google: profile,
              accessLevel: 'user', // Default access level for new Google users
            });
          })();

      // Create or update session (following existing session pattern)
      const existingSession = await ctx.db
        .query('sessions')
        .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
        .first();

      if (existingSession) {
        // Update existing session to link to the Google user
        await ctx.db.patch(existingSession._id, {
          userId: userId,
          authMethod: 'google',
        });
      } else {
        // Create new session
        await ctx.db.insert('sessions', {
          sessionId: sessionId,
          userId: userId,
          createdAt: Date.now(),
          authMethod: 'google',
        });
      }

      return {
        success: true,
        userId,
        userType: 'google' as const,
      };
    } catch (error) {
      console.error('Google login error:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        code: 'LOGIN_ERROR',
        message: 'Failed to complete Google login',
      });
    }
  },
});

/**
 * Retrieves Google user profile information for authenticated Google users.
 */
export const getGoogleProfile = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!session || !session.userId) {
      return null;
    }

    const user = await ctx.db.get(session.userId);

    if (!user || user.type !== 'google') {
      return null;
    }

    return {
      name: user.name,
      email: user.email,
      picture: user.picture,
      googleProfile: user.google,
    };
  },
});

/**
 * Generates Google OAuth authorization URL for frontend redirection.
 */
export const generateGoogleAuthUrl = action({
  args: {
    redirectUri: v.string(),
    state: v.string(), // CSRF protection state
  },
  handler: async (ctx, args) => {
    // Get configuration from database
    const authConfig = await _isGoogleAuthEnabledForActions(ctx);
    if (!authConfig.enabled || !authConfig.clientId) {
      throw new ConvexError({
        code: 'CONFIGURATION_ERROR',
        message: 'Google OAuth is not properly configured',
      });
    }

    const params = new URLSearchParams({
      client_id: authConfig.clientId,
      redirect_uri: args.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: args.state,
      prompt: 'consent', // Always show consent screen
      access_type: 'offline', // For potential refresh token usage
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return { authUrl };
  },
});

/**
 * Internal query to retrieve Google Auth configuration for actions.
 */
export const getGoogleAuthConfigInternal = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('thirdPartyAuthConfig')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();
  },
});

const _GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const _GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

/**
 * Checks if Google Auth is dynamically enabled for mutations and queries.
 */
async function _isGoogleAuthEnabled(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  // Check if login is disabled globally
  if (featureFlags.disableLogin) {
    return false;
  }

  // Check database configuration
  const config = await ctx.db
    .query('thirdPartyAuthConfig')
    .withIndex('by_type', (q) => q.eq('type', 'google'))
    .first();

  // Google Auth is enabled if it's configured, enabled, and has both client ID and secret
  return !!(config?.enabled && config?.clientId && config?.clientSecret);
}

/**
 * Checks if Google Auth is dynamically enabled for actions with configuration details.
 */
async function _isGoogleAuthEnabledForActions(ctx: ActionCtx): Promise<{
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
}> {
  // Check if login is disabled globally
  if (featureFlags.disableLogin) {
    return { enabled: false };
  }

  // Get configuration from database via internal query
  const config = await ctx.runQuery(api.googleAuth.getGoogleAuthConfigInternal);

  if (!config?.enabled || !config?.clientId || !config?.clientSecret) {
    return { enabled: false };
  }

  return {
    enabled: true,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  };
}
