# User-scoped Telegram notifications

The backend supports one Telegram notification configuration per user. This
slice provides the server-side persistence and delivery contract; the Settings
→ Notifications page is added separately.

## Telegram setup

1. Create a bot with Telegram's [BotFather](https://t.me/BotFather) and copy
   its bot token.
2. Add the bot to the target channel or group and grant it permission to post.
3. Enter the channel ID (for example, `-100...`) or username (for example,
   `@my_channel`) on the user Settings → Notifications page.

The current implementation is Telegram-only and user-scoped. It does not reuse
the historical system-wide or chatroom Telegram integration.

## Stored configuration and security

The configuration is stored in `userNotificationSettings`, keyed by user and
provider. Bot tokens are server-side values: settings queries return only
`hasBotToken`, never `botToken`; tokens are not rendered or logged. A blank
token on an update preserves the saved token. The Remove action deletes the
user's complete Telegram configuration.

The channel identifier is intentionally stored as a string so both numeric
Telegram IDs and `@channel_username` values are accepted. Telegram validates
whether the bot can post to the target when a test or delivery is sent.

## Connection testing and delivery

The connection test sends a fixed plain-text message identified as a Next
Convex test notification. It can test a disabled configuration, so credentials
can be verified before delivery is enabled. Only `lastTestedAt` and
`lastTestSucceeded` are recorded; provider error text is not persisted.

Normal system delivery honors `enabled`. It runs through a Node action with a
10-second request timeout and sends a JSON `sendMessage` request to Telegram.
The title is limited to 120 characters and the body to 4096 characters; the
combined plain-text message must also fit within Telegram's 4096-character
limit.

Backend code should call the internal scheduling mutation rather than calling
the Telegram action directly:

```ts
await ctx.runMutation(internal.notifications.triggerSystemNotification, {
  userId,
  title: 'Build completed',
  body: 'The production build finished successfully.',
});
```

Scheduling is non-fatal to the originating workflow. The delivery action
returns one of these structured outcomes:

- `{ sent: true }`
- `{ sent: false, reason: 'not_configured' }`
- `{ sent: false, reason: 'disabled' }`
- `{ sent: false, reason: 'provider_rejected' }`
- `{ sent: false, reason: 'network_error' }`
- `{ sent: false, reason: 'invalid_message' }`

Provider and network failures are sanitized before they reach callers; bot
tokens and request URLs are never included in errors or logs.
