import { v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';

import type { Doc, Id } from './_generated/dataModel';
import { internalMutation, mutation, query } from './_generated/server';
import {
  deleteSessionActivity,
  getSessionActivity,
  upsertSessionActivity,
} from './sessionActivity';

/**
 * Device info for session tracking.
 */
export interface DeviceInfo {
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
}

/**
 * Session information returned to the frontend.
 */
export interface SessionInfo {
  _id: Id<'sessions'>;
  createdAt: number;
  lastActivityAt?: number;
  authMethod?: string;
  deviceInfo?: DeviceInfo;
  isCurrent: boolean;
}

/**
 * Lists all sessions for the current authenticated user.
 */
export const listMySessions = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; sessions?: SessionInfo[]; reason?: string }> => {
    // Get the current session and user
    const currentSession = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!currentSession || !currentSession.userId) {
      return { success: false, reason: 'not_authenticated' };
    }

    // Get all sessions for this user
    const allSessions = await ctx.db
      .query('sessions')
      .withIndex('by_userId', (q) => q.eq('userId', currentSession.userId))
      .collect();

    // Map to session info, marking the current session.
    // Rolling-deploy read contract: reconcile the `sessionActivity`
    // projection and the legacy `sessions.lastActivityAt` mirror by taking
    // the newer defined timestamp (max-wins), so reads stay correct if the
    // two stores temporarily diverge (e.g. an old writer advanced the mirror
    // after a projection row exists). Returns `undefined` when both are
    // absent; `createdAt` remains sort-only, never the returned value.
    const sessions: SessionInfo[] = [];
    for (const session of allSessions) {
      const activity = await getSessionActivity(ctx, session._id);
      const projectionTime = activity?.lastActivityAt;
      const legacyTime = session.lastActivityAt;
      const lastActivityAt =
        projectionTime === undefined
          ? legacyTime
          : legacyTime === undefined
            ? projectionTime
            : Math.max(projectionTime, legacyTime);
      sessions.push({
        _id: session._id,
        createdAt: session.createdAt,
        lastActivityAt,
        authMethod: session.authMethod,
        deviceInfo: session.deviceInfo,
        isCurrent: session.sessionId === args.sessionId,
      });
    }

    // Sort by last activity (most recent first), with current session at top
    sessions.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      const aTime = a.lastActivityAt ?? a.createdAt;
      const bTime = b.lastActivityAt ?? b.createdAt;
      return bTime - aTime;
    });

    return { success: true, sessions };
  },
});

/**
 * Revokes (deletes) a specific session for the current user.
 * Cannot revoke the current session - use logout instead.
 */
export const revokeSession = mutation({
  args: {
    sessionIdToRevoke: v.id('sessions'),
    ...SessionIdArg,
  },
  handler: async (ctx, args): Promise<{ success: boolean; reason?: string }> => {
    // Get the current session and user
    const currentSession = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!currentSession || !currentSession.userId) {
      return { success: false, reason: 'not_authenticated' };
    }

    // Get the session to revoke
    const sessionToRevoke = await ctx.db.get('sessions', args.sessionIdToRevoke);

    if (!sessionToRevoke) {
      return { success: false, reason: 'session_not_found' };
    }

    // Verify the session belongs to the current user
    if (sessionToRevoke.userId?.toString() !== currentSession.userId.toString()) {
      return { success: false, reason: 'unauthorized' };
    }

    // Prevent revoking the current session
    if (sessionToRevoke.sessionId === args.sessionId) {
      return { success: false, reason: 'cannot_revoke_current_session' };
    }

    // Delete the projection row alongside the parent session so revoke
    // never orphans projection rows. Deletion is idempotent.
    await deleteSessionActivity(ctx, args.sessionIdToRevoke);
    await ctx.db.delete('sessions', args.sessionIdToRevoke);

    return { success: true };
  },
});

/**
 * Revokes all sessions for the current user except the current one.
 */
export const revokeAllOtherSessions = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; revokedCount?: number; reason?: string }> => {
    // Get the current session and user
    const currentSession = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!currentSession || !currentSession.userId) {
      return { success: false, reason: 'not_authenticated' };
    }

    // Get all other sessions for this user
    const otherSessions = await ctx.db
      .query('sessions')
      .withIndex('by_userId', (q) => q.eq('userId', currentSession.userId))
      .filter((q) => q.neq(q.field('sessionId'), args.sessionId))
      .collect();

    // Delete all other sessions
    let revokedCount = 0;
    for (const session of otherSessions) {
      await deleteSessionActivity(ctx, session._id);
      await ctx.db.delete('sessions', session._id);
      revokedCount++;
    }

    return { success: true, revokedCount };
  },
});

/**
 * Updates the device info and last activity timestamp for a session.
 * Called when the frontend detects activity or has device info to report.
 */
export const updateSessionActivity = mutation({
  args: {
    deviceInfo: v.optional(
      v.object({
        userAgent: v.optional(v.string()),
        browser: v.optional(v.string()),
        os: v.optional(v.string()),
        device: v.optional(v.string()),
      })
    ),
    ...SessionIdArg,
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    // Get the current session
    const currentSession = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!currentSession) {
      return { success: false };
    }

    const now = Date.now();
    // Max-wins for the legacy mirror: never move `lastActivityAt` backwards.
    const lastActivityAt = Math.max(currentSession.lastActivityAt ?? now, now);
    const updates: Partial<Doc<'sessions'>> = {
      lastActivityAt,
    };

    // Only update device info if provided and not already set
    if (args.deviceInfo && !currentSession.deviceInfo) {
      updates.deviceInfo = args.deviceInfo;
    }

    await ctx.db.patch('sessions', currentSession._id, updates);
    // Dual-write the projection so high-frequency reads stay off the parent.
    await upsertSessionActivity(ctx, currentSession._id, lastActivityAt);

    return { success: true };
  },
});

/**
 * Internal mutation to update session with device info during login.
 */
export const updateSessionDeviceInfo = internalMutation({
  args: {
    sessionId: v.id('sessions'),
    deviceInfo: v.object({
      userAgent: v.optional(v.string()),
      browser: v.optional(v.string()),
      os: v.optional(v.string()),
      device: v.optional(v.string()),
    }),
    lastActivityAt: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    // Max-wins for both stores: a delayed older write must neither regress
    // the legacy mirror nor seed the projection with a stale value when the
    // projection row does not exist yet (deploy-before-migrate). Device-info
    // semantics are unchanged: the supplied device info is always written.
    const session = await ctx.db.get('sessions', args.sessionId);
    const lastActivityAt = Math.max(
      session?.lastActivityAt ?? args.lastActivityAt,
      args.lastActivityAt
    );
    await ctx.db.patch('sessions', args.sessionId, {
      deviceInfo: args.deviceInfo,
      lastActivityAt,
    });
    // Dual-write the projection (max-wins guards out-of-order delivery).
    await upsertSessionActivity(ctx, args.sessionId, lastActivityAt);
  },
});
