import type { SessionId } from 'convex-helpers/server/sessions';
import { expect, test } from 'vitest';

import { t } from '../test.setup';
import { api, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';

/**
 * Creates an anonymous user with a session row carrying the given fields.
 * Inserts directly so tests control exact timestamps (no wall-clock reads).
 */
async function seedSession(
  prefix: string,
  opts: {
    userName?: string;
    createdAt?: number;
    lastActivityAt?: number;
    authMethod?: 'anonymous';
  } = {}
): Promise<{ userId: Id<'users'>; sessionDbId: Id<'sessions'>; sessionId: SessionId }> {
  const sessionId = `${prefix}-${Math.random().toString(36).slice(2)}` as SessionId;
  const userId: Id<'users'> = await t.run(async (ctx) => {
    return await ctx.db.insert('users', {
      type: 'anonymous',
      name: opts.userName ?? `TestUser-${Math.random().toString(36).slice(2)}`,
    });
  });
  const sessionDbId: Id<'sessions'> = await t.run(async (ctx) => {
    return await ctx.db.insert('sessions', {
      sessionId,
      userId,
      createdAt: opts.createdAt ?? 1000,
      authMethod: opts.authMethod ?? 'anonymous',
      ...(opts.lastActivityAt !== undefined ? { lastActivityAt: opts.lastActivityAt } : {}),
    });
  });
  return { userId, sessionDbId, sessionId };
}

async function getProjection(sessionDbId: Id<'sessions'>) {
  return await t.run(async (ctx) => {
    return await ctx.db
      .query('sessionActivity')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionDbId))
      .first();
  });
}

test('updateSessionActivity dual-writes legacy mirror and projection', async () => {
  const { sessionDbId, sessionId } = await seedSession('dual-write');

  const result = await t.mutation(api.sessions.updateSessionActivity, { sessionId });
  expect(result.success).toBe(true);

  const session = await t.run(async (ctx) => ctx.db.get('sessions', sessionDbId));
  const projection = await getProjection(sessionDbId);

  expect(session?.lastActivityAt).toBeDefined();
  expect(projection).not.toBeNull();
  // Both values are written in the same mutation from the same timestamp.
  expect(projection?.lastActivityAt).toBe(session?.lastActivityAt);
  expect(projection?.sessionId).toBe(sessionDbId);
});

test('projection updates are max-wins: older activity cannot move time backwards', async () => {
  const { sessionDbId } = await seedSession('max-wins', { lastActivityAt: 5000 });

  // Seed the projection at the legacy value via the newer-timestamp path.
  await t.mutation(internal.sessions.updateSessionDeviceInfo, {
    sessionId: sessionDbId,
    deviceInfo: {},
    lastActivityAt: 5000,
  });
  expect((await getProjection(sessionDbId))?.lastActivityAt).toBe(5000);

  // An older delayed write must move neither the legacy mirror nor the
  // projection backwards (max-wins for both stores).
  await t.mutation(internal.sessions.updateSessionDeviceInfo, {
    sessionId: sessionDbId,
    deviceInfo: {},
    lastActivityAt: 4000,
  });
  const session = await t.run(async (ctx) => ctx.db.get('sessions', sessionDbId));
  expect(session?.lastActivityAt).toBe(5000);
  expect((await getProjection(sessionDbId))?.lastActivityAt).toBe(5000);

  // A newer write advances both.
  await t.mutation(internal.sessions.updateSessionDeviceInfo, {
    sessionId: sessionDbId,
    deviceInfo: {},
    lastActivityAt: 6000,
  });
  const updated = await t.run(async (ctx) => ctx.db.get('sessions', sessionDbId));
  expect(updated?.lastActivityAt).toBe(6000);
  expect((await getProjection(sessionDbId))?.lastActivityAt).toBe(6000);
});

