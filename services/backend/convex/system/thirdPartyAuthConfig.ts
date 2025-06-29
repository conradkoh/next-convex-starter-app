import { SessionIdArg } from 'convex-helpers/server/sessions';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';
import { isSystemAdmin } from '../../modules/auth/accessControl';
import { getAuthUserOptional } from '../../modules/auth/getAuthUser';
import type { Id } from '../_generated/dataModel';
import { mutation, query } from '../_generated/server';

/**
 * SYSTEM ADMIN ONLY: Third-Party Auth Configuration Management
 *
 * All functions in this module require system administrator access.
 * These functions are used to configure and manage third-party OAuth settings.
 *
 * Security Note: Every function in this module MUST verify system admin access.
 */

/**
 * Configuration object for Google Auth settings.
 */
export interface GoogleAuthConfigData {
  type: 'google';
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  hasClientSecret: boolean;
  isConfigured: boolean;
  redirectUris: string[];
  configuredBy: Id<'users'>;
  configuredAt: number;
}

/**
 * SYSTEM ADMIN ONLY: Get the current Google Auth configuration.
 * Returns null if no configuration exists.
 */
export const getGoogleAuthConfig = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args): Promise<GoogleAuthConfigData | null> => {
    // Verify system admin access
    const user = await getAuthUserOptional(ctx, args);
    if (!user || !isSystemAdmin(user)) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Only system administrators can view Google Auth configuration',
      });
    }

    // Get the configuration for Google auth
    const config = await ctx.db
      .query('thirdPartyAuthConfig')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();

    if (!config) {
      return null;
    }

    // Compute derived values
    const hasClientSecret = !!config.clientSecret;
    const isConfigured = !!(config.clientId && config.clientSecret);

    return {
      type: config.type,
      enabled: config.enabled,
      clientId: config.clientId,
      clientSecret: undefined, // Never return the secret
      hasClientSecret,
      isConfigured,
      redirectUris: config.redirectUris,
      configuredBy: config.configuredBy,
      configuredAt: config.configuredAt,
    };
  },
});

/**
 * SYSTEM ADMIN ONLY: Update Google Auth configuration.
 * Only system administrators can update this configuration.
 */
export const updateGoogleAuthConfig = mutation({
  args: {
    enabled: v.boolean(),
    clientId: v.string(),
    clientSecret: v.string(),
    redirectUris: v.array(v.string()),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Verify system admin access
    const user = await getAuthUserOptional(ctx, args);
    if (!user) {
      throw new ConvexError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to configure Google Auth',
      });
    }

    if (!isSystemAdmin(user)) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Only system administrators can configure Google Auth',
      });
    }

    // Check if configuration already exists
    const existingConfig = await ctx.db
      .query('thirdPartyAuthConfig')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();

    // Validate input
    if (!args.clientId.trim()) {
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Client ID is required',
      });
    }

    const hasExistingSecret = existingConfig && !!existingConfig.clientSecret;

    if (!hasExistingSecret && !args.clientSecret.trim()) {
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Client Secret is required for new configuration',
      });
    }

    // Validate redirect URIs
    for (const uri of args.redirectUris) {
      try {
        new URL(uri);
      } catch {
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: `Invalid redirect URI: ${uri}`,
        });
      }
    }

    const now = Date.now();

    // Determine which client secret to use
    const clientSecretToUse = args.clientSecret.trim() || existingConfig?.clientSecret || '';

    const configData = {
      type: 'google' as const,
      enabled: args.enabled,
      clientId: args.clientId.trim(),
      clientSecret: clientSecretToUse,
      redirectUris: args.redirectUris,
      configuredBy: user._id,
      configuredAt: now,
    };

    if (existingConfig) {
      // Update existing configuration
      await ctx.db.patch(existingConfig._id, configData);
    } else {
      // Create new configuration
      await ctx.db.insert('thirdPartyAuthConfig', configData);
    }

    return {
      success: true,
      message: 'Google Auth configuration updated successfully',
    };
  },
});

