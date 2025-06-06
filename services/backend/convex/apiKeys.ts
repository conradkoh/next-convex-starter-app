import { SessionIdArg } from 'convex-helpers/server/sessions';
import { v } from 'convex/values';
import { getAuthUser } from '../modules/auth/getAuthUser';
import { mutation, query } from './_generated/server';

// Set or update user's API key for a provider
export const setUserApiKey = mutation({
  args: {
    provider: v.union(v.literal('openrouter')),
    apiKey: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get authenticated user - this will throw if not authenticated
    const user = await getAuthUser(ctx, args);

    // Check if user already has an API key for this provider
    const existingKey = await ctx.db
      .query('userApiKeys')
      .withIndex('by_user_provider', (q) => q.eq('userId', user._id).eq('provider', args.provider))
      .first();

    if (existingKey) {
      // Update existing API key
      await ctx.db.patch(existingKey._id, {
        apiKey: args.apiKey,
        updatedAt: now,
      });
      return existingKey._id;
    }

    // Create new API key record
    const keyId = await ctx.db.insert('userApiKeys', {
      userId: user._id,
      provider: args.provider,
      apiKey: args.apiKey,
      createdAt: now,
      updatedAt: now,
    });
    return keyId;
  },
});

// Get user's API key for a provider
export const getUserApiKey = query({
  args: {
    provider: v.union(v.literal('openrouter')),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get authenticated user - this will throw if not authenticated
    const user = await getAuthUser(ctx, args);

    const apiKey = await ctx.db
      .query('userApiKeys')
      .withIndex('by_user_provider', (q) => q.eq('userId', user._id).eq('provider', args.provider))
      .first();

    if (!apiKey) {
      return null;
    }

    return {
      _id: apiKey._id,
      provider: apiKey.provider,
      hasKey: true, // Don't return the actual key for security
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    };
  },
});

// Get the actual API key (for internal use by HTTP endpoints)
export const getDecryptedApiKey = query({
  args: {
    provider: v.union(v.literal('openrouter')),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get authenticated user - this will throw if not authenticated
    const user = await getAuthUser(ctx, args);

    const apiKey = await ctx.db
      .query('userApiKeys')
      .withIndex('by_user_provider', (q) => q.eq('userId', user._id).eq('provider', args.provider))
      .first();

    if (!apiKey) {
      return null;
    }

    return apiKey.apiKey;
  },
});

// Delete user's API key for a provider
export const deleteUserApiKey = mutation({
  args: {
    provider: v.union(v.literal('openrouter')),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get authenticated user - this will throw if not authenticated
    const user = await getAuthUser(ctx, args);

    const apiKey = await ctx.db
      .query('userApiKeys')
      .withIndex('by_user_provider', (q) => q.eq('userId', user._id).eq('provider', args.provider))
      .first();

    if (!apiKey) {
      throw new Error('API key not found');
    }

    await ctx.db.delete(apiKey._id);
    return { success: true };
  },
});
