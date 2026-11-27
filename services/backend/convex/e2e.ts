import { SessionIdArg } from 'convex-helpers/server/sessions';

import { mutation } from './_generated/server';
import { appError } from '../modules/errors/appError';

/**
 * E2E-only seeding mutation — dev tooling, not a real feature.
 *
 * Deliberately outside `convex/system/` because `promoteSessionToSystemAdmin`
 * bootstraps the first system admin for e2e tests and must NOT require
 * `system_admin:access` (env-gated via E2E_SEEDING_ENABLED instead).
 * Consumer: apps/webapp/tests/e2e/support/convex-client.ts
 *
 * Promotes the user bound to the given session to `system_admin` so e2e
 * specs can exercise the admin UI. Gated by E2E_SEEDING_ENABLED (must be "true").
 *
 * Enable the gate for a deployment with:
 *   cd services/backend && npx convex env set E2E_SEEDING_ENABLED true
 *
 * When the gate is off the mutation throws a neutral `FORBIDDEN`
 * ("This action is not available"): the setup instruction must never appear in
 * a message that any caller can read.
 */
export const promoteSessionToSystemAdmin = mutation({
  args: { ...SessionIdArg },
  handler: async (ctx, args) => {
    if (process.env.E2E_SEEDING_ENABLED !== 'true') {
      throw appError('FORBIDDEN', 'This action is not available');
    }

    const session = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!session?.userId) {
      throw appError('NOT_FOUND', 'Session has no user', { resource: 'user' });
    }

    await ctx.db.patch('users', session.userId, {
      accessLevel: 'system_admin',
      roleNames: undefined,
    });

    return { success: true as const };
  },
});