test('missing-projection delayed write cannot seed a stale projection', async () => {
  // Rolling-deploy race: session has legacy `5000` with no projection row
  // (backfill not yet run), and an older delayed write arrives with `4000`.
  // Neither stored value may become `4000`.
  const { userId, sessionDbId } = await seedSession('missing-proj-race', {
    lastActivityAt: 5000,
  });
  expect(await getProjection(sessionDbId)).toBeNull();

  const deviceInfo = { browser: 'test-browser' };
  await t.mutation(internal.sessions.updateSessionDeviceInfo, {
    sessionId: sessionDbId,
    deviceInfo,
    lastActivityAt: 4000,
  });

  const session = await t.run(async (ctx) => ctx.db.get('sessions', sessionDbId));
  expect(session?.lastActivityAt).toBe(5000);
  // Device-info semantics are unchanged: the supplied info is still written.
  expect(session?.deviceInfo).toMatchObject(deviceInfo);
  expect((await getProjection(sessionDbId))?.lastActivityAt).toBe(5000);

  const currentSessionId =
    `${'missing-proj-race'}-${Math.random().toString(36).slice(2)}` as SessionId;
  const currentDbId: Id<'sessions'> = await t.run(async (ctx) => {
    return await ctx.db.insert('sessions', {
      sessionId: currentSessionId,
      userId,
      createdAt: 1000,
      authMethod: 'anonymous',
    });
  });
  void currentDbId;
  const result = await t.query(api.sessions.listMySessions, {
    sessionId: currentSessionId,
  });
  expect(result.success).toBe(true);
  expect(result.sessions?.find((s) => s._id === sessionDbId)?.lastActivityAt).toBe(5000);
});

test('listMySessions returns the newer timestamp when projection and legacy diverge', async () => {
  // Legacy-newer direction: an old writer advanced the mirror after the
  // projection row existed. Reads must reconcile with max-wins.
  const current = await seedSession('legacy-newer', { createdAt: 1000, lastActivityAt: 1000 });
  const legacyNewerDbId: Id<'sessions'> = await t.run(async (ctx) => {
    return await ctx.db.insert('sessions', {
      sessionId: `legacy-newer-second-${Math.random().toString(36).slice(2)}`,
      userId: current.userId,
      createdAt: 1000,
      authMethod: 'anonymous',
      lastActivityAt: 9000,
    });
  });
  await t.run(async (ctx) => {
    await ctx.db.insert('sessionActivity', { sessionId: legacyNewerDbId, lastActivityAt: 5000 });
  });

  const result = await t.query(api.sessions.listMySessions, { sessionId: current.sessionId });
  expect(result.success).toBe(true);
  expect(result.sessions?.find((s) => s._id === legacyNewerDbId)?.lastActivityAt).toBe(9000);
});

test('listMySessions prefers the projection timestamp when present', async () => {
  const current = await seedSession('proj-read', { createdAt: 1000, lastActivityAt: 2000 });
  const other = await seedSession('proj-read-other', { createdAt: 1000 });
  // Same user, second session row with a legacy value plus a newer projection.
  const otherDbId: Id<'sessions'> = await t.run(async (ctx) => {
    return await ctx.db.insert('sessions', {
      sessionId: `proj-read-second-${Math.random().toString(36).slice(2)}`,
      userId: current.userId,
      createdAt: 1000,
      authMethod: 'anonymous',
      lastActivityAt: 3000,
    });
  });
  await t.run(async (ctx) => {
    await ctx.db.insert('sessionActivity', { sessionId: otherDbId, lastActivityAt: 9000 });
  });
  void other;

  const result = await t.query(api.sessions.listMySessions, { sessionId: current.sessionId });
  expect(result.success).toBe(true);
  const listed = result.sessions?.find((s) => s._id === otherDbId);
  expect(listed?.lastActivityAt).toBe(9000);
});

test('partial migration state: legacy timestamp is returned and sorts correctly without a projection row', async () => {
  // Regression test for deploy-before-backfill: the new backend is live but
  // `sessionActivity` rows do not exist yet. Reads must fall back to the
  // legacy mirror, never to bare `createdAt`.
  const current = await seedSession('partial', { createdAt: 1000, lastActivityAt: 1000 });
  const legacyOnlyDbId: Id<'sessions'> = await t.run(async (ctx) => {
    return await ctx.db.insert('sessions', {
      sessionId: `partial-legacy-${Math.random().toString(36).slice(2)}`,
      userId: current.userId,
      createdAt: 1000,
      authMethod: 'anonymous',
      lastActivityAt: 4000,
    });
  });
  const createdOnlyDbId: Id<'sessions'> = await t.run(async (ctx) => {
    return await ctx.db.insert('sessions', {
      sessionId: `partial-created-${Math.random().toString(36).slice(2)}`,
      userId: current.userId,
      createdAt: 1500,
      authMethod: 'anonymous',
    });
  });
  const projectedDbId: Id<'sessions'> = await t.run(async (ctx) => {
    return await ctx.db.insert('sessions', {
      sessionId: `partial-projected-${Math.random().toString(36).slice(2)}`,
      userId: current.userId,
      createdAt: 1000,
      authMethod: 'anonymous',
      lastActivityAt: 2000,
    });
  });
  await t.run(async (ctx) => {
    await ctx.db.insert('sessionActivity', { sessionId: projectedDbId, lastActivityAt: 5000 });
  });

  // Sanity: no projection rows for the legacy-only and created-only sessions.
  expect(await getProjection(legacyOnlyDbId)).toBeNull();
  expect(await getProjection(createdOnlyDbId)).toBeNull();

  const result = await t.query(api.sessions.listMySessions, { sessionId: current.sessionId });
  expect(result.success).toBe(true);
  const sessions = result.sessions ?? [];

  // Legacy value is surfaced when the projection is missing.
  expect(sessions.find((s) => s._id === legacyOnlyDbId)?.lastActivityAt).toBe(4000);
  // `createdAt` remains the final fallback only when both are undefined.
  expect(sessions.find((s) => s._id === createdOnlyDbId)?.lastActivityAt).toBeUndefined();

  // Sort order after the current session: projected 5000 > legacy 4000 >
  // created-only (effective 1500).
  const nonCurrent = sessions.filter((s) => !s.isCurrent).map((s) => s._id);
  expect(nonCurrent).toEqual([projectedDbId, legacyOnlyDbId, createdOnlyDbId]);
});

