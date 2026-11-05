export type ThirdPartyProvider = {
  id: 'telegram';
  name: 'Telegram';
  description: string;
  configureHref: '/app/settings/notifications/third-party/telegram';
};

export const THIRD_PARTY_PROVIDERS: readonly ThirdPartyProvider[] = [
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Send system notifications to a Telegram channel or group.',
    configureHref: '/app/settings/notifications/third-party/telegram',
  },
];
