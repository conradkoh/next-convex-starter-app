import { SessionIdArg } from 'convex-helpers/server/sessions';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';
import { featureFlags } from '../config/featureFlags';
import type { AuthState } from '../modules/auth/types/AuthState';
import { api } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { type ActionCtx, action, mutation, query } from './_generated/server';

// Google OAuth endpoints
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

// Google profile interface based on Google's userinfo API response
interface GoogleProfile {
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

// OAuth token response interface
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
}

/**
 * Exchange Google OAuth authorization code for access token and user profile.
 * This action handles the OAuth callback flow.
 */
export const exchangeGoogleCode = action({
  args: {
    code: v.string(),
    state: v.string(), // CSRF protection
    redirectUri: v.string(),
  },
  handler: async (ctx, args): Promise<{ profile: GoogleProfile; success: boolean }> => {
    // Check if Google auth is enabled
    if (featureFlags.disableLogin || !featureFlags.enableGoogleAuth) {
      throw new ConvexError({
        code: 'FEATURE_DISABLED',
        message: 'Google authentication is currently disabled',
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new ConvexError({
        code: 'CONFIGURATION_ERROR',
        message: 'Google OAuth credentials not configured',
      });
    }

    try {
      // Step 1: Exchange authorization code for access token
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
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

      const tokenData: GoogleTokenResponse = await tokenResponse.json();

      // Step 2: Use access token to get user profile
      const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
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

      const profile: GoogleProfile = await profileResponse.json();

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
 * Create or update a Google user and establish a session.
 * This mutation integrates with the existing session system.
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
    // Check if Google auth is enabled
    if (featureFlags.disableLogin || !featureFlags.enableGoogleAuth) {
      throw new ConvexError({
        code: 'FEATURE_DISABLED',
        message: 'Google authentication is currently disabled',
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
        });
      } else {
        // Create new session
        await ctx.db.insert('sessions', {
          sessionId: sessionId,
          userId: userId,
          createdAt: Date.now(),
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
 * Get Google user profile information for authenticated Google users.
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
 * Generate Google OAuth authorization URL.
 * This is used by the frontend to redirect users to Google for authentication.
 */
export const generateGoogleAuthUrl = action({
  args: {
    redirectUri: v.string(),
    state: v.string(), // CSRF protection state
  },
  handler: async (ctx, args) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new ConvexError({
        code: 'CONFIGURATION_ERROR',
        message: 'Google OAuth client ID not configured',
      });
    }

    const params = new URLSearchParams({
      client_id: clientId,
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
