import { query } from './_generated/server';

export const get = query({
  args: {},
  handler: async (ctx, args) => {
    const appInfo = await ctx.db.query('appInfo').first();

    // Get Google Auth configuration from database
    const googleAuthConfig = await ctx.db
      .query('thirdPartyAuthConfig')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();

    // Compute configuration status
    const isConfiguredInDatabase = !!(googleAuthConfig?.clientId && googleAuthConfig?.clientSecret);
    const isEnabled = googleAuthConfig?.enabled || false;

    // Google Auth is available if it's configured AND enabled
    const googleAuthAvailable = isConfiguredInDatabase && isEnabled;

    return {
      version: appInfo?.latestVersion || '1.0.0',
      googleAuthAvailable,
      googleAuthDetails: {
        isConfiguredInDatabase,
        isEnabled,
        hasClientId: !!googleAuthConfig?.clientId,
        hasClientSecret: !!googleAuthConfig?.clientSecret,
      },
    };
  },
});
