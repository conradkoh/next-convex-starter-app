import { ConvexError, v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';

import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { requireAuthUserId } from '../modules/auth/session';

export const NOTIFICATION_TITLE_MAX_LENGTH = 120;
export const NOTIFICATION_BODY_MAX_LENGTH = 4096;

export type NotificationProvider = 'telegram';

export type NotificationSettings = {
  provider: NotificationProvider;
  enabled: boolean;
  channelId: string;
  hasBotToken: boolean;
  lastTestedAt?: number;
  lastTestSucceeded?: boolean;
};

export type NotificationDeliveryResult =
  | { sent: true }
  | {
      sent: false;
      reason:
        'not_configured' | 'disabled' | 'provider_rejected' | 'network_error' | 'invalid_message';
    };

type NotificationSettingsDoc = Doc<'userNotificationSettings'>;
type SettingsContext = QueryCtx | MutationCtx;

async function getTelegramSettings(
  ctx: SettingsContext,
  userId: Id<'users'>
): Promise<NotificationSettingsDoc | null> {
  return await ctx.db
    .query('userNotificationSettings')
    .withIndex('by_user_provider', (q) => q.eq('userId', userId).eq('provider', 'telegram'))
    .first();
}

function redactSettings(settings: NotificationSettingsDoc): NotificationSettings {
  return {
    provider: settings.provider,
    enabled: settings.enabled,
    channelId: settings.channelId,
    hasBotToken: settings.botToken.length > 0,
    ...(settings.lastTestedAt !== undefined ? { lastTestedAt: settings.lastTestedAt } : {}),
    ...(settings.lastTestSucceeded !== undefined
      ? { lastTestSucceeded: settings.lastTestSucceeded }
      : {}),
  };
}

function validateRequiredString(value: string, code: string, message: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ConvexError({ code, message });
  }
  return trimmed;
}

function requireSavedSettings(settings: NotificationSettingsDoc | null): NotificationSettingsDoc {
  if (!settings) {
    throw new ConvexError({
      code: 'SAVE_FAILED',
      message: 'Notification settings were not saved.',
    });
  }
  return settings;
}

function validateBotToken(existing: NotificationSettingsDoc | null, botToken: string): void {
  if (!existing && !botToken) {
    throw new ConvexError({
      code: 'INVALID_BOT_TOKEN',
      message: 'A Telegram bot token is required for a new configuration.',
    });
  }
}

async function persistTelegramSettings(
  ctx: MutationCtx,
  userId: Id<'users'>,
  existing: NotificationSettingsDoc | null,
  channelId: string,
  botToken: string,
  enabled: boolean
): Promise<void> {
  const now = Date.now();
  if (existing) {
    await ctx.db.patch('userNotificationSettings', existing._id, {
      channelId,
      enabled,
      updatedAt: now,
      ...(botToken ? { botToken } : {}),
    });
    return;
  }

  await ctx.db.insert('userNotificationSettings', {
    userId,
    provider: 'telegram',
    enabled,
    channelId,
    botToken,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Returns a safe validation reason for a notification message, or null when
 * the title/body can be sent through Telegram.
 */
export function getNotificationMessageError(title: string, body: string): string | null {
  const checks = [
    title.trim().length > 0,
    title.length <= NOTIFICATION_TITLE_MAX_LENGTH,
    body.trim().length > 0,
    body.length <= NOTIFICATION_BODY_MAX_LENGTH,
    `${title}\n\n${body}`.length <= NOTIFICATION_BODY_MAX_LENGTH,
  ];
  return checks.every(Boolean) ? null : 'invalid_message';
}

export const getSettings = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args): Promise<NotificationSettings | null> => {
    const userId = await requireAuthUserId(ctx, args);
    const settings = await getTelegramSettings(ctx, userId);
    return settings ? redactSettings(settings) : null;
  },
});

export const saveSettings = mutation({
  args: {
    ...SessionIdArg,
    channelId: v.string(),
    botToken: v.optional(v.string()),
    enabled: v.boolean(),
  },
  handler: async (ctx, args): Promise<NotificationSettings> => {
    const userId = await requireAuthUserId(ctx, args);
    const channelId = validateRequiredString(
      args.channelId,
      'INVALID_CHANNEL_ID',
      'A Telegram channel ID is required.'
    );
    const botToken = args.botToken?.trim() ?? '';
    const existing = await getTelegramSettings(ctx, userId);

    validateBotToken(existing, botToken);
    await persistTelegramSettings(ctx, userId, existing, channelId, botToken, args.enabled);

    return redactSettings(requireSavedSettings(await getTelegramSettings(ctx, userId)));
  },
});

export const removeSettings = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args): Promise<{ removed: boolean }> => {
    const userId = await requireAuthUserId(ctx, args);
    const settings = await getTelegramSettings(ctx, userId);
    if (!settings) {
      return { removed: false };
    }
    await ctx.db.delete('userNotificationSettings', settings._id);
    return { removed: true };
  },
});

export const getSettingsForDelivery = internalQuery({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args): Promise<NotificationSettingsDoc | null> => {
    return await getTelegramSettings(ctx, args.userId);
  },
});

export const getSettingsForSession = internalQuery({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args): Promise<NotificationSettingsDoc | null> => {
    const userId = await requireAuthUserId(ctx, args);
    return await getTelegramSettings(ctx, userId);
  },
});

export const recordTestResult = internalMutation({
  args: {
    userId: v.id('users'),
    succeeded: v.boolean(),
  },
  handler: async (ctx, args): Promise<void> => {
    const settings = await getTelegramSettings(ctx, args.userId);
    if (!settings) return;

    await ctx.db.patch('userNotificationSettings', settings._id, {
      lastTestedAt: Date.now(),
      lastTestSucceeded: args.succeeded,
    });
  },
});

/**
 * Backend code should call this integration point instead of reaching into
 * the Telegram action directly. Delivery is scheduled and provider failures
 * are returned by the action as structured, non-fatal results.
 */
export const triggerSystemNotification = internalMutation({
  args: {
    userId: v.id('users'),
    title: v.string(),
    body: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ scheduled: true } | { scheduled: false; reason: 'invalid_message' }> => {
    if (getNotificationMessageError(args.title, args.body)) {
      return { scheduled: false, reason: 'invalid_message' };
    }

    await ctx.scheduler.runAfter(0, internal.notifications.telegram.sendSystemNotification, {
      userId: args.userId,
      title: args.title.trim(),
      body: args.body.trim(),
    });
    return { scheduled: true };
  },
});