/**
 * SYSTEM ADMIN ONLY: Enable or disable Google Auth without changing other configuration.
 * This allows for immediate enable/disable without requiring full configuration.
 */
export const toggleGoogleAuthEnabled = mutation({
  args: {
    enabled: v.boolean(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Verify system admin access
    const user = await getAuthUserOptional(ctx, args);
    if (!user) {
      throw new ConvexError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to toggle Google Auth',
      });
    }

    if (!isSystemAdmin(user)) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Only system administrators can toggle Google Auth',
      });
    }

    const now = Date.now();

    // Check if configuration already exists
    const existingConfig = await ctx.db
      .query('thirdPartyAuthConfig')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();

    if (existingConfig) {
      // Update existing configuration
      await ctx.db.patch(existingConfig._id, {
        enabled: args.enabled,
        configuredAt: now,
      });
    } else {
      // Create minimal configuration with enabled flag
      await ctx.db.insert('thirdPartyAuthConfig', {
        type: 'google' as const,
        enabled: args.enabled,
        clientId: '',
        clientSecret: '',
        redirectUris: [],
        configuredBy: user._id,
        configuredAt: now,
      });
    }

    return {
      success: true,
      message: `Google Auth ${args.enabled ? 'enabled' : 'disabled'} successfully`,
    };
  },
});

/**
 * SYSTEM ADMIN ONLY: Test Google Auth configuration by verifying OAuth setup.
 * Only system administrators can test the configuration.
 */
export const testGoogleAuthConfig = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Verify system admin access
    const user = await getAuthUserOptional(ctx, args);
    if (!user) {
      throw new ConvexError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to test Google Auth configuration',
      });
    }

    if (!isSystemAdmin(user)) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Only system administrators can test Google Auth configuration',
      });
    }

    // Get configuration
    const config = await ctx.db
      .query('thirdPartyAuthConfig')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();

    if (!config) {
      return {
        success: false,
        message: 'Google Auth configuration not found',
      };
    }

    // Check configuration validity regardless of enabled status
    const issues: string[] = [];

    if (!config.clientId) {
      issues.push('Missing Client ID');
    }

    if (!config.clientSecret) {
      issues.push('Missing Client Secret');
    }

    if (config.redirectUris.length === 0) {
      issues.push('No redirect URIs configured');
    }

    const isConfigValid = issues.length === 0;

    if (!isConfigValid) {
      return {
        success: false,
        message: `Configuration is incomplete: ${issues.join(', ')}`,
        details: {
          enabled: config.enabled,
          hasClientId: !!config.clientId,
          hasClientSecret: !!config.clientSecret,
          redirectUrisCount: config.redirectUris.length,
          issues,
        },
      };
    }

    // Configuration is valid
    const statusMessage = config.enabled
      ? 'Google Auth configuration is valid and enabled'
      : 'Google Auth configuration is valid but currently disabled';

    return {
      success: true,
      message: statusMessage,
      details: {
        enabled: config.enabled,
        hasClientId: !!config.clientId,
        hasClientSecret: !!config.clientSecret,
        redirectUrisCount: config.redirectUris.length,
        configurationStatus: 'valid',
      },
    };
  },
});

/**
 * SYSTEM ADMIN ONLY: Reset Google Auth configuration.
 * Only system administrators can reset the configuration.
 */
export const resetGoogleAuthConfig = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Verify system admin access
    const user = await getAuthUserOptional(ctx, args);
    if (!user) {
      throw new ConvexError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to reset Google Auth configuration',
      });
    }

    if (!isSystemAdmin(user)) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Only system administrators can reset Google Auth configuration',
      });
    }

    // Find and delete existing configuration
    const existingConfig = await ctx.db
      .query('thirdPartyAuthConfig')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();

    if (existingConfig) {
      await ctx.db.delete(existingConfig._id);
    }

    return {
      success: true,
      message: 'Google Auth configuration has been reset',
    };
  },
});
