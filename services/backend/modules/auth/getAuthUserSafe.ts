import type { SessionId } from 'convex-helpers/server/sessions';
import type { Doc } from '../../convex/_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../../convex/_generated/server';
import type { ChatResult } from '../chat/types/ChatResult';
import { success } from '../common/types/Result';
import { authError } from './types/AuthError';

export const getAuthUserSafe = async (
  ctx: QueryCtx | MutationCtx,
  args: { sessionId: SessionId }
): Promise<ChatResult<Doc<'users'>>> => {
  try {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!session) {
      return authError('session_not_found');
    }

    const user = await ctx.db.get(session.userId);

    if (!user) {
      return authError('user_not_found');
    }

    return success(user);
  } catch (error) {
    return authError('session_not_found');
  }
};
