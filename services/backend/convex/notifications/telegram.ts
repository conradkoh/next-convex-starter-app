'use node';

import { v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';

import { internal } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { action, internalAction } from '../_generated/server';
import { getNotificationMessageError, type NotificationDeliveryResult } from '../notifications';

type TelegramSettings = {
  userId: Id<'users'>;
  channelId: string;
  botToken: string;
  enabled: boolean;
};

type TelegramResponse = {
  ok?: unknown;
  description?: unknown;
};

function isTelegramResponse(value: unknown): value is TelegramResponse {
  return typeof value === 'object' && value !== null;
}

async function telegramResponseSucceeded(response: Response): Promise<boolean> {
  if (!response.ok) return false;

  try {
    const payload: unknown = await response.json();
    return isTelegramResponse(payload) && payload.ok === true;
  } catch {
    return false;
  }
}

/**
 * Sends one plain-text message through Telegram. This is shared by the
 * internal delivery action and the user-triggered connection test so timeout,
 * validation, and error sanitization stay identical.
 */
async function sendTelegramMessage(
  settings: TelegramSettings,
  title: string,
  body: string
): Promise<NotificationDeliveryResult> {
  if (getNotificationMessageError(title, body)) {
    return { sent: false, reason: 'invalid_message' };
  }

  const text = `${title.trim()}\n\n${body.trim()}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${settings.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.channelId,
        text,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    return (await telegramResponseSucceeded(response))
      ? { sent: true }
      : { sent: false, reason: 'provider_rejected' };
  } catch {
    return { sent: false, reason: 'network_error' };
  }
}

export const sendSystemNotification = internalAction({
  args: {
    userId: v.id('users'),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args): Promise<NotificationDeliveryResult> => {
    if (getNotificationMessageError(args.title, args.body)) {
      return { sent: false, reason: 'invalid_message' };
    }

    const settings = await ctx.runQuery(internal.notifications.getSettingsForDelivery, {
      userId: args.userId,
    });
    if (!settings) {
      return { sent: false, reason: 'not_configured' };
    }
    if (!settings.enabled) {
      return { sent: false, reason: 'disabled' };
    }

    return await sendTelegramMessage(settings, args.title, args.body);
  },
});

function testResultMessage(result: NotificationDeliveryResult): string {
  if (result.sent) return 'Test notification sent successfully.';
  const messages: Record<Exclude<NotificationDeliveryResult, { sent: true }>['reason'], string> = {
    provider_rejected:
      'Telegram rejected the test notification. Check the bot token and channel ID.',
    network_error: 'Unable to reach Telegram. Try again later.',
    invalid_message: 'The test notification message is invalid.',
    disabled: 'The Telegram configuration is disabled.',
    not_configured: 'Telegram notifications are not configured.',
  };
  return messages[result.reason];
}

export const testConnection = action({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    let settings: TelegramSettings | null;
    try {
      settings = await ctx.runQuery(internal.notifications.getSettingsForSession, args);
    } catch {
      return { success: false, message: 'Unable to identify the current user session.' };
    }

    if (!settings) {
      return { success: false, message: 'Telegram notifications are not configured.' };
    }

    // Connection tests intentionally bypass `enabled` so credentials can be
    // validated before the user turns on normal delivery.
    const result = await sendTelegramMessage(
      settings,
      'Next Convex test notification',
      'This is a test notification from Next Convex.'
    );
    await ctx.runMutation(internal.notifications.recordTestResult, {
      userId: settings.userId,
      succeeded: result.sent,
    });

    return { success: result.sent, message: testResultMessage(result) };
  },
});
