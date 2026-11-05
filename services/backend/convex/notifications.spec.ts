import type { SessionId } from 'convex-helpers/server/sessions';
import { expect, test } from 'vitest';

import { t } from '../test.setup';
import { api, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';

async function createSession(
  prefix: string
): Promise<{ sessionId: SessionId; userId: Id<'users'> }> {
  const sessionId = `${prefix}-${Math.random().toString(36).slice(2)}` as SessionId;
  const result = await t.mutation(api.auth.loginAnon, { sessionId });
  if (!result.userId) throw new Error('expected loginAnon to create a user');
  return { sessionId, userId: result.userId };
}

async function getStoredSettings(userId: Id<'users'>) {
  return await t.run(async (ctx) => {
    return await ctx.db
      .query('userNotificationSettings')
      .withIndex('by_user_provider', (q) => q.eq('userId', userId).eq('provider', 'telegram'))
      .first();
  });
}

test('authenticated users can save and read redacted Telegram settings', async () => {
  const { sessionId, userId } = await createSession('notifications-save');

  const saved = await t.mutation(api.notifications.saveSettings, {
    sessionId,
    channelId: ' @next_convex_updates ',
    botToken: 'secret-bot-token',
    enabled: true,
  });

  expect(saved).toEqual({
    provider: 'telegram',
    enabled: true,
    channelId: '@next_convex_updates',
    hasBotToken: true,
  });

  const settings = await t.query(api.notifications.getSettings, { sessionId });
  expect(settings).toEqual(saved);
  expect(JSON.stringify(settings)).not.toContain('secret-bot-token');
  expect((await getStoredSettings(userId))?.botToken).toBe('secret-bot-token');
});

test('blank token on update preserves the stored token', async () => {
  const { sessionId, userId } = await createSession('notifications-preserve-token');

  await t.mutation(api.notifications.saveSettings, {
    sessionId,
    channelId: '-1001234567890',
    botToken: 'original-token',
    enabled: false,
  });
  const updated = await t.mutation(api.notifications.saveSettings, {
    sessionId,
    channelId: ' @renamed_channel ',
    botToken: '   ',
    enabled: true,
  });

  expect(updated.channelId).toBe('@renamed_channel');
  expect(updated.enabled).toBe(true);
  expect(updated.hasBotToken).toBe(true);
  expect((await getStoredSettings(userId))?.botToken).toBe('original-token');
});

test('new configurations require non-empty channel IDs and bot tokens', async () => {
  const { sessionId } = await createSession('notifications-validation');

  await expect(
    t.mutation(api.notifications.saveSettings, {
      sessionId,
      channelId: '   ',
      botToken: 'token',
      enabled: true,
    })
  ).rejects.toThrow('channel ID');

  await expect(
    t.mutation(api.notifications.saveSettings, {
      sessionId,
      channelId: '@channel',
      botToken: '   ',
      enabled: true,
    })
  ).rejects.toThrow('bot token');
});

test('notification settings are isolated to the authenticated user', async () => {
  const first = await createSession('notifications-owner');
  const second = await createSession('notifications-other');

  await t.mutation(api.notifications.saveSettings, {
    sessionId: first.sessionId,
    channelId: '@first_user',
    botToken: 'first-token',
    enabled: true,
  });

  expect(await t.query(api.notifications.getSettings, { sessionId: second.sessionId })).toBeNull();

  await t.mutation(api.notifications.saveSettings, {
    sessionId: second.sessionId,
    channelId: '@second_user',
    botToken: 'second-token',
    enabled: false,
  });
  expect((await getStoredSettings(first.userId))?.channelId).toBe('@first_user');
  expect((await getStoredSettings(second.userId))?.channelId).toBe('@second_user');

  const removedBySecondUser = await t.mutation(api.notifications.removeSettings, {
    sessionId: second.sessionId,
  });
  expect(removedBySecondUser.removed).toBe(true);
  expect(await getStoredSettings(first.userId)).not.toBeNull();
});

test('remove clears only the current user configuration', async () => {
  const { sessionId, userId } = await createSession('notifications-remove');
  await t.mutation(api.notifications.saveSettings, {
    sessionId,
    channelId: '@remove_me',
    botToken: 'token-to-remove',
    enabled: true,
  });

  const result = await t.mutation(api.notifications.removeSettings, { sessionId });
  expect(result).toEqual({ removed: true });
  expect(await t.query(api.notifications.getSettings, { sessionId })).toBeNull();
  expect(await getStoredSettings(userId)).toBeNull();
});

test('internal notification trigger schedules delivery without a public session', async () => {
  const { userId } = await createSession('notifications-trigger');

  await expect(
    t.mutation(internal.notifications.triggerSystemNotification, {
      userId,
      title: 'Build completed',
      body: 'The production build finished successfully.',
    })
  ).resolves.toEqual({ scheduled: true });

  await expect(
    t.mutation(internal.notifications.triggerSystemNotification, {
      userId,
      title: '',
      body: 'invalid',
    })
  ).resolves.toEqual({ scheduled: false, reason: 'invalid_message' });
});

test('recordTestResult updates only safe test metadata', async () => {
  const { sessionId, userId } = await createSession('notifications-test-result');
  await t.mutation(api.notifications.saveSettings, {
    sessionId,
    channelId: '@test_result',
    botToken: 'private-token',
    enabled: true,
  });
  const before = await getStoredSettings(userId);
  if (!before) throw new Error('expected settings to exist');

  await t.mutation(internal.notifications.recordTestResult, {
    userId,
    succeeded: false,
  });

  const after = await getStoredSettings(userId);
  expect(after?.botToken).toBe(before.botToken);
  expect(after?.channelId).toBe(before.channelId);
  expect(after?.enabled).toBe(before.enabled);
  expect(after?.lastTestedAt).toBeTypeOf('number');
  expect(after?.lastTestSucceeded).toBe(false);
});