test('revokeSession removes the projection row', async () => {
  const current = await seedSession('revoke', { lastActivityAt: 2000 });
  const victim = await seedSession('revoke-victim', { lastActivityAt: 2000 });
  const victimDbId: Id<'sessions'> = await t.run(async (ctx) => {
    return await ctx.db.insert('sessions', {
      sessionId: `revoke-victim2-${Math.random().toString(36).slice(2)}`,
      userId: current.userId,
      createdAt: 1000,
      authMethod: 'anonymous',
      lastActivityAt: 3000,
    });
  });
  void victim;
  await t.mutation(internal.sessions.updateSessionDeviceInfo, {
    sessionId: victimDbId,
    deviceInfo: {},
    lastActivityAt: 3000,
  });
  expect(await getProjection(victimDbId)).not.toBeNull();

  const result = await t.mutation(api.sessions.revokeSession, {
    sessionIdToRevoke: victimDbId,
    sessionId: current.sessionId,
  });
  expect(result.success).toBe(true);
  expect(await getProjection(victimDbId)).toBeNull();
  expect(await t.run(async (ctx) => ctx.db.get('sessions', victimDbId))).toBeNull();
});

test('revokeAllOtherSessions removes projection rows of revoked sessions', async () => {
  const current = await seedSession('revoke-all', { lastActivityAt: 2000 });
  const extraDbId: Id<'sessions'> = await t.run(async (ctx) => {
    return await ctx.db.insert('sessions', {
      sessionId: `revoke-all-extra-${Math.random().toString(36).slice(2)}`,
      userId: current.userId,
      createdAt: 1000,
      authMethod: 'anonymous',
      lastActivityAt: 3000,
    });
  });
  await t.mutation(internal.sessions.updateSessionDeviceInfo, {
    sessionId: extraDbId,
    deviceInfo: {},
    lastActivityAt: 3000,
  });
  expect(await getProjection(extraDbId)).not.toBeNull();

  const result = await t.mutation(api.sessions.revokeAllOtherSessions, {
    sessionId: current.sessionId,
  });
  expect(result.success).toBe(true);
  expect(result.revokedCount).toBe(1);
  expect(await getProjection(extraDbId)).toBeNull();
});

test('logout removes the projection row', async () => {
  const sessionId = `logout-${Math.random().toString(36).slice(2)}` as SessionId;
  await t.mutation(api.auth.loginAnon, { sessionId });
  const session = await t.run(async (ctx) => {
    return await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .first();
  });
  if (!session) throw new Error('expected session to exist after loginAnon');

  await t.mutation(api.sessions.updateSessionActivity, { sessionId });
  expect(await getProjection(session._id)).not.toBeNull();

  const result = await t.mutation(api.auth.logout, { sessionId });
  expect(result.success).toBe(true);
  expect(await getProjection(session._id)).toBeNull();
});

// NOTE: `backfillSessionActivity` is intentionally not invoked here.
// The `@convex-dev/migrations` runner needs its component registered
// (`t.registerComponent`), which convex-test does not set up for this repo.
// The migration body is a straightforward create-if-absent / repair-if-newer
// projection write (see `convex/migrations.ts`), and its safety contract is
// covered above: the partial-migration-state test proves reads stay correct
// while projection rows are missing, and the max-wins test proves the shared
// upsert semantics the backfill relies on.
