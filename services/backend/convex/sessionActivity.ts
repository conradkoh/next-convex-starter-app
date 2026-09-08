import type { GenericMutationCtx, GenericQueryCtx } from 'convex/server';

import type { DataModel, Doc, Id } from './_generated/dataModel';

/**
 * Single helper module for the `sessionActivity` projection.
 *
 * Rolling-deploy invariant: `sessions.lastActivityAt` remains the legacy
 * compatibility mirror and is dual-written alongside the projection. Reads
 * must use `projection?.lastActivityAt ?? session.lastActivityAt` so the app
 * stays correct while projection rows are missing (new backend is live but
 * the backfill migration has not finished or has failed).
 *
 * Projection updates are max-wins: an older delayed mutation must never
 * overwrite a newer stored timestamp.
 */

// Generic contexts so these helpers work from normal Convex query/mutation
// contexts as well as the `@convex-dev/migrations` `migrateOne` context.
type ActivityQueryCtx = GenericQueryCtx<DataModel>;
type ActivityMutationCtx = GenericMutationCtx<DataModel>;

/**
 * Reads the activity projection row for a session, if present.
 */
export async function getSessionActivity(
  ctx: ActivityQueryCtx | ActivityMutationCtx,
  sessionId: Id<'sessions'>
): Promise<Doc<'sessionActivity'> | null> {
  return await ctx.db
    .query('sessionActivity')
    .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
    .first();
}

/**
 * Inserts the projection row if absent, otherwise patches only when the
 * incoming timestamp is newer (max-wins). Equal/older timestamps are no-ops.
 */
export async function upsertSessionActivity(
  ctx: ActivityMutationCtx,
  sessionId: Id<'sessions'>,
  lastActivityAt: number
): Promise<void> {
  const existing = await getSessionActivity(ctx, sessionId);
  if (!existing) {
    await ctx.db.insert('sessionActivity', { sessionId, lastActivityAt });
    return;
  }
  if (lastActivityAt > existing.lastActivityAt) {
    await ctx.db.patch('sessionActivity', existing._id, { lastActivityAt });
  }
}

/**
 * Deletes the projection row if present. Idempotent: missing rows are a no-op
 * so session deletes never fail when the backfill has not run.
 */
export async function deleteSessionActivity(
  ctx: ActivityMutationCtx,
  sessionId: Id<'sessions'>
): Promise<void> {
  const existing = await getSessionActivity(ctx, sessionId);
  if (existing) {
    await ctx.db.delete('sessionActivity', existing._id);
  }
}
